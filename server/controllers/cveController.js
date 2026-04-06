const CVEEntry = require('../models/CVEEntry');

exports.list = async (req, res) => {
  try {
    const { engagement } = req.query;
    if (!engagement) return res.status(400).json({ error: 'engagement required' });
    const docs = await CVEEntry.find({ engagementSlug: engagement }).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { engagementSlug, ...rest } = req.body;
    if (!engagementSlug) return res.status(400).json({ error: 'engagementSlug required' });
    if (!rest.cveId)     return res.status(400).json({ error: 'cveId required' });
    const addedBy = req.user?.username || req.user?.email || req.user?.name || 'Unknown';
    const doc = await CVEEntry.create({ engagementSlug, addedBy, ...rest });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const doc = await CVEEntry.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await CVEEntry.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
