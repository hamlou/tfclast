import React, { useState, useEffect } from 'react';
import { Bell, Eye, Trash2, Check, AlertTriangle, X, Play, Wifi } from 'lucide-react';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

const SettingRow = ({ icon: Icon, title, description, children, danger = false }) => (
  <div className={`flex items-center justify-between p-5 bg-surface rounded-2xl border ${danger ? 'border-red-900/40' : 'border-gray-800'}`}>
    <div className="flex items-center space-x-4">
      <div className={`p-2 rounded-xl flex-shrink-0 ${danger ? 'bg-red-500/10' : 'bg-white/5'}`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-primary'}`} />
      </div>
      <div>
        <p className={`font-bold text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0 ml-4">{children}</div>
  </div>
);

const Toggle = ({ enabled, onChange }) => (
  <button type="button" onClick={() => onChange(!enabled)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${enabled ? 'bg-primary' : 'bg-gray-700'}`}>
    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export const SETTINGS_KEY = 'tfc_settings';
export const defaultSettings = {
  notifications: true,
  emailAlerts: false,
  autoplay: true,
  hdQuality: true,
};

// Helper — read settings anywhere
export const getSettings = () => {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
  } catch { return defaultSettings; }
};

const Settings = () => {
  const { logout } = useUser();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

    // Apply autoplay setting globally
    window.__tfcAutoplay = settings.autoplay;

    // Apply push notification permission
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      // Re-authenticate first (required by Firebase for sensitive operations)
      if (user.providerData[0]?.providerId === 'password') {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      }
      // Get fresh token after reauthentication
      const token = await user.getIdToken(true);
      // Server-side full cleanup: deletes Auth user, Firestore doc, champion entries
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/account/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server deletion failed');
      }
      // Clear local state
      localStorage.clear();
      logout();
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in before deleting your account.');
      } else {
        setDeleteError(err.message || 'Failed to delete account. Please try again or contact support.');
      }
    }
    setDeleteLoading(false);
  };

  return (
    <div className="p-8 md:p-16 max-w-3xl mx-auto min-h-screen">
      <SEO title="Settings" description="Manage your TFC account settings." />
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Settings</h2>
      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-12">Manage your preferences</p>

      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Notifications</p>
        <SettingRow icon={Bell} title="Push Notifications" description="Get notified about new events and fights">
          <Toggle enabled={settings.notifications} onChange={v => update('notifications', v)} />
        </SettingRow>
        <SettingRow icon={Bell} title="Email Alerts" description="Receive event reminders by email">
          <Toggle enabled={settings.emailAlerts} onChange={v => update('emailAlerts', v)} />
        </SettingRow>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1 pt-4">Playback</p>
        <SettingRow icon={Play} title="Autoplay" description="Automatically play the next video">
          <Toggle enabled={settings.autoplay} onChange={v => update('autoplay', v)} />
        </SettingRow>
        <SettingRow icon={Wifi} title="HD Quality" description="Stream in HD when available">
          <Toggle enabled={settings.hdQuality} onChange={v => update('hdQuality', v)} />
        </SettingRow>

        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1 pt-4">Account</p>
        <SettingRow icon={Trash2} title="Delete Account" description="Permanently remove your account and all data" danger>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-red-500 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors whitespace-nowrap border border-red-900/60 hover:border-red-500/60 px-4 py-2 rounded-xl"
          >
            Delete
          </button>
        </SettingRow>
      </div>

      <motion.button type="button" onClick={handleSave} whileTap={{ scale: 0.97 }}
        className={`mt-10 w-full font-black py-5 rounded-2xl uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${saved ? 'bg-green-500 text-white' : 'bg-primary hover:bg-red-600 text-black'}`}>
        {saved ? <><Check className="w-5 h-5" /><span>Saved!</span></> : <span>Save Settings</span>}
      </motion.button>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-red-900/50 rounded-3xl w-full max-w-md p-8 relative">
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">Delete Account</h3>
                  <p className="text-gray-500 text-xs">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-900/40 rounded-xl p-4 mb-6">
                <p className="text-gray-300 text-sm leading-relaxed">
                  All your data, watch history, and subscription will be permanently deleted. You will lose access immediately.
                </p>
              </div>

              {auth.currentUser?.providerData[0]?.providerId === 'password' && (
                <div className="mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                    className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-sm"
                  />
                </div>
              )}

              {deleteError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {deleteError}
                </div>
              )}

              <button onClick={handleDeleteAccount} disabled={deleteLoading || (auth.currentUser?.providerData[0]?.providerId === 'password' && !deletePassword)}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all">
                {deleteLoading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
