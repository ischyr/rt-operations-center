const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    callsign: {
      type:      String,
      required:  [true, 'Call-sign is required'],
      trim:      true,
      maxlength: [50, 'Call-sign cannot exceed 50 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:   String,
      select: false,
      // Not required — OAuth users have no password
    },
    oauthProvider: {
      type: String,
      enum: ['google', 'github', null],
      default: null,
    },
    oauthId: {
      type:   String,
      select: false,
      default: null,
    },
    role: {
      type:    String,
      enum:    ['operator', 'admin'],
      default: 'operator',
    },
    // 2FA — confirmed live secret (set after user verifies setup)
    twoFactorSecret: {
      type:   String,
      select: false,
    },
    // 2FA — temporary secret held until user confirms first OTP
    twoFactorTempSecret: {
      type:   String,
      select: false,
    },
    // True once the user has successfully confirmed their first OTP
    twoFactorEnabled: {
      type:    Boolean,
      default: false,
    },
    // Profile picture stored as a base64 data URL (resized to 150×150 on client)
    avatar: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
