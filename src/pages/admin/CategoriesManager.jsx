import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Edit2, Trash2, Folder, Video, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getAuthToken } from '../../utils/authHelpers';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCategories(Array.isArray(data) ? data : []);
      else showToast(data.error || 'Failed to load', 'error');
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const isEdit = !!editingCategory;
      const url = isEdit
        ? `${BACKEND}/api/admin/categories/${editingCategory.id}`
        : `${BACKEND}/api/admin/categories`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(isEdit ? 'Category updated successfully' : 'Category created successfully');
        setIsModalOpen(false);
        fetchCategories();
      } else {
        showToast(data.error || 'Save failed', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async (cat) => {
    if (cat.videoCount > 0) {
      if (!window.confirm(`This category has ${cat.videoCount} video(s) assigned to it. You must reassign those videos before deleting. Continue anyway?`)) return;
    } else {
      if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    }
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND}/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Category deleted successfully');
        setCategories(prev => prev.filter(c => c.id !== cat.id));
      } else {
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
          <h2 className="text-4xl font-black uppercase tracking-tighter">Taxonomy <span className="text-primary italic">Engine</span></h2>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">{categories.length} categories in Firestore</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={fetchCategories} className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-gray-800 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openAddModal} className="flex items-center space-x-3 bg-primary text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24 bg-surface border border-gray-800 rounded-[2.5rem]">
          <Layers className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-600 font-black uppercase text-sm tracking-widest">No categories yet. Click "New Category" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-surface border border-gray-800 rounded-[2.5rem] p-8 hover:border-primary transition-all group"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openEditModal(cat)} className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={actionLoading}
                    className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{cat.name}</h3>
              <div className="flex items-center space-x-2 text-gray-500 font-black uppercase text-[10px] tracking-widest">
                <Video className="w-3 h-3" />
                <span>{cat.videoCount} {cat.videoCount === 1 ? 'Video' : 'Videos'}</span>
              </div>

              <div className="mt-8 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: cat.videoCount > 0 ? `${Math.min(cat.videoCount * 20, 100)}%` : '0%' }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-gray-800 p-10 rounded-[3rem] max-w-md w-full relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-black uppercase mb-8">
                {editingCategory ? 'Edit' : 'New'} <span className="text-primary italic">Category</span>
              </h3>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category Name</label>
                <input
                  type="text"
                  className="w-full bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 font-bold focus:border-primary transition-all text-white"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  placeholder="e.g. Featured Events"
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSave}
                  disabled={actionLoading}
                  className="flex-1 bg-primary text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span>{editingCategory ? 'Save' : 'Create'}</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 border border-gray-800 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
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

export default CategoriesManager;
