const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unit: {
    type: String,
    enum: ['unit', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'count'],
    default: 'unit'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  addedBy: {
    type: String,
    enum: ['manual', 'auto-alert', 'recipe', 'recurring'],
    default: 'manual'
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  isPurchased: {
    type: Boolean,
    default: false
  },
  purchasedDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 200
  }
});

const shoppingListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    default: 'My Shopping List',
    trim: true
  },
  items: [shoppingListItemSchema],
  isActive: {
    type: Boolean,
    default: true
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

// Update updatedAt before saving
shoppingListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for getting unpurchased items count
shoppingListSchema.virtual('unpurchasedCount').get(function() {
  return this.items.filter(item => !item.isPurchased).length;
});

// Virtual for getting high priority items
shoppingListSchema.virtual('highPriorityItems').get(function() {
  return this.items.filter(item => item.priority === 'high' && !item.isPurchased);
});

// Ensure virtuals are included when converting to JSON
shoppingListSchema.set('toJSON', { virtuals: true });
shoppingListSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
