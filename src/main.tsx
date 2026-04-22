import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(msg, url, line, col, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="background: #09090b; color: white; height: 100vh; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; font-family: sans-serif;">
        <h1 style="color: #ef4444;">RUNTIME ERROR</h1>
        <p style="font-size: 0.8rem; color: #a1a1aa;">${msg}</p>
        <p style="font-size: 0.6rem; color: #52525b;">${url}:${line}</p>
      </div>
    `;
  }
  return false;
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  createRoot(rootElement).render(<App />);
} catch (error: any) {
  console.error('CRITICAL BOOT ERROR:', error);
  const errMsg = error?.message || 'Unknown Runtime Error';
  alert('BOOT ERROR: ' + errMsg);
}
