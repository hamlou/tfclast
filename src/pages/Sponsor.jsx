import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { Capacitor } from '@capacitor/core';
import SEO from '../components/SEO';

const Sponsor = () => {
  const [amount, setAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const presetAmounts = [5, 10, 20, 50, 100];

  const handleAmountSelect = (value) => {
    setAmount(value);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setAmount(parseFloat(value));
    }
    setError('');
  };

  const handleDonate = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Please log in to sponsor TFC.');
      return;
    }

    if (!amount || amount < 0.5) {
      setError('Minimum donation is $0.50');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = await currentUser.getIdToken();

      const response = await fetch(`${BACKEND}/api/payments/create-donation-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create payment session.');
        setLoading(false);
        return;
      }

      if (Capacitor.isNativePlatform()) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
        setLoading(false);
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Donation error:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Sponsor" description="Support Total Full Contact Championship" />
      <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Support the <span className="text-primary">Action</span>
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Your support helps us grow the Total Full Contact Championship,
              bring better fights, and improve the platform. Every contribution counts!
            </p>
          </div>

          <div className="bg-surface/50 border border-gray-800 rounded-3xl p-6 md:p-8">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Select Amount (USD)
            </h3>

            <div className="grid grid-cols-5 gap-2 mb-6">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAmountSelect(preset)}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    amount === preset && !customAmount
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                type="number"
                placeholder="Custom Amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                min="0.5"
                step="0.01"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleDonate}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
              {loading ? 'Processing...' : 'Donate Now'}
            </button>

            <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs uppercase tracking-widest mt-6">
              <Shield className="w-4 h-4" />
              <span>Secure Payment by Stripe</span>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Sponsor;
