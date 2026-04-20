const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/bingoController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/card',                  protect, ctrl.getCard);
router.post  ('/:engagementId/card/template',         protect, ctrl.changeTemplate);
router.post  ('/:engagementId/squares/:squareId/claim',   protect, ctrl.claimSquare);
router.delete('/:engagementId/squares/:squareId/claim',   protect, ctrl.unclaimSquare);
router.patch ('/:engagementId/squares/:squareId',         protect, ctrl.updateSquare);
router.get   ('/:engagementId/leaderboard',           protect, ctrl.getLeaderboard);

module.exports = router;
