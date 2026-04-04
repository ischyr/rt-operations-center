const router  = require('express').Router();
const ctrl    = require('../controllers/mfaPushController');
const { protect } = require('../middleware/authMiddleware');

router.get('/targets',               protect, ctrl.getTargets);
router.post('/targets',              protect, ctrl.createTarget);
router.put('/targets/:id',           protect, ctrl.updateTarget);
router.delete('/targets/:id',        protect, ctrl.deleteTarget);
router.delete('/targets',            protect, ctrl.clearTargets);
router.post('/targets/:id/push',     protect, ctrl.pushTarget);
router.post('/targets/:id/respond',  protect, ctrl.respondTarget);
router.post('/targets/:id/reset',    protect, ctrl.resetTarget);

router.get('/events',    protect, ctrl.getEvents);
router.delete('/events', protect, ctrl.clearEvents);

module.exports = router;
