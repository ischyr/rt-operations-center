const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');

router.get ('/:engagementId/config',      protect, ctrl.getConfig);
router.post('/:engagementId/config',      protect, ctrl.saveConfig);
router.post('/:engagementId/detect-chat', protect, ctrl.detectChatId);
router.post('/:engagementId/test',        protect, ctrl.sendTest);
router.get   ('/:engagementId/alerts',      protect, ctrl.getAlerts);
router.delete('/:engagementId/alerts',      protect, ctrl.clearAlerts);

module.exports = router;
