const Engagement = require('../models/Engagement');
const User       = require('../models/User');

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const logEntry = (action, description, type = 'engagement') => ({
  action, description, type,
});

// GET /api/engagements
exports.getEngagements = async (req, res) => {
  try {
    const engagements = await Engagement.find({
      $or: [
        { user: req.user._id },
        { operators: String(req.user._id) },
      ],
    }).sort({ createdAt: -1 });
    res.json(engagements);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/engagements
exports.createEngagement = async (req, res) => {
  try {
    const { name, company, type, startDate, endDate, operators, stage, status, progress } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Operation name is required.' });
    if (!company?.trim()) return res.status(400).json({ message: 'Company name is required.' });

    let slug = slugify(name);
    const existing = await Engagement.findOne({ user: req.user._id, slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const eng = await Engagement.create({
      user:      req.user._id,
      slug,
      name:      name.trim(),
      company:   company.trim(),
      type:      type || 'External + Internal',
      startDate: startDate || '',
      endDate:   endDate || '',
      operators: operators || [],
      stage:     stage || 'Preparing',
      status:    status || 'PREPARING',
      progress:  progress || 0,
      activityLog: [logEntry('created', `Engagement "${name.trim()}" created`, 'engagement')],
    });

    res.status(201).json(eng);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/engagements/:id
exports.updateEngagement = async (req, res) => {
  try {
    const eng = await Engagement.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { operators: String(req.user._id) },
      ],
    });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });

    const newLogs = [];

    if (req.body.status && req.body.status !== eng.status) {
      newLogs.push(logEntry('status_changed', `Status changed to ${req.body.status}`, 'milestone'));
    }
    if (req.body.stage && req.body.stage !== eng.stage) {
      newLogs.push(logEntry('stage_changed', `Stage changed to "${req.body.stage}"`, 'milestone'));
    }
    if (req.body.progress !== undefined && req.body.progress !== eng.progress) {
      newLogs.push(logEntry('progress_updated', `Progress updated to ${req.body.progress}%`, 'milestone'));
    }

    // Detect finding changes
    if (req.body.findings !== undefined) {
      const prevCount = eng.findings?.length || 0;
      const newCount  = req.body.findings?.length || 0;
      if (newCount > prevCount) {
        const added = req.body.findings[newCount - 1];
        newLogs.push(logEntry(
          'finding_added',
          `New ${added?.severity || ''} finding: ${added?.title || 'finding logged'}`,
          'finding'
        ));
      } else if (newCount < prevCount) {
        newLogs.push(logEntry('finding_removed', `Finding removed`, 'finding'));
      }
    }

    // Detect operator changes
    if (req.body.operators !== undefined) {
      const prev = new Set((eng.operators || []).map(String));
      const next = new Set((req.body.operators || []).map(String));
      const addedIds   = [...next].filter(id => !prev.has(id));
      const removedIds = [...prev].filter(id => !next.has(id));
      if (addedIds.length || removedIds.length) {
        const users = await User.find({ _id: { $in: [...addedIds, ...removedIds] } }).select('callsign');
        const nameMap = {};
        users.forEach(u => { nameMap[String(u._id)] = u.callsign; });
        for (const id of addedIds)   newLogs.push(logEntry('team_updated', `${nameMap[id] || id.slice(-6)} added to team`,   'team'));
        for (const id of removedIds) newLogs.push(logEntry('team_updated', `${nameMap[id] || id.slice(-6)} removed from team`, 'team'));
      }
    }

    // Detect resource changes
    if (req.body.resources !== undefined) {
      newLogs.push(logEntry('resource_updated', 'Resource utilization updated', 'resource'));
    }

    // Detect team skills changes
    if (req.body.teamSkills !== undefined) {
      newLogs.push(logEntry('skills_updated', 'Team skill coverage updated', 'team'));
    }

    const allowed = ['name', 'company', 'type', 'startDate', 'endDate', 'operators',
                     'stage', 'status', 'progress', 'findings', 'notes',
                     'resources', 'teamSkills', 'operatorSkills', 'calendarEvents'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) eng[key] = req.body[key];
    }

    if (req.body.name) {
      const newSlug = slugify(req.body.name);
      const conflict = await Engagement.findOne({ user: eng.user, slug: newSlug, _id: { $ne: eng._id } });
      eng.slug = conflict ? `${newSlug}-${Date.now()}` : newSlug;
    }

    if (newLogs.length > 0) {
      eng.activityLog = [...(eng.activityLog || []), ...newLogs].slice(-100); // keep last 100
    }

    // Mixed fields need explicit marking for Mongoose to detect changes
    if (req.body.operatorSkills !== undefined) {
      eng.markModified('operatorSkills');
    }

    await eng.save();
    res.json(eng);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/engagements/:id
exports.deleteEngagement = async (req, res) => {
  try {
    const eng = await Engagement.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!eng) return res.status(404).json({ message: 'Engagement not found.' });
    res.json({ message: 'Deleted.' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
