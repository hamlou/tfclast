import React, { useState, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { motion } from 'framer-motion';
import { Camera, Crown, LogOut, CreditCard, Loader2, ChevronRight } from 'lucide-react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

// Default MMA-themed avatar (silhouette fighter)
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=400&fit=crop&crop=face';

const Profile = () => {
  const { user, updateProfile, setIsLogoutModalOpen, watchHistory } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (!user) return null;

  const isSubscribed = user?.subscriptionStatus === 'active' || user?.type === 'Premium';

  // Handle profile picture upload from device
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateProfile({ avatar: ev.target.result });
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/payments/portal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Portal error:', err);
    }
    setPortalLoading(false);
  };

  return (
    <div className="p-8 md:p-16 max-w-5xl mx-auto min-h-screen">
      <SEO title="My Profile" description="Manage your TFC account." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── Left Card ─────────────────────────────────────── */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-3xl p-8 border border-gray-800 text-center sticky top-8"
          >
            {/* Profile Picture */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <img
                src={user.avatar || DEFAULT_AVATAR}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-primary/20 bg-gray-900 shadow-2xl"
                onError={e => { e.target.src = DEFAULT_AVATAR; }}
              />
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 bg-primary hover:bg-red-600 text-black p-2 rounded-full border-4 border-surface transition-colors disabled:opacity-60"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Name & Email */}
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">{user.username}</h2>
            <p className="text-gray-500 text-sm mb-2">{user.email}</p>

            {/* Plan badge */}
            <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 ${isSubscribed ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
              {isSubscribed && <Crown className="w-3 h-3 fill-primary" />}
              <span>{isSubscribed ? user.plan || 'Elite Pro' : 'Free Member'}</span>
            </div>

            {/* Stats */}
            <div className="bg-black/30 rounded-2xl p-4 mb-6">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Activity</p>
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <p className="text-xl font-black text-white">{watchHistory?.length || 0}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Watched</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                  <p className="text-xl font-black text-primary">{isSubscribed ? 'PRO' : 'FREE'}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Status</p>
                </div>
              </div>
            </div>

            {/* Manage / Logout */}
            <div className="space-y-2">
              {isSubscribed ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-surface border border-gray-700 hover:border-primary text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  <span>Manage Subscription</span>
                </button>
              ) : null}
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center justify-center space-x-2 text-red-500 hover:text-red-400 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Right Content ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Subscription promotion / status banner */}
          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary to-red-800 rounded-3xl p-8 text-black shadow-xl shadow-primary/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Active Membership</p>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">{user.plan || 'Elite Pro'}</h3>
                  {user.currentPeriodEnd && (
                    <p className="font-bold opacity-80 mt-1 text-sm">
                      Renews {new Date(user.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <Crown className="w-12 h-12 opacity-30 fill-black" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/subscription')}
              className="cursor-pointer bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 border border-primary/30 hover:border-primary/60 transition-all group shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Upgrade to Pro</p>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Unlock All Content</h3>
                  <p className="text-gray-400 text-sm">4K Quality • Ad-Free • Exclusive Events</p>
                  <p className="text-primary font-black mt-3">From $4.99/mo →</p>
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Crown className="w-8 h-8 text-primary" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Account Info */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Account Info</h4>
            <div className="space-y-3">
              {[
                { label: 'Username', value: user.username },
                { label: 'Email', value: user.email },
                { label: 'Member Since', value: user.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A' },
                { label: 'Role', value: user.role === 'admin' ? 'Administrator' : 'Member' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
                  <span className="text-gray-500 text-sm font-bold uppercase tracking-wider text-xs">{label}</span>
                  <span className="text-white font-bold text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TFC Social Links */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Follow TFC</h4>
            <div className="flex justify-around">
              {[
                { label: 'Facebook',  href: 'https://www.facebook.com/tfc.event1',  icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                { label: 'Instagram', href: 'https://www.instagram.com/tfc_events/', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z' },
                { label: 'YouTube',   href: 'https://www.youtube.com/@TFC.events',  icon: 'M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z' },
              ].map(({ label, href, icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                   className="flex flex-col items-center space-y-2 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d={icon} />
                  </svg>
                  <span className="text-[9px] text-gray-600 group-hover:text-gray-400 uppercase font-bold tracking-widest">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface border border-gray-800 rounded-3xl p-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Quick Access</h4>
            <div className="space-y-2">
              {[
                { label: 'My Watch History', path: '/history' },
                { label: 'My Saved List', path: '/mylist' },
                { label: 'Champions', path: '/champions' },
                { label: 'Settings', path: '/settings' },
              ].map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
