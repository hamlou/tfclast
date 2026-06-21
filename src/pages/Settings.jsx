import React, { useState, useEffect } from 'react';
import { Bell, Eye, Trash2, Check, AlertTriangle, X, Play, Wifi } from 'lucide-react';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';

const SettingRow = ({ icon: Icon, title, description, children, danger = false }) => (
  <div className={`flex items-center justify-between p-4 sm:p-5 bg-surface rounded-xl sm:rounded-2xl border ${danger ? 'border-red-900/40' : 'border-gray-800'}`}>
    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
      <div className={`p-2 rounded-xl flex-shrink-0 ${danger ? 'bg-red-500/10' : 'bg-white/5'}`}>
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${danger ? 'text-red-400' : 'text-primary'}`} />
      </div>
      <div className="min-w-0">
        <p className={`font-bold text-xs sm:text-sm ${danger ? 'text-red-400' : 'text-white'}`}>{title}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0 ml-2 sm:ml-4">{children}</div>
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

  return (
    <div className="p-4 sm:p-8 md:p-16 max-w-3xl mx-auto min-h-screen">
      <SEO title="Settings" description="Manage your TFC account settings." />
      <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-2">Settings</h2>
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
            onClick={() => navigate('/delete-account')}
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
    </div>
  );
};

export default Settings;
