const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Changed from 'Student' to 'User' to match your User model
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    default: 'absent',
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Changed from 'Faculty' to 'User' to match your User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index to improve query performance
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);