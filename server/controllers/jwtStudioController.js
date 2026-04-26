const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
  severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'info' },
  code:     { type: String, default: '' },
  message:  { type: String, default: '' },
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  label:        { type: String, default: '' },
  rawToken:     { type: String, default: '' },
  header:       { type: mongoose.Schema.Types.Mixed, default: {} },
  payload:      { type: mongoose.Schema.Types.Mixed, default: {} },
  algorithm:    { type: String, default: '' },

  warnings:     [warningSchema],
  notes:        { type: String, default: '' },

  createdByOperatorId:   { type: String, default: '' },
  createdByOperatorName: { type: String, default: '' },
}, { timestamps: true });

const JwtAnalysis = mongoose.model('JwtAnalysis', analysisSchema);

// ── List ──────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const items = await JwtAnalysis
      .find({ engagementId: req.params.engagementId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Create ────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const op = {
      id:   req.user?._id?.toString() || '',
      name: req.user?.name || req.user?.email || 'Operator',
    };

    const {
      label, rawToken, header, payload, algorithm, warnings, notes,
    } = req.body;

    if (!rawToken?.trim()) return res.status(400).json({ error: 'rawToken required' });

    const doc = await JwtAnalysis.create({
      engagementId,
      label:    (label || '').trim(),
      rawToken: rawToken.trim(),
      header:   header   || {},
      payload:  payload  || {},
      algorithm: (algorithm || '').toString(),
      warnings: Array.isArray(warnings) ? warnings : [],
      notes:    notes || '',
      createdByOperatorId:   op.id,
      createdByOperatorName: op.name,
    });
    res.status(201).json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Update label / notes ──────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const patch = {};
    if (typeof req.body.label === 'string') patch.label = req.body.label;
    if (typeof req.body.notes === 'string') patch.notes = req.body.notes;
    const updated = await JwtAnalysis.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Delete ────────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    await JwtAnalysis.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
