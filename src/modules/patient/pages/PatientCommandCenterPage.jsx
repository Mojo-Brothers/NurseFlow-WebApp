import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import GlobalPatientSearch from '../components/GlobalPatientSearch.jsx';
import PatientIdentityCard from '../components/PatientIdentityCard.jsx';
import PatientJourneyTimeline from '../components/PatientJourneyTimeline.jsx';
import PatientRegistrationWithEmpiModal from '../components/PatientRegistrationWithEmpiModal.jsx';
import EmergencyUnknownPatientModal from '../components/EmergencyUnknownPatientModal.jsx';
import EncounterWorkspaceModal from '../../encounter/components/EncounterWorkspaceModal.jsx';

export default function PatientCommandCenterPage() {
  const { patients, fetchPatients } = usePatientStore();
  const { activePatientId, liveContext } = useEncounterStore();

  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isEncounterModalOpen, setIsEncounterModalOpen] = useState(false);
  const [reconcileTargetPatient, setReconcileTargetPatient] = useState(null);
  const [targetEncounterPatient, setTargetEncounterPatient] = useState(null);

  const { setLiveContext } = useEncounterStore();

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. Page Header with Title and Single-Location Primary CTAs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/30">
            <span className="material-symbols-outlined text-[26px]">groups</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Patient Master Index (EMPI) & Journey Center
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                SATUSEHAT READY
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Satu Pasien • Satu Rekam Medis (Permenkes No. 24/2022 & Standar JCI IPSG 1)
            </p>
          </div>
        </div>

        {/* Primary Action Buttons (Unified in Header, No Duplicate in Search Toolbar) */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
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
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Registrasi Pasien Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Main Two-Column Responsive Grid Layout (5:7 ratio, no overlapping) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Global Search & EMPI Directory (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full">
          <GlobalPatientSearch
            onSelectPatient={() => {}}
            onNewEncounter={handleOpenNewEncounter}
            onOpenRegistration={() => setIsRegModalOpen(true)}
            onOpenEmergency={() => { setReconcileTargetPatient(null); setIsEmergencyModalOpen(true); }}
          />
        </div>

        {/* Right Column: Identity Card & Journey Timeline (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          <PatientIdentityCard
            patient={activePatient}
            onOpenNewEncounter={handleOpenNewEncounter}
            onOpenReconciliation={handleOpenReconciliation}
          />

          <PatientJourneyTimeline
            patient={activePatient}
            encounter={liveContext}
          />
        </div>
      </div>

      {/* Modals */}
      <PatientRegistrationWithEmpiModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onRegistered={(newPatient) => {
          fetchPatients();
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
