# UPI Payment System - Documentation

## Overview
The UPI payment system replaces Razorpay with a manual QR code-based payment flow. Students scan a UPI QR code, make payment, upload proof, and admin approves within 30 minutes to activate subscription.

## Features Implemented

### 1. **Promo Code System**
- **Model**: `PromoCode.js`
  - Fields: code, discount, discountType (FIXED/PERCENTAGE), isActive, expiryDate, maxUses, usedCount
  - Supports multiple exam types
  - Tracks usage count
  
- **Default Promo Code**: `NEW`
  - Discount: ₹290
  - Original: ₹299 → Final: ₹9
  - Active by default
  - Applicable to all exams

### 2. **Payment Model**
- **Model**: `Payment.js`
  - Tracks UPI payments with status (PENDING/APPROVED/REJECTED)
  - Stores: amount, originalAmount, promoCode, discount
  - Screenshot upload (Base64)
  - Transaction ID
  - Admin approval tracking

### 3. **Student Flow**
**File**: `client/src/pages/student/Subscription.js`

**Steps**:
1. Select subscription plan (JEE Main: ₹299, JEE Main+Advanced: ₹399, NEET: ₹399)
2. **Optional**: Apply promo code (e.g., "NEW")
   - System validates code and shows discount
3. Generate UPI QR Code
   - QR contains: UPI ID `8278662431@ptaxis`, amount, transaction note
4. Scan QR and pay via any UPI app (GPay, PhonePe, Paytm, etc.)
5. Submit payment proof:
   - Transaction ID/UPI Reference Number
   - Payment screenshot (max 5MB)
   - Optional notes
6. Payment goes to PENDING status
7. Admin reviews within 30 minutes
8. Subscription activated for 30 days upon approval

### 4. **Admin Flow**
**Files**: 
- `client/src/pages/admin/PaymentApproval.js`
- `client/src/pages/admin/PromoCodeManagement.js`

**Payment Approval**:
- View all pending/approved/rejected payments
- See student details, amount, promo code used, screenshot
- Approve payment → Auto-activates subscription for 30 days
- Reject payment with reason
- Filter by status

**Promo Code Management**:
- Create new promo codes
- Set discount (fixed amount or percentage)
- Set expiry date and max uses
- Choose applicable exams
- Activate/deactivate codes
- Track usage count
- Delete codes

## API Endpoints

### Promo Codes
```
POST   /api/promocodes              - Create promo code (Admin)
GET    /api/promocodes              - Get all promo codes (Admin)
POST   /api/promocodes/validate     - Validate promo code (Student)
PUT    /api/promocodes/:id          - Update promo code (Admin)
DELETE /api/promocodes/:id          - Delete promo code (Admin)
```

### Payments
```
POST   /api/payment/upi/initiate    - Initiate UPI payment
POST   /api/payment/upi/:id/submit  - Submit payment proof
GET    /api/payment/my-payments     - Get user's payments
GET    /api/payment/pending         - Get pending payments (Admin)
GET    /api/payment/all             - Get all payments (Admin)
PUT    /api/payment/:id/approve     - Approve payment (Admin)
PUT    /api/payment/:id/reject      - Reject payment (Admin)
```

## Database Seeding

To create the default "NEW" promo code:
```bash
cd backend
node seedPromoCodes.js
```

## UPI Details
- **UPI ID**: `8278662431@ptaxis`
- **Payment Method**: UPI QR Code
- **Verification Time**: Typically 30 minutes

## Installation

### Dependencies Added:
```bash
# In client directory
npm install qrcode
```

### New Files Created:

**Backend**:
- `backend/models/PromoCode.js`
- `backend/models/Payment.js`
- `backend/routes/promocode.js`
- `backend/seedPromoCodes.js`

**Frontend**:
- `client/src/pages/admin/PaymentApproval.js`
- `client/src/pages/admin/PromoCodeManagement.js`

**Updated**:
- `backend/routes/payment.js` (Added UPI routes)
- `backend/server.js` (Registered promo code routes)
- `client/src/pages/student/Subscription.js` (Complete rewrite)
- `client/src/App.js` (New routes)
- `client/src/components/Navbar.js` (Admin menu items)

## Testing Flow

### As Student:
1. Login → Go to Subscription page
2. Click "Subscribe Now" on any plan
3. Enter promo code "NEW" and click Apply
4. See price drop from ₹299 to ₹9
5. Click "Generate UPI QR Code"
6. Scan QR with UPI app and pay ₹9
7. Upload payment screenshot and enter transaction ID
8. Submit → Wait for admin approval

### As Admin:
1. Login → Go to "Payment Approval" or "Payments" menu
2. See pending payment with student details and screenshot
3. Verify screenshot matches transaction
4. Click "Approve & Activate"
5. Student's subscription is now active for 30 days

### Promo Code Management:
1. Admin → "Promo Codes" menu
2. Click "Create Promo Code"
3. Fill details (code, discount, expiry, etc.)
4. Activate/deactivate as needed
5. Track usage count

## Security Notes
- Screenshot stored as Base64 in MongoDB
- Admin-only routes protected with `adminAuth` middleware
- Promo code validation checks expiry and usage limits
- Transaction ID required for payment submission

## Future Enhancements
- Automatic payment verification via UPI gateway API
- Email notifications on approval/rejection
- Bulk promo code generation
- Analytics dashboard for payments
- Refund handling
