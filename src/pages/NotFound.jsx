import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-[12rem] font-black text-primary/10 leading-none select-none">404</h1>
        <h2 className="text-4xl font-black uppercase tracking-tighter -mt-8 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-10">The page you're looking for doesn't exist or was moved.</p>
        <button onClick={() => navigate('/')} className="bg-primary hover:bg-red-600 text-black font-black py-4 px-10 rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-105">
          Go Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
