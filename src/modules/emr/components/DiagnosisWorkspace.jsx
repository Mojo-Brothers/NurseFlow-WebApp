import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';
import { ICD10_CATALOG } from '../services/diagnosisEngine.service.js';

export default function DiagnosisWorkspace() {
  const { diagnoses, recordDiagnosis, selectedPatientId } = useEmrStore();

  const [selectedIcd, setSelectedIcd] = useState(ICD10_CATALOG[0]);
  const [dxType, setDxType] = useState('PRIMARY');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recordDiagnosis({
        encounterId: 'ENC-2026-001',
        episodeId: 'EOC-2026-001',
        patientId: selectedPatientId,
        diagnosisType: dxType,
        icd10Code: selectedIcd.code,
        diagnosisName: selectedIcd.name,
        snomedCtCode: selectedIcd.snomed,
        isPrimary: dxType === 'PRIMARY'
      });
      alert(`Diagnosis ${selectedIcd.code} - ${selectedIcd.name} berhasil disimpan.`);
    } catch (err) {
      alert(`Gagal Menyimpan Diagnosis: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Input Diagnosis ICD-10 ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-purple-600">coronavirus</span>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Penetapan Diagnosis Klinis (ICD-10 / SNOMED CT)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tipe Diagnosis</label>
            <select
              value={dxType}
              onChange={(e) => setDxType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              <option value="PRIMARY">Diagnosis Utama (Primary Diagnosis)</option>
              <option value="SECONDARY">Diagnosis Sekunder / Komorbid</option>
              <option value="DIFFERENTIAL">Diagnosis Banding (Differential)</option>
              <option value="COMPLICATION">Komplikasi Klinis</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Pilih Kode ICD-10 & Deskripsi</label>
            <select
              value={selectedIcd.code}
              onChange={(e) => {
                const found = ICD10_CATALOG.find(d => d.code === e.target.value);
                if (found) setSelectedIcd(found);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
            >
              {ICD10_CATALOG.map(d => (
                <option key={d.code} value={d.code}>
                  [{d.code}] {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 text-xs font-mono">
            <span className="text-[10px] text-on-surface-variant block font-bold">Mapping SNOMED CT Term:</span>
            <strong className="text-purple-600">{selectedIcd.snomed} &bull; {selectedIcd.name}</strong>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-purple-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Simpan Kode Diagnosis</span>
          </button>
        </form>
      </div>

      {/* ─── Daftar Diagnosis Aktif ─── */}
      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Daftar Diagnosis Terdata ({diagnoses.length})
        </h4>

        <div className="space-y-3">
          {diagnoses.map(dx => (
            <div key={dx.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded">
                  ICD-10: {dx.icd10_code}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dx.is_primary ? 'bg-emerald-500/15 text-emerald-600' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                  {dx.diagnosis_type}
                </span>
              </div>

              <h4 className="text-sm font-black text-on-surface">{dx.diagnosis_name}</h4>
              <p className="text-[11px] text-on-surface-variant font-mono">
                SNOMED CT: {dx.snomed_ct_code || '-'} &bull; DPJP: {dx.diagnosed_by}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
