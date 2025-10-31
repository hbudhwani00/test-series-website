# JEE & NEET Test Series Application

A comprehensive test series platform for JEE and NEET exam preparation with separate admin and student portals, AI-powered test generation, and integrated payment system.

## 🚀 Quick Start

### Method 1: Using Quick Start Script (Recommended)

1. **Run the start script:**
   ```powershell
   .\start.ps1
   ```
   This will automatically:
   - Check prerequisites
   - Install dependencies
   - Create .env file
   - Start MongoDB
   - Launch the application

2. **Create admin account (in a new terminal):**
   ```powershell
   .\create-admin.ps1
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Method 2: Manual Setup

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed manual installation instructions.

## ✨ Features

### 👨‍💼 Admin Features
- ✅ Upload questions individually or in bulk (JSON format)
- ✅ View and manage all questions with filters
- ✅ View all registered students with their details (name, phone)
- ✅ Dashboard with analytics (total students, questions, subscriptions)
- ✅ Subject and chapter-wise question organization
- ✅ Delete questions
- ✅ Monitor active subscriptions

### 👨‍🎓 Student Features
- ✅ User registration and login with phone number
- ✅ Choose between JEE and NEET exams
- ✅ **Subscription Plans:**
  - JEE Main: ₹299/year (including GST)
  - JEE Main + Advanced: ₹399/year (including GST)
  - NEET: ₹399/year (including GST)
- ✅ **AI-Powered Test Generation:**
  - Select subject and chapter
  - Choose difficulty level
  - Customize question count
  - Auto-balanced question types (50% single, 30% multiple, 20% numerical)
- ✅ **Interactive Test Interface:**
  - Timer with countdown
  - Question palette showing answered/unanswered
  - Navigation between questions
  - Auto-submit on time expiry
  - Support for Single Choice, Multiple Choice, and Numerical questions
- ✅ **Results & Analytics:**
  - Immediate results after submission
  - Detailed answer review with explanations
  - Correct/incorrect marking
  - Subject-wise performance tracking
  - Historical test results
  - Performance analytics dashboard

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: React.js, React Router
- **Authentication**: JWT (JSON Web Tokens)
- **Payment Gateway**: Razorpay
- **Styling**: Custom CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- Razorpay account (for payment integration)

## 📦 Project Structure

```
test-series/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Express server
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   │   ├── admin/   # Admin pages
│   │   │   └── student/ # Student pages
│   │   ├── services/    # API services
│   │   └── App.js
│   └── package.json
├── .env.example
├── start.ps1            # Quick start script
├── create-admin.ps1     # Admin creation script
├── sample-questions.json # Sample questions
├── SETUP_GUIDE.md       # Detailed setup guide
└── README.md
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/test-series
JWT_SECRET=your_secure_jwt_secret_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
```

Create `client/.env`:
```env
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 📚 API Documentation

### Authentication Endpoints

#### Register Student
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Student Name",
  "phone": "1234567890",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "1234567890",
  "password": "password123"
}
```

#### Create Admin
```http
POST /api/auth/create-admin
Content-Type: application/json

{
  "name": "Admin",
  "phone": "9999999999",
  "password": "admin123",
  "secretKey": "CREATE_ADMIN_SECRET_2024"
}
```

### Admin Endpoints (Requires Admin Auth)

#### Upload Single Question
```http
POST /api/admin/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "examType": "JEE",
  "subject": "Physics",
  "chapter": "Mechanics",
  "questionType": "single",
  "question": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "explanation": "Explanation",
  "difficulty": "medium"
}
```

#### Bulk Upload Questions
```http
POST /api/admin/questions/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "questions": [...]
}
```

#### Get All Students
```http
GET /api/admin/students
Authorization: Bearer <token>
```

### Student Endpoints (Requires Auth)

#### Generate Test
```http
POST /api/tests/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "examType": "JEE",
  "subject": "Physics",
  "chapter": "Mechanics",
  "difficulty": "medium",
  "questionCount": 30
}
```

#### Submit Test
```http
POST /api/results/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "testId": "test_id",
  "answers": [
    {
      "questionId": "question_id",
      "answer": "A",
      "timeTaken": 120
    }
  ],
  "timeTaken": 3600
}
```

## 📝 Question Format

### Single Choice Question
```json
{
  "examType": "JEE",
  "subject": "Physics",
  "chapter": "Mechanics",
  "questionType": "single",
  "question": "What is the SI unit of force?",
  "options": ["Newton", "Joule", "Watt", "Pascal"],
  "correctAnswer": "A",
  "explanation": "Newton is the SI unit of force",
  "difficulty": "easy",
  "marks": 4,
  "negativeMarks": -1
}
```

### Multiple Choice Question
```json
{
  "examType": "JEE",
  "subject": "Mathematics",
  "chapter": "Algebra",
  "questionType": "multiple",
  "question": "Which are prime numbers?",
  "options": ["2", "4", "5", "9"],
  "correctAnswer": ["A", "C"],
  "explanation": "2 and 5 are prime numbers",
  "difficulty": "medium"
}
```

### Numerical Question
```json
{
  "examType": "JEE",
  "subject": "Chemistry",
  "chapter": "Atomic Structure",
  "questionType": "numerical",
  "question": "Atomic number of Carbon?",
  "options": [],
  "correctAnswer": 6,
  "explanation": "Carbon has 6 protons",
  "difficulty": "easy"
}
```

## 🎯 Usage Guide

### For Admins:

1. **Login** with admin credentials
2. **Upload Questions:**
   - Single: Use the form
   - Bulk: Use JSON format (see sample-questions.json)
3. **Manage Questions:** View, filter, and delete questions
4. **Monitor Students:** See all registered students and their subscriptions

### For Students:

1. **Register** with name, phone, and password
2. **Login** to access dashboard
3. **Select Exam Type** (JEE or NEET)
4. **Subscribe** to a plan using Razorpay
5. **Generate Test:**
   - Choose subject and chapter
   - Select difficulty
   - Set number of questions
6. **Take Test:**
   - Use question palette
   - Navigate freely
   - Submit before time expires
7. **View Results:**
   - See detailed analysis
   - Review answers and explanations
   - Track performance over time

## 🔧 Development

### Run Backend Only
```powershell
npm run dev
```

### Run Frontend Only
```powershell
cd client
npm start
```

### Run Both Concurrently
```powershell
npm run dev-full
```

## 🚀 Production Deployment

1. Build frontend:
   ```powershell
   cd client
   npm run build
   ```

2. Set production environment variables
3. Use MongoDB Atlas for database
4. Switch to Razorpay live keys
5. Deploy to Heroku, AWS, DigitalOcean, or similar

## 🐛 Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting steps.

### Common Issues:

**MongoDB not running:**
```powershell
Start-Service MongoDB
```

**Port already in use:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Dependencies issues:**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

## 📄 License

This project is for educational purposes.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For any issues:
1. Check the SETUP_GUIDE.md
2. Verify MongoDB is running
3. Check environment variables
4. Review terminal logs

## 🎓 Sample Data

Use `sample-questions.json` to quickly populate your database with test questions covering:
- JEE: Physics, Chemistry, Mathematics
- NEET: Physics, Chemistry, Biology

Upload via Admin panel > Upload Questions > Bulk Upload

---

**Made with ❤️ for JEE & NEET aspirants**
