const router    = require('express').Router();
const passport  = require('../config/passport');
const { signToken } = require('../utils/token');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const buildRedirect = (user) => {
  const token    = signToken(user._id);
  const userJson = encodeURIComponent(JSON.stringify({
    id:            user._id,
    callsign:      user.callsign,
    email:         user.email,
    role:          user.role,
    avatar:        user.avatar,
    oauthProvider: user.oauthProvider,
  }));
  return `${FRONTEND_URL}/oauth/callback?token=${token}&user=${userJson}`;
};

// ── Google ─────────────────────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: true })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/signin?error=oauth`, session: true }),
  (req, res) => res.redirect(buildRedirect(req.user))
);

// ── GitHub ─────────────────────────────────────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: true })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/signin?error=oauth`, session: true }),
  (req, res) => res.redirect(buildRedirect(req.user))
);

module.exports = router;
