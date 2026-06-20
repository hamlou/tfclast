import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useUser } from '../context/UserContext';
import { isAdminEmail } from '../config/admin';

const AdminLayout = () => {
  const { user } = useUser();

  // Double-lock: check both role AND exact email — localStorage tampering won't work
  const isAdmin = user?.role === 'admin' && isAdminEmail(user?.email);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a] p-12 no-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
