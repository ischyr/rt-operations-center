const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/loot
exports.addLoot = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, category, content, images, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.loot.push({
      title:              title.trim(),
      category:           category || 'Other',
      content:            content  || '',
      images:             images   || [],
      tags:               tags     || [],
      capturedBy:         String(req.user._id),
      capturedByCallsign: req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.loot[eng.loot.length - 1]);
  } catch (err) {
    console.error('[lootController] addLoot:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/loot/:lootId
exports.updateLoot = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.loot.id(req.params.lootId);
    if (!item) return res.status(404).json({ message: 'Loot item not found' });

    const { title, category, content, images, tags } = req.body;
    if (title     !== undefined) item.title    = title.trim();
    if (category  !== undefined) item.category = category;
    if (content   !== undefined) item.content  = content;
    if (images    !== undefined) item.images   = images;
    if (tags      !== undefined) item.tags     = tags;

    await eng.save();
    res.json(eng.loot.id(req.params.lootId));
  } catch (err) {
    console.error('[lootController] updateLoot:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/loot/:lootId
exports.deleteLoot = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.loot = eng.loot.filter((l) => String(l._id) !== req.params.lootId);
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[lootController] deleteLoot:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
