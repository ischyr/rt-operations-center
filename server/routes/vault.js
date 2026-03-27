const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const vault = require('../controllers/vaultController');

router.post('/:engId/vault',                    protect, vault.addEntry);
router.put('/:engId/vault/:entryId',            protect, vault.updateEntry);
router.delete('/:engId/vault/:entryId',         protect, vault.deleteEntry);
router.patch('/:engId/vault/:entryId/favorite', protect, vault.toggleFavorite);

module.exports = router;
