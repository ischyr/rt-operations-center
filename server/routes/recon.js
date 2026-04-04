const router  = require('express').Router();
const https   = require('https');
const { protect } = require('../middleware/authMiddleware');

const mongoose = require('mongoose');
const reconCacheSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  domain:       { type: String, required: true },
  results:      { type: mongoose.Schema.Types.Mixed, default: {} },
  fetchedAt:    { type: String },
}, { timestamps: true });
reconCacheSchema.index({ engagementId: 1, domain: 1 }, { unique: true });
const ReconCache = mongoose.models.ReconCache || mongoose.model('ReconCache', reconCacheSchema);

// ── Helper — fetch JSON over HTTPS ───────────────────────────────────────────
function fetchJSON(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    https.get({
      hostname: opts.hostname,
      path:     opts.pathname + opts.search,
      headers:  { 'User-Agent': 'RedTeamOpsCenter/1.0', Accept: 'application/json', ...extraHeaders },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Non-JSON response')); }
      });
    }).on('error', reject);
  });
}

// ── DNS records via Google DoH ───────────────────────────────────────────────
// GET /api/recon/dns?domain=example.com&type=A
router.get('/dns', protect, async (req, res) => {
  const { domain, type = 'A' } = req.query;
  if (!domain) return res.status(400).json({ message: 'domain required' });
  try {
    const data = await fetchJSON(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
    );
    res.json(data);
  } catch (err) {
    res.status(502).json({ message: 'DNS lookup failed', error: err.message });
  }
});

// ── WHOIS/Registration via RDAP ──────────────────────────────────────────────
// GET /api/recon/whois?domain=example.com
router.get('/whois', protect, async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ message: 'domain required' });
  try {
    const data = await fetchJSON(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
    res.json(data);
  } catch {
    // fallback: try IANA rdap bootstrap
    try {
      const boot = await fetchJSON(`https://rdap.iana.org/domain/${encodeURIComponent(domain)}`);
      res.json(boot);
    } catch (err2) {
      res.status(502).json({ message: 'Whois lookup failed', error: err2.message });
    }
  }
});

// ── ASN lookup via ip-api.com (resolve A first, then ASN) ───────────────────
// GET /api/recon/asn?domain=example.com
router.get('/asn', protect, async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ message: 'domain required' });
  try {
    // Resolve A record first
    const dns = await fetchJSON(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`
    );
    const ip = dns?.Answer?.[0]?.data;
    if (!ip) return res.status(200).json({ ip: null, asn: null, message: 'No A record found' });

    // Look up ASN
    const asn = await fetchJSON(`https://api.iptoasn.com/v1/as/ip/${ip}`);
    res.json({ ip, ...asn });
  } catch (err) {
    res.status(502).json({ message: 'ASN lookup failed', error: err.message });
  }
});

// ── Certificate transparency via crt.sh ─────────────────────────────────────
// GET /api/recon/certs?domain=example.com
router.get('/certs', protect, async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ message: 'domain required' });
  try {
    const data = await fetchJSON(
      `https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`
    );
    // Deduplicate by common_name + issuer
    const seen = new Set();
    const unique = (Array.isArray(data) ? data : []).filter(c => {
      const key = `${c.common_name}|${c.issuer_name}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    res.json(unique.slice(0, 100));
  } catch (err) {
    res.status(502).json({ message: 'Certificate lookup failed', error: err.message });
  }
});

// ── Batch domain availability check ─────────────────────────────────────────
// POST /api/recon/availability  body: { domains: ['foo.com', ...] }
// Returns: [{ domain, available }]
const dnsPromises = require('dns').promises;

const checkOne = (domain) => new Promise((resolve) => {
  const timer = setTimeout(() => resolve({ domain, available: null }), 3000);
  dnsPromises.resolve(domain, 'A')
    .then(() => { clearTimeout(timer); resolve({ domain, available: false }); }) // resolved = taken
    .catch((err) => {
      clearTimeout(timer);
      // ENOTFOUND = NXDOMAIN = domain not registered = available
      resolve({ domain, available: err.code === 'ENOTFOUND' ? true : null });
    });
});

router.post('/availability', protect, async (req, res) => {
  const { domains } = req.body;
  if (!Array.isArray(domains) || domains.length === 0)
    return res.status(400).json({ message: 'domains array required' });

  const results = await Promise.all(domains.slice(0, 200).map(checkOne));
  res.json(results);
});

// ── Recon cache (MongoDB-backed, shared across operators) ────────────────────

// GET /api/recon/cache?engagementId=  — return all cached results as { [domain]: results }
router.get('/cache', protect, async (req, res) => {
  const { engagementId } = req.query;
  if (!engagementId) return res.status(400).json({ message: 'engagementId required' });
  try {
    const entries = await ReconCache.find({ engagementId }).lean();
    const cache = {};
    for (const entry of entries) {
      cache[entry.domain] = { results: entry.results, fetchedAt: entry.fetchedAt };
    }
    res.json(cache);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load recon cache', error: err.message });
  }
});

// POST /api/recon/cache — upsert a single domain's results
// Body: { engagementId, domain, results, fetchedAt }
router.post('/cache', protect, async (req, res) => {
  const { engagementId, domain, results, fetchedAt } = req.body;
  if (!engagementId || !domain) return res.status(400).json({ message: 'engagementId and domain required' });
  try {
    const entry = await ReconCache.findOneAndUpdate(
      { engagementId, domain },
      { engagementId, domain, results: results ?? {}, fetchedAt },
      { upsert: true, new: true },
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save recon cache', error: err.message });
  }
});

// DELETE /api/recon/cache/:domain?engagementId=  — delete a single domain entry
router.delete('/cache/:domain', protect, async (req, res) => {
  const { engagementId } = req.query;
  const { domain } = req.params;
  if (!engagementId) return res.status(400).json({ message: 'engagementId required' });
  try {
    await ReconCache.deleteOne({ engagementId, domain });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete recon cache entry', error: err.message });
  }
});

// DELETE /api/recon/cache?engagementId=  — clear all cached results for an engagement
router.delete('/cache', protect, async (req, res) => {
  const { engagementId } = req.query;
  if (!engagementId) return res.status(400).json({ message: 'engagementId required' });
  try {
    await ReconCache.deleteMany({ engagementId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear recon cache', error: err.message });
  }
});

module.exports = router;
