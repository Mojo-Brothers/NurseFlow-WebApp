import React, { useState } from 'react';
import { pacsDicomEngineService, DICOM_MODALITIES } from '../services/pacsDicomEngine.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function ModalityWorklistStudio({ onSelectStudy, activeStudyUid }) {
  const [selectedModality, setSelectedModality] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [studies, setStudies] = useState(pacsDicomEngineService.queryStudies());
  const { selectedPatient, patients } = usePatientStore();
  const currentPatient = selectedPatient || patients[0] || null;

  const filteredStudies = studies.filter(s => {
    const matchesModality = selectedModality === 'ALL' || s.modality === selectedModality;
    const matchesSearch = s.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.patientMrn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.accessionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.studyDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModality && matchesSearch;
  });

  const handleSimulateNewAcquisition = () => {
    if (!currentPatient) {
      toast.error('Pilih atau daftarkan pasien aktif terlebih dahulu di sistem!');
      return;
    }
    const randomUid = `1.2.840.113619.2.2026.${Date.now().toString().slice(-6)}`;
    const newStudy = pacsDicomEngineService.storeDicomStudy({
      studyInstanceUid: randomUid,
      accessionNumber: `ACC-2026-${Date.now().toString().slice(-4)}`,
      orderId: `ORD-RAD-${Date.now()}`,
      encounterId: currentPatient.encounterId || `ENC-${Date.now()}`,
      patientId: currentPatient.id || `P-${Date.now()}`,
      patientMrn: currentPatient.mrn || 'MRN-NEW',
      patientName: currentPatient.name || currentPatient.full_name || 'Pasien Aktif',
      modality: 'DX',
      bodyPart: 'EXTREMITY',
      studyDescription: 'X-Ray Genu Dextra AP/Lateral (Pemeriksaan Radiologi)',
      studyDate: new Date().toISOString().slice(0, 10),
      studyTime: new Date().toLocaleTimeString('id-ID'),
      referringDoctor: 'dr. Budi Santoso, Sp.B',
      technologist: 'Radiografer Agus, S.Tr.Rad',
      series: [
        {
          seriesNumber: 1,
          modality: 'DX',
          description: 'Genu Dextra AP View',
          instances: [{ windowCenter: 300, windowWidth: 1500 }]
        }
      ]
    });

    setStudies(pacsDicomEngineService.queryStudies());
    toast.success(`Citra DICOM Baru [${newStudy.accessionNumber}] Berhasil Diterima dari Modalitas DX (STOW-RS)!`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header & New Study Simulator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">radiology</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Modality Worklist (MWL) & Arsip PACS (QIDO-RS)</h3>
            <p className="text-xs text-slate-400">Daftar pemeriksaan radiologi aktif dari modalitas CR, CT, MRI, dan USG</p>
          </div>
        </div>

        <button
          onClick={handleSimulateNewAcquisition}
          className="px-4 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
          Simulasi Penerimaan Citra (STOW-RS)
        </button>
      </div>

      {/* Modality Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          {['ALL', 'CR', 'DX', 'CT', 'MR', 'US'].map(mod => (
            <button
              key={mod}
              onClick={() => setSelectedModality(mod)}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                selectedModality === mod
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mod === 'ALL' ? 'Semua Modalitas' : mod}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari No. RM, Nama, No. Aksesi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Study List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
        {filteredStudies.map(study => {
          const isSelected = study.studyInstanceUid === activeStudyUid;
          return (
            <div
              key={study.studyInstanceUid}
              onClick={() => onSelectStudy && onSelectStudy(study)}
              className={`py-3.5 px-3 rounded-2xl transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-teal-50/70 dark:bg-teal-950/40 border border-teal-500/40 ring-1 ring-teal-500/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-black text-teal-600 dark:text-teal-400 text-xs">
                  {study.modality}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{study.studyDescription}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500 font-bold">{study.accessionNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Pasien: <span className="font-bold text-slate-700 dark:text-slate-300">{study.patientName}</span> ({study.patientMrn}) • DPJP: {study.referringDoctor}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  study.status === 'REPORTED'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}>
                  {study.status === 'REPORTED' ? '✓ Sudah Diekspertise' : '🕒 Menunggu Ekspertise'}
                </span>

                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  arrow_forward_ios
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
