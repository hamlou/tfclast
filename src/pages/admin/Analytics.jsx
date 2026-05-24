import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Users, Video, Crown, Trophy, Layers, RefreshCw, ShieldCheck, Play } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Analytics = () => {
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
      if (!res.ok) throw new Error('Failed to fetch');
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
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">{error || 'No data'}</p>
          <button onClick={fetchStats} className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Retry</button>
        </div>
      </div>
    );
  }

  const overviewStats = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Videos', value: stats.totalVideos, icon: Video, color: 'bg-green-500' },
    { label: 'Active Subscribers', value: stats.activeSubscribers, icon: Crown, color: 'bg-primary' },
    { label: 'Categories', value: stats.totalCategories, icon: Layers, color: 'bg-purple-500' },
  ];

  const champStats = [
    { label: 'Total Applications', value: stats.totalChampions, icon: Trophy, color: 'text-primary' },
    { label: 'Pending Review', value: stats.pendingChampions, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Approved', value: stats.approvedChampions, icon: Trophy, color: 'text-green-400' },
  ];

  const videoBreakdown = [
    { label: 'Free Videos', value: stats.freeVideos, pct: stats.totalVideos > 0 ? Math.round((stats.freeVideos / stats.totalVideos) * 100) : 0, color: 'bg-emerald-500' },
    { label: 'Pro Videos', value: stats.proVideos, pct: stats.totalVideos > 0 ? Math.round((stats.proVideos / stats.totalVideos) * 100) : 0, color: 'bg-amber-500' },
  ];

  const conversionRate = stats.totalUsers > 0 ? ((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Growth <span className="text-primary italic">Intelligence</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Live data from Firestore</p>
        </div>
        <button onClick={fetchStats} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-gray-800 rounded-[2.5rem] p-8 hover:border-primary transition-all group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${s.color} bg-opacity-20`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{s.label}</p>
            <p className="text-4xl font-black text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Distribution */}
        <div className="bg-surface border border-gray-800 rounded-[3rem] p-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h4 className="text-xl font-black uppercase tracking-tight flex items-center">
                <PieChart className="w-5 h-5 mr-3 text-primary" />
                Video Distribution
              </h4>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">{stats.totalVideos} total</p>
            </div>
          </div>

          <div className="space-y-6">
            {videoBreakdown.map((v, i) => (
              <div key={v.label} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-400 flex items-center space-x-2">
                    {v.label === 'Free Videos' ? <Play className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    <span>{v.label}</span>
                  </span>
                  <span className="text-white">{v.value} ({v.pct}%)</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${v.pct}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                    className={`h-full ${v.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-surface border border-gray-800 rounded-[3rem] p-10">
          <h4 className="text-xl font-black uppercase tracking-tight flex items-center mb-10">
            <BarChart3 className="w-5 h-5 mr-3 text-primary" />
            Key Metrics
          </h4>

          <div className="space-y-8">
            <div className="bg-black/30 rounded-2xl p-6 border border-gray-800">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Conversion Rate (Free → Paid)</p>
              <div className="flex items-end space-x-2">
                <p className="text-4xl font-black text-white">{conversionRate}%</p>
                <p className="text-gray-500 text-xs mb-1">of total users</p>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden mt-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(parseFloat(conversionRate), 100)}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {champStats.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <div className="flex items-center space-x-3">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">{s.label}</span>
                </div>
                <span className="text-xl font-black text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
