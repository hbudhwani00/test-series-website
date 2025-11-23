const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  subscriptions: [{
    examType: {
      type: String,
      enum: ['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET']
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    paymentId: String,
    orderId: String,
    amount: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Legacy subscription fields for compatibility
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  subscriptionType: {
    type: String,
    enum: ['JEE', 'NEET', 'BOTH', ''],
    default: ''
  },
  subscriptionExpiry: {
    type: Date
  },
  phoneNumber: {
    type: String
  },
  // Activity tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    device: String,
    userAgent: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
