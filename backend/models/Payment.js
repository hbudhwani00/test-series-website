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

// Validate amount calculation
paymentSchema.pre('save', function(next) {
  if (this.discount > this.originalAmount) {
    return next(new Error('Discount cannot exceed original amount'));
  }
  
  const expectedAmount = this.originalAmount - this.discount;
  if (Math.abs(this.amount - expectedAmount) > 0.01) {
    return next(new Error('Amount calculation mismatch'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Add index for transaction ID
paymentSchema.index({ transactionId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
