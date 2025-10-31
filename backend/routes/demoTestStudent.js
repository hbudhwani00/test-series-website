const express = require('express');
const router = express.Router();
const DemoTest = require('../models/DemoTest');
const Question = require('../models/Question');
const Result = require('../models/Result');

// Get Demo Test (Public - No Auth Required)
router.get('/test', async (req, res) => {
  try {
    const demoTest = await DemoTest.findOne({ isActive: true })
      .populate({
        path: 'questions',
        options: { sort: { questionNumber: 1 } } // Sort by question number
      });

    if (!demoTest) {
      return res.status(404).json({ message: 'No demo test available' });
    }

    res.json({ 
      test: {
        _id: demoTest._id,
        title: demoTest.title,
        description: demoTest.description,
        examType: demoTest.examType,
        duration: demoTest.duration,
        totalMarks: demoTest.totalMarks,
        totalQuestions: demoTest.questions.length,
        questions: demoTest.questions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit Demo Test (No Auth Required)
router.post('/submit', async (req, res) => {
  try {
    const { testId, answers, timeTaken, userName, userEmail } = req.body;

    console.log('=== Demo Test Submit ===');
    console.log('Test ID:', testId);
    console.log('Received answers:', JSON.stringify(answers, null, 2));

    // Get demo test with questions
    const demoTest = await DemoTest.findById(testId).populate('questions');

    if (!demoTest) {
      return res.status(404).json({ message: 'Demo test not found' });
    }

    console.log('Total questions in demo test:', demoTest.questions.length);
    console.log('Question IDs in demo test:', demoTest.questions.map(q => q._id.toString()));

    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;

    const evaluatedAnswers = [];

    // Process each question
    for (const question of demoTest.questions) {
      if (!question || !question._id) {
        console.log('Skipping invalid question');
        continue;
      }

      const questionId = question._id.toString();
      const userAnswer = answers[questionId];

      console.log(`\n--- Question ${questionId} ---`);
      console.log('User Answer:', userAnswer, 'Type:', typeof userAnswer);
      console.log('Correct Answer:', question.correctAnswer, 'Type:', typeof question.correctAnswer);

      // Check if question was attempted
      const isAttempted = userAnswer !== null && 
                          userAnswer !== undefined && 
                          userAnswer !== '' &&
                          !Number.isNaN(userAnswer);

      if (!isAttempted) {
        console.log('Status: UNATTEMPTED');
        unattempted++;
        evaluatedAnswers.push({
          questionId: question._id,
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: 0,
          chapter: question.chapter,
          topic: question.topic,
          subject: question.subject,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
        continue;
      }

      // Evaluate the answer
      let isCorrect = false;
      const normalizedUserAnswer = typeof userAnswer === 'string' ? parseInt(userAnswer) : Number(userAnswer);
      const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer) : Number(question.correctAnswer);

      isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

      console.log('Normalized User Answer:', normalizedUserAnswer);
      console.log('Normalized Correct Answer:', normalizedCorrectAnswer);
      console.log('Is Correct:', isCorrect);

      // Calculate marks
      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks || 4;
        correctAnswers++;
        console.log('Status: CORRECT +', marksAwarded);
      } else {
        marksAwarded = question.hasNegativeMarking ? -1 : 0;
        incorrectAnswers++;
        console.log('Status: INCORRECT', marksAwarded);
      }

      score += marksAwarded;

      evaluatedAnswers.push({
        questionId: question._id,
        userAnswer: normalizedUserAnswer,
        isCorrect,
        marksAwarded,
        timeTaken: 0,
        chapter: question.chapter,
        topic: question.topic,
        subject: question.subject,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation
      });
    }

    console.log('\n=== Final Summary ===');
    console.log('Correct:', correctAnswers);
    console.log('Incorrect:', incorrectAnswers);
    console.log('Unattempted:', unattempted);
    console.log('Total Score:', score);

    // Allow negative scores (removed Math.max(0, score))
    const percentage = (score / demoTest.totalMarks) * 100;

    // Create result (without user authentication)
    const result = new Result({
      testId: testId,
      answers: evaluatedAnswers,
      score,
      totalMarks: demoTest.totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
      isDemo: true,
      demoUserName: userName || 'Demo User',
      demoUserEmail: userEmail || ''
    });

    await result.save();

    res.json({
      message: 'Demo test submitted successfully',
      result: {
        id: result._id,
        score,
        totalMarks: demoTest.totalMarks,
        percentage: percentage.toFixed(2),
        correctAnswers,
        incorrectAnswers,
        unattempted
      }
    });
  } catch (error) {
    console.error('Error in demo test submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
