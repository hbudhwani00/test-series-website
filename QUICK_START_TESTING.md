# Quick Start - Testing New Features

## 🚀 Getting Started

This guide will help you quickly test the new Manual Subscription Management and Scheduled Tests features.

---

## Prerequisites

1. **Backend running:** `cd backend && npm start` (Port 5000)
2. **Frontend running:** `cd client && npm start` (Port 3001)
3. **MongoDB running:** Make sure MongoDB is connected
4. **Admin account:** You need admin credentials to test

---

## Step 1: Login as Admin

1. Open browser: `http://localhost:3001`
2. Click "Login"
3. Use admin credentials:
   ```
   Phone: [Your admin phone]
   Password: [Your admin password]
   ```
4. You should see new navigation items: "Subscriptions" and "Schedule"

---

## Step 2: Test Manual Subscription Management

### A. View All Students

1. Click **"Subscriptions"** in navigation
2. You should see all registered students
3. Each student shows:
   - Name, email, phone
   - Existing subscriptions (if any)
   - Grant Subscription button

### B. Grant a New Subscription

1. Find a student (or register a new one first)
2. Click **"Grant Subscription"** button
3. Fill the form:
   - **Exam Type:** JEE_MAIN
   - **Expiry Date:** Select a future date (e.g., 1 year from now)
   - **Amount:** 0 (for free access)
4. Click **"Grant Subscription"**
5. ✅ Success toast should appear
6. Refresh - subscription appears under student

### C. Update Existing Subscription

1. Find student with subscription
2. Click **"Edit"** on subscription
3. Change expiry date to different date
4. Toggle "Active" checkbox if needed
5. Click **"Update Subscription"**
6. ✅ Changes reflected immediately

### D. Test Filtering

1. Use search box: Type student name/email
2. Filter by Exam Type: Select "JEE_MAIN"
3. Filter by Status: Select "Active"
4. Click "Clear Filters" to reset

### E. Delete Subscription (Optional)

1. Click **"Delete"** on any subscription
2. Confirm deletion
3. ✅ Subscription removed

---

## Step 3: Create a Test (Required for Scheduling)

Before scheduling, you need a test ID. If you don't have tests:

### Option A: Use Existing Test ID

1. Open MongoDB Compass or terminal
2. Find a test ID from `tests` collection
3. Copy the ObjectId (e.g., `507f1f77bcf86cd799439011`)

### Option B: Create Demo Test via API

```bash
# Using cURL (Git Bash or WSL on Windows)
curl -X POST http://localhost:5000/api/admin/demo-tests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JEE Physics Mock Test",
    "examType": "JEE_MAIN",
    "subject": "Physics",
    "chapter": "Demo Test",
    "questionCount": 5,
    "duration": 15
  }'
```

### Option C: Upload Questions First

1. Go to **"Upload Questions"**
2. Upload 5-10 questions for a subject
3. Then tests can be generated from those questions

---

## Step 4: Test Scheduled Tests

### A. Create One-Time Schedule

1. Click **"Schedule"** in navigation
2. Click **"+ Create Schedule"** button
3. Fill form:
   - **Test ID:** Paste test ObjectId from Step 3
   - **Exam Type:** JEE_MAIN
   - **Schedule Type:** One Time
   - **Start Date:** Tomorrow
4. Click **"Create Schedule"**
5. ✅ Success message shows number of dates created (should be 1)

### B. Create Alternate Days Schedule

1. Click **"+ Create Schedule"**
2. Fill form:
   - **Test ID:** Same test ID
   - **Exam Type:** JEE_MAIN
   - **Schedule Type:** Alternate Days
   - **Start Date:** Today
   - **End Date:** 30 days from now
3. Click **"Create Schedule"**
4. ✅ Should create ~15 scheduled dates

### C. Create Weekend Schedule

1. Click **"+ Create Schedule"**
2. Fill form:
   - **Test ID:** Same test ID
   - **Exam Type:** NEET
   - **Schedule Type:** Weekends Only
   - **Start Date:** This week
   - **End Date:** 2 months from now
3. Click **"Create Schedule"**
4. ✅ Should create ~16-17 dates (weekends only)

### D. Create Custom Schedule (Tue + Thu)

1. Click **"+ Create Schedule"**
2. Fill form:
   - **Test ID:** Same test id
   - **Exam Type:** JEE_MAIN
   - **Schedule Type:** Custom Days
   - **Custom Days:** Click on **Tue** and **Thu** buttons (they turn blue)
   - **Start Date:** This week
   - **End Date:** 1 month from now
3. Click **"Create Schedule"**
4. ✅ Should create ~8 dates (only Tuesdays and Thursdays)

### E. Manage Schedules

1. View all schedules in list
2. Click **"Deactivate"** to pause a schedule
3. Click **"Activate"** to resume
4. Click **"Delete"** to remove schedule permanently

---

## Step 5: Test Student View

### A. Logout and Login as Student

1. Logout from admin account
2. Login as a student who has subscription (from Step 2)
3. Go to **Student Dashboard**

### B. View Scheduled Tests

**Option 1: Add to Dashboard (Requires code modification)**

Edit `client/src/pages/student/Dashboard.js`:

```javascript
import UpcomingScheduledTests from '../../components/UpcomingScheduledTests';

// Add inside dashboard grid:
<UpcomingScheduledTests />
```

**Option 2: Test via API directly**

```bash
curl -X GET http://localhost:5000/api/tests/scheduled/upcoming \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Expected Response:**
```json
{
  "scheduledTests": [
    {
      "_id": "...",
      "test": {
        "_id": "...",
        "title": "JEE Physics Mock Test",
        "examType": "JEE_MAIN",
        "subject": "Physics",
        "duration": 15,
        "totalMarks": 20
      },
      "scheduleType": "alternate-days",
      "upcomingDates": [
        { "date": "2024-01-15T00:00:00.000Z", "isCompleted": false },
        { "date": "2024-01-17T00:00:00.000Z", "isCompleted": false },
        { "date": "2024-01-19T00:00:00.000Z", "isCompleted": false }
      ]
    }
  ],
  "total": 1
}
```

---

## Step 6: Verify Everything Works

### Checklist:

- [ ] Admin can view all students with subscriptions
- [ ] Admin can grant new subscription to student
- [ ] Admin can update subscription expiry date
- [ ] Admin can toggle subscription active/inactive
- [ ] Admin can delete subscription
- [ ] Filters work (search, exam type, status)
- [ ] Admin can create one-time scheduled test
- [ ] Admin can create alternate days schedule
- [ ] Admin can create weekends schedule
- [ ] Admin can create custom days schedule
- [ ] Scheduled tests show in admin list
- [ ] Admin can activate/deactivate schedules
- [ ] Admin can delete schedules
- [ ] Student with subscription sees upcoming tests (via API)
- [ ] Student without subscription sees no tests
- [ ] All forms validate correctly
- [ ] Success/error toasts appear
- [ ] Loading spinners work
- [ ] Mobile responsive design works

---

## Common Testing Scenarios

### Scenario 1: Student Gets Free Trial

**Steps:**
1. Student registers on platform
2. Admin goes to Subscriptions
3. Admin grants JEE_MAIN subscription for 7 days
4. Student can now access JEE_MAIN tests
5. After 7 days, subscription auto-expires

### Scenario 2: Coaching Institute Batch Schedule

**Steps:**
1. Institute creates 50 student accounts
2. Admin grants all 50 students NEET subscription (bulk later)
3. Admin creates weekend schedule for 3 months
4. All students see same tests on weekends
5. Easy to track batch progress

### Scenario 3: Promotional Campaign

**Steps:**
1. Run "Free 30 Days" promotion
2. Students register
3. Admin filters by registration date
4. Admin grants 30-day subscriptions to all new users
5. Monitor conversion to paid plans

---

## Troubleshooting

### Issue: "Test not found" when creating schedule

**Solution:**
- Verify test ID is correct
- Check test exists in MongoDB
- Test ID should be 24-character hex string

**How to get valid test ID:**
```bash
# MongoDB Shell
use test_series_db
db.tests.findOne()._id
```

### Issue: Student doesn't see scheduled tests

**Solutions:**
1. Verify student has active subscription for that exam type
2. Check subscription expiry date is in future
3. Check scheduled test is active (isActive: true)
4. Verify exam type matches between subscription and schedule

### Issue: Scheduled dates not generated

**Solutions:**
1. Ensure end date is after start date
2. For custom schedule, make sure at least one day is selected
3. Check backend logs for errors

### Issue: Modal doesn't close after submit

**Solutions:**
1. Check browser console for errors
2. Verify API response is successful
3. Ensure form validation passes

---

## API Endpoints Summary

### Subscription Management:
- `GET /api/admin/subscriptions` - List all students
- `POST /api/admin/subscriptions/:studentId` - Grant subscription
- `PUT /api/admin/subscriptions/:studentId/:subscriptionId` - Update
- `DELETE /api/admin/subscriptions/:studentId/:subscriptionId` - Delete

### Scheduled Tests:
- `POST /api/admin/scheduled-tests` - Create schedule
- `GET /api/admin/scheduled-tests` - List all schedules
- `PUT /api/admin/scheduled-tests/:id` - Update schedule
- `DELETE /api/admin/scheduled-tests/:id` - Delete schedule
- `GET /api/tests/scheduled/upcoming` - Student view (auth required)

---

## Performance Testing

### Load Test Scheduled Tests Generation:

```javascript
// Test with large date range
{
  "scheduleType": "alternate-days",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
// Should generate ~183 dates in < 1 second
```

### Bulk Subscription Update:

```bash
# Update 100 students at once (future feature)
curl -X POST http://localhost:5000/api/admin/subscriptions/bulk-update \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentIds": ["id1", "id2", ...], 
    "examType": "JEE_MAIN",
    "extendDays": 30
  }'
```

---

## Next Steps

After testing:

1. **Integrate UpcomingScheduledTests into Student Dashboard**
2. **Add notification system** for upcoming tests
3. **Create admin analytics** for subscription revenue
4. **Add calendar view** for scheduled tests
5. **Implement email notifications**

---

## Support

If you encounter issues:
1. Check backend console for errors
2. Check browser console (F12)
3. Verify MongoDB connection
4. Check all environment variables
5. Restart both frontend and backend

---

**Happy Testing! 🎉**
