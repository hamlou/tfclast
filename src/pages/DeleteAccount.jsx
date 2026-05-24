import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { auth, db } from '../firebase';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

const DeleteAccount = () => {
  const { logout } = useUser();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async () => {
    const user = auth.currentUser;
    if (!user) { setError('You must be logged in.'); return; }
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Re-authenticate if password provider
      if (user.providerData[0]?.providerId === 'password') {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      
      const token = await user.getIdToken(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/account/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');
      
      setCodeSent(true);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before deleting.');
      } else {
        setError(err.message || 'Failed to process request. Contact support.');
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) { setError('You must be logged in.'); return; }
    
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken(true);
      
      // Step 2: Verify code and delete
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/account/delete-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Server deletion failed');
      }
      
      localStorage.clear();
      setSuccess(true);
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to delete account. Contact support.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black p-8 md:p-16 flex items-center justify-center">
      <SEO title="Delete Account" description="Permanently delete your TFC account and all associated data." />
      <div className="max-w-lg w-full">
        <Link to="/settings" className="text-primary text-xs font-black uppercase tracking-widest hover:underline">← Back to Settings</Link>

        <div className="mt-8 bg-surface border border-gray-800 rounded-3xl p-8 md:p-10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-red-500/10 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Delete Account</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Permanent Action</p>
            </div>
          </div>

          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-white font-black text-lg mb-2">Account Deleted</h3>
              <p className="text-gray-500 text-sm">Redirecting to login...</p>
            </motion.div>
          ) : !showConfirm ? (
            <>
              <div className="bg-red-500/5 border border-red-900/40 rounded-2xl p-6 mb-6 space-y-3">
                <p className="text-gray-300 text-sm leading-relaxed">When you delete your account, the following will be <strong className="text-red-400">permanently removed</strong>:</p>
                <ul className="text-gray-400 text-sm space-y-2 ml-4">
                  <li className="flex items-start space-x-2"><span className="text-red-400 mt-0.5">•</span><span>Your user profile and login credentials</span></li>
                  <li className="flex items-start space-x-2"><span className="text-red-400 mt-0.5">•</span><span>All account data stored in our database</span></li>
                  <li className="flex items-start space-x-2"><span className="text-red-400 mt-0.5">•</span><span>Watch history and saved lists</span></li>
                  <li className="flex items-start space-x-2"><span className="text-red-400 mt-0.5">•</span><span>Champion application data (if any)</span></li>
                </ul>
                <p className="text-gray-500 text-xs mt-4">Active subscriptions should be cancelled before deleting. Contact <a href="mailto:contact@tfc-event.com" className="text-primary hover:underline">contact@tfc-event.com</a> for help.</p>
              </div>
              <button onClick={() => setShowConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>I Want to Delete My Account</span>
              </button>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                <p className="text-red-400 text-sm font-bold">⚠️ This action is irreversible. All your data will be permanently deleted.</p>
              </div>

              {!codeSent ? (
                <>
                  {auth.currentUser?.providerData[0]?.providerId === 'password' && (
                    <div className="mb-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Enter your password to confirm</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your current password"
                        className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-sm" />
                    </div>
                  )}
                  {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
                  
                  <div className="flex space-x-3">
                    <button onClick={() => { setShowConfirm(false); setPassword(''); setError(''); }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all text-xs sm:text-sm">
                      Cancel
                    </button>
                    <button onClick={handleSendCode}
                      disabled={loading || (auth.currentUser?.providerData[0]?.providerId === 'password' && !password)}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all text-xs sm:text-sm">
                      {loading ? 'Sending...' : 'Send Code'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Enter 6-Digit Verification Code</label>
                    <p className="text-gray-400 text-xs mb-3">We've sent a code to your email address. Please enter it below.</p>
                    <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6}
                      className="w-full bg-black border border-gray-800 focus:border-red-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors text-lg tracking-widest text-center font-black" />
                  </div>
                  {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
                  
                  <div className="flex space-x-3">
                    <button onClick={() => { setCodeSent(false); setError(''); }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all text-xs sm:text-sm">
                      Back
                    </button>
                    <button onClick={handleDelete}
                      disabled={loading || verificationCode.length !== 6}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest transition-all text-xs sm:text-sm flex items-center justify-center space-x-2">
                      <Trash2 className="w-4 h-4" />
                      <span>{loading ? 'Deleting...' : 'Delete Forever'}</span>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
