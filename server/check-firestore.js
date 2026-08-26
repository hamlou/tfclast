require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');

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

async function checkData() {
  const users = await db.collection('users').get();
  console.log(`Users found: ${users.size}`);
  users.docs.forEach(doc => {
    console.log(`- ${doc.data().email} (Role: ${doc.data().role || 'none'})`);
    if (doc.data().email === 'hamloudhia@gmail.com') {
      db.collection('users').doc(doc.id).update({ role: 'admin' });
      console.log('Set hamloudhia@gmail.com to admin!');
    }
  });
}

checkData().then(() => process.exit(0)).catch(console.error);
