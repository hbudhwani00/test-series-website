# Subscription Management & Scheduled Tests - Implementation Guide

## 📋 Overview

This document covers the new features added to the Test Series platform:
1. **Manual Subscription Management** - Admin can grant, modify, and manage student subscriptions
2. **Scheduled Tests** - Admin can schedule tests for specific dates, alternate days, weekends, or custom schedules

---

## 🎯 Features

### 1. Manual Subscription Management

**Location:** `/admin/subscriptions`

**Capabilities:**
- View all students with their subscription details
- Grant new subscriptions manually (without payment)
- Update existing subscriptions (change expiry date, toggle active status)
- Delete subscriptions
- Search and filter students by exam type, status, name, email, or phone
- Bulk subscription updates (extend multiple subscriptions at once)

**Use Cases:**
- Give free access to students for trial periods
- Extend subscriptions for promotional offers
- Manual renewal when payment gateway is down
- Admin-managed scholarship programs
- Compensate students for technical issues

---

### 2. Scheduled Tests

**Location:** `/admin/schedule-tests`

**Schedule Types:**

1. **One-Time Schedule**
   - Schedule a single test for a specific date
   - Perfect for mock tests or special exams

2. **Alternate Days**
   - Automatically schedule tests every 2 days
   - Ideal for regular practice schedules
   - Example: Mon, Wed, Fri, Sun...

3. **Weekends Only**
   - Schedule tests only on Saturdays and Sundays
   - Perfect for working students

4. **Custom Days**
   - Choose specific days of the week
   - Example: Every Tuesday and Thursday
   - Maximum flexibility

**Capabilities:**
- Create recurring test schedules
- Set start and end dates for series
- View all scheduled tests with upcoming dates
- Activate/deactivate schedules
- Delete schedules
- Students automatically see upcoming scheduled tests

---

## 🔧 Backend Implementation

### New Model: ScheduledTest

**File:** `backend/models/ScheduledTest.js`

```javascript
{
  testId: ObjectId (ref: Test),
  examType: String (JEE_MAIN, JEE_MAIN_ADVANCED, NEET),
  scheduleType: String (one-time, alternate-days, weekends, custom),
  startDate: Date,
  endDate: Date,
  scheduledDates: [{ date: Date, isCompleted: Boolean }],
  customDays: [Number], // 0-6 (Sunday-Saturday)
  isActive: Boolean,
  createdBy: ObjectId (ref: User)
}
```

### New Admin Routes

**File:** `backend/routes/admin.js`

#### Subscription Management Routes:

1. **GET** `/api/admin/subscriptions`
   - Get all students with subscription details
   - Query params: `examType`, `status`, `search`

2. **POST** `/api/admin/subscriptions/:studentId`
   - Grant or add new subscription to student
   - Body: `{ examType, expiryDate, amount }`

3. **PUT** `/api/admin/subscriptions/:studentId/:subscriptionId`
   - Update existing subscription
   - Body: `{ expiryDate, isActive, amount }`

4. **DELETE** `/api/admin/subscriptions/:studentId/:subscriptionId`
   - Remove subscription from student

5. **POST** `/api/admin/subscriptions/bulk-update`
   - Extend multiple subscriptions at once
   - Body: `{ studentIds: [], examType, extendDays }`

#### Scheduled Tests Routes:

6. **POST** `/api/admin/scheduled-tests`
   - Create new scheduled test
   - Body: `{ testId, examType, scheduleType, startDate, endDate, customDays }`
   - Automatically generates date array based on schedule type

7. **GET** `/api/admin/scheduled-tests`
   - Get all scheduled tests
   - Query params: `examType`, `isActive`

8. **GET** `/api/admin/scheduled-tests/upcoming`
   - Get upcoming scheduled tests (for admin preview)

9. **PUT** `/api/admin/scheduled-tests/:id`
   - Update scheduled test details
   - Body: Any field from ScheduledTest model

10. **DELETE** `/api/admin/scheduled-tests/:id`
    - Delete scheduled test

11. **PUT** `/api/admin/scheduled-tests/:id/complete/:dateId`
    - Mark a specific scheduled date as completed

### New Student Route

**File:** `backend/routes/tests.js`

12. **GET** `/api/tests/scheduled/upcoming`
    - Students can view their upcoming scheduled tests
    - Automatically filters by student's active subscriptions
    - Returns next 10 scheduled tests with 3 upcoming dates each

---

## 🎨 Frontend Implementation

### New Admin Pages

#### 1. ManageSubscriptions Component

**File:** `client/src/pages/admin/ManageSubscriptions.js`

**Features:**
- Student list with all subscription details
- Real-time search and filtering
- Grant subscription modal with form
- Edit subscription modal (pre-filled)
- Delete confirmation dialog
- Status badges (Active, Expired, Inactive)
- Exam type badges (JEE Main, NEET, etc.)
- Responsive design with Framer Motion animations

**Key Components Used:**
- `Card` - Container for student info
- `Button` - All action buttons
- `Badge` - Status and exam type indicators
- `LoadingSpinner` - Loading states
- `AnimatePresence` - Modal animations

#### 2. ScheduleTests Component

**File:** `client/src/pages/admin/ScheduleTests.js`

**Features:**
- List all scheduled tests with details
- Create schedule modal with:
  - Test ID input (manual entry)
  - Exam type selector
  - Schedule type selector
  - Date range picker
  - Custom days selector (visual day picker)
- Preview upcoming dates
- Activate/deactivate schedules
- Delete schedules
- Shows schedule type, dates, and test details

**Schedule Creation Flow:**
1. Click "Create Schedule" button
2. Enter test ID (get from tests collection)
3. Select exam type
4. Choose schedule type
5. Pick start/end dates
6. For custom: select specific weekdays
7. Backend auto-generates date array
8. Save and view in list

#### 3. UpcomingScheduledTests Component

**File:** `client/src/components/UpcomingScheduledTests.js`

**Features:**
- Shows students their upcoming scheduled tests
- Displays next 3 dates for each test
- Test details (subject, duration, marks)
- Schedule type badges
- Link to take test
- Beautiful gradient cards
- Can be embedded in Student Dashboard

---

## 🚀 Usage Guide

### For Admins

#### Granting Manual Subscription:

1. Navigate to `/admin/subscriptions`
2. Find student or use search
3. Click "Grant Subscription" button
4. Fill form:
   - Select exam type
   - Choose expiry date
   - Optional: enter amount
5. Submit - subscription added instantly

#### Updating Subscription:

1. In subscriptions list, find student
2. Click "Edit" on specific subscription
3. Modify expiry date or toggle active status
4. Save changes

#### Creating Scheduled Test:

1. Navigate to `/admin/schedule-tests`
2. Click "Create Schedule"
3. Get test ID from your tests collection:
   ```bash
   # In MongoDB or via admin panel
   # Copy the _id of an existing test
   ```
4. Enter test details:
   - Test ID: `507f1f77bcf86cd799439011`
   - Exam Type: JEE_MAIN
   - Schedule: Alternate Days
   - Start: Today
   - End: 3 months later
5. Submit - dates auto-generated
6. Students with matching subscriptions see it

#### Example Schedules:

**Mock Test Series (Weekends):**
```
Schedule Type: Weekends
Start Date: 2024-01-01
End Date: 2024-03-31
Result: 26 tests (every Sat & Sun for 3 months)
```

**Daily Practice (Alternate Days):**
```
Schedule Type: Alternate Days
Start Date: 2024-01-01
End Date: 2024-02-01
Result: 16 tests (every other day for 1 month)
```

**Weekly Test (Custom - Every Sunday):**
```
Schedule Type: Custom
Custom Days: [0] (Sunday)
Start Date: 2024-01-01
End Date: 2024-06-01
Result: ~22 tests (every Sunday for 5 months)
```

### For Students

#### Viewing Scheduled Tests:

1. Login to student dashboard
2. See "Upcoming Scheduled Tests" card
3. Shows next scheduled tests for your active subscriptions
4. Click "View Test Details" to start

**Note:** Students only see tests for exams they have active subscriptions for.

---

## 📊 Database Schema Changes

### User Model (No Changes)
Existing `subscriptions` array continues to work:
```javascript
subscriptions: [{
  examType: String,
  purchaseDate: Date,
  expiryDate: Date,
  paymentId: String,
  orderId: String,
  amount: Number,
  isActive: Boolean
}]
```

### New Collection: scheduledtests
```javascript
{
  _id: ObjectId,
  testId: ObjectId,
  examType: "JEE_MAIN",
  scheduleType: "alternate-days",
  startDate: ISODate("2024-01-01"),
  endDate: ISODate("2024-03-31"),
  scheduledDates: [
    { date: ISODate("2024-01-01"), isCompleted: false },
    { date: ISODate("2024-01-03"), isCompleted: false },
    ...
  ],
  customDays: [],
  isActive: true,
  createdBy: ObjectId,
  createdAt: ISODate("2024-01-01")
}
```

---

## 🔐 Security & Validation

### Backend Validations:

1. **Subscription Management:**
   - Only admins can access subscription routes
   - Student ID must exist
   - Exam type must be valid enum
   - Expiry date must be in future
   - Subscription ID must belong to student

2. **Scheduled Tests:**
   - Only admins can create/modify schedules
   - Test ID must exist in database
   - End date must be after start date
   - Custom days must be 0-6
   - At least one day selected for custom schedule

### Frontend Validations:

1. Form field requirements enforced
2. Date pickers prevent past dates
3. Confirmation dialogs for delete actions
4. Loading states prevent duplicate submissions
5. Error messages for failed operations

---

## 🎯 API Testing Examples

### Grant Subscription (Postman/cURL):

```bash
curl -X POST http://localhost:5000/api/admin/subscriptions/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "examType": "JEE_MAIN",
    "expiryDate": "2024-12-31",
    "amount": 0
  }'
```

### Create Scheduled Test:

```bash
curl -X POST http://localhost:5000/api/admin/scheduled-tests \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "507f1f77bcf86cd799439011",
    "examType": "JEE_MAIN",
    "scheduleType": "weekends",
    "startDate": "2024-01-01",
    "endDate": "2024-03-31"
  }'
```

### Get Student's Upcoming Tests:

```bash
curl -X GET http://localhost:5000/api/tests/scheduled/upcoming \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

---

## 🎨 UI/UX Design Patterns

### Design System Used:

- **Colors:**
  - Primary: `#2563EB` (Blue)
  - Success: `#10B981` (Green)
  - Danger: `#EF4444` (Red)
  - Warning: `#FACC15` (Yellow)
  - Info: `#3B82F6` (Light Blue)

- **Components:**
  - Cards with hover effects
  - Animated modals with backdrop
  - Gradient backgrounds for emphasis
  - Badge system for status indicators
  - Loading spinners for async operations

- **Animations:**
  - Fade in for page content
  - Slide down for mobile menu
  - Scale for modals
  - Hover effects on buttons
  - Smooth transitions (300ms)

### Responsive Design:

- Mobile: Single column, stacked cards
- Tablet: 2-column grid
- Desktop: Full grid with sidebars
- Mobile menu for navigation
- Touch-friendly buttons (min 44px)

---

## 🐛 Troubleshooting

### Common Issues:

**1. "Test not found" when scheduling:**
- **Cause:** Invalid test ID
- **Solution:** Get test ID from manage questions or create test first

**2. Students don't see scheduled tests:**
- **Cause:** No active subscription for that exam type
- **Solution:** Grant subscription first, then create schedule

**3. "Subscription not found" error:**
- **Cause:** Trying to edit non-existent subscription
- **Solution:** Grant new subscription instead of editing

**4. Dates not showing correctly:**
- **Cause:** Timezone mismatch
- **Solution:** Backend uses UTC, frontend converts to local time

**5. Schedule created but no dates generated:**
- **Cause:** End date before start date
- **Solution:** Check date inputs, end must be after start

---

## 🚀 Future Enhancements

### Planned Features:

1. **Email Notifications**
   - Send email when subscription granted
   - Remind students of scheduled tests (1 day before)
   - Notify when subscription expiring

2. **Bulk Actions**
   - Import students from CSV
   - Bulk grant subscriptions
   - Export subscription reports

3. **Advanced Scheduling**
   - Time-specific scheduling (9 AM every day)
   - Multi-test series (5 tests in sequence)
   - Prerequisite tests (must complete Test 1 before Test 2)

4. **Analytics**
   - Subscription revenue tracking
   - Test completion rates for scheduled tests
   - Student engagement metrics

5. **Calendar View**
   - Visual calendar for scheduled tests
   - Drag-and-drop rescheduling
   - Color-coded by exam type

---

## 📝 Changelog

### v1.0.0 (Current Release)

**Added:**
- Manual subscription management system
- Scheduled tests feature with 4 schedule types
- Admin pages: ManageSubscriptions, ScheduleTests
- Student component: UpcomingScheduledTests
- Backend routes for subscription CRUD
- Backend routes for scheduled tests CRUD
- ScheduledTest model
- Navigation links in admin navbar
- Comprehensive documentation

**Updated:**
- Admin routes with subscription management
- Test routes with scheduled tests endpoint
- App.js with new routes
- Navbar with new admin links

---

## 👥 Support

For questions or issues:
1. Check troubleshooting section above
2. Review API documentation
3. Check browser console for errors
4. Verify MongoDB connection
5. Test with Postman to isolate frontend/backend issues

---

## 📚 Additional Resources

- [React Router Documentation](https://reactrouter.com/)
- [Framer Motion API](https://www.framer.com/motion/)
- [Mongoose Subdocuments](https://mongoosejs.com/docs/subdocs.html)
- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs)

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Author:** Test Series Development Team
