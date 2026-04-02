const router     = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl        = require('../controllers/fileMetaController');

router.get   ('/:engId/entries',                    protect, ctrl.list);
router.post  ('/:engId/entries',                    protect, ctrl.create);
router.get   ('/:engId/entries/:entryId/download',  protect, ctrl.download);
router.delete('/:engId/entries/:entryId',           protect, ctrl.remove);

module.exports = router;
