const express = require("express");
const router = express.Router();

// Controllers
const visibilitySettingsController = require("../controllers/visibilitySettingsController");

// Validators & Middleware
const { validateVisibilitySettings } = require("../validators/visibilitySettingsValidator");
const { authenticate, isAdmin } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/error");


// @route   GET /api/visibility-settings
// @desc    Get all visibility settings
// @access  Admin only
router.get(
  "/", 
  authenticate, 
  isAdmin, 
  visibilitySettingsController.getAllSettings
);


// @route   GET /api/visibility-settings/:role
// @desc    Get visibility settings for a specific role (admin, faculty, student, hod)
// @access  Admin only
router.get(
  "/:role", 
  authenticate, 
  isAdmin, 
  visibilitySettingsController.getSettingsByRole
);


// @route   POST /api/visibility-settings
// @desc    Create visibility settings for a role
// @access  Admin only
router.post(
  "/", 
  authenticate, 
  isAdmin, 
  validateVisibilitySettings, 
  handleValidationErrors, 
  visibilitySettingsController.createSettings
);


// @route   PUT /api/visibility-settings/:role
// @desc    Update visibility settings for a specific role
// @access  Admin only
router.put(
  "/:role", 
  authenticate, 
  isAdmin, 
  validateVisibilitySettings, 
  handleValidationErrors, 
  visibilitySettingsController.updateSettings
);


// @route   DELETE /api/visibility-settings/:role
// @desc    Delete visibility settings for a specific role
// @access  Admin only
router.delete(
  "/:role", 
  authenticate, 
  isAdmin, 
  visibilitySettingsController.deleteSettings
);


module.exports = router;
