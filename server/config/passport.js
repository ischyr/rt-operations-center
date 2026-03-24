const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User           = require('../models/User');

const BACKEND_URL  = process.env.BACKEND_URL  || 'http://localhost:5000';

// ── Shared: find or create user from OAuth profile ────────────────────────────
const findOrCreate = async (provider, profileId, email, displayName, avatarUrl) => {
  // 1. Find by oauthId + provider
  let user = await User.findOne({ oauthId: profileId, oauthProvider: provider });
  if (user) return user;

  // 2. Link to existing account with the same email
  if (email) {
    user = await User.findOne({ email });
    if (user) {
      user.oauthId       = profileId;
      user.oauthProvider = provider;
      if (avatarUrl && !user.avatar) user.avatar = avatarUrl;
      await user.save();
      return user;
    }
  }

  // 3. Create a new user
  const baseCallsign = (displayName || email?.split('@')[0] || 'operator')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 30);

  // Ensure callsign uniqueness
  let callsign = baseCallsign;
  let suffix   = 1;
  while (await User.findOne({ callsign })) {
    callsign = `${baseCallsign}-${suffix++}`;
  }

  return User.create({
    callsign,
    email:         email || `${profileId}@${provider}.oauth`,
    oauthProvider: provider,
    oauthId:       profileId,
    avatar:        avatarUrl || null,
  });
};

// ── Google ─────────────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/api/oauth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value;
      const avatarUrl = profile.photos?.[0]?.value;
      const user = await findOrCreate('google', profile.id, email, profile.displayName, avatarUrl);
      done(null, user);
    } catch (e) {
      done(e);
    }
  }
));

// ── GitHub ─────────────────────────────────────────────────────────────────────
passport.use(new GitHubStrategy(
  {
    clientID:     process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/api/oauth/github/callback`,
    scope:        ['user:email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value;
      const avatarUrl = profile.photos?.[0]?.value;
      const user = await findOrCreate('github', profile.id, email, profile.displayName || profile.username, avatarUrl);
      done(null, user);
    } catch (e) {
      done(e);
    }
  }
));

// Minimal session serialisation (only used during the OAuth redirect dance)
passport.serializeUser((user, done)   => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (e) {
    done(e);
  }
});

module.exports = passport;
