const asyncHandler = require('express-async-handler');
const Hod = require('../models/Hod');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Subject = require('../models/Subject');
const VisibilitySetting = require('../models/VisibilitySetting');

// @desc    Get HOD profile
// @route   GET /api/hod/profile
// @access  Private/HOD
const getHodProfile = asyncHandler(async (req, res) => {
  const hod = await Hod.findById(req.user._id).select('-password');
  
  if (hod) {
    res.json(hod);
  } else {
    res.status(404);
    throw new Error('HOD not found');
  }
});

// @desc    Update HOD profile
// @route   PUT /api/hod/profile
// @access  Private/HOD
const updateHodProfile = asyncHandler(async (req, res) => {
  const hod = await Hod.findById(req.user._id);

  if (hod) {
    hod.name = req.body.name || hod.name;
    hod.email = req.body.email || hod.email;
    hod.department = req.body.department || hod.department;

    if (req.body.password) {
      hod.password = req.body.password;
    }

    const updatedHod = await hod.save();

    res.json({
      _id: updatedHod._id,
      name: updatedHod.name,
      email: updatedHod.email,
      department: updatedHod.department,
      role: updatedHod.role,
    });
  } else {
    res.status(404);
    throw new Error('HOD not found');
  }
});

// @desc    Get department faculty
// @route   GET /api/hod/faculty
// @access  Private/HOD
const getDepartmentFaculty = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'hod' });
  
  if (!settings || !settings.hodCanViewDepartmentData) {
    res.status(403);
    throw new Error('Access to department data is restricted');
  }

  const faculty = await Faculty.find({ department: req.user.department }).select('-password');
  res.json(faculty);
});

// @desc    Get department students
// @route   GET /api/hod/students
// @access  Private/HOD
const getDepartmentStudents = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'hod' });
  
  if (!settings || !settings.hodCanViewDepartmentData) {
    res.status(403);
    throw new Error('Access to department data is restricted');
  }

  const { semester } = req.query;
  let query = { department: req.user.department };

  if (semester) {
    query.semester = semester;
  }

  const students = await Student.find(query).select('-password');
  res.json(students);
});

// @desc    Get department attendance
// @route   GET /api/hod/attendance
// @access  Private/HOD
const getDepartmentAttendance = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'hod' });
  
  if (!settings || !settings.hodCanViewDepartmentData || !settings.showAttendance) {
    res.status(403);
    throw new Error('Access to attendance data is restricted');
  }

  const { subject, date, semester } = req.query;
  let query = {};

  const students = await Student.find({ department: req.user.department });
  const studentIds = students.map(student => student._id);

  query.student = { $in: studentIds };

  if (subject) query.subject = subject;
  if (date) query.date = date;
  if (semester) {
    const studentsInSemester = await Student.find({ 
      department: req.user.department,
      semester: semester 
    });
    query.student = { $in: studentsInSemester.map(s => s._id) };
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'name rollNumber semester')
    .populate('subject', 'name code');
    
  res.json(attendance);
});

// @desc    Get department marks
// @route   GET /api/hod/marks
// @access  Private/HOD
const getDepartmentMarks = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'hod' });
  
  if (!settings || !settings.hodCanViewDepartmentData || !settings.showMarks) {
    res.status(403);
    throw new Error('Access to marks data is restricted');
  }

  const { subject, examType, semester } = req.query;
  let query = {};

  const students = await Student.find({ department: req.user.department });
  const studentIds = students.map(student => student._id);

  query.student = { $in: studentIds };

  if (subject) query.subject = subject;
  if (examType) query.examType = examType;
  if (semester) {
    const studentsInSemester = await Student.find({ 
      department: req.user.department,
      semester: semester 
    });
    query.student = { $in: studentsInSemester.map(s => s._id) };
  }

  const marks = await Mark.find(query)
    .populate('student', 'name rollNumber semester')
    .populate('subject', 'name code');
    
  res.json(marks);
});

// @desc    Get department assignments
// @route   GET /api/hod/assignments
// @access  Private/HOD
const getDepartmentAssignments = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'hod' });
  
  if (!settings || !settings.hodCanViewDepartmentData || !settings.showAssignments) {
    res.status(403);
    throw new Error('Access to assignments data is restricted');
  }

  const { semester } = req.query;
  let query = { department: req.user.department };

  if (semester) {
    query.semester = semester;
  }

  const assignments = await Assignment.find(query)
    .populate('faculty', 'name')
    .populate('subject', 'name code');
    
  res.json(assignments);
});

module.exports = {
  getHodProfile,
  updateHodProfile,
  getDepartmentFaculty,
  getDepartmentStudents,
  getDepartmentAttendance,
  getDepartmentMarks,
  getDepartmentAssignments,
};