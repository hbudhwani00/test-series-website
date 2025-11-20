const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const NEETDemoTest = require('../models/NEETDemoTest');
const Question = require('../models/Question');

// Helper: make image URL absolute if it's a relative path
const makeAbsolute = (req, url) => {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${req.protocol}://${req.get('host')}${url}`;
};

// Initialize default NEET Demo Test (runs once)
router.post('/initialize', async (req, res) => {
  try {
    // Check if NEET test already exists
    const existingTest = await NEETDemoTest.findOne({ isActive: true });
    
    if (existingTest) {
      return res.status(200).json({
        message: 'NEET demo test already initialized',
        neetTest: existingTest
      });
    }

    // Create default NEET demo test
    const neetTest = new NEETDemoTest({
      title: 'NEET Demo Test',
      description: 'Experience the NEET exam with our sample test. 180 questions covering Physics, Chemistry, and Biology.',
      duration: 12000, // 200 minutes in seconds
      totalMarks: 720, // 180 questions * 4 marks
      questions: [],
      isActive: true
    });

    await neetTest.save();

    res.status(201).json({
      message: 'NEET demo test initialized successfully',
      neetTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify/Get NEET Demo Test Status
router.get('/status', async (req, res) => {
  try {
    const neetTest = await NEETDemoTest.findOne({ isActive: true }).select('_id title totalMarks questions');
    
    if (!neetTest) {
      return res.status(404).json({
        message: 'No active NEET demo test found',
        exists: false
      });
    }

    res.json({
      message: 'NEET demo test found',
      exists: true,
      testId: neetTest._id,
      title: neetTest.title,
      totalMarks: neetTest.totalMarks,
      questionCount: neetTest.questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create NEET Demo Test
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { title, description, duration, totalMarks } = req.body;

    const neetTest = new NEETDemoTest({
      title,
      description,
      duration: duration || 12000, // 200 minutes default
      totalMarks: totalMarks || 720, // 180 questions * 4 marks
      questions: [],
      createdBy: req.user.userId
    });

    await neetTest.save();

    res.status(201).json({
      message: 'NEET demo test created successfully',
      neetTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active NEET Demo Test (Student - no auth required)
router.get('/', async (req, res) => {
  try {
    const neetTest = await NEETDemoTest.findOne({ isActive: true })
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } }
      })
      .populate('createdBy', 'name');

    if (!neetTest) {
      return res.status(404).json({ message: 'No active NEET demo test found' });
    }

    res.json({ neetTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific NEET Demo Test by ID (Student - no auth required)
router.get('/test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const neetTest = await NEETDemoTest.findById(testId)
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } }
      })
      .populate('createdBy', 'name');

    if (!neetTest) {
      return res.status(404).json({ message: 'NEET demo test not found' });
    }

    res.json({ neetTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all NEET Demo Tests (Admin only)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const neetTests = await NEETDemoTest.find()
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } }
      })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ neetTests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active NEET Demo Test for Admin
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const neetTest = await NEETDemoTest.findOne({ isActive: true })
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } }
      })
      .populate('createdBy', 'name');

    if (!neetTest) {
      return res.status(404).json({ message: 'No active NEET demo test found' });
    }

    res.json({ neetTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Question to NEET Demo Test
router.post('/add-question', adminAuth, async (req, res) => {
  try {
    const { 
      testId, subject, chapter, topic, section,
      questionNumber, question, options, 
      correctAnswer, explanation, difficulty, marks,
      questionImage, optionImages, explanationImage
    } = req.body;

    // Validate NEET-specific fields
    if (!testId) {
      return res.status(400).json({ message: 'testId is required' });
    }

    if (!['Physics', 'Chemistry', 'Biology'].includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject. Must be Physics, Chemistry, or Biology' });
    }

    // Validate question number range based on subject
    const questionRanges = {
      'Physics': { min: 1, max: 45 },
      'Chemistry': { min: 46, max: 90 },
      'Biology': { min: 91, max: 180 }
    };

    const range = questionRanges[subject];
    if (questionNumber < range.min || questionNumber > range.max) {
      return res.status(400).json({ 
        message: `Invalid question number for ${subject}. Must be between ${range.min} and ${range.max}` 
      });
    }

    // Create new question
    const payload = {
      ...req.body,
      examType: 'NEET',
      questionNumber: questionNumber || 0,
      questionImage: typeof questionImage !== 'undefined' ? makeAbsolute(req, questionImage) : null,
      optionImages: typeof optionImages !== 'undefined' ? (Array.isArray(optionImages) ? optionImages.map(img => makeAbsolute(req, img)) : []) : [],
      explanationImage: typeof explanationImage !== 'undefined' ? makeAbsolute(req, explanationImage) : null,
      hasNegativeMarking: true, // NEET always has negative marking
      uploadedBy: req.user.userId
    };

    const newQuestion = new Question(payload);
    await newQuestion.save();

    // Add to NEET demo test
    const neetTest = await NEETDemoTest.findById(testId);
    if (!neetTest) {
      return res.status(404).json({ message: 'NEET demo test not found' });
    }

    neetTest.questions.push(newQuestion._id);
    await neetTest.save();

    res.status(201).json({
      message: 'Question added to NEET demo test successfully',
      question: newQuestion,
      totalQuestions: neetTest.questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove Question from NEET Demo Test
router.delete('/remove-question/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;

    const neetTest = await NEETDemoTest.findOne({ questions: questionId });
    if (!neetTest) {
      return res.status(404).json({ message: 'NEET demo test not found' });
    }

    neetTest.questions = neetTest.questions.filter(q => q.toString() !== questionId);
    await neetTest.save();

    res.json({
      message: 'Question removed from NEET demo test',
      totalQuestions: neetTest.questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Question in NEET Demo Test
router.put('/update-question/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { 
      subject, chapter, topic, section,
      questionNumber, question, options, 
      correctAnswer, explanation, difficulty, marks,
      questionImage, optionImages, explanationImage
    } = req.body;

    // If subject is being updated, validate question number range
    if (subject && questionNumber) {
      const questionRanges = {
        'Physics': { min: 1, max: 45 },
        'Chemistry': { min: 46, max: 90 },
        'Biology': { min: 91, max: 180 }
      };

      const range = questionRanges[subject];
      if (questionNumber < range.min || questionNumber > range.max) {
        return res.status(400).json({ 
          message: `Invalid question number for ${subject}. Must be between ${range.min} and ${range.max}` 
        });
      }
    }

    // Prepare update payload
    const updatePayload = {
      ...req.body,
      questionImage: typeof questionImage !== 'undefined' ? makeAbsolute(req, questionImage) : undefined,
      optionImages: typeof optionImages !== 'undefined' ? (Array.isArray(optionImages) ? optionImages.map(img => makeAbsolute(req, img)) : optionImages) : undefined,
      explanationImage: typeof explanationImage !== 'undefined' ? makeAbsolute(req, explanationImage) : undefined,
      hasNegativeMarking: true
    };

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      updatePayload,
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update NEET Demo Test Details
router.put('/update/:testId', adminAuth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { title, description, duration, totalMarks } = req.body;

    const neetTest = await NEETDemoTest.findById(testId);
    if (!neetTest) {
      return res.status(404).json({ message: 'NEET demo test not found' });
    }

    if (title) neetTest.title = title;
    if (description) neetTest.description = description;
    if (duration) neetTest.duration = duration;
    if (totalMarks) neetTest.totalMarks = totalMarks;

    await neetTest.save();

    res.json({
      message: 'NEET demo test updated successfully',
      neetTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
