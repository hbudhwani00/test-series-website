const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Result = require('../models/Result');
const Test = require('../models/Test');
const Question = require('../models/Question');
const DemoTest = require('../models/DemoTest');
const NEETDemoTest = require('../models/NEETDemoTest');
const ScheduledTest = require('../models/ScheduledTest');

// Ensure all models are registered for refPath to work properly
// This is necessary for polymorphic populate to function correctly

// Submit Demo Test (NEET/JEE) - No auth required but save userId if available
router.post('/submit-demo', async (req, res) => {
  try {
    const { testId, testType, answers, timeSpent, markedForReview, userId, questionTimeTracking } = req.body;
    
    console.log('=== DEMO TEST SUBMISSION ===');
    console.log('testType:', testType);
    console.log('userId received:', userId);
    console.log('userId type:', typeof userId);
    console.log('userId truthiness:', !!userId);

    let test;
    let allQuestions = [];

    // Fetch the appropriate test type
    if (testType === 'neet_demo') {
      test = await NEETDemoTest.findById(testId).populate('questions');
      if (!test) {
        return res.status(404).json({ message: 'NEET demo test not found' });
      }
      allQuestions = test.questions;
      console.log('=== NEET Demo Test Submission Debug ===');
      console.log('Received answers object:', answers);
      console.log('All questions:', allQuestions.length);
    } else if (testType === 'jee_demo') {
      test = await DemoTest.findById(testId).populate('questions');
      if (!test) {
        return res.status(404).json({ message: 'JEE demo test not found' });
      }
      allQuestions = test.questions;
    } else {
      return res.status(400).json({ message: 'Invalid test type' });
    }

    // Helper to read answer supporting both questionId-keyed and index-keyed shapes
    const getUserAnswer = (answersObj, qId, idx) => {
      if (!answersObj) return undefined;
      // Direct match by question id
      if (Object.prototype.hasOwnProperty.call(answersObj, qId)) return answersObj[qId];
      // Fallback to numeric index (number or string key)
      if (Object.prototype.hasOwnProperty.call(answersObj, idx)) return answersObj[idx];
      const idxStr = String(idx);
      if (Object.prototype.hasOwnProperty.call(answersObj, idxStr)) return answersObj[idxStr];
      return undefined;
    };

    // Evaluate answers
    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;

    const evaluatedAnswers = [];

    // Convert answers object to map (answers is { questionId: numericAnswer })
    allQuestions.forEach((question, index) => {
      const questionId = question._id.toString();
      const userAnswer = getUserAnswer(answers, questionId, index);
      if (index < 5 || userAnswer !== undefined) {
        console.log(`Q${index + 1}: questionId="${questionId}", userAnswer="${userAnswer}", type=${typeof userAnswer}, correctAnswer="${question.correctAnswer}"`);
      }
      
      // Get time tracking data for this question.
      // Support two shapes sent from client:
      // 1) array/object indexed by question position: questionTimeTracking[index]
      // 2) object keyed by questionId: questionTimeTracking[questionId]
      let questionTimeBreakdown = null;
      let timeData = null;
      if (questionTimeTracking) {
        // Prefer index-based entry if present
        if (questionTimeTracking[index] !== undefined && questionTimeTracking[index] !== null) {
          timeData = questionTimeTracking[index];
        } else {
          // Fallback to questionId keyed object (most clients use questionId -> data)
          const qIdStr = question && question._id ? question._id.toString() : String(question && question._id);
          timeData = questionTimeTracking[qIdStr] || questionTimeTracking[question && question._id] || null;
        }
      }

      if (timeData && timeData.visited) {
        const firstVisit = Number(timeData.firstVisit) || 0;
        const revisits = Array.isArray(timeData.revisits) ? timeData.revisits.map(t => Number(t) || 0) : [];
        const totalTime = firstVisit + revisits.reduce((sum, t) => sum + t, 0);
        questionTimeBreakdown = {
          firstVisit,
          revisits,
          totalTime
        };
      }
      // Treat only null / undefined / empty-string as unattempted.
      // Do NOT use a truthy check because numeric answers like 0 are falsy but valid.
      if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
        unattempted++;
        evaluatedAnswers.push({
          questionId: question._id,
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: questionTimeBreakdown ? questionTimeBreakdown.totalTime : 0,
          timeBreakdown: questionTimeBreakdown,
          // Snapshot key fields for result display (ensure all data is saved)
          subject: question.subject || 'General',
          chapter: question.chapter || 'General',
          topic: question.topic || 'General',
          questionNumber: question.questionNumber || (index + 1),
          questionText: question.question,
          questionImage: question.questionImage,
          questionType: question.questionType || 'single',
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          explanationImage: question.explanationImage,
          options: question.options || [],
          optionImages: question.optionImages || []
        });
        return;
      }

      // Check if answer is correct
      let isCorrect = false;
      
      if (question.questionType === 'single' || !question.questionType) {
        // Both userAnswer and correctAnswer are now numeric (0, 1, 2, 3)
        const userAnswerNum = typeof userAnswer === 'string' ? parseInt(userAnswer) : userAnswer;
        const correctAnswerNum = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer) : question.correctAnswer;
        isCorrect = userAnswerNum === correctAnswerNum;
      } else if (question.questionType === 'numerical') {
        // For numerical questions, compare the numeric values
        const userAnswerNum = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer;
        const correctAnswerNum = typeof question.correctAnswer === 'string' ? parseFloat(question.correctAnswer) : question.correctAnswer;
        isCorrect = Math.abs(userAnswerNum - correctAnswerNum) < 0.01; // Allow small floating point differences
      }

      // Calculate marks
      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks || 4;
        correctAnswers++;
      } else {
        marksAwarded = question.negativeMarks || -1;
        incorrectAnswers++;
      }

      score += marksAwarded;

      evaluatedAnswers.push({
        questionId: question._id,
        userAnswer: userAnswer,
        isCorrect,
        marksAwarded,
        timeTaken: questionTimeBreakdown ? questionTimeBreakdown.totalTime : 0,
        timeBreakdown: questionTimeBreakdown,
        // Snapshot key fields for result display (ensure all data is saved)
        subject: question.subject || 'General',
        chapter: question.chapter || 'General',
        topic: question.topic || 'General',
        questionNumber: question.questionNumber || (index + 1),
        questionText: question.question,
        questionImage: question.questionImage,
        questionType: question.questionType || 'single',
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        explanationImage: question.explanationImage,
        options: question.options || [],
        optionImages: question.optionImages || []
      });
    });

    const percentage = (score / test.totalMarks) * 100;

    // Create result - include userId if provided (for logged-in users taking demo)
    const resultData = {
      testId: testId,
      testType: testType,
      onModel: testType === 'neet_demo' ? 'NEETDemoTest' : 'DemoTest',
      answers: evaluatedAnswers,
      score,
      totalMarks: test.totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken: timeSpent,
      isDemo: true // Mark as demo result
    };
    
    // Add userId if user is logged in
    console.log('About to save result - userId check:', { userId, truthy: !!userId, type: typeof userId });
    if (userId) {
      resultData.userId = userId;
      console.log(`✅ Demo test submitted by logged-in user: ${userId}`);
    } else {
      console.log('❌ Demo test submitted by non-logged-in user (userId is falsy)');
    }
    
    console.log('resultData before save:', { ...resultData, answers: `[${resultData.answers.length} answers]` });
    
    const result = new Result(resultData);

    await result.save();
    
    console.log(`✅ Result saved - ID: ${result._id}, isDemo: ${result.isDemo}, testType: ${result.testType}, onModel: ${result.onModel}, userId: ${result.userId || 'NONE'}`);

    res.json({
      message: 'Demo test submitted successfully',
      result: {
        id: result._id,
        score,
        totalMarks: test.totalMarks,
        percentage: percentage.toFixed(2),
        correctAnswers,
        incorrectAnswers,
        unattempted
      }
    });
  } catch (error) {
    console.error('Error submitting demo test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit Test and Calculate Result
router.post('/submit', auth, async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;

    // Get test with questions
    const test = await Test.findById(testId)
      .populate('jeeMainStructure.Physics.sectionA')
      .populate('jeeMainStructure.Physics.sectionB')
      .populate('jeeMainStructure.Chemistry.sectionA')
      .populate('jeeMainStructure.Chemistry.sectionB')
      .populate('jeeMainStructure.Mathematics.sectionA')
      .populate('jeeMainStructure.Mathematics.sectionB')
      .populate('questions.questionId');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Collect all questions from the test
    let allQuestions = [];
    if (test.jeeMainStructure) {
      // JEE Main pattern
      ['Physics', 'Chemistry', 'Mathematics'].forEach(subject => {
        if (test.jeeMainStructure[subject]) {
          allQuestions = allQuestions.concat(
            test.jeeMainStructure[subject].sectionA || [],
            test.jeeMainStructure[subject].sectionB || []
          );
        }
      });
    } else if (test.questions && test.questions.length > 0) {
      // Standard pattern
      allQuestions = test.questions.map(q => q.questionId);
    }

    // Convert answers object to map if needed. Store both answer and optional timeTaken
    const answersMap = {};
    if (Array.isArray(answers)) {
      // Array format: [{ questionId, answer, timeTaken }]
      answers.forEach(a => {
        if (a.questionId) {
          answersMap[a.questionId.toString()] = { answer: a.answer, timeTaken: a.timeTaken || 0 };
        }
      });
    } else if (typeof answers === 'object') {
      // Object format: { questionId: answer }
      Object.keys(answers).forEach(qId => {
        answersMap[qId.toString()] = { answer: answers[qId], timeTaken: 0 };
      });
    }

    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;

    const evaluatedAnswers = [];

    // Evaluate each answer
    for (const question of allQuestions) {
      if (!question || !question._id) continue;

    const userEntry = answersMap[question._id.toString()];
  const userAnswer = userEntry ? userEntry.answer : undefined;

      // Treat only null / undefined / empty-string as unattempted. Allow 0 as a valid answer.
      if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
        unattempted++;
        evaluatedAnswers.push({
          questionId: question._id,
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: userEntry ? (userEntry.timeTaken || 0) : 0
        });
        continue;
      }

      let isCorrect = false;

      // Check answer based on question type
      if (question.questionType === 'single') {
        isCorrect = userAnswer === question.correctAnswer || 
                    (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(userAnswer));
      } else if (question.questionType === 'multiple') {
        const correctAns = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
        const userAns = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        isCorrect = correctAns.length === userAns.length && 
                    correctAns.every(ans => userAns.includes(ans));
      } else if (question.questionType === 'numerical') {
        const correctNum = parseFloat(question.correctAnswer);
        const userNum = parseFloat(userAnswer);
        isCorrect = Math.abs(correctNum - userNum) < 0.01; // Allow small tolerance
      }

      // Calculate marks
      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = question.marks || 4;
        correctAnswers++;
      } else {
        marksAwarded = question.negativeMarks || -1;
        incorrectAnswers++;
      }

      score += marksAwarded;

      evaluatedAnswers.push({
        questionId: question._id,
        userAnswer: userAnswer,
        isCorrect,
        marksAwarded,
        timeTaken: userEntry ? (userEntry.timeTaken || 0) : 0
      });
    }

    // Allow negative scores (removed Math.max(0, score))
    const percentage = (score / test.totalMarks) * 100;

    // Create result
    const result = new Result({
      userId: req.user.userId,
      testId: testId,
      answers: evaluatedAnswers,
      score,
      totalMarks: test.totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken
    });

    console.log('=== Saving Result ===');
    console.log('User ID from token:', req.user.userId);
    console.log('Result userId field:', result.userId);
    console.log('Result testId field:', result.testId);

    await result.save();

    console.log('=== Result Saved Successfully ===');
    console.log('Saved result ID:', result._id);
    console.log('Saved result userId:', result.userId);

    res.json({
      message: 'Test submitted successfully',
      result: {
        id: result._id,
        score,
        totalMarks: test.totalMarks,
        percentage: percentage.toFixed(2),
        correctAnswers,
        incorrectAnswers,
        unattempted
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Public Result (for demo tests - no auth required)
router.get('/public/:resultId', async (req, res) => {
  try {
    const { resultId } = req.params;
    
    // Validate resultId
    if (!resultId || resultId === 'undefined' || resultId === 'null') {
      return res.status(400).json({ message: 'Invalid result ID' });
    }
    
    const result = await Result.findById(resultId);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Only allow access to demo test results
    if (!result.isDemo) {
      return res.status(403).json({ message: 'This result requires authentication' });
    }

    // Populate test based on testType (answers already have snapshot data)
    let populatedResult = result.toObject();
    
    if (result.testType === 'neet_demo') {
      const test = await NEETDemoTest.findById(result.testId).populate('questions');
      populatedResult.testId = test;
    } else if (result.testType === 'jee_demo') {
      const test = await DemoTest.findById(result.testId).populate('questions');
      populatedResult.testId = test;
    }

    res.json({ result: populatedResult });
  } catch (error) {
    console.error('Error fetching public result:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Result Details
router.get('/:resultId', auth, async (req, res) => {
  try {
    const { resultId } = req.params;
    
    // Validate resultId
    if (!resultId || resultId === 'undefined' || resultId === 'null') {
      return res.status(400).json({ message: 'Invalid result ID' });
    }
    
    const result = await Result.findById(resultId)
      .populate('testId')
      .populate('answers.questionId');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Check if it's a demo test result (no authentication required)
    if (result.isDemo) {
      return res.json({ result });
    }

    // For regular tests, check if result belongs to user
    if (result.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Results for User (only their own results)
router.get('/user/all', auth, async (req, res) => {
  try {
    console.log('Fetching results for user:', req.user.userId);
    
    // Find results and populate testId using refPath (polymorphic reference)
    const results = await Result.find({ 
      userId: req.user.userId  // Only show this user's results (including their demo results)
    })
      .populate({
        path: 'testId',
        select: 'title examType subject chapter'
        // refPath 'onModel' is automatically used from schema definition
      })
      .sort({ submittedAt: -1 });

    console.log(`Found ${results.length} results for user ${req.user.userId}`);
    
    // Debug logging to check if testId is populated correctly
    if (results.length > 0) {
      console.log('Sample result:', {
        testType: results[0].testType,
        onModel: results[0].onModel,
        isDemo: results[0].isDemo,
        hasTestId: !!results[0].testId,
        testIdValue: results[0].testId
      });
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Result by Test ID
router.get('/test/:testId', auth, async (req, res) => {
  try {
    const result = await Result.findOne({
      userId: req.user.userId,
      testId: req.params.testId
    })
    .populate('testId')
    .populate('answers.questionId');

    if (!result) {
      return res.status(404).json({ message: 'Result not found for this test' });
    }

    res.json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get User Analytics
router.get('/user/analytics', auth, async (req, res) => {
  try {
    const results = await Result.find({ userId: req.user.userId })
      .populate('testId', 'examType subject');

    const totalTests = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalTests || 0;
    const totalCorrect = results.reduce((sum, r) => sum + r.correctAnswers, 0);
    const totalIncorrect = results.reduce((sum, r) => sum + r.incorrectAnswers, 0);

    // Subject-wise performance
    const subjectPerformance = {};
    results.forEach(result => {
      if (result.testId && result.testId.subject) {
        const subject = result.testId.subject;
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = {
            totalTests: 0,
            averageScore: 0,
            scores: []
          };
        }
        subjectPerformance[subject].totalTests++;
        subjectPerformance[subject].scores.push(result.percentage);
      }
    });

    // Calculate average for each subject
    Object.keys(subjectPerformance).forEach(subject => {
      const scores = subjectPerformance[subject].scores;
      subjectPerformance[subject].averageScore = 
        scores.reduce((sum, s) => sum + s, 0) / scores.length;
      delete subjectPerformance[subject].scores;
    });

    res.json({
      totalTests,
      averageScore: averageScore.toFixed(2),
      totalCorrect,
      totalIncorrect,
      subjectPerformance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
