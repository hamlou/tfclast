import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ShieldCheck, Video, X, RefreshCw, CheckCircle2, Play } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const EMPTY_FORM = {
  title: '',
  videoUrl: '',
  thumbnail: '',
  category: '',
  duration: '',
  description: '',
  type: 'free',
};

// Helper: Extract YouTube video ID from URL
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Helper: Fetch YouTube video metadata using oEmbed (no API key required)
const fetchYouTubeMetadata = async (videoUrl) => {
  try {
    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) return null;

    // Fetch title from YouTube oEmbed
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      title: data.title || '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
};

const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [urlError, setUrlError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/videos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setVideos(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load videos', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCategories(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [fetchVideos, fetchCategories]);

  const filteredVideos = videos.filter(v =>
    v.title?.toLowerCase().includes(search.toLowerCase()) ||
    v.category?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingVideo(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      videoUrl: video.videoUrl || '',
      thumbnail: video.thumbnail || '',
      category: video.category || '',
      duration: video.duration || '',
      description: video.description || '',
      type: video.type || (video.isPremium ? 'pro' : 'free'),
    });
    setIsModalOpen(true);
  };

  // Auto-fetch YouTube metadata when URL changes
  const handleVideoUrlChange = async (url) => {
    setFormData(prev => ({ ...prev, videoUrl: url }));
    setUrlError('');
    
    const videoId = extractYouTubeId(url);
    if (!videoId && url.length > 0) {
      setUrlError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }
    
    if (!videoId) return;
    
    // Auto-generate thumbnail URL
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    setFormData(prev => ({ ...prev, thumbnail: thumbnailUrl }));
    
    // Fetch title from oEmbed
    setFetchingMetadata(true);
    const metadata = await fetchYouTubeMetadata(url);
    setFetchingMetadata(false);
    
    if (metadata && !formData.title) {
      setFormData(prev => ({ ...prev, title: metadata.title }));
    } else if (!metadata) {
      setUrlError('Could not fetch video details. Please enter the title manually.');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      showToast('Title and Video URL are required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const isEdit = !!editingVideo;
      const url = isEdit
        ? `${BACKEND}/api/admin/videos/${editingVideo.id}`
        : `${BACKEND}/api/admin/videos`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Video updated successfully' : 'Video added successfully');
        setIsModalOpen(false);
        fetchVideos();
      } else {
        showToast(data.error || 'Save failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Delete "${video.title}" permanently?\n\nThis removes the entire video from the library and cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/videos/${video.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Video deleted successfully');
        setVideos(prev => prev.filter(v => v.id !== video.id));
      } else {
        const data = await res.json();
        showToast(data.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
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
          <h2 className="text-4xl font-black uppercase tracking-tighter">Content <span className="text-primary italic">Library</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">{videos.length} videos in Firestore</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchVideos} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center space-x-3 bg-primary text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Video</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-surface border border-gray-800 p-6 rounded-3xl flex items-center space-x-4">
        <div className="bg-black/40 flex-1 flex items-center px-6 py-3 rounded-2xl border border-gray-800 focus-within:border-primary transition-all">
          <Search className="w-5 h-5 text-gray-500 mr-4" />
          <input
            type="text"
            placeholder="Search by title or category..."
            className="bg-transparent border-none outline-none text-white font-bold w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Video Table */}
      <div className="bg-surface border border-gray-800 rounded-[3rem] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-24">
            <Video className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600 font-black uppercase text-sm tracking-widest">
              {videos.length === 0 ? 'No videos yet. Click "Add New Video" to get started.' : 'No videos match your search.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-gray-800">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Content</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Duration</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-6">
                      <div className="w-24 h-14 bg-gray-900 rounded-lg overflow-hidden relative border border-gray-800 flex-shrink-0">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-gray-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white group-hover:text-primary transition-colors truncate">{video.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">ID: {video.id.slice(0, 8)}...</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => openEditModal(video)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-lg text-gray-300 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Video</span>
                          </button>
                          <button
                            onClick={() => handleDelete(video)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 rounded-lg text-red-400 hover:text-red-300 transition-all disabled:opacity-40 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Video</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {video.isPremium || video.type === 'pro' ? (
                      <div className="flex items-center space-x-2 text-primary">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pro</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Free</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-gray-400">{video.category || '—'}</td>
                  <td className="px-8 py-6 text-xs font-medium text-gray-400">{video.duration || '—'}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(video)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-gray-800 rounded-xl text-gray-300 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(video)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 border border-gray-800 hover:border-red-500/50 rounded-xl text-gray-300 hover:text-red-500 transition-all disabled:opacity-40 text-[10px] font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-gray-800 p-10 rounded-[3rem] max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-3xl font-black uppercase mb-8">
                {editingVideo ? 'Edit' : 'Add New'} <span className="text-primary italic">Video</span>
              </h3>

              <div className="space-y-6 mb-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">YouTube URL *</label>
                    <input
                      type="url"
                      className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                      value={formData.videoUrl}
                      onChange={e => handleVideoUrlChange(e.target.value)}
                      onBlur={e => handleVideoUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    />
                    {fetchingMetadata && (
                      <p className="text-xs text-primary font-bold flex items-center space-x-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Fetching video details...</span>
                      </p>
                    )}
                    {urlError && (
                      <p className="text-xs text-red-400 font-bold">{urlError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Video Title *</label>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Auto-filled from YouTube (you can edit)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Thumbnail URL</label>
                      <input
                        type="url"
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                        value={formData.thumbnail}
                        onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Duration</label>
                      <input
                        type="text"
                        className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="12:34 or 1h 20m"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Description</label>
                    <textarea
                      rows="3"
                      className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white resize-none"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional video description"
                    />
                  </div>

                  {/* Thumbnail Preview */}
                  {formData.thumbnail && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Thumbnail Preview</label>
                      <div className="relative w-full h-40 bg-black/40 border border-gray-800 rounded-2xl overflow-hidden">
                        <img 
                          src={formData.thumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</label>
                    <select
                      className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">— No Category —</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Free/Pro Toggle */}
                <div className="flex items-center space-x-4 bg-black/20 border border-gray-800 rounded-2xl p-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: formData.type === 'pro' ? 'free' : 'pro' })}
                    className={`relative w-14 h-7 rounded-full transition-colors ${formData.type === 'pro' ? 'bg-primary' : 'bg-gray-700'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.type === 'pro' ? 'left-8' : 'left-1'}`} />
                  </button>
                  <div>
                    <span className="text-sm font-black uppercase tracking-widest text-white">
                      {formData.type === 'pro' ? 'Pro (Paid)' : 'Free'}
                    </span>
                    <p className="text-[10px] text-gray-500">
                      {formData.type === 'pro' ? 'Only accessible to subscribers' : 'Available to all users'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="flex-1 bg-primary text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span>{editingVideo ? 'Save Changes' : 'Publish Video'}</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 border border-gray-800 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideosManager;
