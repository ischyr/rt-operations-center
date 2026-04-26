const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, ctrl.search);

module.exports = router;
