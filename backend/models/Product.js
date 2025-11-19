const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'dairy',
      'produce',
      'meat',
      'seafood',
      'bakery',
      'pantry',
      'beverages',
      'frozen',
      'snacks',
      'condiments',
      'other'
    ],
    default: 'other'
  },
  defaultUnit: {
    type: String,
    enum: ['unit', 'lb', 'oz', 'kg', 'g', 'l', 'ml', 'count'],
    default: 'unit'
  },
  imageUrl: {
    type: String
  },
  averagePrice: {
    type: Number
  },
  nutrition: {
    servingSize: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  storeIds: {
    instacart: String,
    amazon: String,
    walmart: String,
    kroger: String
  },
  isVerified: {
    type: Boolean,
    default: false
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

// Update the updatedAt timestamp before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
