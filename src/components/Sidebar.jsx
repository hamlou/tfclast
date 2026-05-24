import React from 'react';
import { User, History, List, CreditCard, Settings, LogOut, LayoutDashboard, LayoutGrid, Crown, Medal, FileText, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active = false, onClick, isSubscription = false }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 space-x-4 transition-all duration-200 rounded-xl mx-2 group relative
      ${isSubscription
        ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
        : active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    style={{ width: 'calc(100% - 16px)' }}
  >
    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110
      ${isSubscription ? 'text-yellow-400' : active ? 'text-primary' : ''}`}
    />
    <span className={`hidden lg:block font-bold uppercase text-xs tracking-widest truncate
      ${isSubscription ? 'text-yellow-400' : active ? 'text-primary' : 'group-hover:text-white'}`}>
      {label}
    </span>
    {active && !isSubscription && (
      <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
    )}
  </button>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setIsLogoutModalOpen } = useUser();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Browse', path: '/browse' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: History, label: 'History', path: '/history' },
    { icon: CreditCard, label: 'Subscription', path: '/subscription' },
    { icon: Medal, label: 'Champions', path: '/champions' },
    { icon: List, label: 'My List', path: '/mylist' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 h-full bg-surface/80 backdrop-blur-xl w-20 lg:w-64 border-r border-gray-800/50 z-50 hidden md:flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-4 lg:p-6 cursor-pointer group flex-shrink-0" onClick={() => navigate('/')}>
        <div className="hidden lg:block w-full px-2">
          <img 
            src="/tfc-above-sidebar.png"
            alt="TFC" 
            className="w-full h-auto object-contain transition-transform group-hover:scale-105 drop-shadow-lg" 
          />
        </div>
        <div className="lg:hidden w-12 h-12 mx-auto">
          <img 
            src="/tfc-above-sidebar.png"
            alt="TFC" 
            className="w-full h-full object-contain transition-transform group-hover:scale-110" 
          />
        </div>
      </div>

      {/* User status card */}
      <div className="px-3 lg:px-4 py-2 hidden lg:block flex-shrink-0">
        <div className={`relative p-4 rounded-2xl border transition-all overflow-hidden ${
          user.plan?.includes('Premium') 
            ? 'bg-gradient-to-br from-purple-600/20 to-primary/20 border-purple-500/40 shadow-lg shadow-purple-500/20'
            : user.plan?.includes('Pro') || user.plan?.includes('Elite')
            ? 'bg-gradient-to-br from-primary/20 to-orange-500/20 border-primary/40 shadow-lg shadow-primary/20'
            : 'bg-white/5 border-white/10'
        }`}>
          {/* Animated glow effect for premium users */}
          {user.type === 'Premium' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
          )}
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-black uppercase tracking-tight truncate ${
                user.plan?.includes('Premium') ? 'text-purple-400' : 
                user.plan?.includes('Pro') || user.plan?.includes('Elite') ? 'text-primary' : 
                'text-gray-400'
              }`}>
                {user.plan || 'Basic'}
              </p>
              {user.type === 'Premium' && <Crown className="w-4 h-4 text-primary fill-primary flex-shrink-0 ml-2" />}
            </div>
            <p className="text-[10px] text-gray-400 truncate" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar space-y-1 px-0">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={location.pathname === item.path}
            isSubscription={item.label === 'Subscription'}
            onClick={() => navigate(item.path)}
          />
        ))}

        {/* Become a Champion CTA */}
        <div className="px-4 py-2 hidden lg:block">
          <button
            onClick={() => navigate('/champions')}
            className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <Medal className="w-4 h-4" />
            <span>Become a Champion</span>
          </button>
        </div>

        {user.role === 'admin' && (
          <SidebarItem
            icon={LayoutDashboard}
            label="TFC Console"
            active={location.pathname === '/admin'}
            onClick={() => navigate('/admin')}
          />
        )}
      </nav>

      <div className="p-4 border-t border-gray-800/50 flex-shrink-0 space-y-1">
        {/* Legal links required for Google Play Store */}
        <SidebarItem icon={FileText} label="Terms & Privacy" onClick={() => navigate('/terms')} active={location.pathname === '/terms' || location.pathname === '/privacy-policy'} />
        <SidebarItem icon={Trash2} label="Delete Account" onClick={() => navigate('/delete-account')} />
        <SidebarItem icon={LogOut} label="Log Out" onClick={() => setIsLogoutModalOpen(true)} />
      </div>
    </aside>
  );
};

export default Sidebar;
