const mongoose = require('mongoose');

const demoLeadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v); // Indian phone number validation
      },
      message: props => `${props.value} is not a valid Indian phone number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values
  },
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result'
  },
  testScore: {
    type: Number
  },
  testPercentage: {
    type: Number
  },
  convertedToUser: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    default: 'demo_test'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
demoLeadSchema.index({ phone: 1 });
demoLeadSchema.index({ createdAt: -1 });
demoLeadSchema.index({ convertedToUser: 1 });

module.exports = mongoose.model('DemoLead', demoLeadSchema);
