import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Layers, Users, CreditCard, Trophy, BarChart3, LogOut, ChevronLeft, Calendar } from 'lucide-react';
import { useUser } from '../context/UserContext';

import { motion } from 'framer-motion';

const AdminSidebar = ({ onClose }) => {
  const navigate = useNavigate();
  const { setIsLogoutModalOpen } = useUser();
  
  const handleNavigate = (path) => {
    navigate(path);
    if (onClose) onClose();
  };
  
  const menuItems = [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/admin' },
    { label: 'Videos',        icon: Video,           path: '/admin/videos' },
    { label: 'Categories',    icon: Layers,          path: '/admin/categories' },
    { label: 'Users',         icon: Users,           path: '/admin/users' },
    { label: 'Subscriptions', icon: CreditCard,      path: '/admin/subscriptions' },
    { label: 'Champions',     icon: Trophy,          path: '/admin/champions' },
    { label: 'Events',        icon: Calendar,        path: '/admin/events' },
    { label: 'Analytics',     icon: BarChart3,       path: '/admin/analytics' },
  ];

  return (
    <div className="w-64 sm:w-80 h-full bg-surface border-r border-gray-800 flex flex-col p-6 sm:p-8 space-y-8 sm:space-y-12 overflow-y-auto no-scrollbar">
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black font-black text-2xl italic">T</div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Console</h1>
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1 italic">Admin Elite</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Platform</span>
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `
              flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all group
              ${isActive ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{item.label}</span>
            {item.path === '/admin' && (
              <div className="ml-auto w-1.5 h-1.5 bg-current rounded-full" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-8 border-t border-gray-800">
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex items-center space-x-4 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-red-500 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
