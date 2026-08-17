import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './routes/index';
import { Toaster } from 'react-hot-toast';
import { processQueue } from './core/services/syncQueue.service.js';
import { executeQueuedAction } from './core/services/syncProcessor.js';

export default function App() {
  useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleSync = () => {
      console.log('[App] Network Online: Triggering background sync queue...');
      processQueue(executeQueuedAction);
    };

    window.addEventListener('online', handleSync);
    if (navigator.onLine) handleSync();

    return () => window.removeEventListener('online', handleSync);
  }, []);

  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          duration: 2500,
          style: {
            background: '#0f172a',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '16px',
            padding: '12px 18px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
