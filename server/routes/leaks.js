const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');
const { protect } = require('../middleware/authMiddleware');
const ctrl        = require('../controllers/leaksController');

// Disk storage — files stored per-engagement with collision-safe filename
const storage = multer.diskStorage({
  destination: (req, _, cb) => {
    const dir = path.join(__dirname, '..', 'leaks', req.params.engagementId || 'misc');
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    cb(null, dir);
  },
  filename: (_, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
    cb(null, `${Date.now()}-${id}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512 MB
});

router.get   ('/:engagementId/entries',                  protect, ctrl.listEntries);
router.get   ('/:engagementId/entries/:id',              protect, ctrl.getEntry);
router.post  ('/:engagementId/entries',                  protect, upload.single('file'), ctrl.createEntry);
router.patch ('/:engagementId/entries/:id',              protect, ctrl.updateEntry);
router.delete('/:engagementId/entries/:id',              protect, ctrl.deleteEntry);
router.get   ('/:engagementId/entries/:id/download',     protect, ctrl.downloadFile);
router.get   ('/:engagementId/stats',                    protect, ctrl.getStats);
router.get   ('/:engagementId/export-ulp',               protect, ctrl.exportUlp);

module.exports = router;
