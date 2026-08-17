import React from 'react';
import { useAuth } from '../../contexts/useAuth.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import toast from 'react-hot-toast';

export default function ClinicalContextRibbon() {
  const { currentUser, role } = useAuth();
  const { activePatientId, activeEncounterId } = useEncounterStore();
  const { patients } = usePatientStore();

  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId);

  const handleTriggerCodeBlue = () => {
    toast.error('🚨 CODE BLUE ACTIVATED: Tim Resusitasi IGD / ICU dipanggil ke Bed 1!', {
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
    <div className="w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
      {/* Left: Facility & Clinician Context */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-bold text-[11px]">
          <span className="material-symbols-outlined text-[15px]">apartment</span>
          <span>RSUP Nasional • Main Facility</span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
          <span className="material-symbols-outlined text-[15px] text-emerald-400">verified_user</span>
          <span className="font-bold">{currentUser?.email || 'dr. Budi Santoso, Sp.B'}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-black">
            STR / SIP ACTIVE
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-600/50 text-blue-300 font-black">
            SHIFT PAGI (07:00 - 14:00)
          </span>
        </div>
      </div>

      {/* Center: Live Patient Context Banner (if selected) */}
      {activePatient ? (
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-950/80 border border-blue-600/60 text-blue-100 animate-pulse">
          <span className="material-symbols-outlined text-[16px] text-blue-400">person</span>
          <span className="font-extrabold">{activePatient.name}</span>
          <span className="text-[11px] font-mono text-blue-300">({activePatient.mrn})</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 font-black uppercase">
            TRIAGE ESI 2
          </span>
          {activePatient.allergies?.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 font-black uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">warning</span>
              ALERGI: {activePatient.allergies.join(', ')}
            </span>
          )}
          <button
            onClick={() => useEncounterStore.getState().clearLiveContext()}
            className="w-4 h-4 rounded-full bg-blue-800 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] ml-1 transition-colors cursor-pointer"
            title="Tutup Live Patient Context"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px]">
          <span className="material-symbols-outlined text-[14px]">info</span>
          <span>Tidak ada pasien live context aktif. Pilih pasien dari antrean atau gunakan Ctrl+K.</span>
        </div>
      )}

      {/* Right: Emergency Code Triggers & JCI Safety Indicator */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleTriggerCodeBlue}
          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm shadow-rose-900/50"
          title="Aktivasi Panggilan Darurat Resusitasi (Code Blue)"
        >
          <span className="material-symbols-outlined text-[13px]">emergency</span>
          <span>Code Blue</span>
        </button>

        <button
          onClick={handleTriggerCodeRed}
          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm shadow-amber-900/50"
          title="Aktivasi Peringatan Evakuasi (Code Red)"
        >
          <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
          <span>Code Red</span>
        </button>
      </div>
    </div>
  );
}
