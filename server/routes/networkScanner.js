const express = require('express');
const router  = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/networkScannerController');

router.post(  '/:engagementId/scan',            protect, ctrl.startScan);
router.get(   '/:engagementId/scan/:scanId',    protect, ctrl.getScan);
router.delete('/:engagementId/scan/:scanId/cancel', protect, ctrl.cancelScan);
router.get(   '/:engagementId/history',         protect, ctrl.getHistory);
router.delete('/:engagementId/scan/:scanId',    protect, ctrl.deleteScan);

module.exports = router;
