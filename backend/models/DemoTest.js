const mongoose = require('mongoose');

const demoTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  duration: {
    type: Number,
    required: true, // in minutes
    default: 180
  },
  totalMarks: {
    type: Number,
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DemoTest', demoTestSchema);
