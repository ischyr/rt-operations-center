const mongoose = require('mongoose');

const kerberosTicketSchema = new mongoose.Schema({
  engagementSlug: { type: String, required: true, index: true },
  label:          { type: String, default: '' },
  fileName:       { type: String, default: '' },
  savedBy:        { type: String, default: 'Unknown' },
  result:         { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

kerberosTicketSchema.index({ engagementSlug: 1, createdAt: -1 });

module.exports = mongoose.model('KerberosTicket', kerberosTicketSchema);
