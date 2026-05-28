const Task = require('../models/Task');
const User = require('../models/User');

// Helper to get io instance
const getIO = (req) => req.app.get('io');

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const role = req.user.role;

    let assignee = req.user.id;

    if (role === 'Employee') {
      // Employee tasks are always assigned to themselves
      assignee = req.user.id;
    } else if (role === 'TeamLead') {
      if (assignedTo) {
        // Verify assignee is in their team
        const teamMember = await User.findOne({ _id: assignedTo, teamLeadId: req.user.id });
        const isSelf = assignedTo === req.user.id.toString();
        if (!teamMember && !isSelf) {
          return res.status(403).json({ success: false, message: 'You can only assign tasks to your team members or yourself.' });
        }
        assignee = assignedTo;
      }
    } else if (role === 'Manager') {
      if (assignedTo) {
        assignee = assignedTo;
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      createdBy: req.user.id,
      assignedTo: assignee,
      dueDate,
    });

    const populated = await Task.findById(task._id)
      .populate('createdBy', 'username email role')
      .populate('assignedTo', 'username email role');

    getIO(req).emit('taskCreated', populated);
    res.status(201).json({ success: true, task: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get tasks based on role
exports.getTasks = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const role = req.user.role;
    let filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (role === 'Employee') {
      filter.assignedTo = req.user.id;
    } else if (role === 'TeamLead') {
      const teamMemberIds = await User.find({ teamLeadId: req.user.id }).select('_id');
      const ids = teamMemberIds.map((m) => m._id);
      ids.push(req.user.id);
      filter.assignedTo = { $in: ids };
    }
    // Manager sees all tasks (no assignedTo filter)

    const tasks = await Task.find(filter)
      .populate('createdBy', 'username email role')
      .populate('assignedTo', 'username email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'username email role')
      .populate('assignedTo', 'username email role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const role = req.user.role;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Authorization checks
    if (role === 'Employee') {
      if (task.assignedTo.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only modify your own tasks.' });
      }
    } else if (role === 'TeamLead') {
      const teamMemberIds = await User.find({ teamLeadId: req.user.id }).select('_id');
      const ids = teamMemberIds.map((m) => m._id.toString());
      ids.push(req.user.id.toString());
      if (!ids.includes(task.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'You can only modify tasks assigned to your team.' });
      }

      // Validate reassignment target
      if (assignedTo) {
        const isSelf = assignedTo === req.user.id.toString();
        const isTeamMember = ids.includes(assignedTo);
        if (!isSelf && !isTeamMember) {
          return res.status(403).json({ success: false, message: 'You can only assign to your team members or yourself.' });
        }
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, status, priority, assignedTo: assignedTo || task.assignedTo, dueDate },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'username email role')
      .populate('assignedTo', 'username email role');

    getIO(req).emit('taskUpdated', updatedTask);
    res.status(200).json({ success: true, task: updatedTask });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const role = req.user.role;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (role === 'Employee') {
      if (task.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only delete your own tasks.' });
      }
    } else if (role === 'TeamLead') {
      const teamMemberIds = await User.find({ teamLeadId: req.user.id }).select('_id');
      const ids = teamMemberIds.map((m) => m._id.toString());
      ids.push(req.user.id.toString());
      if (!ids.includes(task.assignedTo.toString())) {
        return res.status(403).json({ success: false, message: 'You can only delete tasks of your team.' });
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    getIO(req).emit('taskDeleted', { id: req.params.id });
    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
