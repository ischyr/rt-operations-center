const router      = require('express').Router();
const https       = require('https');
const http        = require('http');
const { spawn }   = require('child_process');
const dns         = require('dns').promises;
const { protect } = require('../middleware/authMiddleware');

// ── Generic HTTPS fetch ───────────────────────────────────────────────────────
function fetchJSON(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const lib  = u.protocol === 'https:' ? https : http;
    const req  = lib.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   opts.method || 'GET',
      headers:  {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
        ...opts.headers,
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function fetchForm(url, formData) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const body = new URLSearchParams(formData).toString();
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':    'Mozilla/5.0',
        Accept:          'application/json',
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const cleanDomain = (d) =>
  d.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];

// ── VirusTotal ────────────────────────────────────────────────────────────────
async function checkVirusTotal(domain, apiKey) {
  if (!apiKey) return { vendor: 'VirusTotal', status: 'no_key' };
  try {
    const r = await fetchJSON(`https://www.virustotal.com/api/v3/domains/${domain}`, {
      headers: { 'x-apikey': apiKey, accept: 'application/json' },
    });
    if (r.status === 404) return { vendor: 'VirusTotal', status: 'not_found' };
    if (r.status !== 200) return { vendor: 'VirusTotal', status: 'error', detail: `HTTP ${r.status}` };
    const attr  = r.body?.data?.attributes || {};
    const stats = attr.last_analysis_stats || {};
    const cats  = attr.categories || {};
    const reputation = attr.reputation ?? null;
    const malicious  = stats.malicious  || 0;
    const suspicious = stats.suspicious || 0;
    const harmless   = stats.harmless   || 0;
    const total      = malicious + suspicious + harmless + (stats.undetected || 0);
    const categories = [...new Set(Object.values(cats))].slice(0, 4);
    return {
      vendor:     'VirusTotal',
      status:     malicious > 0 ? 'malicious' : suspicious > 0 ? 'suspicious' : 'clean',
      categories,
      reputation,
      malicious, suspicious, harmless, total,
      link: `https://www.virustotal.com/gui/domain/${domain}`,
    };
  } catch (e) {
    return { vendor: 'VirusTotal', status: 'error', detail: e.message };
  }
}

// ── AbuseIPDB ─────────────────────────────────────────────────────────────────
async function checkAbuseIPDB(domain, apiKey) {
  if (!apiKey) return { vendor: 'AbuseIPDB', status: 'no_key' };
  try {
    // Resolve domain to IP first
    const resolved = await dns.resolve4(domain).catch(() => null);
    const ip = resolved?.[0];
    if (!ip) return { vendor: 'AbuseIPDB', status: 'error', detail: 'Could not resolve IP' };

    const r = await fetchJSON(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=30`,
      { headers: { Key: apiKey, Accept: 'application/json' } }
    );
    if (r.status !== 200) return { vendor: 'AbuseIPDB', status: 'error', detail: `HTTP ${r.status}` };
    const d = r.body?.data || {};
    const score = d.abuseConfidenceScore || 0;
    return {
      vendor:     'AbuseIPDB',
      status:     score >= 50 ? 'malicious' : score > 0 ? 'suspicious' : 'clean',
      ip,
      score,
      totalReports: d.totalReports || 0,
      isp:          d.isp || '',
      country:      d.countryCode || '',
      isWhitelisted: d.isWhitelisted || false,
      link: `https://www.abuseipdb.com/check/${ip}`,
    };
  } catch (e) {
    return { vendor: 'AbuseIPDB', status: 'error', detail: e.message };
  }
}

// ── URLhaus / AbuseCH ─────────────────────────────────────────────────────────
async function checkURLhaus(domain) {
  try {
    const r = await fetchForm('https://urlhaus-api.abuse.ch/v1/host/', { host: domain });
    if (r.status !== 200) return { vendor: 'URLhaus', status: 'error', detail: `HTTP ${r.status}` };
    const b = r.body;
    const qs = b?.query_status;
    if (qs === 'no_results') return { vendor: 'URLhaus', status: 'clean', urlCount: 0 };
    const urls      = b?.urls || [];
    const threats   = [...new Set(urls.map(u => u.threat).filter(Boolean))];
    const malicious = urls.filter(u => u.url_status === 'online').length;
    return {
      vendor:    'URLhaus',
      status:    malicious > 0 ? 'malicious' : urls.length > 0 ? 'suspicious' : 'clean',
      urlCount:  urls.length,
      maliciousUrls: malicious,
      threats,
      blacklists: b?.blacklists || {},
      link: `https://urlhaus.abuse.ch/browse.php?search=${domain}`,
    };
  } catch (e) {
    return { vendor: 'URLhaus', status: 'error', detail: e.message };
  }
}

// ── Talos Intelligence (public web API) ───────────────────────────────────────
async function checkTalos(domain) {
  try {
    const url = `https://talosintelligence.com/sb_api/query_lookup?query=%2Freputation&search[]=${encodeURIComponent(domain)}&offset=0&limit=10`;
    const r   = await fetchJSON(url, {
      headers: { Referer: 'https://talosintelligence.com/reputation_center', Accept: 'application/json' },
    });
    if (r.status !== 200) return { vendor: 'Talos', status: 'error', detail: `HTTP ${r.status}` };
    const results = Array.isArray(r.body) ? r.body : (r.body?.results || []);
    const entry   = results[0] || {};
    const category    = entry.category?.description || entry.category || null;
    const reputation  = entry.reputation || null;
    const threatLevel = entry.threat_level || null;
    return {
      vendor:     'Talos',
      status:     threatLevel === 'Malicious' ? 'malicious' : threatLevel === 'Suspicious' ? 'suspicious' : 'clean',
      category,
      reputation,
      threatLevel,
      link: `https://talosintelligence.com/reputation_center/lookup?search=${domain}`,
    };
  } catch (e) {
    return { vendor: 'Talos', status: 'error', detail: e.message };
  }
}

// ── Classifier.py integration ─────────────────────────────────────────────────
function runClassifier(classifierPath, domain) {
  return new Promise((resolve) => {
    if (!classifierPath) return resolve({ vendor: 'Classifier', status: 'not_configured' });
    const args = ['--domain', domain, '--headless', 'check'];
    const proc = spawn('python3', [classifierPath, ...args], { timeout: 120000 });
    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('close', (code) => {
      resolve({ vendor: 'Classifier', status: code === 0 ? 'done' : 'error', output: stdout || stderr });
    });
    proc.on('error', (e) => {
      resolve({ vendor: 'Classifier', status: 'error', detail: e.message });
    });
    setTimeout(() => { proc.kill(); resolve({ vendor: 'Classifier', status: 'timeout' }); }, 115000);
  });
}

// ── POST /api/domain-cat/check ────────────────────────────────────────────────
router.post('/check', protect, async (req, res) => {
  const { domain: raw, vtKey, abuseKey, classifierPath } = req.body;
  if (!raw?.trim()) return res.status(400).json({ message: 'domain required' });
  const domain = cleanDomain(raw);

  // Run API checks in parallel
  const [vt, abuse, urlhaus, talos] = await Promise.all([
    checkVirusTotal(domain, vtKey),
    checkAbuseIPDB(domain, abuseKey),
    checkURLhaus(domain),
    checkTalos(domain),
  ]);

  // Manual-check vendors (no API available — browser automation needed)
  const manual = [
    { vendor: 'BlueCoat / Symantec', link: `https://sitereview.bluecoat.com/#/lookup-result/${domain}`, submitLink: `https://sitereview.bluecoat.com/#/` },
    { vendor: 'McAfee WebAdvisor',   link: `https://sitelookup.mcafee.com/en/feedback/url?action=checksingle&url=${domain}`, submitLink: `https://sitelookup.mcafee.com/en/feedback/url?action=checksingle&url=${domain}` },
    { vendor: 'BrightCloud',         link: `https://www.brightcloud.com/tools/url-ip-lookup.php?url=${domain}`, submitLink: `https://www.brightcloud.com/tools/url-ip-lookup.php` },
    { vendor: 'Palo Alto',           link: `https://urlfiltering.paloaltonetworks.com/query.php?url=${domain}`, submitLink: `https://urlfiltering.paloaltonetworks.com/` },
    { vendor: 'Watchguard',          link: `https://securityportal.watchguard.com/UrlCategory`, submitLink: `https://securityportal.watchguard.com/UrlCategory` },
    { vendor: 'Cisco Umbrella',      link: `https://investigate.umbrella.com/domain-view/name/${domain}/view`, submitLink: null },
    { vendor: 'Lightspeed',          link: `https://archive.lightspeedsystems.com/?q=${domain}`, submitLink: null },
  ].map(v => ({ ...v, status: 'manual' }));

  const results = [vt, abuse, urlhaus, talos, ...manual];

  // Run classifier if path provided (non-blocking — run in background and return base results immediately)
  let classifierResult = null;
  if (classifierPath) {
    classifierResult = await runClassifier(classifierPath, domain);
  }

  res.json({ domain, results, classifierResult });
});

module.exports = router;
