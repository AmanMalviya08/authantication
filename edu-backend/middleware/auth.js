// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Authenticate user via JWT token
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. If no token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing'
    });
  }

  try {
    // 3. Verify token and attach user to request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+role');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please log in again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid',
      error: err.message
    });
  }
});

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      });
    }
    next();
  };
};

// Admin-only middleware
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Faculty-only middleware
const protectFaculty = (req, res, next) => {
  if (!req.user || req.user.role !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Faculty only.'
    });
  }
  next();
};

module.exports = {
  authenticate,          // Preferred name
  protect: authenticate, // Alias for compatibility
  restrictTo,            // Role-based restriction
  isAdmin,
  protectFaculty
};
