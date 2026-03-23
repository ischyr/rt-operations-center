const User = require('../models/User');
const { signToken } = require('../utils/token');

const register = async (req, res) => {
  try {
    const { callsign, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const user = await User.create({ callsign, email, password });

    res.status(201).json({
      message: 'Operator enrolled. Sign in now.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials. Verify and retry.' });
    }

    const token = signToken(user._id);

    res.json({
      message: `Access granted. Welcome, ${user.callsign}.`,
      token,
      user: {
        id: user._id,
        callsign: user.callsign,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login };
