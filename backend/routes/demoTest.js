const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const DemoTest = require('../models/DemoTest');
const Question = require('../models/Question');

// Helper: make image URL absolute if it's a relative path
const makeAbsolute = (req, url) => {
  if (!url) return url;
  if (typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // prefix with current host
  return `${req.protocol}://${req.get('host')}${url}`;
};

// Create Demo Test
router.post('/create', adminAuth, async (req, res) => {
  try {
    const { title, description, examType, duration, totalMarks } = req.body;

    const demoTest = new DemoTest({
      title,
      description,
      examType,
      duration,
      totalMarks,
      questions: [],
      createdBy: req.user.userId
    });

    await demoTest.save();

    res.status(201).json({
      message: 'Demo test created successfully',
      demoTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Demo Test
router.get('/', async (req, res) => {
  try {
    const demoTest = await DemoTest.findOne({ isActive: true })
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } } // Sort by question number
      })
      .populate('createdBy', 'name');

    if (!demoTest) {
      return res.status(404).json({ message: 'No active demo test found' });
    }

    res.json({ demoTest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add Question to Demo Test
router.post('/add-question', adminAuth, async (req, res) => {
  try {
    const { 
      examType, subject, chapter, topic, source,
      questionType, section, questionNumber, question, options, 
      correctAnswer, explanation, difficulty, marks, negativeMarks,
      questionImage, optionImages, explanationImage
    } = req.body;

    // DEBUG: log incoming payload to verify image fields arrive
    console.log('[debug] POST /admin/demo-test/add-question body:', {
      questionImage: req.body.questionImage,
      optionImages: req.body.optionImages,
      explanationImage: req.body.explanationImage
    });

    // Create new question - use payload spread to ensure all provided fields are saved
    const payload = {
      ...req.body,
      questionNumber: questionNumber || 0,
      // Normalize image URLs to absolute
      questionImage: typeof questionImage !== 'undefined' ? makeAbsolute(req, questionImage) : null,
      optionImages: typeof optionImages !== 'undefined' ? (Array.isArray(optionImages) ? optionImages.map(img => makeAbsolute(req, img)) : []) : [],
      explanationImage: typeof explanationImage !== 'undefined' ? makeAbsolute(req, explanationImage) : null,
      hasNegativeMarking: section === 'A', // Section A has negative marking
      uploadedBy: req.user.userId
    };

    const newQuestion = new Question(payload);
    await newQuestion.save();

    // DEBUG: verify saved document
    const savedQuestion = await Question.findById(newQuestion._id).lean();
    console.log('[debug] Saved question:', {
      _id: savedQuestion._id,
      questionImage: savedQuestion.questionImage,
      optionImages: savedQuestion.optionImages,
      explanationImage: savedQuestion.explanationImage
    });

    // Add to demo test
    const demoTest = await DemoTest.findOne({ isActive: true });
    if (!demoTest) {
      return res.status(404).json({ message: 'No active demo test found' });
    }

    demoTest.questions.push(newQuestion._id);
    await demoTest.save();

    res.status(201).json({
      message: 'Question added to demo test successfully',
      question: newQuestion,
      totalQuestions: demoTest.questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove Question from Demo Test
router.delete('/remove-question/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;

    const demoTest = await DemoTest.findOne({ isActive: true });
    if (!demoTest) {
      return res.status(404).json({ message: 'No active demo test found' });
    }

    demoTest.questions = demoTest.questions.filter(q => q.toString() !== questionId);
    await demoTest.save();

    res.json({
      message: 'Question removed from demo test',
      totalQuestions: demoTest.questions.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Question
router.put('/update-question/:questionId', adminAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { 
      examType, subject, chapter, topic, source,
      questionType, section, questionNumber, question, options, 
      correctAnswer, explanation, difficulty, marks, negativeMarks,
      questionImage, optionImages, explanationImage
    } = req.body;

    // DEBUG: log incoming update payload to verify image fields arrive
    console.log('[debug] PUT /admin/demo-test/update-question body:', {
      questionId,
      questionImage: req.body.questionImage,
      optionImages: req.body.optionImages,
      explanationImage: req.body.explanationImage
    });

    // Prepare update payload to include any image fields from req.body
    const updatePayload = {
      ...req.body,
      questionNumber: questionNumber || 0,
      questionImage: typeof questionImage !== 'undefined' ? makeAbsolute(req, questionImage) : undefined,
      optionImages: typeof optionImages !== 'undefined' ? (Array.isArray(optionImages) ? optionImages.map(img => makeAbsolute(req, img)) : optionImages) : undefined,
      explanationImage: typeof explanationImage !== 'undefined' ? makeAbsolute(req, explanationImage) : undefined,
      hasNegativeMarking: section === 'A'
    };

// Debug helper route: return last saved question (admin only)
router.get('/last-question', adminAuth, async (req, res) => {
  try {
    const q = await Question.findOne().sort({ createdAt: -1 }).lean();
    if (!q) return res.status(404).json({ message: 'No question found' });
    return res.json({ question: q });
  } catch (err) {
    console.error('Error fetching last question:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// Update Demo Test Details
router.put('/update', adminAuth, async (req, res) => {
  try {
    const { title, description, duration, totalMarks } = req.body;

    const demoTest = await DemoTest.findOne({ isActive: true });
    if (!demoTest) {
      return res.status(404).json({ message: 'No active demo test found' });
    }

    if (title) demoTest.title = title;
    if (description) demoTest.description = description;
    if (duration) demoTest.duration = duration;
    if (totalMarks) demoTest.totalMarks = totalMarks;

    await demoTest.save();

    res.json({
      message: 'Demo test updated successfully',
      demoTest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
