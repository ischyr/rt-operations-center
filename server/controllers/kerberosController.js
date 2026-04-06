const { exec }    = require('child_process');
const fs           = require('fs');
const path         = require('path');
const KerberosTicket = require('../models/KerberosTicket');

const TEMP_DIR = path.join(__dirname, '..', 'temp', 'kerberos');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

function toDockerMount(p) { return p.replace(/\\/g, '/'); }

// ── Parse impacket stdout ─────────────────────────────────────────────────────
function parseOutput(stdout) {
  const lines  = stdout.split('\n');
  const result = { credCount: 0, credentials: [], raw: stdout };
  let cred     = null;
  let inTicket = false;

  for (const raw of lines) {
    const line = raw.trim();

    const countM = line.match(/Number of credentials in cache:\s*(\d+)/);
    if (countM) { result.credCount = parseInt(countM[1]); continue; }

    const credM = line.match(/Parsing credential\[(\d+)\]/);
    if (credM) {
      cred     = { index: parseInt(credM[1]), ticket: {}, errors: [] };
      inTicket = false;
      result.credentials.push(cred);
      continue;
    }

    if (line.includes('Decoding unencrypted data')) { inTicket = true; continue; }
    if (!cred) continue;

    const infoM = line.match(/^\[\*\]\s{1,6}(.+?)\s*:\s*([\s\S]+)$/);
    if (infoM) {
      const k = infoM[1].trim();
      const v = infoM[2].trim();
      if (inTicket) cred.ticket[k] = v;
      else          cred[k]        = v;
      continue;
    }

    const errM = line.match(/^\[-\]\s+(.+)$/);
    if (errM && cred) cred.errors.push(errM[1]);
  }

  return result;
}

// ── Parse ticket via Docker ───────────────────────────────────────────────────
exports.parse = async (req, res) => {
  const fname   = `ticket_${Date.now()}.ccache`;
  const tmpFile = path.join(TEMP_DIR, fname);
  try {
    let buf;
    if (req.file) {
      buf = req.file.buffer;
    } else if (req.body?.base64) {
      buf = Buffer.from(req.body.base64.replace(/\s+/g, ''), 'base64');
      if (buf.length < 4) return res.status(400).json({ error: 'Ticket data too short' });
    } else {
      return res.status(400).json({ error: 'Provide base64 ticket or upload a .ccache file' });
    }

    fs.writeFileSync(tmpFile, buf);
    const mountSrc = toDockerMount(TEMP_DIR);
    const cmd = `docker run --rm --entrypoint "" -v "${mountSrc}:/tickets" secsi/impacket sh -c "describeTicket.py /tickets/${fname} 2>&1"`;

    exec(cmd, { timeout: 30000 }, (err, stdout) => {
      try { fs.unlinkSync(tmpFile); } catch {}
      const out    = stdout || '';
      const parsed = parseOutput(out);
      if (!parsed.credCount && err) {
        return res.status(400).json({
          error: `Docker/impacket error: ${err.message}`,
          hint:  'Ensure Docker is running and secsi/impacket is pulled',
        });
      }
      res.json(parsed);
    });
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch {}
    res.status(500).json({ error: e.message });
  }
};

// ── Save to history ───────────────────────────────────────────────────────────
exports.saveHistory = async (req, res) => {
  try {
    const { engagementSlug, label, fileName, result } = req.body;
    if (!engagementSlug) return res.status(400).json({ error: 'engagementSlug required' });
    if (!result)         return res.status(400).json({ error: 'result required' });

    const doc = await KerberosTicket.create({
      engagementSlug,
      label:    label    || autoLabel(result),
      fileName: fileName || '',
      savedBy:  req.user?.username || req.user?.email || 'Unknown',
      result,
    });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── List history ──────────────────────────────────────────────────────────────
exports.listHistory = async (req, res) => {
  try {
    const { engagement } = req.query;
    if (!engagement) return res.status(400).json({ error: 'engagement query param required' });
    const docs = await KerberosTicket.find({ engagementSlug: engagement })
      .sort({ createdAt: -1 })
      .select('-result.raw') // omit raw impacket stdout from list
      .lean();
    res.json(docs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get single history entry ──────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const doc = await KerberosTicket.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Delete history entry ──────────────────────────────────────────────────────
exports.deleteHistory = async (req, res) => {
  try {
    await KerberosTicket.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Auto-generate a label from parsed result ──────────────────────────────────
function autoLabel(result) {
  const cred = result?.credentials?.[0];
  if (!cred) return 'Unknown Ticket';
  const user = cred['User Name']    || '';
  const svc  = cred['Service Name'] || '';
  const isTGT = svc.toLowerCase().includes('krbtgt');
  return `${user}${user ? ' — ' : ''}${isTGT ? 'TGT' : svc || 'TGS'}`;
}
