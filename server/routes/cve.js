const express = require('express');
const router  = express.Router();

const BASE = 'https://cvedb.shodan.io';

// GET /api/cve/feed  — latest CVEs
router.get('/feed', async (req, res) => {
  try {
    const upstream = await fetch(`${BASE}/cves`);
    if (!upstream.ok) return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
    const data = await upstream.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// GET /api/cve/:id  — single CVE detail
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const upstream = await fetch(`${BASE}/cve/${encodeURIComponent(id)}`);
    if (upstream.status === 404) return res.status(404).json({ error: `${id} not found` });
    if (!upstream.ok)            return res.status(upstream.status).json({ error: `Upstream ${upstream.status}` });
    const data = await upstream.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
