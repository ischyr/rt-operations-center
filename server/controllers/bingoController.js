const mongoose = require('mongoose');

const CATEGORIES = ['recon', 'access', 'escalation', 'lateral', 'exfil', 'special'];

// ── Templates ─────────────────────────────────────────────────────────────────
// Each template is 24 squares (center #12 is FREE).
const TEMPLATES = {
  external: {
    name: 'External Pentest',
    description: 'Focused on perimeter, web, and external-facing assets',
    squares: [
      { text: 'First subdomain discovered',        category: 'recon',      points: 1 },
      { text: 'First open port mapped',            category: 'recon',      points: 1 },
      { text: 'Web tech stack fingerprinted',      category: 'recon',      points: 1 },
      { text: 'Leaked credential on public repo',  category: 'access',     points: 5 },
      { text: 'Exposed backup or config file',     category: 'recon',      points: 3 },
      { text: 'Misconfigured S3 / blob storage',   category: 'access',     points: 5 },
      { text: 'First SQL injection confirmed',     category: 'access',     points: 7 },
      { text: 'SSRF → metadata endpoint',          category: 'access',     points: 7 },
      { text: 'First RCE on external asset',       category: 'access',     points: 10 },
      { text: 'Deserialization RCE',               category: 'access',     points: 10 },
      { text: 'XSS with session hijack',           category: 'access',     points: 5 },
      { text: 'Authentication bypass',             category: 'access',     points: 5 },
      { text: 'API key exfiltrated',               category: 'access',     points: 5 },
      { text: 'Cloud key compromise',              category: 'access',     points: 7 },
      { text: 'First internal foothold',           category: 'lateral',    points: 10 },
      { text: 'Shadow IT asset uncovered',         category: 'special',    points: 3 },
      { text: 'Executive mailbox access',          category: 'special',    points: 10 },
      { text: 'Domain Admin reached',              category: 'escalation', points: 10 },
      { text: 'Exfiltrated crown-jewel document',  category: 'exfil',      points: 10 },
      { text: 'Bypassed WAF / EDR evasion',        category: 'special',    points: 5 },
      { text: 'Coerced authentication captured',   category: 'access',     points: 5 },
      { text: 'First cred cracked from capture',   category: 'access',     points: 3 },
      { text: 'Pivoted to second segment',         category: 'lateral',    points: 5 },
      { text: 'Persistence planted',               category: 'special',    points: 5 },
    ],
  },
  internal: {
    name: 'Internal / AD',
    description: 'Post-foothold AD pillage and lateral movement',
    squares: [
      { text: 'LLMNR / NBT-NS poisoning capture', category: 'lateral',    points: 3 },
      { text: 'First NTLMv2 hash captured',        category: 'access',     points: 3 },
      { text: 'First NTLM hash cracked',           category: 'access',     points: 5 },
      { text: 'Kerberoast success',                category: 'access',     points: 5 },
      { text: 'AS-REP roast success',              category: 'access',     points: 5 },
      { text: 'First local admin reached',         category: 'escalation', points: 5 },
      { text: 'Interesting file in SMB share',     category: 'recon',      points: 3 },
      { text: 'Password in SYSVOL / GPO',          category: 'access',     points: 7 },
      { text: 'LAPS credentials obtained',         category: 'access',     points: 7 },
      { text: 'ADCS ESC abuse path',               category: 'special',    points: 7 },
      { text: 'Coerced auth relay (PetitPotam)',   category: 'access',     points: 7 },
      { text: 'NTLM relay → LDAP sign bypass',     category: 'access',     points: 7 },
      { text: 'Domain Admin',                      category: 'escalation', points: 10 },
      { text: 'Enterprise Admin',                  category: 'escalation', points: 10 },
      { text: 'DCSync success',                    category: 'escalation', points: 10 },
      { text: 'Golden / Silver ticket forged',     category: 'special',    points: 10 },
      { text: 'Cross-forest trust abused',         category: 'special',    points: 10 },
      { text: 'Lateral to 5+ machines',            category: 'lateral',    points: 5 },
      { text: 'Persistence via GPO / scheduled',   category: 'special',    points: 7 },
      { text: 'SPN with weak encryption found',    category: 'recon',      points: 3 },
      { text: 'LSASS dump → cleartext creds',      category: 'access',     points: 5 },
      { text: 'Backup admin cred discovered',      category: 'access',     points: 5 },
      { text: 'Sensitive share with no auth',      category: 'recon',      points: 3 },
      { text: 'Sensitive data exfiltrated',        category: 'exfil',      points: 7 },
    ],
  },
  fullchain: {
    name: 'Full-Chain Red Team',
    description: 'Complete adversary emulation from phish to exfil',
    squares: [
      { text: 'First phishing click',              category: 'access',     points: 3 },
      { text: 'First cred captured via lure',      category: 'access',     points: 5 },
      { text: 'MFA bypassed or relayed',           category: 'access',     points: 7 },
      { text: 'Initial payload landed undetected', category: 'special',    points: 5 },
      { text: 'C2 beacon checked in',              category: 'access',     points: 5 },
      { text: 'EDR identified & fingerprinted',    category: 'recon',      points: 3 },
      { text: 'AMSI / ETW bypass successful',      category: 'special',    points: 5 },
      { text: 'Local privilege escalation',        category: 'escalation', points: 5 },
      { text: 'Lateral via WMI / PSExec / SMB',    category: 'lateral',    points: 5 },
      { text: 'Captured creds from LSASS / LSA',   category: 'access',     points: 5 },
      { text: 'Kerberoast / AS-REP success',       category: 'access',     points: 5 },
      { text: 'Domain Admin',                      category: 'escalation', points: 10 },
      { text: 'Cloud-side compromise (Entra)',     category: 'escalation', points: 10 },
      { text: 'Backup / shadow copy access',       category: 'special',    points: 7 },
      { text: 'Crown-jewel system reached',        category: 'special',    points: 10 },
      { text: 'Executive mailbox read',            category: 'special',    points: 10 },
      { text: 'Data staged for exfil',             category: 'exfil',      points: 5 },
      { text: 'Exfiltration channel validated',    category: 'exfil',      points: 7 },
      { text: 'Full engagement undetected day 1',  category: 'special',    points: 5 },
      { text: 'Evaded / survived an IR attempt',   category: 'special',    points: 10 },
      { text: 'Golden / Diamond ticket forged',    category: 'special',    points: 10 },
      { text: 'ADCS abuse path executed',          category: 'special',    points: 7 },
      { text: 'BYOVD / driver exploit',            category: 'special',    points: 7 },
      { text: 'Full report-ready loot collected',  category: 'exfil',      points: 5 },
    ],
  },
};

// ── Schemas ────────────────────────────────────────────────────────────────────
const squareSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  text:     { type: String, required: true },
  category: { type: String, enum: CATEGORIES, default: 'special' },
  points:   { type: Number, default: 3 },
  isFree:   { type: Boolean, default: false },
  claimedByOperatorId:   { type: String, default: '' },
  claimedByOperatorName: { type: String, default: '' },
  claimedAt:             { type: Date,   default: null },
  evidence:              { type: String, default: '' },
  custom:                { type: Boolean, default: false },
}, { _id: false });

const bingoAchievementSchema = new mongoose.Schema({
  line:       String,   // 'row-0' | 'col-3' | 'diag-tl' | 'diag-tr' | 'full'
  operatorId: String,
  operatorName: String,
  at: { type: Date, default: Date.now },
}, { _id: false });

const cardSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, unique: true, index: true },
  template:     { type: String, enum: Object.keys(TEMPLATES), default: 'fullchain' },
  squares:      [squareSchema],
  achievements: [bingoAchievementSchema],
}, { timestamps: true });

const Card = mongoose.model('BingoCard', cardSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildSquaresFromTemplate(templateKey) {
  const tmpl = TEMPLATES[templateKey] || TEMPLATES.fullchain;
  const picked = tmpl.squares.slice(0, 24);
  // 5×5 with FREE at index 12
  const out = [];
  let ti = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      out.push({
        id: `free`,
        text: 'ENGAGEMENT KICKOFF',
        category: 'special',
        points: 0,
        isFree: true,
      });
    } else {
      const sq = picked[ti++];
      out.push({
        id: `sq-${i}`,
        text: sq.text,
        category: sq.category,
        points: sq.points,
      });
    }
  }
  return out;
}

// Compute completed bingo lines from square states
function detectBingos(squares) {
  const claimed = squares.map(s => s.isFree || !!s.claimedByOperatorId);
  const lines = [];

  // 5 rows
  for (let r = 0; r < 5; r++) {
    let all = true;
    for (let c = 0; c < 5; c++) if (!claimed[r * 5 + c]) { all = false; break; }
    if (all) lines.push(`row-${r}`);
  }
  // 5 cols
  for (let c = 0; c < 5; c++) {
    let all = true;
    for (let r = 0; r < 5; r++) if (!claimed[r * 5 + c]) { all = false; break; }
    if (all) lines.push(`col-${c}`);
  }
  // Diagonals
  if ([0, 6, 12, 18, 24].every(i => claimed[i])) lines.push('diag-tl');
  if ([4, 8, 12, 16, 20].every(i => claimed[i])) lines.push('diag-tr');
  // Full-board blackout
  if (claimed.every(Boolean)) lines.push('full');

  return lines;
}

async function ensureCard(engagementId) {
  let card = await Card.findOne({ engagementId });
  if (card) return card;
  card = await Card.create({
    engagementId,
    template: 'fullchain',
    squares:  buildSquaresFromTemplate('fullchain'),
    achievements: [],
  });
  return card;
}

function reconcileAchievements(card, operator) {
  const lines   = detectBingos(card.squares);
  const already = new Set(card.achievements.map(a => a.line));
  const fresh   = [];
  for (const line of lines) {
    if (already.has(line)) continue;
    card.achievements.push({
      line,
      operatorId:   operator.id,
      operatorName: operator.name,
      at: new Date(),
    });
    fresh.push(line);
  }
  return fresh;
}

// ── Endpoints ──────────────────────────────────────────────────────────────────
exports.getCard = async (req, res) => {
  try {
    const card = await ensureCard(req.params.engagementId);
    res.json({
      ...card.toObject(),
      templates: Object.entries(TEMPLATES).map(([k, v]) => ({
        key: k, name: v.name, description: v.description,
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.changeTemplate = async (req, res) => {
  try {
    const { template } = req.body;
    if (!TEMPLATES[template]) return res.status(400).json({ error: 'Unknown template' });

    const card = await ensureCard(req.params.engagementId);
    card.template = template;
    card.squares  = buildSquaresFromTemplate(template);
    card.achievements = [];
    await card.save();
    res.json(card.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.claimSquare = async (req, res) => {
  try {
    const { engagementId, squareId } = req.params;
    const { evidence } = req.body;

    const operatorId   = req.user?._id?.toString() || 'unknown';
    const operatorName = req.user?.name || req.user?.email || 'Operator';

    const card = await ensureCard(engagementId);
    const sq = card.squares.find(s => s.id === squareId);
    if (!sq) return res.status(404).json({ error: 'Square not found' });
    if (sq.isFree) return res.status(400).json({ error: 'FREE square cannot be claimed' });

    sq.claimedByOperatorId   = operatorId;
    sq.claimedByOperatorName = operatorName;
    sq.claimedAt             = new Date();
    if (typeof evidence === 'string') sq.evidence = evidence;

    const freshLines = reconcileAchievements(card, { id: operatorId, name: operatorName });
    await card.save();
    res.json({ card: card.toObject(), newBingos: freshLines });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.unclaimSquare = async (req, res) => {
  try {
    const { engagementId, squareId } = req.params;
    const card = await ensureCard(engagementId);
    const sq = card.squares.find(s => s.id === squareId);
    if (!sq) return res.status(404).json({ error: 'Square not found' });

    sq.claimedByOperatorId = '';
    sq.claimedByOperatorName = '';
    sq.claimedAt = null;
    sq.evidence = '';

    // Drop invalidated achievements
    const stillValid = new Set(detectBingos(card.squares));
    card.achievements = card.achievements.filter(a => stillValid.has(a.line));

    await card.save();
    res.json(card.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updateSquare = async (req, res) => {
  try {
    const { engagementId, squareId } = req.params;
    const { text, category, points } = req.body;
    const card = await ensureCard(engagementId);
    const sq = card.squares.find(s => s.id === squareId);
    if (!sq) return res.status(404).json({ error: 'Square not found' });
    if (typeof text === 'string' && text.trim()) sq.text = text.trim();
    if (CATEGORIES.includes(category)) sq.category = category;
    if (typeof points === 'number' && points >= 0 && points <= 20) sq.points = points;
    await card.save();
    res.json(card.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Leaderboard — aggregated points / claims / bingos per operator ────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const card = await ensureCard(req.params.engagementId);
    const byOp = new Map();

    const ensure = (id, name) => {
      if (!byOp.has(id)) byOp.set(id, {
        operatorId: id, operatorName: name,
        squares: 0, points: 0, bingos: 0, firstClaims: 0,
      });
      return byOp.get(id);
    };

    // Squares + points
    for (const s of card.squares) {
      if (!s.claimedByOperatorId) continue;
      const rec = ensure(s.claimedByOperatorId, s.claimedByOperatorName);
      rec.squares += 1;
      rec.points  += (s.points || 0);
    }

    // First-claim count (per category, earliest timestamp)
    const catFirst = {};
    for (const s of card.squares) {
      if (!s.claimedAt || !s.claimedByOperatorId) continue;
      const cur = catFirst[s.category];
      if (!cur || new Date(s.claimedAt) < new Date(cur.claimedAt)) {
        catFirst[s.category] = s;
      }
    }
    for (const s of Object.values(catFirst)) {
      const rec = ensure(s.claimedByOperatorId, s.claimedByOperatorName);
      rec.firstClaims += 1;
    }

    // Bingo achievements
    for (const a of card.achievements) {
      if (!a.operatorId) continue;
      const rec = ensure(a.operatorId, a.operatorName);
      rec.bingos += 1;
    }

    const ranked = [...byOp.values()]
      .sort((a, b) => b.points - a.points || b.bingos - a.bingos || b.squares - a.squares);

    res.json(ranked);
  } catch (e) { res.status(500).json({ error: e.message }); }
};
