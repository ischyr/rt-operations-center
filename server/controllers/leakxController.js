const https      = require('https');
const Engagement = require('../models/Engagement');

// ── Proxy call to LeakIX (follows up to 5 redirects) ─────────────────────────
const callLeakIX = (domain, apiKey, redirectCount = 0) => new Promise((resolve, reject) => {
  if (redirectCount > 5) return reject(new Error('Too many redirects'));
  const options = {
    hostname: 'leakix.net',
    path:     `/domain/${encodeURIComponent(domain.trim())}`,
    method:   'GET',
    headers:  { accept: 'application/json', 'api-key': apiKey },
  };
  const req = https.request(options, (res) => {
    // Follow redirects
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume(); // drain the body
      const loc = res.headers.location;
      // Only follow same-host redirects to avoid leaking the API key
      try {
        const url = new URL(loc, `https://leakix.net`);
        if (url.hostname !== 'leakix.net') return resolve({ statusCode: res.statusCode, body: {} });
        const nextOptions = {
          hostname: url.hostname,
          path:     url.pathname + url.search,
          method:   'GET',
          headers:  { accept: 'application/json', 'api-key': apiKey },
        };
        const redir = https.request(nextOptions, (res2) => {
          let raw = '';
          res2.on('data', chunk => { raw += chunk; });
          res2.on('end', () => {
            try   { resolve({ statusCode: res2.statusCode, body: JSON.parse(raw) }); }
            catch { resolve({ statusCode: res2.statusCode, body: raw }); }
          });
        });
        redir.on('error', reject);
        redir.setTimeout(15000, () => redir.destroy(new Error('LeakIX request timed out')));
        redir.end();
      } catch { resolve({ statusCode: res.statusCode, body: {} }); }
      return;
    }
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      try   { resolve({ statusCode: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ statusCode: res.statusCode, body: raw }); }
    });
  });
  req.on('error', reject);
  req.setTimeout(15000, () => { req.destroy(new Error('LeakIX request timed out')); });
  req.end();
});

// ── POST /api/leakx/:engId/scan ───────────────────────────────────────────────
exports.scan = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const { domain, apiKey, saveKey } = req.body;
    if (!domain?.trim()) return res.status(400).json({ message: 'Domain is required.' });
    if (!apiKey?.trim()) return res.status(400).json({ message: 'API key is required.' });

    const result = await callLeakIX(domain.trim(), apiKey.trim());

    if (result.statusCode === 401) return res.status(401).json({ message: 'Invalid API key.' });
    if (result.statusCode === 429) return res.status(429).json({ message: 'LeakIX rate limit reached.' });
    if (result.statusCode !== 200) return res.status(502).json({ message: `LeakIX returned HTTP ${result.statusCode}.` });

    // Save or update existing scan for this domain
    const existing = eng.leakxScans.find(s => s.domain.toLowerCase() === domain.trim().toLowerCase());
    if (existing) {
      existing.data              = result.body;
      existing.scannedBy         = String(req.user._id);
      existing.scannedByCallsign = req.user.callsign || '';
    } else {
      eng.leakxScans.push({
        domain:            domain.trim().toLowerCase(),
        data:              result.body,
        scannedBy:         String(req.user._id),
        scannedByCallsign: req.user.callsign || '',
      });
    }

    if (saveKey) {
      eng.leakxConfig = { ...(eng.leakxConfig || {}), apiKey: apiKey.trim() };
    }

    await eng.save();

    const saved = eng.leakxScans.find(s => s.domain.toLowerCase() === domain.trim().toLowerCase());
    res.json(saved);
  } catch (err) {
    console.error('[leakx] scan error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ── DELETE /api/leakx/:engId/scans/:scanId ────────────────────────────────────
exports.deleteScan = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    eng.leakxScans = eng.leakxScans.filter(s => String(s._id) !== req.params.scanId);
    await eng.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
