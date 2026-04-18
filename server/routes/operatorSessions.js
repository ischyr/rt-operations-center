const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/operatorSessionController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/sessions',            protect, ctrl.listSessions);
router.post  ('/:engagementId/sessions',            protect, ctrl.createSession);
router.patch ('/:engagementId/sessions/:id',        protect, ctrl.updateSession);
router.post  ('/:engagementId/sessions/:id/ping',   protect, ctrl.pingSession);
router.delete('/:engagementId/sessions/:id',        protect, ctrl.deleteSession);

module.exports = router;
