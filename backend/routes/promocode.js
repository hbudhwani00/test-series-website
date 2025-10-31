const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const { auth, adminAuth } = require('../middleware/auth');

// @route   POST /api/promocodes
// @desc    Create promo code (Admin only)
// @access  Private/Admin
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { code, discount, discountType, expiryDate, maxUses, applicableExams, description } = req.body;

    // Check if code already exists
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
      createdBy: req.user.id
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
// @desc    Validate and apply promo code
// @access  Private
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, examType, originalAmount } = req.body;

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    // Check expiry
    if (promoCode.expiryDate && new Date(promoCode.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    // Check applicable exams
    if (promoCode.applicableExams && promoCode.applicableExams.length > 0) {
      if (!promoCode.applicableExams.includes(examType)) {
        return res.status(400).json({ message: 'Promo code not applicable for this exam' });
      }
    }

    // Calculate discount
    let discount = 0;
    if (promoCode.discountType === 'PERCENTAGE') {
      discount = (originalAmount * promoCode.discount) / 100;
    } else {
      discount = promoCode.discount;
    }

    // Ensure discount doesn't exceed original amount
    discount = Math.min(discount, originalAmount);
    const finalAmount = Math.max(originalAmount - discount, 0);

    res.json({
      valid: true,
      discount,
      finalAmount,
      promoCode: {
        code: promoCode.code,
        discount: promoCode.discount,
        discountType: promoCode.discountType
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

module.exports = router;
