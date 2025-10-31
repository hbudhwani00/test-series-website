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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
