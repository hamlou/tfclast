import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Crown, ChevronRight } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import SEO from '../components/SEO';
import UpgradeModal from '../components/UpgradeModal';
import { useNavigate } from 'react-router-dom';

const MyList = () => {
  const { myList, toggleMyList, user, addToHistory, hasActiveSubscription } = useUser();
  const [activeVideo, setActiveVideo] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();

  const handlePlay = (item) => {
    if (item.isPremium && !hasActiveSubscription()) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveVideo(item);
    addToHistory(item);
  };

  const isSubscribed = hasActiveSubscription();

  return (
    <div className="p-4 sm:p-8 md:p-16 max-w-6xl mx-auto min-h-screen">
      <SEO title="My List" description="Your personal TFC collection." />
      <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-8 sm:mb-12">My List</h2>

      {/* Subscription promo banner for non-subscribers */}
      {!isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/subscription')}
          className="cursor-pointer mb-10 bg-gradient-to-r from-gray-900 to-black border border-primary/30 hover:border-primary/70 rounded-3xl p-6 flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-black uppercase tracking-tight">Unlock PRO Content</p>
              <p className="text-gray-400 text-sm">Get access to all exclusive TFC events from $4.99/mo</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-1 transition-transform" />
        </motion.div>
      )}

      {myList.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-gray-800 rounded-3xl">
          <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Your list is empty</h3>
          <p className="text-gray-500 text-sm">Add videos by clicking the + button on any content card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {myList.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative bg-surface rounded-2xl overflow-hidden border border-gray-800 group hover:border-primary/40 transition-all"
            >
              <div className="relative aspect-video">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handlePlay(item)} className="bg-primary p-4 rounded-full hover:scale-110 transition-transform shadow-xl shadow-primary/30">
                    <Play className="w-6 h-6 fill-black text-black" />
                  </button>
                </div>
                {item.isPremium && (
                  <div className="absolute top-2 right-2 bg-primary text-black text-[9px] font-black uppercase px-2 py-1 rounded flex items-center space-x-1">
                    <Crown className="w-3 h-3 fill-black" /><span>PRO</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate flex-1">{item.title}</h3>
                <button onClick={() => toggleMyList(item)} className="ml-3 p-2 text-primary hover:text-red-400 transition-colors">
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {activeVideo && <VideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} onClose={() => setActiveVideo(null)} />}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default MyList;
