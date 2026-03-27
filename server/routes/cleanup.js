const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cl = require('../controllers/cleanupController');

router.post('/:engId/cleanup',                 protect, cl.addCleanup);
router.put('/:engId/cleanup/:cleanupId',       protect, cl.updateCleanup);
router.delete('/:engId/cleanup/:cleanupId',    protect, cl.deleteCleanup);

module.exports = router;
