const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const Question = require('../models/Question');
const User = require('../models/User');
const Test = require('../models/Test');
const ScheduledTest = require('../models/ScheduledTest');
const DemoLead = require('../models/DemoLead');
const { generateJEEMainTest, getJEEMainInstructions } = require('../utils/jeeMainPattern');

// Upload Question (Admin Only)
router.post('/questions', adminAuth, async (req, res) => {
  try {
    const questionData = req.body;

    // Validate question data
    if (!questionData.examType || !questionData.subject || !questionData.chapter || !questionData.question) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create question
    const question = new Question({
      ...questionData,
      uploadedBy: req.user.userId
    });

    await question.save();

    res.status(201).json({
      message: 'Question uploaded successfully',
      question
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk Upload Questions
router.post('/questions/bulk', adminAuth, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Invalid questions data' });
    }

    // Add uploadedBy to each question
    const questionsWithUploader = questions.map(q => ({
      ...q,
      uploadedBy: req.user.userId
    }));

    const insertedQuestions = await Question.insertMany(questionsWithUploader);

    res.status(201).json({
      message: `${insertedQuestions.length} questions uploaded successfully`,
      count: insertedQuestions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Questions (Admin Only)
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { examType, subject, chapter, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name');

    const count = await Question.countDocuments(filter);

    res.json({
      questions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Subjects and Chapters (Admin Only)
router.get('/subjects-chapters', adminAuth, async (req, res) => {
  try {
    const { examType } = req.query;

    if (!examType) {
      return res.status(400).json({ message: 'Exam type is required' });
    }

    const subjects = await Question.distinct('subject', { examType });
    
    const chaptersData = {};
    for (const subject of subjects) {
      const chapters = await Question.distinct('chapter', { examType, subject });
      chaptersData[subject] = chapters;
    }

    res.json({
      examType,
      subjects,
      chapters: chaptersData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Question (Admin Only)
router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Students (Admin Only)
router.get('/students', adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      students,
      total: students.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Dashboard Statistics (Admin Only)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalQuestions = await Question.countDocuments();
    
    const activeSubscriptions = await User.aggregate([
      { $match: { role: 'student' } },
      { $unwind: '$subscriptions' },
      { $match: { 'subscriptions.isActive': true } },
      { $count: 'total' }
    ]);

    const questionsByExam = await Question.aggregate([
      { $group: { _id: '$examType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalStudents,
      totalQuestions,
      activeSubscriptions: activeSubscriptions[0]?.total || 0,
      questionsByExam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Demo Test (Admin Only)
router.post('/demo-tests', adminAuth, async (req, res) => {
  try {
    const { title, examType, subject, chapter, questionCount = 5, duration = 15 } = req.body;

    // Get questions for demo test from "Demo Test" chapter
    const questions = await Question.find({
      examType,
      subject,
      chapter: chapter || 'Demo Test'
    }).limit(questionCount);

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for demo test' });
    }

    const questionIds = questions.map(q => ({ questionId: q._id }));
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 4), 0);

    const newTest = new Test({
      title: title || `Demo Test - ${subject}`,
      examType,
      testType: 'custom',
      subject,
      chapter: chapter || 'Demo Test',
      questions: questionIds,
      duration,
      totalMarks,
      isDemo: true
    });

    await newTest.save();

    res.status(201).json({
      message: 'Demo test created successfully',
      test: newTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Get All Students with Subscription Details
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const { examType, status, search } = req.query;

    const filter = { role: 'student' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    let students = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Filter by exam type and status if provided
    if (examType || status) {
      students = students.filter(student => {
        const subscription = student.subscriptions.find(sub => {
          const matchExam = !examType || sub.examType === examType;
          const matchStatus = !status || (
            status === 'active' ? sub.isActive && new Date(sub.expiryDate) > new Date() :
            status === 'expired' ? new Date(sub.expiryDate) <= new Date() :
            status === 'inactive' ? !sub.isActive : true
          );
          return matchExam && matchStatus;
        });
        return subscription;
      });
    }

    res.json({
      students,
      total: students.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grant/Add Manual Subscription
router.post('/subscriptions/:studentId', adminAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examType, expiryDate, amount } = req.body;

    if (!examType || !expiryDate) {
      return res.status(400).json({ message: 'Exam type and expiry date are required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if subscription already exists for this exam type
    const existingSubIndex = student.subscriptions.findIndex(
      sub => sub.examType === examType
    );

    if (existingSubIndex !== -1) {
      // Update existing subscription
      student.subscriptions[existingSubIndex].expiryDate = expiryDate;
      student.subscriptions[existingSubIndex].isActive = true;
      student.subscriptions[existingSubIndex].amount = amount || 0;
      student.subscriptions[existingSubIndex].paymentId = 'MANUAL_GRANT';
      student.subscriptions[existingSubIndex].orderId = `MANUAL_${Date.now()}`;
      student.subscriptions[existingSubIndex].purchaseDate = new Date();
    } else {
      // Add new subscription
      student.subscriptions.push({
        examType,
        expiryDate,
        purchaseDate: new Date(),
        amount: amount || 0,
        paymentId: 'MANUAL_GRANT',
        orderId: `MANUAL_${Date.now()}`,
        isActive: true
      });
    }

    await student.save();

    res.json({
      message: 'Subscription granted successfully',
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        subscriptions: student.subscriptions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Subscription (Expiry Date, Status)
router.put('/subscriptions/:studentId/:subscriptionId', adminAuth, async (req, res) => {
  try {
    const { studentId, subscriptionId } = req.params;
    const { expiryDate, isActive, amount } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const subscription = student.subscriptions.id(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update fields if provided
    if (expiryDate !== undefined) subscription.expiryDate = expiryDate;
    if (isActive !== undefined) subscription.isActive = isActive;
    if (amount !== undefined) subscription.amount = amount;

    await student.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Subscription
router.delete('/subscriptions/:studentId/:subscriptionId', adminAuth, async (req, res) => {
  try {
    const { studentId, subscriptionId } = req.params;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.subscriptions.pull(subscriptionId);
    await student.save();

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk Update Subscriptions (Extend expiry for multiple students)
router.post('/subscriptions/bulk-update', adminAuth, async (req, res) => {
  try {
    const { studentIds, examType, extendDays } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || !examType || !extendDays) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    let updatedCount = 0;

    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (!student) continue;

      const subscription = student.subscriptions.find(sub => sub.examType === examType);
      if (subscription) {
        const currentExpiry = new Date(subscription.expiryDate);
        currentExpiry.setDate(currentExpiry.getDate() + extendDays);
        subscription.expiryDate = currentExpiry;
        await student.save();
        updatedCount++;
      }
    }

    res.json({
      message: `Updated ${updatedCount} subscriptions`,
      updatedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== SCHEDULED TESTS ====================

// Create Scheduled Test
router.post('/scheduled-tests', adminAuth, async (req, res) => {
  try {
    console.log("Received payload:", req.body);

    // Combine date and time
    const [hours, minutes] = startTime.split(':');
    const startDateTime = new Date(startDate);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    console.log("Calculated startDateTime:", startDateTime);

    // Create a new test for this schedule
    let duration, totalMarks, pattern, jeeMainStructure;

    if (testType === 'sunday_full') {
      duration = 180; // 3 hours
      totalMarks = 300;
      pattern = 'jee_main';
      jeeMainStructure = {
        Physics: { sectionA: [], sectionB: [] },
        Chemistry: { sectionA: [], sectionB: [] },
        Mathematics: { sectionA: [], sectionB: [] }
      };
    } else if (testType === 'alternate_day') {
      duration = 60; // 1 hour
      totalMarks = 120;
      pattern = 'standard';
      jeeMainStructure = null;
    }

    console.log("Calculated duration:", duration);
    console.log("Calculated totalMarks:", totalMarks);

    // Ensure that the questions array contains at least one valid placeholder question if empty
    if (!Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      req.body.questions = [
        {
          questionNumber: 1,
          question: "Placeholder question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          marks: 4,
          hasNegativeMarking: true,
          difficulty: "medium",
          subject: req.body.subject || "General",
          chapter: req.body.chapter || "General",
          topic: "General",
          explanation: "",
          source: "Default",
          questionType: "mcq",
        },
      ];
    }

    const newTest = new Test({
      title: testTitle,
      examType: 'JEE',
      testType: 'full',
      pattern: pattern,
      duration: duration,
      totalMarks: totalMarks,
      jeeMainStructure: jeeMainStructure,
      questions: [], // Will be populated when scheduled test starts
      instructions: [
        {
          title: 'General Instructions',
          points: [
            `Duration: ${duration} minutes`,
            `Total Marks: ${totalMarks}`,
            'Read all instructions carefully before starting',
            'All questions carry equal marks'
          ]
        }
      ],
      createdBy: req.user.userId
    });

    await newTest.save();

    // Generate scheduled dates based on schedule type
    const scheduledDates = [];
    const end = endDate ? new Date(endDate) : new Date(startDateTime.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

    if (scheduleType === 'one-time') {
      scheduledDates.push({ date: startDateTime, isCompleted: false });
    } else if (scheduleType === 'alternate-days') {
      let currentDate = new Date(startDateTime);
      while (currentDate <= end) {
        scheduledDates.push({ date: new Date(currentDate), isCompleted: false });
        currentDate.setDate(currentDate.getDate() + 2); // Every 2 days
      }
    } else if (scheduleType === 'weekends') {
      let currentDate = new Date(startDateTime);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          const scheduledDateTime = new Date(currentDate);
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledDates.push({ date: scheduledDateTime, isCompleted: false });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (scheduleType === 'custom' && customDays && customDays.length > 0) {
      let currentDate = new Date(startDateTime);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (customDays.includes(dayOfWeek)) {
          const scheduledDateTime = new Date(currentDate);
          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledDates.push({ date: scheduledDateTime, isCompleted: false });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const scheduledTest = new ScheduledTest({
      title,                      // REQUIRED ✔
      testId: newTest._id,
      duration,                   // REQUIRED ✔
      totalMarks,                 // REQUIRED ✔
      examType,                   // REQUIRED ✔
      testType,
      scheduleType,
      startDate: startDateTime,
      endDate: end,
      scheduledDates,
      customDays: scheduleType === 'custom' ? customDays : [],
      isActive: true,
      createdBy: req.user.userId
    });
    
    await scheduledTest.save();

    res.status(201).json({
      message: 'Test scheduled successfully',
      scheduledTest,
      test: newTest,
      totalScheduledDates: scheduledDates.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Scheduled Tests
router.get('/scheduled-tests', adminAuth, async (req, res) => {
  try {
    const { examType, isActive } = req.query;

    const filter = {};
    if (examType) filter.examType = examType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const scheduledTests = await ScheduledTest.find(filter)
      .populate('testId', 'title examType subject duration totalMarks')
      .populate('createdBy', 'name')
      .sort({ startDate: -1 });

    res.json({
      scheduledTests,
      total: scheduledTests.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Active/Upcoming Scheduled Tests (For Students)
router.get('/scheduled-tests/upcoming', adminAuth, async (req, res) => {
  try {
    const { examType } = req.query;
    const today = new Date();

    const filter = {
      isActive: true,
      'scheduledDates.date': { $gte: today }
    };
    
    if (examType) filter.examType = examType;

    const scheduledTests = await ScheduledTest.find(filter)
      .populate('testId', 'title examType subject duration totalMarks')
      .sort({ 'scheduledDates.date': 1 });

    // Filter and format scheduled dates to show only upcoming ones
    const upcomingTests = scheduledTests.map(st => {
      const upcomingDates = st.scheduledDates.filter(sd => 
        new Date(sd.date) >= today && !sd.isCompleted
      );
      
      return {
        ...st.toObject(),
        upcomingDates: upcomingDates.slice(0, 5) // Show next 5 dates
      };
    }).filter(st => st.upcomingDates.length > 0);

    res.json({
      scheduledTests: upcomingTests,
      total: upcomingTests.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Scheduled Test
router.put('/scheduled-tests/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      testTitle, 
      testType, 
      examType, 
      scheduleType, 
      startDate, 
      startTime,
      endDate, 
      endTime,
      customDays 
    } = req.body;

    // Find the existing scheduled test
    const existingSchedule = await ScheduledTest.findById(id).populate('testId');
    if (!existingSchedule) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    // Update the test document if title or type changed
    if (testTitle || testType) {
      const testUpdates = {};
      if (testTitle) testUpdates.title = testTitle;
      if (testType) {
        if (testType === 'sunday_full') {
          testUpdates.duration = 180;
          testUpdates.totalMarks = 300;
        } else if (testType === 'alternate_day') {
          testUpdates.duration = 60;
          testUpdates.totalMarks = 120;
        }
      }
      
      await Test.findByIdAndUpdate(existingSchedule.testId._id, testUpdates);
    }

    // Regenerate scheduled dates if schedule parameters changed
    let scheduledDates = existingSchedule.scheduledDates;
    
    if (startDate || endDate || scheduleType || customDays || startTime) {
      scheduledDates = [];
      const start = new Date(startDate || existingSchedule.startDate);
      const end = scheduleType !== 'one-time' && endDate ? new Date(endDate) : new Date(start);
      
      // Parse time
      const [hours, minutes] = (startTime || '10:00').split(':');
      
      const currentDate = new Date(start);
      
      if (scheduleType === 'one-time' || !scheduleType) {
        currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        scheduledDates.push({ date: new Date(currentDate) });
      } else if (scheduleType === 'daily') {
        while (currentDate <= end) {
          const dateTime = new Date(currentDate);
          dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledDates.push({ date: new Date(dateTime) });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (scheduleType === 'weekly') {
        while (currentDate <= end) {
          const dateTime = new Date(currentDate);
          dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          scheduledDates.push({ date: new Date(dateTime) });
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (scheduleType === 'custom' && customDays && customDays.length > 0) {
        const selectedDays = customDays.sort();
        while (currentDate <= end) {
          if (selectedDays.includes(currentDate.getDay())) {
            const dateTime = new Date(currentDate);
            dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            scheduledDates.push({ date: new Date(dateTime) });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Update the scheduled test document
    const updates = {
      examType: examType || existingSchedule.examType,
      testType: testType || existingSchedule.testType,
      scheduleType: scheduleType || existingSchedule.scheduleType,
      startDate: startDate ? new Date(startDate) : existingSchedule.startDate,
      endDate: scheduleType !== 'one-time' && endDate ? new Date(endDate) : null,
      endTime: endTime || existingSchedule.endTime,
      customDays: customDays || existingSchedule.customDays,
      scheduledDates
    };

    const scheduledTest = await ScheduledTest.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('testId', 'title examType subject duration totalMarks');

    res.json({
      message: 'Scheduled test updated successfully',
      scheduledTest,
      totalScheduledDates: scheduledDates.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Scheduled Test
router.delete('/scheduled-tests/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const scheduledTest = await ScheduledTest.findByIdAndDelete(id);

    if (!scheduledTest) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    res.json({ message: 'Scheduled test deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark Scheduled Date as Completed
router.put('/scheduled-tests/:id/complete/:dateId', adminAuth, async (req, res) => {
  try {
    const { id, dateId } = req.params;

    const scheduledTest = await ScheduledTest.findById(id);
    if (!scheduledTest) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    const scheduledDate = scheduledTest.scheduledDates.id(dateId);
    if (!scheduledDate) {
      return res.status(404).json({ message: 'Scheduled date not found' });
    }

    scheduledDate.isCompleted = true;
    await scheduledTest.save();

    res.json({ message: 'Scheduled date marked as completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== JEE MAIN PATTERN TEST ====================

// Generate JEE Main Pattern Test (Admin Only)
router.post('/generate-jee-main-test', adminAuth, async (req, res) => {
  try {
    const { title, examType = 'JEE' } = req.body;

    // Generate JEE Main pattern test with questions
    const testData = await generateJEEMainTest(examType);

    if (!testData || testData.subjects.some(s => s.sectionA.length < 20 || s.sectionB.length < 10)) {
      return res.status(400).json({ 
        message: 'Insufficient questions in database to generate JEE Main pattern test',
        required: 'Need 20 Section A + 10 Section B questions per subject (Physics, Chemistry, Mathematics)'
      });
    }

    // Create test in database
    const test = new Test({
      title: title || 'JEE Main Mock Test',
      examType: examType,
      testType: 'jee_main_pattern',
      pattern: 'jee_main',
      duration: 180, // 3 hours
      totalMarks: 300,
      instructions: getJEEMainInstructions(),
      jeeMainStructure: {
        Physics: {
          sectionA: testData.subjects[0].sectionA.map(q => q.questionId),
          sectionB: testData.subjects[0].sectionB.map(q => q.questionId)
        },
        Chemistry: {
          sectionA: testData.subjects[1].sectionA.map(q => q.questionId),
          sectionB: testData.subjects[1].sectionB.map(q => q.questionId)
        },
        Mathematics: {
          sectionA: testData.subjects[2].sectionA.map(q => q.questionId),
          sectionB: testData.subjects[2].sectionB.map(q => q.questionId)
        }
      },
      // Also store in standard questions format for compatibility
      questions: [
        ...testData.subjects[0].sectionA,
        ...testData.subjects[0].sectionB,
        ...testData.subjects[1].sectionA,
        ...testData.subjects[1].sectionB,
        ...testData.subjects[2].sectionA,
        ...testData.subjects[2].sectionB
      ].map((q, index) => ({
        questionId: q.questionId,
        order: index + 1,
        section: q.section,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        compulsory: q.compulsory
      })),
      createdBy: req.user.userId
    });

    await test.save();

    res.status(201).json({
      message: 'JEE Main pattern test created successfully',
      test: {
        id: test._id,
        title: test.title,
        pattern: 'JEE Main (90 Questions, 180 Minutes, 300 Marks)',
        structure: {
          Physics: '20 MCQ + 10 Numerical',
          Chemistry: '20 MCQ + 10 Numerical',
          Mathematics: '20 MCQ + 10 Numerical'
        },
        duration: 180,
        totalMarks: 300
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get JEE Main Pattern Info
router.get('/jee-main-pattern', adminAuth, async (req, res) => {
  try {
    const pattern = {
      name: 'JEE Main 2024-25 Pattern',
      totalQuestions: 90,
      duration: 180,
      totalMarks: 300,
      subjects: [
        {
          name: 'Physics',
          sectionA: {
            questions: 20,
            type: 'Multiple Choice (Single Correct)',
            marks: 4,
            negativeMarks: -1,
            compulsory: 'All 20'
          },
          sectionB: {
            questions: 10,
            type: 'Numerical Value Answer',
            marks: 4,
            negativeMarks: 0,
            compulsory: 'Any 5 out of 10'
          }
        },
        {
          name: 'Chemistry',
          sectionA: {
            questions: 20,
            type: 'Multiple Choice (Single Correct)',
            marks: 4,
            negativeMarks: -1,
            compulsory: 'All 20'
          },
          sectionB: {
            questions: 10,
            type: 'Numerical Value Answer',
            marks: 4,
            negativeMarks: 0,
            compulsory: 'Any 5 out of 10'
          }
        },
        {
          name: 'Mathematics',
          sectionA: {
            questions: 20,
            type: 'Multiple Choice (Single Correct)',
            marks: 4,
            negativeMarks: -1,
            compulsory: 'All 20'
          },
          sectionB: {
            questions: 10,
            type: 'Numerical Value Answer',
            marks: 4,
            negativeMarks: 0,
            compulsory: 'Any 5 out of 10'
          }
        }
      ],
      instructions: getJEEMainInstructions()
    };

    res.json(pattern);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Demo Leads (Admin Only)
router.get('/demo-leads', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'createdAt', 
      order = 'desc',
      search = '',
      converted = '' // 'true', 'false', or '' (all)
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (converted === 'true') {
      filter.convertedToUser = true;
    } else if (converted === 'false') {
      filter.convertedToUser = false;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = order === 'desc' ? -1 : 1;

    // Fetch leads with pagination
    const leads = await DemoLead.find(filter)
      .populate('resultId', 'score percentage totalMarks correctAnswers incorrectAnswers unattempted timeTaken')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await DemoLead.countDocuments(filter);

    // Get stats
    const stats = {
      totalLeads: await DemoLead.countDocuments(),
      convertedLeads: await DemoLead.countDocuments({ convertedToUser: true }),
      unconvertedLeads: await DemoLead.countDocuments({ convertedToUser: false }),
      averageScore: await DemoLead.aggregate([
        { $match: { testScore: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: '$testPercentage' } } }
      ]).then(result => result[0]?.avgScore?.toFixed(2) || 0),
      leadsToday: await DemoLead.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      leadsThisWeek: await DemoLead.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      leadsThisMonth: await DemoLead.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) }
      })
    };

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching demo leads:', error);
    res.status(500).json({ message: 'Failed to fetch demo leads', error: error.message });
  }
});

// Mark Lead as Converted (Admin Only)
router.patch('/demo-leads/:leadId/convert', adminAuth, async (req, res) => {
  try {
    const { leadId } = req.params;
    const { converted } = req.body;

    const lead = await DemoLead.findByIdAndUpdate(
      leadId,
      { convertedToUser: converted },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ 
      message: `Lead marked as ${converted ? 'converted' : 'unconverted'}`,
      lead 
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Failed to update lead', error: error.message });
  }
});

// Delete Lead (Admin Only)
router.delete('/demo-leads/:leadId', adminAuth, async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await DemoLead.findByIdAndDelete(leadId);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Failed to delete lead', error: error.message });
  }
});

// Export Leads to CSV (Admin Only)
router.get('/demo-leads/export/csv', adminAuth, async (req, res) => {
  try {
    const leads = await DemoLead.find()
      .populate('resultId', 'score percentage totalMarks')
      .sort({ createdAt: -1 });

    // Create CSV header
    let csv = 'Name,Phone,Email,Score,Percentage,Converted,Submitted On\n';

    // Add data rows
    leads.forEach(lead => {
      const name = lead.name.replace(/,/g, ' ');
      const phone = lead.phone;
      const email = lead.email || 'N/A';
      const score = lead.testScore || 'N/A';
      const percentage = lead.testPercentage ? `${lead.testPercentage}%` : 'N/A';
      const converted = lead.convertedToUser ? 'Yes' : 'No';
      const date = new Date(lead.createdAt).toLocaleDateString('en-IN');
      
      csv += `${name},${phone},${email},${score},${percentage},${converted},${date}\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=demo-leads-${Date.now()}.csv`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ message: 'Failed to export leads', error: error.message });
  }
});

module.exports = router;
