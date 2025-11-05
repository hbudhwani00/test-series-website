const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const Result = require('../models/Result');
const Question = require('../models/Question');
const User = require('../models/User');
const axios = require('axios');

// Admin: Get all students' topic-wise performance
router.get('/admin/student-analytics', auth, adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email');
    const analyticsData = [];

    for (const student of students) {
      const results = await Result.find({ userId: student._id })
        .sort({ createdAt: -1 })
        .limit(50);

      const topicPerformance = {};

      results.forEach(result => {
        if (result.answers && result.answers.length > 0) {
          result.answers.forEach(answer => {
            const subject = answer.subject || 'Unknown';
            const chapter = answer.chapter || 'General';
            const topic = answer.topic || 'General';
            const key = `${subject}|${chapter}|${topic}`;

            if (!topicPerformance[key]) {
              topicPerformance[key] = {
                subject,
                chapter,
                topic,
                correct: 0,
                incorrect: 0,
                unattempted: 0,
                total: 0
              };
            }

            topicPerformance[key].total++;

            if (answer.isCorrect) {
              topicPerformance[key].correct++;
            } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
              topicPerformance[key].unattempted++;
            } else {
              topicPerformance[key].incorrect++;
            }
          });
        }
      });

      const topics = Object.values(topicPerformance).map(t => ({
        ...t,
        accuracy: t.total > 0 ? ((t.correct / t.total) * 100).toFixed(1) : 0,
        status: t.total > 0 ? (
          (t.correct / t.total) * 100 >= 90 ? 'Excellent' :
          (t.correct / t.total) * 100 >= 70 ? 'Good' :
          (t.correct / t.total) * 100 >= 50 ? 'Average' : 'Weak'
        ) : 'Not Attempted'
      }));

      analyticsData.push({
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
        topics: topics,
        totalTests: results.length,
        weakTopicsCount: topics.filter(t => parseFloat(t.accuracy) < 90).length,
        excellentTopicsCount: topics.filter(t => parseFloat(t.accuracy) >= 90).length
      });
    }

    res.json({
      students: analyticsData,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Error fetching student analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get weak topics based on student's performance
router.get('/weak-topics', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all results for the user
    const results = await Result.find({ userId })
      .populate('testId')
      .sort({ createdAt: -1 })
      .limit(20); // Analyze last 20 tests

    if (!results || results.length === 0) {
      return res.json({
        message: 'No test data available. Take some tests first!',
        weakTopics: []
      });
    }

    // Analyze performance by topic
    const topicPerformance = {};

    results.forEach(result => {
      if (result.answers && result.answers.length > 0) {
        result.answers.forEach(answer => {
          const topic = answer.topic || 'General';
          const subject = answer.subject || 'Unknown';
          const chapter = answer.chapter || 'General';

          const key = `${subject}|${chapter}|${topic}`;

          if (!topicPerformance[key]) {
            topicPerformance[key] = {
              subject,
              chapter,
              topic,
              correct: 0,
              incorrect: 0,
              unattempted: 0,
              total: 0
            };
          }

          topicPerformance[key].total++;

          if (answer.isCorrect) {
            topicPerformance[key].correct++;
          } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
            topicPerformance[key].unattempted++;
          } else {
            topicPerformance[key].incorrect++;
          }
        });
      }
    });

    // Calculate accuracy and identify weak topics
    const weakTopics = Object.values(topicPerformance)
      .map(topic => {
        const accuracy = topic.total > 0 
          ? ((topic.correct / topic.total) * 100).toFixed(1)
          : 0;
        
        return {
          ...topic,
          accuracy: parseFloat(accuracy),
          attempted: topic.correct + topic.incorrect
        };
      })
      .filter(topic => topic.total >= 2) // At least 2 questions attempted
      .filter(topic => topic.accuracy < 90) // Less than 90% accuracy (weak topics)
      .sort((a, b) => a.accuracy - b.accuracy); // Worst topics first

    res.json({
      weakTopics: weakTopics.slice(0, 15), // Top 15 weak topics
      totalTopicsAnalyzed: Object.keys(topicPerformance).length,
      testsAnalyzed: results.length
    });
  } catch (error) {
    console.error('Error analyzing weak topics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate AI-powered test based on weak topics
router.post('/generate-test', auth, async (req, res) => {
  try {
    const { subject, questionCount } = req.body;
    const userId = req.user.userId;

    if (!subject) {
      return res.status(400).json({ message: 'Please select a subject' });
    }

    const totalQuestions = questionCount || 30;

    // Step 1: Analyze student's past performance in this subject
    const results = await Result.find({ userId })
      .populate('testId')
      .sort({ createdAt: -1 })
      .limit(20);

    // Track: Wrong questions, Unattempted questions, Attempted question IDs, Weak topics
    const wrongQuestionIds = new Set();
    const unattemptedQuestionIds = new Set();
    const attemptedQuestionIds = new Set();
    const topicPerformance = {};

    results.forEach(result => {
      if (result.answers && result.answers.length > 0) {
        result.answers.forEach(answer => {
          if (answer.subject !== subject) return; // Only analyze selected subject

          const questionId = answer.questionId?.toString();
          attemptedQuestionIds.add(questionId);

          // Track wrong answers
          if (answer.userAnswer !== null && answer.userAnswer !== undefined && !answer.isCorrect) {
            wrongQuestionIds.add(questionId);
          }

          // Track unattempted
          if (answer.userAnswer === null || answer.userAnswer === undefined) {
            unattemptedQuestionIds.add(questionId);
          }

          // Track topic performance
          const topic = answer.topic || 'General';
          const chapter = answer.chapter || 'General';
          const key = `${chapter}|${topic}`;

          if (!topicPerformance[key]) {
            topicPerformance[key] = {
              chapter,
              topic,
              correct: 0,
              total: 0
            };
          }

          topicPerformance[key].total++;
          if (answer.isCorrect) {
            topicPerformance[key].correct++;
          }
        });
      }
    });

    // Identify weak topics (accuracy < 90%)
    const weakTopics = Object.values(topicPerformance)
      .map(t => ({
        ...t,
        accuracy: t.total > 0 ? (t.correct / t.total) * 100 : 0
      }))
      .filter(t => t.total >= 2 && t.accuracy < 90)
      .sort((a, b) => a.accuracy - b.accuracy); // Worst first

    console.log('=== AI Test Generation Analysis ===');
    console.log('Subject:', subject);
    console.log('Weak Topics:', weakTopics.length);
    console.log('Wrong Questions:', wrongQuestionIds.size);
    console.log('Unattempted Questions:', unattemptedQuestionIds.size);

    // Priority-based question selection
    const selectedQuestions = [];
    const usedQuestionIds = new Set();

    // PRIORITY 1: New questions from weak topics (NOT attempted before)
    for (const weakTopic of weakTopics) {
      const newQuestions = await Question.find({
        subject: subject,
        chapter: weakTopic.chapter,
        topic: weakTopic.topic,
        _id: { $nin: Array.from(attemptedQuestionIds) }
      })
      .limit(3) // 2-3 questions per topic
      .lean();

      newQuestions.forEach(q => {
        if (selectedQuestions.length < totalQuestions && !usedQuestionIds.has(q._id.toString())) {
          selectedQuestions.push({ ...q, priority: 1, reason: 'New question from weak topic' });
          usedQuestionIds.add(q._id.toString());
        }
      });

      if (selectedQuestions.length >= totalQuestions) break;
    }

    // PRIORITY 2: Questions student got WRONG (exact same questions)
    if (selectedQuestions.length < totalQuestions) {
      const wrongQuestions = await Question.find({
        _id: { $in: Array.from(wrongQuestionIds) },
        subject: subject
      }).lean();

      wrongQuestions.forEach(q => {
        if (selectedQuestions.length < totalQuestions && !usedQuestionIds.has(q._id.toString())) {
          selectedQuestions.push({ ...q, priority: 2, reason: 'Previously answered incorrectly' });
          usedQuestionIds.add(q._id.toString());
        }
      });
    }

    // PRIORITY 3: Questions student UNATTEMPTED (exact same questions)
    if (selectedQuestions.length < totalQuestions) {
      const unattemptedQuestions = await Question.find({
        _id: { $in: Array.from(unattemptedQuestionIds) },
        subject: subject
      }).lean();

      unattemptedQuestions.forEach(q => {
        if (selectedQuestions.length < totalQuestions && !usedQuestionIds.has(q._id.toString())) {
          selectedQuestions.push({ ...q, priority: 3, reason: 'Previously unattempted' });
          usedQuestionIds.add(q._id.toString());
        }
      });
    }

    // PRIORITY 4: More questions from weak topics
    if (selectedQuestions.length < totalQuestions) {
      for (const weakTopic of weakTopics) {
        const moreQuestions = await Question.find({
          subject: subject,
          chapter: weakTopic.chapter,
          topic: weakTopic.topic,
          _id: { $nin: Array.from(usedQuestionIds) }
        })
        .limit(5)
        .lean();

        moreQuestions.forEach(q => {
          if (selectedQuestions.length < totalQuestions && !usedQuestionIds.has(q._id.toString())) {
            selectedQuestions.push({ ...q, priority: 4, reason: 'Additional weak topic question' });
            usedQuestionIds.add(q._id.toString());
          }
        });

        if (selectedQuestions.length >= totalQuestions) break;
      }
    }

    // PRIORITY 5: Fill remaining with any new questions from subject
    if (selectedQuestions.length < totalQuestions) {
      const remaining = totalQuestions - selectedQuestions.length;
      const fillerQuestions = await Question.find({
        subject: subject,
        _id: { $nin: Array.from(usedQuestionIds) }
      })
      .limit(remaining)
      .lean();

      fillerQuestions.forEach(q => {
        if (selectedQuestions.length < totalQuestions) {
          selectedQuestions.push({ ...q, priority: 5, reason: 'Random question from subject' });
          usedQuestionIds.add(q._id.toString());
        }
      });
    }

    if (selectedQuestions.length === 0) {
      return res.status(404).json({ 
        message: 'No questions available for this subject. Please contact admin to add questions.' 
      });
    }

    // Sort by difficulty: Easy → Medium → Hard
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    selectedQuestions.sort((a, b) => {
      const diffA = difficultyOrder[a.difficulty] || 2;
      const diffB = difficultyOrder[b.difficulty] || 2;
      return diffA - diffB;
    });

    // Add question numbers
    const formattedQuestions = selectedQuestions.map((q, idx) => ({
      ...q,
      questionNumber: idx + 1
    }));

    const duration = Math.min(selectedQuestions.length * 2, 60); // 2 min per question, max 60 min

    console.log('=== Questions Selected ===');
    console.log('Priority 1 (New weak):', selectedQuestions.filter(q => q.priority === 1).length);
    console.log('Priority 2 (Wrong):', selectedQuestions.filter(q => q.priority === 2).length);
    console.log('Priority 3 (Unattempted):', selectedQuestions.filter(q => q.priority === 3).length);
    console.log('Priority 4 (More weak):', selectedQuestions.filter(q => q.priority === 4).length);
    console.log('Priority 5 (Filler):', selectedQuestions.filter(q => q.priority === 5).length);

    res.json({
      message: 'AI test generated successfully',
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length,
      subject: subject,
      duration: duration,
      totalMarks: formattedQuestions.length * 4,
      weakTopicsAnalyzed: weakTopics.length,
      analysis: {
        weakTopics: weakTopics.slice(0, 5),
        previousWrongQuestions: wrongQuestionIds.size,
        previousUnattemptedQuestions: unattemptedQuestionIds.size
      }
    });
  } catch (error) {
    console.error('Error generating AI test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit AI-generated test
router.post('/submit-test', auth, async (req, res) => {
  try {
    const { questions, answers, timeTaken, subject } = req.body;
    const userId = req.user.userId;

    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;
    const evaluatedAnswers = [];

    // Evaluate each answer
    questions.forEach(question => {
      const questionId = question._id;
      const userAnswer = answers[questionId];

      const isAttempted = userAnswer !== null && 
                          userAnswer !== undefined && 
                          userAnswer !== '' &&
                          !Number.isNaN(userAnswer);

      if (!isAttempted) {
        unattempted++;
        evaluatedAnswers.push({
          questionId: question._id,
          question: question.question,
          options: question.options || [],
          questionType: question.questionType,
          userAnswer: null,
          isCorrect: false,
          marksAwarded: 0,
          timeTaken: 0,
          chapter: question.chapter,
          topic: question.topic,
          subject: question.subject,
          difficulty: question.difficulty,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation
        });
        return;
      }

      const normalizedUserAnswer = typeof userAnswer === 'string' ? parseInt(userAnswer) : Number(userAnswer);
      const normalizedCorrectAnswer = typeof question.correctAnswer === 'string' ? parseInt(question.correctAnswer) : Number(question.correctAnswer);

      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

      let marksAwarded;
      if (isCorrect) {
        marksAwarded = question.marks || 4;
        correctAnswers++;
      } else {
        marksAwarded = question.hasNegativeMarking ? -1 : 0;
        incorrectAnswers++;
      }

      score += marksAwarded;

      evaluatedAnswers.push({
        questionId: question._id,
        question: question.question,
        options: question.options || [],
        questionType: question.questionType,
        userAnswer: normalizedUserAnswer,
        isCorrect,
        marksAwarded,
        timeTaken: 0,
        chapter: question.chapter,
        topic: question.topic,
        subject: question.subject,
        difficulty: question.difficulty,
        correctAnswer: normalizedCorrectAnswer,
        explanation: question.explanation
      });
    });

    const totalMarks = questions.length * 4;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    // Create result with AI test flag
    const result = new Result({
      userId: userId,
      testId: null, // AI tests don't have a testId
      answers: evaluatedAnswers,
      score,
      totalMarks,
      percentage,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      timeTaken,
      isScheduled: false,
      isAIGenerated: true,
      aiTestMetadata: {
        subject: subject,
        totalQuestions: questions.length
      }
    });

    await result.save();

    console.log('=== AI Test Submitted ===');
    console.log('Result ID:', result._id);
    console.log('Score:', score, '/', totalMarks);
    console.log('Percentage:', percentage.toFixed(2) + '%');

    res.json({
      message: 'AI test submitted successfully',
      result: {
        id: result._id,
        score,
        totalMarks,
        percentage: parseFloat(percentage.toFixed(2)),
        correctAnswers,
        incorrectAnswers,
        unattempted
      }
    });
  } catch (error) {
    console.error('Error submitting AI test:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate AI-powered performance feedback using Google Gemini
router.post('/performance-feedback', auth, async (req, res) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({ message: 'Result ID is required' });
    }

    // Fetch the result with populated data
    const result = await Result.findById(resultId)
      .populate('testId')
      .populate('userId', 'name email');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    // Ensure user owns this result
    if (result.userId?._id?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prepare data for AI analysis
    const performanceData = {
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      unattempted: result.unattempted,
      totalQuestions: result.answers.length,
      timeTaken: result.timeTaken,
      testName: result.testId?.title || 'Demo Test',
      subject: result.testId?.subject || result.aiTestMetadata?.subject || 'Mixed'
    };

    // Calculate additional metrics
    const attemptedQuestions = performanceData.correctAnswers + performanceData.incorrectAnswers;
    const accuracy = attemptedQuestions > 0 ? (performanceData.correctAnswers / attemptedQuestions) * 100 : 0;
    const attemptRate = (attemptedQuestions / performanceData.totalQuestions) * 100;
    
    // Topic-wise analysis
    const topicPerformance = {};
    result.answers.forEach(answer => {
      const topic = answer.topic || 'General';
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { correct: 0, total: 0 };
      }
      topicPerformance[topic].total++;
      if (answer.isCorrect) topicPerformance[topic].correct++;
    });

    const weakTopics = Object.entries(topicPerformance)
      .filter(([_, data]) => data.total >= 2 && (data.correct / data.total) < 0.6)
      .map(([topic, data]) => ({
        topic,
        accuracy: ((data.correct / data.total) * 100).toFixed(1)
      }))
      .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

    // Construct prompt for Gemini
    const prompt = `You are an expert JEE (Joint Entrance Examination) mentor analyzing a student's test performance. Provide personalized, actionable feedback.

**Test Performance Data:**
- Score: ${performanceData.score}/${performanceData.totalMarks} (${performanceData.percentage.toFixed(1)}%)
- Correct Answers: ${performanceData.correctAnswers}
- Incorrect Answers: ${performanceData.incorrectAnswers}
- Unattempted: ${performanceData.unattempted}
- Total Questions: ${performanceData.totalQuestions}
- Accuracy: ${accuracy.toFixed(1)}% (of attempted questions)
- Attempt Rate: ${attemptRate.toFixed(1)}%
- Time Taken: ${Math.floor(performanceData.timeTaken / 60)} minutes
- Subject: ${performanceData.subject}
- Test: ${performanceData.testName}

**Weak Topics:** ${weakTopics.length > 0 ? weakTopics.map(t => `${t.topic} (${t.accuracy}%)`).join(', ') : 'None identified'}

**Instructions:**
1. Start with an honest assessment of performance level (Outstanding/Excellent/Good/Needs Improvement/Critical)
2. Analyze accuracy vs attempt rate - identify if student is rushing or being too cautious
3. Provide specific, actionable recommendations (3-5 points)
4. Address weak topics with concrete study strategies
5. Compare to JEE benchmarks: JEE Main ~90 percentile = 75-80 marks (240), JEE Advanced qualification = Top 2.5 lakh, Top IITs = 99.5%+
6. Be motivating but realistic - don't sugarcoat if performance is poor
7. Keep response concise (150-200 words) but impactful

Respond in a friendly, mentor-like tone. Use emojis sparingly (1-2 max). Focus on what the student should DO NEXT.`;

    console.log('Calling Gemini API for performance feedback...');

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found, using fallback response');
      return res.json({
        feedback: generateFallbackFeedback(performanceData, accuracy, attemptRate, weakTopics),
        source: 'fallback'
      });
    }

    // Call Google Gemini API
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const aiResponse = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }

    console.log('AI feedback generated successfully');

    res.json({
      feedback: aiResponse.trim(),
      source: 'gemini',
      metadata: {
        accuracy: accuracy.toFixed(1),
        attemptRate: attemptRate.toFixed(1),
        weakTopicsCount: weakTopics.length
      }
    });

  } catch (error) {
    console.error('Error generating AI feedback:', error.message);
    
    // Fallback response if API fails
    const result = await Result.findById(req.body.resultId);
    if (result) {
      const attemptedQuestions = result.correctAnswers + result.incorrectAnswers;
      const accuracy = attemptedQuestions > 0 ? (result.correctAnswers / attemptedQuestions) * 100 : 0;
      const attemptRate = (attemptedQuestions / result.answers.length) * 100;
      
      return res.json({
        feedback: generateFallbackFeedback(
          { percentage: result.percentage, correctAnswers: result.correctAnswers, incorrectAnswers: result.incorrectAnswers, unattempted: result.unattempted },
          accuracy,
          attemptRate,
          []
        ),
        source: 'fallback',
        error: 'API unavailable'
      });
    }
    
    res.status(500).json({ message: 'Failed to generate feedback', error: error.message });
  }
});

// Fallback feedback generator (used when API is unavailable)
function generateFallbackFeedback(performanceData, accuracy, attemptRate, weakTopics) {
  const percentage = performanceData.percentage;
  let feedback = '';

  if (percentage >= 90) {
    feedback = `🌟 OUTSTANDING PERFORMANCE!\n\nYou're performing at an elite level with ${percentage.toFixed(1)}% and ${accuracy.toFixed(1)}% accuracy. This puts you in the top 5% of JEE aspirants.\n\n`;
  } else if (percentage >= 75) {
    feedback = `🎯 EXCELLENT WORK!\n\nYou scored ${percentage.toFixed(1)}% with strong fundamentals. You're on track for top NITs and IITs.\n\n`;
  } else if (percentage >= 60) {
    feedback = `📚 GOOD START!\n\nYou got ${percentage.toFixed(1)}%. Solid foundation, but there's room for improvement.\n\n`;
  } else if (percentage >= 40) {
    feedback = `⚠️ NEEDS IMPROVEMENT\n\nYou scored ${percentage.toFixed(1)}%. Time to strengthen your basics and practice more.\n\n`;
  } else {
    feedback = `🔥 URGENT ACTION REQUIRED!\n\nYour score of ${percentage.toFixed(1)}% needs immediate attention. Focus on fundamentals.\n\n`;
  }

  // Accuracy analysis
  if (accuracy < 60) {
    feedback += `⚠️ Your accuracy is ${accuracy.toFixed(1)}%. Slow down and focus on understanding concepts rather than rushing.\n\n`;
  } else if (accuracy >= 80) {
    feedback += `✅ Great accuracy at ${accuracy.toFixed(1)}%! Your conceptual understanding is strong.\n\n`;
  }

  // Attempt rate analysis
  if (attemptRate < 60) {
    feedback += `⏰ You attempted only ${attemptRate.toFixed(1)}% of questions. Work on time management and confidence.\n\n`;
  }

  // Weak topics
  if (weakTopics.length > 0) {
    feedback += `📌 Focus on: ${weakTopics.slice(0, 3).map(t => t.topic).join(', ')}\n\n`;
  }

  feedback += `Next Steps:\n1. Review all incorrect answers\n2. Practice weak topics daily\n3. Take more mock tests\n4. Aim for 90+ percentile (75-80 marks minimum for JEE Main)`;

  return feedback;
}

module.exports = router;
