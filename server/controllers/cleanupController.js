const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/cleanup
exports.addCleanup = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, artifactType, path, commands, beforeProof, afterProof,
            beforeImages, afterImages, notes, tags, status } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.cleanup.push({
      title:              title.trim(),
      artifactType:       artifactType    || 'File',
      path:               path            || '',
      commands:           commands        || '',
      beforeProof:        beforeProof     || '',
      afterProof:         afterProof      || '',
      beforeImages:       beforeImages    || [],
      afterImages:        afterImages     || [],
      notes:              notes           || '',
      tags:               tags            || [],
      status:             status          || 'Pending',
      cleanedBy:          String(req.user._id),
      cleanedByCallsign:  req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.cleanup[eng.cleanup.length - 1]);
  } catch (err) {
    console.error('[cleanupController] addCleanup:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/cleanup/:cleanupId
exports.updateCleanup = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.cleanup.id(req.params.cleanupId);
    if (!item) return res.status(404).json({ message: 'Cleanup item not found' });

    const { title, artifactType, path, commands, beforeProof, afterProof,
            beforeImages, afterImages, notes, tags, status } = req.body;

    if (title        !== undefined) item.title        = title.trim();
    if (artifactType !== undefined) item.artifactType = artifactType;
    if (path         !== undefined) item.path         = path;
    if (commands     !== undefined) item.commands     = commands;
    if (beforeProof  !== undefined) item.beforeProof  = beforeProof;
    if (afterProof   !== undefined) item.afterProof   = afterProof;
    if (beforeImages !== undefined) item.beforeImages = beforeImages;
    if (afterImages  !== undefined) item.afterImages  = afterImages;
    if (notes        !== undefined) item.notes        = notes;
    if (tags         !== undefined) item.tags         = tags;
    if (status       !== undefined) item.status       = status;

    await eng.save();
    res.json(eng.cleanup.id(req.params.cleanupId));
  } catch (err) {
    console.error('[cleanupController] updateCleanup:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/cleanup/:cleanupId
exports.deleteCleanup = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.cleanup = eng.cleanup.filter((c) => String(c._id) !== req.params.cleanupId);
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[cleanupController] deleteCleanup:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
