const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Payment = require('../models/Payment');
const PromoCode = require('../models/PromoCode');

// Initialize Razorpay (optional, as we're using UPI now)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// Subscription Plans with GST included
const SUBSCRIPTION_PLANS = {
  JEE_MAIN: {
    name: 'JEE Main',
    amount: 299,
    duration: 365 // days
  },
  JEE_MAIN_ADVANCED: {
    name: 'JEE Main + Advanced',
    amount: 399,
    duration: 365
  },
  NEET: {
    name: 'NEET',
    amount: 399,
    duration: 365
  }
};

// Create Order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!SUBSCRIPTION_PLANS[planType]) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }

    const plan = SUBSCRIPTION_PLANS[planType];
    const amount = plan.amount * 100; // Convert to paise

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        planType: planType
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: amount,
      currency: order.currency,
      planType: planType,
      planName: plan.name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Verify Payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, planType } = req.body;

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update user subscription
    const plan = SUBSCRIPTION_PLANS[planType];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    const user = await User.findById(req.user.userId);

    user.subscriptions.push({
      examType: planType,
      purchaseDate: new Date(),
      expiryDate: expiryDate,
      paymentId: paymentId,
      orderId: orderId,
      amount: plan.amount,
      isActive: true
    });

    await user.save();

    res.json({
      message: 'Payment verified and subscription activated',
      subscription: {
        planType: planType,
        planName: plan.name,
        expiryDate: expiryDate
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying payment', error: error.message });
  }
});

// Get Subscription Plans
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.keys(SUBSCRIPTION_PLANS).map(key => ({
      type: key,
      name: SUBSCRIPTION_PLANS[key].name,
      amount: SUBSCRIPTION_PLANS[key].amount,
      duration: SUBSCRIPTION_PLANS[key].duration
    }))
  });
});

// Check Subscription Status
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('subscriptions');

    const activeSubscriptions = user.subscriptions.filter(sub => 
      sub.isActive && new Date(sub.expiryDate) > new Date()
    );

    res.json({
      subscriptions: activeSubscriptions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========== UPI PAYMENT ROUTES ==========

// @route   POST /api/payments/upi/initiate
// @desc    Initiate UPI payment
// @access  Private
router.post('/upi/initiate', auth, async (req, res) => {
  try {
    const { examType, amount, originalAmount, promoCode, discount } = req.body;

    const payment = new Payment({
      userId: req.user.userId,
      examType,
      amount,
      originalAmount,
      promoCode,
      discount: discount || 0,
      paymentMethod: 'UPI',
      status: 'PENDING'
    });

    await payment.save();

    res.status(201).json({
      message: 'Payment initiated',
      payment: {
        _id: payment._id,
        amount: payment.amount,
        upiId: payment.upiId,
        examType: payment.examType
      }
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/upi/:id/submit
// @desc    Submit payment proof (screenshot + transaction ID)
// @access  Private
router.post('/upi/:id/submit', auth, async (req, res) => {
  try {
    const { transactionId, screenshot, notes } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    payment.transactionId = transactionId;
    payment.screenshot = screenshot;
    payment.notes = notes;

    await payment.save();

    res.json({
      message: 'Payment proof submitted successfully. It will be reviewed within 30 minutes.',
      payment
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name');

    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/pending
// @desc    Get all pending payments (Admin only)
// @access  Private/Admin
router.get('/pending', auth, adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'PENDING' })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    res.json({ payments });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/all
// @desc    Get all payments (Admin only)
// @access  Private/Admin
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = status ? { status } : {};
    
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email phone')
      .populate('approvedBy', 'name');

    const count = await Payment.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/:id/approve
// @desc    Approve payment and activate subscription (Admin only)
// @access  Private/Admin

// @route   PUT /api/payments/:id/approve
// @desc    Approve payment and activate subscription (Admin only)
// @access  Private/Admin
router.put('/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    // Check promo code validity before approval
    if (payment.promoCode) {
      const promoCode = await PromoCode.findOne({ code: payment.promoCode });
      
      if (!promoCode) {
        return res.status(400).json({ message: 'Promo code no longer exists' });
      }

      // Check if user already used it
      if (promoCode.usedBy && promoCode.usedBy.includes(payment.userId)) {
        return res.status(400).json({ 
          message: 'User already used this promo code. Cannot approve payment.' 
        });
      }

      // Check if promo code reached max uses
      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
        return res.status(400).json({ 
          message: 'Promo code usage limit reached. Cannot approve payment.' 
        });
      }
    }

    // Update payment status
    payment.status = 'APPROVED';
    payment.approvedBy = req.user.userId;
    payment.approvedAt = new Date();
    await payment.save();

    // Activate subscription for user
    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);

    const existingSubIndex = user.subscriptions.findIndex(
      sub => sub.examType === payment.examType
    );

    if (existingSubIndex !== -1) {
      user.subscriptions[existingSubIndex].expiryDate = expiryDate;
      user.subscriptions[existingSubIndex].isActive = true;
      user.subscriptions[existingSubIndex].amount = payment.amount;
    } else {
      user.subscriptions.push({
        examType: payment.examType,
        purchaseDate: new Date(),
        expiryDate,
        paymentId: payment._id.toString(),
        amount: payment.amount,
        isActive: true
      });
    }

    await user.save();

    // Atomic promo code update
    if (payment.promoCode) {
      await PromoCode.findOneAndUpdate(
        { code: payment.promoCode },
        {
          $inc: { usedCount: 1 },
          $push: { usedBy: payment.userId }
        }
      );
    }

    res.json({
      message: 'Payment approved and subscription activated',
      payment,
      subscription: user.subscriptions[existingSubIndex !== -1 ? existingSubIndex : user.subscriptions.length - 1]
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/:id/reject
// @desc    Reject payment (Admin only)
// @access  Private/Admin
router.put('/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ message: 'Payment already processed' });
    }

    payment.status = 'REJECTED';
    payment.rejectionReason = reason;
    payment.approvedBy = req.user.userId;
    payment.approvedAt = new Date();

    await payment.save();

    res.json({
      message: 'Payment rejected',
      payment
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
