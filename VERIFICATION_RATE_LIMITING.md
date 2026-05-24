# Email Verification Rate Limiting System

## Overview
Implemented a comprehensive rate limiting system for the email verification resend functionality to prevent abuse and spam.

## Features

### ⏱️ **30-Second Cooldown**
- After each successful resend attempt, user must wait 30 seconds
- Countdown timer displayed on the button
- Button is disabled during countdown
- Visual indicator shows remaining time

### 🚫 **3-Attempt Limit**
- User can only request 3 verification emails per session
- Each attempt is tracked and displayed
- Warning shown when attempts are running low

### 🔒 **3-Hour Temporary Block**
- After 3 failed/unsuccessful attempts, user is blocked for 3 hours
- Block timer persists across page refreshes (stored in localStorage)
- Real-time countdown display showing hours, minutes, and seconds
- Automatic unblock when timer expires

## Technical Implementation

### State Management
```javascript
const [resendAttempts, setResendAttempts] = useState(0);      // Track attempts
const [countdown, setCountdown] = useState(0);                // 30s cooldown
const [isBlocked, setIsBlocked] = useState(false);            // Block status
const [blockEndTime, setBlockEndTime] = useState(null);       // Block expiry
```

### LocalStorage Keys
- `tfc_resend_attempts_${userEmail}` - Stores attempt count
- `tfc_block_end_${userEmail}` - Stores block expiration timestamp

### Timer Logic
- **30-second countdown**: Counts down after each resend
- **3-hour block**: Automatically enforced after 3rd attempt
- **Persistence**: Timers survive page refresh/reload

## User Interface

### Button States
1. **Normal**: "Resend Verification Email" (clickable)
2. **Loading**: "Sending..." (disabled)
3. **Cooldown**: "⏳ Wait 30s" (disabled, shows countdown)
4. **Blocked**: "⛔ Temporarily Blocked" (disabled)

### Visual Indicators

#### During Cooldown (30s)
- Orange warning box with clock icon
- Message: "Please wait X seconds before requesting another verification email"

#### Attempt Counter
- Shows: "Attempt X of 3"
- Displays remaining attempts
- Red highlight on attempt number

#### When Blocked (3 hours)
- Red bordered warning box
- Large countdown timer (HH:MM:SS format)
- Clear message about too many attempts
- Reassurance that it resets automatically

## Security Measures

### Prevention of Abuse
- ✅ Limits email spam
- ✅ Prevents bot attacks
- ✅ Persists across sessions
- ✅ Server-side friendly (reduces Firebase load)

### User Experience
- ✅ Clear messaging
- ✅ Visual feedback
- ✅ No permanent bans
- ✅ Automatic recovery

## Code Structure

### Main Component: `VerifyEmail.jsx`

#### State Variables
- `resendAttempts` - Number of resend requests made
- `countdown` - Current countdown value (seconds)
- `isBlocked` - Whether user is currently blocked
- `blockEndTime` - Timestamp when block expires

#### Effects
1. **Mount Effect**: Checks localStorage for existing rate limits
2. **Countdown Effect**: Decrements 30s timer every second
3. **Block Effect**: Checks if block has expired every second

#### Functions
- `handleResendEmail()` - Main resend logic with rate limiting
- `BlockCountdown` component - Displays block timer

## Flow Diagram

```
User Clicks "Resend"
    ↓
Check if Blocked? → YES → Reject Request
    ↓ NO
Check if Countdown Active? → YES → Reject Request
    ↓ NO
Send Email ✓
    ↓
Increment Attempts (1/3, 2/3, or 3/3)
    ↓
If Attempts < 3: Start 30s Countdown
If Attempts = 3: Block for 3 Hours
    ↓
Update UI & localStorage
```

## Testing Scenarios

### Test 1: Normal Usage
1. Sign up with email
2. Click "Resend" → Email sent, 30s countdown starts
3. Wait 30s → Button becomes clickable again
4. Click "Resend" → Email sent, 30s countdown starts

### Test 2: Maximum Attempts
1. Sign up with email
2. Click "Resend" (1st attempt) → 30s wait
3. Click "Resend" (2nd attempt) → 30s wait
4. Click "Resend" (3rd attempt) → BLOCKED for 3 hours
5. Button shows "⛔ Temporarily Blocked"
6. Countdown timer displays: "2h 59m 59s"

### Test 3: Persistence
1. Use all 3 attempts → Get blocked
2. Refresh page → Block persists
3. Wait 3 hours (or change system time)
4. Refresh page → Block cleared, fresh start

## Edge Cases Handled

✅ Page refresh during cooldown  
✅ Page refresh during block  
✅ Multiple tabs open  
✅ Browser close/reopen  
✅ Different email addresses (separate tracking)  

## Future Enhancements

Potential improvements:
- Add CAPTCHA after 2nd attempt
- Send SMS verification as alternative
- Admin override for unblocking
- Analytics on resend patterns
- Progressive cooldown (30s → 1min → 5min)

## Files Modified

- `src/pages/VerifyEmail.jsx` - Added rate limiting logic and UI

---

**Implementation Date:** March 16, 2026  
**Status:** ✅ Complete and Tested
