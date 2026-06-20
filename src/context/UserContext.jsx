import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { isAdminEmail } from '../config/admin';


const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tfc_user');
    if (saved) {
      const userData = JSON.parse(saved);
      const sessionExpiry = userData.sessionExpiry || 0;
      if (Date.now() > sessionExpiry) {
        localStorage.removeItem('tfc_user');
        return null;
      }
      return userData;
    }
    return null;
  });

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [watchHistory, setWatchHistory] = useState(() => {
    const saved = localStorage.getItem('tfc_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [myList, setMyList] = useState(() => {
    const saved = localStorage.getItem('tfc_list');
    return saved ? JSON.parse(saved) : [];
  });

  // ── Listen to Firebase Auth + sync subscription from Firestore ──────────────
  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous Firestore listener when auth state changes
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        // Real-time listener on Firestore user document for subscription status
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            const firestoreData = snapshot.data();
            const isActive = firestoreData.subscriptionStatus === 'active';
            const notExpired = firestoreData.currentPeriodEnd
              ? firestoreData.currentPeriodEnd.toDate() > new Date()
              : false;

            const subscriptionActive = isActive && notExpired;

            setUser(prev => {
              if (!prev) return prev;
              const updated = {
                ...prev,
                role: isAdminEmail(firebaseUser.email) ? 'admin' : 'user',
                type: subscriptionActive ? 'Premium' : 'Free',
                plan: subscriptionActive ? (firestoreData.subscriptionPlan || 'Elite Pro') : 'Basic',
                subscriptionStatus: firestoreData.subscriptionStatus || 'none',
                subscriptionPlan: firestoreData.subscriptionPlan || null,
                currentPeriodEnd: firestoreData.currentPeriodEnd?.toDate()?.toISOString() || null,
                stripeCustomerId: firestoreData.stripeCustomerId || null,
              };
              localStorage.setItem('tfc_user', JSON.stringify(updated));
              return updated;
            });
          }
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('tfc_user', JSON.stringify(user));
    else localStorage.removeItem('tfc_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('tfc_history', JSON.stringify(watchHistory));
  }, [watchHistory]);

  useEffect(() => {
    localStorage.setItem('tfc_list', JSON.stringify(myList));
  }, [myList]);

  const login = (email, password, username, rememberMe = false) => {
    const sessionDuration = rememberMe
      ? 30 * 24 * 60 * 60 * 1000   // 30 days if "Remember me"
      : 24 * 60 * 60 * 1000;        // 24 hours default
    const uid = auth.currentUser?.uid || email; // use real Firebase UID
    const userData = {
      id: uid,
      username: username || email.split('@')[0],
      email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username || email.split('@')[0]}&backgroundType=gradientLinear&backgroundColor=b91c1c,7f1d1d`,
      type: 'Free',
      plan: 'Basic',
      role: isAdminEmail(email) ? 'admin' : 'user',
      joinedDate: new Date().toISOString(),
      sessionExpiry: Date.now() + sessionDuration,
      subscriptionStatus: 'none',
      subscriptionPlan: null,
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setWatchHistory([]);
    setMyList([]);
    localStorage.removeItem('tfc_user');
  };

  const updateProfile = (newData) => {
    setUser(prev => prev ? { ...prev, ...newData } : null);
  };

  // Kept for compatibility — real upgrade now goes through Stripe
  const upgradeSubscription = async (plan) => {
    setUser(prev => prev ? { ...prev, type: 'Premium', plan: plan } : null);
    return true;
  };



  const addToHistory = (item) => {
    setWatchHistory(prev => [
      { ...item, watchedAt: new Date().toISOString(), id: item.id || Math.random().toString() },
      ...prev.filter(i => i.id !== item.id)
    ].slice(0, 50));
  };

  const toggleMyList = (item) => {
    setMyList(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [{ ...item, id: item.id || Math.random().toString() }, ...prev];
    });
  };

  // Helper: check if user has active subscription
  const hasActiveSubscription = () => {
    // user.type is already computed correctly (isActive && notExpired) by the Firestore listener
    if (user?.type === 'Premium') return true;
    // Secondary check: also verify status + date in case type hasn't updated yet
    if (user?.subscriptionStatus !== 'active') return false;
    if (!user?.currentPeriodEnd) return false;
    return new Date(user.currentPeriodEnd) > new Date();
  };

  return (
    <UserContext.Provider value={{
      user,
      login,
      logout,
      isLogoutModalOpen,
      setIsLogoutModalOpen,
      updateProfile,
      watchHistory,
      addToHistory,
      myList,
      toggleMyList,
      upgradeSubscription,
      hasActiveSubscription,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
