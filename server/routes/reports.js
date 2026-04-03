const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generate } = require('../controllers/reportController');

router.post('/:engId/generate', protect, generate);

module.exports = router;
