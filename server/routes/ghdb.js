const router = require('express').Router();
const ctrl   = require('../controllers/ghdbController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',             protect, ctrl.list);
router.get('/meta',         protect, ctrl.meta);
router.get('/categories',   protect, ctrl.categories);
router.get('/file-status',  protect, ctrl.fileStatus);
router.post('/import',      protect, ctrl.importFromFile);

module.exports = router;
