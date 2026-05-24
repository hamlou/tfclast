import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { sendPasswordReset } from '../firebase';
import './Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const result = await sendPasswordReset(email);

    if (result.success) {
      setSuccessMessage(`Reset link sent! Check your inbox at ${email} — also check your spam folder.`);
      setTimeout(() => navigate('/reset-sent', { state: { email } }), 2000);
    } else {
      setErrorMessage(result.error || 'Failed to send reset email. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <>
      <SEO title="Forgot Password" description="Reset your TFC account password." />
      <div className="bg"></div>
      <div className="grid-overlay"></div>

      <div className="wrapper">
        <div className="card">
          <div className="logo-wrap">
            <img src="/login&singup.png" alt="TFC Logo" className="logo-image" />
          </div>
          <div className="tagline">Reset Your Password</div>

          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <div style={{ background: 'rgba(224,24,24,0.12)', border: '1px solid rgba(224,24,24,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ff6b6b', fontSize: 14, textAlign: 'center', lineHeight: 1.5 }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ background: 'rgba(85,208,128,0.1)', border: '1px solid rgba(85,208,128,0.4)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#55d080', fontSize: 14, textAlign: 'center', lineHeight: 1.5, fontWeight: 600 }}>
                {successMessage}
              </div>
            )}

            <div className="field">
              <div className="field-inner">
                <div className="field-content">
                  <input type="email" placeholder=" " autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                  <span className="field-label">Email address</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="switch-text">
              Remember your password? <span onClick={() => navigate('/login')}>Sign In</span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
