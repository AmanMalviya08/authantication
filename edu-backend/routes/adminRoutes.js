const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Controllers
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateVisibilitySettings,
  getVisibilitySettings,
  getAllStudents,
  getAllFaculty,
  getAllHods,
  registerAdmin
} = require('../controllers/adminController');

// Middlewares
const { protect } = require('../middleware/auth');
const { roleAuth } = require('../middleware/role');

// ✅ Apply middleware to protect all admin routes
router.use(protect, roleAuth('admin'));

// ✅ All your admin functionality routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/students', getAllStudents);
router.get('/faculty', getAllFaculty);
router.get('/hods', getAllHods);

router.put('/settings/visibility', updateVisibilitySettings);
router.get('/settings/visibility', getVisibilitySettings);

// // ✅ Route to register new admin (if needed)
// router.post('/register', registerAdmin);

// ✅ This should come last to avoid collision with above routes
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;

    let filter = {};
    if (type === 'student') filter.role = 'student';
    else if (type === 'faculty') filter.role = 'faculty';
    else if (type === 'hod') filter.role = 'hod';
    else return res.status(400).json({ message: 'Invalid type' });

    const users = await User.find(filter).select('_id name dept status');
    res.json(users);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Failed to load data' });
  }
});

module.exports = router;
