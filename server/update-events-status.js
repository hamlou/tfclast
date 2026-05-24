/*
  Migration Script: Update all events with dates before 2025 to 'past' status
  Run: node update-events-status.js
*/
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const admin = require('firebase-admin');

// Initialize Firebase Admin
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

async function updateEventsStatus() {
  try {
    console.log('🔄 Starting events status migration...');
    
    const eventsSnap = await db.collection('events').get();
    console.log(`📊 Found ${eventsSnap.size} events`);
    
    let updated = 0;
    let skipped = 0;
    const now = new Date();
    
    for (const doc of eventsSnap.docs) {
      const data = doc.data();
      const eventDate = new Date(data.date);
      
      // Only update if status is not already set or if date is before 2025
      if (eventDate.getFullYear() < 2025 || !data.status) {
        const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        
        let newStatus;
        if (daysUntilEvent < 0) {
          newStatus = 'past';
        } else if (daysUntilEvent <= 7) {
          newStatus = 'recent';
        } else {
          newStatus = 'upcoming';
        }
        
        // Only update if status changed
        if (data.status !== newStatus) {
          await doc.ref.update({ 
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`✅ Updated "${data.name}" from "${data.status}" to "${newStatus}"`);
          updated++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    }
    
    console.log(`\n✨ Migration complete!`);
    console.log(`📈 Updated: ${updated} events`);
    console.log(`⏭️  Skipped: ${skipped} events`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

updateEventsStatus();
