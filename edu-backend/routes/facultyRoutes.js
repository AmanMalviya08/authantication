const express = require('express');
const router = express.Router();
const {
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
  getStudentMarks, // New controller function
  updateMarks,     // New controller function
  getStudentsForMarks // New controller function
} = require('../controllers/facultyController');
const { protect, restrictTo } = require('../middleware/auth');

// Middleware: Only accessible to logged-in users with faculty role
router.use(protect, restrictTo('faculty'));

// Profile
router.route('/profile')
  .get(getFacultyProfile)
  .put(updateFacultyProfile);

// Students
router.get('/students', getMyStudents);
router.get('/students/:id', getStudentDetails);

// Marks-specific student list (simplified for marks entry)
router.get('/marks/students', getStudentsForMarks);

// Assignments
router.route('/assignments')
  .get(getMyAssignments)
  .post(createAssignment);

router.route('/assignments/:id')
  .put(updateAssignment)
  .delete(deleteAssignment);

// Attendance
router.route('/attendance')
  .post(markAttendance)
  .get(getAttendance);

// Marks - Enhanced endpoints
router.route('/marks')
  .post(submitMarks)      // Create new marks
  .get(getMarks);         // Get all marks entered by this faculty

router.route('/marks/:id')
  .put(updateMarks);      // Update existing marks

router.get('/marks/student/:studentId', getStudentMarks); // Get marks for specific student

module.exports = router;