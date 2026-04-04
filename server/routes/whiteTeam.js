const express         = require('express');
const router          = express.Router();
const { protect }     = require('../middleware/authMiddleware');
const ctrl            = require('../controllers/whiteTeamController');

router.post('/:engagementId/connect',                    protect, ctrl.connect);
router.get('/:engagementId/status',                      protect, ctrl.getStatus);
router.get('/:engagementId/groups',                      protect, ctrl.getGroups);
router.post('/:engagementId/select-group',               protect, ctrl.selectGroup);
router.post('/:engagementId/sync',                       protect, ctrl.sync);
router.get('/:engagementId/messages',                    protect, ctrl.getMessages);
router.patch('/:engagementId/messages/:messageId/star',  protect, ctrl.starMessage);
router.delete('/:engagementId/disconnect',               protect, ctrl.disconnect);
router.delete('/:engagementId/messages',                 protect, ctrl.clearMessages);

module.exports = router;
