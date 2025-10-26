const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  savedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Making it optional for now for easier testing
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Method to add savings to a goal
GoalSchema.methods.addSavings = function(amount) {
  this.savedAmount += Number(amount);
  
  // Check if goal is completed
  if (this.savedAmount >= this.targetAmount) {
    this.completed = true;
    this.savedAmount = this.targetAmount; // Cap at target amount
  }
  
  return this.save();
};

// Add toJSON method to ensure proper serialization
GoalSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Goal', GoalSchema);