const mongoose = require('mongoose');

const neetDemoTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    required: true, // in seconds (default 12000 = 200 minutes)
    default: 12000
  },
  totalMarks: {
    type: Number,
    required: true, // 180 questions * 4 marks = 720
    default: 720
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NEETDemoTest', neetDemoTestSchema);
