const mongoose = require('mongoose');

const diagramSchema = new mongoose.Schema(
  {
    name:      { type: String, default: 'Untitled Diagram' },
    xml:       { type: String, required: true },
    thumbnail: { type: String, default: null }, // base64 PNG data URL
    owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Diagram', diagramSchema);
