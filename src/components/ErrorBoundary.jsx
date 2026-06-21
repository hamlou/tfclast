import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console only in development — never expose stack traces in production
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(224, 24, 24, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <span style={{ fontSize: 36, color: '#e01818' }}>!</span>
          </div>

          <h1 style={{
            fontSize: 28,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: -0.5,
            margin: '0 0 12px',
          }}>
            Something Went Wrong
          </h1>

          <p style={{
            color: '#888',
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 400,
            margin: '0 0 32px',
          }}>
            An unexpected error occurred. Our team has been notified and is working to fix it.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#e01818',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 36px',
              fontSize: 14,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>

          <p style={{ color: '#555', fontSize: 12, marginTop: 24 }}>
            If the problem persists, contact{' '}
            <a href="mailto:contact@tfc.events" style={{ color: '#e01818', textDecoration: 'none' }}>
              contact@tfc.events
            </a>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
