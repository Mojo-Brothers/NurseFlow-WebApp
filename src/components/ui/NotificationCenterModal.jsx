import React from 'react';
import { useNotificationStore } from '../../core/stores/notification.store.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function NotificationCenterModal() {
  const { notifications, isNotificationPanelOpen, closePanel, markAsRead, markAllAsRead } = useNotificationStore();
  const { setLiveContext } = useEncounterStore();

  if (!isNotificationPanelOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.patientId) {
      setLiveContext(notif.patientId, null);
      toast.success(`Memuat Konteks Pasien: ${notif.patientName} (${notif.mrn})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Pusat Notifikasi Klinis (Real-Time Alert)</h2>
              <p className="text-[10px] text-slate-500">{unreadCount} Notifikasi Belum Dibaca</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Tandai Semua Dibaca
              </button>
            )}
            <button
              onClick={closePanel}
              className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                !notif.read
                  ? notif.severity === 'CRITICAL'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 ring-1 ring-rose-400/30'
                    : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  notif.severity === 'CRITICAL' ? 'bg-rose-600 text-white animate-pulse' :
                  notif.severity === 'WARNING' ? 'bg-amber-600 text-white' :
                  notif.severity === 'SUCCESS' ? 'bg-emerald-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {notif.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(notif.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                {notif.title}
              </h4>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {notif.message}
              </p>

              {notif.patientName && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                  <span>Pasien: {notif.patientName} ({notif.mrn})</span>
                  <span>Klik untuk buka &rarr;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
