const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ab = require('../controllers/assumedBreachController');

router.post('/:engId/scenarios',                  protect, ab.createScenario);
router.put('/:engId/scenarios/:scenarioId',       protect, ab.updateScenario);
router.delete('/:engId/scenarios/:scenarioId',    protect, ab.deleteScenario);

module.exports = router;
