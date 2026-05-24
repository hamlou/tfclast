import React from 'react';
import ContentCard from './ContentCard';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ContentCarousel = ({ category, items, onPlay }) => {
  return (
    <section className="pl-8 md:pl-16">
      <div className="flex items-center justify-between pr-8 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-1 h-8 bg-primary shadow-[0_0_15px_#FF3131]" />
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
            {category}
          </h2>
        </div>
        <button className="group flex items-center text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
          View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="flex space-x-6 overflow-x-auto pb-10 no-scrollbar pr-16 mask-fade-right">
        {items.map((item, i) => (
          <ContentCard
            key={item.id}
            item={item}
            onPlay={onPlay}
          />
        ))}
      </div>
    </section>
  );
};

export default ContentCarousel;
