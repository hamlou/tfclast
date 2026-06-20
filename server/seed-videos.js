// Run this once to add test videos to Firestore
// Command: node server/seed-videos.js

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

const freeVideos = [
  {
    title: 'Neon Night City',
    description: 'A free preview of the TFC experience. No subscription needed.',
    youtubeId: 'ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    duration: '1h 45m',
    order: 1,
  },
  {
    title: 'Deep Sea Explorers',
    description: 'Free content available to all TFC members.',
    youtubeId: 'ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de7?w=800',
    duration: '55m',
    order: 2,
  },
];

const proVideos = [
  {
    title: 'Cyberpunk Grand Prix',
    description: 'Exclusive PRO content. Subscribe to unlock.',
    youtubeId: 'ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    duration: '2h 15m',
    order: 1,
  },
  {
    title: 'E-Sports World Finals',
    description: 'The biggest esports event of the year. PRO exclusive.',
    youtubeId: 'ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    duration: '3h 00m',
    order: 2,
  },
  {
    title: 'Mars Station Alpha',
    description: 'Journey to the stars. PRO members only.',
    youtubeId: 'ScMzIvxBSi4',
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
    duration: '1h 20m',
    order: 3,
  },
];

async function seedVideos() {
  console.log('🌱 Seeding Firestore with test videos...\n');
  const seenYoutubeIds = new Set();

  const addVideo = async (video, type) => {
    if (seenYoutubeIds.has(video.youtubeId)) {
      console.log(`SKIPPED duplicate YouTube video: ${video.title}`);
      return;
    }

    seenYoutubeIds.add(video.youtubeId);
    await db.collection('videos').add({
      ...video,
      type,
      isPremium: type === 'pro',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`${type === 'pro' ? 'PRO' : 'FREE'} video added: ${video.title}`);
  };

  // Add free videos
  for (const video of freeVideos) {
    await addVideo(video, 'free');
  }

  // Add pro videos
  for (const video of proVideos) {
    await addVideo(video, 'pro');
  }

  console.log('\n✅ Done! Firestore is ready.');
  process.exit(0);
}

seedVideos().catch(err => {
  console.error('❌ Error seeding:', err);
  process.exit(1);
});
