const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');
const QRCode   = require('qrcode');

// ── Mongoose Schemas ───────────────────────────────────────────────────────────
const msgSchema = new mongoose.Schema({
  id:        { type: String, default: '' },
  from:      { type: String, default: '' },
  fromName:  { type: String, default: '' },
  body:      { type: String, default: '' },
  timestamp: { type: Number, default: 0 },
  hasMedia:  { type: Boolean, default: false },
  type:      { type: String, default: 'chat' },
  isFromMe:  { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
}, { _id: false });

const groupSchema = new mongoose.Schema({
  id:               { type: String, default: '' },
  name:             { type: String, default: '' },
  participantCount: { type: Number, default: 0 },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  engagementId:      { type: String, required: true, unique: true, index: true },
  status:            { type: String, default: 'disconnected',
                       enum: ['disconnected', 'connecting', 'qr_ready', 'authenticated'] },
  qrCode:            { type: String, default: '' },
  selectedGroupId:   { type: String, default: '' },
  selectedGroupName: { type: String, default: '' },
  groups:            { type: [groupSchema], default: [] },
  messages:          { type: [msgSchema], default: [] },
  lastSyncAt:        { type: Date, default: null },
  messageCount:      { type: Number, default: 0 },
}, { timestamps: true });

const WaSession = mongoose.models.WaSession || mongoose.model('WaSession', sessionSchema);

// ── In-memory WhatsApp client store ──────────────────────────────────────────
const clients = new Map(); // engagementId → Client instance

// ── Helpers ───────────────────────────────────────────────────────────────────
async function ensureSession(engagementId) {
  let s = await WaSession.findOne({ engagementId });
  if (!s) s = await WaSession.create({ engagementId });
  return s;
}

async function fetchAndCacheGroups(client, engagementId) {
  try {
    const chats = await client.getChats();
    const groups = chats
      .filter(c => c.isGroup)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        id:               c.id._serialized,
        name:             c.name,
        participantCount: c.participants ? c.participants.length : 0,
      }));
    await WaSession.findOneAndUpdate({ engagementId }, { groups });
    return groups;
  } catch { return []; }
}

async function doSyncMessages(engagementId, limit = 200) {
  const client = clients.get(engagementId);
  if (!client) return 0;

  const session = await WaSession.findOne({ engagementId });
  if (!session || !session.selectedGroupId) return 0;

  try {
    const chat = await client.getChatById(session.selectedGroupId);
    const msgs = await chat.fetchMessages({ limit });

    const formatted = [];
    for (const msg of msgs) {
      let fromName = msg.author || msg.from || '';
      try {
        const contact = await msg.getContact();
        fromName = contact.pushname || contact.name || fromName;
      } catch {}

      // Strip @c.us / @g.us for display
      const fromClean = (msg.author || msg.from || '').replace(/@.*/, '');
      const nameClean = fromName.replace(/@.*/, '') || fromClean;

      formatted.push({
        id:        msg.id._serialized,
        from:      fromClean,
        fromName:  nameClean,
        body:      msg.body || (msg.hasMedia ? `[${msg.type}]` : ''),
        timestamp: msg.timestamp,
        hasMedia:  msg.hasMedia,
        type:      msg.type,
        isFromMe:  msg.fromMe,
        isStarred: false,
      });
    }

    // oldest-first (fetchMessages returns newest-first)
    formatted.reverse();

    await WaSession.findOneAndUpdate(
      { engagementId },
      { messages: formatted, lastSyncAt: new Date(), messageCount: formatted.length }
    );
    return formatted.length;
  } catch (e) {
    console.error('[WhiteTeam] sync error:', e.message);
    return 0;
  }
}

// ── Connect ────────────────────────────────────────────────────────────────────
exports.connect = async (req, res) => {
  try {
    const { engagementId } = req.params;

    // If client already alive, just return current status
    if (clients.has(engagementId)) {
      const session = await ensureSession(engagementId);
      return res.json({ status: session.status, qrCode: session.qrCode });
    }

    // Mark as connecting
    await WaSession.findOneAndUpdate(
      { engagementId },
      { status: 'connecting', qrCode: '', groups: [] },
      { upsert: true, new: true }
    );

    // Lazy-require to avoid crashing if not installed
    let Client, LocalAuth;
    try {
      ({ Client, LocalAuth } = require('whatsapp-web.js'));
    } catch {
      return res.status(500).json({ error: 'whatsapp-web.js not installed. Run: npm install whatsapp-web.js inside /server' });
    }

    // Session auth directory
    const sessPath = path.join(__dirname, '../wa-sessions');
    if (!fs.existsSync(sessPath)) fs.mkdirSync(sessPath, { recursive: true });

    const puppeteerArgs = [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-gpu',
      '--disable-extensions', '--no-first-run',
    ];

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: engagementId, dataPath: sessPath }),
      puppeteer: {
        headless: true,
        executablePath: process.env.CHROME_PATH || undefined,
        args: puppeteerArgs,
      },
    });

    clients.set(engagementId, client);

    // ── Events ─────────────────────────────────────────────────────────────────
    client.on('qr', async (qr) => {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
        await WaSession.findOneAndUpdate({ engagementId }, { status: 'qr_ready', qrCode: dataUrl });
        console.log(`[WhiteTeam][${engagementId}] QR generated`);
      } catch (e) { console.error('[WhiteTeam] QR error:', e.message); }
    });

    client.on('authenticated', async () => {
      await WaSession.findOneAndUpdate({ engagementId }, { status: 'authenticated', qrCode: '' });
      console.log(`[WhiteTeam][${engagementId}] Authenticated`);
    });

    client.on('ready', async () => {
      await WaSession.findOneAndUpdate({ engagementId }, { status: 'authenticated' });
      console.log(`[WhiteTeam][${engagementId}] Ready`);
      await fetchAndCacheGroups(client, engagementId);
    });

    client.on('message', async (msg) => {
      const s = await WaSession.findOne({ engagementId });
      if (!s || !s.selectedGroupId) return;
      // Only capture messages from the selected group
      const from = msg.from || '';
      if (from !== s.selectedGroupId) return;

      let fromName = msg.author || msg.from || '';
      try {
        const contact = await msg.getContact();
        fromName = contact.pushname || contact.name || fromName;
      } catch {}

      const newMsg = {
        id:        msg.id._serialized,
        from:      (msg.author || msg.from || '').replace(/@.*/, ''),
        fromName:  fromName.replace(/@.*/, '') || '',
        body:      msg.body || (msg.hasMedia ? `[${msg.type}]` : ''),
        timestamp: msg.timestamp,
        hasMedia:  msg.hasMedia,
        type:      msg.type,
        isFromMe:  msg.fromMe,
        isStarred: false,
      };

      await WaSession.findOneAndUpdate(
        { engagementId },
        { $push: { messages: newMsg }, lastSyncAt: new Date(), $inc: { messageCount: 1 } }
      );
    });

    client.on('disconnected', async (reason) => {
      console.log(`[WhiteTeam][${engagementId}] Disconnected:`, reason);
      clients.delete(engagementId);
      await WaSession.findOneAndUpdate({ engagementId }, { status: 'disconnected', qrCode: '' });
    });

    client.on('auth_failure', async (msg) => {
      console.error(`[WhiteTeam][${engagementId}] Auth failure:`, msg);
      clients.delete(engagementId);
      await WaSession.findOneAndUpdate({ engagementId }, { status: 'disconnected', qrCode: '' });
    });

    // Start initializing (non-blocking response)
    client.initialize().catch(e => {
      console.error(`[WhiteTeam][${engagementId}] Init error:`, e.message);
      clients.delete(engagementId);
      WaSession.findOneAndUpdate({ engagementId }, { status: 'disconnected' }).catch(() => {});
    });

    res.json({ status: 'connecting' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Status ─────────────────────────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const session = await ensureSession(engagementId);
    res.json({
      status:            session.status,
      qrCode:            session.qrCode,
      selectedGroupId:   session.selectedGroupId,
      selectedGroupName: session.selectedGroupName,
      lastSyncAt:        session.lastSyncAt,
      messageCount:      session.messageCount,
      groups:            session.groups || [],
      isClientAlive:     clients.has(engagementId),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── List groups ────────────────────────────────────────────────────────────────
exports.getGroups = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const client = clients.get(engagementId);
    let groups;
    if (client) {
      groups = await fetchAndCacheGroups(client, engagementId);
    } else {
      const s = await WaSession.findOne({ engagementId });
      groups = s ? s.groups : [];
    }
    res.json({ groups: groups || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Select group ───────────────────────────────────────────────────────────────
exports.selectGroup = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { groupId, groupName } = req.body;
    if (!groupId) return res.status(400).json({ error: 'groupId required' });

    await WaSession.findOneAndUpdate(
      { engagementId },
      { selectedGroupId: groupId, selectedGroupName: groupName || '', messages: [], messageCount: 0 },
      { upsert: true }
    );

    const count = await doSyncMessages(engagementId, 200);
    res.json({ ok: true, messageCount: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Sync messages ──────────────────────────────────────────────────────────────
exports.sync = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const { limit = 200 } = req.body;
    const count = await doSyncMessages(engagementId, Math.min(Number(limit) || 200, 1000));
    const s = await WaSession.findOne({ engagementId });
    res.json({ ok: true, count, lastSyncAt: s?.lastSyncAt });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Get messages ───────────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const s = await WaSession.findOne({ engagementId });
    if (!s) return res.json({ messages: [], lastSyncAt: null, selectedGroupName: '' });
    res.json({
      messages:          s.messages || [],
      lastSyncAt:        s.lastSyncAt,
      selectedGroupName: s.selectedGroupName,
      messageCount:      s.messageCount,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Star / unstar message ──────────────────────────────────────────────────────
exports.starMessage = async (req, res) => {
  try {
    const { engagementId, messageId } = req.params;
    const s = await WaSession.findOne({ engagementId });
    if (!s) return res.status(404).json({ error: 'Session not found' });
    const msg = s.messages.find(m => m.id === messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    msg.isStarred = !msg.isStarred;
    await s.save();
    res.json({ ok: true, isStarred: msg.isStarred });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Disconnect ─────────────────────────────────────────────────────────────────
exports.disconnect = async (req, res) => {
  try {
    const { engagementId } = req.params;
    const client = clients.get(engagementId);
    if (client) {
      try { await client.destroy(); } catch {}
      clients.delete(engagementId);
    }
    await WaSession.findOneAndUpdate(
      { engagementId },
      { status: 'disconnected', qrCode: '', groups: [] }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ── Clear messages ─────────────────────────────────────────────────────────────
exports.clearMessages = async (req, res) => {
  try {
    const { engagementId } = req.params;
    await WaSession.findOneAndUpdate(
      { engagementId },
      { messages: [], messageCount: 0, lastSyncAt: null }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
