# 🚀 Quick Start Guide - Smart Pantry App

## Current Status ✅
- ✅ Node.js installed
- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed
- ✅ Environment configured
- ⏳ Need MongoDB database

---

## Next Step: Choose Your Database Option

### OPTION 1: MongoDB Atlas (FREE Cloud - RECOMMENDED) 🌟

**Best for: Quick start, no local setup needed**

#### Step-by-Step:

1. **Create Account** (2 minutes)
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google
   - Verify your email

2. **Create Free Cluster** (3-5 minutes)
   - Click "Build a Database"
   - Choose "FREE" tier (M0)
   - Select a cloud provider (AWS recommended)
   - Choose a region close to you
   - Click "Create Cluster"
   - Wait for cluster to be ready (2-3 minutes)

3. **Create Database User**
   - Click "Database Access" in left menu
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `pantryuser`
   - Password: (auto-generate or create one)
   - **SAVE THIS PASSWORD!**
   - User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Click "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Click "Database" in left menu
   - Click "Connect" button on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://pantryuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name: change `/?retryWrites` to `/smart-pantry?retryWrites`

6. **Update .env File**
   - Open `.env` file
   - Replace the MONGODB_URI line with your connection string:
     ```
     MONGODB_URI=mongodb+srv://pantryuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smart-pantry?retryWrites=true&w=majority
     ```

---

### OPTION 2: Install MongoDB Locally

**Best for: Offline development**

#### For macOS:
```bash
# Install using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Your connection string is already set in .env:
# MONGODB_URI=mongodb://localhost:27017/smart-pantry
```

#### For Ubuntu/Linux:
```bash
# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Your connection string is already set in .env:
# MONGODB_URI=mongodb://localhost:27017/smart-pantry
```

#### For Windows:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. Your connection string is already set in .env

---

## After Database Setup - Start the App!

### Terminal 1 - Start Backend:
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
Alert system initialized
```

### Terminal 2 - Start Frontend:
```bash
cd frontend
npm start
```

You should see:
```
Compiled successfully!
Local: http://localhost:3000
```

### Open Browser:
- Go to: http://localhost:3000
- Create an account
- Start adding items!

---

## Troubleshooting

### "MongoDB connection error"
- Check your MONGODB_URI in .env file
- For Atlas: Verify password, network access, and connection string
- For local: Make sure MongoDB service is running

### "Port 5000 already in use"
- Change PORT in .env to 5001 or another number
- Update REACT_APP_API_URL in frontend/.env to match

### "Cannot GET /"
- Make sure both backend AND frontend are running
- Backend: http://localhost:5000
- Frontend: http://localhost:3000 (this is where you browse)

---

## Quick Test Commands

### Check backend is running:
```bash
curl http://localhost:5000/health
```

Should return:
```json
{"status":"ok","timestamp":"...","database":"connected"}
```

---

## What's Next?

1. Create an account at http://localhost:3000/register
2. Log in
3. Try these features:
   - Add items to inventory (manually first)
   - Create a shopping list
   - Adjust settings
   - Try barcode scanning (on mobile/iPhone)

---

## Need More Help?

- Full documentation: See README.md
- Architecture details: See ARCHITECTURE.md
- Issues? Check the troubleshooting section above

**Ready to start? Choose Option 1 (MongoDB Atlas) above - it's the fastest way!** 🚀
