// authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/:id', protect, updateUser);

module.exports = router;