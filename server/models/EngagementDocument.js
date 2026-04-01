const mongoose = require('mongoose');

// Stores raw file data separately from the Engagement document to keep
// the main engagement payload lean (metadata only in the Engagement).
const schema = new mongoose.Schema(
  {
    engagementId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Engagement',
      required: true,
      index:    true,
    },
    documentId: { type: String, required: true }, // matches the subdocument _id in Engagement
    data:       { type: String, required: true }, // base64-encoded file content
    mimeType:   { type: String, default: 'application/octet-stream' },
  },
  { timestamps: false },
);

schema.index({ engagementId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('EngagementDocument', schema);
