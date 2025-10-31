const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Test = require('../models/Test');
const Question = require('../models/Question');
const User = require('../models/User');
const ScheduledTest = require('../models/ScheduledTest');

// AI Test Generation Algorithm
const generateTest = async (examType, subject, chapter, difficulty, questionCount) => {
  const filter = { examType };
  
  if (subject) filter.subject = subject;
  if (chapter) filter.chapter = chapter;
  if (difficulty) filter.difficulty = difficulty;

  // Get questions based on distribution
  const singleChoiceCount = Math.floor(questionCount * 0.5); // 50%
  const multipleChoiceCount = Math.floor(questionCount * 0.3); // 30%
  const numericalCount = questionCount - singleChoiceCount - multipleChoiceCount; // 20%

  const usedQuestionIds = []; // Track used questions to prevent duplicates

  const singleChoice = await Question.aggregate([
    { $match: { ...filter, questionType: 'single', _id: { $nin: usedQuestionIds } } },
    { $sample: { size: singleChoiceCount } }
  ]);
  singleChoice.forEach(q => usedQuestionIds.push(q._id));

  const multipleChoice = await Question.aggregate([
    { $match: { ...filter, questionType: 'multiple', _id: { $nin: usedQuestionIds } } },
    { $sample: { size: multipleChoiceCount } }
  ]);
  multipleChoice.forEach(q => usedQuestionIds.push(q._id));

  const numerical = await Question.aggregate([
    { $match: { ...filter, questionType: 'numerical', _id: { $nin: usedQuestionIds } } },
    { $sample: { size: numericalCount } }
  ]);
  numerical.forEach(q => usedQuestionIds.push(q._id));

  const allQuestions = [...singleChoice, ...multipleChoice, ...numerical];
  
  // Shuffle questions
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }

  return allQuestions;
};

// Get Demo Tests
router.get('/demo', async (req, res) => {
  try {
    const { examType } = req.query;

    if (!examType) {
      return res.status(400).json({ message: 'Exam type is required' });
    }

    const demoTests = await Test.find({ examType, isDemo: true })
      .populate('questions.questionId')
      .limit(2);

    res.json({ demoTests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate Custom Test (AI-powered)
router.post('/generate', auth, async (req, res) => {
  try {
    const { examType, subject, chapter, difficulty, questionCount = 30 } = req.body;

    // Check if user has active subscription
    const user = await User.findById(req.user.userId);
    const hasActiveSubscription = user.subscriptions.some(sub => 
      sub.isActive && 
      new Date(sub.expiryDate) > new Date() &&
      (sub.examType === `${examType}_MAIN` || sub.examType === `${examType}_MAIN_ADVANCED` || sub.examType === examType)
    );

    if (!hasActiveSubscription) {
      return res.status(403).json({ message: 'Active subscription required to generate tests' });
    }

    // Generate test using AI algorithm
    const questions = await generateTest(examType, subject, chapter, difficulty, questionCount);

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found matching criteria' });
    }

    // Calculate total marks and duration
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 4), 0);
    const duration = Math.ceil(questionCount * 2); // 2 minutes per question

    // Create test
    const test = new Test({
      title: `${examType} - ${subject || 'Mixed'} ${chapter ? '- ' + chapter : ''}`,
      examType,
      testType: chapter ? 'chapter' : subject ? 'subject' : 'custom',
      subject,
      chapter,
      questions: questions.map((q, index) => ({
        questionId: q._id,
        order: index + 1
      })),
      duration,
      totalMarks,
      createdBy: req.user.userId
    });

    await test.save();

    res.json({
      message: 'Test generated successfully',
      test: {
        id: test._id,
        title: test.title,
        questionCount: questions.length,
        duration,
        totalMarks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// IMPORTANT: Specific routes must come BEFORE parameterized routes like /:testId

// Generate new JEE Main Test (subscription required)
// Generate New JEE Main Test (Public for demo, or with subscription)
router.get('/new', async (req, res) => {
  try {
    // Check if user is authenticated
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        
        // If authenticated, check for subscription
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        const hasActiveSubscription = user.subscriptions.some(sub => {
          return (sub.examType === 'JEE_MAIN' || sub.examType === 'JEE_MAIN_ADVANCED') &&
                 sub.isActive && 
                 new Date(sub.expiryDate) > new Date();
        });

        if (!hasActiveSubscription) {
          return res.status(403).json({ 
            message: 'Active JEE Main subscription required to generate tests' 
          });
        }
      } catch (err) {
        // Invalid token - treat as unauthenticated (demo mode)
        userId = null;
      }
    }
    // If no token, this is a demo test - allow it

    // Generate new test with random questions
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const jeeMainStructure = {};
    const usedQuestionIds = []; // Track used questions to prevent duplicates

    for (const subject of subjects) {
      // Get 20 MCQ questions for Section A
      const sectionAQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'single',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 20 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionAQuestions.forEach(q => usedQuestionIds.push(q._id));

      // Get 5 Numerical questions for Section B
      const sectionBQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'numerical',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 5 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionBQuestions.forEach(q => usedQuestionIds.push(q._id));

      if (sectionAQuestions.length < 20 || sectionBQuestions.length < 5) {
        return res.status(400).json({ 
          message: `Not enough questions available for ${subject}. Need 20 MCQ and 5 Numerical questions.`,
          available: {
            sectionA: sectionAQuestions.length,
            sectionB: sectionBQuestions.length
          }
        });
      }

      jeeMainStructure[subject] = {
        sectionA: sectionAQuestions.map(q => q._id),
        sectionB: sectionBQuestions.map(q => q._id)
      };
    }

    // Create new test instance
    const newTest = new Test({
      title: userId ? 'JEE Main 2026 Test' : 'JEE Main 2026 Demo Test',
      examType: 'JEE',
      pattern: 'jee_main',
      duration: 180,
      totalMarks: 300,
      testType: userId ? 'custom' : 'demo',
      jeeMainStructure,
      createdBy: userId,
      instructions: [
        {
          title: 'General Instructions',
          points: [
            'Total duration of JEE-Main is 180 minutes (3 hours)',
            'The test consists of 75 questions in total',
            'Each subject (Physics, Chemistry, Mathematics) has 25 questions',
            'All questions carry 4 marks each',
            'There is NO negative marking for Numerical Type questions'
          ]
        },
        {
          title: 'Section A - MCQs (20 questions per subject)',
          points: [
            '20 Multiple Choice Questions (One Correct Out of Four)',
            'Each correct answer: +4 marks',
            'Each incorrect answer: -1 mark (Negative marking)',
            'Unanswered: 0 marks'
          ]
        },
        {
          title: 'Section B - Numerical (5 questions per subject)',
          points: [
            '5 Numerical Answer Type questions',
            'Answer should be a numerical value',
            'Each correct answer: +4 marks',
            'NO negative marking for incorrect answers',
            'Unanswered: 0 marks'
          ]
        }
      ]
    });

    await newTest.save();
    await newTest.populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    res.json({ test: newTest });
  } catch (error) {
    console.error('Error generating new JEE Main test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get or Create JEE Main Demo Test (2026 Pattern) - PUBLIC ROUTE
router.get('/jee-main-demo', async (req, res) => {
  try {
    // Check if demo test already exists
    let demoTest = await Test.findOne({ 
      testType: 'demo',
      pattern: 'jee_main'
    }).populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    if (demoTest) {
      return res.json({ test: demoTest });
    }

    // Create new demo test with JEE Main 2026 pattern (75 questions total)
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const jeeMainStructure = {};
    const usedQuestionIds = []; // Track used questions to prevent duplicates

    for (const subject of subjects) {
      // Get 20 MCQ questions for Section A
      const sectionAQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'single',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 20 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionAQuestions.forEach(q => usedQuestionIds.push(q._id));

      // Get 5 Numerical questions for Section B
      const sectionBQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'numerical',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 5 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionBQuestions.forEach(q => usedQuestionIds.push(q._id));

      if (sectionAQuestions.length < 20 || sectionBQuestions.length < 5) {
        return res.status(400).json({ 
          message: `Not enough questions available for ${subject}. Need 20 MCQ and 5 Numerical questions.`,
          available: {
            sectionA: sectionAQuestions.length,
            sectionB: sectionBQuestions.length
          }
        });
      }

      jeeMainStructure[subject] = {
        sectionA: sectionAQuestions.map(q => q._id),
        sectionB: sectionBQuestions.map(q => q._id)
      };
    }

    // Create the demo test
    demoTest = new Test({
      title: 'JEE Main 2026 Demo Test',
      examType: 'JEE',
      testType: 'demo',
      pattern: 'jee_main',
      duration: 180, // 3 hours
      totalMarks: 300,
      isDemo: true,
      jeeMainStructure,
      instructions: [
        {
          title: 'General Instructions',
          points: [
            'Total duration of JEE-Main is 180 minutes (3 hours)',
            'The test consists of 75 questions in total',
            'Each subject (Physics, Chemistry, Mathematics) has 25 questions',
            'All questions carry 4 marks each',
            'There is NO negative marking for Numerical Type questions'
          ]
        },
        {
          title: 'Section A - MCQs (20 questions per subject)',
          points: [
            '20 Multiple Choice Questions (One Correct Out of Four)',
            'Each correct answer: +4 marks',
            'Each incorrect answer: -1 mark (Negative marking)',
            'Unanswered: 0 marks'
          ]
        },
        {
          title: 'Section B - Numerical (5 questions per subject)',
          points: [
            '5 Numerical Answer Type questions',
            'Answer should be a numerical value',
            'Each correct answer: +4 marks',
            'NO negative marking for incorrect answers',
            'Unanswered: 0 marks'
          ]
        }
      ]
    });

    await demoTest.save();
    await demoTest.populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    res.json({ test: demoTest });
  } catch (error) {
    console.error('Error creating JEE Main demo test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User's Tests
router.get('/my-tests', auth, async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user.userId })
      .select('title examType subject chapter duration totalMarks createdAt')
      .sort({ createdAt: -1 });

    res.json({ tests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Subjects and Chapters for Test Generation
router.get('/structure/:examType', auth, async (req, res) => {
  try {
    const { examType } = req.params;

    const subjects = await Question.distinct('subject', { examType });
    
    const structure = {};
    for (const subject of subjects) {
      const chapters = await Question.distinct('chapter', { examType, subject });
      structure[subject] = chapters;
    }

    res.json({ examType, structure });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Scheduled Tests for Student
router.get('/scheduled/upcoming', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const today = new Date();

    // Get user's active exam types
    const activeExamTypes = user.subscriptions
      .filter(sub => sub.isActive && new Date(sub.expiryDate) > today)
      .map(sub => sub.examType);

    if (activeExamTypes.length === 0) {
      return res.json({ scheduledTests: [], message: 'No active subscription' });
    }

    // Get scheduled tests for user's subscriptions
    const scheduledTests = await ScheduledTest.find({
      examType: { $in: activeExamTypes },
      isActive: true,
      'scheduledDates.date': { $gte: today }
    })
      .populate('testId', 'title examType subject duration totalMarks')
      .sort({ 'scheduledDates.date': 1 })
      .limit(10);

    // Filter and format to show only upcoming dates
    const upcomingTests = scheduledTests.map(st => {
      const upcomingDates = st.scheduledDates
        .filter(sd => new Date(sd.date) >= today && !sd.isCompleted)
        .slice(0, 3); // Show next 3 dates for each test
      
      return {
        _id: st._id,
        test: st.testId,
        scheduleType: st.scheduleType,
        upcomingDates
      };
    }).filter(st => st.upcomingDates.length > 0);

    res.json({ scheduledTests: upcomingTests, total: upcomingTests.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Test Details by ID - MUST be after all specific routes
router.get('/:testId', async (req, res) => {
  try {
    // Check if user is authenticated
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Invalid token - treat as unauthenticated
        userId = null;
      }
    }

    const test = await Test.findById(req.params.testId)
      .populate('questions.questionId')
      .populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // If test has a createdBy field and user is not authenticated or not the owner, check if it's a demo test
    if (test.createdBy && userId && test.createdBy.toString() !== userId.toString() && test.testType !== 'demo') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ test });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Regenerate JEE Main Demo Test
router.post('/admin/regenerate-demo', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Delete existing demo test
    await Test.deleteOne({ 
      testType: 'demo',
      pattern: 'jee_main'
    });

    // Create new demo test with fresh questions
    const jeeMainStructure = {
      Physics: { sectionA: [], sectionB: [] },
      Chemistry: { sectionA: [], sectionB: [] },
      Mathematics: { sectionA: [], sectionB: [] }
    };

    const usedQuestionIds = []; // Track used questions to prevent duplicates

    for (const subject of ['Physics', 'Chemistry', 'Mathematics']) {
      // Section A: 20 MCQ questions
      const sectionAQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'single',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 20 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionAQuestions.forEach(q => usedQuestionIds.push(q._id));

      // Section B: 5 Numerical questions
      const sectionBQuestions = await Question.aggregate([
        { 
          $match: { 
            examType: 'JEE',
            subject: subject,
            questionType: 'numerical',
            _id: { $nin: usedQuestionIds } // Exclude already used questions
          } 
        },
        { $sample: { size: 5 } }
      ]);

      // Add selected questions to usedQuestionIds
      sectionBQuestions.forEach(q => usedQuestionIds.push(q._id));

      jeeMainStructure[subject].sectionA = sectionAQuestions.map(q => q._id);
      jeeMainStructure[subject].sectionB = sectionBQuestions.map(q => q._id);
    }

    const newDemoTest = new Test({
      title: 'JEE Main 2026 Demo Test',
      examType: 'JEE',
      pattern: 'jee_main',
      testType: 'demo',
      jeeMainStructure,
      duration: 180,
      totalMarks: 300,
      instructions: [
        {
          title: 'General Instructions',
          points: [
            'This is a demo test following the Official JEE Main 2026 pattern',
            'Total Duration: 3 Hours (180 minutes)',
            'Total Marks: 300',
            'The test consists of 3 subjects: Physics, Chemistry, and Mathematics',
            'Each subject has 25 questions (20 MCQ + 5 Numerical)'
          ]
        },
        {
          title: 'Section A - Multiple Choice Questions (MCQ)',
          points: [
            'Contains 20 questions per subject',
            'Each question has 4 options with only ONE correct answer',
            'Each correct answer: +4 marks',
            'Each incorrect answer: -1 mark (Negative marking)',
            'Unanswered: 0 marks'
          ]
        },
        {
          title: 'Section B - Numerical Value Questions',
          points: [
            'Contains 5 questions per subject',
            'Answer must be entered as a numerical value',
            'Each correct answer: +4 marks',
            'NO negative marking for incorrect answers',
            'Unanswered: 0 marks'
          ]
        }
      ]
    });

    await newDemoTest.save();
    await newDemoTest.populate('jeeMainStructure.Physics.sectionA jeeMainStructure.Physics.sectionB jeeMainStructure.Chemistry.sectionA jeeMainStructure.Chemistry.sectionB jeeMainStructure.Mathematics.sectionA jeeMainStructure.Mathematics.sectionB');

    res.json({ 
      message: 'Demo test regenerated successfully',
      test: newDemoTest,
      totalQuestions: 75
    });
  } catch (error) {
    console.error('Error regenerating demo test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
