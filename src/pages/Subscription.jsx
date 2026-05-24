import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { mockSubscriptionPlans } from '../services/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Shield, Crown, Loader2, AlertTriangle } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { auth } from '../firebase';
import SEO from '../components/SEO';

const Subscription = () => {
  const { user, upgradeSubscription } = useUser();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Crypto subscription state
  const [cryptoSub, setCryptoSub] = useState(null);
  const [cryptoLoading, setCryptoLoading] = useState(null); // which plan is loading
  const [cryptoError, setCryptoError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subCheckLoading, setSubCheckLoading] = useState(true);

  // Check crypto subscription status on mount
  useEffect(() => {
    const checkCryptoSub = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSubCheckLoading(false);
        return;
      }
      try {
        const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const token = await currentUser.getIdToken();
        const res = await fetch(`${BACKEND}/api/crypto/subscription-status/${currentUser.uid}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        setCryptoSub(data);
      } catch (err) {
        console.error('Failed to check crypto subscription:', err);
      }
      setSubCheckLoading(false);
    };
    checkCryptoSub();
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  // Crypto payment handler
  const handleCryptoPayment = async (planKey) => {
    if (!termsAccepted) {
      setCryptoError('You must accept the payment terms before proceeding.');
      return;
    }

    setCryptoLoading(planKey);
    setCryptoError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setCryptoError('You must be logged in to pay with crypto.');
        setCryptoLoading(null);
        return;
      }

      const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const token = await currentUser.getIdToken();
      const response = await fetch(`${BACKEND}/api/crypto/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCryptoError(data.error || 'Failed to create crypto payment.');
        setCryptoLoading(null);
        return;
      }

      window.location.href = data.payment_url;
    } catch (err) {
      console.error('Crypto payment error:', err);
      setCryptoError('Connection error. Make sure the server is running.');
      setCryptoLoading(null);
    }
  };

  const cryptoPlans = [
    {
      key: 'elite_pro',
      name: 'Elite Pro×5',
      price: '$19.99',
      period: '5 mo',
      duration: '5 months',
      badge: '5 Months',
      features: ['Access to all pro videos', '1080p & 4K Quality', 'Ad-Free', 'Priority Rewards'],
    },
    {
      key: 'elite_premium',
      name: 'Elite Premium',
      price: '$43.99',
      period: 'yr',
      duration: '365 days',
      badge: 'Best Value',
      badgeColor: 'bg-emerald-500',
      features: ['Access to all pro videos', '1080p & 4K Quality', 'Ad-Free', 'Priority Rewards', 'VIP Access', 'Exclusive Badges', 'Save more than 25%'],
    },
  ];

  // Check if user has active crypto sub
  const hasCryptoActive = cryptoSub?.active === true;
  const cryptoExpired = cryptoSub?.reason === 'expired';

  return (
    <div className="p-8 md:p-16 max-w-7xl mx-auto min-h-screen">
      <SEO
        title="Subscription Plans"
        description="Choose the perfect TFC membership plan to unlock 4K HDR streaming and exclusive live events."
      />

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="bg-surface border border-primary/30 p-12 rounded-[3rem] max-w-lg text-center shadow-2xl shadow-primary/10">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Crown className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Welcome to the Elite</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">Your subscription has been successfully activated. You now have unlimited access to all TFC premium content.</p>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full bg-primary text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] hover:scale-105 transition-transform"
              >
                Start Watching
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-16">
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Choose Your Plan</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Unlock the full TFC experience</p>
      </div>

      {/* ── Stripe Plans (existing) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {mockSubscriptionPlans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ y: -10 }}
            className={`relative bg-surface p-8 rounded-[2.5rem] border-2 transition-all ${user?.plan === plan.name ? 'border-primary shadow-2xl shadow-primary/20' : 'border-gray-800'}`}
          >
            {user?.plan === plan.name && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Current Plan
              </div>
            )}
            {/* Monthly/Yearly Badge */}
            {plan.name.includes('Pro') && (
              <div className="absolute -top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Monthly
              </div>
            )}
            {plan.name.includes('Premium') && (
              <div className="absolute -top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Yearly
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">{plan.price.split('/')[0]}</span>
                <span className="text-gray-500 font-bold text-sm uppercase">/{plan.price.split('/')[1] || 'Forever'}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-10">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm font-medium text-gray-400">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={user?.plan === plan.name}
              onClick={() => handleSelectPlan(plan)}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${user?.plan === plan.name ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-red-600 text-black shadow-lg shadow-primary/20 hover:scale-105'}`}
            >
              {user?.plan === plan.name ? 'Active' : 'Upgrade Now'}
            </button>

          </motion.div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── Crypto Payment Section ── */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="mt-24">
        <div className="flex items-center mb-12">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="px-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Or Pay with Crypto</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        {/* Active Subscription Banner */}
        {subCheckLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-500 text-sm font-bold uppercase tracking-widest">Checking subscription...</span>
          </div>
        ) : hasCryptoActive ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-emerald-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Check className="w-3 h-3" />
              <span>Active</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">
              {cryptoSub.plan === 'elite_pro' ? 'Elite Pro×5' : 'Elite Premium'}
            </h3>
            <p className="text-gray-400 text-sm">
              Expires: <span className="text-white font-bold">{new Date(cryptoSub.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </p>
            {cryptoSub.tip_amount > 0 && (
              <p className="text-emerald-400 text-xs mt-2 font-bold">Thank you for your tip of ${cryptoSub.tip_amount.toFixed(2)}!</p>
            )}
          </motion.div>
        ) : cryptoExpired ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-center"
          >
            <div className="inline-flex items-center space-x-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
              <AlertTriangle className="w-3 h-3" />
              <span>Expired</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your subscription expired on <span className="text-white font-bold">{new Date(cryptoSub.expires_at).toLocaleDateString()}</span>. Renew below to regain access.
            </p>
          </motion.div>
        ) : null}

        {/* Crypto Plan Cards — show buy buttons if NOT active */}
        {(!hasCryptoActive || cryptoExpired) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {cryptoPlans.map((plan) => (
                <motion.div
                  key={plan.key}
                  whileHover={{ y: -8 }}
                  className="relative bg-surface p-8 rounded-[2.5rem] border-2 border-gray-800 hover:border-emerald-500/50 transition-all"
                >
                  <div className={`absolute -top-4 right-4 ${plan.badgeColor || 'bg-red-500'} text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
                    {plan.badge}
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">{plan.name}</h3>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-500 font-bold text-sm uppercase">/{plan.period}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 font-bold uppercase tracking-wider">{plan.duration} access</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-3 text-sm font-medium text-gray-400">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCryptoPayment(plan.key)}
                    disabled={cryptoLoading !== null || !termsAccepted}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl uppercase tracking-[0.15em] transition-all transform hover:scale-[1.02] shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-2"
                  >
                    {cryptoLoading === plan.key ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating Payment...</span>
                      </>
                    ) : (
                      <span>₿ Pay with Crypto</span>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="max-w-4xl mx-auto mt-8">
              <label className="flex items-start space-x-3 cursor-pointer group p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors bg-surface">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setCryptoError(''); }}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer flex-shrink-0 accent-emerald-500"
                />
                <span className="text-sm text-gray-400 leading-relaxed">
                  <strong className="text-white">I understand and accept the payment terms:</strong>{' '}
                  The payment amount must be <strong className="text-emerald-400">exactly equal to or greater than</strong> the listed plan price.
                  If the amount sent is less than the required price — even by $0.01 — <strong className="text-red-400">access will NOT be granted and no refund will be issued</strong>.
                  TFC bears no responsibility for incorrect payment amounts. By checking this box, I confirm I have read and accept these conditions.
                </span>
              </label>

              {cryptoError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
                  {cryptoError}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-50">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Secure Payments</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Instant Access</span>
        </div>
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">TFC Quality</span>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        plan={selectedPlan}
        onPixelatedSuccess={handlePaymentSuccess}
      />
    </div>
  );
};


export default Subscription;
