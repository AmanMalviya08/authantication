const Assignment = require('../models/Assignment');
const asyncHandler = require('express-async-handler');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Faculty/HOD/Admin
const createAssignment = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    subject,
    department,
    semester,
    maxMarks,
    dueDate,
  } = req.body;

  const assignment = new Assignment({
    title,
    description,
    subject,
    department,
    semester,
    maxMarks,
    dueDate,
    createdBy: req.user._id, // Assuming user is attached to request via auth middleware
  });

  const createdAssignment = await assignment.save();
  res.status(201).json(createdAssignment);
});

// @desc    Get all assignments (with optional filters)
// @route   GET /api/assignments
// @access  Protected
const getAllAssignments = asyncHandler(async (req, res) => {
  const { department, semester, subject } = req.query;
  const filter = { isActive: true };
  
  if (department) filter.department = department;
  if (semester) filter.semester = semester;
  if (subject) filter.subject = subject;

  const assignments = await Assignment.find(filter)
    .populate('createdBy', 'name email')
    .sort({ dueDate: 1 });
  res.json(assignments);
});

// @desc    Get single assignment by ID with submissions
// @route   GET /api/assignments/:id
// @access  Protected
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('submissions.student', 'name rollNumber');

  if (!assignment || !assignment.isActive) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  res.json(assignment);
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Faculty/HOD/Admin
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  
  if (!assignment || !assignment.isActive) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify the user is the creator or has admin rights
  if (assignment.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this assignment');
  }

  const {
    title,
    description,
    subject,
    department,
    semester,
    maxMarks,
    dueDate,
    isActive
  } = req.body;

  assignment.title = title || assignment.title;
  assignment.description = description || assignment.description;
  assignment.subject = subject || assignment.subject;
  assignment.department = department || assignment.department;
  assignment.semester = semester || assignment.semester;
  assignment.maxMarks = maxMarks || assignment.maxMarks;
  assignment.dueDate = dueDate || assignment.dueDate;
  if (typeof isActive !== 'undefined') assignment.isActive = isActive;

  const updatedAssignment = await assignment.save();
  res.json(updatedAssignment);
});

// @desc    Delete assignment (soft delete)
// @route   DELETE /api/assignments/:id
// @access  Faculty/HOD/Admin
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify the user is the creator or has admin rights
  if (assignment.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this assignment');
  }

  assignment.isActive = false;
  await assignment.save();
  res.json({ message: 'Assignment deactivated successfully' });
});

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Student
const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  
  if (!assignment || !assignment.isActive) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Check if file was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  // Check if already submitted
  const existingSubmission = assignment.submissions.find(
    sub => sub.student.toString() === req.user._id.toString()
  );

  if (existingSubmission) {
    // Delete the newly uploaded file since submission failed
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    res.status(400);
    throw new Error('You have already submitted this assignment');
  }

  // Construct file URL (adjust according to your server setup)
  const fileUrl = `/uploads/assignments/${req.file.filename}`;

  const submission = {
    student: req.user._id,
    fileUrl,
    status: new Date() > assignment.dueDate ? 'late' : 'submitted',
    comments: req.body.comments || ''
  };

  assignment.submissions.push(submission);
  await assignment.save();
  
  res.status(201).json({ 
    message: 'Assignment submitted successfully',
    submission
  });
});

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Faculty/HOD/Admin
const gradeAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  
  if (!assignment || !assignment.isActive) {
    res.status(404);
    throw new Error('Assignment not found');
  }

  // Verify the user is the creator or has admin rights
  if (assignment.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Not authorized to grade this assignment');
  }

  const submission = assignment.submissions.id(req.params.submissionId);
  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  submission.marksObtained = req.body.marksObtained;
  submission.feedback = req.body.feedback;
  submission.status = 'graded';

  await assignment.save();
  res.json({ message: 'Submission graded successfully' });
});

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignment
};