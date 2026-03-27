const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const loot = require('../controllers/lootController');

router.post('/:engId/loot',           protect, loot.addLoot);
router.put('/:engId/loot/:lootId',    protect, loot.updateLoot);
router.delete('/:engId/loot/:lootId', protect, loot.deleteLoot);

module.exports = router;
