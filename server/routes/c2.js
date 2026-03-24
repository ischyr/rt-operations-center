const router  = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const c2      = require('../controllers/c2Controller');

router.post(  '/:engId/deploy',                 protect, c2.deploy);
router.post(  '/:engId/destroy/:deployId',      protect, c2.destroy);
router.get(   '/:engId/status/:deployId',       protect, c2.getStatus);
router.delete('/:engId/deployments/:deployId',  protect, c2.deleteDeployment);

module.exports = router;
