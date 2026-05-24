import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import './Login.css';

export default function ResetSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email provided, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  return (
    <>
      <SEO
        title="Check Your Email"
        description="Password reset instructions sent to your email."
      />

      {/* Background */}
      <div className="bg"></div>
      <div className="grid-overlay"></div>

      <div className="wrapper">
        <div className="card">
          <div className="logo-wrap">
            <img src="/login&singup.png" alt="TFC Logo" className="logo-image" />
          </div>
          <div className="tagline">Check Your Inbox</div>

          {/* Success Message */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(85, 208, 128, 0.15) 0%, rgba(52, 168, 83, 0.15) 100%)', 
            backdropFilter: 'blur(10px)',
            border: '2px solid #55d080',
            boxShadow: '0 0 30px rgba(85, 208, 128, 0.3), inset 0 0 20px rgba(85, 208, 128, 0.05)',
            padding: '24px', 
            borderRadius: '12px', 
            marginBottom: '24px', 
            textAlign: 'center',
            animation: 'slideInDown 0.5s ease-out, pulse 2s ease-in-out infinite'
          }}>
            {/* Animated envelope icon */}
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #55d080 0%, #34a853 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(85, 208, 128, 0.5)',
              animation: 'scaleIn 0.5s ease-out 0.2s both'
            }}>
              <svg style={{ width: '32px', height: '32px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 style={{ 
              fontSize: '22px', 
              fontWeight: '700', 
              color: '#55d080',
              marginBottom: '12px',
              textShadow: '0 0 20px rgba(85, 208, 128, 0.5)'
            }}>
              Email Sent Successfully! 📧
            </h3>
            
            <p style={{ 
              fontSize: '14px', 
              color: '#aaa',
              lineHeight: '1.6',
              margin: 0
            }}>
              We've sent a password reset link to:<br />
              <strong style={{ color: '#fff', display: 'block', marginTop: '8px' }}>{email}</strong>
            </p>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Next Steps:
            </h4>
            <ol style={{
              fontSize: '13px',
              color: '#ccc',
              lineHeight: '1.8',
              paddingLeft: '20px',
              margin: 0
            }}>
              <li style={{ marginBottom: '8px' }}>Check your email inbox (and spam folder)</li>
              <li style={{ marginBottom: '8px' }}>Click the password reset link in the email</li>
              <li style={{ marginBottom: '8px' }}>Create a new password on the next page</li>
              <li>Login with your new password</li>
            </ol>
          </div>

          {/* Didn't receive email */}
          <div style={{
            textAlign: 'center',
            padding: '16px',
            background: 'rgba(224, 24, 24, 0.1)',
            border: '1px solid rgba(224, 24, 24, 0.2)',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '13px', color: '#e01818', margin: '0 0 12px 0' }}>
              Didn't receive the email?
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn-primary"
              style={{
                padding: '10px 24px',
                fontSize: '12px',
                background: 'transparent',
                border: '2px solid var(--red)',
                boxShadow: 'none'
              }}
            >
              Try Again
            </button>
          </div>

          {/* Back to Login */}
          <div className="switch-text">
            Remember your password? <span onClick={() => navigate('/login')}>Sign In</span>
          </div>
        </div>
      </div>
    </>
  );
}
