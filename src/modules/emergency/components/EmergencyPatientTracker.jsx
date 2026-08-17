import React from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';

export default function EmergencyPatientTracker({ onOpenProtocol, onOpenResus }) {
  const { triageRecords, decideDisposition } = useEmergencyStore();

  const handleDispo = async (encounterId, episodeId, type) => {
    await decideDisposition({
      encounterId,
      episodeId,
      dispositionType: type,
      destinationWardName: type === 'ADMIT_ICU' ? 'ICU Bedah / Medis' : 'Bangsal Rawat Inap Teratai'
    });
    alert(`Disposisi ${type} berhasil dikonfirmasi.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Pelacak Pasien Gawat Darurat & Disposisi (IGD Bed Matrix)
        </h4>
        <span className="text-xs text-on-surface-variant font-mono">{triageRecords.length} Pasien Terdata</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {triageRecords.map(trg => {
          const isRed = trg.triage_level === 'P1_RESUSCITATION';
          const isOrange = trg.triage_level === 'P2_EMERGENT';

          return (
            <div
              key={trg.id}
              className={`p-5 rounded-3xl border transition-all ${
                isRed
                  ? 'bg-rose-500/10 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                  : isOrange
                  ? 'bg-amber-500/10 border-amber-500 shadow-md'
                  : 'bg-surface-container-high border-outline-variant/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${isRed ? 'bg-rose-600 text-white' : isOrange ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {trg.triage_level} &bull; ATS {trg.ats_level}
                  </span>
                  <h4 className="text-base font-black text-on-surface mt-1.5">{trg.patient_name}</h4>
                  <p className="text-xs text-on-surface-variant font-mono">MRN: {trg.mrn} &bull; Encounter: {trg.encounter_id}</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-on-surface-variant text-[10px] block">Target SLA</span>
                  <strong className={isRed ? 'text-rose-600 font-black' : 'text-teal-600'}>{trg.target_response_minutes} Menit</strong>
                </div>
              </div>

              <p className="text-xs text-on-surface my-2 p-2 rounded-xl bg-surface-container border border-outline-variant/20">
                <strong>Keluhan:</strong> {trg.chief_complaint}
              </p>

              <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center mb-3">
                <div className="p-1 rounded bg-surface-container border">TD: {trg.vitals.bloodPressureSystolic}/{trg.vitals.bloodPressureDiastolic}</div>
                <div className="p-1 rounded bg-surface-container border">HR: {trg.vitals.heartRate}</div>
                <div className="p-1 rounded bg-surface-container border">SpO2: {trg.vitals.spo2}%</div>
                <div className="p-1 rounded bg-surface-container border">GCS: {trg.vitals.gcsTotal}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/20">
                <button
                  onClick={() => onOpenProtocol(trg)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Protokol Fast-Track</span>
                </button>

                {isRed && (
                  <button
                    onClick={() => onOpenResus(trg.encounter_id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-rose-400 border border-rose-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cardiology</span>
                    <span>Resusitasi</span>
                  </button>
                )}

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={() => handleDispo(trg.encounter_id, trg.episode_id, 'ADMIT_WARD')}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-highest border text-on-surface text-[11px] font-bold cursor-pointer"
                  >
                    Admisi Ranap
                  </button>
                  <button
                    onClick={() => handleDispo(trg.encounter_id, trg.episode_id, 'ADMIT_ICU')}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-highest border text-rose-600 font-bold text-[11px] cursor-pointer"
                  >
                    Pindah ICU
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
