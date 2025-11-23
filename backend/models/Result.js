const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for demo tests
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
    required: false // Allow null for AI-generated tests
  },
  onModel: {
    type: String,
    enum: ['Test', 'DemoTest', 'NEETDemoTest', 'ScheduledTest'],
    default: 'Test'
  },
  testType: {
    type: String,
    enum: ['Test', 'DemoTest', 'NEETDemoTest', 'ScheduledTest', 'neet_demo', 'jee_demo'],
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
    timeTaken: Number, // Total time in seconds for this question
    timeBreakdown: {
      firstVisit: { type: Number, default: 0 }, // Time spent on first visit
      revisits: [{ type: Number }], // Array of time spent on each revisit
      totalTime: { type: Number, default: 0 } // Total time across all visits
    },
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
    ,
    // Snapshot question metadata for result/dashboard rendering
    questionNumber: { type: Number, default: null },
    questionText: { type: String, default: '' },
    options: { type: [String], default: [] }
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
