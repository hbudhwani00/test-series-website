const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

const sampleQuestions = [];

// Physics MCQ Questions (20)
const physicsTopics = ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics'];
for (let i = 1; i <= 20; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Physics',
    chapter: physicsTopics[i % physicsTopics.length],
    questionType: 'single',
    section: 'A',
    question: `Physics MCQ Question ${i}: A particle moves with constant acceleration. If initial velocity is u and final velocity is v after time t, what is the displacement?`,
    options: [
      `(u + v)t / 2`,
      `(u - v)t`,
      `ut + (1/2)at²`,
      `vt - (1/2)at²`
    ],
    correctAnswer: 0,
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 1,
    hasNegativeMarking: true,
    explanation: 'Using equation of motion: s = (u + v)t / 2'
  });
}

// Physics Numerical Questions (5)
for (let i = 1; i <= 5; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Physics',
    chapter: physicsTopics[i % physicsTopics.length],
    questionType: 'numerical',
    section: 'B',
    question: `Physics Numerical Question ${i}: Calculate the magnitude of acceleration (in m/s²) when velocity changes from 10 m/s to 30 m/s in 4 seconds.`,
    correctAnswer: 5,
    numericalRange: { min: 4.9, max: 5.1 },
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 0,
    hasNegativeMarking: false,
    explanation: 'a = (v - u) / t = (30 - 10) / 4 = 5 m/s²'
  });
}

// Chemistry MCQ Questions (20)
const chemistryTopics = ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Chemical Bonding', 'Thermochemistry'];
for (let i = 1; i <= 20; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Chemistry',
    chapter: chemistryTopics[i % chemistryTopics.length],
    questionType: 'single',
    section: 'A',
    question: `Chemistry MCQ Question ${i}: Which of the following is the correct IUPAC name for CH₃-CH₂-CH₂-OH?`,
    options: [
      'Propanol',
      'Propan-1-ol',
      'Propyl alcohol',
      '1-Hydroxypropane'
    ],
    correctAnswer: 1,
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 1,
    hasNegativeMarking: true,
    explanation: 'The IUPAC name is Propan-1-ol as the OH group is at position 1'
  });
}

// Chemistry Numerical Questions (5)
for (let i = 1; i <= 5; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Chemistry',
    chapter: chemistryTopics[i % chemistryTopics.length],
    questionType: 'numerical',
    section: 'B',
    question: `Chemistry Numerical Question ${i}: Calculate the pH of a 0.001 M HCl solution at 25°C. (Round to 1 decimal place)`,
    correctAnswer: 3.0,
    numericalRange: { min: 2.9, max: 3.1 },
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 0,
    hasNegativeMarking: false,
    explanation: 'pH = -log[H⁺] = -log(0.001) = -log(10⁻³) = 3'
  });
}

// Mathematics MCQ Questions (20)
const mathTopics = ['Algebra', 'Calculus', 'Coordinate Geometry', 'Trigonometry', 'Probability'];
for (let i = 1; i <= 20; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Mathematics',
    chapter: mathTopics[i % mathTopics.length],
    questionType: 'single',
    section: 'A',
    question: `Mathematics MCQ Question ${i}: What is the derivative of sin(x) with respect to x?`,
    options: [
      'cos(x)',
      '-cos(x)',
      'sin(x)',
      '-sin(x)'
    ],
    correctAnswer: 0,
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 1,
    hasNegativeMarking: true,
    explanation: 'd/dx[sin(x)] = cos(x)'
  });
}

// Mathematics Numerical Questions (5)
for (let i = 1; i <= 5; i++) {
  sampleQuestions.push({
    examType: 'JEE',
    subject: 'Mathematics',
    chapter: mathTopics[i % mathTopics.length],
    questionType: 'numerical',
    section: 'B',
    question: `Mathematics Numerical Question ${i}: Find the value of ∫₀¹ x² dx (integral from 0 to 1). (Round to 2 decimal places)`,
    correctAnswer: 0.33,
    numericalRange: { min: 0.32, max: 0.34 },
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    marks: 4,
    negativeMarks: 0,
    hasNegativeMarking: false,
    explanation: '∫x² dx = x³/3, evaluated from 0 to 1 = 1/3 ≈ 0.33'
  });
}

async function seedQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if questions already exist
    const existingCount = await Question.countDocuments({ examType: 'JEE' });
    
    if (existingCount >= 75) {
      console.log(`\n✅ Database already has ${existingCount} JEE questions.`);
      console.log('Demo test should work fine!');
      await mongoose.connection.close();
      return;
    }

    // Clear existing JEE questions (optional - remove if you want to keep existing)
    // await Question.deleteMany({ examType: 'JEE' });
    // console.log('Cleared existing JEE questions');

    // Insert sample questions
    const inserted = await Question.insertMany(sampleQuestions);
    
    console.log('\n✅ Successfully seeded questions!');
    console.log(`\nQuestion Count by Subject:`);
    
    const physicsMCQ = await Question.countDocuments({ examType: 'JEE', subject: 'Physics', questionType: 'single' });
    const physicsNum = await Question.countDocuments({ examType: 'JEE', subject: 'Physics', questionType: 'numerical' });
    const chemistryMCQ = await Question.countDocuments({ examType: 'JEE', subject: 'Chemistry', questionType: 'single' });
    const chemistryNum = await Question.countDocuments({ examType: 'JEE', subject: 'Chemistry', questionType: 'numerical' });
    const mathMCQ = await Question.countDocuments({ examType: 'JEE', subject: 'Mathematics', questionType: 'single' });
    const mathNum = await Question.countDocuments({ examType: 'JEE', subject: 'Mathematics', questionType: 'numerical' });
    
    console.log(`Physics: ${physicsMCQ} MCQ + ${physicsNum} Numerical = ${physicsMCQ + physicsNum} total`);
    console.log(`Chemistry: ${chemistryMCQ} MCQ + ${chemistryNum} Numerical = ${chemistryMCQ + chemistryNum} total`);
    console.log(`Mathematics: ${mathMCQ} MCQ + ${mathNum} Numerical = ${mathMCQ + mathNum} total`);
    console.log(`\nTotal JEE Questions: ${physicsMCQ + physicsNum + chemistryMCQ + chemistryNum + mathMCQ + mathNum}`);
    console.log('\n🎉 Demo test is ready to use!');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

seedQuestions();
