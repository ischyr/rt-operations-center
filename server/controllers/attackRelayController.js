const mongoose = require('mongoose');

const PHASES     = ['recon', 'foothold', 'priv-esc', 'lateral', 'exfil', 'done'];
const TYPES      = ['host', 'user', 'webapp', 'network', 'credential', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

// ── Schema ─────────────────────────────────────────────────────────────────────
const moveSchema = new mongoose.Schema({
  from:         String,
  to:           String,
  operatorId:   String,
  operatorName: String,
  note:         String,
  at:           { type: Date, default: Date.now },
}, { _id: false });

const cardSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  target:     { type: String, required: true, trim: true },
  targetType: { type: String, enum: TYPES, default: 'host' },
  phase:      { type: String, enum: PHASES, default: 'recon', index: true },
  priority:   { type: String, enum: PRIORITIES, default: 'medium' },

  // Ownership
  createdByOperatorId:   { type: String, required: true },
  createdByOperatorName: { type: String, required: true },
  assignedOperatorId:    { type: String, default: '' },
  assignedOperatorName:  { type: String, default: '' },

  // Free-form context
  intel:       { type: String, default: '' },
  handoffNote: { type: String, default: '' },

  // Audit trail of phase / assignee changes
  history: [moveSchema],

  // Soft ordering within a column (lower = top)
  columnOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Card = mongoose.model('AttackRelayCard', cardSchema);

// ── list ──────────────────────────────────────────────────────────────────────
exports.listCards = async (req, res) => {
  try {
    const cards = await Card.find({ engagementId: req.params.engagementId })
      .sort({ phase: 1, columnOrder: 1, createdAt: -1 })
      .lean();
    res.json(cards);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── create ────────────────────────────────────────────────────────────────────
exports.createCard = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { target, targetType, phase, priority,
            assignedOperatorName, intel, handoffNote } = req.body;

    if (!target?.trim()) return res.status(400).json({ error: 'Target is required' });

    const operatorId   = req.user?._id?.toString() || 'unknown';
    const operatorName = req.user?.name || req.user?.email || 'Unknown Operator';

    const doc = await Card.create({
      engagementId,
      target:     target.trim(),
      targetType: TYPES.includes(targetType) ? targetType : 'host',
      phase:      PHASES.includes(phase) ? phase : 'recon',
      priority:   PRIORITIES.includes(priority) ? priority : 'medium',
      createdByOperatorId:   operatorId,
      createdByOperatorName: operatorName,
      assignedOperatorId:    '',                                   // free-form — set via update
      assignedOperatorName:  (assignedOperatorName || '').trim(),
      intel:       intel || '',
      handoffNote: handoffNote || '',
      history: [{
        from: '', to: (phase || 'recon'),
        operatorId, operatorName,
        note: 'created',
      }],
    });
    res.status(201).json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── update / move ─────────────────────────────────────────────────────────────
exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await Card.findById(id);
    if (!current) return res.status(404).json({ error: 'Card not found' });

    const operatorId   = req.user?._id?.toString() || 'unknown';
    const operatorName = req.user?.name || req.user?.email || 'Unknown Operator';

    const { target, targetType, phase, priority,
            assignedOperatorName, intel, handoffNote, columnOrder } = req.body;

    if (typeof target === 'string' && target.trim()) current.target = target.trim();
    if (TYPES.includes(targetType))       current.targetType = targetType;
    if (PRIORITIES.includes(priority))    current.priority   = priority;
    if (typeof assignedOperatorName === 'string') current.assignedOperatorName = assignedOperatorName.trim();
    if (typeof intel       === 'string')  current.intel       = intel;
    if (typeof handoffNote === 'string')  current.handoffNote = handoffNote;
    if (typeof columnOrder === 'number')  current.columnOrder = columnOrder;

    // Phase transition → record in history
    if (PHASES.includes(phase) && phase !== current.phase) {
      current.history.push({
        from: current.phase,
        to:   phase,
        operatorId, operatorName,
        note: (handoffNote || '').slice(0, 280),
      });
      current.phase = phase;
    }

    const saved = await current.save();
    res.json(saved.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── delete ────────────────────────────────────────────────────────────────────
exports.deleteCard = async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
