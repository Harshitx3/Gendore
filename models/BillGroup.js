const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  whoPaid: { type: String, required: true },
  splitBetween: [{ type: String, required: true }],
  date: { type: Date, default: Date.now }
});

const SettlementSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  date: { type: Date, default: Date.now }
});

const BillGroupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  members: [{ type: String, required: true }],
  expenses: [ExpenseSchema],
  settlements: [SettlementSchema],
}, { timestamps: true });

module.exports = mongoose.model('BillGroup', BillGroupSchema);