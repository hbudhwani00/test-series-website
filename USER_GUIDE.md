# User Guide - JEE & NEET Test Series

## Table of Contents
1. [For Students](#for-students)
2. [For Admins](#for-admins)
3. [Payment Information](#payment-information)
4. [Tips & Best Practices](#tips--best-practices)

---

## For Students

### Getting Started

#### 1. Registration
1. Open http://localhost:3000
2. Click on "Register"
3. Fill in:
   - Full Name
   - Phone Number (will be used for login)
   - Password
   - Confirm Password
4. Click "Register"

#### 2. Login
1. Go to http://localhost:3000/login
2. Enter your phone number and password
3. Click "Login"

#### 3. Select Your Exam
- Choose between **JEE** or **NEET**
- This selection can be changed later

### Subscription Plans

#### Available Plans:

**For JEE:**
- **JEE Main**: ₹299/year
  - Complete JEE Main question bank
  - Unlimited test generation
  - Physics, Chemistry, Mathematics

- **JEE Main + Advanced**: ₹399/year
  - Complete JEE Main & Advanced coverage
  - Advanced level questions
  - All subjects included

**For NEET:**
- **NEET**: ₹399/year
  - Complete NEET question bank
  - Physics, Chemistry, Biology
  - All difficulty levels

#### How to Subscribe:
1. Navigate to "Subscription" from the menu
2. Choose your plan
3. Click "Subscribe Now"
4. Complete payment via Razorpay
5. Start generating tests immediately!

### Generating Tests

#### Step-by-Step:

1. **Navigate to "Generate Test"**

2. **Select Parameters:**
   - **Exam Type**: JEE or NEET
   - **Subject**: Physics, Chemistry, Mathematics, or Biology
   - **Chapter**: (Optional) Select specific chapter or "All Chapters"
   - **Difficulty**: (Optional) Easy, Medium, Hard, or "All Levels"
   - **Number of Questions**: 10-100 questions

3. **Click "Generate Test"**

4. **Test Composition:**
   - 50% Single Choice Questions (4 marks each)
   - 30% Multiple Choice Questions (4 marks each)
   - 20% Numerical Questions (4 marks each)
   - Negative marking: -1 for incorrect answers

### Taking Tests

#### Test Interface:

**Timer:**
- Displayed at the top right
- Automatically calculated based on question count (2 minutes per question)
- Turns red when less than 5 minutes remain
- Auto-submits when time expires

**Question Palette:**
- Shows all question numbers
- **Green**: Answered
- **White**: Not answered
- **Blue**: Current question
- Click any number to jump to that question

**Answering Questions:**

1. **Single Choice:**
   - Click on any option (A, B, C, or D)
   - Selected option will be highlighted

2. **Multiple Choice:**
   - Click multiple options
   - All correct options must be selected for full marks

3. **Numerical:**
   - Type your answer in the input box
   - Can include decimals

**Navigation:**
- Use "Previous" and "Next" buttons
- Or click question numbers in the palette
- Use "Submit Test" when finished

### Viewing Results

#### Immediate Results:
After submitting, you'll see:
- Total Score
- Percentage
- Correct Answers count
- Incorrect Answers count
- Unattempted Questions

#### Detailed Analysis:
Click "View Detailed Analysis" to see:
- Each question with your answer
- Correct answer marked in green
- Your incorrect answer marked in red
- Detailed explanation for each question
- Time taken per question

#### Performance Analytics:
Access from "My Results" to see:
- All past test results
- Subject-wise performance
- Average scores
- Progress over time

### Dashboard Features

Your student dashboard shows:
- Quick action buttons
- Active subscriptions
- Total tests taken
- Average score
- Subject-wise performance
- Recent test results

---

## For Admins

### Admin Login

1. Go to http://localhost:3000/login
2. Use admin credentials created during setup
3. Default: Phone: 9999999999, Password: admin123

### Dashboard Overview

The admin dashboard displays:
- Total number of students
- Total questions in database
- Active subscriptions count
- Questions breakdown by exam type (JEE/NEET)

### Uploading Questions

#### Method 1: Single Question Upload

1. Navigate to "Upload Questions"
2. Select "Single Question" mode
3. Fill in all fields:
   - Exam Type (JEE/NEET)
   - Subject
   - Chapter name
   - Question Type (Single/Multiple/Numerical)
   - Difficulty Level
   - Question text
   - Options (for MCQ)
   - Correct Answer
   - Explanation (optional but recommended)
4. Click "Upload Question"

#### Method 2: Bulk Upload (Recommended for multiple questions)

1. Navigate to "Upload Questions"
2. Select "Bulk Upload" mode
3. Paste JSON array of questions
4. Click "Upload Questions"

**Example JSON:**
```json
[
  {
    "examType": "JEE",
    "subject": "Physics",
    "chapter": "Mechanics",
    "questionType": "single",
    "question": "What is Newton's first law?",
    "options": ["Law of Inertia", "F=ma", "Action-Reaction", "Conservation"],
    "correctAnswer": "A",
    "explanation": "Newton's first law states that an object remains at rest or in uniform motion unless acted upon by an external force.",
    "difficulty": "easy",
    "marks": 4,
    "negativeMarks": -1
  }
]
```

**Use the provided `sample-questions.json` as a template!**

### Managing Questions

#### View Questions:
1. Go to "Manage Questions"
2. Use filters to find specific questions:
   - Filter by Exam Type
   - Filter by Subject
   - Filter by Chapter
3. Click "Clear Filters" to reset

#### Delete Questions:
1. Find the question in the list
2. Click the "Delete" button
3. Confirm deletion

#### Pagination:
- Use "Previous" and "Next" buttons to navigate
- Shows page number and total pages

### Viewing Students

#### Student List:
1. Navigate to "Students"
2. View all registered students with:
   - Name
   - Phone number
   - Active subscriptions
   - Registration date

#### Search Students:
- Use search bar to filter by name or phone
- Shows total and filtered count

#### Student Information:
Each student entry shows:
- **Green badge**: Active subscription with exam type
- **"No active"**: Student has no current subscription
- Registration date

---

## Payment Information

### Razorpay Integration

**Supported Payment Methods:**
- UPI (Google Pay, PhonePe, Paytm, etc.)
- Credit/Debit Cards
- Net Banking
- Wallets

**Payment Process:**
1. Select subscription plan
2. Click "Subscribe Now"
3. Razorpay checkout opens
4. Choose payment method
5. Complete payment
6. Automatic verification
7. Subscription activated immediately

**Payment Security:**
- All payments processed through Razorpay
- PCI DSS compliant
- No card details stored on our server
- Secure payment gateway

**Test Mode:**
During development, use Razorpay test mode:
- Test Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

---

## Tips & Best Practices

### For Students:

#### Test Strategy:
1. **Read questions carefully** - Especially note "NOT" or "EXCEPT"
2. **Use elimination** - Remove obviously wrong options first
3. **Time management** - Don't spend too long on one question
4. **Skip and return** - Use question palette to skip difficult questions
5. **Review before submit** - Check unanswered questions in palette

#### Practice Tips:
1. **Start with chapter-wise tests** - Master one chapter at a time
2. **Progress to subject tests** - Combine multiple chapters
3. **Mix difficulty levels** - Balance easy and hard questions
4. **Review explanations** - Learn from mistakes
5. **Track performance** - Monitor subject-wise analytics

#### Subscription Tips:
- Choose plan based on your exam target
- Annual subscription gives best value
- Subscribe early to maximize practice time

### For Admins:

#### Question Quality:
1. **Write clear questions** - Avoid ambiguity
2. **Provide good options** - Make distractors plausible
3. **Add explanations** - Help students learn
4. **Tag correctly** - Ensure proper subject/chapter assignment
5. **Mix difficulty** - Include easy, medium, and hard questions

#### Question Balance:
- Maintain equal distribution across chapters
- Include all three question types
- Cover all difficulty levels
- Update regularly with new questions

#### Student Management:
- Monitor subscription status
- Track student engagement
- Respond to issues promptly
- Update question bank based on exam trends

### Technical Tips:

#### Browser Recommendations:
- Use latest Chrome, Firefox, or Edge
- Clear cache if facing issues
- Enable JavaScript

#### Network:
- Stable internet required during tests
- Auto-save feature protects progress
- Don't refresh during test

#### Troubleshooting:
- Check console for errors (F12)
- Verify MongoDB is running
- Ensure all environment variables are set
- Check server logs for API errors

---

## Frequently Asked Questions

### Students:

**Q: Can I pause a test?**
A: No, once started, tests must be completed or will auto-submit when time expires.

**Q: Can I review a test after submission?**
A: Yes! Detailed analysis with correct answers and explanations is available immediately.

**Q: What happens if my internet disconnects?**
A: Reconnect and continue. Progress is saved, but timer continues running.

**Q: Can I take the same test again?**
A: Each generated test is unique. Generate a new test with same parameters for practice.

**Q: How is my score calculated?**
A: +4 for correct, -1 for incorrect, 0 for unattempted.

### Admins:

**Q: Can I edit questions after uploading?**
A: Currently, you need to delete and re-upload. Edit feature coming soon.

**Q: How many questions should I upload?**
A: Minimum 50 per subject/chapter for good test variety. More is better.

**Q: Can students see who uploaded questions?**
A: No, student view is anonymous.

**Q: How do I backup questions?**
A: Export from MongoDB or use the API to fetch and save questions.

---

## Support

For technical support or questions:
- Check SETUP_GUIDE.md for technical issues
- Review server logs for error messages
- Verify environment configuration
- Check MongoDB connection

---

**Happy Learning! Good Luck with your preparation! 🎓**