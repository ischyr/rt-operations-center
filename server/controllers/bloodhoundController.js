const mongoose = require('mongoose');
const AdmZip   = require('adm-zip');
const fs       = require('fs');
const path     = require('path');

// ── Schemas ────────────────────────────────────────────────────────────────────
const sessionSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, unique: true, index: true },
  status:       { type: String, default: 'idle', enum: ['idle', 'processing', 'ready', 'error'] },
  error:        { type: String, default: '' },
  filename:     { type: String, default: '' },
  importedAt:   { type: Date,   default: null },
  domain:       { type: String, default: '' },
  stats: {
    users:                 { type: Number, default: 0 },
    computers:             { type: Number, default: 0 },
    groups:                { type: Number, default: 0 },
    kerberoastable:        { type: Number, default: 0 },
    asrepRoastable:        { type: Number, default: 0 },
    domainAdmins:          { type: Number, default: 0 },
    enterpriseAdmins:      { type: Number, default: 0 },
    dcsyncRights:          { type: Number, default: 0 },
    unconstrainedDelegation:{ type: Number, default: 0 },
    constrainedDelegation: { type: Number, default: 0 },
    aclPaths:              { type: Number, default: 0 },
    adminCount:            { type: Number, default: 0 },
    pwdNeverExpires:       { type: Number, default: 0 },
    enabledUsers:          { type: Number, default: 0 },
    domainTrusts:          { type: Number, default: 0 },
  },
  attackPaths: [{
    id:          String,
    title:       String,
    severity:    String, // critical | high | medium
    technique:   String,
    description: String,
    steps:       [String],
    mitreId:     String,
  }],
}, { timestamps: true });

const findingSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  category: {
    type: String, required: true,
    enum: ['kerberoastable','asrep','da_member','ea_member','dcsync','unconstrained','constrained','acl_path','high_value','trust'],
  },
  objectType:   { type: String, default: 'user', enum: ['user','computer','group','domain'] },
  name:         { type: String, default: '' },
  sid:          { type: String, default: '' },
  domain:       { type: String, default: '' },
  enabled:      { type: Boolean, default: true },
  adminCount:   { type: Boolean, default: false },
  description:  { type: String, default: '' },
  // User fields
  spns:          [String],
  pwdNeverExpires: { type: Boolean, default: false },
  lastLogon:     { type: Number, default: 0 },
  // Computer fields
  os:                  { type: String, default: '' },
  delegationTarget:    [String],
  // ACL path fields
  aclRight:     { type: String, default: '' },
  targetName:   { type: String, default: '' },
  targetType:   { type: String, default: '' },
  targetSid:    { type: String, default: '' },
  // Trust fields
  trustTarget:  { type: String, default: '' },
  trustType:    { type: String, default: '' },
  trustDir:     { type: String, default: '' },
  // Crack / save tracking
  crackedPassword: { type: String, default: '' },
  crackedAt:       { type: Date,   default: null },
  savedToVault:    { type: Boolean, default: false },
}, { timestamps: true });

findingSchema.index({ engagementId: 1, category: 1 });

const nodeSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  objectId:     { type: String, required: true },
  objectType:   { type: String, enum: ['user','computer','group','domain','ou','gpo'], default: 'user' },
  name:         { type: String, default: '' },
  domain:       { type: String, default: '' },
  props:        { type: mongoose.Schema.Types.Mixed, default: {} },
});
nodeSchema.index({ engagementId: 1, objectId: 1 }, { unique: true });
nodeSchema.index({ engagementId: 1, name: 'text' });

const edgeSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  fromId:   String,
  fromName: String,
  fromType: String,
  toId:     String,
  toName:   String,
  toType:   String,
  label:    String,
});
edgeSchema.index({ engagementId: 1, fromId: 1 });
edgeSchema.index({ engagementId: 1, toId: 1 });

const BhNode = mongoose.models.BhNode || mongoose.model('BhNode', nodeSchema);
const BhEdge = mongoose.models.BhEdge || mongoose.model('BhEdge', edgeSchema);

const BhSession = mongoose.models.BhSession || mongoose.model('BhSession', sessionSchema);
const BhFinding = mongoose.models.BhFinding || mongoose.model('BhFinding', findingSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
async function ensureSession(engagementId) {
  return BhSession.findOneAndUpdate(
    { engagementId },
    { $setOnInsert: { engagementId } },
    { upsert: true, new: true }
  );
}

// Batch insert helper to avoid hitting 16MB doc limit
async function batchInsert(docs) {
  if (!docs.length) return;
  const BATCH = 500;
  for (let i = 0; i < docs.length; i += BATCH) {
    await BhFinding.insertMany(docs.slice(i, i + BATCH), { ordered: false }).catch(() => {});
  }
}

// ── Core parser ────────────────────────────────────────────────────────────────
async function processBloodHound(engagementId, jsonFiles, filename) {
  // jsonFiles = [{ name, content(string) }, ...]
  // Build SID → name lookup
  const sidMap = new Map();
  const parsed = {};

  for (const f of jsonFiles) {
    let data;
    try { data = JSON.parse(f.content); } catch { continue; }
    const type = (data.meta && data.meta.type) || guessType(f.name);
    if (!type) continue;
    parsed[type] = data.data || [];
  }

  // Build SID lookup from all objects
  for (const [type, objects] of Object.entries(parsed)) {
    for (const obj of objects) {
      const sid  = obj.ObjectIdentifier || '';
      const name = (obj.Properties && obj.Properties.name) || '';
      if (sid && name) sidMap.set(sid.toUpperCase(), name);
    }
  }

  const findings = [];
  let domain = '';
  let domainAdminSid  = '';
  let enterpriseAdminSid = '';
  const stats = {
    users:0, computers:0, groups:0,
    kerberoastable:0, asrepRoastable:0,
    domainAdmins:0, enterpriseAdmins:0,
    dcsyncRights:0, unconstrainedDelegation:0,
    constrainedDelegation:0, aclPaths:0,
    adminCount:0, pwdNeverExpires:0,
    enabledUsers:0, domainTrusts:0,
  };

  // ── Domains ────────────────────────────────────────────────────────────────
  const domains = parsed.domains || [];
  stats.domainTrusts = 0;
  for (const d of domains) {
    const p = d.Properties || {};
    if (!domain) domain = p.name || '';
    const dSid = (d.ObjectIdentifier || '').toUpperCase();

    // DA SID = domain SID + -512
    const domBase = dSid.replace(/-[^-]+$/, '');
    domainAdminSid    = domBase + '-512';
    enterpriseAdminSid = domBase + '-519';

    // Domain trusts
    for (const trust of (d.Trusts || [])) {
      stats.domainTrusts++;
      findings.push({
        engagementId, category: 'trust', objectType: 'domain',
        name: d.Properties?.name || '',
        sid: dSid, domain,
        trustTarget: trust.TargetDomainName || '',
        trustType:   trust.TrustType        || '',
        trustDir:    trust.IsTransitive ? 'Transitive' : 'Non-Transitive',
      });
    }

    // DCSync rights on domain object
    for (const ace of (d.Aces || [])) {
      const right = ace.RightName || '';
      if (right === 'DS-Replication-Get-Changes-All' || right === 'DCSync' ||
          (right === 'AllExtendedRights' && !ace.IsInherited)) {
        const pSid = (ace.PrincipalSID || '').toUpperCase();
        const pName = sidMap.get(pSid) || ace.PrincipalSID || '';
        findings.push({
          engagementId, category: 'dcsync', objectType: ace.PrincipalType?.toLowerCase() || 'user',
          name: pName, sid: pSid, domain,
          aclRight: right, targetName: domain, targetType: 'domain', targetSid: dSid,
        });
        stats.dcsyncRights++;
      }
    }
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  const groups = parsed.groups || [];
  stats.groups = groups.length;
  const highValueGroupSids = new Set([domainAdminSid, enterpriseAdminSid]);

  for (const g of groups) {
    const p = g.Properties || {};
    const gSid = (g.ObjectIdentifier || '').toUpperCase();
    const gName = p.name || '';

    // DA members
    if (gSid === domainAdminSid) {
      for (const m of (g.Members || [])) {
        const mSid  = (m.ObjectIdentifier || '').toUpperCase();
        const mName = sidMap.get(mSid) || mSid;
        findings.push({
          engagementId, category: 'da_member',
          objectType: (m.ObjectType || 'user').toLowerCase(),
          name: mName, sid: mSid, domain,
        });
        stats.domainAdmins++;
      }
    }

    // EA members
    if (gSid === enterpriseAdminSid) {
      for (const m of (g.Members || [])) {
        const mSid  = (m.ObjectIdentifier || '').toUpperCase();
        const mName = sidMap.get(mSid) || mSid;
        findings.push({
          engagementId, category: 'ea_member',
          objectType: (m.ObjectType || 'user').toLowerCase(),
          name: mName, sid: mSid, domain,
        });
        stats.enterpriseAdmins++;
      }
    }

    // Dangerous ACEs on high-value groups (DA/EA)
    if (highValueGroupSids.has(gSid)) {
      const dangerousRights = new Set(['GenericAll','GenericWrite','WriteMembers','AddMember','WriteDACL','WriteOwner','Owns','AllExtendedRights']);
      for (const ace of (g.Aces || [])) {
        if (dangerousRights.has(ace.RightName) && !ace.IsInherited) {
          const pSid  = (ace.PrincipalSID || '').toUpperCase();
          // Skip if the principal is already a known DA/EA
          if (highValueGroupSids.has(pSid)) continue;
          const pName = sidMap.get(pSid) || ace.PrincipalSID || '';
          findings.push({
            engagementId, category: 'acl_path',
            objectType: ace.PrincipalType?.toLowerCase() || 'user',
            name: pName, sid: pSid, domain,
            aclRight:   ace.RightName,
            targetName: gName,
            targetType: 'group',
            targetSid:  gSid,
          });
          stats.aclPaths++;
        }
      }
    }
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = parsed.users || [];
  stats.users = users.length;

  for (const u of users) {
    const p   = u.Properties || {};
    const sid = (u.ObjectIdentifier || '').toUpperCase();
    const name   = p.name || '';
    const dom    = p.domain || domain;
    const enabled    = p.enabled !== false;
    const adminCount = p.admincount || false;

    if (enabled) stats.enabledUsers++;
    if (adminCount) stats.adminCount++;
    if (p.pwdneverexpires) stats.pwdNeverExpires++;

    // Kerberoastable
    if (p.hasspn && enabled) {
      findings.push({
        engagementId, category: 'kerberoastable', objectType: 'user',
        name, sid, domain: dom, enabled, adminCount,
        spns:           p.serviceprincipalnames || [],
        description:    p.description || '',
        pwdNeverExpires: p.pwdneverexpires || false,
        lastLogon:      p.lastlogon || 0,
      });
      stats.kerberoastable++;
    }

    // AS-REP roastable
    if (p.dontreqpreauth) {
      findings.push({
        engagementId, category: 'asrep', objectType: 'user',
        name, sid, domain: dom, enabled, adminCount,
        description: p.description || '',
        lastLogon:   p.lastlogon || 0,
      });
      stats.asrepRoastable++;
    }
  }

  // ── Computers ──────────────────────────────────────────────────────────────
  const computers = parsed.computers || [];
  stats.computers = computers.length;

  for (const c of computers) {
    const p   = c.Properties || {};
    const sid = (c.ObjectIdentifier || '').toUpperCase();
    const name    = p.name || '';
    const dom     = p.domain || domain;
    const enabled = p.enabled !== false;

    // Unconstrained delegation (exclude DCs — they always have it)
    if (p.unconstraineddelegation && enabled) {
      findings.push({
        engagementId, category: 'unconstrained', objectType: 'computer',
        name, sid, domain: dom, enabled,
        os: p.operatingsystem || '',
      });
      stats.unconstrainedDelegation++;
    }

    // Constrained delegation
    const delegTo = p.allowedtodelegate || [];
    if (delegTo.length > 0 && enabled) {
      findings.push({
        engagementId, category: 'constrained', objectType: 'computer',
        name, sid, domain: dom, enabled,
        os: p.operatingsystem || '',
        delegationTarget: delegTo,
      });
      stats.constrainedDelegation++;
    }
  }

  // ── Derive attack paths ────────────────────────────────────────────────────
  const attackPaths = deriveAttackPaths(findings, stats, domain);

  // ── Build graph nodes & edges ──────────────────────────────────────────────
  const nodes = [];
  const edges = [];

  // Domain nodes
  for (const d of domains) {
    const p = d.Properties || {};
    const oid = (d.ObjectIdentifier || '').toUpperCase();
    if (!oid) continue;
    nodes.push({ engagementId, objectId: oid, objectType: 'domain', name: p.name || oid, domain: p.name || '', props: p });
    for (const trust of (d.Trusts || [])) {
      const toId = (trust.TargetDomainSID || trust.TargetDomainName || '').toUpperCase();
      edges.push({ engagementId, fromId: oid, fromName: p.name || oid, fromType: 'domain', toId, toName: trust.TargetDomainName || '', toType: 'domain', label: trust.TrustType || 'Trust' });
    }
  }

  // Group nodes + MemberOf edges
  for (const g of groups) {
    const p = g.Properties || {};
    const oid = (g.ObjectIdentifier || '').toUpperCase();
    if (!oid) continue;
    nodes.push({ engagementId, objectId: oid, objectType: 'group', name: p.name || oid, domain: p.domain || domain, props: p });
    for (const m of (g.Members || [])) {
      const mId = (m.ObjectIdentifier || '').toUpperCase();
      const mName = sidMap.get(mId) || mId;
      const mType = (m.ObjectType || 'user').toLowerCase();
      edges.push({ engagementId, fromId: mId, fromName: mName, fromType: mType, toId: oid, toName: p.name || oid, toType: 'group', label: 'MemberOf' });
    }
    // ACE edges on groups
    for (const ace of (g.Aces || [])) {
      if (!ace.RightName || ace.IsInherited) continue;
      const pId = (ace.PrincipalSID || '').toUpperCase();
      const pName = sidMap.get(pId) || pId;
      edges.push({ engagementId, fromId: pId, fromName: pName, fromType: (ace.PrincipalType || 'user').toLowerCase(), toId: oid, toName: p.name || oid, toType: 'group', label: ace.RightName });
    }
  }

  // User nodes + ACE edges
  for (const u of users) {
    const p = u.Properties || {};
    const oid = (u.ObjectIdentifier || '').toUpperCase();
    if (!oid) continue;
    nodes.push({ engagementId, objectId: oid, objectType: 'user', name: p.name || oid, domain: p.domain || domain, props: p });
    for (const ace of (u.Aces || [])) {
      if (!ace.RightName || ace.IsInherited) continue;
      const pId = (ace.PrincipalSID || '').toUpperCase();
      const pName = sidMap.get(pId) || pId;
      edges.push({ engagementId, fromId: pId, fromName: pName, fromType: (ace.PrincipalType || 'user').toLowerCase(), toId: oid, toName: p.name || oid, toType: 'user', label: ace.RightName });
    }
  }

  // Computer nodes + ACE + delegation edges
  for (const c of computers) {
    const p = c.Properties || {};
    const oid = (c.ObjectIdentifier || '').toUpperCase();
    if (!oid) continue;
    nodes.push({ engagementId, objectId: oid, objectType: 'computer', name: p.name || oid, domain: p.domain || domain, props: p });
    for (const delegTo of (p.allowedtodelegate || [])) {
      edges.push({ engagementId, fromId: oid, fromName: p.name || oid, fromType: 'computer', toId: delegTo.toUpperCase(), toName: delegTo, toType: 'computer', label: 'AllowedToDelegate' });
    }
    for (const ace of (c.Aces || [])) {
      if (!ace.RightName || ace.IsInherited) continue;
      const pId = (ace.PrincipalSID || '').toUpperCase();
      const pName = sidMap.get(pId) || pId;
      edges.push({ engagementId, fromId: pId, fromName: pName, fromType: (ace.PrincipalType || 'user').toLowerCase(), toId: oid, toName: p.name || oid, toType: 'computer', label: ace.RightName });
    }
  }

  // ── Persist graph ────────────────────────────────────────────────────────
  await BhNode.deleteMany({ engagementId });
  await BhEdge.deleteMany({ engagementId });
  const NODE_BATCH = 500;
  for (let i = 0; i < nodes.length; i += NODE_BATCH) {
    await BhNode.insertMany(nodes.slice(i, i + NODE_BATCH), { ordered: false }).catch(() => {});
  }
  const EDGE_BATCH = 500;
  for (let i = 0; i < edges.length; i += EDGE_BATCH) {
    await BhEdge.insertMany(edges.slice(i, i + EDGE_BATCH), { ordered: false }).catch(() => {});
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  await BhFinding.deleteMany({ engagementId });
  await batchInsert(findings);

  await BhSession.findOneAndUpdate(
    { engagementId },
    {
      status: 'ready', error: '', filename, importedAt: new Date(),
      domain, stats, attackPaths,
    },
    { upsert: true }
  );
}

function deriveAttackPaths(findings, stats, domain) {
  const paths = [];
  const dom = domain || 'DOMAIN';
  const dc  = dom.split('.')[0] + '-DC';

  if (stats.dcsyncRights > 0) {
    paths.push({
      id: 'dcsync', title: 'DCSync → All Credentials', severity: 'critical',
      technique: 'T1003.006', mitreId: 'TA0006',
      description: `${stats.dcsyncRights} principal(s) hold DS-Replication rights on the domain. Any of these accounts can DCSync to dump all hashes including krbtgt.`,
      steps: [
        `Compromise any principal listed under DCSync Rights`,
        `Run: secretsdump.py ${dom}/USER:PASS@DC_IP -just-dc`,
        `Extract krbtgt hash → forge Golden Ticket`,
        `Golden Ticket persists even after password resets`,
      ],
    });
  }

  if (stats.kerberoastable > 0 && stats.domainAdmins > 0) {
    const adminSPNs = findings.filter(f => f.category === 'kerberoastable' && f.adminCount);
    if (adminSPNs.length > 0) {
      paths.push({
        id: 'kerb_admin', title: 'Kerberoast → AdminCount User → DA', severity: 'critical',
        technique: 'T1558.003', mitreId: 'TA0006',
        description: `${adminSPNs.length} kerberoastable account(s) have adminCount=true, indicating historical DA-level access or current privileged group membership.`,
        steps: [
          `Request TGS for: ${adminSPNs.slice(0,2).map(f=>f.name).join(', ')}`,
          `Rubeus.exe kerberoast /user:${adminSPNs[0]?.name?.split('@')[0]} /nowrap`,
          `Crack with hashcat: hashcat -m 13100 hash.txt rockyou.txt`,
          `Verify access → check for DA path via BloodHound`,
        ],
      });
    }
  }

  if (stats.unconstrainedDelegation > 0) {
    paths.push({
      id: 'unconstrained', title: 'Unconstrained Delegation → TGT Theft', severity: 'critical',
      technique: 'T1558', mitreId: 'TA0008',
      description: `${stats.unconstrainedDelegation} computer(s) have unconstrained delegation. Any privileged user authenticating to these hosts exposes their TGT.`,
      steps: [
        `Compromise any unconstrained delegation host listed`,
        `Monitor incoming tickets: Rubeus.exe monitor /interval:5 /filteruser:krbtgt`,
        `Coerce DC authentication: PetitPotam.py UNCONSTRAINED_HOST DC_IP`,
        `Extract TGT + DCSync`,
      ],
    });
  }

  if (stats.aclPaths > 0) {
    paths.push({
      id: 'acl_da', title: 'ACL Abuse → Domain Admin', severity: 'critical',
      technique: 'T1484.001', mitreId: 'TA0004',
      description: `${stats.aclPaths} principal(s) have write-level ACEs on Domain Admins or Enterprise Admins. These allow direct group membership manipulation.`,
      steps: [
        `Identify ACL paths on DA/EA group in "ACL Paths" tab`,
        `Compromise the source principal`,
        `Add yourself: net group "Domain Admins" USER /add /domain`,
        `Or via PowerView: Add-DomainGroupMember -Identity "Domain Admins" -Members USER`,
      ],
    });
  }

  if (stats.asrepRoastable > 0) {
    paths.push({
      id: 'asrep', title: 'AS-REP Roasting → Credential Access', severity: 'high',
      technique: 'T1558.004', mitreId: 'TA0006',
      description: `${stats.asrepRoastable} account(s) do not require Kerberos preauthentication. AS-REP hashes can be captured without credentials.`,
      steps: [
        `GetNPUsers.py ${dom}/ -usersfile users.txt -dc-ip DC_IP -format hashcat`,
        `Rubeus.exe asreproast /format:hashcat /nowrap`,
        `Crack: hashcat -m 18200 asrep.txt rockyou.txt`,
        `Pivot from cracked credentials`,
      ],
    });
  }

  if (stats.constrainedDelegation > 0) {
    paths.push({
      id: 'constrained', title: 'Constrained Delegation → Lateral Movement', severity: 'high',
      technique: 'T1550.003', mitreId: 'TA0008',
      description: `${stats.constrainedDelegation} principal(s) configured with constrained delegation. Compromise allows impersonating any user to the delegation target service.`,
      steps: [
        `Identify delegation targets in "Delegation" tab`,
        `Compromise the source account or computer`,
        `Rubeus.exe s4u /user:SOURCE$ /rc4:HASH /impersonateuser:Administrator /msdsspn:SERVICE/TARGET`,
        `Access target service as Administrator`,
      ],
    });
  }

  if (stats.domainTrusts > 0) {
    paths.push({
      id: 'trusts', title: 'Domain Trust Exploitation', severity: 'medium',
      technique: 'T1482', mitreId: 'TA0007',
      description: `${stats.domainTrusts} domain trust(s) detected. Trust relationships may allow cross-domain lateral movement or privilege escalation.`,
      steps: [
        `Enumerate trusts in the "High Value" tab`,
        `Check for bi-directional or transitive trusts`,
        `If DA in trusted domain: forge inter-realm TGT (krbtgt RC4 needed)`,
        `SID history injection for cross-domain escalation`,
      ],
    });
  }

  return paths;
}

function guessType(filename) {
  const f = filename.toLowerCase();
  if (f.includes('user'))     return 'users';
  if (f.includes('computer')) return 'computers';
  if (f.includes('group'))    return 'groups';
  if (f.includes('domain'))   return 'domains';
  if (f.includes('ou'))       return 'ous';
  if (f.includes('gpo'))      return 'gpos';
  return null;
}

// ── Import (ZIP or raw JSON files) ────────────────────────────────────────────
exports.importData = async (req, res) => {
  try {
    const { engagementId } = req.params;
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ error: 'No files uploaded' });

    // Mark as processing immediately
    await BhSession.findOneAndUpdate(
      { engagementId },
      { status: 'processing', error: '', filename: req.files[0].originalname },
      { upsert: true, new: true }
    );

    res.json({ status: 'processing' });

    // Process in background (non-blocking)
    setImmediate(async () => {
      try {
        const jsonFiles = [];

        for (const file of req.files) {
          const isZip = file.originalname.toLowerCase().endsWith('.zip') ||
                        file.mimetype === 'application/zip';

          if (isZip) {
            // Extract all JSON entries from ZIP
            const zip = new AdmZip(file.path || file.buffer);
            for (const entry of zip.getEntries()) {
              if (entry.name.toLowerCase().endsWith('.json') && !entry.isDirectory) {
                jsonFiles.push({ name: entry.name, content: entry.getData().toString('utf8') });
              }
            }
          } else if (file.originalname.toLowerCase().endsWith('.json')) {
            const content = file.buffer
              ? file.buffer.toString('utf8')
              : fs.readFileSync(file.path, 'utf8');
            jsonFiles.push({ name: file.originalname, content });
          }

          // Clean up disk file if using diskStorage
          if (file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch {}
          }
        }

        if (jsonFiles.length === 0) {
          await BhSession.findOneAndUpdate({ engagementId }, { status: 'error', error: 'No valid JSON files found in upload' });
          return;
        }

        await processBloodHound(engagementId, jsonFiles, req.files[0].originalname);
      } catch (e) {
        console.error('[BloodHound] Processing error:', e.message);
        await BhSession.findOneAndUpdate({ engagementId }, { status: 'error', error: e.message });
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ── Get session ───────────────────────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const session = await BhSession.findOne({ engagementId });
    res.json(session || { status: 'idle', stats: {}, attackPaths: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get findings ──────────────────────────────────────────────────────────────
exports.getFindings = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { category, page = 1, limit = 50, search = '' } = req.query;

    const filter = { engagementId };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { targetName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await BhFinding.countDocuments(filter);
    const items = await BhFinding.find(filter).sort({ adminCount: -1, name: 1 }).skip(skip).limit(Number(limit)).lean();

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Update finding (crack / vault) ────────────────────────────────────────────
exports.updateFinding = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['crackedPassword', 'savedToVault'];
    const update  = {};
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    if (req.body.crackedPassword !== undefined) update.crackedAt = req.body.crackedPassword ? new Date() : null;

    const finding = await BhFinding.findByIdAndUpdate(id, update, { new: true });
    if (!finding) return res.status(404).json({ error: 'Not found' });
    res.json(finding);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── searchNodes ────────────────────────────────────────────────────────────────
exports.searchNodes = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const q    = (req.query.q || '').trim();
    const type = req.query.type || '';
    if (!q) return res.json([]);

    const filter = { engagementId, name: { $regex: q, $options: 'i' } };
    if (type) filter.objectType = type;

    const nodes = await BhNode.find(filter).limit(30).select('objectId objectType name domain').lean();
    res.json(nodes);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── getNodeGraph ───────────────────────────────────────────────────────────────
exports.getNodeGraph = async (req, res) => {
  try {
    const { engagementId, objectId } = req.params;
    const center = await BhNode.findOne({ engagementId, objectId: objectId.toUpperCase() }).lean();
    if (!center) return res.status(404).json({ error: 'Node not found' });

    // Get all edges touching this node (first degree)
    const [outEdges, inEdges] = await Promise.all([
      BhEdge.find({ engagementId, fromId: objectId.toUpperCase() }).limit(100).lean(),
      BhEdge.find({ engagementId, toId:   objectId.toUpperCase() }).limit(100).lean(),
    ]);

    const allEdges = [...outEdges, ...inEdges];

    // Collect neighbor IDs
    const neighborIds = new Set();
    for (const e of allEdges) {
      if (e.fromId !== objectId.toUpperCase()) neighborIds.add(e.fromId);
      if (e.toId   !== objectId.toUpperCase()) neighborIds.add(e.toId);
    }

    const neighbors = await BhNode.find({ engagementId, objectId: { $in: [...neighborIds] } })
      .select('objectId objectType name domain props').lean();

    // For any neighbor IDs referenced in edges but not found in BhNode,
    // create stub nodes so the graph library never gets a dangling edge reference.
    const foundIds = new Set(neighbors.map(n => n.objectId));
    const stubNeighbors = [];
    for (const e of allEdges) {
      for (const id of [e.fromId, e.toId]) {
        if (id !== objectId.toUpperCase() && !foundIds.has(id) && !stubNeighbors.find(s => s.objectId === id)) {
          stubNeighbors.push({
            objectId:   id,
            objectType: e.fromId === id ? e.fromType : e.toType,
            name:       e.fromId === id ? (e.fromName || id) : (e.toName || id),
            domain:     '',
            props:      {},
          });
          foundIds.add(id);
        }
      }
    }

    res.json({ center, neighbors: [...neighbors, ...stubNeighbors], edges: allEdges });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── rebuildGraph — synthesise BhNode/BhEdge from existing BhFindings ──────────
// Used when data was imported before graph support was added.
exports.rebuildGraph = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const findings = await BhFinding.find({ engagementId }).lean();
    if (!findings.length) return res.status(400).json({ error: 'No findings to build graph from. Re-import your data.' });

    const nodeMap = new Map(); // objectId → node
    const edges   = [];

    const upsertNode = (id, type, name, domain, props = {}) => {
      if (!id) return;
      const key = id.toUpperCase();
      if (!nodeMap.has(key)) nodeMap.set(key, { engagementId, objectId: key, objectType: type, name: name || key, domain: domain || '', props });
    };

    for (const f of findings) {
      const sid    = (f.sid || '').toUpperCase();
      const name   = f.name || '';
      const domain = f.domain || '';

      upsertNode(sid, f.objectType || 'user', name, domain, {
        enabled: f.enabled, admincount: f.adminCount, description: f.description,
        pwdneverexpires: f.pwdNeverExpires, lastlogon: f.lastLogon,
        serviceprincipalnames: f.spns, operatingsystem: f.os,
        objectsid: sid,
      });

      // ACL path → edge from principal to target
      if (f.aclRight && f.targetSid) {
        const tSid = f.targetSid.toUpperCase();
        upsertNode(tSid, f.targetType || 'group', f.targetName, domain);
        edges.push({ engagementId, fromId: sid, fromName: name, fromType: f.objectType || 'user', toId: tSid, toName: f.targetName, toType: f.targetType || 'group', label: f.aclRight });
      }

      // Delegation → edges to targets
      if (f.delegationTarget?.length) {
        for (const dt of f.delegationTarget) {
          const dtUpper = dt.toUpperCase();
          upsertNode(dtUpper, 'computer', dt, domain);
          edges.push({ engagementId, fromId: sid, fromName: name, fromType: 'computer', toId: dtUpper, toName: dt, toType: 'computer', label: 'AllowedToDelegate' });
        }
      }

      // Trust → edge domain→domain
      if (f.category === 'trust' && f.trustTarget) {
        const tKey = f.trustTarget.toUpperCase();
        upsertNode(tKey, 'domain', f.trustTarget, f.trustTarget);
        edges.push({ engagementId, fromId: sid, fromName: name, fromType: 'domain', toId: tKey, toName: f.trustTarget, toType: 'domain', label: f.trustType || 'Trust' });
      }

      // DA/EA membership → edge member→group
      if (f.category === 'da_member' || f.category === 'ea_member') {
        const grpName = f.category === 'da_member' ? 'DOMAIN ADMINS' : 'ENTERPRISE ADMINS';
        const grpKey  = `${domain}-${f.category === 'da_member' ? '512' : '519'}`;
        upsertNode(grpKey, 'group', `${grpName}@${domain}`, domain);
        edges.push({ engagementId, fromId: sid, fromName: name, fromType: f.objectType, toId: grpKey, toName: `${grpName}@${domain}`, toType: 'group', label: 'MemberOf' });
      }
    }

    const nodes = [...nodeMap.values()];

    await BhNode.deleteMany({ engagementId });
    await BhEdge.deleteMany({ engagementId });

    const BATCH = 500;
    for (let i = 0; i < nodes.length; i += BATCH)
      await BhNode.insertMany(nodes.slice(i, i + BATCH), { ordered: false }).catch(() => {});
    for (let i = 0; i < edges.length; i += BATCH)
      await BhEdge.insertMany(edges.slice(i, i + BATCH), { ordered: false }).catch(() => {});

    res.json({ nodes: nodes.length, edges: edges.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Clear session ─────────────────────────────────────────────────────────────
exports.clearSession = async (req, res) => {
  try {
    const { engagementId } = req.params;
    await Promise.all([
      BhSession.findOneAndUpdate({ engagementId }, { status: 'idle', stats: {}, attackPaths: [], domain: '', filename: '', importedAt: null }),
      BhFinding.deleteMany({ engagementId }),
      BhNode.deleteMany({ engagementId }),
      BhEdge.deleteMany({ engagementId }),
    ]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
