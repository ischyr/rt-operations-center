const mongoose = require('mongoose');

// ── Inline schemas ─────────────────────────────────────────────────────────────
const targetSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  email:        { type: String, required: true },
  name:         { type: String, default: '' },
  department:   { type: String, default: '' },
  provider:     { type: String, default: 'microsoft', enum: ['microsoft', 'okta', 'duo', 'adfs', 'custom'] },
  status:       { type: String, default: 'idle',
                  enum: ['idle', 'pushing', 'approved', 'denied', 'locked', 'no-response'] },
  pushCount:    { type: Number, default: 0 },
  maxPushes:    { type: Number, default: 10 },
  approvedAt:   { type: Date, default: null },
  notes:        { type: String, default: '' },
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  targetId:     { type: String, default: '' },
  email:        { type: String, default: '' },
  name:         { type: String, default: '' },
  provider:     { type: String, default: '' },
  action:       { type: String, enum: ['pushed', 'approved', 'denied', 'locked', 'no-response', 'reset', 'cleared'] },
  detail:       { type: String, default: '' },
}, { timestamps: true });

const MfaTarget = mongoose.models.MfaTarget || mongoose.model('MfaTarget', targetSchema);
const MfaEvent  = mongoose.models.MfaEvent  || mongoose.model('MfaEvent',  eventSchema);

// ── Targets ────────────────────────────────────────────────────────────────────
exports.getTargets = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId required' });
    const targets = await MfaTarget.find({ engagementId }).sort({ createdAt: -1 });
    res.json(targets);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createTarget = async (req, res) => {
  try {
    const { engagementId, email, name, department, provider, maxPushes } = req.body;
    if (!engagementId || !email) return res.status(400).json({ error: 'engagementId and email required' });
    const target = await MfaTarget.create({
      engagementId, email: email.trim().toLowerCase(),
      name: name || '', department: department || '',
      provider: provider || 'microsoft',
      maxPushes: Number(maxPushes) || 10,
    });
    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateTarget = async (req, res) => {
  try {
    const allowed = ['name', 'department', 'provider', 'maxPushes', 'notes'];
    const update  = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const target  = await MfaTarget.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!target) return res.status(404).json({ error: 'Not found' });
    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deleteTarget = async (req, res) => {
  try {
    await MfaTarget.findByIdAndDelete(req.params.id);
    await MfaEvent.deleteMany({ targetId: req.params.id });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.clearTargets = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId required' });
    await MfaTarget.deleteMany({ engagementId });
    await MfaEvent.deleteMany({ engagementId });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Push action ────────────────────────────────────────────────────────────────
exports.pushTarget = async (req, res) => {
  try {
    const target = await MfaTarget.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });
    if (target.status === 'locked' || target.status === 'approved')
      return res.status(400).json({ error: `Cannot push — status is ${target.status}` });

    target.pushCount += 1;
    const willLock = target.pushCount >= target.maxPushes;
    target.status  = willLock ? 'locked' : 'pushing';
    await target.save();

    await MfaEvent.create({
      engagementId: target.engagementId,
      targetId:     target._id.toString(),
      email:        target.email,
      name:         target.name,
      provider:     target.provider,
      action:       willLock ? 'locked' : 'pushed',
      detail:       willLock
        ? `Account reached lockout threshold after ${target.pushCount} push attempts`
        : `Push notification #${target.pushCount} delivered`,
    });

    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Record victim response ─────────────────────────────────────────────────────
exports.respondTarget = async (req, res) => {
  try {
    const { response, notes } = req.body; // 'approved' | 'denied' | 'no-response'
    const valid = ['approved', 'denied', 'no-response'];
    if (!valid.includes(response)) return res.status(400).json({ error: 'Invalid response' });

    const target = await MfaTarget.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });

    target.status = response;
    if (response === 'approved') target.approvedAt = new Date();
    if (notes !== undefined) target.notes = notes;
    await target.save();

    const details = {
      approved:      `Target approved the MFA push after ${target.pushCount} attempt(s)`,
      denied:        `Target explicitly denied the push (${target.pushCount} attempt(s))`,
      'no-response': `No response recorded — ${target.pushCount} push(es) sent`,
    };

    await MfaEvent.create({
      engagementId: target.engagementId,
      targetId:     target._id.toString(),
      email:        target.email,
      name:         target.name,
      provider:     target.provider,
      action:       response,
      detail:       details[response],
    });

    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Reset target ───────────────────────────────────────────────────────────────
exports.resetTarget = async (req, res) => {
  try {
    const target = await MfaTarget.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Not found' });

    target.status    = 'idle';
    target.pushCount = 0;
    target.approvedAt = null;
    await target.save();

    await MfaEvent.create({
      engagementId: target.engagementId,
      targetId:     target._id.toString(),
      email:        target.email,
      name:         target.name,
      provider:     target.provider,
      action:       'reset',
      detail:       'Target reset to idle — push counter cleared',
    });

    res.json(target);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Events ─────────────────────────────────────────────────────────────────────
exports.getEvents = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId required' });
    const events = await MfaEvent.find({ engagementId }).sort({ createdAt: -1 }).limit(300);
    res.json(events);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.clearEvents = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId required' });
    await MfaEvent.deleteMany({ engagementId });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
