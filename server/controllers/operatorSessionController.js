const mongoose = require('mongoose');

// ── Schema ─────────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  // Operator — resolved from auth
  operatorId:   { type: String, required: true },
  operatorName: { type: String, required: true },

  // What & where
  target:    { type: String, required: true, trim: true }, // host / IP / URL / user / etc.
  action:    { type: String, required: true, trim: true }, // e.g. "Port Scan", "Kerberoast"
  tool:      { type: String, default: '', trim: true },    // nmap, crackmapexec, …
  notes:     { type: String, default: '' },

  // Noise / risk of this activity
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

  // Lifecycle
  status:    { type: String, enum: ['active', 'paused', 'completed', 'aborted'], default: 'active', index: true },
  startedAt: { type: Date, default: Date.now },
  endedAt:   { type: Date, default: null },

  // Heartbeat — last time the operator touched the session
  lastPing:  { type: Date, default: Date.now },
}, { timestamps: true });

// Convenience: duration in seconds (virtual-ish; computed on demand)
sessionSchema.methods.durationSeconds = function () {
  const end = this.endedAt || new Date();
  return Math.max(0, Math.round((end - this.startedAt) / 1000));
};

const Session = mongoose.model('OperatorSession', sessionSchema);

// ── listSessions ──────────────────────────────────────────────────────────────
// GET /:engagementId/sessions?status=active
exports.listSessions = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { status } = req.query;

    const query = { engagementId };
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .sort({ status: 1, startedAt: -1 })
      .limit(500)
      .lean();

    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── createSession ─────────────────────────────────────────────────────────────
// POST /:engagementId/sessions
exports.createSession = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { target, action, tool, notes, riskLevel } = req.body;

    if (!target?.trim()) return res.status(400).json({ error: 'Target is required' });
    if (!action?.trim()) return res.status(400).json({ error: 'Action is required' });

    const operatorId   = req.user?._id?.toString() || 'unknown';
    const operatorName = req.user?.name || req.user?.email || 'Unknown Operator';

    const doc = await Session.create({
      engagementId,
      operatorId, operatorName,
      target:  target.trim(),
      action:  action.trim(),
      tool:    (tool    || '').trim(),
      notes:   notes    || '',
      riskLevel: ['low', 'medium', 'high'].includes(riskLevel) ? riskLevel : 'low',
      status:  'active',
      startedAt: new Date(),
      lastPing:  new Date(),
    });
    res.status(201).json(doc.toObject());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── updateSession ─────────────────────────────────────────────────────────────
// PATCH /:engagementId/sessions/:id
// Accepts: status, notes, tool, action, target, riskLevel
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};

    const { status, notes, tool, action, target, riskLevel } = req.body;

    if (typeof notes  === 'string') patch.notes  = notes;
    if (typeof tool   === 'string') patch.tool   = tool.trim();
    if (typeof action === 'string' && action.trim()) patch.action = action.trim();
    if (typeof target === 'string' && target.trim()) patch.target = target.trim();
    if (['low', 'medium', 'high'].includes(riskLevel)) patch.riskLevel = riskLevel;

    if (['active', 'paused', 'completed', 'aborted'].includes(status)) {
      patch.status = status;
      if (status === 'completed' || status === 'aborted') patch.endedAt = new Date();
      if (status === 'active')                            patch.endedAt = null;
    }

    // Every edit counts as a ping
    patch.lastPing = new Date();

    const updated = await Session.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── pingSession ───────────────────────────────────────────────────────────────
// POST /:engagementId/sessions/:id/ping
exports.pingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Session.findByIdAndUpdate(id,
      { lastPing: new Date() },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Session not found' });
    res.json({ ok: true, lastPing: updated.lastPing });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── deleteSession ─────────────────────────────────────────────────────────────
// DELETE /:engagementId/sessions/:id
exports.deleteSession = async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
