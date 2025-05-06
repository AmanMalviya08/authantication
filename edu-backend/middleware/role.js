const asyncHandler = require('express-async-handler');
const VisibilitySetting = require('../models/VisibilitySetting');

// Middleware to validate if the user has access based on role
const roleAuth = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user?.role || req.role; // fallback for flexibility

    if (!allowedRoles.includes(userRole)) {
      res.status(403);
      throw new Error(`User role ${userRole} is not authorized to access this route`);
    }

    next();
  });
};

// Middleware to check if a specific feature is enabled for the user's role
const checkFeatureAccess = (feature) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user?.role || req.role;

    const settings = await VisibilitySetting.findOne({ role: userRole });

    if (!settings || !settings[feature]) {
      res.status(403);
      throw new Error(`Access to ${feature} is restricted for role: ${userRole}`);
    }

    next();
  });
};

// Middleware to attach visibility permissions for future use
const validateRolePermissions = asyncHandler(async (req, res, next) => {
  const userRole = req.user?.role || req.role;

  const settings = await VisibilitySetting.findOne({ role: userRole });

  if (!settings) {
    res.status(403);
    throw new Error('No permission settings found for this role');
  }

  req.permissions = settings;
  next();
});

module.exports = {
  roleAuth,
  checkFeatureAccess,
  validateRolePermissions,
};
