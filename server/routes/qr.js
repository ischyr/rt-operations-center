const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const qr = require('../controllers/qrController');

router.post('/:engId/qr',                protect, qr.createQR);
router.put('/:engId/qr/:qrId',           protect, qr.updateQR);
router.delete('/:engId/qr/:qrId',        protect, qr.deleteQR);
router.patch('/:engId/qr/:qrId/toggle',  protect, qr.toggleActive);

// Public scan tracking endpoint (no auth!)
router.get('/scan/:shortCode', qr.trackScan);

module.exports = router;
