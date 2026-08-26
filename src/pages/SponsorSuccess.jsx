import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, CheckCircle, XCircle } from 'lucide-react';
import SEO from '../components/SEO';

const SponsorSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('success');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!searchParams.get('session_id')) {
      setStatus('error');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
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
    <>
      <SEO title="Thank You" description="Thank you for your donation" />
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1a1a] border border-primary/30 p-12 rounded-[3rem] max-w-lg w-full text-center shadow-2xl shadow-primary/10"
        >
          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <Heart className="w-12 h-12 text-primary" fill="currentColor" />
              </motion.div>
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-4" />
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
                Thank You!
              </h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Your generous donation has been successfully processed. We deeply appreciate
                your support for the Total Full Contact Championship!
              </p>
              <p className="text-gray-500 text-sm">
                Redirecting to home in {countdown} seconds...
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all"
              >
                Go Home Now
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
              >
                <XCircle className="w-12 h-12 text-red-500" />
              </motion.div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
                Oops!
              </h1>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Something went wrong with your donation. Please try again.
              </p>
              <button
                onClick={() => navigate('/sponsor')}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all"
              >
                Try Again
              </button>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SponsorSuccess;
