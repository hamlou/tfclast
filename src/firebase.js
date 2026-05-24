import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, applyActionCode, confirmPasswordReset } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDyptN2m-wIxze1jRJya1hGzqueKe510r4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tfcq-32a8b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tfcq-32a8b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tfcq-32a8b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1027395831145",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1027395831145:web:969f6de4cf9517755e29f8",
  measurementId: "G-1DWPEPHZDG"
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
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-disabled': 'This account has been disabled. Contact support.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
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
      emailVerified: false,
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
      if (!data.emailVerified) {
        await updateDoc(doc(db, 'users', userCredential.user.uid), { emailVerified: true });
      }
    } else {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid, email, username,
        createdAt: new Date().toISOString(), emailVerified: true,
      });
    }

    return { success: true, user: userCredential.user, username };
  } catch (error) {
    return { success: false, error: friendlyError(error.code) };
  }
};

// ─── Google Sign In ───────────────────────────────────────────────────────────
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (userDoc.exists()) {
      return { success: true, user: userCredential.user, username: userDoc.data().username, isNewUser: false };
    } else {
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        username: userCredential.user.displayName || userCredential.user.email.split('@')[0],
        createdAt: new Date().toISOString(),
        emailVerified: true,
        provider: 'google',
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      return { success: true, user: userCredential.user, username: userData.username, isNewUser: true };
    }
  } catch (error) {
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
    const user = auth.currentUser;
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { emailVerified: true });
    }
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
export const updateEmailVerifiedInFirestore = async (uid) => {
  try {
    await updateDoc(doc(db, 'users', uid), { emailVerified: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
