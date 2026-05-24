# 🚀 TFC — Complete Start Guide

## Step 1 — Install dependencies (once)
```
cd server && npm install && cd ..
npm install
```

## Step 2 — Seed Firestore with test videos (once)
```
node server/seed-videos.js
```

## Step 3 — Set up Contact Form Email (to avoid spam)
1. Go to your Google Account → Security → 2-Step Verification → App Passwords
2. Create an App Password for "Mail"
3. Copy the 16-character password
4. In .env file set:
   CONTACT_EMAIL=your_gmail@gmail.com
   CONTACT_PASSWORD=xxxx-xxxx-xxxx-xxxx

## Step 4 — Start everything
```
npm run dev:all
```
Frontend → http://localhost:5173
Backend  → http://localhost:3001

---

## ✅ What's fixed in this version:
- Real Stripe checkout (no fake simulation)
- Subscription check fixed — paid users actually unlock PRO videos
- Search actually works and filters videos
- Dead nav links fixed (Search, Settings pages created)
- 404 page created
- Real TFC data: staff, events, about, contact from tfc-event.com
- Contact form actually sends real emails
- Real events list from tfc-event.com
- Real TFC staff section
- PRO badge shows on locked video cards

## ⚠️ Email Spam Fix:
The contact form uses Gmail SMTP which has good deliverability.
To avoid spam:
1. Use Gmail App Password (not your main password)
2. Add SPF record to your domain DNS:
   v=spf1 include:_spf.google.com ~all
3. Enable DKIM in Google Workspace admin

## When site goes LIVE:
1. Set FRONTEND_URL in .env to your domain
2. Add real webhook in Stripe Dashboard
3. Deploy backend to Railway/Render
