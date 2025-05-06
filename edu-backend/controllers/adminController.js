const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Faculty = require('../models/Faculty');
const Hod = require('../models/Hod');
const Student = require('../models/Student');
const VisibilitySetting = require('../models/VisibilitySetting');
const { validateRequest } = require('../middleware/validation');

// ------------------- USER MANAGEMENT -------------------

// GET ALL USERS (All Roles)
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [admins, faculty, hods, students] = await Promise.all([
    Admin.find().select('-password -__v').skip(skip).limit(limit).lean(),
    Faculty.find().select('-password -__v').skip(skip).limit(limit).lean(),
    Hod.find().select('-password -__v').skip(skip).limit(limit).lean(),
    Student.find().select('-password -__v').skip(skip).limit(limit).lean(),
  ]);

  const counts = await Promise.all([
    Admin.countDocuments(),
    Faculty.countDocuments(),
    Hod.countDocuments(),
    Student.countDocuments(),
  ]);

  res.json({
    data: { admins, faculty, hods, students },
    pagination: {
      totalAdmins: counts[0],
      totalFaculty: counts[1],
      totalHods: counts[2],
      totalStudents: counts[3],
      page,
      limit,
      totalPages: {
        admins: Math.ceil(counts[0] / limit),
        faculty: Math.ceil(counts[1] / limit),
        hods: Math.ceil(counts[2] / limit),
        students: Math.ceil(counts[3] / limit),
      },
    },
  });
});

// GET USER BY ID
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  const [admin, faculty, hod, student] = await Promise.all([
    Admin.findById(id).select('-password -__v').lean(),
    Faculty.findById(id).select('-password -__v').lean(),
    Hod.findById(id).select('-password -__v').lean(),
    Student.findById(id).select('-password -__v').lean(),
  ]);

  const user = admin || faculty || hod || student;

  if (!user) {
    res.status(404);
    throw new Error(`User with ID ${id} not found`);
  }

  res.json(user);
});

// UPDATE USER
const updateUserSchema = {
  name: { type: 'string', optional: true },
  email: { type: 'string', format: 'email', optional: true },
  department: { type: 'string', optional: true },
  semester: { type: 'number', optional: true, min: 1, max: 8 },
  rollNumber: { type: 'string', optional: true },
  isActive: { type: 'boolean', optional: true },
};

const updateUser = [
  validateRequest(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const collections = [Admin, Faculty, Hod, Student];
    let user;

    for (const Model of collections) {
      user = await Model.findById(id);
      if (user) break;
    }

    if (!user) {
      res.status(404);
      throw new Error(`User with ID ${id} not found`);
    }

    Object.keys(updates).forEach(key => {
      if (user[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    const updatedUser = await user.save();
    const userObj = updatedUser.toObject();
    delete userObj.password;
    delete userObj.__v;

    res.json({
      message: 'User updated successfully',
      data: userObj,
    });
  }),
];

// DELETE USER
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  const collections = [Admin, Faculty, Hod, Student];
  let deleted = false;

  for (const Model of collections) {
    const result = await Model.deleteOne({ _id: id });
    if (result.deletedCount > 0) {
      deleted = true;
      break;
    }
  }

  if (!deleted) {
    res.status(404);
    throw new Error(`User with ID ${id} not found`);
  }

  res.json({
    message: 'User deleted successfully',
    userId: id,
  });
});

// ------------------- VISIBILITY SETTINGS -------------------

// const visibilitySettingsCache = new Map();

const updateVisibilitySettings = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'faculty', 'hod', 'student'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  let settings = await VisibilitySetting.findOne({ role });

  if (settings) {
    Object.keys(req.body).forEach(key => {
      if (key !== 'role' && settings[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    settings.updatedBy = req.user._id;
  } else {
    settings = new VisibilitySetting({
      ...req.body,
      updatedBy: req.user._id,
    });
  }

  const updatedSettings = await settings.save();
  visibilitySettingsCache.set(role, updatedSettings);

  res.json({
    message: 'Visibility settings updated successfully',
    data: updatedSettings,
  });
});

const getVisibilitySettings = asyncHandler(async (req, res) => {
  const cachedSettings = Array.from(visibilitySettingsCache.values());
  if (cachedSettings.length > 0) {
    return res.json({
      message: 'Settings retrieved from cache',
      data: cachedSettings,
    });
  }

  const settings = await VisibilitySetting.find();
  settings.forEach(setting => {
    visibilitySettingsCache.set(setting.role, setting);
  });

  res.json({
    message: 'Settings retrieved from database',
    data: settings,
  });
});

// ------------------- INDIVIDUAL ROLE GETTERS -------------------

const getAllStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().select('-password -__v');
  res.json({ students });
});

const getAllFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.find().select('-password -__v');
  res.json({ faculty });
});

const getAllHods = asyncHandler(async (req, res) => {
  const hods = await Hod.find().select('-password -__v');
  res.json({ hods });
});

// ------------------- EXPORT CONTROLLERS -------------------

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateVisibilitySettings,
  getVisibilitySettings,
  getAllStudents,
  getAllFaculty,
  getAllHods,
};
