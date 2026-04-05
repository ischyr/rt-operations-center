const { spawn }  = require('child_process');
const mongoose   = require('mongoose');
const os         = require('os');
const fs         = require('fs');
const path       = require('path');

// ── Schema ─────────────────────────────────────────────────────────────────────
const resultSchema = new mongoose.Schema({
  url:        String,
  statusCode: Number,
  title:      String,
  tech:       [String],
  webserver:  String,
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

const Scan = mongoose.model('WebserverEnum', scanSchema);

// ── In-memory live state ───────────────────────────────────────────────────────
const liveScans = new Map(); // scanId → { results, rawLines, docker, containerName, tmpFile }

// ── startScan ──────────────────────────────────────────────────────────────────
exports.startScan = async (req, res) => {
  const { engagementId } = req.params;
  const { domains } = req.body;

  const cleaned = (domains || []).map(d => d.trim()).filter(Boolean);
  if (!cleaned.length) return res.status(400).json({ error: 'No domains provided' });

  try {
    const doc = await Scan.create({ engagementId, domains: cleaned, results: [], status: 'scanning' });
    const scanId        = doc._id.toString();
    const containerName = `httpx-${scanId}`;

    liveScans.set(scanId, { results: [], rawLines: [], docker: null, containerName, tmpFile: null });

    runScan(scanId, cleaned, containerName);

    res.json({ scanId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Background runner ──────────────────────────────────────────────────────────
function runScan(scanId, domains, containerName) {
  const state = liveScans.get(scanId);
  if (!state) return;

  const startedAt = Date.now();

  // Write domains to a temp file and mount it into Docker.
  // This is far more reliable than piping via stdin across platforms.
  const tmpFile = path.join(os.tmpdir(), `httpx-${scanId}.txt`);
  try {
    fs.writeFileSync(tmpFile, domains.join('\n') + '\n', 'utf8');
  } catch (err) {
    liveScans.delete(scanId);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: `Cannot write temp file: ${err.message}` }).catch(() => {});
    return;
  }
  state.tmpFile = tmpFile;

  // Docker Desktop on Windows needs forward slashes but keeps the drive letter (C:/path/...)
  const dockerMountSrc = tmpFile.replace(/\\/g, '/');

  let docker;
  try {
    docker = spawn('docker', [
      'run', '--rm',
      '--name', containerName,
      '-v', `${dockerMountSrc}:/targets.txt`,
      'projectdiscovery/httpx',
      '-status-code',
      '-title',
      '-tech-detect',
      '-list', '/targets.txt',
    ]);
  } catch (err) {
    cleanup(scanId, tmpFile);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }).catch(() => {});
    return;
  }

  state.docker = docker;
  const cmdPreview = `docker run --rm --name ${containerName} -v ${dockerMountSrc}:/targets.txt projectdiscovery/httpx -status-code -title -tech-detect -list /targets.txt`;
  state.rawLines.push(`[cmd] ${cmdPreview}`);
  console.log('[webserver-enum] Running:', cmdPreview);

  let buf       = '';
  let stderrBuf = '';

  docker.stdout.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop(); // keep incomplete line

    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      state.rawLines.push(t);

      // Strip ANSI color codes httpx adds by default
      // eslint-disable-next-line no-control-regex
      const clean = t.replace(/\x1b\[[0-9;]*[mGKHFABCDsu]/g, '').trim();
      if (!clean) continue;

      // httpx text output: https://example.com [200] [Page Title] [Nginx,PHP]
      const m = clean.match(/^(\S+)\s+\[(\d+)\](?:\s+\[([^\]]*)\])?(?:\s+\[([^\]]*)\])?/);
      if (m) {
        const entry = {
          url:        m[1],
          statusCode: parseInt(m[2], 10),
          title:      (m[3] || '').trim(),
          tech:       (m[4] || '').split(',').map(s => s.trim()).filter(Boolean),
          webserver:  '',
          failed:     false,
        };
        state.results.push(entry);
        Scan.findByIdAndUpdate(scanId, { $push: { results: entry } }).catch(() => {});
      }
    }
  });

  docker.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBuf += text;
    text.split('\n').forEach(l => {
      const t = l.trim();
      if (t) state.rawLines.push(`[stderr] ${t}`);
    });
  });

  docker.on('close', async (code) => {
    cleanup(scanId, tmpFile);
    const cancelled = !liveScans.has(scanId); // removed by cancelScan already
    if (!cancelled) {
      const duration = Math.round((Date.now() - startedAt) / 1000);
      // Exit code 0 = clean finish. null = killed. Any other = error.
      const failed  = code !== 0 && code !== null;
      const status  = failed ? 'error' : 'done';
      const errMsg  = failed
        ? (stderrBuf.trim().slice(0, 600) || `httpx exited with code ${code}`)
        : undefined;
      try {
        await Scan.findByIdAndUpdate(scanId, {
          status, duration, ...(errMsg && { error: errMsg }),
        });
      } catch (_) {}
      liveScans.delete(scanId);
    }
  });

  docker.on('error', async (err) => {
    cleanup(scanId, tmpFile);
    state.rawLines.push(`[error] ${err.message}`);
    try { await Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }); } catch (_) {}
    liveScans.delete(scanId);
  });
}

// ── Cleanup temp file ─────────────────────────────────────────────────────────
function cleanup(scanId, tmpFile) {
  if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch (_) {} }
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

// ── Kill helper ────────────────────────────────────────────────────────────────
function killContainer(live) {
  if (!live) return;
  if (live.docker) { try { live.docker.kill('SIGKILL'); } catch (_) {} }
  if (live.containerName) {
    try { spawn('docker', ['kill', live.containerName], { detached: true }).unref(); } catch (_) {}
  }
  if (live.tmpFile) { try { fs.unlinkSync(live.tmpFile); } catch (_) {} }
}

// ── cancelScan ─────────────────────────────────────────────────────────────────
exports.cancelScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try { await Scan.findByIdAndUpdate(req.params.scanId, { status: 'error', error: 'Cancelled' }); } catch (_) {}
  res.json({ ok: true });
};

// ── getHistory ─────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const scans = await Scan.find({ engagementId: req.params.engagementId })
      .sort({ createdAt: -1 }).limit(50)
      .select('-results').lean();
    res.json(scans);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteScan ─────────────────────────────────────────────────────────────────
exports.deleteScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try {
    await Scan.findByIdAndDelete(req.params.scanId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
