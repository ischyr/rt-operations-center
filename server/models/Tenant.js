const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const tenantSchema = new mongoose.Schema(
  {
    company:      { type: String, required: true, trim: true },
    contactName:  { type: String, default: '' },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    password:     { type: String, required: true, select: false },
    engagement:   { type: mongoose.Schema.Types.ObjectId, ref: 'Engagement', required: true },
    enabled:      { type: Boolean, default: true },
    lastLogin:    { type: Date, default: null },
    createdBy:         { type: String, default: '' },
    createdByCallsign: { type: String, default: '' },
  },
  { timestamps: true }
);

tenantSchema.index({ contactEmail: 1, engagement: 1 }, { unique: true });

tenantSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

tenantSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Tenant', tenantSchema);
