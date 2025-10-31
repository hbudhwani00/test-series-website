const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Upload Question (Admin Only)
router.post('/upload', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const {
      examType,
      subject,
      chapter,
      questionType,
      section,
      question,
      options,
      correctAnswer,
      numericalRange,
      explanation,
      difficulty,
      marks,
      negativeMarks,
      hasNegativeMarking
    } = req.body;

    // Validation
    if (!examType || !subject || !chapter || !questionType || !question) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create question
    const newQuestion = new Question({
      examType,
      subject,
      chapter,
      questionType,
      section: section || 'A',
      question,
      options: (questionType === 'single' || questionType === 'multiple') ? options : undefined,
      correctAnswer,
      numericalRange: questionType === 'numerical' ? numericalRange : undefined,
      explanation,
      difficulty: difficulty || 'medium',
      marks: marks || 4,
      negativeMarks: negativeMarks !== undefined ? negativeMarks : (hasNegativeMarking ? 1 : 0),
      hasNegativeMarking: hasNegativeMarking !== undefined ? hasNegativeMarking : true,
      uploadedBy: req.user.userId
    });

    await newQuestion.save();

    res.status(201).json({
      message: 'Question uploaded successfully',
      question: newQuestion
    });
  } catch (error) {
    console.error('Error uploading question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Questions (Admin Only)
router.get('/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { examType, subject, chapter, questionType, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;
    if (questionType) filter.questionType = questionType;

    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('uploadedBy', 'name email');

    const total = await Question.countDocuments(filter);

    res.json({
      questions,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Question Stats (Admin Only)
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const stats = await Question.aggregate([
      {
        $group: {
          _id: {
            examType: '$examType',
            subject: '$subject',
            questionType: '$questionType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            examType: '$_id.examType',
            subject: '$_id.subject'
          },
          types: {
            $push: {
              type: '$_id.questionType',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $sort: { '_id.examType': 1, '_id.subject': 1 }
      }
    ]);

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Question (Admin Only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Question (Admin Only)
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
