import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, User, ExternalLink, RefreshCw, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  approved: { label: 'Approved', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30'  },
  rejected: { label: 'Rejected', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30'      },
};

// ─── Application Detail Modal ────────────────────────────────────────────────
const DetailModal = ({ champion, onClose, onApprove, onReject, loading }) => {
  if (!champion) return null;
  const s = STATUS_CONFIG[champion.status] || STATUS_CONFIG.pending;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#0f0f0f] border border-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-gray-800 p-8 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            {champion.images?.profile ? (
              <img src={champion.images.profile} alt={champion.fullName} className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-700" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                <User className="w-7 h-7 text-gray-500" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">{champion.fullName}</h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${s.bg} ${s.color}`}>
                {s.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Personal Info */}
          <Section title="Personal Info">
            <Row label="Nickname" value={`"${champion.nickname}"`} />
            <Row label="Country" value={champion.country} />
            <Row label="Height / Weight" value={`${champion.height}m / ${champion.weight}kg`} />
            <Row label="Date of Birth" value={champion.dateOfBirth} />
            <Row label="Email" value={champion.email} />
            <Row label="Phone" value={champion.phone} />
          </Section>

          {/* Fight Record */}
          <Section title="Fight Record">
            <Row label="Association" value={champion.association} />
            <Row label="Organisation" value={champion.organisation} />
            <Row label="Class" value={champion.classSpeciality} />
            <div className="grid grid-cols-5 gap-3 mt-2">
              {[
                { l: 'Wins',  v: champion.record?.wins,      c: 'text-green-400' },
                { l: 'KO',    v: champion.record?.koTko,     c: 'text-orange-400' },
                { l: 'DEC',   v: champion.record?.decisions, c: 'text-blue-400' },
                { l: 'Losses',v: champion.record?.losses,    c: 'text-red-400' },
                { l: 'SUB',   v: champion.record?.submissions,c:'text-purple-400' },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-black/40 rounded-xl p-3 text-center border border-gray-800">
                  <p className={`text-2xl font-black ${c}`}>{v ?? 0}</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">{l}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Links */}
          {(champion.links?.tapology || champion.links?.sherdog || champion.links?.instagram || champion.links?.facebook || champion.links?.youtube) && (
            <Section title="Links">
              {champion.links?.tapology  && <LinkRow label="Tapology"  url={champion.links.tapology} />}
              {champion.links?.sherdog   && <LinkRow label="Sherdog"   url={champion.links.sherdog} />}
              {champion.links?.tfc       && <LinkRow label="TFC"       url={champion.links.tfc} />}
              {champion.links?.instagram && <LinkRow label="Instagram" url={champion.links.instagram} />}
              {champion.links?.facebook  && <LinkRow label="Facebook"  url={champion.links.facebook} />}
              {champion.links?.youtube   && <LinkRow label="YouTube"   url={champion.links.youtube} />}
            </Section>
          )}
        </div>

        {/* Action buttons */}
        {champion.status !== 'approved' && (
          <div className="sticky bottom-0 bg-[#0f0f0f] border-t border-gray-800 p-6 flex space-x-4">
            <button
              onClick={() => onApprove(champion.id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Approve</span>
            </button>
            {champion.status !== 'rejected' && (
              <button
                onClick={() => onReject(champion.id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 border border-red-500/30 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
              >
                <XCircle className="w-5 h-5" />
                <span>Reject</span>
              </button>
            )}
          </div>
        )}
        {champion.status === 'approved' && (
          <div className="sticky bottom-0 bg-[#0f0f0f] border-t border-gray-800 p-6">
            <button
              onClick={() => onReject(champion.id)}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 text-red-400 border border-red-500/30 font-black py-4 rounded-2xl uppercase tracking-widest transition-all"
            >
              <XCircle className="w-5 h-5" />
              <span>Remove from Leaderboard</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">{title}</p>
    <div className="bg-black/30 border border-gray-800 rounded-2xl p-4 space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">{label}</span>
    <span className="text-sm text-white font-bold">{value || '—'}</span>
  </div>
);

const LinkRow = ({ label, url }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">{label}</span>
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center space-x-1">
      <span className="max-w-[200px] truncate">{url}</span>
      <ExternalLink className="w-3 h-3 flex-shrink-0" />
    </a>
  </div>
);

// ─── Main Champions Manager ───────────────────────────────────────────────────
const ChampionsManager = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchChampions = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/champions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setChampions(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchChampions(); }, [fetchChampions]);

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/champions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Champion ${status} successfully!`);
        setChampions(prev => prev.map(c => c.id === id ? { ...c, status } : c));
        if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
  };

  const filtered = filter === 'all' ? champions : champions.filter(c => c.status === filter);

  const counts = {
    all:      champions.length,
    pending:  champions.filter(c => c.status === 'pending').length,
    approved: champions.filter(c => c.status === 'approved').length,
    rejected: champions.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Champion <span className="text-primary italic">Applications</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Review & Approve Fighter Profiles</p>
        </div>
        <button onClick={fetchChampions} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
              ${filter === f
                ? f === 'approved' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : f === 'rejected' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : f === 'pending'  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'bg-primary/20 border-primary/40 text-primary'
                : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
              }`}
          >
            {f} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-gray-800 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 font-black uppercase text-sm tracking-widest">No {filter} applications</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Fighter</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Class</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Record</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Country</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const s = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Fighter */}
                      <td className="p-5">
                        <div className="flex items-center space-x-3">
                          {c.images?.profile ? (
                            <img src={c.images.profile} alt={c.fullName} className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-sm text-white">{c.fullName}</p>
                            <p className="text-[10px] text-gray-500">{c.nickname}</p>
                          </div>
                        </div>
                      </td>
                      {/* Class */}
                      <td className="p-5 text-sm text-gray-300">{c.classSpeciality?.split(' ')[0]}</td>
                      {/* Record */}
                      <td className="p-5">
                        <span className="text-green-400 font-black text-sm">{c.record?.wins}W</span>
                        <span className="text-gray-600 mx-1">-</span>
                        <span className="text-red-400 font-black text-sm">{c.record?.losses}L</span>
                      </td>
                      {/* Country */}
                      <td className="p-5 text-sm text-gray-300">{c.country}</td>
                      {/* Status */}
                      <td className="p-5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="p-5">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelected(c)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {c.status !== 'approved' && (
                            <button
                              onClick={() => updateStatus(c.id, 'approved')}
                              disabled={actionLoading}
                              className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-xl transition-all disabled:opacity-40"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {c.status !== 'rejected' && (
                            <button
                              onClick={() => updateStatus(c.id, 'rejected')}
                              disabled={actionLoading}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-40"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            champion={selected}
            onClose={() => setSelected(null)}
            onApprove={(id) => updateStatus(id, 'approved')}
            onReject={(id) => updateStatus(id, 'rejected')}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChampionsManager;
