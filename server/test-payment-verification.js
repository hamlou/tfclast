#!/usr/bin/env node
/**
 * TFC Payment System Verification Script
 *
 * Run with: node server/test-payment-verification.js
 *
 * This script verifies that the payment system is working correctly by:
 * 1. Checking recent Stripe subscriptions
 * 2. Checking crypto payments
 * 3. Verifying pro video access is protected
 * 4. Checking for any fraud alerts
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}
const db = admin.firestore();

async function verifyPaymentSystem() {
  console.log('\n' + '='.repeat(60));
  console.log('  TFC PAYMENT SYSTEM VERIFICATION');
  console.log('='.repeat(60) + '\n');

  let issues = [];

  // ─── 1. Check Environment Variables ───────────────────────────────────────
  console.log('1️⃣  ENVIRONMENT VARIABLES');
  console.log('-'.repeat(40));

  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_MONTHLY_PRICE_ID',
    'STRIPE_YEARLY_PRICE_ID',
    'NOWPAYMENTS_API_KEY',
    'NOWPAYMENTS_IPN_SECRET',
    'NOWPAYMENTS_IPN_URL',
    'VIDEO_SECRET',
  ];

  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ❌ ${varName}: MISSING`);
      issues.push(`Missing env var: ${varName}`);
    } else if (varName.includes('SECRET') || varName.includes('KEY')) {
      console.log(`   ✅ ${varName}: ****${value.slice(-4)}`);
    } else {
      console.log(`   ✅ ${varName}: ${value.slice(0, 30)}...`);
    }
  });

  // ─── 2. Check Active Subscriptions ────────────────────────────────────────
  console.log('\n2️⃣  ACTIVE SUBSCRIPTIONS');
  console.log('-'.repeat(40));

  try {
    const usersSnap = await db.collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();

    let stripeCount = 0;
    let cryptoCount = 0;
    let expiredCount = 0;
    const now = new Date();

    usersSnap.docs.forEach(doc => {
      const d = doc.data();
      const endDate = d.currentPeriodEnd?.toDate();
      const isExpired = endDate && endDate < now;

      if (isExpired) {
        expiredCount++;
      } else if (d.paymentMethod === 'crypto') {
        cryptoCount++;
      } else {
        stripeCount++;
      }
    });

    console.log(`   📊 Total active subscriptions: ${usersSnap.size}`);
    console.log(`      • Stripe: ${stripeCount}`);
    console.log(`      • Crypto: ${cryptoCount}`);
    if (expiredCount > 0) {
      console.log(`      ⚠️ Expired but still marked active: ${expiredCount}`);
      issues.push(`${expiredCount} subscriptions marked active but already expired`);
    }

    // Show last 5 recent subscriptions
    console.log('\n   Recent subscriptions:');
    const recentSnap = await db.collection('users')
      .where('subscriptionStatus', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .limit(5)
      .get();

    recentSnap.docs.forEach(doc => {
      const d = doc.data();
      const expiry = d.currentPeriodEnd?.toDate()?.toLocaleDateString() || 'N/A';
      console.log(`      - ${d.email?.slice(0, 20)}... | ${d.subscriptionPlan} | Exp: ${expiry}`);
    });

  } catch (err) {
    console.log(`   ❌ Error fetching subscriptions: ${err.message}`);
    issues.push(`Subscription fetch error: ${err.message}`);
  }

  // ─── 3. Check Crypto Payments ─────────────────────────────────────────────
  console.log('\n3️⃣  CRYPTO PAYMENTS (Last 10)');
  console.log('-'.repeat(40));

  try {
    const cryptoSnap = await db.collection('crypto_payments')
      .orderBy('processedAt', 'desc')
      .limit(10)
      .get();

    if (cryptoSnap.empty) {
      console.log('   📭 No crypto payments recorded yet');
    } else {
      let successCount = 0;
      let underpaidCount = 0;

      cryptoSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === 'finished' && d.processed) {
          successCount++;
        } else if (d.status === 'underpaid') {
          underpaidCount++;
        }

        const statusIcon = d.processed ? '✅' : d.status === 'underpaid' ? '❌' : '⏳';
        console.log(`   ${statusIcon} ${doc.id.slice(0, 30)}...`);
        console.log(`      Status: ${d.status} | Paid: $${d.actually_paid || 0} / Required: $${d.price_amount || 0}`);
      });

      console.log(`\n   Summary: ${successCount} successful, ${underpaidCount} underpaid`);
    }
  } catch (err) {
    console.log(`   ❌ Error fetching crypto payments: ${err.message}`);
  }

  // ─── 4. Check Video Protection ────────────────────────────────────────────
  console.log('\n4️⃣  VIDEO PROTECTION');
  console.log('-'.repeat(40));

  try {
    const allVideos = await db.collection('videos').get();
    const freeVideos = allVideos.docs.filter(d => !d.data().isPremium);
    const proVideos = allVideos.docs.filter(d => d.data().isPremium);

    console.log(`   📹 Total videos: ${allVideos.size}`);
    console.log(`      • Free videos: ${freeVideos.length}`);
    console.log(`      • Pro videos: ${proVideos.length}`);

    // Check if any pro videos have missing URLs
    const proWithoutUrl = proVideos.filter(d => !d.data().videoUrl);
    if (proWithoutUrl.length > 0) {
      console.log(`   ⚠️ ${proWithoutUrl.length} pro videos missing videoUrl`);
      issues.push(`${proWithoutUrl.length} pro videos missing videoUrl`);
    } else {
      console.log(`   ✅ All pro videos have videoUrl set`);
    }
  } catch (err) {
    console.log(`   ❌ Error checking videos: ${err.message}`);
  }

  // ─── 5. Check Video Access Logs ───────────────────────────────────────────
  console.log('\n5️⃣  VIDEO ACCESS LOGS (Last 24h)');
  console.log('-'.repeat(40));

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logsSnap = await db.collection('video_access_logs')
      .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(oneDayAgo))
      .get();

    console.log(`   📊 Video accesses in last 24h: ${logsSnap.size}`);

    // Group by user
    const byUser = {};
    logsSnap.docs.forEach(doc => {
      const userId = doc.data().userId;
      byUser[userId] = (byUser[userId] || 0) + 1;
    });

    const topUsers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topUsers.length > 0) {
      console.log('   Top users by access count:');
      topUsers.forEach(([userId, count]) => {
        const flag = count > 50 ? '⚠️' : '  ';
        console.log(`   ${flag} ${userId.slice(0, 20)}...: ${count} accesses`);
      });
    }
  } catch (err) {
    console.log(`   📭 No access logs yet (collection may not exist)`);
  }

  // ─── 6. Check Fraud Alerts ────────────────────────────────────────────────
  console.log('\n6️⃣  FRAUD ALERTS');
  console.log('-'.repeat(40));

  try {
    const alertsSnap = await db.collection('fraud_alerts')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (alertsSnap.empty) {
      console.log('   ✅ No fraud alerts');
    } else {
      console.log(`   ⚠️ ${alertsSnap.size} recent fraud alerts:`);
      alertsSnap.docs.forEach(doc => {
        const d = doc.data();
        const time = d.timestamp?.toDate()?.toISOString() || 'N/A';
        console.log(`      - ${d.type}: User ${d.userId?.slice(0, 15)}... (${d.ipCount || 0} IPs) at ${time}`);
      });
    }
  } catch (err) {
    console.log(`   📭 No fraud alerts collection yet`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  if (issues.length === 0) {
    console.log('\n   ✅ All checks passed! Payment system looks healthy.\n');
  } else {
    console.log(`\n   ⚠️ ${issues.length} issue(s) found:\n`);
    issues.forEach((issue, i) => {
      console.log(`      ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  console.log('='.repeat(60) + '\n');

  process.exit(issues.length > 0 ? 1 : 0);
}

// Run verification
verifyPaymentSystem().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
