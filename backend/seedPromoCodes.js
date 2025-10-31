const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PromoCode = require('./models/PromoCode');

dotenv.config();

const seedPromoCodes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if NEW promo code already exists
    const existing = await PromoCode.findOne({ code: 'NEW' });
    if (existing) {
      console.log('NEW promo code already exists');
      process.exit(0);
    }

    // Create NEW promo code: ₹290 discount (₹299 -> ₹9)
    const newPromo = new PromoCode({
      code: 'NEW',
      discount: 290,
      discountType: 'FIXED',
      isActive: true,
      description: 'Special discount for new users - ₹290 off',
      applicableExams: ['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET']
    });

    await newPromo.save();
    console.log('✅ NEW promo code created successfully!');
    console.log('Code: NEW');
    console.log('Discount: ₹290');
    console.log('Final Amount: ₹9 (after applying to ₹299 subscription)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding promo codes:', error);
    process.exit(1);
  }
};

seedPromoCodes();
