import React from 'react';
import { Home, LayoutGrid, CreditCard, Heart, Medal, UserCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all ${active ? 'text-primary scale-110' : 'text-gray-400'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[7px] mt-1 uppercase font-black tracking-wide">{label}</span>
  </button>
);

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface/90 backdrop-blur-lg border-t border-gray-800 z-50 md:hidden flex justify-around items-center h-16 pb-safe">
      <NavItem icon={Home} label="Home" active={location.pathname === '/'} onClick={() => navigate('/')} />
      <NavItem icon={LayoutGrid} label="Browse" active={location.pathname === '/browse'} onClick={() => navigate('/browse')} />
      <NavItem icon={CreditCard} label="Subscribe" active={location.pathname === '/subscription'} onClick={() => navigate('/subscription')} />
      <NavItem icon={Heart} label="Sponsor" active={location.pathname === '/sponsor'} onClick={() => navigate('/sponsor')} />
      <NavItem icon={Medal} label="Champions" active={location.pathname === '/champions'} onClick={() => navigate('/champions')} />
      <NavItem icon={UserCircle} label="Account" active={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
    </nav>
  );
};

export default BottomNav;
