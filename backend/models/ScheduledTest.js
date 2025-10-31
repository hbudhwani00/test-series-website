const mongoose = require('mongoose');

const scheduledTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
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
  endTime: {
    type: String,
    default: '10:00'
  },
  scheduledDates: [{
    date: Date,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  customDays: [{ // For custom recurring schedules (0 = Sunday, 6 = Saturday)
    type: Number,
    min: 0,
    max: 6
  }],
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

// Index for querying active scheduled tests
scheduledTestSchema.index({ isActive: 1, examType: 1 });
scheduledTestSchema.index({ 'scheduledDates.date': 1 });

module.exports = mongoose.model('ScheduledTest', scheduledTestSchema);
