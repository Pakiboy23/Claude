# 🥫 Smart Pantry App

A comprehensive smart pantry management system that helps you track inventory, receive low-stock alerts, scan barcodes, and integrate with grocery delivery services.

## Features

### ✨ Core Features
- **Inventory Management** - Track all items in your pantry, fridge, and freezer
- **Barcode Scanning** - Use your phone camera to scan product barcodes (UPC/EAN)
- **Smart Alerts** - Automatic notifications for low stock and expiring items
- **Shopping List** - Auto-generated shopping lists from low stock items
- **Store Integration** - Connect with Instacart, Walmart, Kroger, and Amazon Fresh
- **Expiration Tracking** - Monitor expiration dates and get timely reminders
- **Multi-Location Support** - Organize items by pantry, fridge, freezer, etc.
- **Product Database** - Automatic product lookup from external APIs

### 📱 iPhone Scanning Support
Yes! The app supports barcode scanning on iPhone using:
- **Web App**: HTML5 Camera API with html5-qrcode library
- **Native iOS**: Can be built with React Native using AVFoundation
- Supports UPC, EAN, Code 128, Code 39, and other standard barcodes

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **MongoDB** - Database for flexible document storage
- **Mongoose** - ODM for MongoDB
- **JWT** - Secure authentication
- **Node-cron** - Scheduled tasks for alerts
- **Nodemailer** - Email notifications
- **Axios** - External API integrations

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **html5-qrcode** - Barcode scanning
- **Lucide React** - Icons

### External Integrations
- **Open Food Facts API** - Product information (free)
- **UPC Database API** - Product lookup
- **Barcode Lookup API** - Alternative product data
- **Instacart API** - Grocery delivery
- **Walmart API** - Store integration
- **Kroger API** - Store integration

## Project Structure

```
smart-pantry-app/
├── backend/
│   ├── models/           # Database models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Inventory.js
│   │   └── ShoppingList.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── inventory.js
│   │   ├── products.js
│   │   ├── shoppingList.js
│   │   └── stores.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   ├── services/         # Business logic
│   │   └── alertService.js
│   └── server.js         # Entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   │   ├── Layout.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── BarcodeScanner.js
│   │   ├── pages/        # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Inventory.js
│   │   │   ├── ShoppingList.js
│   │   │   ├── Stores.js
│   │   │   └── Settings.js
│   │   ├── store/        # State management
│   │   │   └── authStore.js
│   │   ├── utils/        # Utilities
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env.example          # Environment variables template
├── ARCHITECTURE.md       # Detailed architecture docs
└── README.md            # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-pantry-app
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required: MongoDB URI, JWT_SECRET
# Optional: API keys for external services
```

### 3. Frontend Setup
```bash
# Install frontend dependencies
cd frontend
npm install

# Create .env file (optional)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 4. Database Setup
Make sure MongoDB is running:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 5. Start the Application

**Development Mode:**
```bash
# Terminal 1 - Start backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm start
```

**Production Mode:**
```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves frontend)
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-pantry

# Authentication
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=30d

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# External APIs (Optional)
UPC_DATABASE_API_KEY=your_key
BARCODE_LOOKUP_API_KEY=your_key

# Store APIs
INSTACART_CLIENT_ID=your_client_id
INSTACART_CLIENT_SECRET=your_client_secret
WALMART_API_KEY=your_key
KROGER_CLIENT_ID=your_client_id
KROGER_CLIENT_SECRET=your_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/preferences` - Update user preferences

### Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add item to inventory
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Remove item
- `GET /api/inventory/low-stock` - Get low stock items
- `POST /api/inventory/:id/consume` - Decrease quantity

### Products
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/barcode/:code` - Lookup by barcode
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product

### Shopping List
- `GET /api/shopping-list` - Get shopping list
- `POST /api/shopping-list/items` - Add item
- `PUT /api/shopping-list/items/:id` - Update item
- `DELETE /api/shopping-list/items/:id` - Remove item
- `POST /api/shopping-list/add-low-stock` - Add all low stock items
- `POST /api/shopping-list/complete-purchase` - Mark as purchased

### Stores
- `GET /api/stores` - Get available stores
- `POST /api/stores/connect` - Connect store account
- `DELETE /api/stores/:id/disconnect` - Disconnect store
- `POST /api/stores/:id/add-to-cart` - Add items to store cart

## Usage Guide

### 1. Create an Account
- Navigate to http://localhost:3000/register
- Enter your name, email, and password
- Click "Sign Up"

### 2. Add Items to Inventory

**Method 1: Barcode Scanning**
- Click "Scan Barcode" button
- Allow camera permissions
- Point camera at product barcode
- Product details will be auto-populated
- Enter quantity and location
- Click "Add to Inventory"

**Method 2: Manual Entry**
- Click "Add Manually"
- Search for product or create new one
- Enter details (quantity, location, expiration date)
- Click "Add to Inventory"

### 3. Monitor Low Stock
- Dashboard shows low stock alerts
- System automatically adds low stock items to shopping list
- Receive email notifications (if configured)

### 4. Manage Shopping List
- View auto-generated shopping list
- Add/remove items manually
- Check off items as purchased
- Connect stores to add items to online carts

### 5. Connect Grocery Stores
- Go to "Stores" page
- Click "Connect" on your preferred store
- Follow OAuth flow to authorize
- Use "Add to Cart" to send shopping list items

## Alert System

The app includes an automated alert system that runs daily:

### Low Stock Alerts
- Checks inventory daily at 8:00 AM
- Identifies items below threshold
- Sends email notifications
- Auto-adds items to shopping list

### Expiration Alerts
- Checks expiration dates daily at 9:00 AM
- Categorizes items (expired, expiring soon, expiring this week)
- Sends email with color-coded alerts
- Helps prevent food waste

## Deployment

### Using Heroku

1. Create Heroku app:
```bash
heroku create smart-pantry-app
```

2. Add MongoDB Atlas:
```bash
heroku addons:create mongolab:sandbox
```

3. Set environment variables:
```bash
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production
```

4. Deploy:
```bash
git push heroku main
```

### Using AWS/DigitalOcean

1. Provision server (EC2/Droplet)
2. Install Node.js and MongoDB
3. Clone repository
4. Configure environment variables
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start backend/server.js
pm2 startup
pm2 save
```

### Frontend Deployment (Vercel/Netlify)

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Deploy build folder to hosting service
3. Set environment variable for API URL

## Future Enhancements

- [ ] Recipe suggestions based on available inventory
- [ ] Meal planning integration
- [ ] Price comparison across stores
- [ ] Shared pantry for families/roommates
- [ ] Voice assistant integration (Alexa, Google Home)
- [ ] Native mobile apps (React Native)
- [ ] Nutrition tracking
- [ ] Automatic reordering
- [ ] Integration with smart fridges
- [ ] AI-powered expiration predictions

## Troubleshooting

### Barcode Scanner Not Working
- Ensure HTTPS connection (required for camera access)
- Check browser permissions for camera
- Try different lighting conditions
- Verify barcode is clean and readable

### Database Connection Issues
- Verify MongoDB is running
- Check MONGODB_URI in .env
- Ensure network connectivity
- Check firewall settings

### API Keys Not Working
- Verify API keys are active
- Check rate limits
- Ensure correct environment variables
- Review API provider documentation

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Email: support@smartpantry.com
- Documentation: [Link to docs]

## Acknowledgments

- Open Food Facts for product data
- html5-qrcode for barcode scanning
- All contributors and users

---

**Built with ❤️ for smarter pantry management**