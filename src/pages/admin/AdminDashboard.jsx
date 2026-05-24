import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Play, Crown, Trophy, Layers, Video, ShieldCheck, RefreshCw, Clock, Wallet, CreditCard, Gift } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">{error}</p>
          <button onClick={fetchStats} className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Retry</button>
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Videos', value: stats.totalVideos, icon: Video, color: 'text-green-500' },
    { label: 'Active Subscribers', value: stats.activeSubscribers, icon: Crown, color: 'text-primary' },
    { label: 'Categories', value: stats.totalCategories, icon: Layers, color: 'text-purple-500' },
  ];

  const detailStats = [
    { label: 'Free Videos', value: stats.freeVideos, icon: Play, color: 'text-emerald-400' },
    { label: 'Pro Videos', value: stats.proVideos, icon: ShieldCheck, color: 'text-amber-400' },
    { label: 'Pending Champions', value: stats.pendingChampions, icon: Clock, color: 'text-yellow-400' },
    { label: 'Approved Champions', value: stats.approvedChampions, icon: Trophy, color: 'text-green-400' },
  ];

  // Subscriber breakdown percentages
  const totalUsers = stats.totalUsers || 1;
  const cryptoPercent = ((stats.cryptoSubscribers || 0) / totalUsers * 100).toFixed(1);
  const stripePercent = ((stats.stripeSubscribers || 0) / totalUsers * 100).toFixed(1);
  const freePercent = ((stats.freeUsers || 0) / totalUsers * 100).toFixed(1);

  // SVG Circle calculations
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  
  const CircleChart = ({ percent, color, icon: Icon, label, value }) => {
    const strokeDashoffset = circumference - (percent / 100) * circumference;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-gray-800 rounded-[2.5rem] p-8 flex flex-col items-center group hover:border-gray-700 transition-all"
      >
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-gray-800"
            />
            <motion.circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className={color}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className={`w-8 h-8 ${color} mb-2`} />
            <span className="text-3xl font-black text-white">{percent}%</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-white">{value} users</p>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Command <span className="text-primary italic">Center</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Live Platform Statistics from Firebase</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-gray-800 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-primary transition-all shadow-xl shadow-black/20"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-3xl font-black text-white">{stat.value}</h4>
              </div>
              <div className={`p-4 bg-white/5 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* Detail Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {detailStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="bg-surface border border-gray-800 p-6 rounded-[2rem] hover:border-gray-700 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-white/5 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stat.label}</p>
                <h4 className="text-2xl font-black text-white">{stat.value}</h4>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subscriber Breakdown - Circular Charts */}
      <div className="bg-surface border border-gray-800 rounded-[3rem] p-10">
        <h4 className="text-xl font-black uppercase tracking-tight mb-8">Subscriber Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CircleChart
            percent={cryptoPercent}
            color="text-amber-500"
            icon={Wallet}
            label="Crypto Subscribers"
            value={stats.cryptoSubscribers || 0}
          />
          <CircleChart
            percent={stripePercent}
            color="text-blue-500"
            icon={CreditCard}
            label="Stripe Subscribers"
            value={stats.stripeSubscribers || 0}
          />
          <CircleChart
            percent={freePercent}
            color="text-gray-400"
            icon={Gift}
            label="Free Users"
            value={stats.freeUsers || 0}
          />
        </div>
      </div>

      {/* Video Breakdown */}
      <div className="bg-surface border border-gray-800 rounded-[3rem] p-10">
        <h4 className="text-xl font-black uppercase tracking-tight mb-8">Video Distribution</h4>
        <div className="flex items-center space-x-8">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="text-emerald-400">Free ({stats.freeVideos})</span>
              <span className="text-amber-400">Pro ({stats.proVideos})</span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: stats.totalVideos > 0 ? `${(stats.freeVideos / stats.totalVideos) * 100}%` : '50%' }}
                transition={{ duration: 1 }}
                className="h-full bg-emerald-500"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: stats.totalVideos > 0 ? `${(stats.proVideos / stats.totalVideos) * 100}%` : '50%' }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-amber-500"
              />
            </div>
          </div>
        </div>
        {stats.totalVideos === 0 && (
          <p className="text-gray-600 text-sm mt-4">No videos yet. Add videos from the Videos Manager.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
