const mongoose = require('mongoose');

// ── Common port → service map (used for auto-fill) ─────────────────────────────
const COMMON_PORTS = {
  21:'ftp', 22:'ssh', 23:'telnet', 25:'smtp', 53:'dns', 80:'http', 88:'kerberos',
  110:'pop3', 111:'rpcbind', 135:'msrpc', 137:'netbios-ns', 139:'netbios-ssn',
  143:'imap', 161:'snmp', 389:'ldap', 443:'https', 445:'smb', 464:'kpasswd',
  587:'submission', 636:'ldaps', 873:'rsync', 993:'imaps', 995:'pop3s',
  1099:'rmiregistry', 1433:'mssql', 1521:'oracle', 1723:'pptp', 2049:'nfs',
  2222:'ssh-alt', 2375:'docker', 2376:'docker-tls', 3000:'http-dev', 3128:'proxy',
  3268:'globalcat', 3269:'globalcat-ssl', 3306:'mysql', 3389:'rdp', 4444:'metasploit',
  5000:'http-dev', 5432:'postgresql', 5601:'kibana', 5672:'amqp', 5900:'vnc',
  5984:'couchdb', 5985:'winrm', 5986:'winrm-ssl', 6379:'redis', 6443:'k8s-api',
  6667:'irc', 7001:'weblogic', 7474:'neo4j', 8000:'http-dev', 8009:'ajp',
  8080:'http-alt', 8081:'http-alt', 8086:'influxdb', 8443:'https-alt', 8500:'consul',
  8888:'http-alt', 9000:'http-dev', 9042:'cassandra', 9090:'prometheus', 9092:'kafka',
  9200:'elasticsearch', 9300:'elasticsearch', 9418:'git', 10000:'webmin', 11211:'memcached',
  15672:'rabbitmq-mgmt', 27017:'mongodb', 50000:'sap',
};

const CRITICAL_RISK = new Set([
  'docker', 'docker-tls', 'k8s-api', 'metasploit', 'redis', 'mongodb',
  'elasticsearch', 'webmin', 'rabbitmq-mgmt', 'jenkins',
]);

const HIGH_RISK = new Set([
  'ssh', 'ftp', 'telnet', 'rdp', 'smb', 'winrm', 'winrm-ssl',
  'mssql', 'mysql', 'postgresql', 'oracle', 'kerberos', 'ldap', 'ldaps',
  'rpcbind', 'msrpc', 'vnc', 'rsh', 'snmp', 'nfs',
]);

const inferRisk = (service) => {
  const s = (service || '').toLowerCase();
  if (CRITICAL_RISK.has(s)) return 'critical';
  if (HIGH_RISK.has(s))     return 'high';
  if (s.startsWith('http')) return 'medium';
  return 'low';
};

const inferService = (port) => COMMON_PORTS[port] || '';

// ── Bulk parser ────────────────────────────────────────────────────────────────
function parseBulkText(text, defaultHost = '') {
  const lines = (text || '').split(/\r?\n/);
  const out = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Skip nmap headers like "PORT     STATE SERVICE VERSION"
    if (/^\s*PORT\s+STATE\s+SERVICE/i.test(line)) continue;
    if (/^Nmap scan report/i.test(line)) continue;
    if (/^Host is up/i.test(line)) continue;
    if (/^Not shown:/i.test(line)) continue;

    // nmap normal: "22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5"
    let m = line.match(/^(\d+)\/(tcp|udp)\s+(\w+)\s+(\S+)(?:\s+(.+))?$/i);
    if (m) {
      out.push({
        host:     defaultHost,
        port:     parseInt(m[1], 10),
        protocol: m[2].toLowerCase(),
        status:   m[3].toLowerCase() === 'open' ? 'open' :
                  m[3].toLowerCase() === 'filtered' ? 'filtered' :
                  m[3].toLowerCase() === 'closed' ? 'closed' : 'unknown',
        service:  m[4] || '',
        version:  (m[5] || '').trim(),
        banner:   (m[5] || '').trim(),
      });
      continue;
    }

    // masscan: "Discovered open port 22/tcp on 10.0.0.5"
    m = line.match(/Discovered open port (\d+)\/(tcp|udp) on ([\d.a-fA-F:]+)/);
    if (m) {
      const port = parseInt(m[1], 10);
      out.push({
        host: m[3], ip: m[3],
        port,
        protocol: m[2].toLowerCase(),
        status: 'open',
        service: inferService(port),
      });
      continue;
    }

    // masscan binary-style: "Open tcp 80 10.0.0.5 1234567890"
    m = line.match(/^Open\s+(tcp|udp)\s+(\d+)\s+([\d.a-fA-F:]+)/i);
    if (m) {
      const port = parseInt(m[2], 10);
      out.push({
        host: m[3], ip: m[3], port,
        protocol: m[1].toLowerCase(), status: 'open',
        service: inferService(port),
      });
      continue;
    }

    // host:port [service]
    m = line.match(/^([a-zA-Z0-9.\-_]+|\[[0-9a-fA-F:]+\]):(\d+)(?:\s+(.+))?$/);
    if (m) {
      const port = parseInt(m[2], 10);
      out.push({
        host: m[1], port,
        protocol: 'tcp', status: 'open',
        service: (m[3] || '').trim() || inferService(port),
      });
      continue;
    }

    // CSV / TSV: "host,port,service,version" or tabs
    const cols = line.split(/\s*[,\t]\s*/);
    if (cols.length >= 2 && /^\d+$/.test(cols[1])) {
      const port = parseInt(cols[1], 10);
      out.push({
        host: cols[0], port,
        protocol: 'tcp', status: 'open',
        service: cols[2] || inferService(port),
        version: cols[3] || '',
        banner:  cols[3] || '',
      });
    }
  }

  // Dedupe (host:port:protocol)
  const seen = new Set();
  return out.filter(s => {
    const key = `${(s.host || '').toLowerCase()}|${s.port}|${s.protocol}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Schema ─────────────────────────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, index: true },

  host:     { type: String, required: true, trim: true },
  ip:       { type: String, default: '' },
  port:     { type: Number, required: true },
  protocol: { type: String, enum: ['tcp', 'udp', 'icmp', 'unknown'], default: 'tcp' },

  service: { type: String, default: '', trim: true, lowercase: true },
  version: { type: String, default: '' },
  banner:  { type: String, default: '' },

  status:    { type: String, enum: ['open', 'closed', 'filtered', 'unknown'], default: 'open' },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },

  attempted: { type: Boolean, default: false },
  exploited: { type: Boolean, default: false },

  tags:  [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  cves:  [{ type: String, trim: true }],
  source:{ type: String, default: '' },                 // nmap / masscan / manual / etc.

  firstSeen: { type: Date, default: Date.now },
  lastSeen:  { type: Date, default: Date.now },

  createdByOperatorId:    { type: String, default: '' },
  createdByOperatorName:  { type: String, default: '' },
  attemptedByOperatorId:  { type: String, default: '' },
  attemptedByOperatorName:{ type: String, default: '' },
  attemptedAt:            { type: Date,   default: null },
}, { timestamps: true });

serviceSchema.index({ engagementId: 1, host: 1, port: 1, protocol: 1 }, { unique: true });
serviceSchema.index({ engagementId: 1, service: 1 });
serviceSchema.index({ engagementId: 1, port: 1 });

const Service = mongoose.model('ServiceEntry', serviceSchema);

// ── Helpers ────────────────────────────────────────────────────────────────────
const opFromReq = (req) => ({
  id:   req.user?._id?.toString() || '',
  name: req.user?.name || req.user?.email || 'Operator',
});

// ── list ──────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { service, protocol, status, attempted, host, q } = req.query;
    const query = { engagementId: req.params.engagementId };
    if (service)  query.service  = service.toLowerCase();
    if (protocol) query.protocol = protocol.toLowerCase();
    if (status)   query.status   = status;
    if (host)     query.host     = host;
    if (attempted === 'true')  query.attempted = true;
    if (attempted === 'false') query.attempted = false;

    let items = await Service.find(query)
      .sort({ host: 1, port: 1 })
      .limit(5000)
      .lean();

    if (q) {
      const needle = q.toLowerCase();
      items = items.filter(s =>
        (s.host    || '').toLowerCase().includes(needle) ||
        (s.service || '').toLowerCase().includes(needle) ||
        (s.version || '').toLowerCase().includes(needle) ||
        (s.banner  || '').toLowerCase().includes(needle) ||
        (s.notes   || '').toLowerCase().includes(needle) ||
        (s.tags || []).some(t => (t || '').toLowerCase().includes(needle)) ||
        String(s.port).includes(needle)
      );
    }

    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── get one ───────────────────────────────────────────────────────────────────
exports.get = async (req, res) => {
  try {
    const item = await Service.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── create one ────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const op = opFromReq(req);
    const b = req.body || {};

    if (!b.host?.trim()) return res.status(400).json({ error: 'host required' });
    if (!b.port)         return res.status(400).json({ error: 'port required' });

    const port    = parseInt(b.port, 10);
    const service = (b.service || inferService(port) || '').toLowerCase();

    const doc = {
      engagementId,
      host: b.host.trim(), ip: (b.ip || '').trim(),
      port, protocol: (b.protocol || 'tcp').toLowerCase(),
      service, version: b.version || '', banner: b.banner || '',
      status: b.status || 'open',
      riskLevel: b.riskLevel || inferRisk(service),
      attempted: !!b.attempted, exploited: !!b.exploited,
      tags: Array.isArray(b.tags) ? b.tags : (b.tags || '').toString()
        .split(',').map(t => t.trim()).filter(Boolean),
      notes:  b.notes  || '',
      cves:   Array.isArray(b.cves) ? b.cves : (b.cves || '').toString()
        .split(/[\s,]+/).filter(Boolean),
      source: b.source || 'manual',
      createdByOperatorId:   op.id,
      createdByOperatorName: op.name,
    };

    try {
      const created = await Service.create(doc);
      res.status(201).json(created.toObject());
    } catch (e) {
      // Duplicate (host:port:protocol) → update lastSeen instead
      if (e.code === 11000) {
        const existing = await Service.findOneAndUpdate(
          { engagementId, host: doc.host, port: doc.port, protocol: doc.protocol },
          { lastSeen: new Date(),
            ...(doc.service && { service: doc.service }),
            ...(doc.version && { version: doc.version }),
            ...(doc.banner  && { banner: doc.banner })  },
          { new: true }
        ).lean();
        return res.json(existing);
      }
      throw e;
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── bulk import ───────────────────────────────────────────────────────────────
exports.bulk = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const op = opFromReq(req);
    const { text, defaultHost, source } = req.body || {};

    const parsed = parseBulkText(text || '', defaultHost || '');
    if (!parsed.length) return res.json({ imported: 0, skipped: 0, items: [] });

    let imported = 0, skipped = 0, updated = 0;
    const items = [];
    for (const p of parsed) {
      if (!p.host) { skipped++; continue; }
      const svc = (p.service || inferService(p.port) || '').toLowerCase();
      const doc = {
        engagementId,
        host: p.host, ip: p.ip || '',
        port: p.port, protocol: p.protocol || 'tcp',
        service: svc,
        version: p.version || '', banner: p.banner || '',
        status:   p.status || 'open',
        riskLevel: inferRisk(svc),
        source:   (source || 'bulk').toLowerCase(),
        createdByOperatorId:   op.id,
        createdByOperatorName: op.name,
      };
      try {
        const created = await Service.create(doc);
        imported++;
        items.push(created.toObject());
      } catch (e) {
        if (e.code === 11000) {
          const updatedItem = await Service.findOneAndUpdate(
            { engagementId, host: doc.host, port: doc.port, protocol: doc.protocol },
            { lastSeen: new Date(),
              ...(doc.service && { service: doc.service }),
              ...(doc.version && { version: doc.version }),
              ...(doc.banner  && { banner: doc.banner })  },
            { new: true }
          ).lean();
          if (updatedItem) { updated++; items.push(updatedItem); }
          else skipped++;
        } else { skipped++; }
      }
    }
    res.json({ imported, updated, skipped, items });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── update ────────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const op = opFromReq(req);
    const b = req.body || {};
    const patch = {};

    ['service', 'version', 'banner', 'notes', 'host', 'ip', 'source'].forEach(f => {
      if (typeof b[f] === 'string') patch[f] = b[f];
    });
    if (typeof b.port === 'number') patch.port = b.port;
    if (['tcp','udp','icmp','unknown'].includes(b.protocol)) patch.protocol = b.protocol;
    if (['open','closed','filtered','unknown'].includes(b.status)) patch.status = b.status;
    if (['low','medium','high','critical'].includes(b.riskLevel)) patch.riskLevel = b.riskLevel;
    if (typeof b.attempted === 'boolean') {
      patch.attempted = b.attempted;
      if (b.attempted) {
        patch.attemptedAt = new Date();
        patch.attemptedByOperatorId   = op.id;
        patch.attemptedByOperatorName = op.name;
      } else {
        patch.attemptedAt = null;
        patch.attemptedByOperatorId   = '';
        patch.attemptedByOperatorName = '';
      }
    }
    if (typeof b.exploited === 'boolean') patch.exploited = b.exploited;
    if (Array.isArray(b.tags)) patch.tags = b.tags;
    else if (typeof b.tags === 'string') patch.tags = b.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (Array.isArray(b.cves)) patch.cves = b.cves;
    else if (typeof b.cves === 'string') patch.cves = b.cves.split(/[\s,]+/).filter(Boolean);

    const updated = await Service.findByIdAndUpdate(req.params.id, patch, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── delete ────────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── stats ─────────────────────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const items = await Service.find({ engagementId: req.params.engagementId })
      .select('host port service riskLevel attempted')
      .lean();

    const hostMap = new Map();
    const svcMap  = new Map();
    const portMap = new Map();
    let attempted = 0, critical = 0, high = 0;

    for (const s of items) {
      if (s.host) {
        const rec = hostMap.get(s.host) || { host: s.host, count: 0, attempted: 0 };
        rec.count++;
        if (s.attempted) rec.attempted++;
        hostMap.set(s.host, rec);
      }
      if (s.service) svcMap.set(s.service, (svcMap.get(s.service) || 0) + 1);
      if (s.port)    portMap.set(s.port,    (portMap.get(s.port)    || 0) + 1);
      if (s.attempted)              attempted++;
      if (s.riskLevel === 'critical') critical++;
      if (s.riskLevel === 'high')     high++;
    }

    res.json({
      total: items.length,
      attempted, critical, high,
      uniqueHosts:    hostMap.size,
      uniqueServices: svcMap.size,
      topHosts:    [...hostMap.values()].sort((a, b) => b.count - a.count).slice(0, 12),
      topServices: [...svcMap.entries()].map(([name, count]) => ({ name, count }))
                   .sort((a, b) => b.count - a.count).slice(0, 12),
      topPorts:    [...portMap.entries()].map(([port, count]) => ({ port, count }))
                   .sort((a, b) => b.count - a.count).slice(0, 8),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
