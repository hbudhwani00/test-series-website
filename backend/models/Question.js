const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  subject: {
    type: String,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  source: {
    type: String, // e.g., "NCERT", "Previous Year", "Practice"
    default: 'Practice'
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'numerical'],
    required: true
  },
  // JEE Main specific - Section classification
  section: {
    type: String,
    enum: ['A', 'B'], // Section A: MCQs, Section B: Numerical
    default: 'A'
  },
  // Question number for ordering in demo test
  questionNumber: {
    type: Number,
    default: 0
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // Can be array for multiple choice or string/number for others
    required: true
  },
  // For numerical questions - range for correct answer
  numericalRange: {
    min: Number,
    max: Number
  },
  explanation: {
    type: String
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  marks: {
    type: Number,
    default: 4
  },
  negativeMarks: {
    type: Number,
    default: -1
  },
  // JEE Main has different negative marking for different question types
  hasNegativeMarking: {
    type: Boolean,
    default: true // Section A has negative marking, Section B doesn't
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
