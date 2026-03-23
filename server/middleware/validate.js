const { body, validationResult } = require('express-validator');

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

const validateRegister = [
  body('callsign').trim().notEmpty().withMessage('Call-sign is required'),
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handle,
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handle,
];

const validateConfirmSetup = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit authenticator code'),
  handle,
];

const validateVerify2FA = [
  body('tempToken').notEmpty().withMessage('Temporary token is required'),
  body('token').trim().isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit authenticator code'),
  handle,
];

module.exports = { validateRegister, validateLogin, validateConfirmSetup, validateVerify2FA };
