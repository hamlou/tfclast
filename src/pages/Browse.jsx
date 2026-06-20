import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CATEGORIES } from '../data/ContentData';
import ContentCard from '../components/ContentCard';
import { Search as SearchIcon, Filter } from 'lucide-react';
import SEO from '../components/SEO';
import UpgradeModal from '../components/UpgradeModal';
import VideoPlayer from '../components/VideoPlayer';
import { useUser } from '../context/UserContext';
import { AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { getVideoDeduplicationKey } from '../utils/video';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Browse = () => {
  const [firestoreVideos, setFirestoreVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState(false);
  const hardcodedItems = videosError ? CATEGORIES.flatMap(c => c.items) : [];
  const [activeVideo, setActiveVideo] = useState(null);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');

  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
  }, [location.state?.searchQuery]);
  const { user, addToHistory, hasActiveSubscription } = useUser();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch admin-managed videos from Firestore — send auth token so subscribers get premium URLs
  useEffect(() => {
    const fetchVideos = async () => {
      setVideosLoading(true);
      setVideosError(false);
      try {
        const headers = {};
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken().catch(() => null);
          if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${BACKEND}/api/videos`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setFirestoreVideos(data);
        } else {
          setVideosError(true);
        }
      } catch {
        setVideosError(true);
      } finally {
        setVideosLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Merge: Firestore videos first, then hardcoded ones. Deduplicate by YouTube ID first.
  const mergedItems = (() => {
    const seen = new Set();
    const result = [];

    const addVideo = (v) => {
      const key = getVideoDeduplicationKey(v);
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      result.push(v);
    };

    for (const v of firestoreVideos) addVideo(v);
    for (const v of hardcodedItems) addVideo(v);

    return result;
  })();

  // Real search filtering
  const filteredItems = searchQuery.trim()
    ? mergedItems.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mergedItems;

  const handlePlay = (item) => {
    if (item.isPremium && !hasActiveSubscription()) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveVideo(item);
    addToHistory(item);
  };

  return (
    <div className="p-4 md:p-8 lg:p-16 max-w-7xl mx-auto">
      <SEO
        title="Browse Library"
        description="Explore the full TFC library of live events, e-sports, and exclusive shows."
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">Explore Content</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">
            {searchQuery ? `${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''} for "${searchQuery}"` : 'Discover your next favorite show'}
          </p>
        </div>
        <div className="flex space-x-3 md:space-x-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-all w-full md:w-64"
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="p-3 bg-surface border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 text-xl font-bold">No videos found for "{searchQuery}"</p>
          <button onClick={() => setSearchQuery('')} className="mt-4 text-primary font-bold uppercase text-sm tracking-widest hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {filteredItems.map((item) => (
            <ContentCard key={item.id} item={item} onPlay={handlePlay} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeVideo && (
          <VideoPlayer
            url={activeVideo.videoUrl}
            title={activeVideo.title}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default Browse;
