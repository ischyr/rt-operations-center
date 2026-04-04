const { spawn }   = require('child_process');
const mongoose    = require('mongoose');

// ── Schema ────────────────────────────────────────────────────────────────────
const PortSchema = new mongoose.Schema({
  port:     Number,
  protocol: { type: String, default: 'tcp' },
  state:    { type: String, default: 'open' },
  service:  String,
  version:  String,
}, { _id: false });

const ScanSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },
  target:       { type: String, required: true },
  ports:        [PortSchema],
  rawOutput:    String,
  openCount:    { type: Number, default: 0 },
  status:       { type: String, enum: ['scanning', 'done', 'error'], default: 'scanning' },
  error:        String,
  duration:     Number,
}, { timestamps: true });

const Scan = mongoose.models.NetworkScan
  || mongoose.model('NetworkScan', ScanSchema);

// ── Common port → service map ─────────────────────────────────────────────────
const PORT_SERVICES = {
  21:'ftp', 22:'ssh', 23:'telnet', 25:'smtp', 53:'dns', 80:'http',
  110:'pop3', 111:'rpcbind', 135:'msrpc', 139:'netbios-ssn', 143:'imap',
  443:'https', 445:'microsoft-ds', 993:'imaps', 995:'pop3s',
  1433:'mssql', 1521:'oracle', 3306:'mysql', 3389:'rdp',
  5432:'postgresql', 5900:'vnc', 6379:'redis', 8080:'http-proxy',
  8443:'https-alt', 8888:'http-alt', 9200:'elasticsearch',
  27017:'mongodb', 5985:'winrm', 5986:'winrm-ssl',
  389:'ldap', 636:'ldaps', 88:'kerberos', 464:'kerberos-pw',
  2049:'nfs', 161:'snmp', 514:'syslog',
};

// ── In-memory live state (survives only while server is running) ───────────────
// scanId → { ports, rawLines, docker process }
const liveScans = new Map();

// ── Background scan runner ────────────────────────────────────────────────────
function runScan(scanId, target) {
  const state = liveScans.get(scanId);
  if (!state) return;

  const startedAt = Date.now();

  const containerName = `rustscan-${scanId}`;

  let docker;
  try {
    docker = spawn('docker', [
      'run', '--rm',
      '--name', containerName,
      '--ulimit', 'nofile=5000:5000',
      'rustscan/rustscan',
      '-a', target,
      '-b', '500',
    ]);
  } catch (err) {
    liveScans.delete(scanId);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }).catch(() => {});
    return;
  }

  state.docker        = docker;
  state.containerName = containerName;
  let buf = '';

  const processLine = async (line) => {
    const t = line.trim();
    if (!t) return;
    state.rawLines.push(t);

    // RustScan open line: "Open IP:PORT"
    const openMatch = t.match(/^Open\s+[\d.a-zA-Z\-:]+:(\d+)/);
    if (openMatch) {
      const portNum = parseInt(openMatch[1], 10);
      if (!state.ports.find(p => p.port === portNum)) {
        const entry = { port: portNum, protocol: 'tcp', state: 'open',
                        service: PORT_SERVICES[portNum] || '', version: '' };
        state.ports.push(entry);
        // Flush new port to DB
        Scan.findByIdAndUpdate(scanId, {
          $push: { ports: entry }, $inc: { openCount: 1 },
        }).catch(() => {});
      }
      return;
    }

    // Nmap line: "22/tcp   open  ssh     OpenSSH 8.4"
    const nmapMatch = t.match(/^(\d+)\/(tcp|udp)\s+open\s+(\S+)\s*(.*)?$/);
    if (nmapMatch) {
      const portNum = parseInt(nmapMatch[1], 10);
      const service = nmapMatch[3];
      const version = (nmapMatch[4] || '').trim();
      const existing = state.ports.find(p => p.port === portNum);
      if (existing) {
        existing.service = service;
        existing.version = version;
        // Update service/version in DB
        Scan.findOneAndUpdate(
          { _id: scanId, 'ports.port': portNum },
          { $set: { 'ports.$.service': service, 'ports.$.version': version } }
        ).catch(() => {});
      } else {
        const entry = { port: portNum, protocol: nmapMatch[2], state: 'open', service, version };
        state.ports.push(entry);
        Scan.findByIdAndUpdate(scanId, {
          $push: { ports: entry }, $inc: { openCount: 1 },
        }).catch(() => {});
      }
    }
  };

  docker.stdout.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop();
    lines.forEach(processLine);
  });

  docker.stderr.on('data', (chunk) => {
    chunk.toString().split('\n').forEach(l => {
      if (l.trim()) state.rawLines.push(l.trim());
    });
  });

  docker.on('error', (err) => {
    liveScans.delete(scanId);
    Scan.findByIdAndUpdate(scanId, { status: 'error', error: err.message }).catch(() => {});
  });

  docker.on('close', async (code) => {
    if (buf.trim()) await processLine(buf);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    state.ports.sort((a, b) => a.port - b.port);

    try {
      await Scan.findByIdAndUpdate(scanId, {
        status:    code === 0 ? 'done' : 'error',
        rawOutput: state.rawLines.join('\n'),
        duration,
        openCount: state.ports.length,
      });
    } catch (_) {}

    // Keep in memory briefly for any in-flight polls, then evict
    setTimeout(() => liveScans.delete(scanId), 30000);
  });
}

// ── startScan — starts background job, returns scanId immediately ──────────────
exports.startScan = async (req, res) => {
  const { engagementId } = req.params;
  const { target }       = req.body;

  if (!target?.trim())
    return res.status(400).json({ error: 'Target is required' });

  // Check if engagement already has a scan running
  const running = await Scan.findOne({ engagementId, status: 'scanning' }).lean();
  if (running) {
    return res.status(409).json({ error: 'A scan is already running', scanId: running._id });
  }

  const scan = await Scan.create({
    engagementId,
    target: target.trim(),
    status: 'scanning',
    ports: [],
    openCount: 0,
  });

  liveScans.set(scan._id.toString(), { ports: [], rawLines: [], docker: null });
  runScan(scan._id.toString(), target.trim());

  res.json({ scanId: scan._id });
};

// ── getScan — returns current state (live or completed) ──────────────────────
exports.getScan = async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.scanId).lean();
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    // If still scanning, overlay in-memory ports + live output
    if (scan.status === 'scanning') {
      const live = liveScans.get(req.params.scanId);
      if (live) {
        scan.ports      = live.ports;
        scan.liveOutput = live.rawLines.join('\n');
      }
    }

    res.json(scan);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── killContainer — stops the Docker container and child process ───────────────
function killContainer(live) {
  if (!live) return;
  // Kill the docker run child process
  if (live.docker) {
    try { live.docker.kill('SIGKILL'); } catch (_) {}
  }
  // Force-stop the named container so it actually dies
  if (live.containerName) {
    try {
      spawn('docker', ['kill', live.containerName], { detached: true }).unref();
    } catch (_) {}
  }
}

// ── cancelScan ────────────────────────────────────────────────────────────────
exports.cancelScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try {
    await Scan.findByIdAndUpdate(req.params.scanId, { status: 'error', error: 'Cancelled' });
  } catch (_) {}
  res.json({ ok: true });
};

// ── getHistory ────────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  const { engagementId } = req.params;
  try {
    const scans = await Scan.find({ engagementId })
      .sort({ createdAt: -1 }).limit(50)
      .select('-rawOutput -ports').lean();
    res.json(scans);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── deleteScan ────────────────────────────────────────────────────────────────
exports.deleteScan = async (req, res) => {
  const live = liveScans.get(req.params.scanId);
  killContainer(live);
  liveScans.delete(req.params.scanId);
  try {
    await Scan.findByIdAndDelete(req.params.scanId);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
