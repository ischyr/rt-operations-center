const mongoose = require('mongoose');

const STATUSES   = ['backlog', 'in-progress', 'blocked', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

// ── Schemas ────────────────────────────────────────────────────────────────────
const contentBlockSchema = new mongoose.Schema({
  type:     { type: String, enum: ['text', 'code', 'image'], default: 'text' },
  content:  { type: String, default: '' },   // image = base64 data URL
  language: { type: String, default: '' },
  caption:  { type: String, default: '' },
}, { _id: true });

const checklistItemSchema = new mongoose.Schema({
  text:                    { type: String, required: true, trim: true },
  done:                    { type: Boolean, default: false },
  completedByOperatorId:   { type: String, default: '' },
  completedByOperatorName: { type: String, default: '' },
  completedAt:             { type: Date,   default: null },
}, { _id: true });

const commentSchema = new mongoose.Schema({
  operatorId:   String,
  operatorName: String,
  text:         { type: String, required: true },
  at:           { type: Date, default: Date.now },
}, { _id: true });

const taskSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },

  status:       { type: String, enum: STATUSES,   default: 'backlog', index: true },
  priority:     { type: String, enum: PRIORITIES, default: 'medium' },

  assignedOperatorId:   { type: String, default: '' },
  assignedOperatorName: { type: String, default: '' },

  createdByOperatorId:   { type: String, default: '' },
  createdByOperatorName: { type: String, default: '' },

  dueDate:   { type: Date, default: null },
  tags:      [{ type: String }],

  blocks:    [contentBlockSchema],
  checklist: [checklistItemSchema],
  comments:  [commentSchema],

  columnOrder: { type: Number, default: 0 },
  completedAt: { type: Date,   default: null },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
function operatorFromReq(req) {
  return {
    id:   req.user?._id?.toString() || '',
    name: req.user?.name || req.user?.email || 'Operator',
  };
}

// ── listTasks ──────────────────────────────────────────────────────────────────
exports.listTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ engagementId: req.params.engagementId })
      .select('-blocks -comments')                  // list view = lightweight
      .sort({ status: 1, columnOrder: 1, createdAt: -1 })
      .lean();
    res.json(tasks);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── getTask ────────────────────────────────────────────────────────────────────
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).lean();
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── createTask ─────────────────────────────────────────────────────────────────
exports.createTask = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const op = operatorFromReq(req);

    const {
      title, description, status, priority,
      assignedOperatorId, assignedOperatorName,
      dueDate, tags, blocks, checklist,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

    const doc = await Task.create({
      engagementId,
      title: title.trim(),
      description: description || '',
      status:   STATUSES.includes(status)     ? status   : 'backlog',
      priority: PRIORITIES.includes(priority) ? priority : 'medium',
      assignedOperatorId:   (assignedOperatorId   || '').trim(),
      assignedOperatorName: (assignedOperatorName || '').trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      blocks:    Array.isArray(blocks)    ? blocks    : [],
      checklist: Array.isArray(checklist) ? checklist : [],
      createdByOperatorId:   op.id,
      createdByOperatorName: op.name,
    });
    res.status(201).json(doc.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── updateTask ─────────────────────────────────────────────────────────────────
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });

    const {
      title, description, status, priority,
      assignedOperatorId, assignedOperatorName,
      dueDate, tags, blocks, checklist,
      columnOrder,
    } = req.body;

    if (typeof title === 'string' && title.trim()) task.title = title.trim();
    if (typeof description === 'string')          task.description = description;

    if (STATUSES.includes(status) && status !== task.status) {
      task.status = status;
      task.completedAt = status === 'done' ? new Date() : null;
    }
    if (PRIORITIES.includes(priority)) task.priority = priority;

    if (typeof assignedOperatorId   === 'string') task.assignedOperatorId   = assignedOperatorId.trim();
    if (typeof assignedOperatorName === 'string') task.assignedOperatorName = assignedOperatorName.trim();
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (Array.isArray(tags)) task.tags = tags;
    else if (typeof tags === 'string') task.tags = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (Array.isArray(blocks))    task.blocks    = blocks;
    if (Array.isArray(checklist)) task.checklist = checklist;
    if (typeof columnOrder === 'number') task.columnOrder = columnOrder;

    await task.save();
    res.json(task.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteTask ─────────────────────────────────────────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── toggleChecklistItem ────────────────────────────────────────────────────────
exports.toggleChecklistItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const op = operatorFromReq(req);

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Not found' });

    const item = task.checklist.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.done = !item.done;
    if (item.done) {
      item.completedByOperatorId   = op.id;
      item.completedByOperatorName = op.name;
      item.completedAt             = new Date();
    } else {
      item.completedByOperatorId   = '';
      item.completedByOperatorName = '';
      item.completedAt             = null;
    }
    await task.save();
    res.json(task.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── addComment ────────────────────────────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });

    const op = operatorFromReq(req);
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Not found' });

    task.comments.push({
      operatorId: op.id, operatorName: op.name, text: text.trim(),
    });
    await task.save();
    res.json(task.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};
