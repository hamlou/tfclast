import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Clock } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

import SEO from '../components/SEO';

import UpgradeModal from '../components/UpgradeModal';

const History = () => {
  const { watchHistory, user, addToHistory } = useUser();
  const [activeVideo, setActiveVideo] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handlePlay = (item) => {
    if (item.isPremium && user?.type !== 'Premium') {
      setShowUpgradeModal(true);
      return;
    }
    setActiveVideo(item);
    addToHistory(item);
  };


  return (
    <div className="p-8 md:p-16 max-w-6xl mx-auto min-h-screen">
      <SEO 
        title="Watch History" 
        description="Resume watching where you left off. Manage your TFC watch history." 
      />
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Watch History</h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Last 30 days
          </p>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {watchHistory.length > 0 ? (
          watchHistory.map((item, i) => (
            <motion.div 
              key={item.id + i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 p-6 bg-surface border border-gray-800 rounded-3xl hover:border-primary transition-all cursor-pointer relative overflow-hidden"
              onClick={() => handlePlay(item)}

            >
              <div className="relative w-full md:w-64 aspect-video bg-surface-light rounded-2xl overflow-hidden border border-gray-800">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 fill-primary text-primary" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {item.isPremium && <span className="bg-primary text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-sm">Premium</span>}
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Event</span>
                </div>
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-4">Watched on {new Date(item.watchedAt).toLocaleDateString()}</p>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-3/4" />
                </div>
              </div>

              <button className="p-3 text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-600 font-black uppercase tracking-[0.2em]">Your history is empty</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <VideoPlayer 
            url={activeVideo.videoUrl || 'https://www.youtube.com/watch?v=ScMzIvxBSi4'}
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


export default History;
