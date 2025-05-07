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

// @desc    Get assignment details by ID
// @route   GET /api/student/assignments/:id
// @access  Private/Student
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({
    _id: req.params.id,
    department: req.user.department,
    semester: req.user.semester
  })
  .populate('subject', 'name code')
  .populate('createdBy', 'name email');

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found or not available for your department/semester');
  }

  // Check if student has already submitted
  const submission = assignment.submissions.find(
    sub => sub.student.toString() === req.user._id.toString()
  );

  res.json({
    ...assignment.toObject(),
    submitted: !!submission,
    submissionDate: submission?.submittedAt,
    submissionStatus: submission?.status
  });
});

// @desc    Submit assignment
// @route   POST /api/student/assignments/:id/submit
// @access  Private/Student
const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({
    _id: req.params.id,
    department: req.user.department,
    semester: req.user.semester
  });

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found or not available for your department/semester');
  }

  // Check if already submitted
  const existingSubmission = assignment.submissions.find(
    sub => sub.student.toString() === req.user._id.toString()
  );

  if (existingSubmission) {
    res.status(400);
    throw new Error('You have already submitted this assignment');
  }

  // Check if file was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload your assignment file');
  }

  const submission = {
    student: req.user._id,
    fileUrl: `/uploads/assignments/${req.file.filename}`,
    submittedAt: new Date(),
    status: new Date() > assignment.dueDate ? 'late' : 'submitted'
  };

  if (req.body.comments) {
    submission.comments = req.body.comments;
  }

  assignment.submissions.push(submission);
  await assignment.save();

  res.status(201).json({
    success: true,
    message: 'Assignment submitted successfully',
    submission
  });
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
    .populate('createdBy', 'name');

  // Add submission status for each assignment
  const assignmentsWithStatus = assignments.map(assignment => {
    const submission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );
    return {
      ...assignment.toObject(),
      submitted: !!submission,
      submissionStatus: submission?.status
    };
  });

  res.json(assignmentsWithStatus);
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
  getAssignmentById,
  submitAssignment,
  getMyAssignments,
  getMySubjects,
  getMyMarks,
  getMyAttendance
};