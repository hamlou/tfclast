import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { auth, db, updateEmailVerifiedInFirestore, resendVerificationEmail } from '../firebase';
import { applyActionCode, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import './Login.css';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('waiting'); // waiting | verifying | verified | error
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    // ── Case 1: User clicked the verification link from email ──
    if (mode === 'verifyEmail' && oobCode) {
      setStatus('verifying');
      applyActionCode(auth, oobCode)
        .then(async () => {
          // Try to update Firestore if we have a signed-in user
          const user = auth.currentUser;
          if (user) {
            try { await updateDoc(doc(db, 'users', user.uid), { emailVerified: true }); } catch {}
          }
          setStatus('verified');
        })
        .catch(() => {
          setStatus('error');
          setMessage('This verification link has expired or already been used. Please request a new one.');
        });
      return;
    }

    // ── Case 2: Redirect from reset-password link (wrong mode) ──
    if (mode === 'resetPassword' && oobCode) {
      navigate(`/reset-password?mode=resetPassword&oobCode=${oobCode}`, { replace: true });
      return;
    }

    // ── Case 3: Came from signup — show "check your email" UI ──
    const emailFromState = location.state?.email;
    const emailFromStorage = sessionStorage.getItem('tfc_pending_verify_email');
    const email = emailFromState || emailFromStorage;

    if (email) {
      setUserEmail(email);
      if (emailFromState) sessionStorage.setItem('tfc_pending_verify_email', emailFromState);
      setStatus('waiting');
    } else {
      // No email context at all → just redirect to login cleanly
      navigate('/login', { replace: true });
    }

    // ── Listen for auth state change (if user verifies in another tab) ──
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.emailVerified) {
        try { await updateDoc(doc(db, 'users', user.uid), { emailVerified: true }); } catch {}
        setStatus('verified');
      }
    });
    return () => unsub();
  }, []);

  // Auto-redirect countdown after verified
  useEffect(() => {
    if (status !== 'verified') return;
    if (countdown <= 0) { navigate('/login', { state: { emailVerified: true } }); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!userEmail || isResending || resendCooldown > 0) return;
    setIsResending(true);
    const result = await resendVerificationEmail(userEmail);
    setIsResending(false);
    if (result.success) {
      setMessage('Verification email resent! Check your inbox and spam folder.');
      setResendCooldown(60);
    } else {
      setMessage(result.message || 'Failed to resend. Please try again.');
    }
  };

  return (
    <>
      <SEO title="Verify Email" description="Verify your email address to access TFC Championship." />
      <div className="bg"></div>
      <div className="grid-overlay"></div>

      <div className="wrapper">
        <div className="card">
          <div className="logo-wrap">
            <img src="/login&singup.png" alt="TFC Logo" className="logo-image" />
          </div>

          {/* ── VERIFYING state ── */}
          {status === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 20px', border: '3px solid #e01818', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: '#aaa', fontSize: 15 }}>Verifying your email...</p>
            </div>
          )}

          {/* ── VERIFIED state ── */}
          {status === 'verified' && (
            <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'linear-gradient(135deg, #55d080, #34a853)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(85,208,128,0.4)' }}>
                <svg style={{ width: 42, height: 42 }} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#55d080', marginBottom: 8 }}>Email Verified!</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your account is now active. You can sign in and access all TFC features.
              </p>
              <div style={{ background: 'rgba(224,24,24,0.08)', border: '1px solid rgba(224,24,24,0.25)', borderRadius: 10, padding: '14px 20px', marginBottom: 24 }}>
                <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>
                  Redirecting to sign in in <strong style={{ color: '#e01818', fontSize: 16 }}>{countdown}s</strong>
                </p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/login', { state: { emailVerified: true } })}>
                Sign In Now
              </button>
            </div>
          )}

          {/* ── ERROR state ── */}
          {status === 'error' && (
            <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: 'rgba(224,24,24,0.15)', border: '2px solid rgba(224,24,24,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 40, height: 40 }} fill="none" stroke="#e01818" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ff6b6b', marginBottom: 8 }}>Link Expired</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                {message || 'This verification link has expired or already been used.'}
              </p>
              {userEmail && (
                <button
                  className="btn-primary"
                  disabled={isResending || resendCooldown > 0}
                  onClick={handleResend}
                  style={{ opacity: resendCooldown > 0 ? 0.6 : 1 }}
                >
                  {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send New Verification Email'}
                </button>
              )}
              <div className="switch-text" style={{ marginTop: 16 }}>
                <span onClick={() => navigate('/login')}>Back to Sign In</span>
              </div>
            </div>
          )}

          {/* ── WAITING state (check your email) ── */}
          {status === 'waiting' && (
            <div>
              <div className="tagline">Check Your Email</div>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 72, height: 72, margin: '0 auto 16px', background: 'rgba(224,24,24,0.1)', border: '2px solid rgba(224,24,24,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 36, height: 36 }} fill="none" stroke="#e01818" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7 }}>
                  We sent a confirmation link to<br />
                  <strong style={{ color: '#e01818' }}>{userEmail}</strong>
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #222', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                {[
                  { n: 1, title: 'Open your email inbox', sub: 'Look for an email from TFC Championship' },
                  { n: 2, title: 'Click "Confirm My Account"', sub: 'It\'s a big red button inside the email' },
                  { n: 3, title: 'You\'re in!', sub: 'Come back and sign in after verifying' },
                ].map(({ n, title, sub }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: n < 3 ? 16 : 0 }}>
                    <div style={{ width: 28, height: 28, background: '#e01818', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>{n}</span>
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{title}</p>
                      <p style={{ color: '#666', fontSize: 12, margin: 0 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg style={{ width: 18, height: 18, color: '#ffa500', flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: '#ffd7a3', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                  Don't see the email? Check your <strong>spam / junk</strong> folder.
                </p>
              </div>

              {message && (
                <div style={{ background: 'rgba(85,208,128,0.08)', border: '1px solid rgba(85,208,128,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#55d080', fontSize: 13, textAlign: 'center' }}>
                  {message}
                </div>
              )}

              <button
                className="btn-primary"
                disabled={isResending || resendCooldown > 0}
                onClick={handleResend}
                style={{ opacity: resendCooldown > 0 ? 0.6 : 1, background: 'transparent', border: '1px solid rgba(224,24,24,0.5)', color: '#e01818' }}
              >
                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>

              <div className="switch-text" style={{ marginTop: 16 }}>
                Wrong email? <span onClick={() => navigate('/login')}>Go back</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
