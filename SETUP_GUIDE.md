# JEE & NEET Test Series - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Backend Dependencies

```powershell
npm install
```

### 2. Install Frontend Dependencies

```powershell
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```powershell
Copy-Item .env.example .env
```

Edit the `.env` file and add your configuration:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/test-series
JWT_SECRET=your_secure_jwt_secret_here_use_a_long_random_string
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```powershell
# If MongoDB is installed as a service, it should start automatically
# Otherwise, start it manually:
mongod
```

### 5. Create Admin Account

Once the server is running, create an admin account by making a POST request:

**Using PowerShell:**
```powershell
$body = @{
    name = "Admin"
    phone = "9999999999"
    password = "admin123"
    secretKey = "CREATE_ADMIN_SECRET_2024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/create-admin" -Method POST -Body $body -ContentType "application/json"
```

**Or using Postman/Thunder Client:**
- URL: `http://localhost:5000/api/auth/create-admin`
- Method: POST
- Body (JSON):
```json
{
  "name": "Admin",
  "phone": "9999999999",
  "password": "admin123",
  "secretKey": "CREATE_ADMIN_SECRET_2024"
}
```

### 6. Run the Application

**Option A: Run Backend and Frontend Separately**

Terminal 1 (Backend):
```powershell
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd client
npm start
```

**Option B: Run Both Concurrently**
```powershell
npm run dev-full
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Razorpay Payment Integration Setup

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your API keys from the Dashboard
3. Add keys to `.env` file
4. For frontend, create `client\.env`:

```
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

**Note:** Use test keys during development. Razorpay provides test keys that work in test mode.

## Default Admin Login

After creating admin account:
- Phone: 9999999999
- Password: admin123

## Features Overview

### Admin Features
1. **Upload Questions**
   - Single question upload with form
   - Bulk upload using JSON
   
2. **Manage Questions**
   - View all questions with filters
   - Delete questions
   - Filter by exam type, subject, chapter

3. **View Students**
   - See all registered students
   - View their subscription status
   - Search by name or phone

4. **Dashboard**
   - Total students count
   - Total questions count
   - Active subscriptions
   - Questions by exam type

### Student Features
1. **Registration & Login**
   - Register with name, phone, and password
   - Login to access dashboard

2. **Exam Selection**
   - Choose between JEE and NEET

3. **Subscription Plans**
   - JEE Main: ₹299 (including GST)
   - JEE Main + Advanced: ₹399 (including GST)
   - NEET: ₹399 (including GST)
   - Integrated payment via Razorpay

4. **AI-Powered Test Generation**
   - Select subject and chapter
   - Choose difficulty level
   - Customize number of questions
   - Auto-generated balanced tests (50% single choice, 30% multiple choice, 20% numerical)

5. **Take Tests**
   - Interactive test interface
   - Timer countdown
   - Question palette
   - Navigation between questions
   - Auto-submit on time expiry

6. **Results & Analytics**
   - Immediate results after submission
   - Detailed answer review
   - Correct/incorrect marking
   - Explanations for each question
   - Subject-wise performance analytics
   - Historical test results

## Sample Question Format for Bulk Upload

```json
[
  {
    "examType": "JEE",
    "subject": "Physics",
    "chapter": "Mechanics",
    "questionType": "single",
    "question": "What is the SI unit of force?",
    "options": ["Newton", "Joule", "Watt", "Pascal"],
    "correctAnswer": "A",
    "explanation": "Newton is the SI unit of force, defined as kg⋅m⋅s⁻²",
    "difficulty": "easy",
    "marks": 4,
    "negativeMarks": -1
  },
  {
    "examType": "JEE",
    "subject": "Mathematics",
    "chapter": "Algebra",
    "questionType": "multiple",
    "question": "Which of the following are prime numbers?",
    "options": ["2", "4", "5", "9"],
    "correctAnswer": ["A", "C"],
    "explanation": "2 and 5 are prime numbers as they have only two factors",
    "difficulty": "medium"
  },
  {
    "examType": "JEE",
    "subject": "Chemistry",
    "chapter": "Atomic Structure",
    "questionType": "numerical",
    "question": "What is the atomic number of Carbon?",
    "options": [],
    "correctAnswer": 6,
    "explanation": "Carbon has 6 protons, hence atomic number is 6",
    "difficulty": "easy"
  }
]
```

## Troubleshooting

### MongoDB Connection Issues
```powershell
# Check if MongoDB is running
Get-Service MongoDB

# Start MongoDB service
Start-Service MongoDB
```

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Clear Node Modules and Reinstall
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client\node_modules
npm install
cd client
npm install
cd ..
```

## Development Tips

1. **Hot Reload**: Both backend (nodemon) and frontend (React) support hot reload
2. **API Testing**: Use Postman or Thunder Client VS Code extension
3. **Database Viewing**: Use MongoDB Compass to view and manage data
4. **Logging**: Check terminal for backend logs and browser console for frontend

## Production Deployment

1. **Build Frontend**:
```powershell
cd client
npm run build
```

2. **Environment Variables**: Set production values in `.env`
3. **MongoDB**: Use MongoDB Atlas or hosted MongoDB
4. **Razorpay**: Switch to live API keys
5. **Deploy**: Use services like Heroku, AWS, DigitalOcean, or Vercel

## Support

For issues or questions:
- Check logs in terminal
- Verify MongoDB is running
- Ensure all environment variables are set
- Check that ports 3000 and 5000 are available

## License

This project is for educational purposes.
