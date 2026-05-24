const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log('Firebase initialized');
  const db = admin.firestore();
  
  console.log('Fetching champions...');
  db.collection('champions').limit(1).get()
    .then(snapshot => {
      console.log('Snapshot received, size:', snapshot.size);
      process.exit(0);
    })
    .catch(err => {
      console.error('Error fetching:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('Initialization error:', err);
  process.exit(1);
}
