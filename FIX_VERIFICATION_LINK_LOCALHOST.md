# 🔧 Fix: Verification Email Links to Netlify Instead of Localhost

## 🚨 The Problem

When you sign up on `http://localhost:5173`, the verification email sends you to Netlify instead of keeping you on localhost.

**Why?** Firebase Authentication uses **authorized domains** and may default to your production domain.

---

## ✅ Solution 1: Code Fix (Already Applied!)

I just updated the code to **force localhost URLs when developing locally**:

```javascript
// Detect if we're on localhost
const currentOrigin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? `http://${window.location.host}`  // Force http for localhost
  : `https://${window.location.host}`; // Use https for production
```

**This ensures:**
- Localhost → `http://localhost:5173/verify-email`
- Netlify → `https://yoursite.netlify.app/verify-email`

---

## ✅ Solution 2: Configure Firebase Authorized Domains

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com
2. Select your project: **tfcq-32a8b**
3. Go to **Authentication** → **Settings**

### Step 2: Check Authorized Domains
Under **Authorized domains**, you should see:
- ✅ `localhost` (should be there by default)
- ✅ `127.0.0.1` (should be there by default)
- ✅ `yoursite.netlify.app` (your production domain)

**If localhost is missing:**
1. Click **"Add domain"**
2. Enter: `localhost`
3. Click **Add**

### Step 3: Configure Email Template Link Domain

Firebase has a setting for which domain to use in emails:

1. Go to **Authentication** → **Templates** → **Email address verification**
2. Look for **"Customize template"**
3. The link should automatically use the domain where the user signed up
4. **No manual configuration needed** - Firebase detects it automatically

---

## ✅ Solution 3: Clear Browser Cache & Test

After making changes:

### Clear Cache:
1. Press **Ctrl + Shift + Delete**
2. Clear **Cached images and files**
3. Clear **Cookies**
4. Close ALL browser windows

### Test Fresh Signup:
1. Open **Incognito/Private** window
2. Go to: `http://localhost:5173/login`
3. Click **"Create Account"**
4. Sign up with a **NEW email** (one you haven't used before)
5. Check the verification email
6. **The link should now point to `http://localhost:5173/verify-email`**

---

## 🧪 How to Test

### Test 1: Localhost Signup
1. Open: `http://localhost:5173/login`
2. Create account with new email
3. Check email
4. **Expected:** Link says `http://localhost:5173/verify-email`
5. **Click link:** Should verify email on localhost

### Test 2: Production Signup (Netlify)
1. Go to your Netlify site URL
2. Create account with different new email
3. Check email
4. **Expected:** Link says `https://yoursite.netlify.app/verify-email`
5. **Click link:** Should verify email on Netlify

---

## 🔍 Debug Info

Check browser console after signing up - you should see:

```
📧 SENDING verification email via Firebase to: your@email.com
🔗 Verification URL: http://localhost:5173/verify-email
💻 Current origin: http://localhost:5173
🌐 Hostname: localhost
🔗 Firebase verification URL: http://localhost:5173/verify-email
✅ Verification email sent successfully via Firebase!
```

**Key things to check:**
- `Hostname:` should say `localhost` or `127.0.0.1`
- `Verification URL:` should start with `http://localhost:5173`
- NOT `https://` and NOT your Netlify domain

---

## ⚠️ If Still Going to Netlify

### Possible Causes:

1. **Old cached email template**
   - Solution: Wait 5-10 minutes for Firebase to refresh
   
2. **Firebase using wrong domain**
   - Solution: Make sure `localhost` is in authorized domains
   
3. **Browser cache**
   - Solution: Clear cache completely, test in incognito

4. **Using old Firebase user**
   - Solution: Try with a BRAND NEW email address
   - Firebase only sends verification once per user

---

## 🎯 Quick Fix Right Now

### Immediate Test:
1. **Restart dev server** (it should auto-reload with new code)
2. **Clear browser cache** (Ctrl + Shift + Delete)
3. **Open incognito window**
4. **Sign up with NEW email** (not one you used before)
5. **Check email** - should have localhost link now!

### If Still Broken:
1. Go to Firebase Console
2. Authentication → Settings
3. Verify `localhost` is in authorized domains
4. Try signing up again with fresh email

---

## 📝 Why This Happens

Firebase Authentication:
- Sends verification emails with links
- Links point to the domain configured in Firebase Console
- By default, uses the **first authorized domain** or **production domain**
- Our code fix forces it to use the **current browser URL**

With our fix:
- ✅ Localhost signup → localhost verification link
- ✅ Production signup → production verification link
- ✅ Works automatically based on where user signs up

---

## ✅ Final Checklist

- [x] Code updated to detect localhost
- [ ] Server restarted (auto-reloads with Vite)
- [ ] Browser cache cleared
- [ ] Tested with NEW email in incognito window
- [ ] Verified link points to `http://localhost:5173/verify-email`

**Your fix is live! Test it now!** 🚀
