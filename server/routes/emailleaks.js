const express      = require('express');
const router       = express.Router();
const { protect }  = require('../middleware/authMiddleware');
const EmailLeakCache = require('../models/EmailLeakCache');
const AppSettings    = require('../models/AppSettings');

const BASE = 'https://haveibeenpwned.com/api/v3';

const getKey = async () => {
  try {
    const s = await AppSettings.findOne({ key: 'hibp_api_key' });
    if (s?.value) return s.value.trim();
  } catch { /* ignore */ }
  return (process.env.HIBP_API_KEY || '').trim();
};

const hibpHeaders = (key) => ({
  'hibp-api-key': key,
  'User-Agent':   'RedTeamOperationsCenter/1.0',
});

// ── API key management ─────────────────────────────────────────────────────────

// GET /api/emailleaks/apikey — returns masked key status
router.get('/apikey', protect, async (req, res) => {
  try {
    const key = await getKey();
    if (!key) return res.json({ configured: false, masked: null });
    const masked = key.length > 8
      ? `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
      : '****';
    res.json({ configured: true, masked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/emailleaks/apikey — save key to DB
router.post('/apikey', protect, async (req, res) => {
  const { key = '' } = req.body;
  if (!key.trim()) return res.status(400).json({ error: 'API key is required' });
  try {
    await AppSettings.findOneAndUpdate(
      { key: 'hibp_api_key' },
      { key: 'hibp_api_key', value: key.trim() },
      { upsert: true, new: true },
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Search ─────────────────────────────────────────────────────────────────────

// POST /api/emailleaks/search  { query, type: 'account'|'domain', force? }
router.post('/search', protect, async (req, res) => {
  const { query = '', type = 'account', force = false } = req.body;
  const normalQuery = query.trim().toLowerCase();
  if (!normalQuery) return res.status(400).json({ error: 'Query is required' });
  if (!['account', 'domain'].includes(type))
    return res.status(400).json({ error: "type must be 'account' or 'domain'" });

  const key = await getKey();
  if (!key) {
    return res.status(503).json({
      error: 'HIBP API key not configured — save your key using the key icon above',
    });
  }

  // ── Cache hit ───────────────────────────────────────────────────────────────
  if (!force) {
    const cached = await EmailLeakCache.findOne({ query: normalQuery, type });
    if (cached) {
      return res.json({
        query:     normalQuery,
        type,
        found:     cached.found,
        total:     cached.total,
        results:   cached.results,
        fromCache: true,
        cachedAt:  cached.updatedAt,
      });
    }
  }

  // ── Live HIBP search ────────────────────────────────────────────────────────
  try {
    let results = [];
    let found   = false;
    let total   = 0;

    if (type === 'account') {
      const r = await fetch(
        `${BASE}/breachedaccount/${encodeURIComponent(normalQuery)}?truncateResponse=false`,
        { headers: hibpHeaders(key) },
      );

      if (r.status === 404) {
        results = [];
      } else if (!r.ok) {
        const txt = await r.text();
        return res.status(r.status).json({
          error: `HIBP error ${r.status}: ${txt.slice(0, 300)}`,
        });
      } else {
        const breaches = await r.json();
        results = breaches.map((b) => ({
          name:        b.Name,
          title:       b.Title,
          domain:      b.Domain,
          breachDate:  b.BreachDate,
          addedDate:   b.AddedDate,
          pwnCount:    b.PwnCount,
          dataClasses: b.DataClasses || [],
          isVerified:  b.IsVerified,
          isSensitive: b.IsSensitive,
          logoPath:    b.LogoPath || null,
        }));
      }

      found = results.length > 0;
      total = results.length;

    } else {
      // domain search
      const r = await fetch(
        `${BASE}/breacheddomain/${encodeURIComponent(normalQuery)}`,
        { headers: hibpHeaders(key) },
      );

      if (r.status === 404) {
        results = [];
      } else if (!r.ok) {
        const txt = await r.text();
        return res.status(r.status).json({
          error: `HIBP error ${r.status}: ${txt.slice(0, 300)}`,
        });
      } else {
        const domainData = await r.json();
        results = Object.entries(domainData)
          .map(([email, breachNames]) => ({ email, breachNames }))
          .sort((a, b) => b.breachNames.length - a.breachNames.length);
      }

      found = results.length > 0;
      total = results.length;
    }

    // ── Persist to cache ─────────────────────────────────────────────────────
    await EmailLeakCache.findOneAndUpdate(
      { query: normalQuery, type },
      { query: normalQuery, type, found, total, results },
      { upsert: true, new: true },
    );

    res.json({ query: normalQuery, type, found, total, results, fromCache: false });
  } catch (e) {
    console.error('[emailleaks]', e.message);
    res.status(502).json({ error: e.message });
  }
});

// ── Cache endpoints ────────────────────────────────────────────────────────────

// GET /api/emailleaks/cache
router.get('/cache', protect, async (req, res) => {
  try {
    const items = await EmailLeakCache
      .find({}, 'query type found total updatedAt')
      .sort({ updatedAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/emailleaks/cache/:id
router.delete('/cache/:id', protect, async (req, res) => {
  try {
    await EmailLeakCache.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
