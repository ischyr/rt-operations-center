const Engagement = require('../models/Engagement');

const findEng = async (engId, userId) =>
  Engagement.findOne({
    _id: engId,
    $or: [{ user: userId }, { operators: String(userId) }],
  });

// POST /:engId/scenarios
exports.createScenario = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const { name, startingPoint, startingDesc, objective, objectiveDesc } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    eng.assumedBreachScenarios.push({
      name:              name.trim(),
      startingPoint:     startingPoint  || 'workstation-user',
      startingDesc:      startingDesc   || '',
      objective:         objective      || 'Domain Admin',
      objectiveDesc:     objectiveDesc  || '',
      createdBy:         String(req.user._id),
      createdByCallsign: req.user.callsign || '',
    });

    await eng.save();
    res.json(eng.assumedBreachScenarios[eng.assumedBreachScenarios.length - 1]);
  } catch (err) {
    console.error('[assumedBreachController] createScenario:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /:engId/scenarios/:scenarioId
exports.updateScenario = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    const scenario = eng.assumedBreachScenarios.id(req.params.scenarioId);
    if (!scenario) return res.status(404).json({ message: 'Scenario not found' });

    const { name, startingPoint, startingDesc, objective, objectiveDesc, steps, status, notes } = req.body;
    if (name          !== undefined) scenario.name          = name.trim();
    if (startingPoint !== undefined) scenario.startingPoint = startingPoint;
    if (startingDesc  !== undefined) scenario.startingDesc  = startingDesc;
    if (objective     !== undefined) scenario.objective     = objective;
    if (objectiveDesc !== undefined) scenario.objectiveDesc = objectiveDesc;
    if (steps !== undefined) {
      // Strip any client-side temp _id values (e.g. "tmp-...") — let Mongoose
      // auto-generate real ObjectIds. Real ObjectIds are 24-char hex strings.
      scenario.steps = steps.map(({ _id, ...rest }) => {
        if (_id && /^[a-f\d]{24}$/i.test(_id)) return { _id, ...rest };
        return rest;
      });
    }
    if (status        !== undefined) scenario.status        = status;
    if (notes         !== undefined) scenario.notes         = notes;

    await eng.save();
    res.json(eng.assumedBreachScenarios.id(req.params.scenarioId));
  } catch (err) {
    console.error('[assumedBreachController] updateScenario:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /:engId/scenarios/:scenarioId
exports.deleteScenario = async (req, res) => {
  try {
    const eng = await findEng(req.params.engId, req.user._id);
    if (!eng) return res.status(404).json({ message: 'Engagement not found' });

    eng.assumedBreachScenarios = eng.assumedBreachScenarios.filter(
      (s) => String(s._id) !== req.params.scenarioId,
    );
    await eng.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('[assumedBreachController] deleteScenario:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
