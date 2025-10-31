const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  testType: {
    type: String,
    enum: ['demo', 'subject', 'chapter', 'full', 'custom', 'jee_main_pattern'],
    default: 'custom'
  },
  // JEE Main specific pattern
  pattern: {
    type: String,
    enum: ['standard', 'jee_main', 'neet'],
    default: 'standard'
  },
  subject: String,
  chapter: String,
  // Standard question structure
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: Number,
    section: {
      type: String,
      enum: ['A', 'B']
    },
    marks: {
      type: Number,
      default: 4
    },
    negativeMarks: {
      type: Number,
      default: -1
    },
    compulsory: {
      type: Boolean,
      default: true
    }
  }],
  // JEE Main pattern structure (3 subjects × 30 questions each)
  jeeMainStructure: {
    Physics: {
      sectionA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      sectionB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
    },
    Chemistry: {
      sectionA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      sectionB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
    },
    Mathematics: {
      sectionA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      sectionB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
    }
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  instructions: [{
    title: String,
    points: [String]
  }],
  isDemo: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Test', testSchema);
