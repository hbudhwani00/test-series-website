const express = require('express');
const router = express.Router();
const DemoTest = require('../models/DemoTest');
const Question = require('../models/Question');
const Result = require('../models/Result');
const DemoLead = require('../models/DemoLead');

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

// Submit Demo Test (No Auth Required, but will save userId if available)
router.post('/submit', async (req, res) => {
  try {
    const { testId, answers, timeTaken, userName, userEmail } = req.body;

    console.log('=== Demo Test Submit ===');
    console.log('Test ID:', testId);
    console.log('Received answers:', JSON.stringify(answers, null, 2));
    try {
      console.log('Received answer keys:', Object.keys(answers || {}));
    } catch (e) {
      // ignore
    }

    // Check if user is authenticated (optional for demo tests)
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
        console.log('Authenticated user taking demo test:', userId);
      } catch (err) {
        console.log('No valid auth token - treating as anonymous demo test');
      }
    }

    // Get demo test with questions (ensure questions are sorted by questionNumber)
    const demoTest = await DemoTest.findById(testId).populate({
      path: 'questions',
      options: { sort: { questionNumber: 1 } }
    });

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
      // Support answers keyed by questionId OR by numeric index (OMR flows may send index keys)
      const questionIndex = demoTest.questions.indexOf(question);
      let rawUserAnswer = undefined;
      if (answers) {
        if (Object.prototype.hasOwnProperty.call(answers, questionId)) rawUserAnswer = answers[questionId];
        else if (Object.prototype.hasOwnProperty.call(answers, questionIndex)) rawUserAnswer = answers[questionIndex];
        else if (Object.prototype.hasOwnProperty.call(answers, String(questionIndex))) rawUserAnswer = answers[String(questionIndex)];
      }

      // Normalize incoming answer: accept letters (A-D) or numeric strings
      let normalizedUserAnswer = rawUserAnswer;
      if (typeof normalizedUserAnswer === 'string' && normalizedUserAnswer.length === 1 && /^[A-Za-z]$/.test(normalizedUserAnswer)) {
        normalizedUserAnswer = normalizedUserAnswer.toUpperCase().charCodeAt(0) - 65;
      } else if (typeof normalizedUserAnswer === 'string' && normalizedUserAnswer.trim() !== '') {
        const maybeNum = Number(normalizedUserAnswer);
        if (!Number.isNaN(maybeNum)) normalizedUserAnswer = maybeNum;
      }

      console.log(`\n--- Question ${questionId} ---`);
      console.log('Raw User Answer:', rawUserAnswer, 'Normalized User Answer:', normalizedUserAnswer, 'Type:', typeof normalizedUserAnswer);
      console.log('Correct Answer:', question.correctAnswer, 'Type:', typeof question.correctAnswer);

      // Check if question was attempted (treat empty/null/undefined as unattempted)
      const isAttempted = !(normalizedUserAnswer === null || normalizedUserAnswer === undefined || normalizedUserAnswer === '');

      if (!isAttempted) {
        console.log('Status: UNATTEMPTED');
        unattempted++;
        evaluatedAnswers.push({
          questionId: question._id,
          questionNumber: question.questionNumber || null,
          questionText: question.question || '',
          options: question.options || [],
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: 0,
          chapter: question.chapter,
          topic: question.topic,
          subject: question.subject,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          // Snapshot image fields so result view can show images later
          questionImage: question.questionImage || null,
          optionImages: question.optionImages || [],
          explanationImage: question.explanationImage || null
        });
        continue;
      }

  // Evaluate the answer
  let isCorrect = false;
  const userAnsNum = typeof normalizedUserAnswer === 'string' ? parseInt(normalizedUserAnswer) : Number(normalizedUserAnswer);
  const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer) : Number(question.correctAnswer);

  isCorrect = userAnsNum === normalizedCorrectAnswer;

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
        questionNumber: question.questionNumber || null,
        questionText: question.question || '',
        options: question.options || [],
        userAnswer: userAnsNum,
        isCorrect,
        marksAwarded,
        timeTaken: 0,
        chapter: question.chapter,
        topic: question.topic,
        subject: question.subject,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation,
        // Snapshot image fields so result view can show images later
        questionImage: question.questionImage || null,
        optionImages: question.optionImages || [],
        explanationImage: question.explanationImage || null
      });
    }

    console.log('\n=== Final Summary ===');
    console.log('Correct:', correctAnswers);
    console.log('Incorrect:', incorrectAnswers);
    console.log('Unattempted:', unattempted);
    console.log('Total Score:', score);

    // Allow negative scores (removed Math.max(0, score))
    const percentage = (score / demoTest.totalMarks) * 100;

    // Create result (save userId if user is authenticated, otherwise save demo user info)
    const resultData = {
      testId: testId,
      answers: evaluatedAnswers,
      score,
      totalMarks: demoTest.totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
      isDemo: true
    };

    // Add userId if user is authenticated
    if (userId) {
      resultData.userId = userId;
      console.log('Saving demo result for authenticated user:', userId);
    } else {
      // Save demo user info for anonymous users
      resultData.demoUserName = userName || 'Demo User';
      resultData.demoUserEmail = userEmail || '';
      console.log('Saving demo result for anonymous user');
    }

    const result = new Result(resultData);

    await result.save();
    console.log('Demo result saved with ID:', result._id);

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

// Save Demo Lead (Post-Test Lead Capture)
router.post('/save-lead', async (req, res) => {
  try {
    const { name, phone, email, resultId } = req.body;

    console.log('=== Saving Demo Lead ===');
    console.log('Name:', name);
    console.log('Phone:', phone);
    console.log('Email:', email);
    console.log('Result ID:', resultId);

    // Validation
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Validate Indian phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.' });
    }

    // Check if lead already exists with this phone number
    let existingLead = await DemoLead.findOne({ phone });
    
    if (existingLead) {
      // Update existing lead
      existingLead.name = name;
      if (email) existingLead.email = email;
      if (resultId) {
        existingLead.resultId = resultId;
        
        // Fetch result to get score
        const result = await Result.findById(resultId);
        if (result) {
          existingLead.testScore = result.score;
          existingLead.testPercentage = result.percentage;
        }
      }
      await existingLead.save();
      
      console.log('Updated existing lead:', existingLead._id);
      return res.json({ 
        success: true, 
        message: 'Welcome back! Your information has been updated.',
        lead: existingLead 
      });
    }

    // Create new lead
    const leadData = {
      name,
      phone,
      email: email || undefined,
      resultId: resultId || undefined
    };

    // If resultId provided, fetch score/percentage
    if (resultId) {
      const result = await Result.findById(resultId);
      if (result) {
        leadData.testScore = result.score;
        leadData.testPercentage = result.percentage;
      }
    }

    const newLead = new DemoLead(leadData);
    await newLead.save();

    console.log('New lead created:', newLead._id);

    res.json({ 
      success: true, 
      message: 'Thank you! Your information has been saved.',
      lead: newLead 
    });

  } catch (error) {
    console.error('Error saving demo lead:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Failed to save information. Please try again.' });
  }
});

module.exports = router;
