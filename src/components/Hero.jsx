import React, { useState, useEffect } from 'react';
import { Play, Calendar, Share2, Info, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = ({ content, onPlay }) => {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', mins: '00', secs: '00' });

  useEffect(() => {
    const target = new Date('2026-02-01T20:00:00');
    const interval = setInterval(() => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0');
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const mins = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const secs = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setTimeLeft({ days, hours, mins, secs });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
      {/* Background with Parallel Parallax Effect */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <img
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />
      </motion.div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-24 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center space-x-3">
            <span className="bg-primary text-black text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-sm shadow-[0_0_15px_#FF3131]">
              Exclusive Premiere
            </span>
            <div className="h-px w-12 bg-gray-600" />
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Live in 4K HDR</span>
          </div>

          <h2 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85]">
            {content.title} <br />
            <span className="text-primary italic">{content.subtitle}</span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl font-medium leading-relaxed">
            {content.description}
          </p>

          {/* Countdown Timer */}
          <div className="flex space-x-4 py-4">
            {Object.entries(timeLeft).map(([label, value]) => (
              <div key={label} className="text-center">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-xl">
                  <span className="text-xl md:text-2xl font-black text-primary">{value}</span>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-2">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <button
              onClick={onPlay}
              className="group relative flex items-center space-x-4 bg-primary hover:bg-red-600 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform hover:scale-105 shadow-2xl shadow-primary/20"
            >
              <Play className="w-6 h-6 fill-black" />
              <span>Watch Now</span>
            </button>

            <button className="flex items-center space-x-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all">
              <Info className="w-6 h-6" />
              <span>More Info</span>
            </button>
          </div>
        </motion.div>
      </div>


      {/* Visual Accents */}
      <div className="absolute bottom-12 right-24 hidden lg:flex items-center space-x-8 z-20">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Global Viewers</p>
          <p className="text-2xl font-black text-white">1.2M+</p>
        </div>
        <div className="w-px h-12 bg-gray-800" />
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Platform Rating</p>
          <div className="flex text-primary">
            {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
