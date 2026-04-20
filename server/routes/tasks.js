const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/tasksController');
const { protect } = require('../middleware/authMiddleware');

router.get   ('/:engagementId/tasks',                                 protect, ctrl.listTasks);
router.post  ('/:engagementId/tasks',                                 protect, ctrl.createTask);
router.get   ('/:engagementId/tasks/:id',                             protect, ctrl.getTask);
router.patch ('/:engagementId/tasks/:id',                             protect, ctrl.updateTask);
router.delete('/:engagementId/tasks/:id',                             protect, ctrl.deleteTask);
router.post  ('/:engagementId/tasks/:id/checklist/:itemId/toggle',    protect, ctrl.toggleChecklistItem);
router.post  ('/:engagementId/tasks/:id/comments',                    protect, ctrl.addComment);

module.exports = router;
