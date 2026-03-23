const speakeasy = require('speakeasy');
const User      = require('../models/User');

// ── GET /api/users/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id:       user._id,
        callsign: user.callsign,
        email:    user.email,
        role:     user.role,
        avatar:   user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/users/me ─────────────────────────────────────────────────────────
// Update callsign and/or avatar — requires TOTP confirmation.
const updateProfile = async (req, res) => {
  try {
    const { callsign, avatar, totpCode } = req.body;

    const user = await User.findById(req.user._id)
      .select('+twoFactorSecret +twoFactorEnabled');

    if (user.twoFactorEnabled) {
      const valid = speakeasy.totp.verify({
        secret:   user.twoFactorSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
      });
      if (!valid) {
        return res.status(400).json({ message: 'Invalid authenticator code.' });
      }
    }

    if (callsign)           user.callsign = callsign;
    if (avatar !== undefined) user.avatar  = avatar;

    await user.save();

    res.json({
      message: 'Profile updated.',
      user: {
        id:       user._id,
        callsign: user.callsign,
        email:    user.email,
        role:     user.role,
        avatar:   user.avatar,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── PUT /api/users/me/password ────────────────────────────────────────────────
// Change password — requires current password + TOTP confirmation.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, totpCode } = req.body;

    const user = await User.findById(req.user._id)
      .select('+password +twoFactorSecret +twoFactorEnabled');

    const passwordOk = await user.comparePassword(currentPassword);
    if (!passwordOk) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    if (user.twoFactorEnabled) {
      const valid = speakeasy.totp.verify({
        secret:   user.twoFactorSecret,
        encoding: 'base32',
        token:    totpCode,
        window:   1,
      });
      if (!valid) {
        return res.status(400).json({ message: 'Invalid authenticator code.' });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ── GET /api/users/all ────────────────────────────────────────────────────────
// Returns all users' public info — used for operator assignment pickers.
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('callsign email role avatar').sort({ callsign: 1 });
    res.json(users.map((u) => ({
      id:       u._id,
      callsign: u.callsign,
      email:    u.email,
      role:     u.role,
      avatar:   u.avatar,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getMe, updateProfile, changePassword, getAllUsers };
