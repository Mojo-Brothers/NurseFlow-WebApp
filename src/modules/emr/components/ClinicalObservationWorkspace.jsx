import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';
import { LOINC_CODES } from '../services/observationEngine.service.js';

export default function ClinicalObservationWorkspace() {
  const { observations, recordObservation, selectedPatientId } = useEmrStore();

  const [selectedLoincKey, setSelectedLoincKey] = useState('BP_SYSTOLIC');
  const [obsValue, setObsValue] = useState('120');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loinc = LOINC_CODES[selectedLoincKey];

    try {
      await recordObservation({
        encounterId: 'ENC-2026-001',
        episodeId: 'EOC-2026-001',
        patientId: selectedPatientId,
        observationType: 'VITAL_SIGN',
        loincCode: loinc.code,
        loincDisplay: loinc.display,
        observationValue: obsValue,
        unit: loinc.unit,
        interpretation: 'NORMAL'
      });
      alert(`Observasi ${loinc.display} (${obsValue} ${loinc.unit}) berhasil dicatat dengan kode LOINC ${loinc.code}.`);
    } catch (err) {
      alert(`Gagal Mencatat Observasi: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Input Observasi LOINC ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-teal-600">monitor_heart</span>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Input Observasi Klinis (LOINC Mapped)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Parameter Klinis (LOINC)</label>
            <select
              value={selectedLoincKey}
              onChange={(e) => setSelectedLoincKey(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              {Object.entries(LOINC_CODES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.display} ({val.code}) — {val.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nilai Observasi *</label>
            <input
              type="text"
              value={obsValue}
              onChange={(e) => setObsValue(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono font-bold text-on-surface"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_chart</span>
            <span>Simpan Observasi & Sinkronisasi SATUSEHAT</span>
          </button>
        </form>
      </div>

      {/* ─── Daftar Observasi LOINC ─── */}
      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Riwayat Observasi Klinis Pasien ({observations.length})
        </h4>

        <div className="space-y-2.5">
          {observations.map(obs => (
            <div key={obs.id} className="p-3.5 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                  LOINC: {obs.loinc_code}
                </span>
                <h4 className="text-sm font-black text-on-surface mt-1">{obs.loinc_display}</h4>
                <p className="text-[10px] text-on-surface-variant">Observer: {obs.observer_name}</p>
              </div>

              <div className="text-right">
                <span className="text-base font-black font-mono text-teal-600">{obs.observation_value} {obs.unit}</span>
                <span className="text-[10px] font-mono text-on-surface-variant block">
                  {new Date(obs.observed_at).toLocaleTimeString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
