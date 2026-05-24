import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Calendar, Shield, CreditCard, Search, Trash2, ShieldCheck, ShieldOff, RefreshCw } from 'lucide-react';
import { auth } from '../../firebase';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      // S2: Sync Firebase Auth → Firestore to remove orphaned users deleted from Firebase Console
      await fetch(`${BACKEND}/api/admin/sync-auth-users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {}); // silent — don't block user load if sync fails
      const res = await fetch(`${BACKEND}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load users', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = async (uid, email) => {
    if (uid === auth.currentUser?.uid) {
      showToast('Cannot delete your own account', 'error');
      return;
    }
    if (!window.confirm(`Delete user "${email}"?\n\nThis will permanently remove them from Firebase Auth AND Firestore. This cannot be undone.`)) return;
    setActionLoading(uid);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User deleted successfully');
        setUsers(prev => prev.filter(u => u.uid !== uid));
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(null);
  };

  const handleRoleChange = async (uid, newRole, email) => {
    if (uid === auth.currentUser?.uid && newRole === 'user') {
      showToast('Cannot revoke your own admin access', 'error');
      return;
    }
    const action = newRole === 'admin' ? 'promote' : 'revoke admin from';
    if (!window.confirm(`Are you sure you want to ${action} "${email}"?`)) return;
    setActionLoading(uid);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`User ${newRole === 'admin' ? 'promoted to admin' : 'set to regular user'}`);
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return '—'; }
  };

  return (
    <div className="space-y-8">
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
          <h2 className="text-4xl font-black uppercase tracking-tighter">User <span className="text-primary italic">Directory</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">{users.length} users from Firebase</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-surface border border-gray-800 p-6 rounded-3xl">
        <div className="bg-black/40 flex items-center px-6 py-3 rounded-2xl border border-gray-800 focus-within:border-primary transition-all">
          <Search className="w-5 h-5 text-gray-500 mr-4" />
          <input
            type="text"
            placeholder="Filter by username or email..."
            className="bg-transparent border-none outline-none text-white font-bold w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-gray-800 rounded-[2.5rem]">
          <User className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 font-black uppercase text-sm tracking-widest">
            {users.length === 0 ? 'No users found' : 'No users match your search'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.map((u, i) => {
            const isCurrentUser = u.uid === auth.currentUser?.uid;
            const isAdmin = u.role === 'admin';
            return (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface border border-gray-800 rounded-[2.5rem] p-8 hover:border-primary transition-all group relative"
              >
                {isCurrentUser && (
                  <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/30">
                    You
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-background rounded-2xl border border-gray-800 p-1 group-hover:border-primary/50 transition-colors flex-shrink-0">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-full h-full rounded-xl" alt="" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-black text-white group-hover:text-primary transition-colors truncate">{u.username || u.email?.split('@')[0]}</h4>
                      <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800/50">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Role</p>
                    <div className="flex items-center space-x-2">
                      <Shield className={`w-3 h-3 ${isAdmin ? 'text-red-500' : 'text-blue-500'}`} />
                      <span className={`text-xs font-black uppercase ${isAdmin ? 'text-red-400' : 'text-white'}`}>{u.role || 'user'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Subscription</p>
                    <div className="flex items-center space-x-2">
                      <CreditCard className={`w-3 h-3 ${u.subscriptionStatus === 'active' ? 'text-primary' : 'text-gray-600'}`} />
                      <span className={`text-xs font-black uppercase ${u.subscriptionStatus === 'active' ? 'text-primary' : 'text-white'}`}>
                        {u.subscriptionPlan || (u.subscriptionStatus === 'active' ? 'Active' : 'None')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Joined</p>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-black uppercase text-white">{formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Provider</p>
                    <span className="text-xs font-black uppercase text-white">{u.provider || 'email'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  {isAdmin ? (
                    <button
                      onClick={() => handleRoleChange(u.uid, 'user', u.email)}
                      disabled={actionLoading === u.uid || isCurrentUser}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white/5 border border-gray-800 hover:border-orange-500/50 hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {actionLoading === u.uid ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                      <span>Revoke Admin</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(u.uid, 'admin', u.email)}
                      disabled={actionLoading === u.uid}
                      className="flex-1 flex items-center justify-center space-x-2 bg-white/5 border border-gray-800 hover:border-green-500/50 hover:bg-green-500/10 text-gray-400 hover:text-green-400 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-30"
                    >
                      {actionLoading === u.uid ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                      <span>Make Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(u.uid, u.email)}
                    disabled={actionLoading === u.uid || isCurrentUser}
                    className="px-6 flex items-center justify-center space-x-2 bg-white/5 border border-gray-800 hover:bg-red-500/10 hover:border-red-500/50 text-gray-500 hover:text-red-500 py-3 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {actionLoading === u.uid ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UsersManager;
