import React, { useState } from 'react';
import { CATEGORIES } from '../data/ContentData';
import ContentCard from '../components/ContentCard';
import { Search as SearchIcon } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import UpgradeModal from '../components/UpgradeModal';
import { useUser } from '../context/UserContext';
import { AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Search = () => {
  const allItems = CATEGORIES.flatMap(c => c.items);
  const [query, setQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { addToHistory, hasActiveSubscription } = useUser();

  const results = query.trim()
    ? allItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handlePlay = (item) => {
    if (item.isPremium && !hasActiveSubscription()) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveVideo(item);
    addToHistory(item);
  };

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen">
      <SEO title="Search" description="Search TFC content library." />
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-8">Search</h2>

      <div className="relative max-w-2xl mb-12">
        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          autoFocus
          type="text"
          placeholder="Search for events, fighters, shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface border border-gray-800 rounded-2xl py-5 pl-14 pr-6 text-base focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {query.trim() === '' ? (
        <div className="text-center py-24 text-gray-600">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="font-bold uppercase tracking-widest text-sm">Start typing to search</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-gray-500 text-xl font-bold">No results for "{query}"</p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-8">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {results.map(item => (
              <ContentCard key={item.id} item={item} onPlay={handlePlay} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {activeVideo && (
          <VideoPlayer url={activeVideo.videoUrl} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
        )}
      </AnimatePresence>
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
};

export default Search;
