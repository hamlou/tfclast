// Script to add missing videos from ContentData.js to Firestore
// Run: node server/add-missing-videos.js

const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

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

// Extract YouTube ID from URL
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Videos from ContentData.js that should be in the database
const videosToAdd = [
  // Featured Events
  {
    title: 'Valorant Champions Tour 2026',
    videoUrl: 'https://youtu.be/FV3MuhN2bX0?si=9Se0ihSu2q4pJqUY',
    thumbnail: 'https://img.youtube.com/vi/FV3MuhN2bX0/maxresdefault.jpg',
    description: 'Featured TFC event',
    category: 'Featured Events',
    type: 'free',
    isPremium: false,
    duration: '',
    order: 1,
  },
  // Trending Now
  {
    title: 'Vanguard Fight — Omar Libya VS Mohamed Amine Tunisia',
    videoUrl: 'https://youtu.be/g2_OUdB3iLc?si=xf-Q3tSSY_bNcn06',
    thumbnail: 'https://img.youtube.com/vi/g2_OUdB3iLc/hqdefault.jpg',
    description: 'Vanguard Fight featuring Omar Libya VS Mohamed Amine Tunisia',
    category: 'Trending Now',
    type: 'free',
    isPremium: false,
    duration: '',
    order: 1,
  },
  {
    title: 'TFC Event 0079 The War — Mohamed Aziz VS Ayman Attar 71KG',
    videoUrl: 'https://youtu.be/_Hnv-qLWK84?si=8q0gR1NoLD2PaEcX',
    thumbnail: 'https://img.youtube.com/vi/_Hnv-qLWK84/maxresdefault.jpg',
    description: 'TFC Event 0079 The War featuring Mohamed Aziz VS Ayman Attar 71KG',
    category: 'Trending Now',
    type: 'free',
    isPremium: false,
    duration: '',
    order: 2,
  },
  {
    title: 'TFC Event',
    videoUrl: 'https://youtu.be/XDwPsiy4NPw?si=lLbvmTKRRlyLY22x',
    thumbnail: 'https://img.youtube.com/vi/XDwPsiy4NPw/maxresdefault.jpg',
    description: 'TFC Event highlights',
    category: 'Trending Now',
    type: 'free',
    isPremium: false,
    duration: '',
    order: 3,
  },
  // PRO Exclusive
  {
    title: 'TFC 81 Gladiators — Full Event',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://tfc-event.com/wp-content/uploads/2024/08/WhatsApp-Image-2024-08-13-a-21.27.25_f7cede16.jpg',
    description: 'Full event coverage of TFC 81 Gladiators',
    category: 'PRO Exclusive',
    type: 'pro',
    isPremium: true,
    duration: '',
    order: 1,
  },
  {
    title: 'TFC 79 The War — Full Event',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://tfc-event.com/wp-content/uploads/2024/08/0079-THE.png',
    description: 'Full event coverage of TFC 79 The War',
    category: 'PRO Exclusive',
    type: 'pro',
    isPremium: true,
    duration: '',
    order: 2,
  },
  // Top Picks
  {
    title: 'TFC Titans Fight — Full Event',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    thumbnail: 'https://tfc-event.com/wp-content/uploads/2024/08/Titan-Fight-scaled.jpg',
    description: 'Full event coverage of TFC Titans Fight',
    category: 'Top Picks',
    type: 'pro',
    isPremium: true,
    duration: '',
    order: 1,
  },
];

async function addMissingVideos() {
  console.log('🎬 Adding missing videos to Firestore...\n');

  try {
    // Get existing videos to avoid duplicates
    const existingVideos = await db.collection('videos').get();
    const existingTitles = new Set();
    const existingUrls = new Set();
    
    existingVideos.forEach(doc => {
      const data = doc.data();
      existingTitles.add(data.title);
      existingUrls.add(data.videoUrl);
    });

    console.log(`📊 Found ${existingVideos.size} existing videos in database\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const video of videosToAdd) {
      // Check if video already exists
      if (existingTitles.has(video.title) || existingUrls.has(video.videoUrl)) {
        console.log(`⏭️  SKIPPED (already exists): ${video.title}`);
        skippedCount++;
        continue;
      }

      // Extract YouTube ID
      const youtubeId = extractYouTubeId(video.videoUrl);
      
      // Add video to Firestore
      await db.collection('videos').add({
        ...video,
        youtubeId: youtubeId || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const icon = video.isPremium ? '🔒' : '✅';
      console.log(`${icon} ADDED: ${video.title} (${video.category})`);
      addedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully added ${addedCount} new videos`);
    console.log(`⏭️  Skipped ${skippedCount} existing videos`);
    console.log(`📊 Total videos in database: ${existingVideos.size + addedCount}`);
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding videos:', error);
    process.exit(1);
  }
}

addMissingVideos();
