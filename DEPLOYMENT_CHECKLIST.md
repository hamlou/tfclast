# 🚀 TFC PRODUCTION DEPLOYMENT CHECKLIST

## ✅ CRITICAL FIXES ALREADY APPLIED

The following issues have been **automatically fixed** in your code:

### Fix 1: Sidebar Image Filename (Linux-Safe)
- ✅ **Renamed:** `tfc above side bar.png` → `tfc-above-sidebar.png`
- ✅ **Updated:** All references in `src/components/Sidebar.jsx`
- ✅ **Result:** No more 404 errors on Linux servers

### Fix 2: Firebase Config Now Uses Environment Variables
- ✅ **Updated:** `src/firebase.js` now uses `VITE_FIREBASE_*` variables
- ✅ **Fallback:** Development values preserved as fallbacks
- ✅ **Result:** Easy environment switching, follows best practices

### Fix 3: Firebase Initialization Error Handling
- ✅ **Added:** Try-catch block around Firebase Admin initialization
- ✅ **Added:** Success/error logging
- ✅ **Added:** `process.exit(1)` on failure (prevents silent crashes)
- ✅ **Result:** Server won't start with invalid Firebase credentials

### Fix 4: Admin Email Configurable
- ✅ **Updated:** `server/server.js` now uses `process.env.ADMIN_EMAIL`
- ✅ **Fallback:** Your email preserved as default
- ✅ **Result:** Change admin email without code deployment

### Fix 5: Created `.env.production` for Vite Builds
- ✅ **Created:** `.env.production` file with all required VITE_ variables
- ✅ **Result:** `npm run build` will now use production URLs

### Fix 6: Enhanced `.gitignore`
- ✅ **Added:** `*-firebase-adminsdk-*.json` pattern
- ✅ **Result:** Extra protection against committing Firebase credentials

---

## 🔧 MANUAL STEPS BEFORE DEPLOYMENT

### Step 1: Update `.env.production` with Real Values

**File:** `tfc-final/.env.production`

Replace placeholder values with your actual Firebase config:

```env
VITE_BACKEND_URL=https://your-actual-domain.com

VITE_FIREBASE_API_KEY=AIzaSyDyptN2m-wIxze1jRJya1hGzqueKe510r4
VITE_FIREBASE_AUTH_DOMAIN=tfcq-32a8b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tfcq-32a8b
VITE_FIREBASE_STORAGE_BUCKET=tfcq-32a8b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1027395831145
VITE_FIREBASE_APP_ID=1:1027395831145:web:969f6de4cf9517755e29f8
```

**Where to get Firebase values:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `tfcq-32a8b`
3. Click ⚙️ (Settings) → Project Settings
4. Scroll to "Your apps" → Web app
5. Copy the config values

### Step 2: Add `NODE_ENV=production` to Server `.env`

**File:** On your production server, edit `/var/www/tfc/.env`

Add this line at the top:
```env
NODE_ENV=production
```

**Why:** This enables production CORS restrictions (blocks localhost origins).

### Step 3: Update Production `.env` with Production URLs

**File:** On your production server, edit `/var/www/tfc/.env`

Update these URLs to your actual domain:
```env
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-domain.com
VITE_BACKEND_URL=https://your-domain.com

NOWPAYMENTS_IPN_URL=https://your-domain.com/api/webhooks/nowpayments
SUCCESS_URL=https://your-domain.com/payment/success
CANCEL_URL=https://your-domain.com/subscription
```

### Step 4: Build Frontend

Run these commands on your server (or locally before uploading):

```bash
cd /var/www/tfc
npm install
npm run build
```

**Expected output:**
```
✓ 156 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.31 kB
dist/assets/index-abc123.js     456.78 kB │ gzip: 145.23 kB
✓ built in 12.34s
```

### Step 5: Install Backend Dependencies

```bash
cd /var/www/tfc/server
npm install --production
```

**Note:** `--production` flag skips devDependencies (faster, smaller).

### Step 6: Run Events Migration (One-Time)

```bash
cd /var/www/tfc/server
node update-events-status.js
```

**Expected output:**
```
🔄 Starting events status migration...
📊 Found 15 events
✅ Updated "TFC Championship 2024" from "" to "past"
✅ Updated "TFC Summer Showdown" from "upcoming" to "past"

✨ Migration complete!
📈 Updated: 12 events
⏭️  Skipped: 3 events
```

### Step 7: Configure Stripe Webhooks

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.payment_succeeded`
4. Copy the webhook secret
5. Add to server `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
   ```

### Step 8: Configure NOWPayments IPN

1. Go to NOWPayments Dashboard: https://account.nowpayments.io/
2. Navigate to Project Settings → IPN Callbacks
3. Set callback URL: `https://your-domain.com/api/webhooks/nowpayments`
4. Verify the IPN secret matches your `.env`:
   ```env
   NOWPAYMENTS_IPN_SECRET=your_actual_secret
   ```

### Step 9: Update Nginx Config

**File:** `deploy/nginx.conf` (or `/etc/nginx/sites-available/tfc` on server)

Replace all instances of `tfc-event.com` with your actual domain:

```nginx
server_name your-domain.com www.your-domain.com;
ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

### Step 10: Set Up SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to automatically configure SSL.

### Step 11: Start Backend with PM2

```bash
cd /var/www/tfc
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Verify it's running:**
```bash
pm2 status
# Should show: tfc-api  online
```

### Step 12: Test Health Endpoint

```bash
curl https://your-domain.com/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T14:30:00.000Z"
}
```

### Step 13: Test Frontend

1. Open browser: `https://your-domain.com`
2. Verify:
   - ✅ Homepage loads
   - ✅ TFC logo displays (sidebar image)
   - ✅ Login works
   - ✅ Can browse videos
   - ✅ No console errors

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: User Registration
- [ ] Sign up with new email
- [ ] Verify email link works
- [ ] Can log in after verification

### Test 2: Video Playback
- [ ] Free video plays without subscription
- [ ] Pro video shows lock icon for free users
- [ ] Pro video plays for subscribed users

### Test 3: Stripe Payment
- [ ] Click "Subscribe" button
- [ ] Redirects to Stripe Checkout
- [ ] Complete test payment
- [ ] Redirects back to success page
- [ ] Subscription status updates to "active"
- [ ] Can now access pro videos

### Test 4: Crypto Payment
- [ ] Select crypto payment option
- [ ] NOWPayments invoice generated
- [ ] Payment processes (use test mode)
- [ ] Subscription grants automatically

### Test 5: Admin Panel
- [ ] Log in as admin
- [ ] Add new video
- [ ] Video appears on homepage immediately (cache clears)
- [ ] Edit video
- [ ] Delete video
- [ ] Check subscriber statistics (circles display correctly)

### Test 6: Events
- [ ] Past events show in "past" tab
- [ ] Upcoming events show in "upcoming" tab
- [ ] Admin can manually override status
- [ ] Status auto-calculates when date changes

### Test 7: Responsive Design
- [ ] Test on mobile (320px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1440px width)
- [ ] All pages responsive, no horizontal scroll

### Test 8: Performance
- [ ] Run Lighthouse audit (Chrome DevTools)
- [ ] Target: Performance score > 90
- [ ] Check: Videos load with lazy loading
- [ ] Check: Images optimized

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks
- [ ] PM2 status: `pm2 status`
- [ ] Error logs: `pm2 logs tfc-api --lines 100`
- [ ] Nginx status: `sudo systemctl status nginx`

### Weekly Checks
- [ ] Disk space: `df -h`
- [ ] Memory usage: `free -m`
- [ ] SSL expiry: `sudo certbot certificates`

### Monthly Checks
- [ ] Update dependencies: `npm outdated`
- [ ] Review error logs for patterns
- [ ] Check Stripe/ NOWPayments transaction logs
- [ ] Verify backups are working

---

## 🆘 TROUBLESHOOTING

### Issue: "Cannot GET /browse" on page refresh
**Fix:** Nginx missing `try_files` directive
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Issue: CORS errors in browser console
**Fix:** Add `NODE_ENV=production` to server `.env` and restart PM2:
```bash
pm2 restart tfc-api
```

### Issue: Videos don't appear after admin adds them
**Fix:** Cache not clearing — verify cache.del() calls exist in server.js

### Issue: Firebase Admin initialization failed
**Fix:** Check `.env` has correct Firebase credentials:
```bash
cat /var/www/tfc/.env | grep FIREBASE
```

### Issue: `npm run build` fails
**Fix:** Ensure `.env.production` exists with all VITE_ variables:
```bash
ls -la .env.production
cat .env.production
```

### Issue: Sidebar image shows 404
**Fix:** Verify file exists with correct name:
```bash
ls -la public/tfc-above-sidebar.png
```

---

## 🎯 DEPLOYMENT SUCCESS CRITERIA

Your site is successfully deployed when:

- ✅ `https://your-domain.com` loads without errors
- ✅ HTTPS certificate is valid (green lock icon)
- ✅ User can sign up, verify email, and log in
- ✅ Free videos play for all users
- ✅ Pro videos play only for subscribers
- ✅ Stripe payments process correctly
- ✅ Crypto payments process correctly
- ✅ Admin can add/edit/delete content
- ✅ New content appears immediately (cache working)
- ✅ Site is responsive on all devices
- ✅ Lighthouse performance score > 90
- ✅ No console errors in browser
- ✅ PM2 shows backend running
- ✅ Nginx serving frontend correctly

---

## 📞 SUPPORT RESOURCES

### Firebase
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs

### Stripe
- Dashboard: https://dashboard.stripe.com
- Webhooks: https://dashboard.stripe.com/webhooks
- Docs: https://stripe.com/docs

### NOWPayments
- Dashboard: https://account.nowpayments.io
- API Docs: https://documenter.getpostman.com/view/6798413/T1LKDuuH

### PM2
- Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- Monitoring: `pm2 monit`

### Nginx
- Config test: `sudo nginx -t`
- Reload: `sudo systemctl reload nginx`
- Logs: `sudo tail -f /var/log/nginx/tfc-error.log`

---

**Last Updated:** 2026-04-28  
**Status:** Ready for deployment after completing manual steps
