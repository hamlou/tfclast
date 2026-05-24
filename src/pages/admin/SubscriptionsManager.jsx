import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Crown, Users, Calendar, Search, RefreshCw } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const SubscriptionsManager = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAllUsers(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const subscribers = allUsers.filter(u => u.subscriptionStatus && u.subscriptionStatus !== 'none');
  const activeCount = subscribers.filter(u => u.subscriptionStatus === 'active').length;
  const canceledCount = subscribers.filter(u => u.subscriptionStatus === 'canceled').length;
  const pastDueCount = subscribers.filter(u => u.subscriptionStatus === 'past_due').length;

  const filteredUsers = subscribers.filter(u => {
    const matchesSearch = u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    return matchesSearch && u.subscriptionStatus === filter;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'canceled': return 'text-red-400';
      case 'past_due': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[999] px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl
              ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-500 text-black'}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Revenue <span className="text-primary italic">Vertical</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Live subscription data from Firestore</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active', value: activeCount, color: 'text-green-500', icon: Crown },
          { label: 'Canceled', value: canceledCount, color: 'text-red-400', icon: CreditCard },
          { label: 'Past Due', value: pastDueCount, color: 'text-yellow-400', icon: Users },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface border border-gray-800 p-8 rounded-[2.5rem] flex items-center space-x-6"
          >
            <div className={`p-4 bg-white/5 rounded-2xl ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-white">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {['active', 'canceled', 'past_due', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
              ${filter === f
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
              }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl shadow-black/40">
        <div className="p-8 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tight">Subscribers ({filteredUsers.length})</h3>
          <div className="bg-black/40 flex items-center px-6 py-3 rounded-2xl border border-gray-800 min-w-[300px]">
            <Search className="w-4 h-4 text-gray-500 mr-4" />
            <input
              type="text"
              placeholder="Search by subscriber..."
              className="bg-transparent border-none outline-none text-white font-bold text-xs w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 font-black uppercase text-sm tracking-widest">
              {subscribers.length === 0 ? 'No subscribers yet' : 'No subscribers match your filter'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-gray-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Subscriber</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Expires</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-background rounded-xl p-1 flex-shrink-0">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-full h-full" alt="" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{u.username || u.email?.split('@')[0]}</p>
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {u.subscriptionPlan || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(u.currentPeriodEnd)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor(u.subscriptionStatus)}`}>
                      {u.subscriptionStatus?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsManager;
