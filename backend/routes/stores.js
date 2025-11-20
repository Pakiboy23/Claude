const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const ShoppingList = require('../models/ShoppingList');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/stores
// @desc    Get available stores
// @access  Private
router.get('/', async (req, res) => {
  try {
    const stores = [
      {
        id: 'instacart',
        name: 'Instacart',
        description: 'Order from local stores and get delivery in as fast as 1 hour',
        isAvailable: !!process.env.INSTACART_CLIENT_ID,
        logo: 'https://www.instacart.com/assets/logos/instacart-logo.png'
      },
      {
        id: 'walmart',
        name: 'Walmart Grocery',
        description: 'Pickup or delivery from your local Walmart',
        isAvailable: !!process.env.WALMART_API_KEY,
        logo: 'https://i5.walmartimages.com/dfw/63fd9f59-1d44/k2-_15e1d67e-8d73-4e26-9c6f-47fc68c8f79e.v1.png'
      },
      {
        id: 'kroger',
        name: 'Kroger',
        description: 'Fresh groceries delivered from Kroger',
        isAvailable: !!process.env.KROGER_CLIENT_ID,
        logo: 'https://www.kroger.com/content/v2/images/logo-kroger.svg'
      },
      {
        id: 'amazon',
        name: 'Amazon Fresh',
        description: 'Fast, free delivery on orders over $35',
        isAvailable: false, // Amazon Fresh API access is very limited
        logo: 'https://m.media-amazon.com/images/G/01/amazonfresh/logo.png'
      }
    ];

    res.json({
      success: true,
      data: stores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stores',
      error: error.message
    });
  }
});

// @route   POST /api/stores/connect
// @desc    Connect a store account (OAuth flow)
// @access  Private
router.post('/connect', async (req, res) => {
  try {
    const { storeId, authCode, redirectUri } = req.body;

    if (!storeId || !authCode) {
      return res.status(400).json({
        success: false,
        message: 'Store ID and authorization code are required'
      });
    }

    let accessToken, refreshToken;

    // Handle OAuth token exchange based on store
    switch (storeId) {
      case 'instacart':
        ({ accessToken, refreshToken } = await exchangeInstacartToken(authCode, redirectUri));
        break;
      case 'kroger':
        ({ accessToken, refreshToken } = await exchangeKrogerToken(authCode, redirectUri));
        break;
      case 'walmart':
        // Walmart uses API key, not OAuth
        accessToken = process.env.WALMART_API_KEY;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID'
        });
    }

    // Save connected store to user
    const user = await User.findById(req.user.id);

    // Remove existing connection for this store
    user.connectedStores = user.connectedStores.filter(
      store => store.storeName !== storeId
    );

    // Add new connection
    user.connectedStores.push({
      storeName: storeId,
      storeId: storeId,
      accessToken,
      refreshToken,
      connectedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: `Successfully connected to ${storeId}`,
      store: {
        storeName: storeId,
        connectedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error connecting store',
      error: error.message
    });
  }
});

// @route   DELETE /api/stores/:storeId/disconnect
// @desc    Disconnect a store account
// @access  Private
router.delete('/:storeId/disconnect', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.connectedStores = user.connectedStores.filter(
      store => store.storeName !== req.params.storeId
    );

    await user.save();

    res.json({
      success: true,
      message: `Successfully disconnected from ${req.params.storeId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error disconnecting store',
      error: error.message
    });
  }
});

// @route   POST /api/stores/:storeId/add-to-cart
// @desc    Add shopping list items to store cart
// @access  Private
router.post('/:storeId/add-to-cart', async (req, res) => {
  try {
    const { storeId } = req.params;

    // Get user's connected store
    const user = await User.findById(req.user.id);
    const connectedStore = user.connectedStores.find(
      store => store.storeName === storeId
    );

    if (!connectedStore) {
      return res.status(400).json({
        success: false,
        message: `Please connect your ${storeId} account first`
      });
    }

    // Get shopping list
    const shoppingList = await ShoppingList.findOne({
      userId: req.user.id,
      isActive: true
    }).populate('items.productId');

    if (!shoppingList || shoppingList.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Shopping list is empty'
      });
    }

    // Get unpurchased items
    const items = shoppingList.items.filter(item => !item.isPurchased);

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All items have been purchased'
      });
    }

    // Add items to store cart based on store
    let result;
    switch (storeId) {
      case 'instacart':
        result = await addToInstacartCart(items, connectedStore.accessToken);
        break;
      case 'kroger':
        result = await addToKrogerCart(items, connectedStore.accessToken);
        break;
      case 'walmart':
        result = await addToWalmartCart(items, connectedStore.accessToken);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Store integration not available'
        });
    }

    res.json({
      success: true,
      message: `Successfully added ${result.addedCount} items to ${storeId} cart`,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding items to cart',
      error: error.message
    });
  }
});

// @route   GET /api/stores/:storeId/search
// @desc    Search for products in store
// @access  Private
router.get('/:storeId/search', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Get user's connected store
    const user = await User.findById(req.user.id);
    const connectedStore = user.connectedStores.find(
      store => store.storeName === storeId
    );

    if (!connectedStore) {
      return res.status(400).json({
        success: false,
        message: `Please connect your ${storeId} account first`
      });
    }

    let results;
    switch (storeId) {
      case 'instacart':
        results = await searchInstacart(q, connectedStore.accessToken);
        break;
      case 'kroger':
        results = await searchKroger(q, connectedStore.accessToken);
        break;
      case 'walmart':
        results = await searchWalmart(q, connectedStore.accessToken);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Store search not available'
        });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching store',
      error: error.message
    });
  }
});

// ========== Helper Functions ==========

// Instacart OAuth token exchange
async function exchangeInstacartToken(code, redirectUri) {
  try {
    const response = await axios.post('https://connect.instacart.com/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.INSTACART_CLIENT_ID,
      client_secret: process.env.INSTACART_CLIENT_SECRET,
      redirect_uri: redirectUri
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    };
  } catch (error) {
    throw new Error('Failed to exchange Instacart token: ' + error.message);
  }
}

// Kroger OAuth token exchange
async function exchangeKrogerToken(code, redirectUri) {
  try {
    const credentials = Buffer.from(
      `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      'https://api.kroger.com/v1/connect/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    };
  } catch (error) {
    throw new Error('Failed to exchange Kroger token: ' + error.message);
  }
}

// Add items to Instacart cart
async function addToInstacartCart(items, accessToken) {
  // Note: This is a placeholder. Actual Instacart API integration would go here
  // The Instacart API requires business approval and has specific endpoints
  return {
    addedCount: items.length,
    message: 'Items added to Instacart cart',
    cartUrl: 'https://www.instacart.com/store/cart'
  };
}

// Add items to Kroger cart
async function addToKrogerCart(items, accessToken) {
  try {
    let addedCount = 0;

    for (const item of items) {
      // Search for product in Kroger
      const productId = item.productId.storeIds?.kroger;

      if (productId) {
        await axios.put(
          `https://api.kroger.com/v1/cart/add`,
          {
            items: [{
              upc: item.productId.barcode,
              quantity: item.quantity
            }]
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        addedCount++;
      }
    }

    return {
      addedCount,
      message: `Added ${addedCount} items to Kroger cart`,
      cartUrl: 'https://www.kroger.com/cart'
    };
  } catch (error) {
    throw new Error('Failed to add items to Kroger cart: ' + error.message);
  }
}

// Add items to Walmart cart
async function addToWalmartCart(items, apiKey) {
  // Note: Walmart Affiliate API is primarily for affiliate marketing
  // Actual cart manipulation requires a different API access level
  return {
    addedCount: items.length,
    message: 'Items prepared for Walmart',
    cartUrl: 'https://www.walmart.com/cart'
  };
}

// Search Instacart
async function searchInstacart(query, accessToken) {
  // Placeholder - requires actual Instacart API integration
  return [];
}

// Search Kroger
async function searchKroger(query, accessToken) {
  try {
    const response = await axios.get(
      'https://api.kroger.com/v1/products',
      {
        params: {
          'filter.term': query,
          'filter.limit': 20
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.data || [];
  } catch (error) {
    throw new Error('Failed to search Kroger: ' + error.message);
  }
}

// Search Walmart
async function searchWalmart(query, apiKey) {
  try {
    const response = await axios.get(
      'https://api.walmartlabs.com/v1/search',
      {
        params: {
          query: query,
          apiKey: apiKey
        }
      }
    );

    return response.data.items || [];
  } catch (error) {
    throw new Error('Failed to search Walmart: ' + error.message);
  }
}

module.exports = router;
