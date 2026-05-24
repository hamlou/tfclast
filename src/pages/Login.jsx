import { useState, useEffect } from "react";
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { signIn, signUp, signInWithGoogle } from '../firebase';
import './Login.css';

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  const [rememberMe, setRememberMe] = useState(false); // M1

  // M2: Clear messages when switching tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // M3: React-controlled signup fields (no more document.getElementById)
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Firebase authentication state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);

  /* ── Check for verification success from email verification page ── */
  useEffect(() => {
    const verified = location.state?.emailVerified;
    if (verified) {
      setShowVerificationSuccess(true);
      // Clear the state so message doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowVerificationSuccess(false);
      }, 5000);
    }
  }, [location, navigate]);

  /* ── Password strength logic (mirrors checkPw in tfc-auth.html) ── */
  const [signupPassword, setSignupPassword] = useState('');
  const tests = [
    { id: 'rule-len', label: '8+ characters', ok: signupPassword.length >= 8 },
    { id: 'rule-upper', label: 'Uppercase letter', ok: /[A-Z]/.test(signupPassword) },
    { id: 'rule-num', label: 'Number', ok: /[0-9]/.test(signupPassword) },
    { id: 'rule-special', label: 'Special character', ok: /[^A-Za-z0-9]/.test(signupPassword) },
  ];
  const score = tests.filter(t => t.ok).length;
  const strengthColors = ['', '#e01818', '#e07018', '#d4b800', '#55d080'];

  /* ── Password visibility ── */
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [signupPwVisible, setSignupPwVisible] = useState(false);
  const [confirmPwVisible, setConfirmPwVisible] = useState(false);

  const eyeOpen = <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>;
  const eyeClosed = <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>;

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const username = signupUsername;
    const email = signupEmail;
    const password = signupPassword;
    const confirmPassword = signupConfirm;

    // Check if passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords don\'t match. Please make sure both password fields are identical.');
      setIsLoading(false);
      return;
    }

    // Password validation
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength) {
      setErrorMessage('Password must be at least 8 characters long. Longer passwords are more secure!');
      setIsLoading(false);
      return;
    }

    if (!hasUppercase) {
      setErrorMessage('Password needs at least one uppercase letter (A-Z).');
      setIsLoading(false);
      return;
    }

    if (!hasNumber) {
      setErrorMessage('Password needs at least one number (0-9).');
      setIsLoading(false);
      return;
    }

    if (!hasSpecialChar) {
      setErrorMessage('Password needs at least one special character (like !@#$%^&*).');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password, username);
      
      if (result.success) {
        console.log('Navigating to /verify-email with email:', email);
        // Signup successful - redirect to verification page with credentials
        navigate('/verify-email', { state: { email } }); // S1: never pass password in state
      } else {
        // Signup failed - show error
        setErrorMessage(result.error || 'Oops! Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrorMessage('Oops! Something unexpected happened. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const email = loginEmail;
    const password = loginPassword;

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Email is verified (checked in firebase.js), allow login
        console.log('✅ Email verified, logging in:', email);
        login(email, password, result.username, rememberMe);
        setSuccessMessage(`Welcome back, ${result.username}! 🎉`);
      } else {
        // Login failed - show error with better message
        const errorMsg = result.error || 'Unable to sign in. Please check your email and password.';
        
        // Handle specific Firebase errors
        let friendlyMessage = errorMsg;
        if (errorMsg.includes('auth/invalid-credential') || errorMsg.includes('invalid-credential')) {
          friendlyMessage = 'Hmm, that email or password doesn\'t look right. Please try again.';
        } else if (errorMsg.includes('auth/user-not-found')) {
          friendlyMessage = 'We couldn\'t find an account with this email. Want to create one?';
        } else if (errorMsg.includes('auth/wrong-password')) {
          friendlyMessage = 'Incorrect password. Did you forget it? You can reset it below.';
        } else if (errorMsg.includes('auth/too-many-requests')) {
          friendlyMessage = 'Too many attempts. For security, please wait a few minutes before trying again.';
        } else if (errorMsg.includes('auth/network-request-failed')) {
          friendlyMessage = 'Having trouble connecting. Please check your internet connection.';
        } else if (errorMsg === 'email-not-verified' || errorMsg.includes('email-not-verified')) {
          friendlyMessage = 'Please verify your email first!';
          
          // Set error and DON'T auto-dismiss - user must click Go Back
          setErrorMessage(friendlyMessage);
          setIsLoading(false);
          return;
        }
        
        setErrorMessage(friendlyMessage);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('🔍 Starting Google Sign-In...');
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('✅ Google Sign-In successful:', result.user.email);
        // Check if user needs to verify email first
        if (result.requiresVerification) {
          console.log('⚠️ User needs to verify email. Redirecting...');
          // Redirect to verification page
          navigate('/verify-email', { state: { email: result.user.email } });
          return;
        }
        
        // Check if user is new or existing
        if (result.isNewUser) {
          // New user - create account and welcome
          login(result.user.email, 'google-oauth', result.username);
          setSuccessMessage(`Account created! Welcome, ${result.username || result.user.displayName || result.user.email}!`);
        } else {
          // Existing user - this should only happen on login tab
          // If they clicked "Sign up with Google" but already have an account
          if (activeTab === 'signup') {
            // They tried to sign up but already have an account
            setErrorMessage('This email is already registered. Please sign in instead.');
            // Switch to login tab automatically
            setTimeout(() => handleTabSwitch('login'), 2000);
          } else {
            // Normal login
            login(result.user.email, 'google-oauth', result.username);
            setSuccessMessage(`Welcome back, ${result.username || result.user.displayName || result.user.email}!`);
          }
        }
      } else {
        // Google sign-in failed - show error
        let errorMsg = 'Unable to sign in with Google. Please try again.';
        if (result.error?.includes('unauthorized-domain') || result.error?.includes('auth/unauthorized-domain')) {
          errorMsg = 'Google sign-in is not available right now. Please use email and password instead.';
        } else if (result.error?.includes('popup-closed') || result.error?.includes('cancelled')) {
          errorMsg = 'Sign-in was cancelled. Please try again.';
        } else if (result.error?.includes('network')) {
          errorMsg = 'No internet connection. Please check your network and try again.';
        }
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      let errorMsg = 'Something went wrong. Please try again or use email and password.';
      if (error.code === 'auth/unauthorized-domain') {
        errorMsg = 'Google sign-in is not available right now. Please use email and password instead.';
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        errorMsg = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMsg = 'No internet connection. Please check your network and try again.';
      }
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login"
        description="Login to your TFC account to access exclusive live events and premium content."
      />

      {/* Identical background from tfc-auth.html */}
      <div className="bg"></div>
      <div className="grid-overlay"></div>

      <div className="wrapper">
        <div className="card">

          <div className="logo-wrap">
            <img src="/login&singup.png" alt="TFC Logo" className="logo-image" />
          </div>
          <div className="tagline">The Full Contact Championship</div>

          {/* TABS - using React state for stable switching */}
          <div className="tabs">
            <div className={`tab-indicator${activeTab === 'signup' ? ' right' : ''}`} id="tab-indicator"></div>
            <div
              className={`tab${activeTab === 'login' ? ' active' : ''}`}
              id="tab-login"
              onClick={() => handleTabSwitch('login')}
            >
              Sign In
            </div>
            <div
              className={`tab${activeTab === 'signup' ? ' active' : ''}`}
              id="tab-signup"
              onClick={() => handleTabSwitch('signup')}
            >
              Sign Up
            </div>
          </div>

          {/* ── LOGIN FORM ── */}
          <form
            className={`form${activeTab === 'login' ? ' active' : ''}`}
            id="form-login"
            onSubmit={handleLoginSubmit}
          >
            {/* Verification Success Message */}
            {showVerificationSuccess && (
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(85, 208, 128, 0.15) 0%, rgba(52, 168, 83, 0.15) 100%)', 
                backdropFilter: 'blur(10px)',
                border: '2px solid #55d080',
                boxShadow: '0 0 30px rgba(85, 208, 128, 0.3), inset 0 0 20px rgba(85, 208, 128, 0.05)',
                padding: '20px', 
                borderRadius: '12px', 
                marginBottom: '20px', 
                textAlign: 'center',
                animation: 'slideInDown 0.5s ease-out, pulse 2s ease-in-out infinite',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Animated checkmark icon */}
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  margin: '0 auto 12px',
                  background: 'linear-gradient(135deg, #55d080 0%, #34a853 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(85, 208, 128, 0.5)',
                  animation: 'scaleIn 0.5s ease-out 0.2s both'
                }}>
                  <svg style={{ width: '36px', height: '36px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 style={{ 
                  fontSize: '22px', 
                  fontWeight: '700', 
                  color: '#55d080',
                  marginBottom: '8px',
                  textShadow: '0 0 20px rgba(85, 208, 128, 0.5)'
                }}>
                  Email Verified Successfully!
                </h3>
                
                <p style={{ 
                  fontSize: '14px', 
                  color: '#aaa',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  Your account has been verified. You can now sign in to access all features.
                </p>

                {/* Decorative elements */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(85, 208, 128, 0.1) 0%, transparent 70%)',
                  animation: 'rotate 10s linear infinite'
                }} />
              </div>
            )}

            {/* Error/Success Messages */}
            {errorMessage && (
              <div className={errorMessage.includes('verify') || errorMessage.includes('Verify') ? 'error-notification' : ''} style={
                errorMessage.includes('verify') || errorMessage.includes('Verify') ? {} : {
                  background: 'rgba(224,24,24,0.12)',
                  border: '1px solid rgba(224,24,24,0.4)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  color: '#ff6b6b',
                  fontSize: '14px',
                  textAlign: 'center',
                  lineHeight: '1.5'
                }
              }>
                {(errorMessage.includes('verify') || errorMessage.includes('Verify')) ? (
                  <>
                    <div className="error-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="error-content">
                      <h4 className="error-title">Email Not Verified</h4>
                      <p className="error-message">{errorMessage}</p>
                      <div className="error-actions">
                        <button
                          onClick={() => navigate('/verify-email', { state: { email: loginEmail } })}
                          className="btn-verify"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '16px', height: '16px', marginRight: '6px'}}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Go to Verification Page
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  errorMessage
                )}
              </div>
            )}
            {successMessage && (
              <div style={{ background: '#1a1a1a', color: '#e01818', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', border: '2px solid #e01818', fontWeight: '600' }}>
                {successMessage}
              </div>
            )}

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input type="email" id="login-email" placeholder=" " autoComplete="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  <span className="field-label">Email address</span>
                </div>
              </div>
            </div>

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input
                    type={loginPwVisible ? "text" : "password"}
                    id="login-password"
                    placeholder=" "
                    autoComplete="current-password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                  <span className="field-label">Password</span>
                </div>
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setLoginPwVisible(!loginPwVisible)}
                  aria-label="Toggle"
                >
                  <svg id="eye-login-password" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {loginPwVisible ? eyeOpen : eyeClosed}
                  </svg>
                </button>
              </div>
            </div>

            <div className="row-options">
              <label className="remember">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember me
              </label>
              <a className="forgot" href="#" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="switch-text">First time here? <span onClick={() => handleTabSwitch('signup')}>Create account</span></div>
            <div className="divider"><span>or continue with</span></div>
            <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* ── SIGN UP FORM ── */}
          <form
            className={`form${activeTab === 'signup' ? ' active' : ''}`}
            id="form-signup"
            onSubmit={handleSignupSubmit}
          >
            {/* Error/Success Messages */}
            {errorMessage && (
              <div style={{ background: '#e01818', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', border: '2px solid #8b0000' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ background: '#1a1a1a', color: '#e01818', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', border: '2px solid #e01818', fontWeight: '600' }}>
                {successMessage}
              </div>
            )}

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input type="text" id="signup-username" placeholder=" " autoComplete="username" value={signupUsername} onChange={e => setSignupUsername(e.target.value)} />
                  <span className="field-label">Username</span>
                </div>
              </div>
            </div>

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input type="email" id="signup-email" placeholder=" " autoComplete="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                  <span className="field-label">Email address</span>
                </div>
              </div>
            </div>

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input
                    type={signupPwVisible ? "text" : "password"}
                    id="signup-password"
                    placeholder=" "
                    autoComplete="new-password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <span className="field-label">Password</span>
                </div>
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setSignupPwVisible(!signupPwVisible)}
                  aria-label="Toggle"
                >
                  <svg id="eye-signup-password" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {signupPwVisible ? eyeOpen : eyeClosed}
                  </svg>
                </button>
              </div>
            </div>

            {/* STRENGTH BAR - exactly as in HTML, powered by React state */}
            <div className="strength-bar">
              <div
                className="strength-fill"
                id="strength-fill"
                style={{
                  width: `${(score / 4) * 100}%`,
                  background: strengthColors[score] || 'transparent',
                  boxShadow: score === 4 ? '0 0 8px rgba(85,208,128,0.5)' : 'none'
                }}
              ></div>
            </div>

            {/* PASSWORD RULES - matching the PASS/FAIL logic perfectly */}
            <div className="pw-rules">
              {tests.map(t => (
                <div
                  key={t.id}
                  className={`pw-rule${t.ok ? ' pass' : signupPassword.length > 0 ? ' fail' : ''}`}
                  id={t.id}
                >
                  <span className="dot"></span>{t.label}
                </div>
              ))}
            </div>

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input type={confirmPwVisible ? "text" : "password"} id="signup-confirm" placeholder=" " autoComplete="new-password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} />
                  <span className="field-label">Confirm password</span>
                </div>
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setConfirmPwVisible(!confirmPwVisible)}
                  aria-label="Toggle"
                >
                  <svg id="eye-signup-confirm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {confirmPwVisible ? eyeOpen : eyeClosed}
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="divider"><span>or sign up with</span></div>
            
            <button type="button" className="btn-google" onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Sign up with Google
            </button>
            
            <div className="switch-text">Already a member? <span onClick={() => handleTabSwitch('login')}>Sign in</span></div>
          </form>

        </div>
      </div>
    </>
  );
}
