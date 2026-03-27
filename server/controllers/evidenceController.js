const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/evidence
exports.addEvidence = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, type, content, images, tags, timestamp } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.evidence.push({
      title:              title.trim(),
      type:               type      || 'Note',
      content:            content   || '',
      images:             images    || [],
      tags:               tags      || [],
      timestamp:          timestamp ? new Date(timestamp) : new Date(),
      capturedBy:         String(req.user._id),
      capturedByCallsign: req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.evidence[eng.evidence.length - 1]);
  } catch (err) {
    console.error('[evidenceController] addEvidence:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/evidence/:evidenceId
exports.updateEvidence = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.evidence.id(req.params.evidenceId);
    if (!item) return res.status(404).json({ message: 'Evidence item not found' });

    const { title, type, content, images, tags, timestamp } = req.body;
    if (title     !== undefined) item.title     = title.trim();
    if (type      !== undefined) item.type      = type;
    if (content   !== undefined) item.content   = content;
    if (images    !== undefined) item.images    = images;
    if (tags      !== undefined) item.tags      = tags;
    if (timestamp !== undefined) item.timestamp = new Date(timestamp);

    await eng.save();
    res.json(eng.evidence.id(req.params.evidenceId));
  } catch (err) {
    console.error('[evidenceController] updateEvidence:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/evidence/:evidenceId
exports.deleteEvidence = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.evidence = eng.evidence.filter((e) => String(e._id) !== req.params.evidenceId);
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[evidenceController] deleteEvidence:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
