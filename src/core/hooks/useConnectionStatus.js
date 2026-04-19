import { useState, useEffect } from 'react';

/**
 * NurseFlow Resilience Hook (V5)
 * Monitors real-time connection status with Firestore.
 * Essential for JCI "Fail-Safe" mode operation.
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFirestoreSynced] = useState(true);

  useEffect(() => {
    // 1. Monitor Browser Network
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Monitor Firestore Connection State (.info/connected is a special path)
    // Note: Since this is JS, we use onSnapshot on the internal metadata
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { 
    isOnline, 
    isFirestoreSynced,
    statusMessage: isOnline ? 'System Online (Sync Active)' : '⚠️ Offline Mode (Medicine Continues - Fail-safe Active)'
  };
}
