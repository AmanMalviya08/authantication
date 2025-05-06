const express = require("express");
const router = express.Router();
const visibilitySettingsController = require("../controllers/visibilitySettingsController");
const { validateVisibilitySettings } = require("../validators/visibilitySettingsValidator"); // FIXED!
const { authenticate, isAdmin } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/error");


// Get all visibility settings
router.get("/", authenticate, isAdmin, visibilitySettingsController.getAllSettings);

// Get settings for a specific role
router.get("/:role", authenticate, isAdmin, visibilitySettingsController.getSettingsByRole);

// Create new visibility settings
router.post(
  "/",
  authenticate,
  isAdmin,
  validateVisibilitySettings,
  handleValidationErrors,
  visibilitySettingsController.createSettings
);

// Update visibility settings for a role
router.put(
  "/:role",
  authenticate,
  isAdmin,
  validateVisibilitySettings,
  handleValidationErrors,
  visibilitySettingsController.updateSettings
);

// Delete visibility settings
router.delete("/:role", authenticate, isAdmin, visibilitySettingsController.deleteSettings);

module.exports = router;
