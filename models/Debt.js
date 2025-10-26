const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  person: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  direction: {
    type: String,
    enum: ['you_owe', 'they_owe_you'],
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  note: {
    type: String,
    default: ''
  },
  settled: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Debt', DebtSchema);