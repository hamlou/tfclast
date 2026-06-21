import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, applyActionCode, confirmPasswordReset, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// ─── Human-friendly error mapper ─────────────────────────────────────────────
const friendlyError = (code) => {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed': 'Email sign-up is currently unavailable.',
    'auth/network-request-failed': 'No internet connection. Please try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/unauthorized-domain': 'Google sign-in is not available on this domain. Please add it to Firebase Console authorized domains.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up was blocked by your browser. Please allow pop-ups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
  };
  return map[code] || `Authentication error: ${code || 'unknown'}`;
};

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export const signUp = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      uid: userCredential.user.uid,
      email,
      username: username || email.split('@')[0],
      createdAt: new Date().toISOString(),
      // emailVerified is a server-protected field — Firestore rules deny client writes to it.
      // It is set to true by the backend (Admin SDK) after the user clicks the verification link.
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    // Send verification via backend → Resend (not Firebase's own email)
    try {
      await fetch(`${BACKEND}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (emailErr) {
      console.warn('Backend email send failed, email may not have been sent:', emailErr);
    }

    return { success: true, user: userCredential.user, requiresVerification: true };
  } catch (error) {
    return { success: false, error: friendlyError(error.code) };
  }
};

// ─── Sign In ──────────────────────────────────────────────────────────────────
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      return { success: false, error: 'email-not-verified' };
    }

    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    let username = email.split('@')[0];

    if (userDoc.exists()) {
      const data = userDoc.data();
      username = data.username || username;
      // emailVerified updates are handled by backend or not needed here
    } else {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid, email, username,
        createdAt: new Date().toISOString()
      });
    }

    return { success: true, user: userCredential.user, username };
  } catch (error) {
    return { success: false, error: friendlyError(error.code) };
  }
};

// ─── Mobile detection ────────────────────────────────────────────────────────
const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// ─── Google Sign In ───────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Native Android/iOS via Capacitor Plugin (dynamic import so web build doesn't fail)
    if (Capacitor.isNativePlatform()) {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return await processGoogleUser(userCredential.user);
    }
    
    // Use redirect on mobile web (popup is blocked/unreliable), popup on desktop web
    if (isMobile()) {
      await signInWithRedirect(auth, provider);
      // Page will redirect — code below won't run until return
      return { success: false, error: 'redirect-in-progress' };
    }
    const userCredential = await signInWithPopup(auth, provider);
    return await processGoogleUser(userCredential.user);
  } catch (error) {
    console.error('Google Sign-In error:', error.code, error.message);
    return { success: false, error: friendlyError(error.code) };
  }
};

// ─── Process Google user (shared by popup + redirect) ─────────────────────────
const processGoogleUser = async (user) => {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    return { success: true, user, username: userDoc.data().username, isNewUser: false };
  } else {
    const userData = {
      uid: user.uid,
      email: user.email,
      username: user.displayName || user.email.split('@')[0],
      createdAt: new Date().toISOString(),
      provider: 'google',
    };
    await setDoc(doc(db, 'users', user.uid), userData);
    return { success: true, user, username: userData.username, isNewUser: true };
  }
};

// ─── Check redirect result (call on Login page mount) ───────────────────────────
export const checkGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return await processGoogleUser(result.user);
    }
    return null; // No redirect result
  } catch (error) {
    console.error('Google redirect result error:', error.code, error.message);
    return { success: false, error: friendlyError(error.code) };
  }
};

// ─── Forgot Password → backend sends via Resend ───────────────────────────────
export const sendPasswordReset = async (email) => {
  try {
    const res = await fetch(`${BACKEND}/api/auth/send-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.status === 429) return { success: false, error: data.error };
    if (!res.ok) return { success: false, error: data.error || 'Failed to send reset email.' };
    return { success: true };
  } catch {
    return { success: false, error: 'No internet connection. Please try again.' };
  }
};

// ─── Resend Verification via backend ─────────────────────────────────────────
export const resendVerificationEmail = async (email) => {
  try {
    const res = await fetch(`${BACKEND}/api/auth/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.status === 429) return { success: false, message: data.error };
    if (!res.ok) return { success: false, message: data.error || 'Failed to resend.' };
    return { success: true, message: `Verification email sent to ${email}` };
  } catch {
    return { success: false, message: 'No internet connection. Please try again.' };
  }
};

// ─── Apply action code (verify email from link) ───────────────────────────────
export const applyEmailVerification = async (oobCode) => {
  try {
    await applyActionCode(auth, oobCode);
    // NOTE: Do NOT attempt to write emailVerified to Firestore from the client.
    // Firestore security rules block all client writes to server-protected fields.
    // The backend Admin SDK handles setting emailVerified=true when it generates
    // the verification link; on signIn() the flag is also synced from Firebase Auth.
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Verification link is invalid or has expired.' };
  }
};

// ─── Confirm Password Reset ───────────────────────────────────────────────────
export { confirmPasswordReset } from 'firebase/auth';

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logOut = async () => {
  try { await signOut(auth); return { success: true }; }
  catch (error) { return { success: false, error: error.message }; }
};

// ─── Update email verified in Firestore ──────────────────────────────────────
// This field is server-protected; the client cannot write it directly.
// Kept as a no-op stub for backward compatibility with any callers.
export const updateEmailVerifiedInFirestore = async (uid) => {
  console.warn('[auth] updateEmailVerifiedInFirestore: client cannot write emailVerified (server-protected). Skipping.');
  return { success: false, error: 'Client cannot write protected field.' };
};
