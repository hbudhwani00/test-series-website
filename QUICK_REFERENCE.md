# Quick Reference Card

## 🚀 Starting the Application

```powershell
# Quick start (recommended)
.\start.ps1

# Or manually
npm run dev-full
```

## 👤 Create Admin Account

```powershell
.\create-admin.ps1
```

**Default Admin Credentials:**
- Phone: 9999999999
- Password: admin123

## 🌐 Access URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📊 Project Structure

```
test-series/
├── backend/              # Node.js + Express API
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication
│   └── server.js        # Server entry point
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Page components
│       │   ├── admin/   # Admin pages
│       │   └── student/ # Student pages
│       ├── components/  # Reusable components
│       ├── context/     # Auth context
│       └── services/    # API calls
├── .env                 # Environment variables
├── start.ps1           # Quick start script
├── create-admin.ps1    # Admin creation
└── sample-questions.json # Sample data
```

## 🔑 Key Features

### Admin Portal
✅ Upload questions (single/bulk)
✅ Manage question bank
✅ View students
✅ Monitor subscriptions
✅ Dashboard analytics

### Student Portal
✅ Register & login
✅ Choose JEE/NEET
✅ Subscribe (₹299-₹399)
✅ AI test generation
✅ Take tests (SCQ, MCQ, Numerical)
✅ View results & analytics

## 💡 Quick Commands

### Installation
```powershell
npm install
cd client && npm install
```

### Development
```powershell
# Backend only
npm run dev

# Frontend only
cd client && npm start

# Both together
npm run dev-full
```

### MongoDB
```powershell
# Start service
Start-Service MongoDB

# Check status
Get-Service MongoDB
```

## 📝 Sample API Calls

### Register Student
```bash
POST http://localhost:5000/api/auth/register
{
  "name": "John Doe",
  "phone": "1234567890",
  "password": "pass123"
}
```

### Upload Question (Admin)
```bash
POST http://localhost:5000/api/admin/questions
Authorization: Bearer <token>
{
  "examType": "JEE",
  "subject": "Physics",
  "chapter": "Mechanics",
  "questionType": "single",
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "difficulty": "medium"
}
```

### Generate Test
```bash
POST http://localhost:5000/api/tests/generate
Authorization: Bearer <token>
{
  "examType": "JEE",
  "subject": "Physics",
  "questionCount": 30
}
```

## 🎯 Question Types

### Single Choice (50%)
- One correct answer
- Options: A, B, C, D
- +4 marks, -1 negative

### Multiple Choice (30%)
- Multiple correct answers
- Must select all correct
- +4 marks, -1 negative

### Numerical (20%)
- Numeric answer
- Type the value
- +4 marks, -1 negative

## 💳 Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| JEE Main | ₹299/year | Physics, Chemistry, Math |
| JEE M+A | ₹399/year | Main + Advanced |
| NEET | ₹399/year | Physics, Chemistry, Biology |

*All prices include GST*

## 🔧 Troubleshooting

### MongoDB not running
```powershell
Start-Service MongoDB
```

### Port in use
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Clear cache
```powershell
Remove-Item -Recurse node_modules
npm install
```

### API not responding
1. Check .env file exists
2. Verify MongoDB is running
3. Check server logs
4. Verify JWT_SECRET is set

## 📚 Important Files

- **README.md** - Project overview
- **SETUP_GUIDE.md** - Detailed setup
- **USER_GUIDE.md** - Complete user manual
- **.env** - Configuration
- **sample-questions.json** - Example questions

## 🎓 Test Strategy Tips

1. **Start Easy** - Begin with chapter-wise tests
2. **Mix Difficulty** - Include all levels
3. **Time Management** - 2 mins per question
4. **Review Answers** - Learn from explanations
5. **Track Progress** - Monitor analytics

## 🛠️ Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Auth:** JWT
- **Payment:** Razorpay

## 📞 Getting Help

1. Check SETUP_GUIDE.md
2. Review USER_GUIDE.md
3. Check server logs (terminal)
4. Verify environment variables
5. Test MongoDB connection

## 🎉 Success Checklist

- [ ] MongoDB installed & running
- [ ] Dependencies installed (backend & frontend)
- [ ] .env file created & configured
- [ ] Admin account created
- [ ] Sample questions uploaded
- [ ] Test subscription flow
- [ ] Generate and take a test
- [ ] View results

---

**🚀 You're all set! Happy Testing!**

*For detailed instructions, refer to SETUP_GUIDE.md and USER_GUIDE.md*
