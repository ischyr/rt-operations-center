const Engagement = require('../models/Engagement');
const crypto = require('crypto');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// Helper: parse user agent into OS + browser
const parseUA = (ua) => {
  ua = ua || '';
  let os = 'Unknown';
  let browser = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  return { os, browser };
};

// POST /:engId/qr - create QR code
exports.createQR = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { title, template, targetUrl, payload, qrDataUrl, fgColor, bgColor, tags } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    const shortCode = crypto.randomBytes(6).toString('hex');

    eng.qrCodes.push({
      title: title.trim(),
      template: template || 'url',
      targetUrl: targetUrl || '',
      payload: payload || {},
      shortCode,
      qrDataUrl: qrDataUrl || '',
      fgColor: fgColor || '#000000',
      bgColor: bgColor || '#FFFFFF',
      scans: [],
      active: true,
      tags: tags || [],
      createdBy: String(req.user._id),
      createdByCallsign: req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.qrCodes[eng.qrCodes.length - 1]);
  } catch (err) {
    console.error('[qrController] createQR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/qr/:qrId - update QR code
exports.updateQR = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.qrCodes.id(req.params.qrId);
    if (!item) return res.status(404).json({ message: 'QR code not found' });

    const { title, template, targetUrl, payload, qrDataUrl, fgColor, bgColor, active, tags } = req.body;
    if (title !== undefined) item.title = title.trim();
    if (template !== undefined) item.template = template;
    if (targetUrl !== undefined) item.targetUrl = targetUrl;
    if (payload !== undefined) item.payload = payload;
    if (qrDataUrl !== undefined) item.qrDataUrl = qrDataUrl;
    if (fgColor !== undefined) item.fgColor = fgColor;
    if (bgColor !== undefined) item.bgColor = bgColor;
    if (active !== undefined) item.active = active;
    if (tags !== undefined) item.tags = tags;

    await eng.save();
    res.json(eng.qrCodes.id(req.params.qrId));
  } catch (err) {
    console.error('[qrController] updateQR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/qr/:qrId
exports.deleteQR = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.qrCodes = eng.qrCodes.filter((q) => String(q._id) !== req.params.qrId);
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[qrController] deleteQR:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /:engId/qr/:qrId/toggle - toggle active
exports.toggleActive = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const item = eng.qrCodes.id(req.params.qrId);
    if (!item) return res.status(404).json({ message: 'QR code not found' });

    item.active = !item.active;
    await eng.save();
    res.json(eng.qrCodes.id(req.params.qrId));
  } catch (err) {
    console.error('[qrController] toggleActive:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /scan/:shortCode - PUBLIC endpoint, no auth, tracks scan and redirects
exports.trackScan = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find across all engagements
    const eng = await Engagement.findOne({ 'qrCodes.shortCode': shortCode });
    if (!eng) return res.status(404).send('Not found');

    const qr = eng.qrCodes.find((q) => q.shortCode === shortCode);
    if (!qr || !qr.active) return res.status(404).send('Not found');

    const ua = req.headers['user-agent'] || '';
    const { os, browser } = parseUA(ua);

    qr.scans.push({
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '',
      userAgent: ua.slice(0, 500),
      os,
      browser,
      referer: (req.headers.referer || '').slice(0, 500),
    });

    await eng.save();

    // Redirect to target
    const target = qr.targetUrl || qr.payload?.url || 'about:blank';
    res.redirect(302, target);
  } catch (err) {
    console.error('[qrController] trackScan:', err);
    res.status(500).send('Error');
  }
};
