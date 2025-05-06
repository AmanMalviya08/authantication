const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.status(200).json({ success: true, data: users });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, data: user });
});

// @desc    Update a user
// @route   PUT /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  
  // Find the user first to check if they exist and get their current role
  const existingUser = await User.findById(userId);
  
  if (!existingUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Remove password from updates if empty
  if (updates.password === '') {
    delete updates.password;
  }
  
  // Handle fields based on role
  if (existingUser.role === 'student' || existingUser.role === 'hod' || existingUser.role === 'faculty') {
    // Map fullName to name if needed
    if (updates.fullName && !updates.name) {
      updates.name = updates.fullName;
      delete updates.fullName;
    }
    // Map department to dept if needed
    if (updates.department && !updates.dept) {
      updates.dept = updates.department;
      delete updates.department;
    }
  } else {
    // For faculty, HOD, admin roles
    // Map name to fullName if needed
    if (updates.name && !updates.fullName) {
      updates.fullName = updates.name;
      delete updates.name;
    }
    // Map dept to department if needed
    if (updates.dept && !updates.department) {
      updates.department = updates.dept;
      delete updates.dept;
    }
  }
  
  // Hash password if it's being updated
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    updates.password = await bcrypt.hash(updates.password, salt);
  }

  // Update the user
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({ success: true, data: user, message: 'User updated successfully' });
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.status(200).json({ success: true, message: 'User deleted' });
});

// @desc    Get users by role (student, faculty, hod)
// @route   GET /api/users/role/:role
exports.getUsersByRole = asyncHandler(async (req, res) => {
  const role = req.params.role?.toLowerCase();

  const allowedRoles = ["student", "faculty", "hod"];
  if (!allowedRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const users = await User.find({ role }).select('-password');
  res.status(200).json({ success: true, data: users });
});

// @desc    Get total user count by role
// @route   GET /api/users/counts
exports.getUserCounts = asyncHandler(async (req, res) => {
  const roles = ["student", "faculty", "hod", "admin"];
  const counts = {};

  for (const role of roles) {
    counts[role] = await User.countDocuments({ role });
  }

  res.status(200).json({ success: true, counts });
});

// @desc    Bulk delete users
// @route   DELETE /api/users/bulk-delete
exports.bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("Invalid user IDs.");
  }

  await User.deleteMany({ _id: { $in: ids } });

  res.status(200).json({ success: true, message: "Users deleted successfully." });
});