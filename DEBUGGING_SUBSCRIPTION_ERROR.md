# Debugging "Failed to Grant Subscription" Error

## Quick Diagnosis Checklist

### 1. Check if Backend is Running

Open your backend terminal and verify you see:
```
Server is running on port 5000
MongoDB Connected Successfully
```

If not, start backend:
```powershell
cd backend
npm start
# OR
npm run dev
```

---

### 2. Check Browser Console (F12)

1. Open your browser
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try granting subscription again
5. Look for error messages

**Common errors:**

**"Network Error" or "Failed to fetch"**
- Backend is not running
- Wrong URL (should be http://localhost:5000)
- Solution: Start backend server

**"401 Unauthorized"**
- Token expired or invalid
- Solution: Logout and login again

**"404 Not Found"**
- API endpoint doesn't exist
- Check backend routes are loaded

**"500 Internal Server Error"**
- Backend error - check backend terminal logs
- MongoDB connection issue

---

### 3. Check Network Tab

1. Press **F12** → **Network** tab
2. Try granting subscription
3. Look for request to `/api/admin/subscriptions/...`
4. Click on it to see:
   - **Status code** (should be 200)
   - **Response** (error message)
   - **Headers** (check Authorization header exists)

---

### 4. Verify MongoDB Connection

Check backend terminal for:
```
MongoDB Connected Successfully
```

If not connected:
```powershell
# Check MongoDB service
Get-Service MongoDB

# Start MongoDB
Start-Service MongoDB
```

---

### 5. Check Auth Token

The most common issue is expired or missing token.

**Solution:**
1. Logout from admin panel
2. Login again
3. Try granting subscription

**Manual check in console:**
```javascript
// In browser console (F12)
console.log(localStorage.getItem('token'));
// Should show a long JWT token
```

---

## Step-by-Step Fix

### Step 1: Restart Everything

```powershell
# Stop all terminals (Ctrl+C)

# Start MongoDB
Start-Service MongoDB

# Start Backend
cd backend
npm run dev

# Open NEW terminal - Start Frontend
cd client
npm start
```

### Step 2: Clear Browser Data

1. Press **F12**
2. Go to **Application** tab
3. **Local Storage** → http://localhost:3001
4. Right-click → **Clear**
5. Refresh page

### Step 3: Login Fresh

1. Go to http://localhost:3001/login
2. Login with admin credentials
3. Go to /admin/subscriptions
4. Try again

---

## Common Error Messages & Solutions

### Error: "Failed to grant subscription"

**Possible causes:**

1. **Backend not running**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Wrong endpoint URL**
   Check `client/src/pages/admin/ManageSubscriptions.js` line ~49:
   ```javascript
   http://localhost:5000/api/admin/subscriptions/${selectedStudent._id}
   ```
   Should match your backend port.

3. **Student ID is undefined**
   - Check if selectedStudent has _id
   - Look at browser console for errors

4. **Token expired**
   - Logout and login again

5. **MongoDB error**
   - Check backend logs for error details

---

### Error: "Student not found"

**Solution:**
- The student might have been deleted
- Refresh the page
- Check MongoDB that student exists

---

### Error: "Exam type and expiry date are required"

**Solution:**
- Make sure you filled all required fields in the form
- Check the date picker has a value

---

### Error: "Network Error"

**Solutions:**
1. Backend is not running → Start it
2. Wrong port → Check backend is on port 5000
3. CORS issue → Check backend has cors enabled

---

### Error: "401 Unauthorized"

**Solutions:**
1. **Logout and login again** (most common fix)
2. Check you're logged in as admin
3. Token might be expired
4. Clear localStorage and login fresh

---

## Debug Mode

### Enable Detailed Backend Logs

Edit `backend/routes/admin.js` at the grant subscription route:

```javascript
router.post('/subscriptions/:studentId', adminAuth, async (req, res) => {
  try {
    console.log('=== GRANT SUBSCRIPTION DEBUG ===');
    console.log('Student ID:', req.params.studentId);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    const { studentId } = req.params;
    const { examType, expiryDate, amount } = req.body;
    
    // ... rest of code
```

Restart backend and try again - check terminal for debug output.

---

### Enable Frontend Debug

Edit `client/src/pages/admin/ManageSubscriptions.js`:

```javascript
const handleGrantSubscription = async (e) => {
  e.preventDefault();
  
  console.log('=== FRONTEND DEBUG ===');
  console.log('Selected Student:', selectedStudent);
  console.log('Form Data:', formData);
  console.log('Token:', localStorage.getItem('token'));
  
  try {
    const token = localStorage.getItem('token');
    const { data } = await axios.post(
      `http://localhost:5000/api/admin/subscriptions/${selectedStudent._id}`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // ... rest of code
```

Check browser console (F12) when clicking grant.

---

## Quick Test

Test if backend is working:

```powershell
# In a terminal
curl http://localhost:5000/api/admin/subscriptions -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Or test in browser console:
```javascript
fetch('http://localhost:5000/api/admin/subscriptions', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(console.log)
```

---

## Still Not Working?

### Check These Files Exist:

```powershell
ls backend/models/User.js
ls backend/routes/admin.js
ls backend/middleware/auth.js
ls client/src/pages/admin/ManageSubscriptions.js
```

### Verify Backend Route is Loaded:

Add this to `backend/server.js`:
```javascript
// After route declarations
console.log('Admin routes loaded');
app._router.stack.forEach(r => {
  if (r.route) console.log(r.route.path);
});
```

---

## Contact Support

If still having issues, provide:
1. Backend terminal output
2. Browser console errors (F12)
3. Network tab screenshot showing failed request
4. MongoDB connection status

---

## Most Likely Solution

**90% of the time it's one of these:**

1. ✅ **Backend not running** → Start it with `npm run dev`
2. ✅ **Token expired** → Logout and login again  
3. ✅ **MongoDB not connected** → Start MongoDB service

Try these three first!
