const path = require('path');
const fs   = require('fs');
const { GhdbEntry, GhdbMeta } = require('../models/GhdbEntry');

// Path where the Python scraper writes its output
const SCRAPE_OUTPUT = path.join(__dirname, '../../scripts/ghdb.json');

// ── Helper: upsert entries array into MongoDB ─────────────────────────────────
async function upsertEntries(entries) {
  const CHUNK = 500;
  let upserted = 0;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const ops   = chunk.map(e => ({
      updateOne: {
        filter: { ghdbId: String(e.ghdbId || i + chunk.indexOf(e)) },
        update: { $set: {
          ghdbId:    String(e.ghdbId || ''),
          dork:      String(e.dork || ''),
          category:  String(e.category || 'Uncategorized'),
          author:    String(e.author || 'Unknown'),
          dateAdded: String(e.dateAdded || ''),
        }},
        upsert: true,
      },
    }));
    const r = await GhdbEntry.bulkWrite(ops, { ordered: false });
    upserted += r.upsertedCount + r.modifiedCount;
  }
  return upserted;
}

// ── POST /api/ghdb/import  (reads scripts/ghdb.json written by Python) ────────
exports.importFromFile = async (req, res) => {
  try {
    if (!fs.existsSync(SCRAPE_OUTPUT)) {
      return res.status(404).json({
        error: `File not found: scripts/ghdb.json\n\nRun the scraper first:\n  python scripts/scrape_ghdb.py`,
        hint:  'Run the Python scraper to generate the file, then click Import again.',
      });
    }

    const raw     = fs.readFileSync(SCRAPE_OUTPUT, 'utf-8');
    const entries = JSON.parse(raw);

    if (!Array.isArray(entries) || !entries.length) {
      return res.status(400).json({ error: 'ghdb.json is empty or not a JSON array' });
    }

    console.log(`[GHDB] importing ${entries.length} entries from file...`);
    const upserted = await upsertEntries(entries);
    const totalDb  = await GhdbEntry.countDocuments();

    await GhdbMeta.findOneAndUpdate(
      {},
      { lastSync: new Date(), totalFetched: totalDb },
      { upsert: true, new: true }
    );

    console.log(`[GHDB] import done — ${upserted} upserted, ${totalDb} total`);
    res.json({ ok: true, total: entries.length, upserted, totalDb });
  } catch (err) {
    console.error('[GHDB import]', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ghdb ─────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { q = '', category = '', page = '1', limit = '15' } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip     = (pageNum - 1) * pageSize;

    const filter = {};
    if (category) filter.category = category;
    if (q.trim()) filter.$or = [
      { dork:     { $regex: q.trim(), $options: 'i' } },
      { author:   { $regex: q.trim(), $options: 'i' } },
      { category: { $regex: q.trim(), $options: 'i' } },
    ];

    const [entries, total] = await Promise.all([
      GhdbEntry.find(filter).sort({ dateAdded: -1 }).skip(skip).limit(pageSize).lean(),
      GhdbEntry.countDocuments(filter),
    ]);

    const meta = await GhdbMeta.findOne().lean();

    res.json({
      entries,
      total,
      page:     pageNum,
      pageSize,
      pages:    Math.ceil(total / pageSize) || 1,
      lastSync: meta?.lastSync || null,
      totalDb:  meta?.totalFetched || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ghdb/categories ──────────────────────────────────────────────────
exports.categories = async (req, res) => {
  try {
    const counts = await GhdbEntry.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]);
    res.json(counts.map(c => ({ name: c._id, count: c.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ghdb/meta ────────────────────────────────────────────────────────
exports.meta = async (req, res) => {
  try {
    const meta  = await GhdbMeta.findOne().lean();
    const total = await GhdbEntry.countDocuments();
    res.json({ lastSync: meta?.lastSync || null, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET /api/ghdb/file-status  (check if ghdb.json exists) ───────────────────
exports.fileStatus = async (req, res) => {
  const exists = fs.existsSync(SCRAPE_OUTPUT);
  let size = 0;
  if (exists) {
    try { size = fs.statSync(SCRAPE_OUTPUT).size; } catch { /* ignore */ }
  }
  res.json({ exists, size, path: 'scripts/ghdb.json' });
};
