const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { protect } = require('../middleware/authMiddleware');
const ctrl        = require('../controllers/bloodhoundController');

// Use disk storage for large ZIPs (up to 512MB)
const uploadDir = path.join(__dirname, '../uploads/bloodhound');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512 MB
  fileFilter: (_, file, cb) => {
    const ok = file.originalname.toLowerCase().endsWith('.zip') ||
               file.originalname.toLowerCase().endsWith('.json');
    cb(null, ok);
  },
});

router.post('/:engagementId/import',          protect, upload.array('files', 30), ctrl.importData);
router.get('/:engagementId/session',          protect, ctrl.getSession);
router.get('/:engagementId/findings',         protect, ctrl.getFindings);
router.patch('/:engagementId/findings/:id',   protect, ctrl.updateFinding);
router.delete('/:engagementId/session',       protect, ctrl.clearSession);

module.exports = router;
