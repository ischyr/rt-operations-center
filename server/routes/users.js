const router = require('express').Router();
const { getMe, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validateUpdateProfile, validateChangePassword } = require('../middleware/validate');

router.get('/me',          protect, getMe);
router.put('/me',          protect, validateUpdateProfile,  updateProfile);
router.put('/me/password', protect, validateChangePassword, changePassword);

module.exports = router;
