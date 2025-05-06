const { check } = require('express-validator');

exports.validateVisibilitySettings = [
  check('role')
    .isIn(['student', 'faculty', 'hod'])
    .withMessage('Invalid role specified'),
  check('showAssignments')
    .isBoolean()
    .withMessage('showAssignments must be a boolean'),
  check('showMarks')
    .isBoolean()
    .withMessage('showMarks must be a boolean'),
  check('showFees')
    .isBoolean()
    .withMessage('showFees must be a boolean'),
  check('showAttendance')
    .isBoolean()
    .withMessage('showAttendance must be a boolean'),
];
