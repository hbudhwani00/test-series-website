# JEE Main Paper Pattern Implementation

## ✅ Exact JEE Main 2024-25 Pattern

Your test series now follows the **official JEE Main exam pattern** exactly:

### 📊 Paper Structure

**Total Duration:** 180 minutes (3 hours)  
**Total Questions:** 90  
**Total Marks:** 300

### 📝 Subject-wise Distribution

Each of the 3 subjects (Physics, Chemistry, Mathematics) has:

#### **Section A: Multiple Choice Questions**
- **Questions:** 20 (Single Correct Answer)
- **Marks:** +4 for correct, -1 for incorrect
- **Compulsory:** All 20 must be attempted
- **Type:** 4 options, choose 1 correct

#### **Section B: Numerical Answer Questions**
- **Questions:** 10 (Numerical Value)
- **Marks:** +4 for correct, 0 for incorrect (**NO negative marking**)
- **Compulsory:** Attempt ANY 5 out of 10
- **Type:** Enter numerical value (0-9999, decimals allowed)
- **Important:** If you attempt more than 5, only first 5 will be evaluated

---

## 🎯 Features Implemented

### Backend Features

1. **Updated Question Model** (`backend/models/Question.js`):
   - Added `section` field (A or B)
   - Added `hasNegativeMarking` boolean
   - Added `numericalRange` for answer validation
   - Proper marking scheme per section

2. **JEE Main Pattern Generator** (`backend/utils/jeeMainPattern.js`):
   - Auto-generates 90 questions following exact pattern
   - Ensures 20 MCQ + 10 Numerical per subject
   - Validates pattern compliance
   - Calculates scores with Section B special rules

3. **Updated Test Model** (`backend/models/Test.js`):
   - Added `jeeMainStructure` field
   - Stores questions by subject and section
   - Includes exam instructions
   - Supports pattern-based testing

4. **New Admin Routes**:
   - `POST /api/admin/generate-jee-main-test` - Generate JEE Main pattern test
   - `GET /api/admin/jee-main-pattern` - Get pattern information

### Frontend Features

1. **JEE Main Test Interface** (`client/src/pages/student/JEEMainTest.js`):
   - **Subject-wise Navigation:** Switch between Physics, Chemistry, Math
   - **Section Navigation:** Toggle between Section A and B
   - **Question Palette:** Visual grid showing all questions
   - **Color-coded Status:**
     - 🟢 Green = Answered
     - 🔴 Red = Not Answered (visited but skipped)
     - 🟣 Purple = Marked for Review
     - ⚪ Gray = Not Visited
   - **Timer:** 3-hour countdown with auto-submit
   - **Instructions Screen:** Shows all rules before starting
   - **Section B Logic:** Automatically evaluates only first 5 attempted

2. **UI Features**:
   - Sticky header with timer
   - Question palette on left (desktop) / collapsible (mobile)
   - Large question display area
   - Clear response functionality
   - Mark for review feature
   - Save & Next navigation
   - Jump to any question directly

---

## 🚀 How to Use

### For Admins: Creating JEE Main Test

#### Method 1: Via API (Postman/cURL)

```bash
curl -X POST http://localhost:5000/api/admin/generate-jee-main-test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JEE Main Mock Test 2025",
    "examType": "JEE"
  }'
```

#### Method 2: Via Admin Panel (Coming Soon)
We'll add a button in admin dashboard to generate JEE Main tests automatically.

### For Students: Taking JEE Main Test

1. Navigate to the test
2. Read instructions carefully
3. Click "I am ready to begin"
4. Test interface opens with:
   - Physics selected by default
   - Section A displayed first
   - Timer starts counting down
5. Answer questions:
   - **Section A:** Click on options
   - **Section B:** Enter numerical value
6. Use question palette to navigate
7. Mark questions for review if needed
8. Submit when done (or auto-submit at time end)

---

## 📋 Scoring System

### Section A (MCQ):
```
Correct Answer: +4 marks
Incorrect Answer: -1 mark
Unattempted: 0 marks
```

### Section B (Numerical):
```
Correct Answer: +4 marks
Incorrect/Unattempted: 0 marks (NO NEGATIVE MARKING)
```

### Maximum Score Calculation:
```
Per Subject:
- Section A: 20 × 4 = 80 marks
- Section B: 5 × 4 = 20 marks (only 5 out of 10)
- Total per subject: 100 marks

Total Test: 3 × 100 = 300 marks
```

---

## 🔧 Technical Implementation

### Database Schema

**Questions Collection:**
```javascript
{
  examType: 'JEE',
  subject: 'Physics',
  chapter: 'Mechanics',
  questionType: 'single' | 'numerical',
  section: 'A' | 'B',
  question: '...',
  options: [...], // For Section A only
  correctAnswer: '...',
  numericalRange: { min: 12.4, max: 12.6 }, // For Section B
  marks: 4,
  negativeMarks: -1 | 0,
  hasNegativeMarking: true | false
}
```

**Tests Collection:**
```javascript
{
  title: 'JEE Main Mock Test',
  pattern: 'jee_main',
  testType: 'jee_main_pattern',
  duration: 180,
  totalMarks: 300,
  jeeMainStructure: {
    Physics: {
      sectionA: [ObjectId...], // 20 questions
      sectionB: [ObjectId...]  // 10 questions
    },
    Chemistry: { ... },
    Mathematics: { ... }
  },
  instructions: [...]
}
```

### API Endpoints

**Generate Test:**
```
POST /api/admin/generate-jee-main-test
Authorization: Bearer <admin_token>
Body: { title: "Test Name", examType: "JEE" }
```

**Get Pattern Info:**
```
GET /api/admin/jee-main-pattern
Authorization: Bearer <admin_token>
```

**Take Test:**
```
GET /api/tests/:testId
Authorization: Bearer <token>
```

**Submit Test:**
```
POST /api/results/submit
Authorization: Bearer <token>
Body: { testId, answers, timeTaken }
```

---

## 📱 User Interface Details

### Question Palette Colors

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Green | `bg-green-500` | Answered |
| 🔴 Red | `bg-red-500` | Not Answered (visited but skipped) |
| 🟣 Purple | `bg-purple-500` | Marked for Review |
| ⚪ Gray | `bg-gray-300` | Not Visited |

### Navigation Buttons

- **Previous**: Go to previous question
- **Next**: Go to next question
- **Clear Response**: Remove your answer
- **Mark for Review**: Flag question for later review
- **Save & Next**: Save answer and move to next
- **Submit Test**: End test and submit all answers

### Timer Behavior

- Shows HH:MM:SS format
- Turns red when < 10 minutes remaining
- Auto-submits when reaches 00:00:00
- Confirmation dialog before manual submit

---

## ⚠️ Important Rules (Exactly as JEE Main)

### Section B Special Rules:

1. **Only first 5 attempted questions are evaluated**
   - If you attempt 7 questions, only first 5 count
   - Order matters! Choose wisely which 5 to attempt

2. **No negative marking in Section B**
   - Safe to guess if unsure
   - But remember only 5 count

3. **Numerical answers**
   - Must be between 0 and 9999
   - Decimals allowed (e.g., 12.5, 0.333)
   - Answer is considered correct if within range

### General Rules:

1. **You can:**
   - Navigate between subjects anytime
   - Jump to any question directly
   - Mark questions for review
   - Change answers before submitting

2. **You cannot:**
   - Extend the time
   - Go back after submission
   - Use calculator (virtual calculator will be added)

---

## 🎓 Best Practices for Students

### Time Management:
- **60 minutes per subject** (recommended)
- Allocate time:
  - Section A: 40-45 minutes (2 min/question)
  - Section B: 15-20 minutes (attempt 5)

### Strategy:
1. Start with easiest subject for you
2. Attempt all Section A first (compulsory)
3. Then choose 5 Section B questions you're confident about
4. Use "Mark for Review" for doubtful questions
5. Return to marked questions if time permits
6. **DON'T** attempt > 5 Section B questions accidentally

### Section B Tips:
- Answer ONLY 5 questions you're sure about
- No penalty for wrong answer, but wasted time
- Check decimal places carefully
- Round as per instructions

---

## 🔄 Future Enhancements

### Planned Features:

1. **Virtual Calculator** - On-screen scientific calculator
2. **Formula Sheet** - Quick reference for formulas
3. **Rough Work Area** - Digital scratchpad
4. **Question Bookmarking** - Save favorite questions
5. **Practice Mode** - No timer, instant feedback
6. **Analytics** - Performance breakdown by chapter
7. **Comparison** - Compare with other students
8. **Solutions** - Detailed explanations after submission

### Coming Soon:

- NEET pattern (180 questions, different structure)
- JEE Advanced pattern (2 papers, different marking)
- Chapter-wise tests in JEE Main format
- Previous year papers in this interface

---

## 🐛 Troubleshooting

### Common Issues:

**Q: Questions not loading**
- Check backend is running
- Verify sufficient questions in database (need 20+10 per subject)

**Q: Timer not working**
- Clear browser cache
- Check JavaScript is enabled

**Q: Section B - All 10 questions being evaluated**
- This is a bug - report immediately
- Should only evaluate first 5 attempted

**Q: Can't navigate between subjects**
- Try refreshing the page
- Check if modal is blocking navigation

---

## 📊 Sample Test Generation

To generate a JEE Main test, you need in your database:

**Minimum Requirements:**
- Physics: 20 Section A + 10 Section B questions
- Chemistry: 20 Section A + 10 Section B questions  
- Mathematics: 20 Section A + 10 Section B questions

**Total:** 90 questions minimum

**Upload Questions:**

Use the admin panel to upload questions with:
- `questionType: 'single'` → Section A
- `questionType: 'numerical'` → Section B
- `section: 'A'` or `section: 'B'`
- Proper marking scheme

---

## ✅ Validation Checklist

Before launching JEE Main test:

- [ ] 90 questions uploaded (30 per subject)
- [ ] Section A has 4 options each
- [ ] Section B has numerical answers
- [ ] Marking scheme: Section A (-1), Section B (0)
- [ ] Timer set to 180 minutes
- [ ] Instructions screen displays correctly
- [ ] Question palette works
- [ ] Section B evaluates only 5 questions
- [ ] Score calculation is accurate
- [ ] Auto-submit works at time end

---

## 📞 Support

For issues with JEE Main pattern:

1. Check this documentation
2. Verify question database has sufficient questions
3. Test with small sample first
4. Check backend logs for errors
5. Verify all 3 subjects have questions

---

**Implementation Complete! ✅**

Your platform now supports authentic JEE Main pattern tests with exact paper structure, marking scheme, and user interface similar to the actual exam.

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready
