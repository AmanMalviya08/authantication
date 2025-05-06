const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const asyncHandler = require('express-async-handler');

// @desc    Create new mark
// @route   POST /api/marks
// @access  Protected (Faculty)
exports.createMark = asyncHandler(async (req, res) => {
  const { studentRollNumber, marksObtained, gradedBy } = req.body;
  
  // Validate inputs
  if (!studentRollNumber || !marksObtained || !gradedBy) {
    return res.status(400).json({
      success: false,
      message: 'Please provide student roll number, marks obtained, and grading faculty'
    });
  }

  // Check if student exists
  const student = await Student.findOne({ rollNumber: studentRollNumber });
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found with this roll number'
    });
  }

  // Check if faculty exists
  const faculty = await Faculty.findById(gradedBy);
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty not found'
    });
  }

  // Check if marks are valid (0-100)
  if (marksObtained < 0 || marksObtained > 100) {
    return res.status(400).json({
      success: false,
      message: 'Marks must be between 0 and 100'
    });
  }

  // Create the mark
  const mark = await Mark.create({
    studentRollNumber,
    marksObtained,
    gradedBy,
    role: 'student' // Assuming this is needed based on your schema
  });

  res.status(201).json({
    success: true,
    data: mark
  });
});

// @desc    Get all students for dropdown
// @route   GET /api/marks/students
// @access  Protected
exports.getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ isActive: true })
    .select('rollNumber name')
    .sort({ rollNumber: 1 });

  res.status(200).json({
    success: true,
    data: students
  });
});

// @desc    Get all marks
// @route   GET /api/marks
// @access  Protected
exports.getMarks = asyncHandler(async (req, res) => {
  const marks = await Mark.find()
    .populate('gradedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: marks
  });
});

// @desc    Get marks for a specific student
// @route   GET /api/marks/student/:studentRollNumber
// @access  Protected
exports.getStudentMarks = asyncHandler(async (req, res) => {
  const { studentRollNumber } = req.params;

  const marks = await Mark.find({ studentRollNumber })
    .populate('gradedBy', 'name')
    .sort({ createdAt: -1 });

  if (!marks || marks.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No marks found for this student'
    });
  }

  res.status(200).json({
    success: true,
    data: marks
  });
});

// @desc    Get all faculty for dropdown
// @route   GET /api/marks/faculty
// @access  Protected
exports.getAllFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.find({ isActive: true })
    .select('_id name department')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: faculty
  });
});

// @desc    Get student by roll number
// @route   GET /api/marks/student/:rollNumber
// @access  Protected
exports.getStudentByRollNumber = asyncHandler(async (req, res) => {
  const { rollNumber } = req.params;

  const student = await Student.findOne({ rollNumber })
    .select('rollNumber name');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  res.status(200).json({
    success: true,
    data: student
  });
});