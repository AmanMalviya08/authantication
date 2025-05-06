const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const generateToken = require('../config/jwt');
const User = require('../models/User');

// @desc    Signup
exports.signup = asyncHandler(async (req, res) => {
  const { role, name, email, password, department, rollNumber, semester } = req.body;
  
  // Validation
  if (!role || !name || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: role, name, email, password' 
    });
  }

  // Convert role to lowercase safely
  const lowerRole = String(role).toLowerCase();
  const validRoles = ['admin', 'hod', 'faculty', 'student'];

  if (!validRoles.includes(lowerRole)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid role. Valid roles: admin, hod, faculty, student' 
    });
  }

  // Role-based validation
  if (lowerRole === 'student' && (!rollNumber || !semester)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Students require roll number and semester' 
    });
  }

  if ((lowerRole === 'faculty' || lowerRole === 'hod') && !department) {
    return res.status(400).json({ 
      success: false, 
      message: `${lowerRole} requires department` 
    });
  }

  // Check existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ 
      success: false, 
      message: 'Email already registered' 
    });
  }

  // Create user with lowercase role
  const user = await User.create({ 
    name, 
    email, 
    password,
    role: lowerRole,
    department,
    rollNumber,
    semester
  });

  // Generate token
  const token = generateToken(user._id, user.role);

  // Sanitized user data
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    rollNumber: user.rollNumber,
    semester: user.semester
  };

  res.status(201).json({ success: true, token, user: userData });
});

// @desc    Login
exports.login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password || !role) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Convert role to lowercase safely
  const lowerRole = String(role).toLowerCase();

  const user = await User.findOne({ email, role: lowerRole }).select('+password');

  if (!user || !(await user.correctPassword(password))) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid email or password' 
    });
  }

  if (!user.isActive) {
    return res.status(403).json({ 
      success: false, 
      message: 'Account deactivated. Contact administrator' 
    });
  }

  const token = generateToken(user._id, user.role);

  // Sanitized user data
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    rollNumber: user.rollNumber,
    semester: user.semester
  };

  res.status(200).json({ success: true, token, user: userData });
});

// @desc    Get current user
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password -__v -createdAt -updatedAt');

  res.status(200).json({ success: true, user });
});

// @desc    Update user
exports.updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;
  const allowedUpdates = ['fullName', 'email', 'status', 'department', 'role', 'password'];
  
  // Filter valid updates
  const validUpdates = Object.keys(updates)
    .filter(key => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = updates[key];
      return obj;
    }, {});

  if (Object.keys(validUpdates).length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'No valid fields provided for update' 
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: 'User not found' 
    });
  }

  // Prevent role change for admins
  if (validUpdates.role && user.role === 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin role cannot be modified' 
    });
  }

  // Hash password if updated
  if (validUpdates.password) {
    validUpdates.password = await bcrypt.hash(validUpdates.password, 12);
  }

  // Apply updates
  Object.assign(user, validUpdates);
  await user.save();

  // Sanitized response
  const updatedUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status
  };

  res.status(200).json({ 
    success: true, 
    message: 'User updated successfully',
    user: updatedUser 
  });
});