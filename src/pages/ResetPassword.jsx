import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Password strength
  const tests = [
    { id: 'len', label: '8+ characters', ok: newPassword.length >= 8 },
    { id: 'upper', label: 'Uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { id: 'num', label: 'Number', ok: /[0-9]/.test(newPassword) },
    { id: 'special', label: 'Special character', ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const score = tests.filter(t => t.ok).length;
  const strengthColors = ['', '#e01818', '#e07018', '#d4b800', '#55d080'];

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    if (mode === 'resetPassword' && oobCode) {
      setIsValidLink(true);
    } else {
      setErrorMessage('This password reset link is invalid or has already been used. Please request a new one.');
    }
  }, [searchParams]);

  // Countdown to login after success
  useEffect(() => {
    if (!isDone) return;
    if (countdown <= 0) { navigate('/login'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isDone, countdown, navigate]);

  const eyeOpen = (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>);
  const eyeClosed = (<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match. Please make sure both fields are identical.");
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) { setErrorMessage('Password must be at least 8 characters long.'); setIsLoading(false); return; }
    if (!/[A-Z]/.test(newPassword)) { setErrorMessage('Password needs at least one uppercase letter.'); setIsLoading(false); return; }
    if (!/[0-9]/.test(newPassword)) { setErrorMessage('Password needs at least one number.'); setIsLoading(false); return; }
    if (!/[^A-Za-z0-9]/.test(newPassword)) { setErrorMessage('Password needs at least one special character (like !@#$).'); setIsLoading(false); return; }

    try {
      const oobCode = searchParams.get('oobCode');
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsDone(true);
    } catch (error) {
      let msg = 'Something went wrong. Please try again.';
      if (error.code === 'auth/expired-action-code') msg = 'This reset link has expired. Please request a new one.';
      else if (error.code === 'auth/invalid-action-code') msg = 'This link has already been used. Please request a new reset link.';
      else if (error.code === 'auth/weak-password') msg = 'Password is too weak. Please choose a stronger password.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Set New Password" description="Create a new secure password for your TFC account." />
      <div className="bg"></div>
      <div className="grid-overlay"></div>

      <div className="wrapper">
        <div className="card">
          <div className="logo-wrap">
            <img src="/login&singup.png" alt="TFC Logo" className="logo-image" />
          </div>

          {isDone ? (
            <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
              <div style={{
                width: 80, height: 80, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #55d080, #34a853)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(85,208,128,0.4)'
              }}>
                <svg style={{ width: 42, height: 42 }} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#55d080', marginBottom: 8 }}>Password Updated!</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your password has been changed successfully.<br />
                You can now sign in with your new password.
              </p>
              <div style={{
                background: 'rgba(224,24,24,0.08)', border: '1px solid rgba(224,24,24,0.25)',
                borderRadius: 10, padding: '14px 20px', marginBottom: 24
              }}>
                <p style={{ color: '#ccc', fontSize: 13, margin: 0 }}>
                  Redirecting to sign in in <strong style={{ color: '#e01818', fontSize: 16 }}>{countdown}s</strong>
                </p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/login')}>Sign In Now</button>
            </div>
          ) : (
            <>
              <div className="tagline">Create a New Password</div>

              {!isValidLink && (
                <div style={{
                  background: 'rgba(224,24,24,0.1)', border: '1px solid rgba(224,24,24,0.35)',
                  borderRadius: 10, padding: '16px 18px', marginBottom: 20, textAlign: 'center'
                }}>
                  <p style={{ color: '#ff6b6b', fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>
                    {errorMessage || 'Invalid or expired reset link.'}
                  </p>
                  <button onClick={() => navigate('/forgot-password')} style={{
                    background: 'none', border: '1px solid rgba(224,24,24,0.5)',
                    color: '#e01818', borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700
                  }}>
                    Request New Link
                  </button>
                </div>
              )}

              {isValidLink && (
                <form onSubmit={handleSubmit} style={{ marginTop: 4 }}>
                  {errorMessage && (
                    <div style={{
                      background: 'rgba(224,24,24,0.12)', border: '1px solid rgba(224,24,24,0.4)',
                      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
                      color: '#ff6b6b', fontSize: 14, textAlign: 'center', lineHeight: 1.5
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  <div className="field">
                    <div className="field-inner">
                      <div className="field-content">
                        <input type={showNewPw ? 'text' : 'password'} placeholder=" " value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                        <span className="field-label">New Password</span>
                      </div>
                      <button type="button" className="eye-btn" onClick={() => setShowNewPw(!showNewPw)} aria-label="Toggle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {showNewPw ? eyeOpen : eyeClosed}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="strength-bar">
                    <div className="strength-fill" style={{
                      width: `${(score / 4) * 100}%`,
                      background: strengthColors[score] || 'transparent',
                      boxShadow: score === 4 ? '0 0 8px rgba(85,208,128,0.5)' : 'none'
                    }} />
                  </div>

                  <div className="pw-rules">
                    {tests.map(t => (
                      <div key={t.id} className={`pw-rule${t.ok ? ' pass' : newPassword.length > 0 ? ' fail' : ''}`}>
                        <span className="dot" />{t.label}
                      </div>
                    ))}
                  </div>

                  <div className="field">
                    <div className="field-inner">
                      <div className="field-content" style={{ position: 'relative' }}>
                        <input type={showConfirmPw ? 'text' : 'password'} placeholder=" " value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
                        <span className="field-label">Confirm New Password</span>
                        {confirmPassword.length > 0 && (
                          <span style={{
                            position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 18, color: confirmPassword === newPassword ? '#55d080' : '#e01818',
                            fontWeight: 700, pointerEvents: 'none'
                          }}>
                            {confirmPassword === newPassword ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                      <button type="button" className="eye-btn" onClick={() => setShowConfirmPw(!showConfirmPw)} aria-label="Toggle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {showConfirmPw ? eyeOpen : eyeClosed}
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={isLoading || score < 4 || newPassword !== confirmPassword}
                    style={{ marginTop: 8, opacity: (score < 4 || newPassword !== confirmPassword) ? 0.55 : 1 }}>
                    {isLoading ? 'Saving...' : 'Save New Password'}
                  </button>

                  <div className="switch-text">
                    Remember your password? <span onClick={() => navigate('/login')}>Sign In</span>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
