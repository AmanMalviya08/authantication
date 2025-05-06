const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    subject: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    maxMarks: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    submissions: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        fileUrl: {
            type: String,
            required: true
        },
        marksObtained: {
            type: Number,
            default: null
        },
        feedback: String,
        status: {
            type: String,
            enum: ['submitted', 'graded', 'late'],
            default: 'submitted'
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Assignment', assignmentSchema);