const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/jwtStudioController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/analyses',     protect, ctrl.list);
router.post  ('/:engagementId/analyses',     protect, ctrl.create);
router.patch ('/:engagementId/analyses/:id', protect, ctrl.update);
router.delete('/:engagementId/analyses/:id', protect, ctrl.remove);

module.exports = router;
