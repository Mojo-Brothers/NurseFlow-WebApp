import React, { useState, useEffect } from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';
import TriageAssessmentWorkspace from './TriageAssessmentWorkspace.jsx';
import SlaTimerDashboard from './SlaTimerDashboard.jsx';
import ResuscitationWorkspace from './ResuscitationWorkspace.jsx';
import EmergencyProtocolModal from './EmergencyProtocolModal.jsx';
import EmergencyPatientTracker from './EmergencyPatientTracker.jsx';

export default function EmergencyWorkspace() {
  const {
    triageRecords,
    slaTimers,
    pmkpStats,
    fetchEmergencyData,
    triggerEmergencyAlert
  } = useEmergencyStore();

  const [activeTab, setActiveTab] = useState('TRACKER'); // 'TRACKER' | 'TRIAGE_FORM' | 'SLA_TIMERS' | 'RESUSCITATION'
  const [selectedProtoPatient, setSelectedProtoPatient] = useState(null);
  const [activeResusEncounter, setActiveResusEncounter] = useState('ENC-2026-001');

  useEffect(() => {
    fetchEmergencyData();
  }, [fetchEmergencyData]);

  const p1Count = triageRecords.filter(t => t.triage_level === 'P1_RESUSCITATION').length;
  const p2Count = triageRecords.filter(t => t.triage_level === 'P2_EMERGENT').length;

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Top Command Center Banner ─── */}
      <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[11px] font-bold border border-rose-500/30">
              SPRINT 3 &bull; EMERGENCY & TRIAGE ATS/ESI
            </span>
            <span className="text-slate-400 text-xs font-mono">WHO Emergency Care Framework & JCI 7th Edition</span>
          </div>
          <h2 className="text-xl font-headline font-black tracking-tight text-white">
            Pusat Komando Instalasi Gawat Darurat (IGD)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Prinsip: <span className="text-rose-400 font-bold">"Emergency First, Documentation Later"</span> &bull; Triase Cepat &rarr; SLA Stopwatch &rarr; 1-Klik Fast Track Order &rarr; Resusitasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-right">
            <span className="text-[10px] font-bold text-rose-300 uppercase block">Kritis P1 (Merah)</span>
            <span className="text-sm font-mono font-black text-rose-400">{p1Count} Pasien</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-right">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">Emergensi P2 (Oranye)</span>
            <span className="text-sm font-mono font-black text-amber-400">{p2Count} Pasien</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">PMKP Waktu Tanggap</span>
            <span className="text-sm font-mono font-black text-teal-400">{pmkpStats.compliancePercent}%</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('TRACKER')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'TRACKER' ? 'bg-rose-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          <span>1. Pelacak Pasien IGD ({triageRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRIAGE_FORM')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'TRIAGE_FORM' ? 'bg-rose-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
          <span>2. Form Triase ATS / ESI</span>
        </button>

        <button
          onClick={() => setActiveTab('SLA_TIMERS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'SLA_TIMERS' ? 'bg-rose-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timer</span>
          <span>3. Live Stopwatch SLA & PMKP ({slaTimers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RESUSCITATION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'RESUSCITATION' ? 'bg-rose-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cardiology</span>
          <span>4. Resusitasi & Code Blue</span>
        </button>
      </div>

      {/* ─── Active Tab Content ─── */}
      {activeTab === 'TRACKER' && (
        <EmergencyPatientTracker
          onOpenProtocol={(patient) => setSelectedProtoPatient(patient)}
          onOpenResus={(encId) => {
            setActiveResusEncounter(encId);
            setActiveTab('RESUSCITATION');
          }}
        />
      )}

      {activeTab === 'TRIAGE_FORM' && (
        <TriageAssessmentWorkspace
          onTriageSaved={() => setActiveTab('TRACKER')}
        />
      )}

      {activeTab === 'SLA_TIMERS' && <SlaTimerDashboard />}

      {activeTab === 'RESUSCITATION' && (
        <ResuscitationWorkspace encounterId={activeResusEncounter} />
      )}

      {/* ─── Fast-Track Protocol Modal ─── */}
      {selectedProtoPatient && (
        <EmergencyProtocolModal
          patient={selectedProtoPatient}
          onClose={() => setSelectedProtoPatient(null)}
        />
      )}

    </div>
  );
}
