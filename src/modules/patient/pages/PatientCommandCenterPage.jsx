import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import PatientIdentityCard from '../components/PatientIdentityCard.jsx';
import PatientJourneyTimeline from '../components/PatientJourneyTimeline.jsx';
import PatientRegistrationWithEmpiModal from '../components/PatientRegistrationWithEmpiModal.jsx';
import EmergencyUnknownPatientModal from '../components/EmergencyUnknownPatientModal.jsx';
import EncounterWorkspaceModal from '../../encounter/components/EncounterWorkspaceModal.jsx';
import GlobalPatientSearchModal from '../../../components/common/GlobalPatientSearchModal.jsx';

export default function PatientCommandCenterPage() {
  const { patients, fetchPatients } = usePatientStore();
  const { activePatientId, liveContext, setLiveContext } = useEncounterStore();

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [reconcileTargetPatient, setReconcileTargetPatient] = useState(null);
  const [targetEncounterPatient, setTargetEncounterPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Find currently active patient from global context
  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || patients[0] || null;

  const handleOpenReconciliation = (anonPatient) => {
    setReconcileTargetPatient(anonPatient);
    setIsEmergencyModalOpen(true);
  };

  const handleOpenNewEncounter = (patient) => {
    const target = patient || activePatient;
    if (target) {
      setTargetEncounterPatient(target);
      setLiveContext(target.id || target.mrn, null);
      setIsEncounterModalOpen(true);
    }
  };

  const handleSelectPatientFromSearch = (selectedPt) => {
    if (selectedPt) {
      setLiveContext(selectedPt.id || selectedPt.mrn, selectedPt.encounterId);
    }
    setIsSearchModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Page Header with Title and Single-Location Primary CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
            <span className="material-symbols-outlined text-[26px]">groups</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Patient Master Index (EMPI) & Journey Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                SATUSEHAT READY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Satu Pasien • Satu Rekam Medis (Permenkes No. 24/2022 & Standar JCI IPSG 1)
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
            title="Buka Pencarian Global (Ctrl+K)"
          >
            <span className="material-symbols-outlined text-[18px] text-blue-500">search</span>
            <span>Cari Pasien (Ctrl+K)</span>
          </button>

          <button
            type="button"
            onClick={() => { setReconcileTargetPatient(null); setIsEmergencyModalOpen(true); }}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Daftarkan Pasien Darurat Anonim (Mr./Mrs. X) Cito"
          >
            <span className="material-symbols-outlined text-[18px] text-rose-600 animate-pulse">emergency</span>
            <span>+ Pasien Darurat Anonim</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRegModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#015C80] hover:bg-[#014966] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#015C80]/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Registrasi Pasien Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Full-Width Wide Patient Workstation Header Card */}
      <PatientIdentityCard
        patient={activePatient}
        onOpenNewEncounter={handleOpenNewEncounter}
        onOpenReconciliation={handleOpenReconciliation}
        onOpenGlobalSearch={() => setIsSearchModalOpen(true)}
      />

      {/* 3. Full-Width Patient Journey Timeline */}
      <div className="w-full">
        <PatientJourneyTimeline
          patient={activePatient}
          encounter={liveContext}
        />
      </div>

      {/* Modals */}
      <GlobalPatientSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectPatient={handleSelectPatientFromSearch}
      />

      <PatientRegistrationWithEmpiModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onRegistered={(newPatient) => {
          fetchPatients();
          if (newPatient) {
            setLiveContext(newPatient.id, null);
          }
        }}
      />

      <EmergencyUnknownPatientModal
        isOpen={isEmergencyModalOpen}
        onClose={() => { setIsEmergencyModalOpen(false); setReconcileTargetPatient(null); }}
        targetPatientToReconcile={reconcileTargetPatient}
        onCreated={() => {
          fetchPatients();
        }}
      />

      <EncounterWorkspaceModal
        isOpen={isEncounterModalOpen}
        onClose={() => {
          setIsEncounterModalOpen(false);
          setTargetEncounterPatient(null);
        }}
        patient={targetEncounterPatient || activePatient}
        onCreated={() => {
          fetchPatients();
        }}
      />
    </div>
  );
}
