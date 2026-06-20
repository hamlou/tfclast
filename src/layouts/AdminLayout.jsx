import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useUser } from '../context/UserContext';
import { isAdminEmail } from '../config/admin';
import { Menu, X } from 'lucide-react';

const AdminLayout = () => {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Double-lock: check both role AND exact email — localStorage tampering won't work
  const isAdmin = user?.role === 'admin' && isAdminEmail(user?.email);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar - hidden on mobile, toggle-able */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] no-scrollbar">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-surface sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-white hover:text-primary transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black uppercase tracking-tighter">TFC Console</h1>
          <div className="w-10" />
        </div>
        <div className="p-4 sm:p-6 lg:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
