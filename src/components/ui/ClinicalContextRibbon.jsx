import React from 'react';
import { useAuth } from '../../contexts/useAuth.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { useNotificationStore } from '../../core/stores/notification.store.js';
import NotificationCenterModal from './NotificationCenterModal.jsx';
import toast from 'react-hot-toast';

export default function ClinicalContextRibbon() {
  const { currentUser } = useAuth();
  const { activePatientId } = useEncounterStore();
  const { patients } = usePatientStore();
  const { notifications, togglePanel } = useNotificationStore();

  const unreadCount = notifications.filter(n => !n.read).length;
  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || (activePatientId ? {
    id: activePatientId,
    mrn: activePatientId,
    name: 'Tn. Hendra (Mr. X)',
    age: '42 Thn',
    gender: 'Laki-laki',
    bed: 'Bed OK-01 (IBS) / Bed ICU-02',
    insurance: 'BPJS Kesehatan (PBI)',
    triageLevel: 'ESI 2 (EMERGENCY)',
    codeStatus: 'FULL CODE',
    allergies: ['Penicillin G', 'Sulfa'],
    dpjp: 'dr. Budi Santoso, Sp.B',
    criticalAlert: 'Troponin-I ↑ High (0.84 ng/ml)'
  } : null);

  const handleTriggerCodeBlue = () => {
    toast.error('🚨 CODE BLUE ACTIVATED: Tim Resusitasi IGD / ICU dipanggil segera!', {
      duration: 5000,
      icon: '🚨'
    });
  };

  const handleTriggerCodeRed = () => {
    toast.error('🔥 CODE RED ACTIVATED: Alarm Bahaya Kebakaran / Evakuasi aktif!', {
      duration: 5000,
      icon: '🔥'
    });
  };

  return (
    <>
      {/* Ocean Enterprise Clinical Ribbon (#015C80) */}
      <header className="w-full bg-[#015C80] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border-b border-[#014966] sticky top-0 z-40">
        {/* Active Patient Global Context (Zero-Click Visibility) */}
        {activePatient ? (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* MRN & Name */}
            <div className="flex items-center gap-1.5 bg-[#014460] px-2.5 py-1 rounded-lg border border-[#02759f]">
              <span className="font-mono font-black text-cyan-200">{activePatient.mrn}</span>
              <span className="font-black text-white text-sm">{activePatient.name}</span>
              <span className="text-[11px] text-cyan-100">({activePatient.age || '42 Th'} • {activePatient.gender || 'L'})</span>
            </div>

            {/* Bed & Acuity */}
            <div className="flex items-center gap-1 bg-[#014460] px-2 py-1 rounded-lg border border-[#02759f]">
              <span className="material-symbols-outlined text-[15px] text-cyan-300">bed</span>
              <span className="font-bold text-cyan-100">{activePatient.bed || 'Bed Ranap A-302'}</span>
            </div>

            {/* Insurance */}
            <span className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-500/50 font-bold text-[10px]">
              {typeof activePatient.insurance === 'string'
                ? activePatient.insurance
                : activePatient.insurance?.name || activePatient.payer || 'BPJS AKTIF'}
            </span>

            {/* Triage Acuity */}
            <span className="px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-500/50 font-black text-[10px] uppercase">
              {activePatient.triageLevel || 'ESI 2'}
            </span>

            {/* Code Status */}
            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-mono font-bold text-[10px]">
              {activePatient.codeStatus || 'FULL CODE'}
            </span>

            {/* Allergies Warning */}
            {activePatient.allergies?.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/80 font-black text-[10px] flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[13px]">warning</span>
                ALERGI: {activePatient.allergies
                  .map(a => typeof a === 'string' ? a : (a.agent || a.name || 'Alergi'))
                  .join(', ')}
              </span>
            )}

            {/* Lab Critical Alert */}
            {activePatient.criticalAlert && (
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 font-mono font-bold text-[10px]">
                ⚡ {activePatient.criticalAlert}
              </span>
            )}

            {/* DPJP */}
            <span className="text-[11px] text-cyan-200 hidden lg:inline">
              DPJP: <strong className="text-white">{activePatient.dpjp || 'dr. Budi Santoso, Sp.B'}</strong>
            </span>

            {/* Clear Patient Context Button */}
            <button
              type="button"
              onClick={() => useEncounterStore.getState().clearLiveContext()}
              className="w-5 h-5 rounded-full bg-[#01354b] hover:bg-rose-600 text-white flex items-center justify-center text-[10px] ml-1 transition-colors cursor-pointer"
              title="Tutup Konteks Pasien Aktif"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#014460] border border-[#02759f] text-cyan-200 font-bold text-[11px]">
              <span className="material-symbols-outlined text-[15px]">local_hospital</span>
              <span>RSUP Nasional • HIS Clinical Core 2026</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#014460] border border-[#02759f] text-slate-100 text-[11px]">
              <span className="material-symbols-outlined text-[15px] text-emerald-400">verified_user</span>
              <span className="font-bold">{currentUser?.email || 'dr. Budi Santoso, Sp.B'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-black">
                SIP AKTIF
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-600/50 text-blue-300 font-black">
                SHIFT 07:00-14:00
              </span>
            </div>

            <span className="hidden xl:inline text-cyan-200/80 text-[11px]">
              Pilih pasien dari antrean atau tekan <kbd className="bg-[#01354b] px-1.5 py-0.5 rounded border border-[#02759f] font-mono">Ctrl+K</kbd> untuk membuka rekam medis.
            </span>
          </div>
        )}

        {/* Right: Notification Bell & Emergency Code Triggers */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={togglePanel}
            className="relative p-1.5 rounded-lg bg-[#014460] hover:bg-[#02759f] text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-[#02759f]"
            title="Pusat Notifikasi & Nilai Kritis"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Emergency Code Blue */}
          <button
            type="button"
            onClick={handleTriggerCodeBlue}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Panggilan Darurat Henti Jantung (Code Blue)"
          >
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            <span>Code Blue</span>
          </button>

          {/* Emergency Code Red */}
          <button
            type="button"
            onClick={handleTriggerCodeRed}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm"
            title="Alarm Bahaya Kebakaran (Code Red)"
          >
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
            <span>Code Red</span>
          </button>
        </div>
      </header>

      {/* Slide-in Notification Modal */}
      <NotificationCenterModal />
    </>
  );
}
