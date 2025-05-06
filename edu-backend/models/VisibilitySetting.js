const mongoose = require("mongoose");

const visibilitySettingSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['Admin', 'Faculty', 'Student', 'HOD'], // specify the roles
  },
  showAssignments: {
    type: Boolean,
    default: true,
  },
  showMarks: {
    type: Boolean,
    default: true,
  },
  showAttendance: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("VisibilitySetting", visibilitySettingSchema);
