const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const sub     = require('../controllers/subdomainsController');

router.post('/:engId/scan',                  protect, sub.startScan);
router.get('/:engId/scans/:scanId/status',   protect, sub.getStatus);
router.delete('/:engId/scans/:scanId',       protect, sub.deleteScan);

module.exports = router;
