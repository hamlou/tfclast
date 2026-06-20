import React from 'react';
import { Play, Crown, Heart, Plus, Clock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';

const ContentCard = ({ item, onPlay }) => {
  const { toggleMyList, myList } = useUser();
  const isFavorite = myList.some(i => i.id === item.id);
  
  // Fallback thumbnail if YouTube thumbnail fails to load
  const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600';
  
  const [thumbnailSrc, setThumbnailSrc] = React.useState(item.thumbnail);

  const handleImageError = () => {
    console.log(`⚠️ Thumbnail failed for ${item.title}, using fallback`);
    setThumbnailSrc(DEFAULT_THUMBNAIL);
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="relative flex-none w-full sm:w-56 md:w-72 group cursor-pointer"
      onClick={() => onPlay(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-video bg-surface rounded-2xl overflow-hidden border border-gray-800 transition-all duration-300 group-hover:border-primary/50 shadow-lg">
        <img 
          src={thumbnailSrc} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={handleImageError}
        />
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="bg-primary p-3 rounded-full text-black hover:scale-110 transition-transform shadow-xl shadow-primary/20"
            >
              <Play className="w-6 h-6 fill-black" />
            </button>
            <div className="flex space-x-2">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleMyList(item); }}
                className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all ${isFavorite ? 'bg-primary text-black' : 'bg-black/40 text-white hover:bg-white/20'}`}
              >
                {isFavorite ? <Heart className="w-4 h-4 fill-black" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {item.isPremium && (
            <div className="bg-primary text-black text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center">
              <Crown className="w-3 h-3 mr-1 fill-black" />
              PRO
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 px-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Live Event</span>
          <span className="text-[9px] font-bold text-gray-500 flex items-center">
            <Clock className="w-2.5 h-2.5 mr-1" /> {item.duration}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate tracking-tight">
          {item.title}
        </h3>
      </div>
    </motion.div>
  );
};

export default ContentCard;
