const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['FIXED', 'PERCENTAGE'],
    default: 'FIXED'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
  maxUses: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableExams: [{
    type: String,
    enum: ['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET']
  }],
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
promoCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);
