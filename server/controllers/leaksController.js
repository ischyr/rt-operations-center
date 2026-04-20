const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

// ── Schema ─────────────────────────────────────────────────────────────────────
const credSchema = new mongoose.Schema({
  url:      { type: String, default: '' },
  domain:   { type: String, default: '', lowercase: true },
  username: { type: String, default: '' },
  email:    { type: String, default: '' },
  password: { type: String, default: '' },
}, { _id: false });

const TYPES     = ['credentials', 'file', 'link', 'pastebin', 'note'];
const SEVERITY  = ['low', 'medium', 'high', 'critical'];

const leakSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  type:         { type: String, enum: TYPES, default: 'credentials' },
  title:        { type: String, default: '' },
  source:       { type: String, default: '' },
  targetDomain: { type: String, default: '', lowercase: true, trim: true },
  severity:     { type: String, enum: SEVERITY, default: 'medium' },
  tags:         [String],
  notes:        { type: String, default: '' },

  rawContent:   { type: String, default: '' },   // pastebin / note / raw ULP block
  url:          { type: String, default: '' },   // link

  file: {
    filename: String,  // original name
    storedAs: String,  // on-disk name (collision-safe)
    size:     Number,
    mimetype: String,
  },

  credentials: [credSchema],
  credCount:   { type: Number, default: 0 },

  dateLeaked:     Date,
  dateDiscovered: { type: Date, default: Date.now },

  createdByOperatorId:   { type: String, default: '' },
  createdByOperatorName: { type: String, default: '' },
}, { timestamps: true });

// Indexes for fast search
leakSchema.index({ engagementId: 1, targetDomain: 1 });
leakSchema.index({ 'credentials.username': 1 });
leakSchema.index({ 'credentials.email':    1 });
leakSchema.index({ 'credentials.domain':   1 });

const Leak = mongoose.model('LeakEntry', leakSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
function extractDomain(urlOrEmail) {
  if (!urlOrEmail) return '';
  try {
    if (urlOrEmail.includes('@') && !/^https?:\/\//i.test(urlOrEmail)) {
      return urlOrEmail.split('@').pop().toLowerCase();
    }
    const u = new URL(/^https?:\/\//i.test(urlOrEmail) ? urlOrEmail : `https://${urlOrEmail}`);
    return u.hostname.toLowerCase();
  } catch { return ''; }
}

// Parse ULP / combo list text into credentials.
//   url:user:pass
//   url|user|pass
//   email:pass
//   user:pass
function parseCredentials(text, maxLines = 100000) {
  if (!text) return [];
  const lines = text.split(/\r?\n/).slice(0, maxLines);
  const out   = [];

  // Permissive URL match that tolerates `:port` (so the split-by-colon isn't ambiguous).
  const ulpColon = /^(https?:\/\/\S+?):([^:|]+):(.+)$/i;
  const ulpPipe  = /^(https?:\/\/\S+?)\|([^|]+)\|(.+)$/i;
  const emailRx  = /^([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}):(.+)$/;
  const simpleRx = /^([^\s:@]+):(.+)$/;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;
    let m;

    if ((m = line.match(ulpPipe)) || (m = line.match(ulpColon))) {
      const url = m[1];
      const id  = m[2];
      const pwd = m[3];
      const isEmail = /@/.test(id);
      out.push({
        url,
        domain:   extractDomain(url),
        username: isEmail ? '' : id,
        email:    isEmail ? id : '',
        password: pwd,
      });
      continue;
    }

    if ((m = line.match(emailRx))) {
      out.push({
        email:    m[1],
        domain:   extractDomain(m[1]),
        password: m[2],
      });
      continue;
    }

    if ((m = line.match(simpleRx))) {
      out.push({
        username: m[1],
        password: m[2],
      });
    }
  }
  return out;
}

// ── listEntries ────────────────────────────────────────────────────────────────
exports.listEntries = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { type, severity, target, q } = req.query;

    const query = { engagementId };
    if (type     && TYPES.includes(type))        query.type     = type;
    if (severity && SEVERITY.includes(severity)) query.severity = severity;
    if (target)                                   query.targetDomain = target.toLowerCase();

    let entries = await Leak.find(query)
      .select('-credentials -rawContent')      // list view = lightweight
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    // Text search across title, source, target, tags
    if (q) {
      const needle = q.toLowerCase();
      entries = entries.filter(e =>
        (e.title && e.title.toLowerCase().includes(needle)) ||
        (e.source && e.source.toLowerCase().includes(needle)) ||
        (e.targetDomain && e.targetDomain.includes(needle)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(needle)))
      );
    }

    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── getEntry — full detail (includes creds + raw content) ─────────────────────
exports.getEntry = async (req, res) => {
  try {
    const entry = await Leak.findById(req.params.id).lean();
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── createEntry — handles all types, optional file ────────────────────────────
exports.createEntry = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const operatorId   = req.user?._id?.toString() || '';
    const operatorName = req.user?.name || req.user?.email || 'Operator';

    const {
      type, title, source, targetDomain, severity, tags,
      notes, rawContent, url, dateLeaked, parseCreds,
    } = req.body;

    const chosenType = TYPES.includes(type) ? type : 'credentials';

    const doc = {
      engagementId,
      type:         chosenType,
      title:        (title || '').trim(),
      source:       (source || '').trim(),
      targetDomain: (targetDomain || '').trim().toLowerCase(),
      severity:     SEVERITY.includes(severity) ? severity : 'medium',
      tags:         typeof tags === 'string'
                      ? tags.split(',').map(t => t.trim()).filter(Boolean)
                      : Array.isArray(tags) ? tags : [],
      notes:        notes || '',
      rawContent:   rawContent || '',
      url:          url || '',
      dateLeaked:   dateLeaked ? new Date(dateLeaked) : undefined,
      createdByOperatorId:   operatorId,
      createdByOperatorName: operatorName,
    };

    // File uploaded via multer
    if (req.file) {
      doc.file = {
        filename: req.file.originalname,
        storedAs: req.file.filename,
        size:     req.file.size,
        mimetype: req.file.mimetype,
      };

      // If the uploaded file is text and the user wants parsing, read it.
      const textLikely = /^text\//i.test(req.file.mimetype || '') ||
                         /\.(txt|csv|log|ulp|list|combo)$/i.test(req.file.originalname);
      if ((chosenType === 'credentials') && textLikely && (parseCreds !== 'false')) {
        try {
          const fileText = fs.readFileSync(req.file.path, 'utf8');
          if (!doc.rawContent) doc.rawContent = fileText;
        } catch (_) {}
      }
    }

    // Parse credentials if we have source text
    if (chosenType === 'credentials' && doc.rawContent && parseCreds !== 'false') {
      doc.credentials = parseCredentials(doc.rawContent);
      doc.credCount   = doc.credentials.length;
    }

    // Auto-title fallback
    if (!doc.title) {
      if (chosenType === 'file' && doc.file) doc.title = doc.file.filename;
      else if (chosenType === 'link')        doc.title = doc.url || 'Link';
      else if (doc.targetDomain)             doc.title = `${doc.targetDomain} — ${chosenType}`;
      else                                    doc.title = `${chosenType} · ${new Date().toISOString().slice(0,10)}`;
    }

    const created = await Leak.create(doc);
    res.status(201).json(created.toObject());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── updateEntry ───────────────────────────────────────────────────────────────
exports.updateEntry = async (req, res) => {
  try {
    const patch = {};
    const fields = ['title', 'source', 'severity', 'notes', 'tags',
                    'targetDomain', 'rawContent', 'url', 'dateLeaked'];
    for (const f of fields) {
      if (req.body[f] !== undefined) patch[f] = req.body[f];
    }
    if (Array.isArray(patch.tags) === false && typeof patch.tags === 'string') {
      patch.tags = patch.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (patch.targetDomain) patch.targetDomain = String(patch.targetDomain).toLowerCase();

    // If the user is re-parsing creds explicitly
    if (req.body.reparse === true || req.body.reparse === 'true') {
      const current = await Leak.findById(req.params.id);
      if (current) {
        const creds = parseCredentials(patch.rawContent ?? current.rawContent);
        patch.credentials = creds;
        patch.credCount   = creds.length;
      }
    }

    const updated = await Leak.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteEntry ───────────────────────────────────────────────────────────────
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await Leak.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });

    if (entry.file?.storedAs) {
      const full = path.join(__dirname, '..', 'leaks', entry.engagementId, entry.file.storedAs);
      try { fs.unlinkSync(full); } catch (_) {}
    }

    await Leak.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── downloadFile ──────────────────────────────────────────────────────────────
exports.downloadFile = async (req, res) => {
  try {
    const entry = await Leak.findById(req.params.id);
    if (!entry || !entry.file?.storedAs) return res.status(404).json({ error: 'No file' });
    const full = path.join(__dirname, '..', 'leaks', entry.engagementId, entry.file.storedAs);
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'File missing on disk' });
    res.download(full, entry.file.filename || entry.file.storedAs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── stats ─────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const all = await Leak.find({ engagementId })
      .select('type severity targetDomain credCount source createdAt')
      .lean();

    const targetMap = new Map();
    const sourceMap = new Map();
    let totalCreds = 0;

    for (const e of all) {
      if (e.targetDomain) {
        const rec = targetMap.get(e.targetDomain) || { domain: e.targetDomain, entries: 0, creds: 0 };
        rec.entries += 1;
        rec.creds   += (e.credCount || 0);
        targetMap.set(e.targetDomain, rec);
      }
      if (e.source) {
        sourceMap.set(e.source, (sourceMap.get(e.source) || 0) + 1);
      }
      totalCreds += (e.credCount || 0);
    }

    const topTargets = [...targetMap.values()]
      .sort((a, b) => b.creds - a.creds || b.entries - a.entries)
      .slice(0, 20);

    const topSources = [...sourceMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      totalEntries: all.length,
      totalCreds,
      topTargets,
      topSources,
      byType: {
        credentials: all.filter(e => e.type === 'credentials').length,
        file:        all.filter(e => e.type === 'file').length,
        link:        all.filter(e => e.type === 'link').length,
        pastebin:    all.filter(e => e.type === 'pastebin').length,
        note:        all.filter(e => e.type === 'note').length,
      },
      bySeverity: {
        critical: all.filter(e => e.severity === 'critical').length,
        high:     all.filter(e => e.severity === 'high').length,
        medium:   all.filter(e => e.severity === 'medium').length,
        low:      all.filter(e => e.severity === 'low').length,
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── exportUlp — dump all parsed creds as url:user:pass ────────────────────────
exports.exportUlp = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const entries = await Leak.find({ engagementId, credCount: { $gt: 0 } })
      .select('credentials').lean();

    const lines = [];
    for (const e of entries) {
      for (const c of (e.credentials || [])) {
        const id  = c.email || c.username || '';
        const url = c.url || c.domain || '';
        const pwd = c.password || '';
        if (!id || !pwd) continue;
        lines.push(url ? `${url}:${id}:${pwd}` : `${id}:${pwd}`);
      }
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition',
      `attachment; filename="credentials-${engagementId}-${Date.now()}.txt"`);
    res.send(lines.join('\n'));
  } catch (e) { res.status(500).json({ error: e.message }); }
};
