const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// ── Web Templates ──────────────────────────────────────────────────

// POST /:engId/web
exports.addWebTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, description, html, category, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.phishingWebTemplates.push({
      title:              title.trim(),
      description:        description || '',
      html:               html        || undefined,
      category:           category    || 'Login Page',
      tags:               tags        || [],
      createdBy:          String(req.user._id),
      createdByCallsign:  req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.phishingWebTemplates[eng.phishingWebTemplates.length - 1]);
  } catch (err) {
    console.error('[phishingController] addWebTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/web/:tplId
exports.updateWebTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.phishingWebTemplates.id(req.params.tplId);
    if (!item) return res.status(404).json({ message: 'Web template not found' });

    const { title, description, html, category, tags } = req.body;
    if (title       !== undefined) item.title       = title.trim();
    if (description !== undefined) item.description = description;
    if (html        !== undefined) item.html        = html;
    if (category    !== undefined) item.category    = category;
    if (tags        !== undefined) item.tags        = tags;

    await eng.save();
    res.json(eng.phishingWebTemplates.id(req.params.tplId));
  } catch (err) {
    console.error('[phishingController] updateWebTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/web/:tplId
exports.deleteWebTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.phishingWebTemplates = eng.phishingWebTemplates.filter(
      (t) => String(t._id) !== req.params.tplId
    );
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[phishingController] deleteWebTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Email Templates ────────────────────────────────────────────────

// POST /:engId/email
exports.addEmailTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, description, subject, senderName, senderEmail, html, textBody, category, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    eng.phishingEmailTemplates.push({
      title:              title.trim(),
      description:        description || '',
      subject:            subject     || '',
      senderName:         senderName  || '',
      senderEmail:        senderEmail || '',
      html:               html        || undefined,
      textBody:           textBody    || '',
      category:           category    || 'Credential Harvest',
      tags:               tags        || [],
      createdBy:          String(req.user._id),
      createdByCallsign:  req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.phishingEmailTemplates[eng.phishingEmailTemplates.length - 1]);
  } catch (err) {
    console.error('[phishingController] addEmailTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/email/:tplId
exports.updateEmailTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.phishingEmailTemplates.id(req.params.tplId);
    if (!item) return res.status(404).json({ message: 'Email template not found' });

    const { title, description, subject, senderName, senderEmail, html, textBody, category, tags } = req.body;
    if (title       !== undefined) item.title       = title.trim();
    if (description !== undefined) item.description = description;
    if (subject     !== undefined) item.subject     = subject;
    if (senderName  !== undefined) item.senderName  = senderName;
    if (senderEmail !== undefined) item.senderEmail = senderEmail;
    if (html        !== undefined) item.html        = html;
    if (textBody    !== undefined) item.textBody    = textBody;
    if (category    !== undefined) item.category    = category;
    if (tags        !== undefined) item.tags        = tags;

    await eng.save();
    res.json(eng.phishingEmailTemplates.id(req.params.tplId));
  } catch (err) {
    console.error('[phishingController] updateEmailTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/email/:tplId
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.phishingEmailTemplates = eng.phishingEmailTemplates.filter(
      (t) => String(t._id) !== req.params.tplId
    );
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[phishingController] deleteEmailTemplate:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Config ─────────────────────────────────────────────────────────

// GET /:engId/config
exports.getConfig = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    res.json(eng.phishingConfig);
  } catch (err) {
    console.error('[phishingController] getConfig:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/config
exports.updateConfig = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const fields = [
      'smtpHost', 'smtpPort', 'smtpUsername', 'smtpPassword', 'smtpTLS',
      'senderEmail', 'senderName', 'domain', 'landingDomain',
      'gophishUrl', 'gophishApiKey', 'notes',
    ];

    if (!eng.phishingConfig) eng.phishingConfig = {};

    for (const f of fields) {
      if (req.body[f] !== undefined) eng.phishingConfig[f] = req.body[f];
    }

    eng.phishingConfig.updatedBy         = String(req.user._id);
    eng.phishingConfig.updatedByCallsign = req.user.callsign || '';

    eng.markModified('phishingConfig');
    await eng.save();
    res.json(eng.phishingConfig);
  } catch (err) {
    console.error('[phishingController] updateConfig:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
