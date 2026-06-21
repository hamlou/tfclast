import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } else {
    document.body.innerHTML = '<div style="padding:40px;color:red;font-family:Arial;"><h1>Error</h1><p>Root element not found</p></div>';
  }
} catch (error) {
  console.error('Fatal error:', error);
  document.body.innerHTML = `
    <div style="padding:40px;color:#fff;font-family:Arial;background:#0a0a0a;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <h1 style="font-size:28px;margin-bottom:12px;">Application Error</h1>
      <p style="color:#888;max-width:400px;margin-bottom:24px;">Something went wrong while loading the application. Please try reloading.</p>
      <button onclick="window.location.reload()" style="padding:14px 36px;background:#e01818;color:white;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;">Reload</button>
    </div>
  `;
}
