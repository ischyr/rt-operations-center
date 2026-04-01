const express     = require('express');
const router      = express.Router();
const https       = require('https');
const { protect } = require('../middleware/authMiddleware');
const AppSettings = require('../models/AppSettings');

const INTELX_BASE = '2.intelx.io';

// ── API key management ────────────────────────────────────────────────────────

const getKey = async () => {
  try {
    const s = await AppSettings.findOne({ key: 'intelx_api_key' });
    if (s?.value) return s.value.trim();
  } catch { /* ignore */ }
  return (process.env.INTELX_API_KEY || '').trim();
};

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

router.post('/apikey', protect, async (req, res) => {
  const { key = '' } = req.body;
  if (!key.trim()) return res.status(400).json({ error: 'API key is required' });
  try {
    await AppSettings.findOneAndUpdate(
      { key: 'intelx_api_key' },
      { key: 'intelx_api_key', value: key.trim() },
      { upsert: true, new: true },
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Helper: HTTPS request to IntelX ──────────────────────────────────────────

function intelxRequest(method, path, apiKey, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: INTELX_BASE,
      path,
      method,
      headers: {
        'x-key':         apiKey,
        'Content-Type':  'application/json',
        'User-Agent':    'RedTeamOpsCenter/1.0',
        'Accept':        'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── POST /api/emails/search — initiate phonebook search ──────────────────────
// Body: { domain }
// Returns: { id }

router.post('/search', protect, async (req, res) => {
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: 'domain required' });

  const key = await getKey();
  if (!key) return res.status(503).json({ error: 'IntelX API key not configured' });

  try {
    const result = await intelxRequest('POST', '/phonebook/search', key, {
      term:        domain.trim(),
      buckets:     [],
      lookuplevel: 0,
      maxresults:  100000,
      timeout:     0,
      datefrom:    '',
      dateto:      '',
      sort:        4,
      media:       0,
      terminate:   [],
    });

    if (result.status !== 200) {
      return res.status(result.status).json({ error: `IntelX error ${result.status}` });
    }

    const id = result.body?.id;
    if (!id) return res.status(502).json({ error: 'IntelX did not return a search ID' });

    res.json({ id });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── GET /api/emails/result?id={id} — fetch ALL search results (paginated) ────

const PAGE_SIZE  = 1000;
const MAX_PAGES  = 50; // safety cap: 50 × 1000 = 50,000 max emails

router.get('/result', protect, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  const key = await getKey();
  if (!key) return res.status(503).json({ error: 'IntelX API key not configured' });

  try {
    let allRaw     = [];
    let offset     = 0;
    let finalStatus;
    let pages      = 0;

    // First page — also tells us if IntelX is still processing (status === 2)
    while (pages < MAX_PAGES) {
      const result = await intelxRequest(
        'GET',
        `/phonebook/search/result?id=${encodeURIComponent(id)}&limit=${PAGE_SIZE}&offset=${offset}`,
        key,
        null,
      );

      if (result.status !== 200) {
        return res.status(result.status).json({ error: `IntelX error ${result.status}` });
      }

      const selectors = result.body?.selectors || [];
      finalStatus     = result.body?.status;

      allRaw.push(...selectors);
      pages++;

      // status 2 = still indexing on IntelX side — return partial so client can poll
      if (finalStatus === 2) break;

      // Fewer results than page size means this was the last page
      if (selectors.length < PAGE_SIZE) break;

      offset += PAGE_SIZE;
    }

    // Deduplicate and filter to emails only (selectortype === 1)
    const emails = [...new Set(
      allRaw
        .filter(s => s.selectortype === 1)
        .map(s => s.selectorvalue?.toLowerCase().trim())
        .filter(Boolean),
    )].sort();

    res.json({ emails, status: finalStatus, total: emails.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
