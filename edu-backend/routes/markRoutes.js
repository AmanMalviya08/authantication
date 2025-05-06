const express = require('express');
const router = express.Router();
const markController = require('../controllers/markController');

const { protect } = require('../middleware/auth');

// Create a new mark (requires protection)
router.post('/', protect, markController.createMark);

// Get all marks
router.get('/marks', markController.getMarks);

// Add this to your existing MarksRoute

router.get('/students', protect, markController.getAllStudents);
// Get marks for a specific student using studentRollNumber
router.get('/marks/student/:studentRollNumber', markController.getStudentMarks);

module.exports = router;
