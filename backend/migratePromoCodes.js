const mongoose = require('mongoose');
const PromoCode = require('./models/PromoCode');
require('dotenv').config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all promo codes that don't have usedBy field
    const result = await PromoCode.updateMany(
      { usedBy: { $exists: false } },
      { $set: { usedBy: [] } }
    );
    
    console.log(`✅ Migration complete!`);
    console.log(`Updated ${result.modifiedCount} promo codes`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
