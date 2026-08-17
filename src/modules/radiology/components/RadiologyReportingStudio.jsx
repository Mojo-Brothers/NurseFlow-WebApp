import React, { useState } from 'react';
import { pacsDicomEngineService, CRITICAL_RADIOLOGY_FINDINGS } from '../services/pacsDicomEngine.service.js';
import { useNotificationStore } from '../../../core/stores/notification.store.js';
import toast from 'react-hot-toast';

export default function RadiologyReportingStudio({ activeStudy, onCriticalAlertTriggered }) {
  if (!activeStudy) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        Pilih pemeriksaan radiologi dari Modality Worklist (MWL) untuk membuka modul Ekspertise & Pelaporan Sp.Rad.
      </div>
    );
  }

  const study = activeStudy;

  const [clinicalHistory, setClinicalHistory] = useState(study.clinicalHistory || '');
  const [technique, setTechnique] = useState(study.technique || 'Proyeksi standar, kondisi memadai.');
  const [findings, setFindings] = useState(study.findings || '');
  const [impression, setImpression] = useState(study.impression || '');
  const [radsClassification, setRadsClassification] = useState('NONE');
  const [isUrgentCritical, setIsUrgentCritical] = useState(false);
  const [criticalFindingKey, setCriticalFindingKey] = useState('TENSION_PNEUMOTHORAX');
  const [radiologistName, setRadiologistName] = useState('dr. Hendro Prasetyo, Sp.Rad(K)');
  const [isSigned, setIsSigned] = useState(false);

  const handleSignAndRelease = (e) => {
    e.preventDefault();
    try {
      const report = pacsDicomEngineService.createRadiologyReport({
        studyInstanceUid: study.studyInstanceUid,
        radiologistName,
        clinicalHistory,
        techniqueDescription: technique,
        findings,
        impression,
        radsClassification,
        isUrgentCritical,
        criticalFindingKey: isUrgentCritical ? criticalFindingKey : null
      });

      setIsSigned(true);
      toast.success(`Ekspertise Radiologi ${study.accessionNumber} Berhasil Ditandatangani Secara Digital oleh ${radiologistName}!`);

      if (isUrgentCritical) {
        const threatDesc = CRITICAL_RADIOLOGY_FINDINGS[criticalFindingKey]?.threat || 'Kondisi gawat darurat radiologis';
        useNotificationStore.getState().addNotification({
          type: 'CRITICAL_PANIC_VALUE',
          category: 'RADIOLOGY',
          severity: 'CRITICAL',
          title: `🚨 TEMUAN KRITIS RADIOLOGI: ${CRITICAL_RADIOLOGY_FINDINGS[criticalFindingKey]?.name}`,
          message: `Pasien ${study.patientName} (${study.patientMrn}): ${threatDesc}!`,
          patientId: study.patientId || null,
          patientName: study.patientName,
          mrn: study.patientMrn
        });

        if (onCriticalAlertTriggered) {
          onCriticalAlertTriggered({
            alertId: report.alertId,
            study,
            criticalKey: criticalFindingKey,
            findingName: CRITICAL_RADIOLOGY_FINDINGS[criticalFindingKey]?.name,
            threat: threatDesc
          });
        }
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSignAndRelease} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">description</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Lembar Ekspertise Radiologi Terstruktur (RIS Report)</h3>
            <p className="text-xs text-slate-400 font-mono">
              Aksesi: {study.accessionNumber} • {study.studyDescription} ({study.modality})
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 font-bold border border-blue-200 dark:border-blue-800">
          JCI MOI / AOP.6 Standard
        </span>
      </div>

      {/* Clinical History & Technique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Riwayat Klinis & Indikasi</label>
          <input
            type="text"
            value={clinicalHistory}
            onChange={(e) => setClinicalHistory(e.target.value)}
            className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Teknik Pemeriksaan (Proyeksi / Kontras)</label>
          <input
            type="text"
            value={technique}
            onChange={(e) => setTechnique(e.target.value)}
            className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium"
          />
        </div>
      </div>

      {/* Findings Text Area */}
      <div>
        <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi Temuan Radiologis (Findings)</label>
        <textarea
          rows={5}
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed"
        />
      </div>

      {/* Impression / Conclusion */}
      <div>
        <label className="font-bold text-slate-700 dark:text-slate-300">Kesimpulan / Kesan (Impression)</label>
        <textarea
          rows={2}
          value={impression}
          onChange={(e) => setImpression(e.target.value)}
          className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
        />
      </div>

      {/* RADS & Urgent Critical Toggle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Klasifikasi Terstandar (RADS)</label>
          <select
            value={radsClassification}
            onChange={(e) => setRadsClassification(e.target.value)}
            className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-bold"
          >
            <option value="NONE">Tidak Menggunakan Skoring RADS</option>
            <option value="BI-RADS 1">BI-RADS 1: Negatif</option>
            <option value="BI-RADS 2">BI-RADS 2: Temuan Jinak</option>
            <option value="BI-RADS 4">BI-RADS 4: Curiga Malignansi (Biopsi Diperlukan)</option>
            <option value="Lung-RADS 1">Lung-RADS 1: Negatif</option>
            <option value="Lung-RADS 4">Lung-RADS 4: Sangat Curiga Keganasan Paru</option>
          </select>
        </div>

        {/* Critical Urgent Toggle */}
        <div>
          <div className="flex items-center justify-between">
            <label className="font-bold text-rose-600 dark:text-rose-400">Temuan Kritis Gawat Darurat (JCI IPSG 2)</label>
            <input
              type="checkbox"
              checked={isUrgentCritical}
              onChange={(e) => setIsUrgentCritical(e.target.checked)}
              className="w-4 h-4 accent-rose-600 cursor-pointer"
            />
          </div>

          {isUrgentCritical && (
            <select
              value={criticalFindingKey}
              onChange={(e) => setCriticalFindingKey(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-400 text-rose-700 dark:text-rose-200 font-bold"
            >
              {Object.entries(CRITICAL_RADIOLOGY_FINDINGS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Radiologist Digital Signature */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-700 dark:text-slate-300">Dokter Spesialis Radiologi (Sp.Rad):</label>
          <input
            type="text"
            value={radiologistName}
            onChange={(e) => setRadiologistName(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Sahkan & Rilis Ekspertise ke Rekam Medis (EMR)
        </button>
      </div>
    </form>
  );
}
