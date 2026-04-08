const { spawn }  = require('child_process');
const mongoose   = require('mongoose');
const os         = require('os');
const fs         = require('fs');
const path       = require('path');

// ── Schema ─────────────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({
  url:        String,
  finalUrl:   String,   // post-redirect URL from gowitness
  statusCode: Number,
  title:      String,
  screenshot: String,   // base64-encoded PNG
  failed:     { type: Boolean, default: false },
}, { _id: false });

const scanSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  domains:      [String],
  results:      [resultSchema],
  status:       { type: String, enum: ['scanning', 'done', 'error'], default: 'scanning' },
  error:        String,
  duration:     Number,
  createdAt:    { type: Date, default: Date.now },
});

const Scan = mongoose.model('DomainFlyover', scanSchema);

// ── In-memory live state ───────────────────────────────────────────────────────
// scanId → { results, rawLines, docker, containerName, tmpFile, screenshotDir, watcher }
const liveScans = new Map();

// ── startScan ──────────────────────────────────────────────────────────────────
exports.startScan = async (req, res) => {
  const { engagementId } = req.params;
  const { domains } = req.body;

  const cleaned = (domains || []).map(d => d.trim()).filter(Boolean);
  if (!cleaned.length) return res.status(400).json({ error: 'No domains provided' });

  try {
    const doc = await Scan.create({ engagementId, domains: cleaned, results: [], status: 'scanning' });
    const scanId        = doc._id.toString();
    const containerName = `gowitness-flyover-${scanId}`;

    liveScans.set(scanId, {
      results: [], rawLines: [],
      docker: null, containerName,
      tmpFile: null, screenshotDir: null, watcher: null,
    });

    runScan(scanId, cleaned, containerName);
    res.json({ scanId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Ensure URL has a scheme ────────────────────────────────────────────────────
function withScheme(domain) {
  if (/^https?:\/\//i.test(domain)) return domain;
  return `https://${domain}`;
}

// ── Reconstruct URL from gowitness screenshot filename ────────────────────────
// gowitness v3 replaces every special char with '-', so '://' → '---' and ':' → '-'
// e.g.  https---example.com.png        → https://example.com
//       https---example.com-443.png    → https://example.com:443
//       https---192.168.1.1-8080.png   → https://192.168.1.1:8080
function filenameToUrl(filename) {
  const base = filename.replace(/\.(png|jpe?g)$/i, '');
  // scheme---host[-port]
  const m = base.match(/^(https?)---(.+)$/i);
  if (!m) return '';
  const scheme = m[1].toLowerCase();
  const rest   = m[2];
  // Port: trailing -<digits> where digits are a valid port number
  const portMatch = rest.match(/^(.+)-(\d{1,5})$/);
  if (portMatch) {
    return `${scheme}://${portMatch[1]}:${portMatch[2]}`;
  }
  return `${scheme}://${rest}`;
}

// ── Guess filename gowitness would use for a URL ───────────────────────────────
function guessFilename(rawUrl) {
  try {
    // gowitness: replace :// → ---, then any remaining : or / → -
    const sanitized = rawUrl.replace('://', '---').replace(/[:/]/g, '-');
    return `${sanitized}.png`;
  } catch (_) {
    return '';
  }
}

// ── Parse gowitness structured log line for URL/status/title/file ─────────────
// gowitness uses key=value text format:  key="value with spaces"  or  key=value
function parseLogMeta(line, metaMap) {
  const kv   = {};
  const re   = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    kv[match[1]] = match[2] !== undefined ? match[2] : match[3];
  }

  const url = kv.url || kv.URL;
  if (!url) return;

  const filename =
    (kv.file        ? path.basename(kv.file)            : '') ||
    (kv.screenshot  ? path.basename(kv.screenshot)       : '') ||
    guessFilename(url);

  if (!filename) return;

  const existing = metaMap.get(filename) || {};
  metaMap.set(filename, {
    url,
    statusCode: parseInt(kv.status_code || kv.response_code || kv.status || existing.statusCode || '0', 10) || 0,
    title:      kv.title || existing.title || '',
    finalUrl:   kv.final_url || kv.finalUrl || existing.finalUrl || '',
  });
}

// ── Background runner ──────────────────────────────────────────────────────────
function runScan(scanId, domains, containerName) {
  const state = liveScans.get(scanId);
  if (!state) return;

  const startedAt = Date.now();

  // Ensure every entry is a full URL
  const urls = domains.map(withScheme);

  // Temp files / directories
  const tmpFile      = path.join(os.tmpdir(), `flyover-${scanId}.txt`);
  const screenshotDir = path.join(os.tmpdir(), `flyover-${scanId}-shots`);

  try {
    fs.writeFileSync(tmpFile, urls.join('\n') + '\n', 'utf8');
    fs.mkdirSync(screenshotDir, { recursive: true });
  } catch (err) {
    liveScans.delete(scanId);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: `Cannot prepare temp dirs: ${err.message}` }).catch(() => {});
    return;
  }

  state.tmpFile      = tmpFile;
  state.screenshotDir = screenshotDir;

  // metaMap: screenshotFilename → { url, statusCode, title, finalUrl }
  const metaMap  = new Map();
  // Filenames already processed by the watcher (avoid double-processing)
  const processed = new Set();

  // ── Watch screenshot directory for live PNG streaming ────────────────────────
  try {
    const watcher = fs.watch(screenshotDir, (event, filename) => {
      if (!filename || !/\.(png|jpe?g)$/i.test(filename) || processed.has(filename)) return;
      processed.add(filename);

      const fpath = path.join(screenshotDir, filename);

      // Small delay so the file is fully flushed before we read it
      setTimeout(() => {
        try {
          if (!fs.existsSync(fpath)) return;
          // Skip gowitness.jsonl and other non-image files that might sneak through
          if (!/\.(png|jpe?g)$/i.test(filename)) return;

          const stats = fs.statSync(fpath);
          if (stats.size === 0) return;

          const b64  = fs.readFileSync(fpath).toString('base64');
          const meta = metaMap.get(filename) || {};
          const url  = meta.url || filenameToUrl(filename);
          if (!url) return;

          if (state.results.find(r => r.url === url)) return; // already present

          const entry = {
            url,
            finalUrl:   meta.finalUrl   || '',
            statusCode: meta.statusCode || 0,
            title:      meta.title      || '',
            screenshot: b64,
            failed:     false,
          };

          state.results.push(entry);
          state.rawLines.push(`[captured] ${url}`);
          Scan.findByIdAndUpdate(scanId, { $push: { results: entry } }).catch(() => {});
        } catch (_) {}
      }, 700);
    });

    state.watcher = watcher;
  } catch (_) {
    // fs.watch unavailable — will fall back to post-scan directory read
  }

  // Docker Desktop on Windows needs forward slashes with drive letter
  const dockerMountSrc   = tmpFile.replace(/\\/g, '/');
  const dockerMountShots = screenshotDir.replace(/\\/g, '/');

  // ── Spawn Docker ──────────────────────────────────────────────────────────────
  let docker;
  try {
    docker = spawn('docker', [
      'run', '--rm',
      '--name', containerName,
      '-v', `${dockerMountSrc}:/targets.txt:ro`,
      '-v', `${dockerMountShots}:/screenshots`,
      'leonjza/gowitness',
      'gowitness',         // image ENTRYPOINT is dumb-init, binary must be explicit
      'scan', 'file',
      '-f', '/targets.txt',
      '--screenshot-path', '/screenshots',
      '--threads',         '3',
    ]);
  } catch (err) {
    cleanupState(state);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }).catch(() => {});
    return;
  }

  state.docker = docker;

  const cmdPreview = `docker run --rm --name ${containerName} -v ${dockerMountSrc}:/targets.txt:ro -v ${dockerMountShots}:/screenshots leonjza/gowitness gowitness scan file -f /targets.txt --screenshot-path /screenshots --threads 3`;
  state.rawLines.push(`[cmd] ${cmdPreview}`);
  console.log('[domain-flyover] Running:', cmdPreview);

  let stderrBuf = '';

  // gowitness writes structured log lines to stderr
  docker.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuf += text;
    for (const l of text.split('\n')) {
      const t = l.trim();
      if (!t) continue;
      state.rawLines.push(t);
      parseLogMeta(t, metaMap);
    }
  });

  // stdout may carry --writer-stdout results or JSON if piped; parse opportunistically
  docker.stdout.on('data', (chunk) => {
    for (const l of chunk.toString().split('\n')) {
      const t = l.trim();
      if (!t) continue;
      state.rawLines.push(t);
      parseLogMeta(t, metaMap);
    }
  });

  // ── On exit: post-scan fallback read ─────────────────────────────────────────
  docker.on('close', async (code) => {
    // Stop the directory watcher
    if (state.watcher) {
      try { state.watcher.close(); } catch (_) {}
      state.watcher = null;
    }

    // On Windows + Docker Desktop (WSL2 backend) the container's writes to a
    // bind-mounted Windows directory are not immediately visible to the host
    // process after the container exits.  Wait briefly for the FS to sync.
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ── Debug: log directory contents so we can see what gowitness produced ──
    console.log(`[domain-flyover] exit code ${code} | screenshotDir: ${screenshotDir}`);
    try {
      const allFiles = fs.readdirSync(screenshotDir);
      console.log(`[domain-flyover] files in dir (${allFiles.length}):`, allFiles);
    } catch (e) {
      console.log(`[domain-flyover] cannot read screenshotDir: ${e.message}`);
    }

    // 1. Parse any JSONL gowitness may have written (gowitness db default or --write-jsonl)
    //    Try several common filenames.
    for (const jsonlName of ['results.jsonl', 'gowitness.jsonl', 'gowitness.db']) {
      const jsonlPath = path.join(screenshotDir, jsonlName);
      if (!fs.existsSync(jsonlPath)) continue;
      console.log(`[domain-flyover] found metadata file: ${jsonlName}`);
      try {
        const lines = fs.readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            const url  = obj.url || obj.URL || '';
            if (!url) continue;
            const fname = obj.screenshot_path ? path.basename(obj.screenshot_path) : guessFilename(url);
            metaMap.set(fname, {
              url,
              statusCode: obj.response_code || obj.status_code || obj.Status || 0,
              title:      obj.title || obj.Title || '',
              finalUrl:   obj.final_url || obj.finalUrl || '',
            });
          } catch (_) {}
        }
      } catch (_) {}
      break; // only need one
    }

    // 2. Read every image file in the screenshots directory
    try {
      const files = fs.readdirSync(screenshotDir).filter(f => /\.(png|jpe?g)$/i.test(f));
      console.log(`[domain-flyover] image files found: ${files.length}`, files);

      for (const filename of files) {
        if (processed.has(filename)) {
          console.log(`[domain-flyover] already processed: ${filename}`);
          continue;
        }
        processed.add(filename);
        const fpath = path.join(screenshotDir, filename);
        try {
          const stats = fs.statSync(fpath);
          if (stats.size === 0) { console.log(`[domain-flyover] empty file: ${filename}`); continue; }

          const b64  = fs.readFileSync(fpath).toString('base64');
          const meta = metaMap.get(filename) || {};
          const url  = meta.url || filenameToUrl(filename);
          console.log(`[domain-flyover] processing ${filename} → url: ${url}`);
          if (!url) continue;
          if (state.results.find(r => r.url === url)) continue;

          const entry = {
            url,
            finalUrl:   meta.finalUrl   || '',
            statusCode: meta.statusCode || 0,
            title:      meta.title      || '',
            screenshot: b64,
            failed:     false,
          };
          state.results.push(entry);
          Scan.findByIdAndUpdate(scanId, { $push: { results: entry } }).catch(() => {});
        } catch (e) {
          console.log(`[domain-flyover] error reading ${filename}: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`[domain-flyover] error reading screenshot dir: ${e.message}`);
    }

    cleanupState(state);

    const cancelled = !liveScans.has(scanId);
    if (!cancelled) {
      const duration = Math.round((Date.now() - startedAt) / 1000);
      const failed   = code !== 0 && code !== null;
      const status   = failed ? 'error' : 'done';
      const errMsg   = failed
        ? (stderrBuf.trim().slice(0, 600) || `gowitness exited with code ${code}`)
        : undefined;
      try {
        await Scan.findByIdAndUpdate(scanId, { status, duration, ...(errMsg && { error: errMsg }) });
      } catch (_) {}
      liveScans.delete(scanId);
    }
  });

  docker.on('error', async (err) => {
    if (state.watcher) { try { state.watcher.close(); } catch (_) {} state.watcher = null; }
    cleanupState(state);
    state.rawLines.push(`[error] ${err.message}`);
    try { await Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }); } catch (_) {}
    liveScans.delete(scanId);
  });
}

// ── Cleanup files ─────────────────────────────────────────────────────────────
function cleanupState(state) {
  if (state.tmpFile) { try { fs.unlinkSync(state.tmpFile); } catch (_) {} state.tmpFile = null; }
  if (state.screenshotDir) {
    try { fs.rmSync(state.screenshotDir, { recursive: true, force: true }); } catch (_) {}
    state.screenshotDir = null;
  }
}

// ── Kill container ────────────────────────────────────────────────────────────
function killContainer(live) {
  if (!live) return;
  if (live.watcher)   { try { live.watcher.close();            } catch (_) {} }
  if (live.docker)    { try { live.docker.kill('SIGKILL');     } catch (_) {} }
  if (live.containerName) {
    try { spawn('docker', ['kill', live.containerName], { detached: true }).unref(); } catch (_) {}
  }
  cleanupState(live);
}

// ── getScan ────────────────────────────────────────────────────────────────────
exports.getScan = async (req, res) => {
  const { scanId } = req.params;
  const live = liveScans.get(scanId);

  try {
    const scan = await Scan.findById(scanId).lean();
    if (!scan) return res.status(404).json({ error: 'Not found' });

    if (live) {
      return res.json({
        ...scan,
        results:    live.results,
        liveOutput: live.rawLines.join('\n'),
        status:     'scanning',
      });
    }

    res.json(scan);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── cancelScan ────────────────────────────────────────────────────────────────
exports.cancelScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try { await Scan.findByIdAndUpdate(req.params.scanId, { status: 'error', error: 'Cancelled' }); } catch (_) {}
  res.json({ ok: true });
};

// ── getHistory ────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const scans = await Scan.find({ engagementId: req.params.engagementId })
      .sort({ createdAt: -1 }).limit(50)
      .select('-results').lean();
    res.json(scans);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteScan ────────────────────────────────────────────────────────────────
exports.deleteScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try {
    await Scan.findByIdAndDelete(req.params.scanId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
