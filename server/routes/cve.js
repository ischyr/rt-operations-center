const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl    = require('../controllers/cveController');

// ── Engagement CVE board (CRUD) ───────────────────────────────────────────────
router.get   ('/board',     protect, ctrl.list);
router.post  ('/board',     protect, ctrl.create);
router.put   ('/board/:id', protect, ctrl.update);
router.delete('/board/:id', protect, ctrl.remove);

// ── Shodan CVE DB proxy ───────────────────────────────────────────────────────
const BASE = 'https://cvedb.shodan.io';

router.get('/feed', async (req, res) => {
  try {
    const upstream = await fetch(`${BASE}/cves`);
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
    res.json(await upstream.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const upstream = await fetch(`${BASE}/cve/${encodeURIComponent(id)}`);
    if (upstream.status === 404) return res.status(404).json({ error: `${id} not found` });
    if (!upstream.ok)            return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
    res.json(await upstream.json());
  } catch (e) { res.status(502).json({ error: e.message }); }
});

module.exports = router;
