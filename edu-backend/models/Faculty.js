const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  role: { type: String, default: 'faculty' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

FacultySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

FacultySchema.methods.correctPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Faculty', FacultySchema);
