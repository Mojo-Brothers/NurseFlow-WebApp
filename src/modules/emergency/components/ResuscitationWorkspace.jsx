import React, { useState } from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';

export default function ResuscitationWorkspace({ encounterId = 'ENC-2026-001' }) {
  const { resusTimeline, logResuscitationEvent, triggerEmergencyAlert } = useEmergencyStore();

  const [cprCycle, setCprCycle] = useState(1);
  const [performer, setPerformer] = useState('Ns. Budi Santoso, S.Kep');
  const [epiDose, setEpiDose] = useState('1 mg IV Push');
  const [defibJoules, setDefibJoules] = useState('200 J Biphasic');

  const handleAction = async (type, doseInfo = '') => {
    await logResuscitationEvent({
      encounterId,
      eventType: type,
      performerName: performer,
      doseOrJoules: doseInfo,
      notes: `Tindakan resusitasi ${type}`
    });
    if (type === 'CPR_CYCLE') {
      setCprCycle(prev => prev + 1);
    }
  };

  const handleCodeBlue = async () => {
    await triggerEmergencyAlert({
      alertType: 'CODE_BLUE',
      locationName: 'Ruang Resusitasi IGD Bed 1',
      patientName: 'Pasien Kritis (Code Blue)',
      triggeredBy: performer
    });
    alert('🚨 ALARM CODE BLUE DIAKTIFKAN! Panggilan darurat disiarkan ke seluruh tim medis.');
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Code Blue Alert Banner ─── */}
      <div className="p-5 rounded-3xl bg-rose-950/60 border-2 border-rose-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-600 animate-ping">
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          </div>
          <div>
            <h3 className="text-base font-headline font-black text-white uppercase tracking-wider">
              Ruang Resusitasi Gawat Darurat (AHA ACLS Mode)
            </h3>
            <p className="text-xs text-rose-300">Pencatatan tindakan seketika & pemantauan ritme henti jantung.</p>
          </div>
        </div>

        <button
          onClick={handleCodeBlue}
          className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
          <span>Aktivasi Code Blue</span>
        </button>
      </div>

      {/* ─── Quick ACLS Action Bar ─── */}
      <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">Tombol Tindakan Resusitasi Cepat:</h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => handleAction('CPR_CYCLE', `Siklus ${cprCycle} (2 Menit 100-120x/menit)`)}
            className="p-4 rounded-2xl bg-surface-container border border-rose-500/40 hover:bg-rose-500/10 text-center space-y-1 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-rose-600 text-[28px]">cardiology</span>
            <span className="text-xs font-black block text-on-surface">CPR Siklus #{cprCycle}</span>
            <span className="text-[10px] text-on-surface-variant font-mono">2 Menit</span>
          </button>

          <button
            onClick={() => handleAction('DEFIBRILLATION', defibJoules)}
            className="p-4 rounded-2xl bg-surface-container border border-amber-500/40 hover:bg-amber-500/10 text-center space-y-1 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-amber-500 text-[28px]">electric_bolt</span>
            <span className="text-xs font-black block text-on-surface">Defibrilasi Shock</span>
            <span className="text-[10px] text-on-surface-variant font-mono">{defibJoules}</span>
          </button>

          <button
            onClick={() => handleAction('EPINEPHRINE_DOSE', epiDose)}
            className="p-4 rounded-2xl bg-surface-container border border-purple-500/40 hover:bg-purple-500/10 text-center space-y-1 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-purple-500 text-[28px]">vaccines</span>
            <span className="text-xs font-black block text-on-surface">Epinefrin 1 mg</span>
            <span className="text-[10px] text-on-surface-variant font-mono">IV Push (Q3-5m)</span>
          </button>

          <button
            onClick={() => handleAction('AIRWAY_INTUBATION', 'ETT No. 7.5 Depth 21cm')}
            className="p-4 rounded-2xl bg-surface-container border border-teal-500/40 hover:bg-teal-500/10 text-center space-y-1 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-teal-500 text-[28px]">air</span>
            <span className="text-xs font-black block text-on-surface">Intubasi ETT</span>
            <span className="text-[10px] text-on-surface-variant font-mono">ETT 7.5 / 21cm</span>
          </button>

          <button
            onClick={() => handleAction('FLUID_BOLUS', 'RL 1000 ml Rapid Bolus')}
            className="p-4 rounded-2xl bg-surface-container border border-blue-500/40 hover:bg-blue-500/10 text-center space-y-1 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-blue-500 text-[28px]">water_drop</span>
            <span className="text-xs font-black block text-on-surface">Bolus Cairan RL</span>
            <span className="text-[10px] text-on-surface-variant font-mono">1000 ml IV</span>
          </button>

          <button
            onClick={() => handleAction('ROSC_ACHIEVED', 'Nadi karotis teraba, SpO2 96%')}
            className="p-4 rounded-2xl bg-emerald-600 text-white text-center space-y-1 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-white text-[28px]">favorite</span>
            <span className="text-xs font-black block">ROSC Tercapai</span>
            <span className="text-[10px] text-emerald-100 font-mono">Post-Cardiac Care</span>
          </button>
        </div>
      </div>

      {/* ─── Resuscitation Action Timeline ─── */}
      <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
        <h4 className="text-xs font-bold text-on-surface uppercase">Timeline Log Resusitasi (Chronological Events):</h4>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
          {resusTimeline.length > 0 ? (
            resusTimeline.map(evt => (
              <div key={evt.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold text-rose-600 mr-2">[{evt.event_type}]</span>
                  <span className="text-on-surface font-bold">{evt.dose_or_joules}</span>
                  <p className="text-[10px] text-on-surface-variant">Oleh: {evt.performer_name}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant">{new Date(evt.event_timestamp).toLocaleTimeString('id-ID')}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-on-surface-variant text-center py-4">Belum ada tindakan resusitasi yang dicatat.</p>
          )}
        </div>
      </div>

    </div>
  );
}
