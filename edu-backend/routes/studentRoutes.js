const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const { checkFeatureAccess } = require('../middleware/role');
const studentController = require('../controllers/studentController');
const { assignmentSubmission } = require('../middleware/uploadMiddleware');

// Apply student restriction to all routes below
router.use(protect, restrictTo('student'));

// Assignment Routes
router.get('/assignments/:id', studentController.getAssignmentById);
router.post('/assignments/:id/submit', assignmentSubmission, studentController.submitAssignment);

// Profile Routes
router.route('/profile')
  .get(studentController.getStudentProfile)
  .put(studentController.updateStudentProfile);

// Academic Routes
router.get('/my-assignments', checkFeatureAccess('showAssignments'), studentController.getMyAssignments);
router.get('/my-subjects', checkFeatureAccess('showSubjects'), studentController.getMySubjects);
router.get('/my-marks', checkFeatureAccess('showMarks'), studentController.getMyMarks);
router.get('/my-attendance', checkFeatureAccess('showAttendance'), studentController.getMyAttendance);

module.exports = router;