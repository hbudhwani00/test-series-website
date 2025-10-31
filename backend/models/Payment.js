const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examType: {
    type: String,
    enum: ['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    required: true
  },
  promoCode: {
    type: String,
    uppercase: true
  },
  discount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'RAZORPAY'],
    default: 'UPI'
  },
  upiId: {
    type: String,
    default: '8278662431@ptaxis'
  },
  transactionId: {
    type: String
  },
  screenshot: {
    type: String // Base64 or URL to uploaded image
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  notes: {
    type: String
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

// Update timestamp on save
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
