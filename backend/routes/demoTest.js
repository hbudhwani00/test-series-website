const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const DemoTest = require('../models/DemoTest');
const Question = require('../models/Question');

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
      correctAnswer, explanation, difficulty, marks, negativeMarks 
    } = req.body;

    // Create new question
    const newQuestion = new Question({
      examType,
      subject,
      chapter,
      topic,
      source,
      questionType,
      section,
      questionNumber: questionNumber || 0,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty,
      marks,
      negativeMarks,
      hasNegativeMarking: section === 'A', // Section A has negative marking
      uploadedBy: req.user.userId
    });

    await newQuestion.save();

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
      correctAnswer, explanation, difficulty, marks, negativeMarks 
    } = req.body;

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      {
        examType,
        subject,
        chapter,
        topic,
        source,
        questionType,
        section,
        questionNumber: questionNumber || 0,
        question,
        options,
        correctAnswer,
        explanation,
        difficulty,
        marks,
        negativeMarks,
        hasNegativeMarking: section === 'A'
      },
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
