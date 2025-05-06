const Attendance = require('../models/Attendance');
const User = require('../models/User'); // Assuming the User model has all roles (student, faculty, etc.)
const asyncHandler = require('express-async-handler');

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Protected
const createAttendanceRecord = asyncHandler(async (req, res) => {
  const { studentId, facultyId, date, status } = req.body;

  // Validation: Ensure all fields are provided
  if (!studentId || !facultyId || !date || !status) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Check if attendance already exists for the given student and date
  const existingAttendance = await Attendance.findOne({ student: studentId, date });
  if (existingAttendance) {
    res.status(400);
    throw new Error("Attendance already marked for this student on the given date");
  }

  // Create a new attendance record
  const attendance = new Attendance({
    student: studentId,
    markedBy: facultyId,
    date,
    status,
  });

  // Save the attendance to the database
  const saved = await attendance.save();
  res.status(201).json(saved);
});

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Protected
const getAttendanceRecords = asyncHandler(async (req, res) => {
  const records = await Attendance.find()
    .populate('student', 'name department')
    .populate('markedBy', 'name department');

  const formatted = records.map((record) => ({
    _id: record._id,
    studentName: record.student?.name,
    department: record.student?.department,
    date: record.date.toISOString().split('T')[0],
    status: record.status,
    markedBy: record.markedBy?.name,
  }));

  res.json(formatted);
});

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Protected
const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const { status } = req.body;

  // Find the attendance record by ID
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }

  // Update the status of the attendance record
  attendance.status = status || attendance.status;
  const updated = await attendance.save();
  res.json(updated);
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Protected
const deleteAttendanceRecord = asyncHandler(async (req, res) => {
  // Find the attendance record by ID
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    res.status(404);
    throw new Error('Attendance not found');
  }

  // Delete the attendance record
  await attendance.deleteOne();
  res.json({ message: 'Attendance record deleted' });
});

// Export all the functions so they can be used in routes
module.exports = {
  createAttendance: createAttendanceRecord,
  getAllAttendance: getAttendanceRecords,
  updateAttendance: updateAttendanceRecord,
  deleteAttendance: deleteAttendanceRecord,
};
