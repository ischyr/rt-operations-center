const mongoose = require('mongoose');

// Escape regex special chars from user input
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Try to use a registered model — silently skip if not available yet
const tryModel = (name) => {
  try { return mongoose.model(name); } catch { return null; }
};

// ── Unified search ────────────────────────────────────────────────────────────
// GET /api/search?q=foo&engagementId=xxxx&limit=8
exports.search = async (req, res) => {
  try {
    const { q = '', engagementId, limit: rawLimit = 8 } = req.query;
    const trimmed = String(q).trim();
    const limit = Math.min(20, Math.max(1, parseInt(rawLimit, 10) || 8));

    if (!trimmed || trimmed.length < 2) {
      return res.json({ results: [] });
    }
    const rx = new RegExp(escape(trimmed), 'i');
    const results = [];

    // Engagement-scoped collections
    if (engagementId) {
      const base = { engagementId };

      // Tasks
      const Task = tryModel('Task');
      if (Task) {
        const docs = await Task.find({
          ...base,
          $or: [{ title: rx }, { description: rx }, { tags: rx }],
        }).select('title status priority').limit(limit).lean();
        docs.forEach(d => results.push({
          kind:     'task',
          id:       d._id.toString(),
          title:    d.title,
          subtitle: `${d.status || ''}${d.priority ? ' · ' + d.priority : ''}`,
        }));
      }

      // Operator Sessions
      const Session = tryModel('OperatorSession');
      if (Session) {
        const docs = await Session.find({
          ...base,
          $or: [{ target: rx }, { action: rx }, { tool: rx }, { notes: rx }],
        }).select('target action status tool').limit(limit).lean();
        docs.forEach(d => results.push({
          kind:     'session',
          id:       d._id.toString(),
          title:    d.target,
          subtitle: `${d.action}${d.status ? ' · ' + d.status : ''}`,
        }));
      }

      // Attack Relay cards
      const Card = tryModel('AttackRelayCard');
      if (Card) {
        const docs = await Card.find({
          ...base,
          $or: [{ target: rx }, { intel: rx }],
        }).select('target phase priority').limit(limit).lean();
        docs.forEach(d => results.push({
          kind:     'relay',
          id:       d._id.toString(),
          title:    d.target,
          subtitle: `${d.phase}${d.priority ? ' · ' + d.priority : ''}`,
        }));
      }

      // Leaks / Credentials
      const Leak = tryModel('LeakEntry');
      if (Leak) {
        const docs = await Leak.find({
          ...base,
          $or: [{ title: rx }, { source: rx }, { targetDomain: rx }, { tags: rx }],
        }).select('title type targetDomain credCount').limit(limit).lean();
        docs.forEach(d => results.push({
          kind:     'leak',
          id:       d._id.toString(),
          title:    d.title,
          subtitle: [
            d.type,
            d.targetDomain,
            d.credCount ? `${d.credCount} creds` : '',
          ].filter(Boolean).join(' · '),
        }));
      }

      // Findings (embedded in Engagement doc)
      const Engagement = tryModel('Engagement');
      if (Engagement) {
        const eng = await Engagement.findById(engagementId)
          .select('findings').lean();
        if (eng?.findings?.length) {
          const matches = eng.findings.filter(f =>
            rx.test(f.title || '') || rx.test(f.description || '')
          ).slice(0, limit);
          matches.forEach(f => results.push({
            kind:     'finding',
            id:       f._id.toString(),
            title:    f.title,
            subtitle: f.severity || 'Info',
          }));
        }
      }
    }

    res.json({ results });
  } catch (e) {
    console.error('[search] error:', e);
    res.status(500).json({ error: e.message });
  }
};
