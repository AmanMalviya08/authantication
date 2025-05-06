const mongoose = require('mongoose');

const MarkSchema = new mongoose.Schema({
  studentRollNumber: {
    type: String,
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'student',
  },
});

MarkSchema.methods.calculateStatus = function() {
  // Assuming 50% is passing mark
  const passingMarks = 50; 
  return this.marksObtained >= passingMarks ? 'Pass' : 'Fail';
};

// Method to get student RollNumber
MarkSchema.methods.getStudentRollNumber = function() {
  return this.studentRollNumber; // Returns the student's RollNumber
};

// Method to get faculty name
MarkSchema.methods.getFacultyName = async function() {
  const faculty = await mongoose.model('Faculty').findById(this.gradedBy);
  return faculty ? faculty.name : 'Unknown Faculty'; // Assuming Faculty model has 'name' field
};

module.exports = mongoose.model('Mark', MarkSchema);
