const Engagement       = require('../models/Engagement');
const EngagementDocument = require('../models/EngagementDocument');

const findEng = (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// GET /:engId/entries — list all file meta entries (no binary)
exports.list = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });
    res.json(eng.fileMetaEntries || []);
  } catch (err) {
    console.error('[fileMetaController] list:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /:engId/entries — upload file + extracted metadata
exports.create = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { name, size, mimeType, extractedMeta, data } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'name required' });
    if (!data)         return res.status(400).json({ message: 'data required' });

    eng.fileMetaEntries.push({
      name:          name.trim(),
      size:          size || 0,
      mimeType:      mimeType || 'application/octet-stream',
      extractedMeta: extractedMeta || {},
      uploadedBy:    req.user.callsign || String(req.user._id),
    });
    await eng.save();

    const entry = eng.fileMetaEntries[eng.fileMetaEntries.length - 1];

    // Store binary separately so the engagement doc stays lean
    await EngagementDocument.findOneAndUpdate(
      { engagementId: eng._id, documentId: `fm_${entry._id}` },
      { engagementId: eng._id, documentId: `fm_${entry._id}`, data, mimeType: mimeType || 'application/octet-stream' },
      { upsert: true },
    );

    res.json(entry);
  } catch (err) {
    console.error('[fileMetaController] create:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /:engId/entries/:entryId/download — fetch binary
exports.download = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const entry = eng.fileMetaEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const doc = await EngagementDocument.findOne({
      engagementId: eng._id,
      documentId:   `fm_${entry._id}`,
    });
    if (!doc) return res.status(404).json({ message: 'Binary not found' });

    res.json({ data: doc.data, mimeType: entry.mimeType, name: entry.name });
  } catch (err) {
    console.error('[fileMetaController] download:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/entries/:entryId
exports.remove = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const entry = eng.fileMetaEntries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    await EngagementDocument.deleteOne({
      engagementId: eng._id,
      documentId:   `fm_${entry._id}`,
    });

    eng.fileMetaEntries = eng.fileMetaEntries.filter(
      (e) => String(e._id) !== req.params.entryId,
    );
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[fileMetaController] remove:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
