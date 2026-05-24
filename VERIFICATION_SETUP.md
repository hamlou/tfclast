# Email Verification Setup Guide

## ✅ What's Been Implemented

### 1. **Separate Verification Page**
- Created `/verify-email` as a dedicated page for email verification
- Matches the site's red and black styling theme
- Features 6-digit code input with auto-focus
- Includes resend functionality with 30-second cooldown

### 2. **Firebase Integration**
- Firebase sends verification emails automatically on signup
- Added local verification code system for demo purposes
- Code expires after 10 minutes for security

### 3. **User Flow**
1. User signs up with email/password
2. Redirected to `/verify-email` page
3. Firebase sends verification email (check spam folder)
4. User enters 6-digit code from console (demo mode) or email
5. Successfully verified → redirected to login

## 🔧 How It Works

### Firebase Email Verification
When a user signs up:
- `sendEmailVerification()` is called automatically
- Firebase sends an email with a verification link
- The email comes from your Firebase project (tfcq-32a8b.firebaseapp.com)

### Demo Verification Code
For testing purposes, the system also generates a 6-digit code:
- Code is stored in localStorage
- Logged to browser console (F12 to view)
- Expires after 10 minutes
- Can be resent after 30 seconds

## 📝 Testing Instructions

### Test the Signup Flow:
1. Go to http://localhost:5176
2. Click "Sign Up" tab
3. Enter email, password, confirm password
4. Click "Create Account"
5. You'll be redirected to `/verify-email`

### Get the Verification Code:
**Option 1: Browser Console (Demo)**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `Verification code (demo): XXXXXX`
4. Enter this code

**Option 2: Email (Production)**
1. Check the email inbox you signed up with
2. Look for email from "TFC"
3. Subject: "Verify your email for TFC"
4. Follow the verification link in the email

### After Verification:
- Success message appears
- Auto-redirects to login page after 2 seconds
- User can now sign in with credentials

## 🎨 Styling Features

- **Red accent color** (#e01818) matching site theme
- **Black background** (#1a1a1a) for inputs
- **Glowing effect** on active/filled inputs
- **Responsive design** with centered layout
- **Auto-focus** to next input box when typing
- **Cooldown timer** on resend button (30s)

## 🔐 Security Notes

### Current Implementation (Demo):
- Verification codes stored in localStorage
- Codes expire after 10 minutes
- Resend has 30-second cooldown

### Production Recommendations:
For a production app, you should:
1. Store codes in Firestore/Realtime Database
2. Use Firebase Cloud Functions to send custom emails
3. Implement rate limiting on resend requests
4. Add CAPTCHA to prevent bot signups
5. Use HTTPS in production

## 📁 Files Modified/Created

### Created:
- `src/pages/VerifyEmail.jsx` - Dedicated verification page

### Modified:
- `src/firebase.js` - Added verification functions
  - `generateVerificationCode()`
  - `storeVerificationCode()`
  - `verifyCode()`
  - Updated `signUp()` to send verification email

- `src/App.jsx` - Added `/verify-email` route

- `src/pages/Login.jsx` - Updated to redirect to verification page

## 🚀 Common Issues

### "No verification code found"
- This means localStorage is empty
- Sign up again or click "Resend"

### Email not received
- Check spam/junk folder
- Firebase emails sometimes get filtered
- Use the demo code from console instead

### Code not working
- Make sure you're using the latest code (check console)
- Codes expire after 10 minutes
- Request a new code if expired

## 📧 Firebase Email Configuration

To customize verification emails:
1. Go to Firebase Console → Authentication → Templates
2. Customize email template for "Email verification"
3. Add your logo, colors, and branding
4. Set sender name to "TFC Team"

Your site is running at: **http://localhost:5176**
