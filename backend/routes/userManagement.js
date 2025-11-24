const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Result = require('../models/Result');

const { auth, adminAuth } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Enhance with test count
    const usersWithStats = await Promise.all(users.map(async (user) => {  
      const testCount = await Result.countDocuments({ userId: user._id });
      const deviceCount = user.loginHistory?.length || 1;
      
      return {
        ...user.toObject(),
        testsTaken: testCount,
        deviceCount: deviceCount
      };
    }));

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details with full activity (Admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all test results
    const testResults = await Result.find({ userId })
      .populate('testId', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedResults = testResults.map(result => ({
      testName: result.testId?.title || 'Unknown Test',
      score: result.score,
      totalMarks: result.totalMarks,
      date: result.createdAt
    }));

    res.json({
      ...user.toObject(),
      testResults: formattedResults,
      loginHistory: user.loginHistory || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (Admin only)
router.post('/users/create', adminAuth, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phoneNumber, 
      password, 
      subscriptionStatus,
      subscriptionType,
      subscriptionExpiry 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role: 'student',
      subscriptionStatus: subscriptionStatus || 'inactive',
      subscriptionType: subscriptionType || '',
      subscriptionExpiry: subscriptionExpiry || null
    });

    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change user password (Admin only)
router.put('/users/:userId/password', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete user's results
    await Result.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user subscription (Admin only)
router.put('/users/:userId/subscription', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { subscriptionStatus, subscriptionType, subscriptionExpiry } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (subscriptionStatus) user.subscriptionStatus = subscriptionStatus;
    if (subscriptionType) user.subscriptionType = subscriptionType;
    if (subscriptionExpiry) user.subscriptionExpiry = subscriptionExpiry;

    await user.save();

    res.json({ 
      message: 'Subscription updated successfully',
      user: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionType: user.subscriptionType,
        subscriptionExpiry: user.subscriptionExpiry
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
