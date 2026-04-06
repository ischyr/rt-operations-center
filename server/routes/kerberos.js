const express    = require('express');
const multer     = require('multer');
const { protect } = require('../middleware/authMiddleware');
const ctrl       = require('../controllers/kerberosController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/parse',        protect, upload.single('file'), ctrl.parse);
router.get('/history',       protect, ctrl.listHistory);
router.post('/history',      protect, ctrl.saveHistory);
router.get('/history/:id',   protect, ctrl.getHistory);
router.delete('/history/:id',protect, ctrl.deleteHistory);

module.exports = router;
