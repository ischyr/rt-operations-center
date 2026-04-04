const express = require('express');
const router  = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/socialMediaController');

router.post('/:engagementId/scan',              protect, ctrl.scan);
router.get( '/:engagementId/history',           protect, ctrl.getHistory);
router.delete('/:engagementId/scan/:scanId',    protect, ctrl.deleteScan);

module.exports = router;
