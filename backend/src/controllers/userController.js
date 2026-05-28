const User = require('../models/User');

// Manager: get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('managerId', 'username email')
      .populate('teamLeadId', 'username email');
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager: get all team leads
exports.getTeamLeads = async (req, res) => {
  try {
    const teamLeads = await User.find({ role: 'TeamLead' }).select('-password');
    res.status(200).json({ success: true, teamLeads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TeamLead: get team members under this team lead
exports.getMyTeam = async (req, res) => {
  try {
    const members = await User.find({ teamLeadId: req.user.id, role: 'Employee' }).select('-password');
    res.status(200).json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager: create a new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role, managerId, teamLeadId } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }

    const user = await User.create({ username, email, password, role, managerId, teamLeadId });
    res.status(201).json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager: update a user
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, managerId, teamLeadId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role, managerId, teamLeadId },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Manager: delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single user by ID (Manager only)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('managerId', 'username email')
      .populate('teamLeadId', 'username email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
