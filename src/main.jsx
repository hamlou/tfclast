import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

console.log('🚀 MAIN.JSX STARTING...');
console.log('📦 React version:', React.version);

try {
  const rootElement = document.getElementById('root');
  console.log('🎯 Root element found:', rootElement ? 'YES' : 'NO');
  
  if (!rootElement) {
    document.body.innerHTML = '<div style="padding:40px;color:red;font-family:Arial;"><h1>CRITICAL ERROR</h1><p>Root element #root not found!</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('✅ APP RENDERED SUCCESSFULLY');
  }
} catch (error) {
  console.error('❌ FATAL ERROR in main.jsx:', error);
  document.body.innerHTML = `
    <div style="padding:40px;color:red;font-family:Arial;background:#000;min-height:100vh;">
      <h1>🚨 Application Crashed</h1>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Check browser console (F12) for details</strong></p>
      <button onclick="window.location.reload()" style="padding:10px 20px;background:#e01818;color:white;border:none;cursor:pointer;margin-top:20px;">Reload Page</button>
    </div>
  `;
}
