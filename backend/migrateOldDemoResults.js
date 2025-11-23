const mongoose = require('mongoose');
require('dotenv').config();
const Result = require('./models/Result');
const DemoTest = require('./models/DemoTest');
const NEETDemoTest = require('./models/NEETDemoTest');

async function migrateOldDemoResults() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all demo results without onModel field
    const oldResults = await Result.find({
      isDemo: true,
      $or: [
        { onModel: { $exists: false } },
        { onModel: null },
        { testType: 'Test', isDemo: true }
      ]
    });

    console.log(`Found ${oldResults.length} old demo results to migrate`);

    let jeeCount = 0;
    let neetCount = 0;
    let errorCount = 0;

    for (const result of oldResults) {
      try {
        // Check if testId exists in DemoTest collection (JEE)
        const jeeTest = await DemoTest.findById(result.testId);
        
        if (jeeTest) {
          // It's a JEE demo test
          result.onModel = 'DemoTest';
          result.testType = 'jee_demo';
          await result.save();
          jeeCount++;
          console.log(`✅ Migrated JEE result: ${result._id}`);
        } else {
          // Check if it's in NEETDemoTest collection
          const neetTest = await NEETDemoTest.findById(result.testId);
          
          if (neetTest) {
            // It's a NEET demo test
            result.onModel = 'NEETDemoTest';
            result.testType = 'neet_demo';
            await result.save();
            neetCount++;
            console.log(`✅ Migrated NEET result: ${result._id}`);
          } else {
            console.log(`⚠️  Could not find test for result: ${result._id}`);
            errorCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error migrating result ${result._id}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`JEE results migrated: ${jeeCount}`);
    console.log(`NEET results migrated: ${neetCount}`);
    console.log(`Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateOldDemoResults();
