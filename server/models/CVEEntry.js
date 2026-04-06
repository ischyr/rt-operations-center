const mongoose = require('mongoose');

const cveEntrySchema = new mongoose.Schema({
  engagementSlug:  { type: String, required: true, index: true },
  cveId:           { type: String, required: true },
  title:           { type: String, default: '' },
  description:     { type: String, default: '' },
  cvssScore:       { type: Number, default: null },
  cvssVector:      { type: String, default: '' },
  affectedProduct: { type: String, default: '' },
  affectedVersion: { type: String, default: '' },
  pocAvailable:    { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
  pocLinks:        [{ type: String }],
  references:      [{ type: String }],
  status:          { type: String, enum: ['researching', 'exploitable', 'not-exploitable', 'patched', 'n/a'], default: 'researching' },
  notes:           { type: String, default: '' },
  tags:            [{ type: String }],
  addedBy:         { type: String, default: 'Unknown' },
}, { timestamps: true });

cveEntrySchema.index({ engagementSlug: 1, createdAt: -1 });

module.exports = mongoose.model('CVEEntry', cveEntrySchema);
