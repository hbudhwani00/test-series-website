const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DraftSchema = new Schema({
  userId: { type: String, required: false },
  testId: { type: String, required: true },
  answers: { type: Schema.Types.Mixed, default: {} },
  isDemo: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Draft', DraftSchema);
