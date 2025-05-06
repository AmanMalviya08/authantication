const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllAttendance,
  createAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');

router.get('/', protect, getAllAttendance);
router.post('/', protect, createAttendance);
router.delete('/:id', protect, deleteAttendance);

module.exports = router;
