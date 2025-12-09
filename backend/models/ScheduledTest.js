const mongoose = require('mongoose');

const scheduledTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  // Reference to Test collection (if used)
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },

  // ❗ FIXED — Store ONLY ObjectId references, not full question objects
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    }
  ],

  duration: {
    type: Number,
    required: true
  },

  totalMarks: {
    type: Number,
    required: true
  },

  subject: String,
  chapter: String,

  examType: {
    type: String,
    required: true,
    enum: ['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET']
  },

  testType: {
    type: String,
    enum: ['sunday_full', 'alternate_day'],
    default: 'sunday_full'
  },

  scheduleType: {
    type: String,
    enum: ['one-time', 'alternate-days', 'weekends', 'custom'],
    default: 'one-time'
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date
  },

  startTime: {
    type: String,
    default: "10:00"
  },

  endTime: {
    type: String,
    default: "10:00"
  },

  scheduledDates: [
    {
      date: Date,
      isCompleted: {
        type: Boolean,
        default: false
      }
    }
  ],

  customDays: [
    {
      type: Number,
      min: 0,
      max: 6
    }
  ],

  isActive: {
    type: Boolean,
    default: true
  },

  notificationSent: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexing
scheduledTestSchema.index({ isActive: 1, examType: 1 });
scheduledTestSchema.index({ "scheduledDates.date": 1 });

module.exports = mongoose.model("ScheduledTest", scheduledTestSchema);
