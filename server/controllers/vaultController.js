const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/vault
exports.addEntry = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, category, username, password, url, notes, customFields, tags, favorite } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.vault.push({
      title:              title.trim(),
      category:           category     || 'Login',
      username:           username     || '',
      password:           password     || '',
      url:                url          || '',
      notes:              notes        || '',
      customFields:       customFields || [],
      tags:               tags         || [],
      favorite:           favorite     || false,
      createdBy:          String(req.user._id),
      createdByCallsign:  req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.vault[eng.vault.length - 1]);
  } catch (err) {
    console.error('[vaultController] addEntry:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/vault/:entryId
exports.updateEntry = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.vault.id(req.params.entryId);
    if (!item) return res.status(404).json({ message: 'Vault entry not found' });

    const { title, category, username, password, url, notes, customFields, tags, favorite } = req.body;
    if (title        !== undefined) item.title        = title.trim();
    if (category     !== undefined) item.category     = category;
    if (username     !== undefined) item.username     = username;
    if (password     !== undefined) item.password     = password;
    if (url          !== undefined) item.url          = url;
    if (notes        !== undefined) item.notes        = notes;
    if (customFields !== undefined) item.customFields = customFields;
    if (tags         !== undefined) item.tags         = tags;
    if (favorite     !== undefined) item.favorite     = favorite;

    await eng.save();
    res.json(eng.vault.id(req.params.entryId));
  } catch (err) {
    console.error('[vaultController] updateEntry:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/vault/:entryId
exports.deleteEntry = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.vault = eng.vault.filter((v) => String(v._id) !== req.params.entryId);
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[vaultController] deleteEntry:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /:engId/vault/:entryId/favorite
exports.toggleFavorite = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.vault.id(req.params.entryId);
    if (!item) return res.status(404).json({ message: 'Vault entry not found' });

    item.favorite = !item.favorite;
    await eng.save();
    res.json(eng.vault.id(req.params.entryId));
  } catch (err) {
    console.error('[vaultController] toggleFavorite:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
