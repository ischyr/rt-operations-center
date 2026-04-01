const Engagement         = require('../models/Engagement');
const EngagementDocument = require('../models/EngagementDocument');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/documents
// Body: { name, section, mimeType, size, data (base64), description, tags }
exports.addDocument = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { name, section, mimeType, size, data, description, tags } = req.body;
    if (!name?.trim())   return res.status(400).json({ message: 'File name is required' });
    if (!data)           return res.status(400).json({ message: 'File data is required' });
    if (!['official', 'created', 'pillaged'].includes(section))
      return res.status(400).json({ message: 'Invalid section' });

    eng.documents.push({
      name:               name.trim(),
      section,
      mimeType:           mimeType || 'application/octet-stream',
      size:               size     || 0,
      description:        description || '',
      tags:               tags     || [],
      uploadedBy:         String(req.user._id),
      uploadedByCallsign: req.user.callsign || '',
    });

    await eng.save();
    const doc = eng.documents[eng.documents.length - 1];

    // Store binary data separately
    await EngagementDocument.create({
      engagementId: eng._id,
      documentId:   String(doc._id),
      data,
      mimeType:     mimeType || 'application/octet-stream',
    });

    res.json(doc);
  } catch (err) {
    console.error('[documentsController] addDocument:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /:engId/documents/:docId/download
exports.downloadDocument = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const meta = eng.documents.id(req.params.docId);
    if (!meta) return res.status(404).json({ message: 'Document not found' });

    const store = await EngagementDocument.findOne({
      engagementId: eng._id,
      documentId:   req.params.docId,
    });
    if (!store) return res.status(404).json({ message: 'Document data not found' });

    res.json({ data: store.data, mimeType: store.mimeType, name: meta.name });
  } catch (err) {
    console.error('[documentsController] downloadDocument:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/documents/:docId
exports.deleteDocument = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const docId = req.params.docId;
    eng.documents = eng.documents.filter((d) => String(d._id) !== docId);
    await eng.save();

    await EngagementDocument.deleteOne({ engagementId: eng._id, documentId: docId });
    res.json({ ok: true });
  } catch (err) {
    console.error('[documentsController] deleteDocument:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
