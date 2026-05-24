import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Returns a Firebase ID token, waiting for auth to be ready first.
 * Fixes the race condition where auth.currentUser is null on component mount
 * because Firebase hasn't restored the session yet (~1-2s after page load).
 */
export const getAuthToken = async () => {
  const user = await new Promise((resolve) => {
    // If already ready, return immediately
    if (auth.currentUser) return resolve(auth.currentUser);
    // Otherwise wait for Firebase to restore session
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      unsub();
      resolve(firebaseUser);
    });
  });
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
};
