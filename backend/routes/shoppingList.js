const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const Inventory = require('../models/Inventory');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/shopping-list
// @desc    Get user's active shopping list
// @access  Private
router.get('/', async (req, res) => {
  try {
    let shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    }).populate('items.productId');

    // Create one if doesn't exist
    if (!shoppingList) {
      shoppingList = await ShoppingList.create({
        userId: req.user.id,
        items: []
      });
    }

    res.json({
      success: true,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shopping list',
      error: error.message
    });
  }
});

// @route   GET /api/shopping-list/all
// @desc    Get all shopping lists (including archived)
// @access  Private
router.get('/all', async (req, res) => {
  try {
    const shoppingLists = await ShoppingList.find({
      userId: req.user.id
    })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: shoppingLists.length,
      data: shoppingLists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shopping lists',
      error: error.message
    });
  }
});

// @route   POST /api/shopping-list/items
// @desc    Add item to shopping list
// @access  Private
router.post('/items', async (req, res) => {
  try {
    const { productId, quantity, unit, priority, notes } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

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

    // Check if item already exists (and not purchased)
    const existingItemIndex = shoppingList.items.findIndex(
      item => item.productId.toString() === productId && !item.isPurchased
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      shoppingList.items[existingItemIndex].quantity += quantity || 1;
      if (priority) shoppingList.items[existingItemIndex].priority = priority;
      if (notes) shoppingList.items[existingItemIndex].notes = notes;
    } else {
      // Add new item
      shoppingList.items.push({
        productId,
        quantity: quantity || 1,
        unit,
        priority,
        notes,
        addedBy: 'manual'
      });
    }

    await shoppingList.save();
    await shoppingList.populate('items.productId');

    res.json({
      success: true,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding item to shopping list',
      error: error.message
    });
  }
});

// @route   PUT /api/shopping-list/items/:itemId
// @desc    Update shopping list item
// @access  Private
router.put('/items/:itemId', async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    const item = shoppingList.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in shopping list'
      });
    }

    // Update fields
    const allowedUpdates = ['quantity', 'unit', 'priority', 'notes', 'isPurchased'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    if (req.body.isPurchased === true && !item.purchasedDate) {
      item.purchasedDate = new Date();
    }

    await shoppingList.save();
    await shoppingList.populate('items.productId');

    res.json({
      success: true,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shopping list item',
      error: error.message
    });
  }
});

// @route   DELETE /api/shopping-list/items/:itemId
// @desc    Remove item from shopping list
// @access  Private
router.delete('/items/:itemId', async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    const item = shoppingList.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in shopping list'
      });
    }

    item.deleteOne();
    await shoppingList.save();
    await shoppingList.populate('items.productId');

    res.json({
      success: true,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing item from shopping list',
      error: error.message
    });
  }
});

// @route   POST /api/shopping-list/clear-purchased
// @desc    Clear all purchased items from shopping list
// @access  Private
router.post('/clear-purchased', async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    });

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    // Remove all purchased items
    shoppingList.items = shoppingList.items.filter(item => !item.isPurchased);
    await shoppingList.save();
    await shoppingList.populate('items.productId');

    res.json({
      success: true,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing purchased items',
      error: error.message
    });
  }
});

// @route   POST /api/shopping-list/add-low-stock
// @desc    Add all low stock items to shopping list
// @access  Private
router.post('/add-low-stock', async (req, res) => {
  try {
    const inventory = await Inventory.find({ userId: req.user.id })
      .populate('productId');

    const lowStockItems = inventory.filter(item => item.isLowStock);

    if (lowStockItems.length === 0) {
      return res.json({
        success: true,
        message: 'No low stock items found',
        addedCount: 0
      });
    }

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

    let addedCount = 0;

    for (const item of lowStockItems) {
      // Check if already in shopping list
      const existingItem = shoppingList.items.find(
        i => i.productId.toString() === item.productId._id.toString() && !i.isPurchased
      );

      if (!existingItem) {
        const neededQuantity = Math.max(1, item.lowStockThreshold - item.quantity + 1);
        shoppingList.items.push({
          productId: item.productId._id,
          quantity: neededQuantity,
          unit: item.unit,
          priority: 'high',
          addedBy: 'auto-alert'
        });
        addedCount++;
      }
    }

    await shoppingList.save();
    await shoppingList.populate('items.productId');

    res.json({
      success: true,
      message: `Added ${addedCount} low stock items to shopping list`,
      addedCount,
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding low stock items',
      error: error.message
    });
  }
});

// @route   POST /api/shopping-list/complete-purchase
// @desc    Mark all items as purchased and add to inventory
// @access  Private
router.post('/complete-purchase', async (req, res) => {
  try {
    const shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    }).populate('items.productId');

    if (!shoppingList) {
      return res.status(404).json({
        success: false,
        message: 'Shopping list not found'
      });
    }

    const unpurchasedItems = shoppingList.items.filter(item => !item.isPurchased);

    // Add items to inventory
    for (const item of unpurchasedItems) {
      let inventoryItem = await Inventory.findOne({
        userId: req.user.id,
        productId: item.productId._id
      });

      if (inventoryItem) {
        inventoryItem.quantity += item.quantity;
        await inventoryItem.save();
      } else {
        await Inventory.create({
          userId: req.user.id,
          productId: item.productId._id,
          quantity: item.quantity,
          unit: item.unit
        });
      }

      item.isPurchased = true;
      item.purchasedDate = new Date();
    }

    await shoppingList.save();

    res.json({
      success: true,
      message: 'Purchase completed and items added to inventory',
      data: shoppingList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing purchase',
      error: error.message
    });
  }
});

module.exports = router;
