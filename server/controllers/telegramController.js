const mongoose = require('mongoose');
const https    = require('https');

// ── Schema ─────────────────────────────────────────────────────────────────────
const configSchema = new mongoose.Schema({
  engagementId: { type: String, required: true, unique: true, index: true },
  botToken:     { type: String, default: '' },
  chatId:       { type: String, default: '' },
  enabled:      { type: Boolean, default: true },
  updatedAt:    { type: Date, default: Date.now },
  alertLog: [{
    severity:       { type: String, default: 'Info' },
    title:          { type: String, default: '' },
    engagementName: { type: String, default: '' },
    sentAt:         { type: Date, default: Date.now },
    type:           { type: String, default: 'finding' }, // 'finding' | 'test'
  }],
});

const Config = mongoose.model('TelegramConfig', configSchema);

// ── Telegram API call ──────────────────────────────────────────────────────────
function telegramRequest(token, method, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: 'api.telegram.org',
      path:     `/bot${token}/${method}`,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ ok: false, description: 'Invalid JSON response' }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function telegramGet(token, method) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.telegram.org/bot${token}/${method}`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ ok: false }); }
      });
    }).on('error', reject);
  });
}

// ── getConfig ──────────────────────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const cfg = await Config.findOne({ engagementId: req.params.engagementId }).lean();
    if (!cfg) return res.json({ configured: false, enabled: false, chatId: '', maskedToken: null });

    const tok = cfg.botToken || '';
    res.json({
      configured:  !!tok && !!cfg.chatId,
      enabled:     cfg.enabled,
      chatId:      cfg.chatId || '',
      maskedToken: tok ? `${tok.slice(0, 6)}…${tok.slice(-4)}` : null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── saveConfig ─────────────────────────────────────────────────────────────────
exports.saveConfig = async (req, res) => {
  const { engagementId } = req.params;
  const { botToken, chatId, enabled } = req.body;

  try {
    const update = { updatedAt: new Date() };
    if (botToken !== undefined && botToken !== '') update.botToken = botToken.trim();
    if (chatId   !== undefined) update.chatId  = chatId.trim();
    if (enabled  !== undefined) update.enabled = enabled;

    const cfg = await Config.findOneAndUpdate(
      { engagementId },
      { $set: update },
      { upsert: true, new: true }
    );

    const tok = cfg.botToken || '';
    res.json({
      configured:  !!tok && !!cfg.chatId,
      enabled:     cfg.enabled,
      chatId:      cfg.chatId || '',
      maskedToken: tok ? `${tok.slice(0, 6)}…${tok.slice(-4)}` : null,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── detectChatId — reads getUpdates to auto-find chat ID ───────────────────────
exports.detectChatId = async (req, res) => {
  const { engagementId } = req.params;
  try {
    const cfg = await Config.findOne({ engagementId }).lean();
    if (!cfg?.botToken) return res.status(400).json({ error: 'Bot token not set' });

    const data = await telegramGet(cfg.botToken, 'getUpdates?limit=10&allowed_updates=message');
    if (!data.ok) return res.status(400).json({ error: data.description || 'Telegram API error' });

    const updates = data.result || [];
    if (!updates.length) return res.status(404).json({ error: 'No messages found. Send /start to @rt_ops_bot first.' });

    const chatId = String(updates[updates.length - 1].message?.chat?.id || '');
    if (!chatId) return res.status(404).json({ error: 'Could not extract chat ID from updates' });

    // Save the detected chat ID
    await Config.findOneAndUpdate({ engagementId }, { $set: { chatId, updatedAt: new Date() } });
    res.json({ chatId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── sendTest ───────────────────────────────────────────────────────────────────
exports.sendTest = async (req, res) => {
  const { engagementId } = req.params;
  try {
    const cfg = await Config.findOne({ engagementId }).lean();
    if (!cfg?.botToken) return res.status(400).json({ error: 'Bot token not set' });
    if (!cfg?.chatId)   return res.status(400).json({ error: 'Chat ID not set' });

    const result = await telegramRequest(cfg.botToken, 'sendMessage', {
      chat_id:    cfg.chatId,
      parse_mode: 'HTML',
      text: [
        '🔴 <b>RT Ops Center — Test Alert</b>',
        '',
        '✅ Telegram integration is working correctly.',
        'You will receive notifications here when new findings are added.',
      ].join('\n'),
    });

    if (!result.ok) return res.status(400).json({ error: result.description || 'Telegram rejected the message' });

    // Log the test to DB
    await Config.findOneAndUpdate(
      { engagementId },
      { $push: { alertLog: { $each: [{ severity: 'Info', title: 'Test notification', engagementName: '', type: 'test', sentAt: new Date() }], $slice: -100 } } }
    );

    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── getAlerts ──────────────────────────────────────────────────────────────────
exports.getAlerts = async (req, res) => {
  try {
    const cfg = await Config.findOne({ engagementId: req.params.engagementId }).select('alertLog').lean();
    const log = (cfg?.alertLog || []).slice().reverse(); // newest first
    res.json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── clearAlerts ────────────────────────────────────────────────────────────────
exports.clearAlerts = async (req, res) => {
  try {
    await Config.findOneAndUpdate(
      { engagementId: req.params.engagementId },
      { $set: { alertLog: [] } }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── sendFindingAlert (called internally from engagementController) ─────────────
exports.sendFindingAlert = async (engagementId, finding, engagementName) => {
  try {
    const cfg = await Config.findOne({ engagementId }).lean();
    if (!cfg?.botToken || !cfg?.chatId || !cfg?.enabled) return;

    const SEVERITY_EMOJI = {
      Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🔵', Info: '⚪',
    };
    const emoji = SEVERITY_EMOJI[finding?.severity] || '🔴';

    await telegramRequest(cfg.botToken, 'sendMessage', {
      chat_id:    cfg.chatId,
      parse_mode: 'HTML',
      text: [
        `${emoji} <b>New Finding — ${finding?.severity || 'Unknown'}</b>`,
        '',
        `📋 <b>${finding?.title || 'Untitled finding'}</b>`,
        `🎯 Engagement: <i>${engagementName || engagementId}</i>`,
        '',
        '🔗 <i>Check RT Ops Center for full details.</i>',
      ].join('\n'),
    });

    // Log to DB (keep last 100)
    await Config.findOneAndUpdate(
      { engagementId },
      { $push: { alertLog: { $each: [{ severity: finding?.severity || 'Info', title: finding?.title || 'Untitled finding', engagementName: engagementName || '', type: 'finding', sentAt: new Date() }], $slice: -100 } } }
    );
  } catch (_) {
    // Non-fatal — never block the main request
  }
};
