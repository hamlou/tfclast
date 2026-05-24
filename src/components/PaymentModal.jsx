import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Loader2, Crown } from 'lucide-react';
import { auth } from '../firebase';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PaymentModal = ({ isOpen, onClose, plan }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !plan) return null;

  const getPlanKey = (planName) => {
    if (planName === 'Elite Pro') return 'monthly';
    if (planName === 'Elite Premium') return 'yearly';
    return null;
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const planKey = getPlanKey(plan.name);
      if (!planKey) {
        setError('Invalid plan selected.');
        setLoading(false);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to subscribe.');
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();

      const response = await fetch(`${BACKEND}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.error('Checkout error:', err);
      setError('Connection error. Make sure the server is running.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#1a1a1a] border border-white/10 p-10 rounded-[3rem] max-w-md w-full relative shadow-2xl shadow-primary/10"
        >
          <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
            <X />
          </button>

          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Secure Checkout</h3>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Powered by Stripe</p>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Plan Selected</p>
              <p className="text-lg font-black text-white">{plan?.name}</p>
              <p className="text-primary font-black">{plan?.price}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-sm text-gray-400 leading-relaxed">
              You will be redirected to Stripe's secure payment page. Your card details are handled entirely by Stripe.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-primary hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] shadow-xl shadow-primary/20 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to Stripe...</span>
              </>
            ) : (
              <span>Pay & Unlock Now</span>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center space-x-2 text-gray-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted by Stripe</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
