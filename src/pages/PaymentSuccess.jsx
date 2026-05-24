import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [plan, setPlan] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setStatus('error');
          return;
        }

        const token = await currentUser.getIdToken();

        const response = await fetch(`${BACKEND}/api/payments/verify-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setPlan(data.plan);
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Countdown redirect after success
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a1a] border border-primary/30 p-12 rounded-[3rem] max-w-lg w-full text-center shadow-2xl shadow-primary/10"
      >

        {/* Verifying */}
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Verifying Payment...
            </h1>
            <p className="text-gray-400">Please wait while we activate your subscription.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <Crown className="w-12 h-12 text-primary" />
            </motion.div>

            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-4" />

            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
              Welcome to the Elite
            </h1>

            <p className="text-gray-400 mb-6 leading-relaxed">
              Your subscription is now active. You have full access to all TFC premium content.
            </p>

            <div className="bg-white/5 p-4 rounded-2xl mb-8 border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Active Plan</p>
              <p className="text-lg font-black text-primary">{plan}</p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-gray-500 mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting in {countdown}s...</span>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary hover:bg-red-600 text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] transition-all hover:scale-105"
            >
              Start Watching Now
            </button>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-red-400">
              Verification Failed
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              We could not verify your payment. If you were charged, please contact support. Your subscription may still activate shortly.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-primary hover:bg-red-600 text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] transition-all"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className="w-full text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors"
              >
                View Subscription Plans
              </button>
            </div>
          </>
        )}

      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
