const speakeasy = require('speakeasy');
const QRCode    = require('qrcode');
const User      = require('../models/User');
const { signToken, signTempToken, verifyTempToken } = require('../utils/token');

// ── Register ──────────────────────────────────────────────────────────────────
// Creates the user, generates a TOTP secret, returns a QR code for setup.
// The user must confirm their first OTP before receiving a session token.
const register = async (req, res) => {
  try {
    const { callsign, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Generate TOTP secret — stored as tempSecret until user confirms
    const secret = speakeasy.generateSecret({
      name:   `RedTeamOps (${email})`,
      length: 20,
    });

    const user = await User.create({
      callsign,
      email,
      password,
      twoFactorTempSecret: secret.base32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.status(201).json({
      message:    'Scan the QR code with Google Authenticator, then enter the 6-digit code to activate.',
      qrCode,
      tempSecret: secret.base32, // shown for manual entry in authenticator app
      email,                     // echoed back so the frontend can send it to confirm-setup
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── Confirm 2FA Setup ─────────────────────────────────────────────────────────
// Called after the user scans the QR and enters their first 6-digit code.
// Promotes twoFactorTempSecret → twoFactorSecret and sets twoFactorEnabled.
const confirmSetup2FA = async (req, res) => {
  try {
    const { email, token } = req.body;

    const user = await User.findOne({ email })
      .select('+twoFactorTempSecret +twoFactorEnabled');

    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ message: 'Setup session expired. Please register again.' });
    }

    const valid = speakeasy.totp.verify({
      secret:   user.twoFactorTempSecret,
      encoding: 'base32',
      token,
      window:   1,
    });

    if (!valid) {
      return res.status(400).json({ message: 'Invalid authenticator code. Try again.' });
    }

    // Promote temp secret → live secret, mark 2FA as enabled
    user.twoFactorSecret     = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled    = true;
    await user.save();

    const sessionToken = signToken(user._id);

    res.json({
      message: `2FA activated. Welcome, ${user.callsign}.`,
      token:   sessionToken,
      user: {
        id:       user._id,
        callsign: user.callsign,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
// Three branches:
//   A) 2FA enabled        → return tempToken, frontend shows TOTP input
//   B) 2FA setup pending  → return QR code again so user can complete setup
//   C) No 2FA (legacy)    → return full session token immediately
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select('+password +twoFactorSecret +twoFactorEnabled +twoFactorTempSecret');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials. Verify and retry.' });
    }

    // Branch A — 2FA fully set up
    if (user.twoFactorEnabled) {
      return res.json({
        requires2FA: true,
        tempToken:   signTempToken(user._id),
      });
    }

    // Branch B — registered but setup never completed
    if (user.twoFactorTempSecret) {
      const qrCode = await QRCode.toDataURL(
        speakeasy.otpauthURL({
          secret:   user.twoFactorTempSecret,
          label:    email,
          issuer:   'RedTeamOps',
          encoding: 'base32',
        })
      );
      return res.json({
        requiresSetup: true,
        qrCode,
        tempSecret: user.twoFactorTempSecret,
        email,
      });
    }

    // Branch C — legacy / no 2FA
    const sessionToken = signToken(user._id);
    res.json({
      message: `Access granted. Welcome, ${user.callsign}.`,
      token:   sessionToken,
      user: {
        id:       user._id,
        callsign: user.callsign,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── Verify 2FA (login step 2) ─────────────────────────────────────────────────
// Validates the tempToken + TOTP code and issues a full session token.
const verify2FA = async (req, res) => {
  try {
    const { tempToken, token } = req.body;

    let decoded;
    try {
      decoded = verifyTempToken(tempToken);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    const user = await User.findById(decoded.id).select('+twoFactorSecret');

    if (!user || !user.twoFactorSecret) {
      return res.status(401).json({ message: 'Operator not found.' });
    }

    const valid = speakeasy.totp.verify({
      secret:   user.twoFactorSecret,
      encoding: 'base32',
      token,
      window:   1,
    });

    if (!valid) {
      return res.status(401).json({ message: 'Invalid or expired authenticator code.' });
    }

    const sessionToken = signToken(user._id);

    res.json({
      message: `Access granted. Welcome, ${user.callsign}.`,
      token:   sessionToken,
      user: {
        id:       user._id,
        callsign: user.callsign,
        email:    user.email,
        role:     user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login, confirmSetup2FA, verify2FA };
