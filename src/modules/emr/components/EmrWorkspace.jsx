import React, { useState, useEffect } from 'react';
import { useEmrStore } from '../store/emr.store.js';
import SoapWorkspace from './SoapWorkspace.jsx';
import CpptWorkspace from './CPPTWorkspace.jsx';
import AllergyWorkspace from './AllergyWorkspace.jsx';
import DiagnosisWorkspace from './DiagnosisWorkspace.jsx';
import ClinicalObservationWorkspace from './ClinicalObservationWorkspace.jsx';
import CdssAlertCenter from './CdssAlertCenter.jsx';
import LongitudinalTimeline from './LongitudinalTimeline.jsx';
import CarePlanWorkspace from './CarePlanWorkspace.jsx';

export default function EmrWorkspace() {
  const {
    fetchEmrData,
    allergies,
    cdssAlerts,
    selectedPatientId
  } = useEmrStore();

  const [activeTab, setActiveTab] = useState('SOAP'); // 'SOAP' | 'CPPT' | 'ALLERGY' | 'DIAGNOSIS' | 'OBSERVATION' | 'CARE_PLAN' | 'CDSS' | 'TIMELINE'

  useEffect(() => {
    fetchEmrData(selectedPatientId);
  }, [fetchEmrData, selectedPatientId]);

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Top Patient Header Bar ─── */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
              SPRINT 4 &bull; RAWAT JALAN & CORE EMR
            </span>
            <span className="text-slate-400 text-xs font-mono">SATUSEHAT HL7 FHIR R4 & JCI 7th Edition</span>
          </div>
          <h2 className="text-xl font-headline font-black tracking-tight text-white flex items-center gap-2">
            <span>Ny. Siti Nurhaliza, S.Pd</span>
            <span className="text-xs font-mono text-teal-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              MRN-2026-001001
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            NIK: <span className="font-mono text-slate-200">3171055508890001</span> &bull; DPJP: <span className="text-teal-300 font-bold">dr. Siti Wijaya, Sp.PD-KGEH</span> &bull; Episode: <span className="font-mono text-slate-200">EOC-2026-001</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-right">
            <span className="text-[10px] font-bold text-rose-300 uppercase block">Alergi JCI</span>
            <span className="text-sm font-mono font-black text-rose-400">{allergies.length} Tercatat</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-right">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">CDSS Alerts</span>
            <span className="text-sm font-mono font-black text-amber-400">{cdssAlerts.length} Warnings</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('SOAP')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'SOAP' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">stethoscope</span>
          <span>1. SOAP Dokter DPJP</span>
        </button>

        <button
          onClick={() => setActiveTab('CPPT')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'CPPT' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
          <span>2. CPPT Multidisiplin</span>
        </button>

        <button
          onClick={() => setActiveTab('ALLERGY')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ALLERGY' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>3. Alergi JCI ({allergies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DIAGNOSIS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'DIAGNOSIS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">coronavirus</span>
          <span>4. Diagnosis ICD-10</span>
        </button>

        <button
          onClick={() => setActiveTab('OBSERVATION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'OBSERVATION' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
          <span>5. Observasi LOINC</span>
        </button>

        <button
          onClick={() => setActiveTab('CARE_PLAN')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'CARE_PLAN' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">assignment</span>
          <span>6. Rencana Asuhan (Care Plan)</span>
        </button>

        <button
          onClick={() => setActiveTab('CDSS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'CDSS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>7. CDSS Decision Support</span>
        </button>

        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'TIMELINE' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timeline</span>
          <span>8. Rekam Medis Longitudinal</span>
        </button>
      </div>

      {/* ─── Active Tab Content ─── */}
      {activeTab === 'SOAP' && <SoapWorkspace />}
      {activeTab === 'CPPT' && <CpptWorkspace />}
      {activeTab === 'ALLERGY' && <AllergyWorkspace />}
      {activeTab === 'DIAGNOSIS' && <DiagnosisWorkspace />}
      {activeTab === 'OBSERVATION' && <ClinicalObservationWorkspace />}
      {activeTab === 'CARE_PLAN' && <CarePlanWorkspace />}
      {activeTab === 'CDSS' && <CdssAlertCenter />}
      {activeTab === 'TIMELINE' && <LongitudinalTimeline />}

    </div>
  );
}
