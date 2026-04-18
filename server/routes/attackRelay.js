const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/attackRelayController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/cards',     protect, ctrl.listCards);
router.post  ('/:engagementId/cards',     protect, ctrl.createCard);
router.patch ('/:engagementId/cards/:id', protect, ctrl.updateCard);
router.delete('/:engagementId/cards/:id', protect, ctrl.deleteCard);

module.exports = router;
