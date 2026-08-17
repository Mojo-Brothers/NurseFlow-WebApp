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
    setIsEncounterModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/30">
            <span className="material-symbols-outlined text-[26px]">groups</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Patient Master Index (EMPI) & Journey Center
            </h1>
            <p className="text-xs text-slate-500">
              Satu Pasien • Satu Rekam Medis (Permenkes No. 24/2022 & Standar JCI IPSG 1)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setReconcileTargetPatient(null); setIsEmergencyModalOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">emergency</span>
            <span>+ Pasien Darurat Anonim</span>
          </button>

          <button
            onClick={() => setIsRegModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Registrasi Pasien Baru</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Global Search & Directory (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <GlobalPatientSearch
            onSelectPatient={() => {}}
            onNewEncounter={handleOpenNewEncounter}
            onOpenRegistration={() => setIsRegModalOpen(true)}
            onOpenEmergency={() => { setReconcileTargetPatient(null); setIsEmergencyModalOpen(true); }}
          />
        </div>

        {/* Right Column: Identity Card & Journey Timeline (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
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
        onClose={() => setIsEncounterModalOpen(false)}
        patient={activePatient}
        onCreated={() => {
          fetchPatients();
        }}
      />
    </div>
  );
}
