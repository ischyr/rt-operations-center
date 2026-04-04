const { spawn } = require('child_process');
const mongoose  = require('mongoose');

// ── Schema ────────────────────────────────────────────────────────────────────
const ScanSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  username:     { type: String, required: true },
  found:        [{ platform: String, url: String }],
  notFound:     [String],
  total:        { type: Number, default: 0 },
  status:       { type: String, enum: ['done', 'error'], default: 'done' },
  error:        String,
  duration:     Number, // seconds
}, { timestamps: true });

const Scan = mongoose.models.SocialMediaScan
  || mongoose.model('SocialMediaScan', ScanSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
const sse = (res, data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

// ── scan — streams Sherlock Docker output via SSE ─────────────────────────────
exports.scan = async (req, res) => {
  const { engagementId } = req.params;
  const { username }     = req.body;

  if (!username?.trim())
    return res.status(400).json({ error: 'Username is required' });

  // SSE headers
  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const found    = [];
  const notFound = [];
  const startedAt = Date.now();

  sse(res, { type: 'start', username: username.trim() });

  let docker;
  try {
    docker = spawn('docker', [
      'run', '--rm',
      'sherlock/sherlock',
      username.trim(),
      '--timeout', '15',
      '--print-found',
    ]);
  } catch (err) {
    sse(res, { type: 'error', message: 'Failed to start Docker: ' + err.message });
    res.end();
    return;
  }

  let buf = '';

  const processLine = (line) => {
    const t = line.trim();
    if (!t) return;

    if (t.startsWith('[+]')) {
      const m = t.match(/\[\+\]\s+(.+?):\s+(https?:\/\/.+)/);
      if (m) {
        const entry = { platform: m[1].trim(), url: m[2].trim() };
        found.push(entry);
        sse(res, { type: 'found', ...entry });
      }
    } else if (t.startsWith('[-]')) {
      const m = t.match(/\[-\]\s+(.+?):/);
      if (m) {
        const platform = m[1].trim();
        notFound.push(platform);
        sse(res, { type: 'not_found', platform });
      }
    } else if (t.startsWith('[*]')) {
      sse(res, { type: 'info', message: t.replace(/^\[\*\]\s*/, '') });
    }
  };

  docker.stdout.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach(processLine);
  });

  docker.stderr.on('data', (chunk) => {
    // Sherlock sometimes prints progress to stderr — surface as info
    chunk.toString().split('\n').forEach(l => {
      if (l.trim()) sse(res, { type: 'info', message: l.trim() });
    });
  });

  docker.on('error', (err) => {
    sse(res, { type: 'error', message: err.message });
    res.end();
  });

  docker.on('close', async (code) => {
    // flush remaining buffer
    if (buf.trim()) processLine(buf);

    const duration = Math.round((Date.now() - startedAt) / 1000);

    try {
      await Scan.create({
        engagementId,
        username:  username.trim(),
        found,
        notFound,
        total:     found.length + notFound.length,
        status:    code === 0 ? 'done' : 'error',
        duration,
      });
    } catch (_) {}

    sse(res, { type: 'done', found: found.length, total: found.length + notFound.length, duration });
    res.end();
  });

  req.on('close', () => {
    try { docker.kill('SIGTERM'); } catch (_) {}
  });
};

// ── getHistory ────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  const { engagementId } = req.params;
  try {
    const scans = await Scan.find({ engagementId })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(scans);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteScan ────────────────────────────────────────────────────────────────
exports.deleteScan = async (req, res) => {
  try {
    await Scan.findByIdAndDelete(req.params.scanId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
