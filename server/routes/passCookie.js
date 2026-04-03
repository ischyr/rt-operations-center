const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/passCookieController');

router.post('/test',         protect, ctrl.testCookie);
router.post('/open-session', protect, ctrl.openSession);

module.exports = router;
