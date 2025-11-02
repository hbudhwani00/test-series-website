const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PromoCode = require('../models/PromoCode');
const { auth, adminAuth } = require('../middleware/auth');

// @route   POST /api/promocodes
// @desc    Create promo code (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { code, discount, discountType, expiryDate, maxUses, applicableExams, description } = req.body;

    if (!code || !discount) {
      return res.status(400).json({ message: 'Code and discount are required' });
    }

    if (discount <= 0) {
      return res.status(400).json({ message: 'Discount must be positive' });
    }

    if (discountType === 'PERCENTAGE' && discount > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      discount,
      discountType: discountType || 'FIXED',
      expiryDate,
      maxUses,
      applicableExams,
      description,
      createdBy: req.user.userId
    });

    await promoCode.save();

    res.status(201).json({
      message: 'Promo code created successfully',
      promoCode
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/promocodes
// @desc    Get all promo codes (Admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({ promoCodes });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/promocodes/validate
// @desc    Validate and calculate promo code discount
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, examType, originalAmount } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Promo code is required' });
    }

    if (!originalAmount || originalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Check if user already used this code
    if (promoCode.usedBy && promoCode.usedBy.includes(req.user.userId)) {
      return res.status(400).json({ message: 'You have already used this promo code' });
    }

    if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    if (promoCode.applicableExams && promoCode.applicableExams.length > 0) {
      if (!promoCode.applicableExams.includes(examType)) {
        return res.status(400).json({ message: 'Promo code not applicable for this exam' });
      }
    }

    let discount = 0;
    if (promoCode.discountType === 'PERCENTAGE') {
      discount = (originalAmount * promoCode.discount) / 100;
    } else {
      discount = promoCode.discount;
    }

    discount = Math.min(discount, originalAmount);
    const finalAmount = Math.max(originalAmount - discount, 0);

    res.json({
      valid: true,
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      promoCode: {
        code: promoCode.code,
        discount: promoCode.discount,
        discountType: promoCode.discountType,
        description: promoCode.description
      }
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/promocodes/:id
// @desc    Update promo code (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid promo code ID' });
    }

    const { isActive, expiryDate, maxUses, description } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    if (isActive !== undefined) promoCode.isActive = isActive;
    if (expiryDate !== undefined) promoCode.expiryDate = expiryDate;
    if (maxUses !== undefined) promoCode.maxUses = maxUses;
    if (description !== undefined) promoCode.description = description;

    await promoCode.save();

    res.json({
      message: 'Promo code updated successfully',
      promoCode
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/promocodes/:id
// @desc    Delete promo code (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid promo code ID' });
    }

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    await promoCode.deleteOne();

    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/promocodes/stats
// @desc    Get promo code statistics (Admin only)
// @access  Private/Admin
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalCodes = await PromoCode.countDocuments();
    const activeCodes = await PromoCode.countDocuments({ isActive: true });
    const expiredCodes = await PromoCode.countDocuments({
      expiryDate: { $lt: new Date() }
    });

    res.json({
      totalCodes,
      activeCodes,
      expiredCodes,
      inactiveCodes: totalCodes - activeCodes
    });
  } catch (error) {
    console.error('Error fetching promo code stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
