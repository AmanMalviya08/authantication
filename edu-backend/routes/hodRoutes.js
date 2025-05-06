const express = require('express');
const router = express.Router();
const {
  getHodProfile,
  updateHodProfile,
  getDepartmentFaculty,
  getDepartmentStudents,
  getDepartmentAttendance,
  getDepartmentMarks,
  getDepartmentAssignments,
} = require('../controllers/hodController');
const { protect, role } = require('../middleware/auth');

router.use(protect, role('hod'));

router.route('/profile')
  .get(getHodProfile)
  .put(updateHodProfile);

router.get('/faculty', getDepartmentFaculty);
router.get('/students', getDepartmentStudents);
router.get('/attendance', getDepartmentAttendance);
router.get('/marks', getDepartmentMarks);
router.get('/assignments', getDepartmentAssignments);

module.exports = router;