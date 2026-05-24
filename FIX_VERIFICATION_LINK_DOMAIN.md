# 🔧 Fix: Verification Link Goes to Wrong Site

## ❌ The Problem

You received a Firebase verification email, but when you clicked the link, it went to:
```
Site not found - Netlify 404
```

This happens because **Firebase is configured with your Netlify domain**, but you're testing on localhost!

---

## ✅ Solution 1: Use Brevo Instead (RECOMMENDED)

Since we set up Brevo, Firebase emails should only be used as a fallback. Make sure Brevo is working:

### **Step 1: Update Sender Email**
Update these TWO files with your verified Brevo email:

**File 1:** `src/pages/ForgotPassword.jsx` - Line 22  
**File 2:** `src/firebase.js` - Line 52

Change from:
```javascript
const BREVO_SENDER_EMAIL = 'your-verified-email@example.com';
```

To your actual verified email:
```javascript
const BREVO_SENDER_EMAIL = 'your-real-email@gmail.com';
```

### **Step 2: Test Signup Again**
1. Go to: http://localhost:5173/signup
2. Register with a NEW email
3. You should receive a Brevo email (not Firebase)
4. The link will work correctly! ✅

---

## ✅ Solution 2: Fix Firebase Dynamic Links

If you want Firebase verification emails to work on both localhost AND production:

### **Option A: Use Environment-Specific URLs**

The code already uses `window.location.origin`, which means:
- On localhost → Links go to `http://localhost:5173`
- On Netlify → Links go to `https://tfctet.netlify.app`

**But you need to register with the CORRECT domain!**

### **If Testing on Localhost:**
1. Make sure you're on: `http://localhost:5173/login`
2. Register from localhost
3. Firebase will send link with `localhost:5173` URL
4. Click the link → Works! ✅

### **If You Registered from Netlify:**
Firebase saved the Netlify domain and sends links there.

**Fix:** Delete the user from Firebase and re-register from localhost!

---

## 🎯 Quick Test

Check what URL you're getting:

1. **Go to**: http://localhost:5173/login
2. **Open Console** (F12)
3. **Register** with a new email
4. **Watch console** - you should see:
   ```
   💻 Current origin: http://localhost:5173
   🔗 Verification URL: http://localhost:5173/verify-email
   ```

If you see `tfctet.netlify.app` instead, you registered from the wrong domain!

---

## 🔍 How to Check Which Domain You Used

Look at the verification email you received:

**Correct for localhost:**
```
Link: http://localhost:5173/verify-email?mode=verifyEmail&...
```

**Wrong (goes to Netlify):**
```
Link: https://tfctet.netlify.app/verify-email?mode=verifyEmail&...
```

If it's the wrong one, just register again from localhost!

---

## 💡 Pro Tip: Always Register from Localhost When Testing

When developing locally:
1. Start dev server: `npm run dev`
2. Go to: `http://localhost:5173`
3. Register from there
4. All links will point to localhost ✅

When deploying to production:
1. Build and deploy to Netlify
2. Go to: `https://tfctet.netlify.app`
3. Users register from there
4. All links point to Netlify ✅

---

## 📝 Summary

**Problem:** Verification link goes to Netlify instead of localhost  
**Cause:** You registered from the wrong domain or Firebase has old config  
**Solution:** 
1. Make sure Brevo sender email is updated
2. Register from localhost (http://localhost:5173)
3. Or use Brevo emails (recommended)

**Quick Fix:** Just register again from localhost and the link will work! 😊
