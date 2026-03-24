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

const calendarEventSchema = new mongoose.Schema(
  {
    type:              { type: String, enum: ['task', 'blocker'], default: 'task' },
    title:             { type: String, required: true, trim: true },
    date:              { type: String, required: true },   // YYYY-MM-DD
    startTime:         { type: String, default: '' },      // HH:MM
    endTime:           { type: String, default: '' },      // HH:MM
    operatorId:        { type: String, default: '' },
    createdBy:         { type: String, default: '' },      // user _id
    createdByCallsign: { type: String, default: '' },      // display name
  },
  { timestamps: true, _id: true }
);

const teamSkillSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    pct:   { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: true }
);

const personaSchema = new mongoose.Schema(
  {
    fullName:          { type: String, default: '' },
    gender:            { type: String, default: '' },
    birthday:          { type: String, default: '' },
    age:               { type: Number, default: 0  },
    nationality:       { type: String, default: '' },
    email:             { type: String, default: '' },
    username:          { type: String, default: '' },
    password:          { type: String, default: '' },
    phone:             { type: String, default: '' },
    address:           { type: String, default: '' },
    city:              { type: String, default: '' },
    state:             { type: String, default: '' },
    zipCode:           { type: String, default: '' },
    country:           { type: String, default: '' },
    height:            { type: String, default: '' },
    weight:            { type: String, default: '' },
    eyeColor:          { type: String, default: '' },
    hairColor:         { type: String, default: '' },
    bloodType:         { type: String, default: '' },
    occupation:        { type: String, default: '' },
    company:           { type: String, default: '' },
    website:           { type: String, default: '' },
    notes:             { type: String, default: '' },
    createdBy:         { type: String, default: '' },
    createdByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const ttxPhaseSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tactics:     { type: String, default: '' },
    tools:       { type: String, default: '' },
    assignedTo:  [{ type: String }],
    status:      { type: String, enum: ['Pending', 'In Progress', 'Done', 'Blocked'], default: 'Pending' },
    order:       { type: Number, default: 0 },
  },
  { timestamps: true, _id: true }
);

const skillRequestSchema = new mongoose.Schema(
  {
    skill:               { type: String, required: true, trim: true },
    category:            { type: String, default: 'Other' },
    priority:            { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    description:         { type: String, default: '' },
    status:              { type: String, enum: ['Open', 'Learning', 'Resolved'], default: 'Open' },
    assignedTo:          [{ type: String }],
    requestedBy:         { type: String, default: '' },
    requestedByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
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
    operatorSkills:  { type: mongoose.Schema.Types.Mixed, default: {} },
    calendarEvents:  [calendarEventSchema],
    skillRequests:   [skillRequestSchema],
    personas:        [personaSchema],
    ttxObjective:    { type: String, default: '' },
    ttxNotes:        { type: String, default: '' },
    ttxPhases:       [ttxPhaseSchema],
  },
  { timestamps: true }
);

engagementSchema.index({ user: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
