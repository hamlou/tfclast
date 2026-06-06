export const mockUser = {
  id: 'u1',
  username: 'TFC_Explorer',
  email: 'explorer@tfc.tv',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Explorer',
  type: 'Free',
  plan: 'Basic',
  role: 'admin',
  points: 100,
  joinedDate: new Date().toISOString()
};

export const mockUsersList = [
  { id: 'u1', username: 'TFC_Explorer', email: 'explorer@tfc.tv', type: 'Free', plan: 'Basic', points: 100, role: 'admin' },
  { id: 'u2', username: 'John_Doe', email: 'john@gmail.com', type: 'Free', plan: 'Basic', points: 150, role: 'user' },
  { id: 'u3', username: 'Sarah_Pro', email: 'sarah@tfc.tv', type: 'Premium', plan: 'Elite Red', points: 1200, role: 'user' },
  { id: 'u4', username: 'Gamer_X', email: 'gamerx@twitch.tv', type: 'Free', plan: 'Basic', points: 45, role: 'user' },
];

export let mockVideos = [
  { id: 'v1', title: 'Cyberpunk Grand Prix', isPremium: true, thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', duration: '2h 15m', views: 1240 },
  { id: 'v2', title: 'Neon Night City', isPremium: false, thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', duration: '1h 45m', views: 890 },
  { id: 'v3', title: 'E-Sports World Finals', isPremium: true, thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800', videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', duration: '3h 00m', views: 5600 },
  { id: 'v4', title: 'Deep Sea Explorers', isPremium: false, thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de7?w=800', videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', duration: '55m', views: 420 },
  { id: 'v5', title: 'Mars Station Alpha', isPremium: true, thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800', videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', duration: '1h 20m', views: 3100 },
];

export let mockCategories = [
  { id: 'cat1', title: 'Featured', items: [mockVideos[0], mockVideos[2]] },
  { id: 'cat2', title: 'Trending', items: [mockVideos[1], mockVideos[3]] },
  { id: 'cat3', title: 'New Releases', items: [mockVideos[4], mockVideos[0]] },
];

export const mockAnalytics = {
  totalViews: 154200,
  activeUsers: 8420,
  revenue: 12450.50,
  subscribers: 1240,
  viewsByDay: [420, 580, 890, 720, 1100, 1400, 1250],
  trafficSource: { Direct: 40, Social: 30, Organic: 20, Referral: 10 }
};

export const mockRewards = [
  { id: 'r1', title: '1 Month Premium', cost: 500 },
  { id: 'r2', title: 'Exclusive Avatar Frame', cost: 200 },
  { id: 'r3', title: 'VIP Event Pass', cost: 1000 },
];

// Mock API Functions
export const fetchUser = () => Promise.resolve(mockUser);
export const fetchAllUsers = () => Promise.resolve(mockUsersList);
export const fetchVideos = () => Promise.resolve(mockVideos);
export const fetchCategories = () => Promise.resolve(mockCategories);
export const fetchAnalytics = () => Promise.resolve(mockAnalytics);


export const mockSubscriptionPlans = [
  { id: 'p2', name: 'Elite Pro', price: '$4.99/mo', duration: '1 Month', features: ['Full access to all Pro videos', '1080p & 4K Quality', 'Ad-Free Viewing', 'VIP Access', 'Priority Rewards', 'Exclusive Badges'] },
  { id: 'p3', name: 'Elite Premium', price: '$43.99/yr', duration: '12 Months', features: ['Full access to all Pro videos', '1080p & 4K Quality', 'Ad-Free Viewing', 'VIP Access', 'Priority Rewards', 'Exclusive Badges', 'Save more than 25%'] },
];

export const simulatePayment = async (planId) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true, transactionId: 'TX-' + Math.random().toString(36).substr(2, 9) }), 1500);
  });
};


export const simulateRedeemReward = (rewardId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Reward redeemed successfully!' });
    }, 800);
  });
};

