const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEngagements,
  createEngagement,
  updateEngagement,
  deleteEngagement,
} = require('../controllers/engagementController');

router.get('/',    protect, getEngagements);
router.post('/',   protect, createEngagement);
router.put('/:id', protect, updateEngagement);
router.delete('/:id', protect, deleteEngagement);

module.exports = router;
