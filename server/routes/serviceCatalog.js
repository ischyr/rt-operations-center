const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/serviceCatalogController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/services',         protect, ctrl.list);
router.post  ('/:engagementId/services',         protect, ctrl.create);
router.post  ('/:engagementId/services/bulk',    protect, ctrl.bulk);
router.get   ('/:engagementId/services/:id',     protect, ctrl.get);
router.patch ('/:engagementId/services/:id',     protect, ctrl.update);
router.delete('/:engagementId/services/:id',     protect, ctrl.remove);
router.get   ('/:engagementId/stats',            protect, ctrl.stats);

module.exports = router;
