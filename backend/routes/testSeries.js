const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ScheduledTest = require('../models/ScheduledTest');
const Test = require('../models/Test');

// Get all test series for students
router.get('/all', auth, async (req, res) => {
  try {
    const now = new Date();

    // Get all active scheduled tests (both old and new system)
    const scheduledTests = await ScheduledTest.find({
      isActive: true
    })
      .populate('testId')
      .populate('questions')
      .sort({ 'scheduledDates.date': 1 });

    // Separate into Sunday tests and Alternate day tests
    const sundayTests = [];
    const alternateDayTests = [];

    scheduledTests.forEach(schedule => {
      schedule.scheduledDates.forEach(dateObj => {
        const scheduledDate = new Date(dateObj.date);
        
        // Determine duration and totalMarks based on which system was used
        let duration, totalMarks, title, testId;
        
        if (schedule.testId) {
          // Old system - test created through old interface
          duration = schedule.testId.duration;
          totalMarks = schedule.testId.totalMarks;
          title = schedule.testId.title;
          testId = schedule.testId._id;
        } else if (schedule.questions && schedule.questions.length > 0) {
          // New system - test created through ManageScheduledTest
          duration = schedule.duration;
          totalMarks = schedule.totalMarks;
          title = schedule.title;
          testId = schedule._id;
        } else {
          return; // Skip if neither system data exists
        }

        const endDate = new Date(scheduledDate.getTime() + duration * 60000);

        // Only include tests that haven't ended yet or are live
        if (endDate >= now) {
          const testInstance = {
            _id: testId,
            scheduledTestId: schedule._id, // Keep reference to ScheduledTest
            title: title,
            scheduledDate: scheduledDate,
            duration: duration,
            totalMarks: totalMarks,
            testType: schedule.testType,
            isCompleted: dateObj.isCompleted,
            hasQuestions: schedule.questions && schedule.questions.length > 0, // Flag for new system
            hasTestId: !!schedule.testId // Flag for old system
          };

          if (schedule.testType === 'sunday_full') {
            sundayTests.push(testInstance);
          } else if (schedule.testType === 'alternate_day') {
            alternateDayTests.push(testInstance);
          }
        }
      });
    });

    res.json({
      sundayTests: sundayTests.slice(0, 10), // Limit to next 10 tests
      alternateDayTests: alternateDayTests.slice(0, 10)
    });
  } catch (error) {
    console.error('Error fetching test series:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific test details
router.get('/:testId', auth, async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId)
      .populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({ test });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
