const VisibilitySetting = require("../models/VisibilitySetting");

// Get all visibility settings
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await VisibilitySetting.find();
    res.json(settings);
  } catch (error) {
    next(error); // Use next to pass error to the error handler
  }
};

// Get settings for a specific role
exports.getSettingsByRole = async (req, res, next) => {
  try {
    const setting = await VisibilitySetting.findOne({ role: req.params.role });
    if (!setting) {
      return res.status(404).json({ message: "Settings not found for this role" });
    }
    res.json(setting);
  } catch (error) {
    next(error); // Use next to pass error to the error handler
  }
};

// Create new visibility settings
exports.createSettings = async (req, res, next) => {
  try {
    const { role, showAssignments, showMarks, showAttendance } = req.body;

    const existing = await VisibilitySetting.findOne({ role });
    if (existing) {
      return res.status(400).json({ message: "Settings already exist for this role. Use update instead." });
    }

    const newSetting = new VisibilitySetting({
      role,
      showAssignments,
      showMarks,
      showAttendance
    });

    await newSetting.save();
    res.status(201).json(newSetting);
  } catch (error) {
    next(error); // Use next to pass error to the error handler
  }
};

// Update visibility settings for a role
exports.updateSettings = async (req, res, next) => {
  try {
    const { showAssignments, showMarks,  showAttendance } = req.body;

    // Check if the request body has all required fields
    if (!showAssignments || !showMarks || !showAttendance) {
      return res.status(400).json({ message: "All fields are required for update." });
    }

    const updatedSetting = await VisibilitySetting.findOneAndUpdate(
      { role: req.params.role },
      { showAssignments, showMarks, showAttendance },
      { new: true }
    );

    if (!updatedSetting) {
      return res.status(404).json({ message: "Settings not found for this role" });
    }

    res.json(updatedSetting);
  } catch (error) {
    next(error); // Use next to pass error to the error handler
  }
};

// Delete visibility settings
exports.deleteSettings = async (req, res, next) => {
  try {
    const setting = await VisibilitySetting.findOneAndDelete({ role: req.params.role });
    if (!setting) {
      return res.status(404).json({ message: "Settings not found for this role" });
    }
    res.json({ message: "Settings deleted successfully" });
  } catch (error) {
    next(error); // Use next to pass error to the error handler
  }
};
