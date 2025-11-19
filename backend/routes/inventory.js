const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const ShoppingList = require('../models/ShoppingList');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/inventory
// @desc    Get all inventory items for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { location, category, lowStock, expiring } = req.query;

    let query = { userId: req.user.id };

    // Apply filters
    if (location) {
      query.location = location;
    }

    const items = await Inventory.find(query)
      .populate('productId')
      .sort({ lastUpdated: -1 });

    // Apply additional filters that require populated data
    let filteredItems = items;

    if (category) {
      filteredItems = filteredItems.filter(item =>
        item.productId && item.productId.category === category
      );
    }

    if (lowStock === 'true') {
      filteredItems = filteredItems.filter(item => item.isLowStock);
    }

    if (expiring === 'true') {
      filteredItems = filteredItems.filter(item =>
        item.expirationStatus === 'expiring-soon' ||
        item.expirationStatus === 'expiring-this-week' ||
        item.expirationStatus === 'expired'
      );
    }

    res.json({
      success: true,
      count: filteredItems.length,
      data: filteredItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/low-stock', async (req, res) => {
  try {
    const items = await Inventory.find({ userId: req.user.id })
      .populate('productId');

    const lowStockItems = items.filter(item => item.isLowStock);

    res.json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('productId');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory item',
      error: error.message
    });
  }
});

// @route   POST /api/inventory
// @desc    Add item to inventory
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { productId, quantity, unit, location, lowStockThreshold, expirationDate, notes } = req.body;

    // Validation
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId and quantity'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if item already exists in inventory
    let inventoryItem = await Inventory.findOne({
      userId: req.user.id,
      productId
    });

    if (inventoryItem) {
      // Update existing item
      inventoryItem.quantity += quantity;
      if (unit) inventoryItem.unit = unit;
      if (location) inventoryItem.location = location;
      if (lowStockThreshold !== undefined) inventoryItem.lowStockThreshold = lowStockThreshold;
      if (expirationDate) inventoryItem.expirationDate = expirationDate;
      if (notes) inventoryItem.notes = notes;

      await inventoryItem.save();
    } else {
      // Create new item
      inventoryItem = await Inventory.create({
        userId: req.user.id,
        productId,
        quantity,
        unit: unit || product.defaultUnit,
        location,
        lowStockThreshold,
        expirationDate,
        notes
      });
    }

    await inventoryItem.populate('productId');

    res.status(201).json({
      success: true,
      data: inventoryItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to inventory',
      error: error.message
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let item = await Inventory.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update fields
    const allowedUpdates = ['quantity', 'unit', 'location', 'lowStockThreshold', 'expirationDate', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();
    await item.populate('productId');

    // Check if item is now low stock and should be added to shopping list
    if (item.isLowStock) {
      const user = await require('../models/User').findById(req.user.id);
      if (user.preferences.notificationSettings.lowStockAlerts) {
        // Add to shopping list automatically
        let shoppingList = await ShoppingList.findOne({
          userId: req.user.id,
          isActive: true
        });

        if (!shoppingList) {
          shoppingList = await ShoppingList.create({
            userId: req.user.id,
            items: []
          });
        }

        // Check if item is already in shopping list
        const existingItem = shoppingList.items.find(
          i => i.productId.toString() === item.productId._id.toString() && !i.isPurchased
        );

        if (!existingItem) {
          shoppingList.items.push({
            productId: item.productId._id,
            quantity: item.lowStockThreshold - item.quantity + 1,
            unit: item.unit,
            priority: 'high',
            addedBy: 'auto-alert'
          });
          await shoppingList.save();
        }
      }
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
});

// @route   POST /api/inventory/:id/consume
// @desc    Decrease quantity of inventory item
// @access  Private
router.post('/:id/consume', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const item = await Inventory.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    item.quantity = Math.max(0, item.quantity - amount);
    await item.save();
    await item.populate('productId');

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error consuming inventory item',
      error: error.message
    });
  }
});

module.exports = router;
