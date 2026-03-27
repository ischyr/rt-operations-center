const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ev = require('../controllers/evidenceController');

router.post('/:engId/evidence',                protect, ev.addEvidence);
router.put('/:engId/evidence/:evidenceId',     protect, ev.updateEvidence);
router.delete('/:engId/evidence/:evidenceId',  protect, ev.deleteEvidence);

module.exports = router;
