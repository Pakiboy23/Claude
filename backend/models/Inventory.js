const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['unit', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'count'],
    default: 'unit'
  },
  location: {
    type: String,
    enum: ['pantry', 'fridge', 'freezer', 'other'],
    default: 'pantry'
  },
  lowStockThreshold: {
    type: Number,
    default: 2,
    min: 0
  },
  expirationDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  purchasePrice: {
    type: Number
  },
  purchaseStore: {
    type: String
  }
});

// Compound index for user and product
inventorySchema.index({ userId: 1, productId: 1 }, { unique: true });

// Virtual for checking if item is low stock
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.lowStockThreshold;
});

// Virtual for checking if item is expired or expiring soon
inventorySchema.virtual('expirationStatus').get(function() {
  if (!this.expirationDate) return 'none';

  const now = new Date();
  const daysUntilExpiration = Math.floor((this.expirationDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) return 'expired';
  if (daysUntilExpiration <= 3) return 'expiring-soon';
  if (daysUntilExpiration <= 7) return 'expiring-this-week';
  return 'fresh';
});

// Update lastUpdated before saving
inventorySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Ensure virtuals are included when converting to JSON
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
