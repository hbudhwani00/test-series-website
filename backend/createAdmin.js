const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-series');
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ phone: '9999999999' });
    if (existingAdmin) {
      console.log('✓ Admin already exists!');
      console.log('Phone: 9999999999');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin
    const admin = new User({
      name: 'Admin',
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    
    console.log('✓ Admin created successfully!');
    console.log('=================================');
    console.log('Phone: 9999999999');
    console.log('Password: admin123');
    console.log('=================================');
    console.log('You can now login at: http://localhost:3000/admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
