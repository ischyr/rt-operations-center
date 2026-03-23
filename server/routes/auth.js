const router = require('express').Router();
const { register, login, confirmSetup2FA, verify2FA } = require('../controllers/authController');
const { validateRegister, validateLogin, validateConfirmSetup, validateVerify2FA } = require('../middleware/validate');

router.post('/register',         validateRegister,     register);
router.post('/confirm-2fa-setup',validateConfirmSetup, confirmSetup2FA);
router.post('/login',            validateLogin,        login);
router.post('/verify-2fa',       validateVerify2FA,    verify2FA);

module.exports = router;
