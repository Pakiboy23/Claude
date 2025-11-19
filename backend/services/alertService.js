const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const ShoppingList = require('../models/ShoppingList');

// Email transporter configuration
let transporter;

if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Check for low stock items and send alerts
async function checkLowStockItems() {
  try {
    console.log('Checking for low stock items...');

    // Get all users with low stock alerts enabled
    const users = await User.find({
      'preferences.notificationSettings.lowStockAlerts': true
    });

    for (const user of users) {
      // Get user's inventory
      const inventory = await Inventory.find({ userId: user._id })
        .populate('productId');

      // Filter low stock items
      const lowStockItems = inventory.filter(item => item.isLowStock);

      if (lowStockItems.length > 0) {
        // Auto-add to shopping list if enabled
        if (user.preferences.notificationSettings.lowStockAlerts) {
          await addLowStockToShoppingList(user._id, lowStockItems);
        }

        // Send email notification
        if (user.preferences.notificationSettings.email && transporter) {
          await sendLowStockEmail(user, lowStockItems);
        }

        console.log(`Sent low stock alert to ${user.email} for ${lowStockItems.length} items`);
      }
    }
  } catch (error) {
    console.error('Error checking low stock items:', error);
  }
}

// Check for expiring items and send alerts
async function checkExpiringItems() {
  try {
    console.log('Checking for expiring items...');

    // Get all users with expiration alerts enabled
    const users = await User.find({
      'preferences.notificationSettings.expirationAlerts': true
    });

    for (const user of users) {
      // Get user's inventory with expiration dates
      const inventory = await Inventory.find({
        userId: user._id,
        expirationDate: { $exists: true, $ne: null }
      }).populate('productId');

      // Filter items expiring soon or expired
      const expiringItems = inventory.filter(item => {
        const status = item.expirationStatus;
        return status === 'expired' || status === 'expiring-soon' || status === 'expiring-this-week';
      });

      if (expiringItems.length > 0) {
        // Send email notification
        if (user.preferences.notificationSettings.email && transporter) {
          await sendExpirationEmail(user, expiringItems);
        }

        console.log(`Sent expiration alert to ${user.email} for ${expiringItems.length} items`);
      }
    }
  } catch (error) {
    console.error('Error checking expiring items:', error);
  }
}

// Add low stock items to shopping list
async function addLowStockToShoppingList(userId, lowStockItems) {
  try {
    let shoppingList = await ShoppingList.findOne({
      userId: userId,
      isActive: true
    });

    if (!shoppingList) {
      shoppingList = await ShoppingList.create({
        userId: userId,
        items: []
      });
    }

    for (const item of lowStockItems) {
      // Check if item is already in shopping list
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
      }
    }

    await shoppingList.save();
  } catch (error) {
    console.error('Error adding low stock items to shopping list:', error);
  }
}

// Send low stock email notification
async function sendLowStockEmail(user, lowStockItems) {
  try {
    const itemsList = lowStockItems
      .map(item => `• ${item.productId.name} - Current: ${item.quantity} ${item.unit}, Threshold: ${item.lowStockThreshold}`)
      .join('\n');

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: '🚨 Low Stock Alert - Smart Pantry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">⚠️ Low Stock Alert</h2>
          <p>Hi ${user.name},</p>
          <p>The following items in your pantry are running low:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; margin: 0;">${itemsList}</pre>
          </div>
          <p>These items have been automatically added to your shopping list with high priority.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/shopping-list"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Shopping List
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You can adjust your notification settings in your account preferences.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending low stock email:', error);
  }
}

// Send expiration email notification
async function sendExpirationEmail(user, expiringItems) {
  try {
    const expiredItems = expiringItems.filter(i => i.expirationStatus === 'expired');
    const expiringSoonItems = expiringItems.filter(i => i.expirationStatus === 'expiring-soon');
    const expiringThisWeekItems = expiringItems.filter(i => i.expirationStatus === 'expiring-this-week');

    let itemsList = '';

    if (expiredItems.length > 0) {
      itemsList += '<h4 style="color: #dc3545; margin-top: 0;">🔴 Expired:</h4><ul>';
      expiredItems.forEach(item => {
        itemsList += `<li>${item.productId.name} - Expired on ${item.expirationDate.toLocaleDateString()}</li>`;
      });
      itemsList += '</ul>';
    }

    if (expiringSoonItems.length > 0) {
      itemsList += '<h4 style="color: #ffc107;">🟡 Expiring in 3 Days or Less:</h4><ul>';
      expiringSoonItems.forEach(item => {
        itemsList += `<li>${item.productId.name} - Expires ${item.expirationDate.toLocaleDateString()}</li>`;
      });
      itemsList += '</ul>';
    }

    if (expiringThisWeekItems.length > 0) {
      itemsList += '<h4 style="color: #17a2b8;">🟢 Expiring This Week:</h4><ul>';
      expiringThisWeekItems.forEach(item => {
        itemsList += `<li>${item.productId.name} - Expires ${item.expirationDate.toLocaleDateString()}</li>`;
      });
      itemsList += '</ul>';
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: user.email,
      subject: '⏰ Expiration Alert - Smart Pantry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">⏰ Expiration Alert</h2>
          <p>Hi ${user.name},</p>
          <p>You have items in your pantry that are expired or expiring soon:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            ${itemsList}
          </div>
          <p>Consider using these items soon or removing expired items from your inventory.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/inventory"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Inventory
            </a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            You can adjust your notification settings in your account preferences.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending expiration email:', error);
  }
}

// Schedule cron jobs
function initializeAlertSystem() {
  console.log('Initializing alert system...');

  // Check for low stock items every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('Running scheduled low stock check...');
    checkLowStockItems();
  });

  // Check for expiring items every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('Running scheduled expiration check...');
    checkExpiringItems();
  });

  console.log('Alert system initialized. Scheduled tasks:');
  console.log('- Low stock check: Daily at 8:00 AM');
  console.log('- Expiration check: Daily at 9:00 AM');

  // Run initial checks after 1 minute (for testing)
  setTimeout(() => {
    console.log('Running initial checks...');
    checkLowStockItems();
    checkExpiringItems();
  }, 60000);
}

module.exports = {
  initializeAlertSystem,
  checkLowStockItems,
  checkExpiringItems
};
