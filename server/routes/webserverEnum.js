const express       = require('express');
const router        = express.Router();
const ctrl          = require('../controllers/webserverEnumController');
const { protect }   = require('../middleware/authMiddleware');

router.post  ('/:engagementId/scan',                protect, ctrl.startScan);
router.get   ('/:engagementId/scan/:scanId',        protect, ctrl.getScan);
router.delete('/:engagementId/scan/:scanId/cancel', protect, ctrl.cancelScan);
router.get   ('/:engagementId/history',             protect, ctrl.getHistory);
router.delete('/:engagementId/scan/:scanId',        protect, ctrl.deleteScan);

module.exports = router;
