const express = require('express');
const router  = express.Router();

const MITRE_URL = 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

let cache = { tools: null, fetchedAt: null };

async function getMitreTools() {
  const now = Date.now();
  if (cache.tools && cache.fetchedAt && (now - cache.fetchedAt) < CACHE_TTL) {
    return cache.tools;
  }

  const res    = await fetch(MITRE_URL);
  if (!res.ok) throw new Error(`MITRE fetch failed: HTTP ${res.status}`);
  const bundle = await res.json();

  const tools = bundle.objects
    .filter(o => (o.type === 'tool' || o.type === 'malware') && !o.revoked && !o.x_mitre_deprecated)
    .map(o => {
      const mitreRef = o.external_references?.find(r => r.source_name === 'mitre-attack');
      return {
        id:          mitreRef?.external_id || '',
        name:        o.name || '',
        type:        o.type,                          // 'tool' | 'malware'
        description: o.description || '',
        aliases:     (o.x_mitre_aliases || [o.name]).filter(a => a !== o.name),
        platforms:   o.x_mitre_platforms || [],
        url:         mitreRef?.url || '',
        labels:      o.labels || [],
        version:     o.x_mitre_version || '',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  cache = { tools, fetchedAt: now };
  return tools;
}

// GET /api/tools?search=mimikatz&type=tool
router.get('/', async (req, res) => {
  try {
    let tools = await getMitreTools();

    const { search, type } = req.query;

    if (type && (type === 'tool' || type === 'malware')) {
      tools = tools.filter(t => t.type === type);
    }

    if (search) {
      const q = search.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q)        ||
        t.description.toLowerCase().includes(q) ||
        t.aliases.some(a => a.toLowerCase().includes(q)) ||
        t.platforms.some(p => p.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    }

    res.json({ tools, total: tools.length, cached: !!cache.fetchedAt });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// GET /api/tools/status — cache info
router.get('/status', async (req, res) => {
  res.json({
    cached:    !!cache.fetchedAt,
    fetchedAt: cache.fetchedAt,
    count:     cache.tools?.length ?? 0,
  });
});

module.exports = router;
