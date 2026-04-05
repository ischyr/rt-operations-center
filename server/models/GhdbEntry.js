const mongoose = require('mongoose');

const ghdbEntrySchema = new mongoose.Schema({
  ghdbId:    { type: String, unique: true },
  dork:      { type: String, required: true },
  category:  { type: String, default: 'Uncategorized' },
  author:    { type: String, default: 'Unknown' },
  dateAdded: { type: String, default: '' },
}, { timestamps: false });

ghdbEntrySchema.index({ dork: 'text', category: 'text', author: 'text' });
ghdbEntrySchema.index({ category: 1 });

const GhdbMeta = mongoose.model('GhdbMeta', new mongoose.Schema({
  lastSync:    { type: Date, default: null },
  totalFetched:{ type: Number, default: 0 },
}));

const GhdbEntry = mongoose.model('GhdbEntry', ghdbEntrySchema);

module.exports = { GhdbEntry, GhdbMeta };
