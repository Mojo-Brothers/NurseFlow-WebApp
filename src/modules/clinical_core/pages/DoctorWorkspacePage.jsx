import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import DoctorCommandCenter from '../components/DoctorCommandCenter.jsx';
import DoctorSoapWorkspace from '../components/DoctorSoapWorkspace.jsx';

export default function DoctorWorkspacePage() {
  const { patients, fetchPatients } = usePatientStore();
  const { activePatientId, liveContext } = useEncounterStore();

  const [activeTab, setActiveTab] = useState('COMMAND_CENTER'); // 'COMMAND_CENTER' | 'SOAP_WORKSPACE'
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const activePatient = selectedPatient || patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || patients[0] || null;

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('SOAP_WORKSPACE');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Bar Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <span className="material-symbols-outlined text-[26px]">stethoscope</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Doctor Consultation & Clinical Core Workspace
            </h1>
            <p className="text-xs text-slate-500">
              Catatan Perkembangan Pasien Terintegrasi (CPPT / SOAP) • Rekam Medis Elektronik (Permenkes 24/2022)
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'COMMAND_CENTER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Antrean Pasien (Worklist)</span>
          </button>

          <button
            onClick={() => setActiveTab('SOAP_WORKSPACE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'SOAP_WORKSPACE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Konsultasi CPPT / SOAP</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'COMMAND_CENTER' ? (
        <DoctorCommandCenter
          onSelectPatientForConsultation={handleSelectPatient}
        />
      ) : (
        <DoctorSoapWorkspace
          patient={activePatient}
          encounter={liveContext}
          onSaved={() => {
            setActiveTab('COMMAND_CENTER');
          }}
        />
      )}
    </div>
  );
}
