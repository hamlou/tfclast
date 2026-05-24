import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, Loader2, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const UpgradeModal = ({ isOpen, onClose }) => {
  const { upgradeSubscription } = useUser();
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  // Check crypto subscription when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    const checkSub = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSubStatus({ active: false, reason: 'no_subscription' });
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND}/api/crypto/subscription-status/${currentUser.uid}`);
        const data = await res.json();
        setSubStatus(data);
      } catch {
        setSubStatus({ active: false, reason: 'no_subscription' });
      }
      setChecking(false);
    };
    checkSub();
  }, [isOpen]);

  if (!isOpen) return null;

  // If user has active crypto sub, don't show upgrade modal — close it
  if (!checking && subStatus?.active) {
    onClose();
    return null;
  }

  const isExpired = subStatus?.reason === 'expired';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-surface border border-primary/30 p-8 md:p-12 rounded-[3rem] max-w-lg w-full text-center shadow-2xl shadow-primary/10 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {checking ? (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Checking subscription...</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                {isExpired ? (
                  <Lock className="w-12 h-12 text-red-500" />
                ) : (
                  <Crown className="w-12 h-12 text-primary animate-pulse" />
                )}
              </div>

              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter leading-none">
                {isExpired ? (
                  <>Subscription <span className="text-red-500 italic">Expired</span></>
                ) : (
                  <>Unlock TFC <span className="text-primary italic">Elite</span></>
                )}
              </h3>

              <p className="text-gray-400 mb-10 leading-relaxed text-sm">
                {isExpired
                  ? 'Your subscription has expired. Renew to keep access to all premium content, 4K HDR streaming, and exclusive events.'
                  : 'This premium live event is reserved for Pro members. Join the elite to experience 4K HDR streaming, zero ads, and exclusive rewards.'}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => { navigate('/subscription'); onClose(); }}
                  className="w-full bg-primary hover:bg-red-600 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] shadow-xl shadow-primary/20"
                >
                  {isExpired ? 'Renew Subscription' : 'See Pricing Plans'}
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800/50 flex justify-center space-x-8 opacity-40">
                <div className="text-[8px] font-black uppercase tracking-widest">4K HDR</div>
                <div className="text-[8px] font-black uppercase tracking-widest">No Ads</div>
                <div className="text-[8px] font-black uppercase tracking-widest">VIP Events</div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
