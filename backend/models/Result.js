const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for demo tests
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'testType',
    required: false // Allow null for AI-generated tests
  },
  testType: {
    type: String,
    enum: ['Test', 'DemoTest', 'ScheduledTest'],
    default: 'Test'
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  aiTestMetadata: {
    topics: [{
      subject: String,
      chapter: String,
      topic: String
    }],
    totalQuestions: Number
  },
  demoUserName: {
    type: String
  },
  demoUserEmail: {
    type: String
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    userAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    marksAwarded: Number,
    timeTaken: Number, // in seconds
    chapter: String,
    topic: String,
    subject: String,
    correctAnswer: mongoose.Schema.Types.Mixed,
    explanation: String
    ,
    // Snapshot image fields so results contain all data needed to render solutions
    questionImage: { type: String, default: null },
    optionImages: { type: [String], default: [] },
    explanationImage: { type: String, default: null }
  }],
  score: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  unattempted: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number // total time in seconds
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Result', resultSchema);
