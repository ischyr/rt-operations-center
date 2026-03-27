const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ph = require('../controllers/phishingController');

// Web templates
router.post('/:engId/web', protect, ph.addWebTemplate);
router.put('/:engId/web/:tplId', protect, ph.updateWebTemplate);
router.delete('/:engId/web/:tplId', protect, ph.deleteWebTemplate);

// Email templates
router.post('/:engId/email', protect, ph.addEmailTemplate);
router.put('/:engId/email/:tplId', protect, ph.updateEmailTemplate);
router.delete('/:engId/email/:tplId', protect, ph.deleteEmailTemplate);

// Config
router.get('/:engId/config', protect, ph.getConfig);
router.put('/:engId/config', protect, ph.updateConfig);

module.exports = router;
