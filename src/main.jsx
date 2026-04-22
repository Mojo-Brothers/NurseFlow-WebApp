import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './core/i18n/i18n.js'

// NurseFlow HIS V5 - Root Bootstrap

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

// --- PWA Service Worker Registration (Phase 17) ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[PWA] Service Worker Active:', reg.scope))
      .catch(err => console.error('[PWA] Registration Failed:', err));
  });
}
