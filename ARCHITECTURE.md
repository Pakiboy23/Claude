# Smart Pantry App - Architecture

## Overview
A smart pantry management system that tracks inventory, sends low-stock alerts, and integrates with grocery delivery services.

## System Architecture

### Frontend
- **Technology**: React with PWA capabilities (can be migrated to React Native)
- **Features**:
  - Barcode scanning using device camera
  - Inventory dashboard with search and filters
  - Low stock alerts and notifications
  - Shopping list management
  - Store integration for auto-cart

### Backend
- **Technology**: Node.js with Express
- **Database**: MongoDB for flexible schema
- **Cache**: Redis for session management and caching
- **APIs**: RESTful API architecture

### Key Features

#### 1. Inventory Management
- Add items manually or via barcode scan
- Track quantity, expiration dates, location
- Update quantities (consume, restock)
- Categorize items (dairy, produce, pantry, etc.)

#### 2. Barcode Scanning
- Uses device camera (AVFoundation for iOS, Camera API for web)
- Scans UPC/EAN barcodes
- Looks up product info from external APIs
- Auto-populates item details

#### 3. Low Stock Alerts
- User-defined thresholds per item
- Push notifications or email alerts
- Automatic addition to shopping list

#### 4. Store Integration
- Integration with grocery delivery APIs:
  - Instacart API
  - Amazon Fresh
  - Walmart Grocery API
  - Kroger API
- Auto-add items to cart
- Price comparison across stores

#### 5. Smart Features
- Recipe suggestions based on available inventory
- Expiration date tracking
- Shopping pattern analysis
- Automatic reorder suggestions

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  name: String,
  preferences: {
    defaultStore: String,
    lowStockThreshold: Number,
    notificationSettings: Object
  },
  createdAt: Date
}
```

### Inventory Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  productId: ObjectId,
  quantity: Number,
  unit: String,
  location: String, // "Pantry", "Fridge", "Freezer"
  lowStockThreshold: Number,
  expirationDate: Date,
  addedDate: Date,
  lastUpdated: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  barcode: String,
  name: String,
  brand: String,
  category: String,
  defaultUnit: String,
  imageUrl: String,
  averagePrice: Number,
  storeIds: {
    instacart: String,
    amazon: String,
    walmart: String
  }
}
```

### ShoppingList Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: [{
    productId: ObjectId,
    quantity: Number,
    priority: String, // "high", "medium", "low"
    addedBy: String, // "manual", "auto-alert"
    addedDate: Date
  }],
  createdAt: Date
}
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Inventory
- GET /api/inventory - Get all items
- POST /api/inventory - Add new item
- PUT /api/inventory/:id - Update item
- DELETE /api/inventory/:id - Remove item
- GET /api/inventory/low-stock - Get low stock items

### Products
- GET /api/products/search?q=query
- GET /api/products/barcode/:code
- POST /api/products - Create new product

### Shopping List
- GET /api/shopping-list
- POST /api/shopping-list/items
- DELETE /api/shopping-list/items/:id
- POST /api/shopping-list/add-to-cart - Send to store

### Stores
- GET /api/stores - Get available stores
- POST /api/stores/connect - Connect store account
- POST /api/stores/:storeId/add-to-cart

## External APIs

### Product Information
- **UPC Database API**: https://upcdatabase.org/
- **Open Food Facts**: https://world.openfoodfacts.org/
- **Barcode Lookup**: https://www.barcodelookup.com/

### Grocery Delivery
- **Instacart API**: Developer program
- **Amazon Fresh**: MWS API (limited)
- **Walmart API**: Affiliate Program
- **Kroger API**: Developer portal

## Deployment

### Backend
- Hosting: AWS EC2 / Heroku / DigitalOcean
- Database: MongoDB Atlas
- File Storage: AWS S3 (for product images)

### Frontend
- Hosting: Vercel / Netlify
- CDN: Cloudflare

## Security Considerations
- JWT-based authentication
- HTTPS only
- Rate limiting on API endpoints
- Input validation and sanitization
- Secure storage of API keys
- CORS configuration
