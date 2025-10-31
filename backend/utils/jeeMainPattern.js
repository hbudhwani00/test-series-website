/**
 * JEE Main Paper Pattern Generator
 * 
 * JEE Main 2024-25 Pattern:
 * - Total Questions: 90 (30 per subject)
 * - Duration: 3 hours (180 minutes)
 * - Total Marks: 300 (100 per subject)
 * 
 * Each Subject (Physics/Chemistry/Mathematics):
 * Section A: 20 Questions (MCQ - Single Correct)
 *   - 4 marks for correct answer
 *   - -1 mark for incorrect answer
 *   - All 20 questions are compulsory
 * 
 * Section B: 10 Questions (Numerical Value Answer)
 *   - 4 marks for correct answer
 *   - 0 marks for incorrect answer (NO negative marking)
 *   - Attempt any 5 out of 10 questions
 */

const Question = require('../models/Question');

// JEE Main Paper Pattern Configuration
const JEE_MAIN_PATTERN = {
  totalQuestions: 90,
  duration: 180, // minutes
  totalMarks: 300,
  subjects: ['Physics', 'Chemistry', 'Mathematics'],
  perSubject: {
    total: 30,
    sectionA: {
      count: 20,
      type: 'single',
      marks: 4,
      negativeMarks: -1,
      compulsory: true,
      description: 'Multiple Choice Questions (Single Correct Option)'
    },
    sectionB: {
      count: 10,
      type: 'numerical',
      marks: 4,
      negativeMarks: 0,
      attemptAny: 5,
      compulsory: false,
      description: 'Numerical Value Answer Questions (Attempt any 5)'
    }
  }
};

/**
 * Generate JEE Main pattern test
 * @param {String} examType - 'JEE_MAIN' or 'JEE_MAIN_ADVANCED'
 * @returns {Object} Test configuration with questions
 */
const generateJEEMainTest = async (examType = 'JEE') => {
  const testQuestions = [];
  
  for (const subject of JEE_MAIN_PATTERN.subjects) {
    // Section A: 20 MCQ Single Correct (Compulsory)
    const sectionAQuestions = await Question.aggregate([
      {
        $match: {
          examType: examType,
          subject: subject,
          questionType: 'single',
          section: 'A'
        }
      },
      { $sample: { size: 20 } }
    ]);

    // If not enough Section A questions, get any single correct questions
    if (sectionAQuestions.length < 20) {
      const additionalA = await Question.aggregate([
        {
          $match: {
            examType: examType,
            subject: subject,
            questionType: 'single'
          }
        },
        { $sample: { size: 20 - sectionAQuestions.length } }
      ]);
      sectionAQuestions.push(...additionalA);
    }

    // Section B: 10 Numerical Questions (Attempt any 5)
    const sectionBQuestions = await Question.aggregate([
      {
        $match: {
          examType: examType,
          subject: subject,
          questionType: 'numerical',
          section: 'B'
        }
      },
      { $sample: { size: 10 } }
    ]);

    // If not enough Section B questions, get any numerical questions
    if (sectionBQuestions.length < 10) {
      const additionalB = await Question.aggregate([
        {
          $match: {
            examType: examType,
            subject: subject,
            questionType: 'numerical'
          }
        },
        { $sample: { size: 10 - sectionBQuestions.length } }
      ]);
      sectionBQuestions.push(...additionalB);
    }

    // Add subject questions with section info
    testQuestions.push({
      subject: subject,
      sectionA: sectionAQuestions.map((q, index) => ({
        questionId: q._id,
        questionNumber: index + 1,
        section: 'A',
        marks: 4,
        negativeMarks: -1,
        compulsory: true
      })),
      sectionB: sectionBQuestions.map((q, index) => ({
        questionId: q._id,
        questionNumber: index + 21, // Questions 21-30
        section: 'B',
        marks: 4,
        negativeMarks: 0,
        compulsory: false,
        attemptAny: 5
      }))
    });
  }

  return {
    pattern: 'JEE_MAIN',
    totalQuestions: 90,
    duration: 180,
    totalMarks: 300,
    instructions: getJEEMainInstructions(),
    subjects: testQuestions,
    metadata: JEE_MAIN_PATTERN
  };
};

/**
 * Get JEE Main exam instructions
 */
const getJEEMainInstructions = () => {
  return [
    {
      title: 'General Instructions',
      points: [
        'Total duration of JEE-Main is 180 minutes (3 hours).',
        'The question paper consists of 3 subjects: Physics, Chemistry, and Mathematics.',
        'Each subject has 30 questions divided into two sections.',
        'All questions carry equal marks of 4 each.',
        'There is NO negative marking in Section B (Numerical questions).',
        'Attempt all questions in Section A; in Section B attempt any 5 out of 10 questions.'
      ]
    },
    {
      title: 'Section A - Multiple Choice Questions',
      points: [
        'Contains 20 questions per subject (Total 60 questions).',
        'Each question has 4 options with only ONE correct answer.',
        'Marking: +4 for correct answer, -1 for wrong answer, 0 for unattempted.',
        'ALL 20 questions are COMPULSORY.'
      ]
    },
    {
      title: 'Section B - Numerical Value Questions',
      points: [
        'Contains 10 questions per subject (Total 30 questions).',
        'Answer is a numerical value (0 to 9999, with decimals if needed).',
        'Marking: +4 for correct answer, 0 for wrong/unattempted (NO NEGATIVE MARKING).',
        'Attempt ANY 5 questions out of 10.',
        'If you attempt more than 5, only first 5 attempted will be evaluated.'
      ]
    },
    {
      title: 'Marking Scheme',
      points: [
        'Section A (MCQ): +4 for correct, -1 for incorrect, 0 for unattempted',
        'Section B (Numerical): +4 for correct, 0 for incorrect/unattempted',
        'Maximum Marks per Subject: 100 (80 from Section A + 20 from Section B)',
        'Total Maximum Marks: 300'
      ]
    }
  ];
};

/**
 * Validate if a test follows JEE Main pattern
 */
const validateJEEMainPattern = (testData) => {
  const errors = [];

  if (testData.subjects.length !== 3) {
    errors.push('Must have exactly 3 subjects (Physics, Chemistry, Mathematics)');
  }

  testData.subjects.forEach(subject => {
    if (subject.sectionA.length !== 20) {
      errors.push(`${subject.subject}: Section A must have exactly 20 questions`);
    }
    if (subject.sectionB.length !== 10) {
      errors.push(`${subject.subject}: Section B must have exactly 10 questions`);
    }
  });

  if (testData.duration !== 180) {
    errors.push('Duration must be 180 minutes');
  }

  if (testData.totalMarks !== 300) {
    errors.push('Total marks must be 300');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate JEE Main test score
 */
const calculateJEEMainScore = (answers, questions) => {
  let score = 0;
  let sectionScores = {
    Physics: { sectionA: 0, sectionB: 0, total: 0 },
    Chemistry: { sectionA: 0, sectionB: 0, total: 0 },
    Mathematics: { sectionA: 0, sectionB: 0, total: 0 }
  };

  questions.subjects.forEach(subjectData => {
    const subject = subjectData.subject;

    // Section A scoring
    subjectData.sectionA.forEach(q => {
      const answer = answers[q.questionId];
      if (answer) {
        if (answer.isCorrect) {
          sectionScores[subject].sectionA += 4;
        } else {
          sectionScores[subject].sectionA -= 1; // Negative marking
        }
      }
    });

    // Section B scoring (first 5 attempted, no negative marking)
    const sectionBAttempted = subjectData.sectionB
      .filter(q => answers[q.questionId])
      .slice(0, 5); // Only first 5 count

    sectionBAttempted.forEach(q => {
      const answer = answers[q.questionId];
      if (answer && answer.isCorrect) {
        sectionScores[subject].sectionB += 4;
      }
      // No negative marking in Section B
    });

    sectionScores[subject].total = 
      sectionScores[subject].sectionA + sectionScores[subject].sectionB;
  });

  score = Object.values(sectionScores).reduce((sum, s) => sum + s.total, 0);

  return {
    totalScore: score,
    maxScore: 300,
    percentage: (score / 300) * 100,
    sectionScores
  };
};

module.exports = {
  JEE_MAIN_PATTERN,
  generateJEEMainTest,
  getJEEMainInstructions,
  validateJEEMainPattern,
  calculateJEEMainScore
};
