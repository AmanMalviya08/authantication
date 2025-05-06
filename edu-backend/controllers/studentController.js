const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Subject = require('../models/Subject');
const VisibilitySetting = require('../models/VisibilitySetting');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
const getStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id).select('-password');
  
  if (student) {
    res.json(student);
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private/Student
const updateStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.user._id);

  if (student) {
    student.name = req.body.name || student.name;
    student.email = req.body.email || student.email;

    if (req.body.password) {
      student.password = req.body.password;
    }

    const updatedStudent = await student.save();

    res.json({
      _id: updatedStudent._id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      rollNumber: updatedStudent.rollNumber,
      department: updatedStudent.department,
      semester: updatedStudent.semester,
      role: updatedStudent.role,
    });
  } else {
    res.status(404);
    throw new Error('Student not found');
  }
});

// @desc    Get student's assignments
// @route   GET /api/student/assignments
// @access  Private/Student
const getMyAssignments = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'student' });
  
  if (!settings || !settings.showAssignments) {
    res.status(403);
    throw new Error('Access to assignments is restricted');
  }

  const assignments = await Assignment.find({
    department: req.user.department,
    semester: req.user.semester,
  }).populate('subject', 'name code')
    .populate('faculty', 'name');

  res.json(assignments);
});

// @desc    Get student's subjects
// @route   GET /api/student/subjects
// @access  Private/Student
const getMySubjects = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'student' });
  
  if (!settings || !settings.showSubjects) {
    res.status(403);
    throw new Error('Access to subjects is restricted');
  }

  const subjects = await Subject.find({
    department: req.user.department,
    semester: req.user.semester,
  }).populate('faculty', 'name');

  res.json(subjects);
});

// @desc    Get student's marks
// @route   GET /api/student/marks
// @access  Private/Student
const getMyMarks = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'student' });
  
  if (!settings || !settings.showMarks) {
    res.status(403);
    throw new Error('Access to marks is restricted');
  }

  const marks = await Mark.find({ student: req.user._id })
    .populate('subject', 'name code')
    .populate('assignment', 'title');

  res.json(marks);
});

// @desc    Get student's fees
// @route   GET /api/student/fees
// @access  Private/Student
const getMyFees = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'student' });
  
  if (!settings || !settings.showFees) {
    res.status(403);
    throw new Error('Access to fees is restricted');
  }

  const fees = await Fee.find({ student: req.user._id });
  res.json(fees);
});

// @desc    Get student's attendance
// @route   GET /api/student/attendance
// @access  Private/Student
const getMyAttendance = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'student' });
  
  if (!settings || !settings.showAttendance) {
    res.status(403);
    throw new Error('Access to attendance is restricted');
  }

  const { subject } = req.query;
  let query = { student: req.user._id };

  if (subject) {
    query.subject = subject;
  }

  const attendance = await Attendance.find(query)
    .populate('subject', 'name code');

  res.json(attendance);
});

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getMyAssignments,
  getMySubjects,
  getMyMarks,
  getMyFees,
  getMyAttendance,
};