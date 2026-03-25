const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/authMiddleware');
const leakx    = require('../controllers/leakxController');

router.post('/:engId/scan',            protect, leakx.scan);
router.delete('/:engId/scans/:scanId', protect, leakx.deleteScan);

module.exports = router;
