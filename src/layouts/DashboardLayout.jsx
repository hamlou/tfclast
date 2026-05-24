import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { motion } from 'framer-motion';

import Footer from '../components/Footer';

const DashboardLayout = () => {
  return (
    <div className="bg-background min-h-screen text-white flex flex-col md:flex-row relative">
      <Sidebar />
      <main className="flex-1 md:ml-20 lg:ml-64 pb-20 md:pb-0 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
          <Footer />
        </motion.div>

      </main>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;
