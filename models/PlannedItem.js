const mongoose = require('mongoose');

const PlannedItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  where: {
    type: String,
    default: ''
  },
  estimatedAmount: {
    type: Number,
    required: true
  },
  expectedDate: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Add toJSON method to ensure proper serialization
PlannedItemSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('PlannedItem', PlannedItemSchema);