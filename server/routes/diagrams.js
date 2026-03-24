const express  = require('express');
const router   = express.Router();
const Diagram  = require('../models/Diagram');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// GET /api/diagrams — all diagrams for the logged-in user
router.get('/', async (req, res) => {
  try {
    const diagrams = await Diagram.find({ owner: req.user._id })
      .select('name thumbnail createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(diagrams);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/diagrams/:id — single diagram (full XML)
router.get('/:id', async (req, res) => {
  try {
    const diagram = await Diagram.findOne({ _id: req.params.id, owner: req.user._id });
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json(diagram);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/diagrams — create new diagram
router.post('/', async (req, res) => {
  try {
    const { name, xml, thumbnail } = req.body;
    const diagram = await Diagram.create({ name, xml, thumbnail, owner: req.user._id });
    res.status(201).json(diagram);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/diagrams/:id — update diagram
router.put('/:id', async (req, res) => {
  try {
    const { name, xml, thumbnail } = req.body;
    const diagram = await Diagram.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, xml, thumbnail },
      { new: true }
    );
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json(diagram);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/diagrams/:id
router.delete('/:id', async (req, res) => {
  try {
    const diagram = await Diagram.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!diagram) return res.status(404).json({ message: 'Diagram not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
