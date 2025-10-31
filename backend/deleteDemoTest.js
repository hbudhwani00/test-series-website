const mongoose = require('mongoose');
const Test = require('./models/Test');
require('dotenv').config();

async function deleteDemoTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Test.deleteOne({ 
      testType: 'demo',
      pattern: 'jee_main'
    });

    console.log(`\n✅ Deleted ${result.deletedCount} demo test(s)`);
    console.log('Next time you access the demo test, it will be recreated with proper question population.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteDemoTest();
