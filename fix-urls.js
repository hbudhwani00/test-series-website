const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'client/src/pages/admin/PaymentApproval.js',
  'client/src/pages/admin/PromoCodeManagement.js',
  'client/src/pages/admin/ManageDemoTest.js',
  'client/src/pages/admin/ManageSubscriptions.js',
  'client/src/pages/admin/ScheduleTests.js',
  'client/src/pages/admin/StudentAnalytics.js',
  'client/src/pages/admin/UploadQuestion.js',
  'client/src/pages/admin/ManageScheduledTest.js',
  'client/src/pages/student/ExamPatternSelection.js',
  'client/src/pages/student/Subscription.js',
  'client/src/pages/student/TestSeries.js',
  'client/src/pages/student/ScheduledTestPage.js',
  'client/src/pages/student/ScheduledResultDetail.js',
  'client/src/pages/student/JEEMainTest.js',
  'client/src/pages/student/DemoResultDetail.js',
  'client/src/pages/student/AITestTake.js',
  'client/src/pages/student/AITest.js',
  'client/src/components/UpcomingScheduledTests.js'
];

let fixed = 0;
let errors = 0;

files.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Count localhost occurrences before
    const beforeCount = (content.match(/localhost:5000/g) || []).length;
    
    if (beforeCount > 0) {
      // Replace all variations of localhost URLs
      content = content
        .replace(/['"`]http:\/\/localhost:5000\/api\//g, '`${API_URL}/')
        .replace(/`http:\/\/localhost:5000\/api\//g, '`${API_URL}/');
      
      // Count after
      const afterCount = (content.match(/localhost:5000/g) || []).length;
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file}: ${beforeCount} → ${afterCount} localhost references`);
      fixed++;
    } else {
      console.log(`✓ ${file}: Already clean`);
    }
  } catch (err) {
    console.error(`❌ Error fixing ${file}:`, err.message);
    errors++;
  }
});

console.log(`\n📊 Summary: Fixed ${fixed} files, ${errors} errors`);
