const jwt = require('jsonwebtoken');

// Full session token — issued only after full auth (credentials + 2FA)
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Short-lived token issued during the 2FA challenge window
const signTempToken = (id) =>
  jwt.sign({ id, type: 'totp_pending' }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });

// Verify a full session token (rejects tempTokens via type check)
const verifyToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type === 'totp_pending') {
    throw new Error('Token is a pending 2FA token, not a session token');
  }
  return decoded;
};

// Verify a tempToken — rejects full session tokens
const verifyTempToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'totp_pending') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

module.exports = { signToken, signTempToken, verifyToken, verifyTempToken };
