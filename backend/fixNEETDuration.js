const mongoose = require('mongoose');
const NEETDemoTest = require('./models/NEETDemoTest');
require('dotenv').config();

async function fixDuration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-series');
    console.log('Connected to MongoDB');

    const result = await NEETDemoTest.updateMany(
      {},
      { $set: { duration: 180 } }
    );

    console.log(`Updated ${result.modifiedCount} NEET demo test(s)`);
    console.log('Duration set to 180 minutes (3 hours)');

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDuration();
