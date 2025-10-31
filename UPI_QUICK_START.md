# UPI Payment System - Quick Start Guide

## 🎯 What's New

Replaced Razorpay with UPI QR code-based payment system with promo code support.

## 🚀 Quick Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install qrcode
   ```

2. **Seed Default Promo Code**
   ```bash
   cd backend
   node seedPromoCodes.js
   ```
   This creates the "NEW" promo code with ₹290 discount.

3. **Start Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd client
   npm start
   ```

## 📱 Student Flow

1. **Go to Subscription** → `/student/subscription`
2. **Choose Plan**: JEE Main (₹299), JEE Main+Advanced (₹399), or NEET (₹399)
3. **Apply Promo Code** (optional):
   - Enter "NEW" 
   - Gets ₹290 discount → Pay only ₹9!
4. **Generate QR Code** → Shows UPI QR with amount
5. **Pay via UPI**:
   - Scan QR with Google Pay/PhonePe/Paytm
   - UPI ID: `8278662431@ptaxis`
6. **Submit Proof**:
   - Upload payment screenshot
   - Enter transaction ID
7. **Wait for Approval** → Typically 30 minutes

## 👨‍💼 Admin Flow

### Payment Approval (`/admin/payment-approval`)
- View pending payments with screenshots
- See student details and promo code used
- **Approve** → Subscription activated for 30 days
- **Reject** → Provide reason

### Promo Code Management (`/admin/promo-codes`)
- Create new codes
- Set discount (₹ or %)
- Set expiry & usage limits
- Activate/deactivate
- Track usage

## 🔑 Default Promo Code

**Code**: `NEW`
- **Discount**: ₹290 fixed
- **Status**: Active
- **Original**: ₹299 → **Final**: ₹9
- **Exams**: All (JEE Main, JEE Main+Advanced, NEET)
- **Expiry**: None
- **Max Uses**: Unlimited

## 📋 New Admin Menu Items

Added to Navbar:
- **Payments** → `/admin/payment-approval`
- **Promo Codes** → `/admin/promo-codes`

## 🗂️ Files Modified/Created

### Backend (Models)
- ✅ `models/PromoCode.js` - Promo code schema
- ✅ `models/Payment.js` - Payment tracking

### Backend (Routes)
- ✅ `routes/promocode.js` - Promo CRUD + validation
- ✅ `routes/payment.js` - Updated with UPI routes
- ✅ `server.js` - Registered promo routes

### Backend (Scripts)
- ✅ `seedPromoCodes.js` - Seed default NEW code

### Frontend (Pages)
- ✅ `pages/student/Subscription.js` - Complete rewrite with UPI
- ✅ `pages/admin/PaymentApproval.js` - NEW
- ✅ `pages/admin/PromoCodeManagement.js` - NEW

### Frontend (Config)
- ✅ `App.js` - Added new routes
- ✅ `components/Navbar.js` - Added menu items
- ✅ `package.json` - Added qrcode dependency

## 🧪 Testing Checklist

### As Student:
- [ ] Login and go to Subscription
- [ ] Click Subscribe on any plan
- [ ] Apply promo code "NEW" → See ₹9 final amount
- [ ] Generate QR code
- [ ] Pay ₹9 via UPI (test with real payment)
- [ ] Upload screenshot and transaction ID
- [ ] Submit → See "Under Review" status

### As Admin:
- [ ] Login and go to Payment Approval
- [ ] See pending payment
- [ ] View screenshot (click to enlarge)
- [ ] Approve payment
- [ ] Check student now has active subscription
- [ ] Go to Promo Codes
- [ ] Create test promo code
- [ ] Activate/deactivate code

## 💡 Key Features

✅ **Promo Code System**
- Flexible discount (₹ or %)
- Expiry dates
- Usage limits
- Multi-exam support

✅ **UPI QR Payment**
- Auto-generated QR codes
- Screenshot upload
- Transaction ID tracking

✅ **Admin Approval**
- Manual verification
- 30-minute review window
- Approve/reject with reasons

✅ **Mobile Responsive**
- Landscape mode enforced for tests
- QR scanning friendly

## 🔐 Security

- Admin-only routes protected
- Promo validation server-side
- Screenshot size limit (5MB)
- Transaction ID required
- Status tracking (PENDING/APPROVED/REJECTED)

## 📊 Payment Status Flow

```
Student Submits Payment
        ↓
    PENDING (Admin notified)
        ↓
   Admin Reviews
    /        \
APPROVED    REJECTED
   ↓           ↓
Subscription  Student
Activated     Notified
```

## 🎨 UI Highlights

**Subscription Page**:
- Clean card-based layout
- Promo code input with validation
- Live price calculation
- QR code display
- Screenshot preview
- Payment history

**Admin Pages**:
- Tab filters (Pending/Approved/Rejected)
- Expandable payment cards
- Screenshot viewer
- One-click approval
- Usage analytics

## 🚨 Important Notes

1. **UPI ID**: `8278662431@ptaxis` (hardcoded in Payment model)
2. **Subscription Duration**: 30 days (hardcoded in approval route)
3. **Screenshot Storage**: Base64 in MongoDB (consider cloud storage for production)
4. **Payment Verification**: Manual (30 min typical time)

## 📝 Environment Variables

No new environment variables needed! UPI ID is hardcoded.

## 🔄 Migration Notes

If you have existing Razorpay subscriptions:
- Old subscriptions still work
- New subscriptions use UPI flow
- Both systems coexist
- Admin can manage both via "Manage Subscriptions"

## 🎉 Success!

Your UPI payment system with promo code support is ready! Test the complete flow with the "NEW" promo code for ₹9 subscription.
