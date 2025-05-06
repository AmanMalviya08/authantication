const asyncHandler = require('express-async-handler');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Subject = require('../models/Subject');
const VisibilitySetting = require('../models/VisibilitySetting');

// @desc    Get faculty profile
// @route   GET /api/faculty/profile
// @access  Private/Faculty
const getFacultyProfile = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.user._id).select('-password');
  
  if (faculty) {
    res.json(faculty);
  } else {
    res.status(404);
    throw new Error('Faculty not found');
  }
});

// @desc    Update faculty profile
// @route   PUT /api/faculty/profile
// @access  Private/Faculty
const updateFacultyProfile = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.user._id);

  if (faculty) {
    faculty.name = req.body.name || faculty.name;
    faculty.email = req.body.email || faculty.email;
    faculty.department = req.body.department || faculty.department;

    if (req.body.password) {
      faculty.password = req.body.password;
    }

    const updatedFaculty = await faculty.save();

    res.json({
      _id: updatedFaculty._id,
      name: updatedFaculty.name,
      email: updatedFaculty.email,
      department: updatedFaculty.department,
      role: updatedFaculty.role,
    });
  } else {
    res.status(404);
    throw new Error('Faculty not found');
  }
});

// @desc    Get faculty's students
// @route   GET /api/faculty/students
// @access  Private/Faculty
const getMyStudents = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'faculty' });
  
  if (!settings || !settings.showSubjects) {
    res.status(403);
    throw new Error('Access to students data is restricted');
  }

  // Get subjects taught by the faculty
  const subjects = await Subject.find({ faculty: req.user._id });
  const subjectIds = subjects.map(subject => subject._id);

  // Get students enrolled in these subjects
  const students = await Student.find({ 
    department: req.user.department,
    semester: { $in: subjects.map(s => s.semester) }
  }).select('-password');

  res.json(students);
});

// @desc    Get simplified student list for marks entry
// @route   GET /api/faculty/marks/students
// @access  Private/Faculty
const getStudentsForMarks = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'faculty' });
  
  if (!settings || !settings.facultyCanUpdateMarks) {
    res.status(403);
    throw new Error('Mark submission is restricted');
  }

  // Get subjects taught by the faculty
  const subjects = await Subject.find({ faculty: req.user._id });
  
  const students = await Student.find({ 
    department: req.user.department,
    semester: { $in: subjects.map(s => s.semester) }
  }).select('rollNumber name semester');

  res.status(200).json({
    success: true,
    data: students
  });
});

// @desc    Get student details
// @route   GET /api/faculty/students/:id
// @access  Private/Faculty
const getStudentDetails = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'faculty' });
  
  if (!settings) {
    res.status(403);
    throw new Error('Access to student details is restricted');
  }

  const student = await Student.findById(req.params.id).select('-password');
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const studentData = {
    _id: student._id,
    name: student.name,
    email: student.email,
    rollNumber: student.rollNumber,
    department: student.department,
    semester: student.semester,
  };

  if (settings.showMarks) {
    const marks = await Mark.find({ student: student._id });
    studentData.marks = marks;
  }

  if (settings.showAttendance) {
    const attendance = await Attendance.find({ student: student._id });
    studentData.attendance = attendance;
  }

  if (settings.showAssignments) {
    const assignments = await Assignment.find({ 
      department: student.department,
      semester: student.semester
    });
    studentData.assignments = assignments;
  }

  res.json(studentData);
});

// @desc    Create assignment
// @route   POST /api/faculty/assignments
// @access  Private/Faculty
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, subject, dueDate, maxMarks, department, semester } = req.body;

  const assignment = new Assignment({
    title,
    description,
    subject,
    faculty: req.user._id,
    dueDate,
    maxMarks,
    department,
    semester,
  });

  const createdAssignment = await assignment.save();
  res.status(201).json(createdAssignment);
});

// @desc    Get faculty's assignments
// @route   GET /api/faculty/assignments
// @access  Private/Faculty
const getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ faculty: req.user._id });
  res.json(assignments);
});

// @desc    Update assignment
// @route   PUT /api/faculty/assignments/:id
// @access  Private/Faculty
const updateAssignment = asyncHandler(async (req, res) => {
  const { title, description, dueDate, maxMarks } = req.body;

  const assignment = await Assignment.findById(req.params.id);

  if (assignment) {
    if (assignment.faculty.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this assignment');
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.maxMarks = maxMarks || assignment.maxMarks;

    const updatedAssignment = await assignment.save();
    res.json(updatedAssignment);
  } else {
    res.status(404);
    throw new Error('Assignment not found');
  }
});

// @desc    Delete assignment
// @route   DELETE /api/faculty/assignments/:id
// @access  Private/Faculty
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (assignment) {
    if (assignment.faculty.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this assignment');
    }

    await assignment.remove();
    res.json({ message: 'Assignment removed' });
  } else {
    res.status(404);
    throw new Error('Assignment not found');
  }
});

// @desc    Mark attendance
// @route   POST /api/faculty/attendance
// @access  Private/Faculty
const markAttendance = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'faculty' });
  
  if (!settings || !settings.facultyCanUpdateAttendance) {
    res.status(403);
    throw new Error('Attendance marking is restricted');
  }

  const { student, subject, date, status } = req.body;

  // Check if attendance already exists for this student, subject, and date
  const existingAttendance = await Attendance.findOne({
    student,
    subject,
    date,
  });

  if (existingAttendance) {
    existingAttendance.status = status;
    existingAttendance.markedBy = req.user._id;
    const updatedAttendance = await existingAttendance.save();
    res.json(updatedAttendance);
  } else {
    const attendance = new Attendance({
      student,
      subject,
      date,
      status,
      markedBy: req.user._id,
    });

    const createdAttendance = await attendance.save();
    res.status(201).json(createdAttendance);
  }
});

// @desc    Get attendance
// @route   GET /api/faculty/attendance
// @access  Private/Faculty
const getAttendance = asyncHandler(async (req, res) => {
  const { subject, date, student } = req.query;
  let query = {};

  if (subject) query.subject = subject;
  if (date) query.date = date;
  if (student) query.student = student;

  const attendance = await Attendance.find(query).populate('student', 'name rollNumber');
  res.json(attendance);
});

// @desc    Submit marks
// @route   POST /api/faculty/marks
// @access  Private/Faculty
const submitMarks = asyncHandler(async (req, res) => {
  const settings = await VisibilitySetting.findOne({ role: 'faculty' });
  
  if (!settings || !settings.facultyCanUpdateMarks) {
    res.status(403);
    throw new Error('Mark submission is restricted');
  }

  const { student, subject, assignment, examType, marksObtained, maxMarks } = req.body;

  // Validate marks
  if (marksObtained < 0 || marksObtained > maxMarks) {
    res.status(400);
    throw new Error(`Marks must be between 0 and ${maxMarks}`);
  }

  // Check if marks already exist for this student and assignment/exam
  const existingMark = await Mark.findOne({
    student,
    $or: [
      { assignment: assignment },
      { examType: examType }
    ]
  });

  if (existingMark) {
    res.status(400);
    throw new Error('Marks already submitted for this student and assessment');
  }

  const mark = new Mark({
    student,
    subject,
    assignment,
    examType,
    marksObtained,
    maxMarks,
    gradedBy: req.user._id,
  });

  const createdMark = await mark.save();
  res.status(201).json(createdMark);
});

// @desc    Get marks
// @route   GET /api/faculty/marks
// @access  Private/Faculty
const getMarks = asyncHandler(async (req, res) => {
  const { subject, student, examType } = req.query;
  let query = { gradedBy: req.user._id };

  if (subject) query.subject = subject;
  if (student) query.student = student;
  if (examType) query.examType = examType;

  const marks = await Mark.find(query)
    .populate('student', 'name rollNumber')
    .populate('subject', 'name code')
    .populate('assignment', 'title maxMarks');

  res.json(marks);
});

// @desc    Get marks for specific student
// @route   GET /api/faculty/marks/student/:studentId
// @access  Private/Faculty
const getStudentMarks = asyncHandler(async (req, res) => {
  const marks = await Mark.find({
    student: req.params.studentId,
    gradedBy: req.user._id
  })
  .populate('subject', 'name code')
  .populate('assignment', 'title maxMarks')
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: marks
  });
});

// @desc    Update existing marks
// @route   PUT /api/faculty/marks/:id
// @access  Private/Faculty
const updateMarks = asyncHandler(async (req, res) => {
  const { marksObtained, maxMarks } = req.body;
  
  // Validate marks
  if (marksObtained < 0 || marksObtained > maxMarks) {
    return res.status(400).json({
      success: false,
      message: `Marks must be between 0 and ${maxMarks}`
    });
  }

  const mark = await Mark.findOneAndUpdate(
    { 
      _id: req.params.id,
      gradedBy: req.user._id // Ensure only the faculty who created can update
    },
    { marksObtained },
    { new: true }
  );

  if (!mark) {
    return res.status(404).json({
      success: false,
      message: 'Mark not found or not authorized to update'
    });
  }

  res.status(200).json({
    success: true,
    data: mark
  });
});

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Private/Admin
const getAllFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.find({ isActive: true })
    .select('name department email')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: faculty
  });
});

module.exports = {
  getFacultyProfile,
  updateFacultyProfile,
  getMyStudents,
  getStudentDetails,
  createAssignment,
  getMyAssignments,
  updateAssignment,
  deleteAssignment,
  markAttendance,
  getAttendance,
  submitMarks,
  getMarks,
  getStudentMarks,
  updateMarks,
  getStudentsForMarks,
  getAllFaculty
};