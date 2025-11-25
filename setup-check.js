#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🥫 Smart Pantry App - Setup Checker\n');
console.log('=====================================\n');

let allGood = true;

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js: ${nodeVersion}`);

// Check if package.json exists
if (fs.existsSync('package.json')) {
  console.log('✅ Backend package.json found');
} else {
  console.log('❌ Backend package.json not found');
  allGood = false;
}

// Check if node_modules exists
if (fs.existsSync('node_modules')) {
  console.log('✅ Backend dependencies installed');
} else {
  console.log('❌ Backend dependencies not installed - Run: npm install');
  allGood = false;
}

// Check if frontend exists
if (fs.existsSync('frontend/package.json')) {
  console.log('✅ Frontend package.json found');
} else {
  console.log('❌ Frontend package.json not found');
  allGood = false;
}

// Check if frontend node_modules exists
if (fs.existsSync('frontend/node_modules')) {
  console.log('✅ Frontend dependencies installed');
} else {
  console.log('❌ Frontend dependencies not installed - Run: cd frontend && npm install');
  allGood = false;
}

// Check .env file
if (fs.existsSync('.env')) {
  console.log('✅ .env file found');

  // Read and check important variables
  const envContent = fs.readFileSync('.env', 'utf-8');

  if (envContent.includes('MONGODB_URI=mongodb')) {
    console.log('✅ MongoDB URI configured');

    // Check if it's still the default
    if (envContent.includes('mongodb://localhost:27017')) {
      console.log('⚠️  Using local MongoDB - Make sure MongoDB is running!');
      console.log('   Or update .env with MongoDB Atlas connection string');
    } else if (envContent.includes('mongodb+srv://')) {
      console.log('✅ Using MongoDB Atlas (cloud database)');
    }
  } else {
    console.log('❌ MONGODB_URI not configured in .env');
    allGood = false;
  }

  if (envContent.includes('JWT_SECRET=') && !envContent.includes('change-this')) {
    console.log('✅ JWT_SECRET configured');
  } else {
    console.log('⚠️  JWT_SECRET should be changed for security');
  }
} else {
  console.log('❌ .env file not found - Copy from .env.example');
  allGood = false;
}

console.log('\n=====================================\n');

if (allGood) {
  console.log('🎉 Everything looks good!\n');
  console.log('Next steps:');
  console.log('1. Make sure MongoDB is running (or use MongoDB Atlas)');
  console.log('2. Start backend: npm run dev');
  console.log('3. Start frontend: cd frontend && npm start');
  console.log('4. Open browser: http://localhost:3000\n');
} else {
  console.log('⚠️  Some issues found. Please fix them before starting.\n');
  console.log('See QUICK_START.md for detailed setup instructions.\n');
}

// Try to test MongoDB connection
if (fs.existsSync('.env')) {
  console.log('Testing MongoDB connection...\n');

  require('dotenv').config();
  const mongoose = require('mongoose');

  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-pantry', {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('✅ MongoDB connection successful!\n');
    console.log('You\'re all set! Ready to start the app.\n');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ MongoDB connection failed\n');
    console.log('Error:', err.message);
    console.log('\nPossible solutions:');
    console.log('1. Install and start MongoDB locally, OR');
    console.log('2. Set up MongoDB Atlas (recommended)');
    console.log('   See QUICK_START.md for step-by-step guide\n');
    process.exit(1);
  });
} else {
  process.exit(allGood ? 0 : 1);
}
