const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    severity:       { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], default: 'High' },
    description:    { type: String, default: '' },
    observation:    { type: String, default: '' },
    proofOfConcept: { type: String, default: '' },
    remediation:    { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const activityLogSchema = new mongoose.Schema(
  {
    action:      { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type:    String,
      enum:    ['engagement', 'finding', 'milestone', 'resource', 'team'],
      default: 'engagement',
    },
  },
  { timestamps: true, _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    category: { type: String, enum: ['Infrastructure', 'Network', 'Tools', 'Other'], default: 'Infrastructure' },
    used:     { type: Number, default: 0, min: 0 },
    total:    { type: Number, default: 0, min: 0 },
    color:    { type: String, default: '#9F7AEA' },
  },
  { _id: true }
);

const teamSkillSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    pct:   { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: true }
);

const engagementSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    slug:      { type: String, required: true, trim: true },
    name:      { type: String, required: true, trim: true },
    company:   { type: String, required: true, trim: true },
    type: {
      type:    String,
      enum:    ['External', 'Internal', 'External + Internal', 'Full Scope', 'Phishing', 'Web Application'],
      default: 'External + Internal',
    },
    startDate:   { type: String, default: '' },
    endDate:     { type: String, default: '' },
    operators:   [{ type: String }],
    stage:       { type: String, default: 'Preparing' },
    status: {
      type:    String,
      enum:    ['PREPARING', 'IN PROGRESS', 'REPORTING', 'COMPLETED', 'PAUSED'],
      default: 'PREPARING',
    },
    progress:    { type: Number, min: 0, max: 100, default: 0 },
    findings:    [findingSchema],
    notes:       { type: String, default: '' },
    activityLog: [activityLogSchema],
    resources:      [resourceSchema],
    teamSkills:     [teamSkillSchema],
    operatorSkills: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

engagementSchema.index({ user: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
