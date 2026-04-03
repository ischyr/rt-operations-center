const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/deviceCodeController');

router.post('/initiate',     protect, ctrl.initiate);
router.post('/poll',         protect, ctrl.poll);
router.post('/refresh',      protect, ctrl.refresh);
router.post('/graph',        protect, ctrl.graphProxy);
router.post('/send-mail',    protect, ctrl.sendMail);
// open-outlook uses token from query string for browser window navigation
router.get('/open-outlook', (req, res, next) => {
  // Allow JWT via ?t= query param since this is opened in a new browser window
  if (req.query.t) req.headers.authorization = `Bearer ${req.query.t}`;
  next();
}, require('../middleware/authMiddleware').protect, ctrl.openOutlook);

module.exports = router;
