import React from 'react';
import { Home, LayoutGrid, Search, Medal, UserCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all ${active ? 'text-primary scale-110' : 'text-gray-400'}`}
  >
    <Icon className="w-6 h-6" />
    <span className="text-[8px] mt-1 uppercase font-black tracking-widest">{label}</span>
  </button>
);

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-lg border-t border-gray-800 z-50 md:hidden flex justify-around items-center h-16 pb-safe">
      <NavItem icon={Home} label="Home" active={location.pathname === '/'} onClick={() => navigate('/')} />
      <NavItem icon={LayoutGrid} label="Browse" active={location.pathname === '/browse'} onClick={() => navigate('/browse')} />
      <NavItem icon={Search} label="Search" active={location.pathname === '/search'} onClick={() => navigate('/search')} />
      <NavItem icon={Medal} label="Champions" active={location.pathname === '/champions'} onClick={() => navigate('/champions')} />
      <NavItem icon={UserCircle} label="Account" active={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
    </nav>
  );
};

export default BottomNav;
