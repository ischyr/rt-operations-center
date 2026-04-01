const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const docs = require('../controllers/documentsController');

router.post('/:engId/documents',                  protect, docs.addDocument);
router.get('/:engId/documents/:docId/download',   protect, docs.downloadDocument);
router.delete('/:engId/documents/:docId',         protect, docs.deleteDocument);

module.exports = router;
