import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Edit2, Trash2, X, CheckCircle2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30' },
  recent: { label: 'Recent', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  past: { label: 'Past', color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30' },
};

// ─── Event Form Modal ────────────────────────────────────────────────────────
const EventModal = ({ event, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    number: event?.number || '',
    date: event?.date || '',
    location: event?.location || '',
    status: event?.status || 'upcoming',
    url: event?.url || '',
    image: event?.image || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-[#0f0f0f] border border-gray-800 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-[#0f0f0f] border-b border-gray-800 p-8 flex items-center justify-between z-10">
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Event Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" placeholder="e.g. TFC Gladiators" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Event Number</label>
              <input type="number" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" placeholder="e.g. 82" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Date *</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Location *</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" placeholder="e.g. Sfax, Tunisia" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors">
                <option value="upcoming">Upcoming</option>
                <option value="recent">Recent</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">URL (Optional)</label>
              <input type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" placeholder="https://tfc-event.com/..." />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Image URL (Optional)</label>
              <input type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="w-full bg-black/30 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors" placeholder="https://..." />
            </div>
          </div>
          <div className="sticky bottom-0 bg-[#0f0f0f] border-t border-gray-800 pt-6 flex space-x-4 mt-8">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 text-black font-black py-4 rounded-2xl uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>Save Event</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Main Events Manager ──────────────────────────────────────────────────────
const EventsManager = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // null = closed, {} = new, {id...} = edit
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/events`);
      const data = await res.json();
      if (res.ok) setEvents(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSave = async (formData) => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const isEdit = selectedEvent?.id;
      const url = isEdit ? `${BACKEND}/api/admin/events/${selectedEvent.id}` : `${BACKEND}/api/admin/events`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Event updated successfully' : 'Event created successfully');
        setSelectedEvent(null);
        fetchEvents();
      } else {
        showToast(data.error || 'Save failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Event deleted successfully');
        setEvents(prev => prev.filter(e => e.id !== id));
      } else {
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
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
          <h2 className="text-4xl font-black uppercase tracking-tighter">Event <span className="text-primary italic">Manager</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Manage TFC Championship Events</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchEvents} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setSelectedEvent({})} className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-black px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-gray-800 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 font-black uppercase text-sm tracking-widest">No events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Event</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Location</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="text-left p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => {
                  const s = STATUS_CONFIG[e.status] || STATUS_CONFIG.upcoming;
                  return (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center space-x-3">
                          {e.image ? (
                            <img src={e.image} alt={e.name} className="w-10 h-10 rounded-xl object-cover border border-gray-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700">
                              <ImageIcon className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-black text-sm text-white">{e.name}</p>
                            {e.number && <p className="text-[10px] text-primary font-black uppercase tracking-widest">TFC #{e.number}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-300">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="p-5 text-sm text-gray-300">{e.location}</td>
                      <td className="p-5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedEvent(e)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Edit Event"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            disabled={actionLoading}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-40"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Event Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventModal
            event={selectedEvent.id ? selectedEvent : null}
            onClose={() => setSelectedEvent(null)}
            onSave={handleSave}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsManager;
