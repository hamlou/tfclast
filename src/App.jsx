import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { initGoogleAuth, checkGoogleRedirectResult } from './firebase';

import { UserProvider, useUser } from './context/UserContext';
import { HelmetProvider } from 'react-helmet-async';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import History from './pages/History';
import MyList from './pages/MyList';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Browse from './pages/Browse';
import Subscription from './pages/Subscription';
import Search from './pages/Search';
import Champions from './pages/Champions';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PaymentSuccess from './pages/PaymentSuccess';

import AdminLayout from './layouts/AdminLayout';

// ── Scroll to top on every route change ──────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import AdminDashboard from './pages/admin/AdminDashboard';
import VideosManager from './pages/admin/VideosManager';
import CategoriesManager from './pages/admin/CategoriesManager';
import UsersManager from './pages/admin/UsersManager';
import SubscriptionsManager from './pages/admin/SubscriptionsManager';

import Analytics from './pages/admin/Analytics';
import ChampionsManager from './pages/admin/ChampionsManager';
import EventsManager from './pages/admin/EventsManager';

import LogoutModal from './components/LogoutModal';
import ErrorBoundary from './components/ErrorBoundary';
import MmaLanding from './pages/MmaLanding';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetSent from './pages/ResetSent';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import DeleteAccount from './pages/DeleteAccount';

const AppRoutes = () => {
  try {
    const { user, isLogoutModalOpen, setIsLogoutModalOpen, logout, login } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
      if (Capacitor.isNativePlatform()) {
        const timer = setTimeout(() => {
          import('@capacitor/splash-screen').then(({ SplashScreen }) => {
            SplashScreen.hide({ fadeOutDuration: 300 });
          });
        }, 2000);
        return () => clearTimeout(timer);
      }
    }, []);

    // Check for Google redirect result on every page load (not just Login)
    useEffect(() => {
      if (Capacitor.isNativePlatform() || user) return;
      checkGoogleRedirectResult().then(result => {
        if (result && result.success) {
          const u = result.user;
          login(u.email, 'google-oauth', result.username);
        }
      });
    }, []);

    const handleLogoutConfirm = () => {
      setIsLogoutModalOpen(false);
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 100);
    };

    return (
      <>
        <ScrollToTop />
        {user ? (
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="browse" element={<Browse />} />
              <Route path="profile" element={<Profile />} />
              <Route path="history" element={<History />} />
              <Route path="mylist" element={<MyList />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="search" element={<Search />} />
              <Route path="champions" element={<Champions />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payment/success" element={<PaymentSuccess />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="delete-account" element={<DeleteAccount />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/verify-email" element={<Navigate to="/" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/" replace />} />
            <Route path="/reset-sent" element={<Navigate to="/" replace />} />
            <Route path="/reset-password" element={<Navigate to="/" replace />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="videos" element={<VideosManager />} />
              <Route path="categories" element={<CategoriesManager />} />
              <Route path="users" element={<UsersManager />} />
              <Route path="subscriptions" element={<SubscriptionsManager />} />
              <Route path="champions" element={<ChampionsManager />} />
              <Route path="events" element={<EventsManager />} />

              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-sent" element={<ResetSent />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mma" element={<MmaLanding />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogoutConfirm}
        />
      </>
    );
  } catch (error) {
    // Never expose internal error details to users
    if (import.meta.env.DEV) console.error('AppRoutes error:', error);
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#0a0a0a',
        color: '#fff', fontFamily: 'Arial', padding: 40, textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Something Went Wrong</h1>
        <p style={{ color: '#888', maxWidth: 400, marginBottom: 24 }}>
          An unexpected error occurred. Please try reloading the page.
        </p>
        <button onClick={() => window.location.reload()} style={{
          background: '#e01818', color: '#fff', border: 'none', borderRadius: 10,
          padding: '14px 36px', fontSize: 14, fontWeight: 800, cursor: 'pointer'
        }}>Reload Page</button>
      </div>
    );
  }
};

function App() {
  useEffect(() => {
    // Pre-initialize Google Auth on native so it's instant when user taps the button
    initGoogleAuth().catch(() => {});


  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <UserProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </UserProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
