const mongoose = require('mongoose');

const emailLeakCacheSchema = new mongoose.Schema(
  {
    query:   { type: String, required: true, lowercase: true, trim: true },
    type:    { type: String, required: true, enum: ['account', 'domain'], default: 'account' },
    found:   { type: Boolean, default: false },
    total:   { type: Number, default: 0 },
    results: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

emailLeakCacheSchema.index({ query: 1, type: 1 }, { unique: true });
// Auto-expire after 30 days
emailLeakCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('EmailLeakCache', emailLeakCacheSchema);
