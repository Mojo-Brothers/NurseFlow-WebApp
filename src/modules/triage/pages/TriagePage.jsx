import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { useAuthStore } from '../../auth/auth.store.js';
import toast from 'react-hot-toast';

import IgdCommandCenter from '../components/IgdCommandCenter.jsx';
import RapidTriageStudio from '../components/RapidTriageStudio.jsx';
import ResuscitationBoardModal from '../components/ResuscitationBoardModal.jsx';
import DetailedAssessment from '../components/DetailedAssessment.jsx';
import PoliTriage from '../components/PoliTriage.jsx';

import '../styles/Triage.css';

export default function TriagePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { operationalMode, setOperationalMode } = useTriageStore();
  const { user } = useAuthStore();
  const { patients, addPatient, fetchPatients } = usePatientStore();
  const { activePatientId, liveContext, openEncounter, setLiveContext } = useEncounterStore();

  const [activeTab, setActiveTab] = useState('COMMAND_CENTER'); // 'COMMAND_CENTER' | 'RAPID_INTAKE' | 'DETAILED' | 'POLI'
  const [isResusModalOpen, setIsResusModalOpen] = useState(false);
  const [resusPatient, setResusPatient] = useState(null);
  const [isCreatingEmergency, setIsCreatingEmergency] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || patients[0] || null;

  const handleCreateEmergencyPatient = async () => {
    if (isCreatingEmergency) return;
    setIsCreatingEmergency(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const uniqueCode = Math.random().toString(36).substring(2, 5).toUpperCase();

      const newPatient = await addPatient({
        name: `Mr. X (${dateStr}, ${timeStr}) - #${uniqueCode}`,
        demographics: { dob: '1985-01-01', gender: 'M' },
        mrn: `MRX-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${uniqueCode}`,
        status: 'EMERGENCY',
        payer: 'Jasa Raharja / Darurat IGD'
      }, user?.email || 'system');

      const encounterId = await openEncounter({
        patientId: newPatient.id,
        encounterType: 'emergency',
        chiefComplaint: 'Pasien darurat tidak sadar (Trauma / Cito)',
        status: 'TRIAGE_PENDING',
        primaryState: 'TRIAGE_PENDING',
        triageStatus: 'PENDING',
        department: 'IGD',
        departmentId: 'DEPT-IGD',
        departmentName: 'Instalasi Gawat Darurat (IGD)'
      }, user?.email || 'system');

      setLiveContext(newPatient.id, encounterId, 'TRIAGE_PENDING');
      setActiveTab('RAPID_INTAKE');
      toast.success(`🚨 Pasien Darurat ${newPatient.name} dibuat! Langsung masuk form triase cepat.`);
    } catch (error) {
      toast.error(`Gagal membuat pasien darurat: ${error.message}`);
    } finally {
      setIsCreatingEmergency(false);
    }
  };

  const handleTriggerCodeBlue = (patient) => {
    setResusPatient(patient || activePatient);
    setIsResusModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header & Modes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/30">
            <span className="material-symbols-outlined text-[26px]">emergency</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Instalasi Gawat Darurat (IGD) & Triase Klinis
            </h1>
            <p className="text-xs text-slate-500">
              Protokol Emergency Severity Index (ESI v4) & Monitoring Waktu Tanggap (KARS PMKP)
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'COMMAND_CENTER', label: 'IGD Command Center', icon: 'dashboard' },
            { id: 'RAPID_INTAKE', label: 'Rapid ESI Intake', icon: 'bolt' },
            { id: 'DETAILED', label: 'Asesmen Sekunder', icon: 'assignment' },
            { id: 'POLI', label: 'Skrining Rawat Jalan', icon: 'medical_services' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Command Center */}
      {activeTab === 'COMMAND_CENTER' && (
        <IgdCommandCenter
          onStartRapidTriage={() => setActiveTab('RAPID_INTAKE')}
          onOpenResuscitation={() => handleTriggerCodeBlue(activePatient)}
          onSelectPatient={(p) => {}}
        />
      )}

      {/* Tab 2: Rapid ESI Intake */}
      {activeTab === 'RAPID_INTAKE' && (
        <RapidTriageStudio
          onTriageCompleted={(record) => {
            setActiveTab('COMMAND_CENTER');
          }}
          onTriggerCodeBlue={handleTriggerCodeBlue}
        />
      )}

      {/* Tab 3: Detailed Secondary Assessment */}
      {activeTab === 'DETAILED' && (
        <DetailedAssessment />
      )}

      {/* Tab 4: Poli Triage */}
      {activeTab === 'POLI' && (
        <PoliTriage />
      )}

      {/* Resuscitation Modal */}
      <ResuscitationBoardModal
        isOpen={isResusModalOpen}
        onClose={() => setIsResusModalOpen(false)}
        patient={resusPatient || activePatient}
        encounterId={liveContext?.encounterId}
      />
    </div>
  );
}
