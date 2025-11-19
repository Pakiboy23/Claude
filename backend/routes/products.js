const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/products/search
// @desc    Search products by name
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    let query = {
      name: { $regex: q, $options: 'i' }
    };

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .sort({ isVerified: -1, name: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    });
  }
});

// @route   GET /api/products/barcode/:code
// @desc    Get product by barcode (scans external APIs if not found)
// @access  Private
router.get('/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // First, check our database
    let product = await Product.findOne({ barcode: code });

    if (product) {
      return res.json({
        success: true,
        data: product,
        source: 'database'
      });
    }

    // If not found, try external APIs
    product = await lookupBarcodeFromAPIs(code);

    if (product) {
      // Save to database for future use
      const newProduct = await Product.create({
        ...product,
        barcode: code,
        createdBy: req.user.id
      });

      return res.json({
        success: true,
        data: newProduct,
        source: 'external'
      });
    }

    // If still not found, return empty result
    res.status(404).json({
      success: false,
      message: 'Product not found for this barcode',
      barcode: code
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error looking up barcode',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product (manual entry)
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, brand, category, barcode, defaultUnit, imageUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this barcode already exists',
          data: existingProduct
        });
      }
    }

    const product = await Product.create({
      name,
      brand,
      category,
      barcode,
      defaultUnit,
      imageUrl,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'brand', 'category', 'defaultUnit', 'imageUrl', 'averagePrice', 'storeIds'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// Helper function to lookup barcode from external APIs
async function lookupBarcodeFromAPIs(barcode) {
  try {
    // Try Open Food Facts first (free, no API key needed)
    const openFoodFactsResult = await lookupOpenFoodFacts(barcode);
    if (openFoodFactsResult) return openFoodFactsResult;

    // Try UPC Database (requires API key)
    if (process.env.UPC_DATABASE_API_KEY) {
      const upcDatabaseResult = await lookupUPCDatabase(barcode);
      if (upcDatabaseResult) return upcDatabaseResult;
    }

    // Try Barcode Lookup (requires API key)
    if (process.env.BARCODE_LOOKUP_API_KEY) {
      const barcodeLookupResult = await lookupBarcodeLookup(barcode);
      if (barcodeLookupResult) return barcodeLookupResult;
    }

    return null;
  } catch (error) {
    console.error('Error looking up barcode from APIs:', error);
    return null;
  }
}

// Open Food Facts API lookup
async function lookupOpenFoodFacts(barcode) {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { timeout: 5000 }
    );

    if (response.data.status === 1 && response.data.product) {
      const p = response.data.product;
      return {
        name: p.product_name || p.product_name_en || 'Unknown Product',
        brand: p.brands || undefined,
        category: mapCategory(p.categories_tags),
        imageUrl: p.image_url || p.image_front_url,
        nutrition: {
          servingSize: p.serving_size,
          calories: p.nutriments?.energy_value,
          protein: p.nutriments?.proteins,
          carbs: p.nutriments?.carbohydrates,
          fat: p.nutriments?.fat
        }
      };
    }
  } catch (error) {
    console.error('Open Food Facts lookup error:', error.message);
  }
  return null;
}

// UPC Database API lookup
async function lookupUPCDatabase(barcode) {
  try {
    const response = await axios.get(
      `https://api.upcdatabase.org/product/${barcode}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.UPC_DATABASE_API_KEY}`
        },
        timeout: 5000
      }
    );

    if (response.data.success && response.data.product) {
      const p = response.data.product;
      return {
        name: p.title,
        brand: p.brand,
        category: 'other',
        imageUrl: p.images?.[0]
      };
    }
  } catch (error) {
    console.error('UPC Database lookup error:', error.message);
  }
  return null;
}

// Barcode Lookup API
async function lookupBarcodeLookup(barcode) {
  try {
    const response = await axios.get(
      `https://api.barcodelookup.com/v3/products`,
      {
        params: {
          barcode: barcode,
          key: process.env.BARCODE_LOOKUP_API_KEY
        },
        timeout: 5000
      }
    );

    if (response.data.products && response.data.products.length > 0) {
      const p = response.data.products[0];
      return {
        name: p.title,
        brand: p.brand,
        category: mapCategory(p.category),
        imageUrl: p.images?.[0]
      };
    }
  } catch (error) {
    console.error('Barcode Lookup error:', error.message);
  }
  return null;
}

// Helper to map external categories to our categories
function mapCategory(externalCategory) {
  if (!externalCategory) return 'other';

  const categoryStr = Array.isArray(externalCategory)
    ? externalCategory.join(' ').toLowerCase()
    : externalCategory.toLowerCase();

  const categoryMap = {
    dairy: ['milk', 'cheese', 'yogurt', 'dairy', 'butter', 'cream'],
    produce: ['fruit', 'vegetable', 'produce', 'fresh'],
    meat: ['meat', 'beef', 'pork', 'chicken', 'poultry'],
    seafood: ['fish', 'seafood', 'salmon', 'tuna'],
    bakery: ['bread', 'bakery', 'pastry', 'cake'],
    pantry: ['pasta', 'rice', 'cereal', 'grain', 'flour', 'canned'],
    beverages: ['drink', 'beverage', 'juice', 'soda', 'water', 'coffee', 'tea'],
    frozen: ['frozen', 'ice cream'],
    snacks: ['snack', 'chip', 'cookie', 'candy'],
    condiments: ['sauce', 'condiment', 'spice', 'seasoning', 'oil']
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => categoryStr.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

module.exports = router;
