const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/evilOAuthController');

router.post('/generate-url',   protect, ctrl.generateUrl);
router.get('/callback',                 ctrl.callback);        // public — OAuth redirect
router.post('/exchange',       protect, ctrl.exchange);
router.get('/captures',        protect, ctrl.getCaptures);
router.delete('/captures/:id', protect, ctrl.deleteCapture);
router.delete('/captures',     protect, ctrl.clearCaptures);

module.exports = router;
