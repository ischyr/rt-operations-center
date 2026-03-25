const { spawn }  = require('child_process');
const fs          = require('fs');
const path        = require('path');
const Engagement  = require('../models/Engagement');

// ── Workspace directories ─────────────────────────────────────────────────────
const SUB_DIR       = path.join(__dirname, '..', 'subdomains');
const WORKSPACES    = path.join(SUB_DIR, 'workspaces');
if (!fs.existsSync(WORKSPACES)) fs.mkdirSync(WORKSPACES, { recursive: true });

// ── In-memory live state per scan ─────────────────────────────────────────────
const liveScans = {};
// { [scanId]: { subfinder: { out, subs, status }, amass: {...}, bbot: {...} } }

const toDockerPath = (p) => process.platform === 'win32' ? p.replace(/\\/g, '/') : p;

// ── Subdomain parser ──────────────────────────────────────────────────────────
const parseSubdomains = (output, domain) => {
  const esc   = domain.replace(/\./g, '\\.');
  // Strip ANSI colour codes, then match line-by-line to avoid cross-line merging
  const clean = output.replace(/\x1b\[[0-9;]*m/g, '');
  const re    = new RegExp(`^(?:[a-zA-Z0-9*_-]+\\.)+${esc}$`);
  return [...new Set(
    clean.split(/[\r\n]+/)
      .map(l => l.trim().toLowerCase().replace(/^\*\./, ''))
      .filter(l => re.test(l))
  )];
};

// bbot output: [DNS_NAME]   hostname   source   (tags)
const parseBbot = (output, domain) => {
  const subs = [];
  for (const line of output.split('\n')) {
    const m = line.match(/\[DNS_NAME\]\s+(\S+)/);
    if (m) {
      const h = m[1].toLowerCase();
      if (h.endsWith('.' + domain)) subs.push(h);
    }
  }
  return [...new Set(subs)];
};

// ── Config file generators ────────────────────────────────────────────────────
const genSubfinderConfig = (keys) => {
  const lines = [];
  if (keys.virustotal)     lines.push(`virustotal:\n  - ${keys.virustotal}`);
  if (keys.shodan)         lines.push(`shodan:\n  - ${keys.shodan}`);
  if (keys.censys_id && keys.censys_secret)
                           lines.push(`censys:\n  - ${keys.censys_id}:${keys.censys_secret}`);
  if (keys.securitytrails) lines.push(`securitytrails:\n  - ${keys.securitytrails}`);
  if (keys.github)         lines.push(`github:\n  - ${keys.github}`);
  if (keys.binaryedge)     lines.push(`binaryedge:\n  - ${keys.binaryedge}`);
  if (keys.hunter)         lines.push(`hunter:\n  - ${keys.hunter}`);
  return lines.length ? lines.join('\n') : null;
};


const genBbotSecrets = (keys) => {
  const modules = {};
  if (keys.virustotal)     modules.virustotal     = { api_key: keys.virustotal };
  if (keys.shodan)         modules.shodan         = { api_key: keys.shodan };
  if (keys.censys_id)      modules.censys         = { api_id: keys.censys_id, api_secret: keys.censys_secret || '' };
  if (keys.securitytrails) modules.securitytrails = { api_key: keys.securitytrails };
  if (keys.github)         modules.github         = { api_key: keys.github };
  if (keys.binaryedge)     modules.binaryedge     = { api_key: keys.binaryedge };
  if (keys.hunter)         modules.hunter         = { api_key: keys.hunter };
  if (!Object.keys(modules).length) return null;
  let yaml = 'modules:\n';
  for (const [mod, cfg] of Object.entries(modules)) {
    yaml += `  ${mod}:\n`;
    for (const [k, v] of Object.entries(cfg)) yaml += `    ${k}: ${v}\n`;
  }
  return yaml;
};

// ── Run a single tool ─────────────────────────────────────────────────────────
const runTool = (tool, domain, toolConfig, keys, workspaceDir, scanId) =>
  new Promise((resolve) => {
    const live = liveScans[scanId]?.[tool];
    if (!live) return resolve({ subs: [], error: 'No live state' });

    live.status = 'running';
    let output = '';
    const append = (chunk) => {
      output += chunk;
      if (liveScans[scanId]) liveScans[scanId][tool].out = output;
    };

    // Unique container name so we can force-kill it on timeout/cleanup
    const containerName = `rtoc_${tool}_${scanId}`;

    let dockerArgs;

    if (tool === 'subfinder') {
      const cfgDir = path.join(workspaceDir, 'subfinder');
      fs.mkdirSync(cfgDir, { recursive: true });
      const cfg = genSubfinderConfig(keys);
      if (cfg) fs.writeFileSync(path.join(cfgDir, 'provider-config.yaml'), cfg);
      dockerArgs = [
        'run', '--rm', '--name', containerName,
        '-v', `${toDockerPath(cfgDir)}:/root/.config/subfinder`,
        toolConfig.image || 'projectdiscovery/subfinder:latest',
        '-d', domain, '-all', '-timeout', '60',
      ];

    } else if (tool === 'bbot') {
      const cfgDir = path.join(workspaceDir, 'bbot');
      fs.mkdirSync(cfgDir, { recursive: true });
      const secrets = genBbotSecrets(keys);
      if (secrets) fs.writeFileSync(path.join(cfgDir, 'secrets.yml'), secrets);
      dockerArgs = [
        'run', '--rm', '--name', containerName,
        '-v', `${toDockerPath(cfgDir)}:/root/.config/bbot`,
        toolConfig.image || 'blacklanternsecurity/bbot:stable',
        '-t', domain, '-f', 'subdomain-enum',
      ];
    } else {
      return resolve({ subs: [], error: 'Unknown tool' });
    }

    const killContainer = () => {
      try { spawn('docker', ['rm', '-f', containerName]); } catch {}
    };

    const proc = spawn('docker', dockerArgs, { timeout: 10 * 60 * 1000 });
    proc.stdout.on('data', d => append(d.toString()));
    proc.stderr.on('data', d => append(d.toString()));

    proc.on('close', (code) => {
      const subs = tool === 'bbot'
        ? parseBbot(output, domain)
        : parseSubdomains(output, domain);
      live.subs   = subs;
      live.status = 'done';
      resolve({ subs, output, error: code !== 0 && subs.length === 0 ? `Exit ${code}` : null });
    });

    proc.on('error', (err) => {
      killContainer();
      live.status = 'failed';
      resolve({ subs: [], output: err.message, error: err.message });
    });

    // If Node's timeout fires, force-kill the Docker container
    setTimeout(() => {
      if (live.status === 'running') {
        killContainer();
        live.status = 'failed';
        resolve({ subs: parseBbot(output, domain), output, error: 'Timeout' });
      }
    }, 10 * 60 * 1000 + 5000);
  });

// ── Scan workflow (runs all enabled tools in parallel) ────────────────────────
const scanWorkflow = async (engId, scanId, domain, toolsConfig, keys) => {
  const enabledTools = Object.entries(toolsConfig)
    .filter(([, cfg]) => cfg.enabled)
    .map(([name]) => name);

  liveScans[scanId] = {};
  for (const t of ['subfinder', 'bbot']) {
    liveScans[scanId][t] = {
      out: '', subs: [],
      status: enabledTools.includes(t) ? 'pending' : 'skipped',
    };
  }

  const workspaceDir = path.join(WORKSPACES, engId, scanId);
  fs.mkdirSync(workspaceDir, { recursive: true });

  // Run enabled tools in parallel
  const results = await Promise.all(
    enabledTools.map(tool =>
      runTool(tool, domain, toolsConfig[tool] || {}, keys, workspaceDir, scanId)
        .then(r => ({ tool, ...r }))
        .catch(e => ({ tool, subs: [], error: e.message }))
    )
  );

  // Aggregate
  const toolResults  = {};
  const toolStatuses = {};
  const toolErrors   = {};
  const allSubs      = new Set();

  for (const r of results) {
    toolResults[r.tool]  = r.subs;
    toolStatuses[r.tool] = r.error ? 'failed' : 'done';
    if (r.error) toolErrors[r.tool] = r.error;
    r.subs.forEach(s => allSubs.add(s));
  }
  // skipped tools
  for (const t of ['subfinder', 'bbot']) {
    if (!enabledTools.includes(t)) {
      toolResults[t]  = [];
      toolStatuses[t] = 'skipped';
    }
  }

  const anyDone   = results.some(r => !r.error);
  const allFailed = results.every(r => !!r.error);
  const status    = allFailed ? 'failed' : anyDone ? (results.some(r => r.error) ? 'partial' : 'completed') : 'completed';

  // Flush to DB
  try {
    await Engagement.findOneAndUpdate(
      { _id: engId, 'subdomainScans._id': scanId },
      { $set: {
        'subdomainScans.$.status':      status,
        'subdomainScans.$.results':     toolResults,
        'subdomainScans.$.totalUnique': [...allSubs].sort(),
        'subdomainScans.$.toolStatus':  toolStatuses,
        'subdomainScans.$.errors':      toolErrors,
        'subdomainScans.$.updatedAt':   new Date(),
      }}
    );
  } catch (e) { console.error('[subdomains] db flush error:', e.message); }

  setTimeout(() => { delete liveScans[scanId]; }, 60 * 60 * 1000);
};

// ── POST /api/subdomains/:engId/scan ──────────────────────────────────────────
exports.startScan = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const { domain, toolsConfig, apiKeys, saveConfig } = req.body;
    if (!domain?.trim()) return res.status(400).json({ message: 'Domain is required.' });

    const enabledCount = Object.values(toolsConfig || {}).filter(t => t.enabled).length;
    if (!enabledCount) return res.status(400).json({ message: 'Enable at least one tool.' });

    // Check for an existing running scan for this domain
    const existing = eng.subdomainScans.find(
      s => s.domain === domain.trim().toLowerCase() && s.status === 'running'
    );
    if (existing) return res.status(409).json({ message: 'A scan for this domain is already running.' });

    eng.subdomainScans.push({
      domain:            domain.trim().toLowerCase(),
      status:            'running',
      toolsUsed:         Object.entries(toolsConfig || {}).filter(([, c]) => c.enabled).map(([n]) => n),
      results:           { subfinder: [], bbot: [] },
      totalUnique:       [],
      toolStatus:        {},
      errors:            {},
      scannedBy:         String(req.user._id),
      scannedByCallsign: req.user.callsign || '',
    });

    if (saveConfig) {
      eng.subdomainConfig = { toolsConfig, apiKeys };
    }

    await eng.save();

    const scan   = eng.subdomainScans[eng.subdomainScans.length - 1];
    const scanId = String(scan._id);

    // Fire and forget
    scanWorkflow(String(eng._id), scanId, domain.trim().toLowerCase(), toolsConfig || {}, apiKeys || {});

    res.json(scan);
  } catch (err) {
    console.error('[subdomains] startScan error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/subdomains/:engId/scans/:scanId/status ───────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const scanId = req.params.scanId;
    const live   = liveScans[scanId];

    if (live) {
      const tools = {
        subfinder: { status: live.subfinder?.status, count: live.subfinder?.subs.length ?? 0, output: live.subfinder?.out ?? '' },
        bbot:      { status: live.bbot?.status,      count: live.bbot?.subs.length      ?? 0, output: live.bbot?.out      ?? '' },
      };
      // Still "running" only if at least one tool is pending/running
      const running = Object.values(live).some(t => t?.status === 'pending' || t?.status === 'running');
      return res.json({ running, tools });
    }

    // Scan not in memory — return DB state
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Not found' });
    const scan = eng.subdomainScans.id(scanId);
    if (!scan) return res.status(404).json({ message: 'Scan not found' });

    res.json({
      running:    scan.status === 'running',
      status:     scan.status,
      toolStatus: scan.toolStatus,
      results:    scan.results,
      totalUnique: scan.totalUnique,
      errors:     scan.errors,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE /api/subdomains/:engId/scans/:scanId ───────────────────────────────
exports.deleteScan = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.engId,
      $or: [{ user: req.user._id }, { operators: String(req.user._id) }],
    });
    if (!eng) return res.status(404).json({ message: 'Not found' });

    eng.subdomainScans = eng.subdomainScans.filter(
      s => String(s._id) !== req.params.scanId
    );
    await eng.save();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
