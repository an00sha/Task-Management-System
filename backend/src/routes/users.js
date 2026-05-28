const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getTeamLeads,
  getMyTeam,
  createUser,
  updateUser,
  deleteUser,
  getUserById,
} = require('../controllers/userController');

// Manager only
router.get('/', protect, authorize('Manager'), getAllUsers);
router.get('/team-leads', protect, authorize('Manager'), getTeamLeads);
router.post('/', protect, authorize('Manager'), createUser);
router.get('/:id', protect, authorize('Manager'), getUserById);
router.put('/:id', protect, authorize('Manager'), updateUser);
router.delete('/:id', protect, authorize('Manager'), deleteUser);

// TeamLead
router.get('/my-team/members', protect, authorize('TeamLead'), getMyTeam);

module.exports = router;
