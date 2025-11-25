# 💻 Local Setup Guide - Smart Pantry App

Follow these steps to run the Smart Pantry app on your local computer.

---

## Prerequisites

Make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ Git installed
- ✅ MongoDB Atlas account created (you already have this!)

---

## Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
# Clone the repository
git clone https://github.com/Pakiboy23/Claude.git

# Navigate to the project
cd Claude

# Switch to the smart pantry branch
git checkout claude/smart-pantry-app-019EwxKZEot6tfdE8XQZxb4D
```

---

## Step 2: Install Backend Dependencies

```bash
# Install backend dependencies
npm install
```

You should see something like:
```
added 178 packages in 20s
```

---

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Create .env file from template
cp .env.example .env
```

Then edit the `.env` file and update the MongoDB connection string:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Using MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://shaarisshariff_db_user:igOswrHGJfEVPbH8@cluster0.6ubfnyz.mongodb.net/smart-pantry?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret (you can leave this as is for now)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# JWT Token Expiration
JWT_EXPIRE=30d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Important:** Use the MongoDB connection string we already set up!

---

## Step 4: Install Frontend Dependencies

```bash
# Navigate to frontend folder
cd frontend

# Install frontend dependencies
npm install

# Go back to root
cd ..
```

You should see something like:
```
added 1329 packages in 50s
```

---

## Step 5: Start the Application

You'll need **TWO terminal windows/tabs**.

### Terminal 1 - Start Backend:

```bash
# Make sure you're in the project root (Claude/)
npm run dev
```

✅ **Success looks like:**
```
Server running on port 5000
MongoDB connected successfully
Alert system initialized
```

❌ **If you see an error**, check:
- Is your MongoDB Atlas cluster active?
- Did you set up Network Access (0.0.0.0/0)?
- Is the connection string correct in `.env`?

---

### Terminal 2 - Start Frontend:

```bash
# In a NEW terminal, navigate to the project
cd Claude/frontend

# Start the frontend
npm start
```

✅ **Success looks like:**
```
Compiled successfully!
Local:            http://localhost:3000
```

Your browser should automatically open to http://localhost:3000

---

## Step 6: Use the App!

1. **Create an Account:**
   - Go to http://localhost:3000
   - Click "Sign up"
   - Enter your name, email, and password
   - Click "Sign Up"

2. **Explore Features:**
   - ✅ Dashboard - Overview of your pantry
   - ✅ Inventory - Add and manage items
   - ✅ Shopping List - Auto-generated from low stock
   - ✅ Barcode Scanner - Click "Scan Barcode" (works on mobile!)
   - ✅ Settings - Configure preferences

---

## Troubleshooting

### "MongoDB connection error"
**Solution:**
- Check MongoDB Atlas cluster is "Active" (not "Creating")
- Verify Network Access allows 0.0.0.0/0
- Double-check connection string in `.env`
- Wait 5-10 minutes if cluster was just created

### "Port 5000 already in use"
**Solution:**
```bash
# Find and kill the process
# On Mac/Linux:
lsof -ti:5000 | xargs kill -9

# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

Or change the PORT in `.env` to 5001

### "Port 3000 already in use"
**Solution:**
- Press `Ctrl+C` in Terminal 2
- The frontend will ask if you want to use a different port
- Type `y` and press Enter

### "Cannot find module"
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Do the same for frontend
cd frontend
rm -rf node_modules
npm install
```

---

## Quick Test

Once everything is running, test the app:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/health
   ```

   Should return:
   ```json
   {"status":"ok","timestamp":"...","database":"connected"}
   ```

2. **Frontend:** Open http://localhost:3000 in your browser

3. **Create Account:** Register and log in

4. **Add Item:** Try adding an item to your inventory

---

## What to Try

### Basic Features:
- ✅ Add items manually to inventory
- ✅ Set low stock thresholds
- ✅ View dashboard with stats
- ✅ Create shopping list

### Advanced Features:
- 📱 **Barcode Scanning** - Works best on mobile/iPhone
  - Open http://localhost:3000 on your phone
  - Click "Scan Barcode"
  - Try scanning a product barcode

- 🔔 **Alerts** - Configure in Settings
  - Enable email notifications (optional)
  - Set default low stock threshold
  - Get alerts for expiring items

### Mobile Testing:
To test on your phone (same WiFi network):

1. Find your computer's local IP:
   ```bash
   # Mac/Linux:
   ifconfig | grep "inet "

   # Windows:
   ipconfig
   ```

2. Look for something like `192.168.x.x`

3. On your phone, go to: `http://192.168.x.x:3000`

4. Test barcode scanning!

---

## Need Help?

- **Full Documentation:** See `README.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Quick Start:** See `QUICK_START.md`

---

## Summary - Quick Commands

```bash
# Clone and setup
git clone https://github.com/Pakiboy23/Claude.git
cd Claude
git checkout claude/smart-pantry-app-019EwxKZEot6tfdE8XQZxb4D
npm install
cd frontend && npm install && cd ..

# Configure .env (copy the MongoDB URI)
cp .env.example .env
# Edit .env with your MongoDB connection string

# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start

# Open browser
# http://localhost:3000
```

---

🎉 **You're all set! Enjoy your Smart Pantry App!** 🥫
