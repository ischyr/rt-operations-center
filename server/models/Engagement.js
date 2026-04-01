const mongoose = require('mongoose');

const contentBlockSchema = new mongoose.Schema(
  {
    type:     { type: String, enum: ['text', 'code', 'image'], default: 'text' },
    content:  { type: String, default: '' },
    language: { type: String, default: '' },
    caption:  { type: String, default: '' },
  },
  { _id: true }
);

const findingSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    severity:       { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], default: 'High' },
    description:    { type: String, default: '' },
    observation:    { type: String, default: '' },
    proofOfConcept: { type: String, default: '' },
    remediation:    { type: String, default: '' },
    observationBlocks:    [contentBlockSchema],
    proofOfConceptBlocks: [contentBlockSchema],
    remediationBlocks:    [contentBlockSchema],
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

const subdomainScanSchema = new mongoose.Schema(
  {
    domain:     { type: String, required: true },
    status:     { type: String, enum: ['running', 'completed', 'partial', 'failed'], default: 'running' },
    toolsUsed:  [{ type: String }],
    results:    { type: mongoose.Schema.Types.Mixed, default: { subfinder: [], amass: [], bbot: [] } },
    totalUnique: [{ type: String }],
    toolStatus:  { type: mongoose.Schema.Types.Mixed, default: {} },
    errors:      { type: mongoose.Schema.Types.Mixed, default: {} },
    scannedBy:         { type: String, default: '' },
    scannedByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const leakxScanSchema = new mongoose.Schema(
  {
    domain:            { type: String, required: true },
    data:              { type: mongoose.Schema.Types.Mixed, default: {} },
    scannedBy:         { type: String, default: '' },
    scannedByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const c2DeploymentSchema = new mongoose.Schema(
  {
    template:          { type: String, default: 'digitalocean-droplet' },
    name:              { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['pending', 'deploying', 'running', 'destroying', 'destroyed', 'failed'],
      default: 'pending',
    },
    config:            { type: mongoose.Schema.Types.Mixed, default: {} },
    output:            { type: String, default: '' },
    ipAddress:         { type: String, default: '' },
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

const evidenceSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    type: {
      type:    String,
      enum:    ['Command', 'Finding', 'Access', 'Network', 'Exfil', 'Screenshot', 'Note', 'Other'],
      default: 'Note',
    },
    content:            { type: String, default: '' },
    images:             [{ type: String }],
    tags:               [{ type: String }],
    timestamp:          { type: Date, default: Date.now },
    capturedBy:         { type: String, default: '' },
    capturedByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const cleanupSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    artifactType: {
      type:    String,
      enum:    ['File', 'Registry', 'Process', 'Network', 'Credential', 'Service', 'Script', 'Other'],
      default: 'File',
    },
    path:               { type: String, default: '' },
    commands:           { type: String, default: '' },
    beforeProof:        { type: String, default: '' },
    afterProof:         { type: String, default: '' },
    beforeImages:       [{ type: String }],
    afterImages:        [{ type: String }],
    notes:              { type: String, default: '' },
    tags:               [{ type: String }],
    status:             { type: String, enum: ['Pending', 'Cleaned'], default: 'Pending' },
    cleanedBy:          { type: String, default: '' },
    cleanedByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const vaultEntrySchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Login', 'Server', 'API Key', 'SSH Key', 'Certificate', 'Wi-Fi', 'Database', 'Note', 'Other'],
      default: 'Login',
    },
    username:           { type: String, default: '' },
    password:           { type: String, default: '' },
    url:                { type: String, default: '' },
    notes:              { type: String, default: '' },
    customFields:       [{ label: { type: String }, value: { type: String }, hidden: { type: Boolean, default: true } }],
    tags:               [{ type: String }],
    favorite:           { type: Boolean, default: false },
    createdBy:          { type: String, default: '' },
    createdByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const qrScanSchema = new mongoose.Schema(
  {
    ip:        { type: String, default: '' },
    userAgent: { type: String, default: '' },
    os:        { type: String, default: '' },
    browser:   { type: String, default: '' },
    referer:   { type: String, default: '' },
    country:   { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const qrCodeSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    template: {
      type: String,
      enum: ['url', 'wifi', 'vcard', 'email', 'sms', 'text', 'phishing'],
      default: 'url',
    },
    targetUrl:          { type: String, default: '' },
    payload:            { type: mongoose.Schema.Types.Mixed, default: {} },
    shortCode:          { type: String, required: true, unique: false },
    qrDataUrl:          { type: String, default: '' },
    fgColor:            { type: String, default: '#000000' },
    bgColor:            { type: String, default: '#FFFFFF' },
    scans:              [qrScanSchema],
    active:             { type: Boolean, default: true },
    tags:               [{ type: String }],
    createdBy:          { type: String, default: '' },
    createdByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const lootSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    category: {
      type:    String,
      enum:    ['Credentials', 'Password File', 'Config File', 'Hash', 'SSH Key', 'Network Location', 'Screenshot', 'Note', 'Other'],
      default: 'Other',
    },
    content:            { type: String, default: '' },
    images:             [{ type: String }],
    tags:               [{ type: String }],
    capturedBy:         { type: String, default: '' },
    capturedByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const phishingWebTemplateSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    description:        { type: String, default: '' },
    html:               { type: String, default: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Login</title>\n  <style>\n    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }\n    .container { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }\n    h2 { margin-top: 0; }\n    input { width: 100%; padding: 10px; margin: 8px 0; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }\n    button { width: 100%; padding: 12px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }\n  </style>\n</head>\n<body>\n  <div class="container">\n    <h2>Sign In</h2>\n    <form>\n      <input type="email" placeholder="Email" />\n      <input type="password" placeholder="Password" />\n      <button type="submit">Sign In</button>\n    </form>\n  </div>\n</body>\n</html>' },
    category:           { type: String, default: 'Login Page' },
    tags:               [{ type: String }],
    createdBy:          { type: String, default: '' },
    createdByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const phishingEmailTemplateSchema = new mongoose.Schema(
  {
    title:              { type: String, required: true, trim: true },
    description:        { type: String, default: '' },
    subject:            { type: String, default: '' },
    senderName:         { type: String, default: '' },
    senderEmail:        { type: String, default: '' },
    html:               { type: String, default: '<!DOCTYPE html>\n<html>\n<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n  <h2>Action Required</h2>\n  <p>Dear {{name}},</p>\n  <p>Please verify your account by clicking the link below:</p>\n  <p><a href="{{url}}" style="display: inline-block; padding: 12px 24px; background: #4285f4; color: white; text-decoration: none; border-radius: 4px;">Verify Account</a></p>\n  <p>Best regards,<br/>IT Support</p>\n</body>\n</html>' },
    textBody:           { type: String, default: '' },
    category:           { type: String, default: 'Credential Harvest' },
    tags:               [{ type: String }],
    createdBy:          { type: String, default: '' },
    createdByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    name:                { type: String, required: true, trim: true },
    section:             { type: String, enum: ['official', 'created', 'pillaged'], required: true },
    mimeType:            { type: String, default: 'application/octet-stream' },
    size:                { type: Number, default: 0 },
    description:         { type: String, default: '' },
    tags:                [{ type: String }],
    uploadedBy:          { type: String, default: '' },
    uploadedByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: true },
);

const ttpSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    category:    { type: String, enum: ['initial-access', 'windows', 'linux', 'active-directory', 'network'], required: true },
    description: { type: String, default: '' },
    tags:        [{ type: String }],
    blocks:      [contentBlockSchema],
    createdBy:         { type: String, default: '' },
    createdByCallsign: { type: String, default: '' },
  },
  { timestamps: true, _id: true }
);

const phishingConfigSchema = new mongoose.Schema(
  {
    smtpHost:           { type: String, default: '' },
    smtpPort:           { type: Number, default: 587 },
    smtpUsername:        { type: String, default: '' },
    smtpPassword:       { type: String, default: '' },
    smtpTLS:            { type: Boolean, default: true },
    senderEmail:        { type: String, default: '' },
    senderName:         { type: String, default: '' },
    domain:             { type: String, default: '' },
    landingDomain:      { type: String, default: '' },
    gophishUrl:         { type: String, default: '' },
    gophishApiKey:      { type: String, default: '' },
    notes:              { type: String, default: '' },
    updatedBy:          { type: String, default: '' },
    updatedByCallsign:  { type: String, default: '' },
  },
  { timestamps: true, _id: false }
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
    c2Deployments:   [c2DeploymentSchema],
    c2Config:        { type: mongoose.Schema.Types.Mixed, default: {} },
    leakxScans:       [leakxScanSchema],
    leakxConfig:      { type: mongoose.Schema.Types.Mixed, default: {} },
    subdomainScans:   [subdomainScanSchema],
    subdomainConfig:  { type: mongoose.Schema.Types.Mixed, default: {} },
    vault:            [vaultEntrySchema],
    loot:             [lootSchema],
    evidence:         [evidenceSchema],
    cleanup:          [cleanupSchema],
    qrCodes:          [qrCodeSchema],
    phishingWebTemplates:   [phishingWebTemplateSchema],
    phishingEmailTemplates: [phishingEmailTemplateSchema],
    phishingConfig:         { type: phishingConfigSchema, default: () => ({}) },
    ttps:                   [ttpSchema],
    documents:              [documentSchema],
  },
  { timestamps: true }
);

engagementSchema.index({ user: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
