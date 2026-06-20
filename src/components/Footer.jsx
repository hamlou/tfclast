import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-gray-800/50 py-16 px-8 md:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-3xl font-black text-primary italic mb-6">TFC</h2>
          <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
            The world's premier destination for high-stakes competition, exclusive entertainment, and global live events. Redefining the future of content, one stream at a time.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6">Platform</h3>
          <ul className="space-y-4">
            {[
              { label: 'Browse Library', to: '/browse' },
              { label: 'Live Events', to: '/#events' },
              { label: 'Subscription', to: '/subscription' },
              { label: 'Champions', to: '/champions' },
              { label: 'Settings', to: '/settings' },
            ].map((item) => (
              <li key={item.label}><Link to={item.to} className="text-gray-500 text-sm hover:text-primary transition-colors">{item.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6">Legal</h3>
          <ul className="space-y-4">
            <li><Link to="/privacy-policy" className="text-gray-500 text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="text-gray-500 text-sm hover:text-primary transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/delete-account" className="text-gray-500 text-sm hover:text-primary transition-colors">Delete Account</Link></li>
            <li><a href="mailto:contact@tfc.events" className="text-gray-500 text-sm hover:text-primary transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
          © 2026 TFC NETWORK. ALL RIGHTS RESERVED.
        </p>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-600 text-[10px] font-black uppercase tracking-widest">
            <span className="relative block w-6 h-4 overflow-hidden rounded-[2px] shadow-sm">
              <span className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,#b22234_0,#b22234_7.69%,#fff_7.69%,#fff_15.38%)]" />
              <span className="absolute left-0 top-0 w-[46%] h-[54%] bg-[#3c3b6e]" />
            </span>
            <span>United States</span>
          </div>
          <Link to="/privacy-policy" className="text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">Terms</Link>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
