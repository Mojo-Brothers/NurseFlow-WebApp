import React, { useState, useEffect } from 'react';
import { getPendingCount, isOnline } from '../../core/services/syncQueue.service.js';

/**
 * OfflineStatusIndicator — A persistent, subtle indicator of clinical data continuity.
 * Alerts clinicians to network status and pending sync items.
 */
export default function OfflineStatusIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const updateStatus = async () => {
      setOnline(isOnline());
      const count = await getPendingCount();
      setPending(count);
    };

    const handleNetwork = () => updateStatus();
    window.addEventListener('online',  handleNetwork);
    window.addEventListener('offline', handleNetwork);
    
    // Polling for pending count
    const interval = setInterval(updateStatus, 3000);

    return () => {
      window.removeEventListener('online',  handleNetwork);
      window.removeEventListener('offline', handleNetwork);
      clearInterval(interval);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] animate-bounce-in">
       <div className={`flex-row items-center gap-3 px-5 py-3 rounded-full shadow-2xl border backdrop-blur-md transition-all
         ${online ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}`}>
          
          <div className="relative">
             <span className="material-symbols-outlined text-xl">
                {online ? 'cloud_sync' : 'cloud_off'}
             </span>
             {pending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                   {pending}
                </span>
             )}
          </div>

          <div className="flex-column leading-none">
             <span className="text-[10px] font-black uppercase tracking-widest">
                {online ? 'Synchronizing' : 'Offline Mode'}
             </span>
             <span className="text-[8px] font-bold opacity-60 mt-1 uppercase">
                {pending > 0 ? `${pending} Pending Assessment(s)` : 'Continuity Active'}
             </span>
          </div>
       </div>
    </div>
  );
}
