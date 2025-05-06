const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');  // Corrected middleware import
const { checkFeatureAccess } = require('../middleware/role');
const {
  getStudentProfile,
  updateStudentProfile,
  getMyAssignments,
  getMySubjects,
  getMyMarks,
  getMyFees,
  getMyAttendance,
} = require('../controllers/studentController');

// Middleware: Only accessible to logged-in users with student role
router.use(protect, restrictTo('student'));  // Use restrictTo instead of role

// Profile
router.route('/profile')
  .get(getStudentProfile)
  .put(updateStudentProfile);

// Academics with feature toggles
router.get('/assignments', checkFeatureAccess('showAssignments'), getMyAssignments);
router.get('/subjects', checkFeatureAccess('showSubjects'), getMySubjects);
router.get('/marks', checkFeatureAccess('showMarks'), getMyMarks);
router.get('/fees', checkFeatureAccess('showFees'), getMyFees);
router.get('/attendance', checkFeatureAccess('showAttendance'), getMyAttendance);

module.exports = router;
