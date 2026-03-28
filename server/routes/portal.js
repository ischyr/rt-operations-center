const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const Tenant  = require('../models/Tenant');
const Engagement = require('../models/Engagement');
const { protect } = require('../middleware/authMiddleware');

// ── Helpers ─────────────────────────────────────────────────────────────────

const signTenantToken = (id) =>
  jwt.sign({ id, type: 'tenant' }, process.env.JWT_SECRET, { expiresIn: '7d' });

const protectTenant = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ message: 'Not authorized' });
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.type !== 'tenant')
      return res.status(403).json({ message: 'Not a tenant token' });
    const tenant = await Tenant.findById(decoded.id);
    if (!tenant || !tenant.enabled)
      return res.status(401).json({ message: 'Tenant not found or disabled' });
    req.tenant = tenant;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
//  OPERATOR ENDPOINTS (manage tenants) — protected by operator auth
// ═════════════════════════════════════════════════════════════════════════════

// List tenants for an engagement
router.get('/tenants/:engagementId', protect, async (req, res) => {
  try {
    const tenants = await Tenant.find({ engagement: req.params.engagementId })
      .sort({ createdAt: -1 });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a tenant
router.post('/tenants', protect, async (req, res) => {
  try {
    const { company, contactName, contactEmail, password, engagementId } = req.body;
    if (!company || !contactEmail || !password || !engagementId)
      return res.status(400).json({ message: 'Missing required fields' });

    const eng = await Engagement.findById(engagementId);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const tenant = await Tenant.create({
      company,
      contactName: contactName || '',
      contactEmail,
      password,
      engagement: engagementId,
      createdBy: req.user._id,
      createdByCallsign: req.user.callsign,
    });

    // Don't return password hash
    const out = tenant.toObject();
    delete out.password;
    res.status(201).json(out);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'A tenant with this email already exists for this engagement' });
    res.status(500).json({ message: err.message });
  }
});

// Update a tenant
router.put('/tenants/:id', protect, async (req, res) => {
  try {
    const { company, contactName, contactEmail, enabled, password } = req.body;
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    if (company !== undefined)      tenant.company      = company;
    if (contactName !== undefined)  tenant.contactName   = contactName;
    if (contactEmail !== undefined) tenant.contactEmail  = contactEmail;
    if (enabled !== undefined)      tenant.enabled       = enabled;
    if (password)                   tenant.password      = password; // will be hashed by pre-save

    await tenant.save();
    const out = tenant.toObject();
    delete out.password;
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a tenant
router.delete('/tenants/:id', protect, async (req, res) => {
  try {
    await Tenant.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  TENANT (CLIENT) ENDPOINTS — protected by tenant auth
// ═════════════════════════════════════════════════════════════════════════════

// Tenant login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const tenant = await Tenant.findOne({ contactEmail: email.toLowerCase() })
      .select('+password');
    if (!tenant)
      return res.status(401).json({ message: 'Invalid credentials' });
    if (!tenant.enabled)
      return res.status(403).json({ message: 'Account disabled — contact your operator' });

    const match = await tenant.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    tenant.lastLogin = new Date();
    await tenant.save();

    const token = signTenantToken(tenant._id);
    res.json({
      token,
      tenant: {
        id: tenant._id,
        company: tenant.company,
        contactName: tenant.contactName,
        contactEmail: tenant.contactEmail,
        engagement: tenant.engagement,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tenant profile
router.get('/me', protectTenant, async (req, res) => {
  res.json({
    id: req.tenant._id,
    company: req.tenant.company,
    contactName: req.tenant.contactName,
    contactEmail: req.tenant.contactEmail,
    engagement: req.tenant.engagement,
  });
});

// Get engagement data (read-only)
router.get('/engagement', protectTenant, async (req, res) => {
  try {
    const eng = await Engagement.findById(req.tenant.engagement);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    // Return read-only engagement data (exclude sensitive fields)
    res.json({
      id: eng._id,
      name: eng.name,
      slug: eng.slug,
      company: eng.company,
      status: eng.status,
      type: eng.type,
      startDate: eng.startDate,
      endDate: eng.endDate,
      scope: eng.scope,
      objectives: eng.objectives,
      findings: (eng.findings || []).map(f => ({
        _id: f._id,
        title: f.title,
        severity: f.severity,
        description: f.description,
        observation: f.observation,
        proofOfConcept: f.proofOfConcept,
        remediation: f.remediation,
        observationBlocks: f.observationBlocks,
        proofOfConceptBlocks: f.proofOfConceptBlocks,
        remediationBlocks: f.remediationBlocks,
        createdAt: f.createdAt,
      })),
      activityLogs: (eng.activityLogs || []).map(l => ({
        _id: l._id,
        action: l.action,
        description: l.description,
        type: l.type,
        createdAt: l.createdAt,
      })),
      operators: eng.operators || [],
      teamSkills: eng.teamSkills || [],
      operatorSkills: eng.operatorSkills || {},
      resources: eng.resources || [],
      createdAt: eng.createdAt,
      updatedAt: eng.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
