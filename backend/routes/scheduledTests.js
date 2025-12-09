const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const ScheduledTest = require('../models/ScheduledTest');
const Question = require('../models/Question');
const Result = require('../models/Result');

function generateScheduledDates(scheduleType, startDate, endDate) {
  const dates = [];
  const start = new Date(startDate);
  
  if (scheduleType === 'one-time') {
    dates.push(start);
  } else if (scheduleType === 'weekly') {
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (scheduleType === 'alternate-days') {
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 2);
    }
  }
  return dates;
}

// Admin: Create Scheduled Test with Manual Questions
router.post('/create', auth, adminAuth, async (req, res) => {
  try {
    // Extract & allow mutation by using "let"
    let { 
      title, 
      examType, 
      subject,
      chapter,
      duration, 
      totalMarks,
      testType,
      scheduleType,
      startDate,
      endDate,
      questions
    } = req.body;

    // -------------------------------
    // 1. PLACEHOLDER QUESTION HANDLING
    // -------------------------------
    if (
      !Array.isArray(req.body.questions) ||
      req.body.questions.length === 0 ||
      !req.body.questions[0].question
    ) {
      req.body.questions = [
        {
          questionNumber: 1,
          question: "Placeholder question?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          marks: 4,
          hasNegativeMarking: true,
          difficulty: "medium",
          subject: subject || "General",
          chapter: chapter || "General",
          topic: "General",
          explanation: "",
          source: "Default",
          questionType: "mcq",
        },
      ];
    }

    // ⭐ IMPORTANT: Update local variable
    questions = req.body.questions;

    // -------------------------------
    // 2. VALIDATE REQUIRED FIELDS
    // -------------------------------
    if (!title || !examType || !duration || !totalMarks || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // -------------------------------
    // 3. SAVE QUESTIONS ONE BY ONE
    // -------------------------------
    const createdQuestions = [];

    for (const q of questions) {
      // Map question types
      let mappedExamType = examType === "JEE_MAIN" || examType === "JEE_MAIN_ADVANCED"
        ? "JEE"
        : examType;

      let mappedQuestionType = q.questionType === "mcq" ? "single" : q.questionType;

      const newQuestion = new Question({
        question: q.question,
        questionImage: q.questionImage || null,
        options: q.options || [],
        optionImages: q.optionImages || [],
        correctAnswer: q.correctAnswer,
        marks: q.marks || 4,
        hasNegativeMarking: q.hasNegativeMarking !== undefined ? q.hasNegativeMarking : true,
        difficulty: q.difficulty || "medium",
        subject: subject || q.subject,
        chapter: chapter || q.chapter,
        topic: q.topic || "General",
        explanation: q.explanation || "",
        explanationImage: q.explanationImage || null,
        source: q.source || "Practice",
        questionType: mappedQuestionType,
        questionNumber: q.questionNumber || createdQuestions.length + 1,
        examType: mappedExamType,
        section: mappedQuestionType === "numerical" ? "B" : "A",
      });

      const savedQ = await newQuestion.save();
      createdQuestions.push(savedQ._id);
    }

    // -------------------------------
    // 4. DATE/TIME PROCESSING (FIXED)
    // -------------------------------

    function extractDateAndTime(iso, fallback = "10:00") {
      if (!iso) return { dateStr: "", timeStr: fallback };

      if (iso.includes("T")) {
        const [d, t] = iso.split("T");
        return { dateStr: d, timeStr: t.slice(0, 5) };
      }
      return { dateStr: iso, timeStr: fallback };
    }

    const IST_OFFSET = 330; // +5:30

    function ISTtoUTC(dateStr, timeStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const [H, M] = timeStr.split(":").map(Number);

      const dt = new Date(Date.UTC(y, m - 1, d, H, M));
      dt.setUTCMinutes(dt.getUTCMinutes() - IST_OFFSET);
      return dt;
    }

    const { dateStr: startDateStr, timeStr: startTimeStr } =
      extractDateAndTime(startDate, req.body.startTime || "10:00");

    const { dateStr: endDateStr, timeStr: endTimeStr } =
      extractDateAndTime(endDate, req.body.endTime || "10:00");

    const startUTC = ISTtoUTC(startDateStr, startTimeStr);
    const endUTC = endDateStr ? ISTtoUTC(endDateStr, endTimeStr) : null;

    // -------------------------------
    // 5. GENERATE SCHEDULED DATES
    // -------------------------------
    const scheduledDates = [];

    if (scheduleType === "one-time") {
      scheduledDates.push({ date: startUTC, isCompleted: false });

    } else if (scheduleType === "weekly" && endUTC) {
      let cur = new Date(startUTC);
      while (cur <= endUTC) {
        scheduledDates.push({ date: new Date(cur), isCompleted: false });
        cur.setDate(cur.getDate() + 7);
      }

    } else if (scheduleType === "alternate-days" && endUTC) {
      let cur = new Date(startUTC);
      while (cur <= endUTC) {
        scheduledDates.push({ date: new Date(cur), isCompleted: false });
        cur.setDate(cur.getDate() + 2);
      }
    }

    // -------------------------------
    // 6. CREATE SCHEDULED TEST
    // -------------------------------
    const scheduledTest = new ScheduledTest({
      title,
      examType,
      subject,
      chapter,
      duration,
      totalMarks,
      testType,
      scheduleType,

      startDate: startUTC,
      endDate: endUTC || null,

      startTime: startTimeStr,
      endTime: endTimeStr,

      questions: createdQuestions,
      scheduledDates,
      isActive: true,
      createdBy: req.user.userId,
    });

    await scheduledTest.save();

    res.status(201).json({
      message: "Scheduled test created successfully",
      scheduledTest,
      totalQuestions: createdQuestions.length,
      totalScheduledDates: scheduledDates.length
    });

  } catch (error) {
    console.error("Error creating scheduled test:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Admin: Get All Scheduled Tests
router.get('/all', auth, adminAuth, async (req, res) => {
  try {
    const scheduledTests = await ScheduledTest.find()
      .populate('questions')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ scheduledTests });
  } catch (error) {
    console.error('Error fetching scheduled tests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get Scheduled Test by ID
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const scheduledTest = await ScheduledTest.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name email');

    if (!scheduledTest) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    res.json({ scheduledTest });
  } catch (error) {
    console.error('Error fetching scheduled test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get Full Scheduled Test with All Question Details (for editing)
router.get('/:id/full', auth, adminAuth, async (req, res) => {
  try {
    const scheduledTest = await ScheduledTest.findById(req.params.id)
      .populate('questions')
      .populate('createdBy', 'name email');

    if (!scheduledTest) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    res.json(scheduledTest);
  } catch (error) {
    console.error('Error fetching scheduled test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ This WILL work
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, examType, subject, chapter,
      duration, totalMarks, testType,
      scheduleType, startDate, endDate,
      questions
    } = req.body;

    // ✅ FIX 1: Regenerate scheduled dates
    const scheduledDates = generateScheduledDates(
      scheduleType, 
      startDate, 
      endDate
    );

    // ✅ FIX 2: Use {new: true} option
    const updatedTest = await ScheduledTest.findByIdAndUpdate(
      id,
      {
        title,
        examType,
        subject: subject || 'All',
        chapter: chapter || 'All',
        duration,
        totalMarks,
        testType,
        scheduleType,
        startDate: new Date(startDate),  // ✅ Convert to Date
        endDate: endDate ? new Date(endDate) : null,
        scheduledDates,  // ✅ Use regenerated dates
        questions: questions.map(q => ({
          questionNumber: q.questionNumber,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          hasNegativeMarking: q.hasNegativeMarking !== false,
          difficulty: q.difficulty || 'medium',
          subject: q.subject || subject || 'General',
          chapter: q.chapter || 'Not Specified',
          topic: q.topic || '',
          questionType: q.questionType || 'mcq',
          source: q.source || 'Practice',
          explanation: q.explanation || ''
        })),
        updatedAt: new Date()
      },
      { 
        new: true,  // ✅ FIX 3: Return UPDATED document
        runValidators: true
      }
    );

    if (!updatedTest) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.json({
      success: true,
      message: 'Test updated successfully',
      scheduledTest: updatedTest,
      totalQuestions: questions.length,
      totalScheduledDates: scheduledDates.length
    });

  } catch (error) {
    console.error('Error updating scheduled test:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update test'
    });
  }
});

// Admin: Delete Scheduled Test
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const scheduledTest = await ScheduledTest.findById(req.params.id);
    
    if (!scheduledTest) {
      return res.status(404).json({ message: 'Scheduled test not found' });
    }

    // Delete associated questions
    await Question.deleteMany({ _id: { $in: scheduledTest.questions } });

    // Delete the scheduled test
    await ScheduledTest.findByIdAndDelete(req.params.id);

    res.json({ message: 'Scheduled test and associated questions deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student: Get Active Scheduled Tests (Available to take)
router.get('/student/available', auth, async (req, res) => {
  try {
    const now = new Date();
    
    const scheduledTests = await ScheduledTest.find({
      isActive: true,
      'scheduledDates.date': { $lte: now }
    })
    .populate('questions')
    .sort({ 'scheduledDates.date': -1 });

    // Filter tests that are currently available
    const availableTests = scheduledTests.filter(test => {
      return test.scheduledDates.some(sd => {
        const scheduleDate = new Date(sd.date);
        const testEndTime = new Date(scheduleDate.getTime() + test.duration * 60000);
        return !sd.isCompleted && scheduleDate <= now && now <= testEndTime;
      });
    });

    res.json({ tests: availableTests });
  } catch (error) {
    console.error('Error fetching available tests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student: Get Scheduled Test by ID
router.get('/student/test/:id', auth, async (req, res) => {
  try {
    const scheduledTest = await ScheduledTest.findById(req.params.id)
      .populate('questions');

    if (!scheduledTest) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json({ test: scheduledTest });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student: Submit Scheduled Test
router.post('/submit', auth, async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;

    console.log('=== Scheduled Test Submit ===');
    console.log('Test ID:', testId);
    console.log('User ID:', req.user.userId);
    console.log('Received answers:', JSON.stringify(answers, null, 2));

    const scheduledTest = await ScheduledTest.findById(testId).populate('questions');

    if (!scheduledTest) {
      return res.status(404).json({ message: 'Test not found' });
    }

    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;
    const evaluatedAnswers = [];

    // Process each question
    for (const question of scheduledTest.questions) {
      const questionId = question._id.toString();
      const userAnswer = answers[questionId];

      console.log(`\n--- Question ${questionId} ---`);
      console.log('User Answer:', userAnswer, 'Type:', typeof userAnswer);
      console.log('Correct Answer:', question.correctAnswer, 'Type:', typeof question.correctAnswer);

      const isAttempted = userAnswer !== null && 
                          userAnswer !== undefined && 
                          userAnswer !== '' &&
                          !Number.isNaN(userAnswer);

      if (!isAttempted) {
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
        console.log('Status: UNATTEMPTED');
        continue;
      }

      // Normalize and compare
      const normalizedUserAnswer = typeof userAnswer === 'string' ? parseInt(userAnswer) : Number(userAnswer);
      const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer) : Number(question.correctAnswer);

      console.log('Normalized User Answer:', normalizedUserAnswer);
      console.log('Normalized Correct Answer:', normalizedCorrectAnswer);

      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

      let marksAwarded;
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

    // Allow negative scores
    const percentage = (score / scheduledTest.totalMarks) * 100;

    // Create result
    const result = new Result({
      userId: req.user.userId,
      testId: testId,
      answers: evaluatedAnswers,
      score,
      totalMarks: scheduledTest.totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
      isScheduled: true
    });

    await result.save();

    console.log('Result saved:', result._id);

    res.json({
      message: 'Test submitted successfully',
      result: {
        id: result._id,
        score,
        totalMarks: scheduledTest.totalMarks,
        percentage,
        correctAnswers,
        incorrectAnswers,
        unattempted
      }
    });
  } catch (error) {
    console.error('Error in test submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
