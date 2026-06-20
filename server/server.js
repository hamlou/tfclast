/*
  PAYMENT VALIDATION RULES:
  - actually_paid > price_amount  → ACCEPT (tip, log the difference)
  - actually_paid = price_amount  → ACCEPT (exact, within 0.01 tolerance)
  - actually_paid < price_amount  → REJECT (underpaid, no access granted)

  Plans:
  - elite_pro     → $19.99 → 150 days access (5 months) [CRYPTO ONLY — displayed as Elite Pro×5]
  - elite_premium → $43.99 → 365 days access (1 year)

  NOWPayments is non-custodial. Funds go directly to your wallet.
  NOWPayments only takes a 0.5% processing fee.
*/
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const stripe = require('stripe');
const { Resend } = require('resend');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cache = require('memory-cache');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Initialize Stripe ───────────────────────────────────────────────────────
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// ─── Initialize Resend ────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Initialize NOWPayments (Crypto Payments) ────────────────────────────────
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY;
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// ─── Crypto payments & subscriptions persisted in Firestore ──────────────────
// Collections: 'crypto_payments' (by order_id), 'users' (subscription data)

// ─── Plan config ─────────────────────────────────────────────────────────────
const PLAN_CONFIG = {
  elite_pro:     { price: 19.99, days: 150, displayName: 'Elite Pro×5 (5 Months)' },
  elite_premium: { price: 43.99, days: 365, displayName: 'Elite Premium (1 Year)' },
};



// Helper: recursively sort object keys (required by NOWPayments signature spec)
function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  return Object.keys(obj).sort().reduce((sorted, key) => {
    sorted[key] = sortObject(obj[key]);
    return sorted;
  }, {});
}

// ─── Initialize Firebase Admin ────────────────────────────────────────────────
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}
const db = admin.firestore();

// ─── ImgBB Image Upload Helper ────────────────────────────────────────────────
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

async function uploadToImgBB(fileBuffer, fileName) {
  const base64Image = fileBuffer.toString('base64');
  const params = new URLSearchParams();
  params.append('key', IMGBB_API_KEY);
  params.append('image', base64Image);
  params.append('name', fileName);

  const response = await axios.post('https://api.imgbb.com/1/upload', params);
  if (response.data?.success) {
    return response.data.data.url; // permanent direct image URL
  }
  throw new Error('ImgBB upload failed: ' + JSON.stringify(response.data));
}

// ─── Security & Rate Limiting ────────────────────────────────────────────────
app.use(helmet()); // Secure HTTP headers and hides X-Powered-By
app.use(compression()); // Gzip compression for all responses

// ─── HTML Escaper (prevent XSS in email templates) ───────────────────────────
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes per IP for login/auth routes
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

// ─── Caching middleware ─────────────────────────────────────────────────────
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl}`;
    const cached = cache.get(key);
    if (cached) {
      return res.json(cached);
    }
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.put(key, body, duration * 1000);
      res.sendResponse(body);
    };
    next();
  };
};
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://tfc-event.com'].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ─── Uploads directory ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Multer config for image uploads ─────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max per photo (Resend attachment limit)
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed (jpg, png, webp)'));
    }
  },
});

// ─── Webhook MUST use raw body ─────────────────────────────────────────────
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const firebaseUid = session.metadata?.firebaseUid;
        if (!firebaseUid) break;
        const subscription = await stripeClient.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;
        const plan = priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'Elite Pro' : 'Elite Premium';
        await db.collection('users').doc(firebaseUid).set({
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`✅ Activated: ${firebaseUid} — ${plan}`);

        // Send payment success email
        try {
          const userDoc = await db.collection('users').doc(firebaseUid).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          if (userData?.email) {
            const periodEnd = subscription.current_period_end * 1000;
            const expiryDate = new Date(periodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            await resend.emails.send({
              from: 'TFC Championship <noreply@tfc-event.com>',
              to: userData.email,
              subject: `Payment Successful — Welcome to ${plan}!`,
              text: `Your payment was successful!\n\nWelcome to ${plan}. Your subscription is now active and you have full access to all TFC premium content.\n\nSubscription Details:\n- Plan: ${plan}\n- Status: Active\n- Expires: ${expiryDate}\n\nYou can now access all pro videos, exclusive content, and premium features.\n\nThank you for choosing TFC Championship!\n\nThe TFC Team\ncontact@tfc-event.com\ntfc-event.com`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;padding:40px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">
                        <tr>
                          <td style="background:#e01818;padding:28px 40px;text-align:center;">
                            <span style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-2px;font-style:italic;">TFC</span>
                            <span style="display:block;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:4px;margin-top:4px;">Total Full Contact Championship</span>
                          </td>
                        </tr>
                        <tr><td style="padding:40px;">
                          <div style="text-align:center;margin-bottom:32px;">
                            <div style="width:80px;height:80px;background:#e01818/20;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                              <span style="font-size:40px;">✓</span>
                            </div>
                            <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 8px;text-transform:uppercase;">Payment Successful</h1>
                            <p style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0;">Welcome to the Elite</p>
                          </div>

                          <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
                            Your payment was successful and your subscription is now active.
                          </p>

                          <table style="width:100%;background:#1a1a1a;border-radius:12px;padding:24px;margin:32px 0;">
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #333;">
                                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Plan</span><br/>
                                <span style="color:#ffffff;font-size:18px;font-weight:700;">${plan}</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;border-bottom:1px solid #333;">
                                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Status</span><br/>
                                <span style="color:#22c55e;font-size:18px;font-weight:700;">✓ Active</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:12px 0;">
                                <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Expires</span><br/>
                                <span style="color:#ffffff;font-size:18px;font-weight:700;">${expiryDate}</span>
                              </td>
                            </tr>
                          </table>

                          <div style="text-align:center;margin:32px 0;">
                            <a href="https://tfc-event.com/browse"
                               style="background:#e01818;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:18px 48px;border-radius:12px;display:inline-block;">
                              Start Watching Now
                            </a>
                          </div>

                          <p style="color:#888;font-size:13px;line-height:1.7;margin:0;text-align:center;">
                            You now have full access to all pro videos, exclusive content, and premium features.
                          </p>
                        </td></tr>
                        <tr>
                          <td style="background:#0a0a0a;padding:24px 40px;text-align:center;border-top:1px solid #222;">
                            <p style="color:#555;font-size:12px;margin:0 0 8px;">TFC Championship &mdash; <a href="https://tfc-event.com" style="color:#e01818;text-decoration:none;">tfc-event.com</a></p>
                            <p style="color:#444;font-size:11px;margin:0;">
                              <a href="https://www.facebook.com/tfc.event1" style="color:#555;text-decoration:none;margin:0 8px;">Facebook</a>
                              <a href="https://www.instagram.com/tfc_events/" style="color:#555;text-decoration:none;margin:0 8px;">Instagram</a>
                              <a href="https://www.youtube.com/@TFC.events" style="color:#555;text-decoration:none;margin:0 8px;">YouTube</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </div>
              `,
            });
            console.log(`✅ Payment success email sent to ${userData.email}`);
          }
        } catch (emailErr) {
          console.error('❌ Failed to send payment success email:', emailErr);
        }

        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
        if (snapshot.empty) break;
        const priceId = subscription.items.data[0].price.id;
        const plan = priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'Elite Pro' : 'Elite Premium';
        snapshot.forEach(doc => doc.ref.update({
          subscriptionStatus: subscription.status === 'active' ? 'active' : subscription.status,
          subscriptionPlan: plan,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }));
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
        if (!snapshot.empty) snapshot.forEach(doc => doc.ref.update({ subscriptionStatus: 'canceled', subscriptionPlan: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', invoice.subscription).get();
        if (!snapshot.empty) {
          snapshot.forEach(async (doc) => {
            await doc.ref.update({ 
              subscriptionStatus: 'past_due', 
              updatedAt: admin.firestore.FieldValue.serverTimestamp() 
            });
            
            // Send email notification to user
            const userData = doc.data();
            if (userData?.email) {
              try {
                await resend.emails.send({
                  from: 'TFC Championship <noreply@tfc-event.com>',
                  to: userData.email,
                  subject: 'Payment Failed — Update Your Payment Method',
                  text: `Your TFC subscription payment has failed. Please update your payment method to avoid interruption.\n\nLog in to your account and visit the Subscription page to update your payment details.\n\nTFC Championship\ncontact@tfc-event.com`,
                  html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e8e8e8;">
                      <h2 style="color:#c53030;border-bottom:2px solid #c53030;padding-bottom:10px;margin-top:0;">Payment Failed</h2>
                      <p style="color:#444;line-height:1.6;">Your TFC subscription payment has failed. Please update your payment method to avoid interruption.</p>
                      <p style="color:#444;line-height:1.6;margin-top:16px;"><strong>What to do:</strong></p>
                      <ol style="color:#444;line-height:1.8;padding-left:20px;">
                        <li>Log in to your TFC account</li>
                        <li>Go to the Subscription page</li>
                        <li>Click "Manage Subscription" to update your payment details</li>
                      </ol>
                      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">TFC Championship &mdash; <a href="mailto:contact@tfc-event.com" style="color:#c53030;">contact@tfc-event.com</a></p>
                    </div>
                  `,
                });
                console.log(`\u2705 Payment failure email sent to ${userData.email}`);
              } catch (emailErr) {
                console.error('\u274C Failed to send payment failure email:', emailErr);
              }
            }
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;
        const subscription = await stripeClient.subscriptions.retrieve(invoice.subscription);
        const snapshot = await db.collection('users').where('stripeSubscriptionId', '==', subscription.id).get();
        if (!snapshot.empty) {
          const priceId = subscription.items.data[0].price.id;
          const plan = priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'Elite Pro' : 'Elite Premium';
          snapshot.forEach(doc => doc.ref.update({
            subscriptionStatus: 'active',
            subscriptionPlan: plan,
            currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }));
          console.log(`\u2705 Renewal: subscription ${subscription.id} \u2014 ${plan}`);
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        // Find user by Stripe customer ID
        const snapshot = await db.collection('users').where('stripeCustomerId', '==', charge.customer).get();
        if (!snapshot.empty) {
          snapshot.forEach(doc => doc.ref.update({
            subscriptionStatus: 'canceled',
            subscriptionPlan: null,
            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(Date.now()),
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }));
          console.log(`\u2705 Refund processed: customer ${charge.customer} \u2014 access revoked`);
        }
        break;
      }
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
  }

  res.json({ received: true });
});

// ─── NOWPayments IPN Webhook — raw body required for HMAC verification ────────
app.post('/api/webhooks/nowpayments', express.raw({ type: 'application/json' }), async (req, res) => {
  const receivedSig = req.headers['x-nowpayments-sig'];
  if (!receivedSig) {
    console.error('❌ NOWPayments IPN: Missing signature header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  try {
    // Step 1: Parse raw body → sort keys → HMAC-SHA512 → timingSafeEqual
    const rawBody = req.body; // Buffer from express.raw()
    const payload = JSON.parse(rawBody.toString('utf8'));
    const sortedPayload = sortObject(payload);
    const sortedString = JSON.stringify(sortedPayload);

    const expectedSig = crypto
      .createHmac('sha512', NOWPAYMENTS_IPN_SECRET)
      .update(sortedString)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(receivedSig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('❌ NOWPayments IPN: Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Step 2: Extract data
    const { payment_status, order_id, payment_id, price_amount, actually_paid } = payload;
    console.log(`✅ NOWPayments IPN: status=${payment_status}, order=${order_id}, paid=${actually_paid}`);

    // Step 3: Idempotency — skip already processed orders (Firestore)
    const existingDoc = await db.collection('crypto_payments').doc(order_id).get();
    if (existingDoc.exists && existingDoc.data()?.processed) {
      console.log(`\u2139\uFE0F  NOWPayments: Order ${order_id} already processed, skipping`);
      return res.status(200).json({ received: true });
    }

    // Step 4: Payment logic — parse order_id to extract user_id and plan
    // order_id format: "${user_id}__${plan}__${timestamp}"
    const orderParts = order_id.split('__');
    const userId = orderParts[0];
    const planKey = orderParts[1]; // elite_pro or elite_premium
    const planConfig = PLAN_CONFIG[planKey];

    if (payment_status === 'finished') {
      const paid = parseFloat(actually_paid);
      const required = parseFloat(price_amount);

      if (paid >= required - 0.01) {
        // ACCEPT — exact payment or overpayment (tip)
        const tipAmount = paid > required + 0.01 ? parseFloat((paid - required).toFixed(2)) : 0;
        if (tipAmount > 0) {
          console.log(`\u2705 Payment accepted. Tip received: $${tipAmount}`);
        } else {
          console.log(`\u2705 Payment accepted. Exact amount received.`);
        }

        // Persist payment record to Firestore
        await db.collection('crypto_payments').doc(order_id).set({
          status: 'finished', processed: true, payment_id,
          price_amount, actually_paid, tipAmount,
          userId, planKey, processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Grant subscription
        if (planConfig && userId) {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + planConfig.days * 24 * 60 * 60 * 1000);
          try {
            await db.collection('users').doc(userId).set({
              subscriptionStatus: 'active',
              subscriptionPlan: planConfig.displayName,
              currentPeriodStart: admin.firestore.Timestamp.fromMillis(now.getTime()),
              currentPeriodEnd: admin.firestore.Timestamp.fromMillis(expiresAt.getTime()),
              paymentMethod: 'crypto',
              lastCryptoOrderId: order_id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`\u2705 NOWPayments: User ${userId} granted ${planConfig.displayName} until ${expiresAt.toISOString()}`);

            // Send payment success email
            try {
              const userDoc = await db.collection('users').doc(userId).get();
              const userData = userDoc.exists ? userDoc.data() : {};
              if (userData?.email) {
                const expiryDate = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                
                await resend.emails.send({
                  from: 'TFC Championship <noreply@tfc-event.com>',
                  to: userData.email,
                  subject: `Payment Successful — Welcome to ${planConfig.displayName}!`,
                  text: `Your crypto payment was successful!\n\nWelcome to ${planConfig.displayName}. Your subscription is now active and you have full access to all TFC premium content.\n\nSubscription Details:\n- Plan: ${planConfig.displayName}\n- Status: Active\n- Expires: ${expiryDate}\n- Payment Method: Crypto (USDT TRC20)\n${tipAmount > 0 ? `- Tip Amount: $${tipAmount.toFixed(2)} (Thank you!)` : ''}\n\nYou can now access all pro videos, exclusive content, and premium features.\n\nThank you for choosing TFC Championship!\n\nThe TFC Team\ncontact@tfc-event.com\ntfc-event.com`,
                  html: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;padding:40px 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">
                            <tr>
                              <td style="background:#10b981;padding:28px 40px;text-align:center;">
                                <span style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-2px;font-style:italic;">TFC</span>
                                <span style="display:block;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:4px;margin-top:4px;">Total Full Contact Championship</span>
                              </td>
                            </tr>
                            <tr><td style="padding:40px;">
                              <div style="text-align:center;margin-bottom:32px;">
                                <div style="width:80px;height:80px;background:#10b981/20;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                                  <span style="font-size:40px;">✓</span>
                                </div>
                                <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 8px;text-transform:uppercase;">Payment Successful</h1>
                                <p style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0;">Crypto Payment Confirmed</p>
                              </div>

                              <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 24px;text-align:center;">
                                Your crypto payment was successful and your subscription is now active.
                              </p>

                              <table style="width:100%;background:#1a1a1a;border-radius:12px;padding:24px;margin:32px 0;">
                                <tr>
                                  <td style="padding:12px 0;border-bottom:1px solid #333;">
                                    <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Plan</span><br/>
                                    <span style="color:#ffffff;font-size:18px;font-weight:700;">${planConfig.displayName}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0;border-bottom:1px solid #333;">
                                    <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Status</span><br/>
                                    <span style="color:#22c55e;font-size:18px;font-weight:700;">✓ Active</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0;border-bottom:1px solid #333;">
                                    <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Payment Method</span><br/>
                                    <span style="color:#ffffff;font-size:18px;font-weight:700;">₿ Crypto (USDT TRC20)</span>
                                  </td>
                                </tr>
                                ${tipAmount > 0 ? `
                                <tr>
                                  <td style="padding:12px 0;border-bottom:1px solid #333;">
                                    <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tip Amount</span><br/>
                                    <span style="color:#10b981;font-size:18px;font-weight:700;">$${tipAmount.toFixed(2)} (Thank you!)</span>
                                  </td>
                                </tr>
                                ` : ''}
                                <tr>
                                  <td style="padding:12px 0;">
                                    <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Expires</span><br/>
                                    <span style="color:#ffffff;font-size:18px;font-weight:700;">${expiryDate}</span>
                                  </td>
                                </tr>
                              </table>

                              <div style="text-align:center;margin:32px 0;">
                                <a href="https://tfc-event.com/browse"
                                   style="background:#10b981;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:18px 48px;border-radius:12px;display:inline-block;">
                                  Start Watching Now
                                </a>
                              </div>

                              <p style="color:#888;font-size:13px;line-height:1.7;margin:0;text-align:center;">
                                You now have full access to all pro videos, exclusive content, and premium features.
                              </p>
                            </td></tr>
                            <tr>
                              <td style="background:#0a0a0a;padding:24px 40px;text-align:center;border-top:1px solid #222;">
                                <p style="color:#555;font-size:12px;margin:0 0 8px;">TFC Championship &mdash; <a href="https://tfc-event.com" style="color:#e01818;text-decoration:none;">tfc-event.com</a></p>
                                <p style="color:#444;font-size:11px;margin:0;">
                                  <a href="https://www.facebook.com/tfc.event1" style="color:#555;text-decoration:none;margin:0 8px;">Facebook</a>
                                  <a href="https://www.instagram.com/tfc_events/" style="color:#555;text-decoration:none;margin:0 8px;">Instagram</a>
                                  <a href="https://www.youtube.com/@TFC.events" style="color:#555;text-decoration:none;margin:0 8px;">YouTube</a>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td></tr>
                      </table>
                    </div>
                  `,
                });
                console.log(`✅ Crypto payment success email sent to ${userData.email}`);
              }
            } catch (emailErr) {
              console.error('❌ Failed to send crypto payment success email:', emailErr);
            }
          } catch (fsErr) { console.error('\u274C Firestore crypto write error:', fsErr.message); }
        }
      } else {
        // REJECT — Underpayment
        const shortfall = parseFloat((required - paid).toFixed(2));
        console.log(`\u274C Payment REJECTED. Required: $${required}, Received: $${paid}, Shortfall: $${shortfall}`);

        await db.collection('crypto_payments').doc(order_id).set({
          status: 'underpaid', processed: false, payment_id,
          price_amount, actually_paid, userId, planKey,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Track non-finished statuses (waiting, confirming, sending, etc.)
      await db.collection('crypto_payments').doc(order_id).set({
        status: payment_status, processed: false, payment_id,
        userId: userId || null, planKey: planKey || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Always return 200 for valid (signature-verified) requests
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('\u274C NOWPayments IPN error:', err);
    return res.status(200).json({ received: true });
  }
});

// ─── JSON body parser ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Reject oversized payloads to prevent DoS

// ─── Auth middleware ──────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
    req.uid = decoded.uid;
    req.email = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Subscription middleware ──────────────────────────────────────────────────
const requireActiveSubscription = async (req, res, next) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    if (!userDoc.exists) return res.status(403).json({ error: 'subscription_required' });
    const data = userDoc.data();
    if (data.subscriptionStatus === 'active' && data.currentPeriodEnd?.toDate() > new Date()) {
      next();
    } else {
      return res.status(403).json({ error: 'subscription_required' });
    }
  } catch {
    return res.status(500).json({ error: 'Internal error' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/payments/create-checkout-session', verifyToken, async (req, res) => {
  const { plan } = req.body;
  if (!plan || !['monthly', 'yearly'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });

  // Stripe Monthly Price must be configured as $4.99/month recurring in Stripe Dashboard
  const priceId = plan === 'monthly' ? process.env.STRIPE_MONTHLY_PRICE_ID : process.env.STRIPE_YEARLY_PRICE_ID;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    let customerId = userData.stripeCustomerId;

    if (!customerId) {
      const customer = await stripeClient.customers.create({ email: req.email, metadata: { firebaseUid: req.uid } });
      customerId = customer.id;
    }

    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/subscription`,
      metadata: { firebaseUid: req.uid },
      subscription_data: { metadata: { firebaseUid: req.uid } },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('\u274C Checkout error:', err);
    res.status(500).json({ error: 'Payment session creation failed. Please try again.' });
  }
});

app.post('/api/payments/verify-session', verifyToken, async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'No session ID' });

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.metadata?.firebaseUid !== req.uid) return res.status(403).json({ error: 'Session mismatch' });
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Not paid' });

    const subscription = session.subscription;
    const priceId = subscription.items.data[0].price.id;
    const plan = priceId === process.env.STRIPE_MONTHLY_PRICE_ID ? 'Elite Pro' : 'Elite Premium';

    await db.collection('users').doc(req.uid).set({
      stripeCustomerId: session.customer,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true, plan });
  } catch (err) {
    console.error('❌ Verify session error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments/portal', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    if (!userDoc.exists || !userDoc.data().stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: userDoc.data().stripeCustomerId,
      return_url: `${frontendUrl}/subscription`,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payments/subscription-status', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    if (!userDoc.exists) return res.json({ status: 'none', plan: null });
    const data = userDoc.data();
    res.json({ status: data.subscriptionStatus || 'none', plan: data.subscriptionPlan || null, currentPeriodEnd: data.currentPeriodEnd?.toDate()?.toISOString() || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/pro/videos', verifyToken, requireActiveSubscription, async (req, res) => {
  try {
    const snapshot = await db.collection('pro_videos').orderBy('order').get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pro/videos/:videoId', verifyToken, requireActiveSubscription, async (req, res) => {
  try {
    const doc = await db.collection('pro_videos').doc(req.params.videoId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/free/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('free_videos').orderBy('order').get();
    res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CHAMPIONS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// Get all approved champions (public) — sorted client-side to avoid composite index
app.get('/api/champions', async (req, res) => {
  try {
    const snapshot = await db.collection('champions')
      .where('status', '==', 'approved')
      .get();
    const docs = snapshot.docs.map(doc => {
      const data = doc.data();
      const { email, phone, dateOfBirth, ...publicData } = data;
      return { id: doc.id, ...publicData };
    });
    // Sort by createdAt descending client-side
    docs.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });
    res.json(docs);
  } catch (err) {
    console.error('❌ Champions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Get ALL champions (all statuses) ──────────────────────────────────
app.get('/api/admin/champions', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('champions').get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });
    res.json(docs);
  } catch (err) {
    console.error('❌ Admin champions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Approve or Reject a champion application ─────────────────────────
app.patch('/api/admin/champions/:id', verifyToken, async (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use: approved, rejected, pending' });
  }
  try {
    await db.collection('champions').doc(req.params.id).update({
      status,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: req.email,
    });
    res.json({ success: true, id: req.params.id, status });
  } catch (err) {
    console.error('❌ Admin champion update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit become a champion application
app.post('/api/champions/apply',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        firstName, lastName, nickname, phone, email, dateOfBirth,
        country, height, weight, association, classSpeciality,
        wins, koTko, decisions, losses, submissions, organisation,
        tapologyLink, sherdogLink, tfcLink, facebookLink, instagramLink, youtubeLink,
      } = req.body;

      // Validate required fields
      const required = { firstName, lastName, nickname, phone, email, dateOfBirth, country, height, weight, association, classSpeciality, wins, decisions, losses, submissions, organisation };
      const missing = Object.entries(required).filter(([, v]) => !v || v.trim() === '').map(([k]) => k);
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }

      if (!req.files?.profilePicture) {
        return res.status(400).json({ error: 'Profile picture is required' });
      }

      let profileUrl = null;
      if (req.files?.profilePicture && req.files.profilePicture[0]) {
        const file = req.files.profilePicture[0];
        const fileName = `champion_${Date.now()}`;
        profileUrl = await uploadToImgBB(file.buffer, fileName);
      }

      const championData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        nickname: nickname.trim(),
        phone: phone.trim(),
        email: email.trim(),
        dateOfBirth: dateOfBirth.trim(),
        country: country.trim(),
        height: parseFloat(height),
        weight: parseFloat(weight),
        association: association.trim(),
        classSpeciality: classSpeciality.trim(),
        record: {
          wins: parseInt(wins) || 0,
          koTko: parseInt(koTko) || 0,
          decisions: parseInt(decisions) || 0,
          losses: parseInt(losses) || 0,
          submissions: parseInt(submissions) || 0,
        },
        organisation: organisation.trim(),
        links: {
          tapology: tapologyLink?.trim() || '',
          sherdog: sherdogLink?.trim() || '',
          tfc: tfcLink?.trim() || '',
          facebook: facebookLink?.trim() || '',
          instagram: instagramLink?.trim() || '',
          youtube: youtubeLink?.trim() || '',
        },
        images: {
          profile: profileUrl,
        },
        status: 'pending', // admin must approve
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('champions').add(championData);

      // Send confirmation email to applicant via Resend
      try {
        const applicantRes = await resend.emails.send({
          from: 'TFC Championship <noreply@tfc-event.com>',
          replyTo: 'contact@tfc-event.com',
          to: email,
          subject: 'Your TFC Champion application has been received',
          text: `Hello ${firstName} ${lastName},\n\nThank you for submitting your TFC Champion application. We have received it and our team will review your profile shortly.\n\nApplication summary:\n- Name: ${firstName} ${lastName}\n- Nickname: ${nickname}\n- Weight class: ${classSpeciality}\n- Record: ${wins}W - ${losses}L\n\nWe will be in touch.\n\nThe TFC Championship Team\ncontact@tfc-event.com\ntfc-event.com`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:40px;border:1px solid #e8e8e8;">
              <div style="border-bottom:3px solid #c53030;padding-bottom:16px;margin-bottom:24px;">
                <h1 style="color:#c53030;font-size:24px;font-weight:900;text-transform:uppercase;margin:0;">TFC Championship</h1>
              </div>
              <h2 style="font-size:18px;font-weight:700;color:#111;margin-top:0;">Application Received</h2>
              <p style="color:#444;line-height:1.6;">Hello <strong>${firstName} ${lastName}</strong>,</p>
              <p style="color:#444;line-height:1.6;">Thank you for submitting your TFC Champion application. We have received it and our team will review your profile shortly.</p>
              <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden;margin:24px 0;">
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:10px 16px;color:#777;font-size:13px;width:130px;">Name</td>
                  <td style="padding:10px 16px;font-weight:600;color:#111;">${firstName} ${lastName}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:10px 16px;color:#777;font-size:13px;">Nickname</td>
                  <td style="padding:10px 16px;font-weight:600;color:#111;">${nickname}</td>
                </tr>
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:10px 16px;color:#777;font-size:13px;">Weight Class</td>
                  <td style="padding:10px 16px;font-weight:600;color:#111;">${classSpeciality}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;color:#777;font-size:13px;">Record</td>
                  <td style="padding:10px 16px;font-weight:600;color:#111;">${wins}W &mdash; ${losses}L</td>
                </tr>
              </table>
              <p style="color:#444;line-height:1.6;">We will be in touch with you soon.</p>
              <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px;">TFC Championship Team &mdash; <a href="mailto:contact@tfc-event.com" style="color:#c53030;">contact@tfc-event.com</a></p>
            </div>
          `,
        });
        if (applicantRes.error) console.error('❌ Applicant email error from Resend:', applicantRes.error);
      } catch (err) {
        console.error('❌ Applicant email exception:', err);
      }

      // Notify admin
      try {
        const makeUrl = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;
        const linkRows = [
          tapologyLink && `<tr><td style="padding:4px 0;color:#555;width:100px;"><strong>Tapology</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${tapologyLink}</td></tr>`,
          sherdogLink && `<tr><td style="padding:4px 0;color:#555;"><strong>Sherdog</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${sherdogLink}</td></tr>`,
          tfcLink && `<tr><td style="padding:4px 0;color:#555;"><strong>TFC Profile</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${tfcLink}</td></tr>`,
          facebookLink && `<tr><td style="padding:4px 0;color:#555;"><strong>Facebook</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${facebookLink}</td></tr>`,
          instagramLink && `<tr><td style="padding:4px 0;color:#555;"><strong>Instagram</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${instagramLink}</td></tr>`,
          youtubeLink && `<tr><td style="padding:4px 0;color:#555;"><strong>YouTube</strong></td><td style="padding:4px 0;color:#c53030;word-break:break-all;">${youtubeLink}</td></tr>`,
        ].filter(Boolean).join('\n');

        const adminRes = await resend.emails.send({
          from: 'TFC Championship <noreply@tfc-event.com>',
          replyTo: email,
          to: 'contact@tfc-event.com',
          subject: `New champion application: ${firstName} ${lastName}`,
          text: `New champion application received.\n\nName: ${firstName} ${lastName}\nNickname: ${nickname}\nEmail: ${email}\nPhone: ${phone}\nDate of Birth: ${dateOfBirth}\nCountry: ${country}\nHeight: ${height}m | Weight: ${weight}kg\nAssociation: ${association}\nClass: ${classSpeciality}\nRecord: ${wins}W / ${koTko} KO / ${decisions} DEC / ${losses}L / ${submissions} SUB\nOrganisation: ${organisation}\n\nLinks:\nTapology: ${tapologyLink}\nSherdog: ${sherdogLink}\nTFC Profile: ${tfcLink}\nFacebook: ${facebookLink}\nInstagram: ${instagramLink}\nYouTube: ${youtubeLink}\n\nApplication ID: ${docRef.id}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;border:1px solid #e8e8e8;">
              <h2 style="color:#c53030;margin-top:0;border-bottom:2px solid #c53030;padding-bottom:10px;">New Champion Application</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:6px 0;color:#555;width:130px;"><strong>Name</strong></td><td style="padding:6px 0;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Nickname</strong></td><td style="padding:6px 0;">${nickname}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Date of Birth</strong></td><td style="padding:6px 0;">${dateOfBirth}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Email</strong></td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#c53030;">${email}</a></td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Phone</strong></td><td style="padding:6px 0;">${phone}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Country</strong></td><td style="padding:6px 0;">${country}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Height / Weight</strong></td><td style="padding:6px 0;">${height}m / ${weight}kg</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Association</strong></td><td style="padding:6px 0;">${association}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Class</strong></td><td style="padding:6px 0;">${classSpeciality}</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Record</strong></td><td style="padding:6px 0;">${wins}W / ${koTko} KO / ${decisions} DEC / ${losses}L / ${submissions} SUB</td></tr>
                <tr><td style="padding:6px 0;color:#555;"><strong>Organisation</strong></td><td style="padding:6px 0;">${organisation}</td></tr>
              </table>
              ${linkRows ? `
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
                <h3 style="color:#333;margin-top:0;font-size:16px;">Social & Links</h3>
                <p style="color:#888;font-size:12px;margin-bottom:8px;">Copy and paste the URLs below into your browser:</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  ${linkRows}
                </table>
              </div>` : ''}
              <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eee;">
                <h3 style="color:#333;margin-top:0;font-size:16px;">📸 Profile Photo</h3>
                ${profileUrl ? `<p style="color:#666;font-size:14px;word-break:break-all;">Copy this URL to view the photo:<br><br><span style="color:#c53030;">${profileUrl}</span></p>` : '<p style="color:#666;font-size:14px;">No photo uploaded or file was too large.</p>'}
              </div>
              <p style="color:#999;font-size:12px;border-top:1px solid #eee;padding-top:12px;margin-top:24px;">Application ID: ${docRef.id}</p>
            </div>
          `
        });
        if (adminRes.error) console.error('❌ Admin email error from Resend:', adminRes.error);
      } catch (adminErr) {
        console.error('❌ Admin email exception:', adminErr);
      }

      res.json({ success: true, id: docRef.id, message: 'Application submitted successfully!' });
    } catch (err) {
      console.error('❌ Champion apply error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS ROUTES
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_ADMIN_EMAILS = ['benbrayekhamza1@gmail.com', 'tfcevents67@gmail.com'];
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean),
  ...DEFAULT_ADMIN_EMAILS,
];
const isAdminEmail = (email) => ADMIN_EMAILS.includes((email || '').trim().toLowerCase());

// Middleware: verify token AND email must be admin
const requireAdmin = async (req, res, next) => {
  if (!isAdminEmail(req.email)) {
    return res.status(403).json({ error: 'Admin access only' });
  }
  next();
};

// GET /api/events — public, returns all events sorted by date desc
app.get('/api/events', cacheMiddleware(1800), async (req, res) => {
  try {
    const snapshot = await db.collection('events').get();
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    docs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(docs);
  } catch (err) {
    console.error('❌ Events fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/events — admin creates an event
app.post('/api/admin/events', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, number, date, location, status, url, image } = req.body;
    if (!name || !date || !location) {
      return res.status(400).json({ error: 'name, date and location are required' });
    }
    
    // Auto-calculate status based on date if not explicitly provided
    let eventStatus = status;
    if (!eventStatus) {
      const eventDate = new Date(date);
      const now = new Date();
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEvent < 0) {
        eventStatus = 'past';
      } else if (daysUntilEvent <= 7) {
        eventStatus = 'recent';
      } else {
        eventStatus = 'upcoming';
      }
    } else {
      const validStatuses = ['upcoming', 'recent', 'past'];
      eventStatus = validStatuses.includes(status) ? status : 'upcoming';
    }

    const docRef = await db.collection('events').add({
      name: name.trim(),
      number: number ? parseInt(number) : null,
      date: date.trim(),
      location: location.trim(),
      status: eventStatus,
      url: url?.trim() || '',
      image: image?.trim() || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Clear events cache
    cache.del('__express__/api/events');
    
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('❌ Create event error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/events/:id — admin updates an event
app.patch('/api/admin/events/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, number, date, location, status, url, image } = req.body;
    const validStatuses = ['upcoming', 'recent', 'past'];
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    if (name !== undefined)     updates.name = name.trim();
    if (number !== undefined)   updates.number = number ? parseInt(number) : null;
    if (date !== undefined)     updates.date = date.trim();
    if (location !== undefined) updates.location = location.trim();
    
    // Auto-calculate status if date changed but status not explicitly set
    if (date !== undefined && status === undefined) {
      const eventDate = new Date(date);
      const now = new Date();
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEvent < 0) {
        updates.status = 'past';
      } else if (daysUntilEvent <= 7) {
        updates.status = 'recent';
      } else {
        updates.status = 'upcoming';
      }
    } else if (status !== undefined && validStatuses.includes(status)) {
      updates.status = status;
    }
    
    if (url !== undefined)      updates.url = url.trim();
    if (image !== undefined)    updates.image = image.trim();

    await db.collection('events').doc(req.params.id).update(updates);
    
    // Clear events cache
    cache.del('__express__/api/events');
    
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('❌ Update event error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/events/:id — admin removes an event
app.delete('/api/admin/events/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('events').doc(req.params.id).delete();
    
    // Clear events cache
    cache.del('__express__/api/events');
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete event error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// S2 FIX — Firebase Auth ↔ Firestore Sync
// Deleting a user from Firebase Console leaves an orphan in Firestore.
// This endpoint lets the admin console clean up orphaned Firestore users.
// Also called automatically whenever UsersManager loads.
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/admin/sync-auth-users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const firestoreSnap = await db.collection('users').get();
    const deleted = [];
    await Promise.all(firestoreSnap.docs.map(async (doc) => {
      try {
        await admin.auth().getUser(doc.id); // will throw if deleted from Auth
      } catch (e) {
        if (e.code === 'auth/user-not-found') {
          await db.collection('users').doc(doc.id).delete();
          // also clean champion applications
          const champSnap = await db.collection('champions').where('userId', '==', doc.id).get();
          await Promise.all(champSnap.docs.map(d => d.ref.delete()));
          deleted.push(doc.id);
        }
      }
    }));
    res.json({ success: true, deletedOrphans: deleted.length, deleted });
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT FORM — via Resend
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  // Validate lengths
  if (name.length > 100 || email.length > 254 || message.length > 5000) {
    return res.status(400).json({ error: 'Input too long' });
  }

  // Sanitize for HTML email template
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  try {
    await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: 'contact@tfc-event.com',
      replyTo: email,
      subject: `Message from ${safeName} \u2014 TFC website`,
      text: `You have a new message from the TFC website contact form.\n\nFrom: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nTFC Championship\ncontact@tfc-event.com`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e8e8e8;">
          <h2 style="color:#c53030;border-bottom:2px solid #c53030;padding-bottom:10px;margin-top:0;">New Contact Message \u2014 TFC Website</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#555;width:80px;"><strong>From:</strong></td><td style="padding:8px 0;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;color:#555;"><strong>Email:</strong></td><td style="padding:8px 0;"><a href="mailto:${safeEmail}" style="color:#c53030;">${safeEmail}</a></td></tr>
          </table>
          <p style="color:#555;margin-top:16px;"><strong>Message:</strong></p>
          <p style="background:#f9f9f9;border-left:4px solid #c53030;padding:16px;margin:0;color:#333;line-height:1.6;">${safeMessage}</p>
          <p style="color:#999;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">TFC Championship &mdash; contact@tfc-event.com</p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('\u274C Contact email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH EMAILS via Firebase Admin SDK + Resend
// ═══════════════════════════════════════════════════════════════════════════

// Shared HTML email wrapper
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TFC Championship</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">
        <!-- Header -->
        <tr>
          <td style="background:#e01818;padding:28px 40px;text-align:center;">
            <span style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-2px;font-style:italic;">TFC</span>
            <span style="display:block;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:4px;margin-top:4px;">Total Full Contact Championship</span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 40px;text-align:center;border-top:1px solid #222;">
            <p style="color:#555;font-size:12px;margin:0 0 8px;">TFC Championship &mdash; <a href="https://tfc-event.com" style="color:#e01818;text-decoration:none;">tfc-event.com</a></p>
            <p style="color:#444;font-size:11px;margin:0;">
              <a href="https://www.facebook.com/tfc.event1" style="color:#555;text-decoration:none;margin:0 8px;">Facebook</a>
              <a href="https://www.instagram.com/tfc_events/" style="color:#555;text-decoration:none;margin:0 8px;">Instagram</a>
              <a href="https://www.youtube.com/@TFC.events" style="color:#555;text-decoration:none;margin:0 8px;">YouTube</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// Rate limiting map (email → last request timestamp)
const authRateLimit = new Map();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute between emails

const checkRateLimit = (email) => {
  const last = authRateLimit.get(email);
  if (last && Date.now() - last < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
    return { limited: true, waitSec };
  }
  authRateLimit.set(email, Date.now());
  return { limited: false };
};

// ─── Send Verification Email (called after signup) ────────────────────────────
app.post('/api/auth/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const rl = checkRateLimit(`verify_${email}`);
  if (rl.limited) return res.status(429).json({ error: `Please wait ${rl.waitSec} seconds before requesting another email.` });

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const actionCodeSettings = {
      url: `${frontendUrl}/verify-email`,
      handleCodeInApp: false,
    };

    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);

    const html = emailWrapper(`
      <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.5px;">Confirm Your Email</h2>
      <p style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 28px;">Account Verification</p>

      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Welcome to TFC Championship. Please confirm your email address to activate your account and get full access.
      </p>

      <div style="text-align:center;margin:36px 0;">
        <a href="${link}"
           style="background:#e01818;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:18px 48px;border-radius:12px;display:inline-block;">
          Confirm My Account
        </a>
      </div>

      <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 12px;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px;word-break:break-all;font-size:11px;color:#888;">${link}</p>

      <div style="margin-top:28px;padding:16px;background:#1a1a1a;border-left:3px solid #e01818;border-radius:4px;">
        <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">
          <strong style="color:#aaa;">Security note:</strong> This link expires in 24 hours. 
          If you did not create a TFC account, you can safely ignore this email.
        </p>
      </div>
    `);

    const text = `Welcome to TFC Championship.\n\nPlease confirm your email address by clicking the link below:\n\n${link}\n\nThis link expires in 24 hours.\n\nIf you did not create a TFC account, ignore this email.\n\n— TFC Championship\ncontact@tfc-event.com`;

    await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: email,
      replyTo: 'contact@tfc-event.com',
      subject: 'Confirm your TFC account',
      html,
      text,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Send verification error:', err);
    // If user not found in Firebase Auth, still return success to avoid enumeration
    if (err.code === 'auth/user-not-found') return res.json({ success: true });
    res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
  }
});

// ─── Send Password Reset Email ────────────────────────────────────────────────
app.post('/api/auth/send-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const rl = checkRateLimit(`reset_${email}`);
  if (rl.limited) return res.status(429).json({ error: `Please wait ${rl.waitSec} seconds before requesting another email.` });

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const actionCodeSettings = {
      url: `${frontendUrl}/reset-password`,
      handleCodeInApp: false,
    };

    const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    const html = emailWrapper(`
      <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.5px;">Reset Your Password</h2>
      <p style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 28px;">Account Security</p>

      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 20px;">
        We received a request to reset the password for your TFC account. Click the button below to choose a new password.
      </p>

      <div style="text-align:center;margin:36px 0;">
        <a href="${link}"
           style="background:#e01818;color:#ffffff;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;padding:18px 48px;border-radius:12px;display:inline-block;">
          Reset My Password
        </a>
      </div>

      <p style="color:#666;font-size:12px;line-height:1.6;margin:0 0 12px;">
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      <p style="background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:12px;word-break:break-all;font-size:11px;color:#888;">${link}</p>

      <div style="margin-top:28px;padding:16px;background:#1a1a1a;border-left:3px solid #e01818;border-radius:4px;">
        <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">
          <strong style="color:#aaa;">This link expires in 1 hour.</strong><br/>
          If you did not request a password reset, your account is safe — simply ignore this email.
        </p>
      </div>
    `);

    const text = `Password reset request for your TFC account.\n\nClick the link below to set a new password:\n\n${link}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email. Your account is safe.\n\n— TFC Championship\ncontact@tfc-event.com`;

    await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: email,
      replyTo: 'contact@tfc-event.com',
      subject: 'Reset your TFC password',
      html,
      text,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Send reset error:', err);
    // Don't reveal if user exists
    if (err.code === 'auth/user-not-found') return res.json({ success: true });
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO PAYMENT ROUTES (NOWPayments)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/crypto/create-payment — Create NOWPayments invoice for a specific plan
app.post('/api/crypto/create-payment', verifyToken, async (req, res) => {
  const { plan } = req.body;
  const user_id = req.uid; // From verified token
  if (!plan || !PLAN_CONFIG[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Must be "elite_pro" or "elite_premium"' });
  }

  const planConfig = PLAN_CONFIG[plan];
  const order_id = `${user_id}__${plan}__${Date.now()}`;

  try {
    const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
      price_amount: planConfig.price,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id,
      order_description: planConfig.displayName,
      ipn_callback_url: process.env.NOWPAYMENTS_IPN_URL,
      success_url: process.env.SUCCESS_URL || 'http://localhost:5173/payment/success',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:5173/subscription',
      is_fixed_rate: true,
    }, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    res.json({ payment_url: response.data.invoice_url });
  } catch (err) {
    console.error('\u274C NOWPayments create-payment error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.message || 'Failed to create crypto payment' });
  }
});

// GET /api/crypto/subscription-status/:userId — Check user's crypto subscription (Firestore)
app.get('/api/crypto/subscription-status/:userId', verifyToken, async (req, res) => {
  // Users can only check their own subscription
  if (req.uid !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    if (!userDoc.exists) return res.json({ active: false, reason: 'no_subscription' });
    const data = userDoc.data();
    if (data.paymentMethod !== 'crypto') return res.json({ active: false, reason: 'not_crypto' });
    const endTime = data.currentPeriodEnd?.toDate?.() || new Date(0);
    const active = data.subscriptionStatus === 'active' && endTime > new Date();
    if (active) {
      return res.json({ active: true, plan: data.subscriptionPlan, expires_at: endTime.toISOString() });
    } else {
      return res.json({ active: false, reason: 'expired', expires_at: endTime.toISOString() });
    }
  } catch (err) {
    console.error('\u274C Crypto subscription check error:', err);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// GET /api/crypto/payment-status/:orderId — Check crypto payment status (Firestore)
app.get('/api/crypto/payment-status/:orderId', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('crypto_payments').doc(req.params.orderId).get();
    if (!doc.exists) return res.json({ status: 'none', processed: false });
    const data = doc.data();
    // Only allow the payment owner to check
    if (data.userId && data.userId !== req.uid) return res.status(403).json({ error: 'Forbidden' });
    res.json(data);
  } catch (err) {
    console.error('\u274C Crypto payment status error:', err);
    res.status(500).json({ error: 'Failed to check payment' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — VIDEO MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/videos — list all videos (admin)
app.get('/api/admin/videos', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').get();
    const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(videos);
  } catch (err) {
    console.error('❌ Admin videos fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/videos — add a new video
app.post('/api/admin/videos', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, videoUrl, thumbnail, description, category, type, duration } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'title and videoUrl are required' });
    }
    const videoData = {
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      thumbnail: thumbnail?.trim() || '',
      description: description?.trim() || '',
      category: category?.trim() || '',
      type: type || 'free', // 'free' or 'pro'
      isPremium: type === 'pro',
      duration: duration?.trim() || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('videos').add(videoData);
    
    // Clear videos cache
    cache.del('__express__/api/videos');
    
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('❌ Create video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/videos/:id — edit a video
app.patch('/api/admin/videos/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, videoUrl, thumbnail, description, category, type, duration } = req.body;
    const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (title !== undefined) updates.title = title.trim();
    if (videoUrl !== undefined) updates.videoUrl = videoUrl.trim();
    if (thumbnail !== undefined) updates.thumbnail = thumbnail.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (duration !== undefined) updates.duration = duration.trim();
    if (type !== undefined) {
      updates.type = type;
      updates.isPremium = type === 'pro';
    }
    await db.collection('videos').doc(req.params.id).update(updates);
    
    // Clear videos cache
    cache.del('__express__/api/videos');
    
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('❌ Edit video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/videos/:id — delete a video
app.delete('/api/admin/videos/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.collection('videos').doc(req.params.id).delete();
    
    // Clear videos cache
    cache.del('__express__/api/videos');
    
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete video error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/videos — public: list all published videos for Browse/Home
app.get('/api/videos', cacheMiddleware(1800), async (req, res) => {
  try {
    // Determine if caller has an active subscription (optional auth)
    let isSubscriber = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
        if (decoded?.uid) {
          const userDoc = await db.collection('users').doc(decoded.uid).get();
          const userData = userDoc.data() || {};
          const now = admin.firestore.Timestamp.now();
          isSubscriber =
            userData.subscriptionStatus === 'active' &&
            userData.currentPeriodEnd &&
            userData.currentPeriodEnd.toMillis() > now.toMillis();
        }
      } catch (_) { /* invalid token - treat as guest */ }
    }

    const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').get();
    const seenVideoKeys = new Set();
    const extractYouTubeId = (url) => {
      if (!url) return null;
      const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]+)/,
        /[?&]v=([a-zA-Z0-9_-]+)/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    };
    const videos = snapshot.docs.reduce((result, doc) => {
      const data = doc.data();
      const youtubeId = data.youtubeId || extractYouTubeId(data.videoUrl);
      const videoKey = youtubeId ? `youtube:${youtubeId}` : `id:${doc.id}`;
      if (seenVideoKeys.has(videoKey)) return result;
      seenVideoKeys.add(videoKey);

      const isPremium = data.isPremium || false;
      result.push({
        id: doc.id,
        title: data.title,
        youtubeId: youtubeId || '',
        // Only expose videoUrl for free content or verified subscribers
        videoUrl: (!isPremium || isSubscriber) ? data.videoUrl : null,
        thumbnail: data.thumbnail || '',
        description: data.description || '',
        category: data.category || '',
        type: data.type || 'free',
        isPremium,
        duration: data.duration || '',
      });
      return result;
    }, []);
    res.json(videos);
  } catch (err) {
    console.error('❌ Public videos fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — CATEGORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/categories — list all categories with video counts
app.get('/api/admin/categories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const catSnap = await db.collection('categories').orderBy('createdAt', 'desc').get();
    const vidSnap = await db.collection('videos').get();
    const videoCounts = {};
    vidSnap.docs.forEach(doc => {
      const cat = doc.data().category || '';
      if (cat) videoCounts[cat] = (videoCounts[cat] || 0) + 1;
    });
    const categories = catSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      videoCount: videoCounts[doc.data().name] || 0,
    }));
    res.json(categories);
  } catch (err) {
    console.error('❌ Admin categories fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/categories — add a new category
app.post('/api/admin/categories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
    const existing = await db.collection('categories').where('name', '==', name.trim()).get();
    if (!existing.empty) return res.status(400).json({ error: 'Category already exists' });
    const docRef = await db.collection('categories').add({
      name: name.trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error('❌ Add category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/categories/:id — edit a category
app.patch('/api/admin/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
    const catDoc = await db.collection('categories').doc(req.params.id).get();
    if (!catDoc.exists) return res.status(404).json({ error: 'Category not found' });
    const oldName = catDoc.data().name;
    await db.collection('categories').doc(req.params.id).update({
      name: name.trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Update all videos that used the old category name
    if (oldName !== name.trim()) {
      const videoSnap = await db.collection('videos').where('category', '==', oldName).get();
      const batch = db.batch();
      videoSnap.docs.forEach(doc => batch.update(doc.ref, { category: name.trim() }));
      await batch.commit();
    }
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('❌ Edit category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/categories/:id — delete a category
app.delete('/api/admin/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const catDoc = await db.collection('categories').doc(req.params.id).get();
    if (!catDoc.exists) return res.status(404).json({ error: 'Category not found' });
    const catName = catDoc.data().name;
    const videoSnap = await db.collection('videos').where('category', '==', catName).get();
    if (!videoSnap.empty) {
      return res.status(400).json({
        error: `Cannot delete: ${videoSnap.size} video(s) are using this category. Reassign them first.`,
        videoCount: videoSnap.size,
      });
    }
    await db.collection('categories').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete category error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/categories — public: list all categories
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('categories').orderBy('name').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (err) {
    console.error('❌ Public categories fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/users — list all users from Firestore
app.get('/api/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || '',
        username: data.username || '',
        role: data.role || 'user',
        createdAt: data.createdAt || null,
        emailVerified: data.emailVerified || false,
        subscriptionStatus: data.subscriptionStatus || 'none',
        subscriptionPlan: data.subscriptionPlan || null,
        currentPeriodEnd: data.currentPeriodEnd?.toDate()?.toISOString() || null,
        provider: data.provider || 'email',
      };
    });
    // Sort by createdAt descending
    users.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
    res.json(users);
  } catch (err) {
    console.error('❌ Admin users fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:uid — delete user from Firebase Auth AND Firestore
app.delete('/api/admin/users/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    const uid = req.params.uid;
    // Don't allow deleting yourself
    if (uid === req.uid) return res.status(400).json({ error: 'Cannot delete your own account' });

    // 1. Get user doc FIRST to extract email for champion cleanup
    const userDoc = await db.collection('users').doc(uid).get();
    const email = userDoc.exists ? userDoc.data().email : null;

    // 2. Delete from Firebase Auth
    try { await admin.auth().deleteUser(uid); } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') console.error('Auth delete warning:', authErr.message);
    }

    // 3. Delete Firestore user doc
    try { await db.collection('users').doc(uid).delete(); } catch {}

    // 4. Delete any champion applications by this user's email
    if (email) {
      const champSnap = await db.collection('champions').where('email', '==', email).get();
      if (!champSnap.empty) {
        const batch = db.batch();
        champSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Admin delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:uid/role — promote or revoke admin
app.patch('/api/admin/users/:uid/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "admin" or "user"' });
    }
    const uid = req.params.uid;
    if (uid === req.uid && role === 'user') {
      return res.status(400).json({ error: 'Cannot revoke your own admin access' });
    }
    await db.collection('users').doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, uid, role });
  } catch (err) {
    console.error('❌ Admin role update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/admin/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [usersSnap, videosSnap, categoriesSnap, championsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('videos').get(),
      db.collection('categories').get(),
      db.collection('champions').get(),
    ]);

    let freeVideos = 0;
    let proVideos = 0;
    videosSnap.docs.forEach(doc => {
      if (doc.data().isPremium || doc.data().type === 'pro') proVideos++;
      else freeVideos++;
    });

    let activeSubscribers = 0;
    let cryptoSubscribers = 0;
    let stripeSubscribers = 0;
    let freeUsers = 0;
    
    usersSnap.docs.forEach(doc => {
      const data = doc.data();
      const isActive = data.subscriptionStatus === 'active';
      const hasStripe = data.stripeSubscriptionId;
      const paymentMethod = data.paymentMethod;
      
      if (isActive) {
        activeSubscribers++;
        if (hasStripe) {
          stripeSubscribers++;
        } else if (paymentMethod === 'crypto') {
          cryptoSubscribers++;
        }
      } else {
        freeUsers++;
      }
    });

    let pendingChampions = 0;
    let approvedChampions = 0;
    championsSnap.docs.forEach(doc => {
      if (doc.data().status === 'pending') pendingChampions++;
      if (doc.data().status === 'approved') approvedChampions++;
    });

    res.json({
      totalUsers: usersSnap.size,
      totalVideos: videosSnap.size,
      freeVideos,
      proVideos,
      totalCategories: categoriesSnap.size,
      activeSubscribers,
      cryptoSubscribers,
      stripeSubscribers,
      freeUsers,
      totalChampions: championsSnap.size,
      pendingChampions,
      approvedChampions,
    });
  } catch (err) {
    console.error('❌ Admin stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-SIDE ACCOUNT DELETION (full cleanup)
// ═══════════════════════════════════════════════════════════════════════════

const deleteCodes = new Map();

app.post('/api/account/delete-request', verifyToken, async (req, res) => {
  try {
    const { email, uid } = req;
    if (!email) return res.status(400).json({ error: 'No email associated with account.' });

    // Rate limiting: 1 minute
    const lastReq = authRateLimit.get(`delete_${email}`);
    if (lastReq && Date.now() - lastReq < 60000) {
      return res.status(429).json({ error: 'Please wait before requesting another code.' });
    }
    authRateLimit.set(`delete_${email}`, Date.now());

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    deleteCodes.set(uid, { code, expires: Date.now() + 15 * 60000 }); // 15 mins expiry

    const html = emailWrapper(`
      <h2 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:-0.5px;">Account Deletion Request</h2>
      <p style="color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 28px;">Action Required</p>
      <p style="color:#cccccc;font-size:15px;line-height:1.7;margin:0 0 20px;">
        You have requested to permanently delete your TFC Championship account. Enter the following code to confirm this action:
      </p>
      <div style="text-align:center;margin:36px 0;">
        <div style="background:#1a1a1a;border:2px solid #333;color:#e01818;font-size:32px;font-weight:900;letter-spacing:10px;padding:20px;border-radius:12px;display:inline-block;">
          ${code}
        </div>
      </div>
      <div style="margin-top:28px;padding:16px;background:#1a1a1a;border-left:3px solid #e01818;border-radius:4px;">
        <p style="color:#888;font-size:12px;margin:0;line-height:1.6;">
          <strong style="color:#aaa;">Security note:</strong> This code expires in 15 minutes. 
          If you did not request this, please change your password immediately.
        </p>
      </div>
    `);

    await resend.emails.send({
      from: 'TFC Championship <noreply@tfc-event.com>',
      to: email,
      subject: 'TFC Account Deletion Verification Code',
      html,
    });

    res.json({ success: true, message: 'Verification code sent.' });
  } catch (err) {
    console.error('❌ Delete request error:', err);
    res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

app.post('/api/account/delete-verify', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const uid = req.uid;
    const email = req.email;

    const storedData = deleteCodes.get(uid);
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code requested.' });
    }
    if (Date.now() > storedData.expires) {
      deleteCodes.delete(uid);
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }
    if (storedData.code !== code.toString()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Code matches, proceed with deletion
    deleteCodes.delete(uid);

    // 1. Delete Firestore user document
    try { await db.collection('users').doc(uid).delete(); } catch {}

    // 2. Delete any champion applications
    if (email) {
      try {
        const champSnap = await db.collection('champions').where('email', '==', email).get();
        const batch = db.batch();
        champSnap.docs.forEach(doc => batch.delete(doc.ref));
        if (!champSnap.empty) await batch.commit();
      } catch {}
    }

    // 3. Delete from Firebase Auth
    try { await admin.auth().deleteUser(uid); } catch (authErr) {
      if (authErr.code !== 'auth/user-not-found') {
        console.error('Auth delete error:', authErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  console.log('[API] Health hit!');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 TFC Backend running on http://localhost:${PORT}`);
  console.log(`📡 Stripe webhook: http://localhost:${PORT}/api/webhooks/stripe`);
  console.log(`₿  NOWPayments webhook: http://localhost:${PORT}/api/webhooks/nowpayments`);
  console.log(`💰 Crypto payment: http://localhost:${PORT}/api/crypto/create-payment`);
  console.log(`🏆 Champions API: http://localhost:${PORT}/api/champions`);
  console.log(`🎬 Videos API: http://localhost:${PORT}/api/videos`);
  console.log(`📊 Admin Stats: http://localhost:${PORT}/api/admin/stats\n`);
});
