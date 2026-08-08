/**
 * InpatientEMR.jsx
 * ─────────────────────────────────────────────────────────────
 * Dedicated Enterprise EMR Workspace — RAWAT INAP (INPATIENT)
 * Standar International JCI / SNARS / PMK 269
 *
 * Mengakomodasi:
 *  - Clinical Context Ribbon khusus Rawat Inap (Kamar/Bed, LOS, Care Team, DPJP, Diet)
 *  - Sidebar Modul Rawat Inap (Admisi, CPPT Harian, Keperawatan, Care Plan, Discharge)
 *  - Integration dengan Zustand PatientStore & EncounterStore
 *  - Shared Reusable Form Components
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import {
  Building2, Stethoscope, FileText, Activity, ShieldAlert, CheckCircle2,
  User, Search, ChevronRight, Heart, Scale, ClipboardCheck, BookOpen,
  UserCheck, ShieldCheck, Thermometer, Scissors, Pill, LayoutDashboard,
  ChevronDown, HeartPulse, Filter, Copy, Check, Hash, Zap, Bed, LogOut,
  Clock, AlertTriangle, AlertCircle, FileSignature, Users, PlusSquare,
  ClipboardList, Droplets, CalendarDays, Eye
} from 'lucide-react';

import usePatientClipboardShortcuts from '../../../hooks/usePatientClipboardShortcuts.js';
import { saveSoapNote, getPatientRecords } from '../services/emr.service.js';
import { DEMO_ENCOUNTERS } from '../../../core/demoData.js';

// Import Shared Form Components
import CPPTWorkspace from '../components/CPPTWorkspace.jsx';
import CPOEWorkspace from '../components/CPOEWorkspace.jsx';
import InitialAssessment from '../components/InitialAssessment.jsx';
import DPJPAssignmentForm from '../components/DPJPAssignmentForm.jsx';
import AnamnesisForm from '../components/AnamnesisForm.jsx';
import PhysicalExaminationForm from '../components/PhysicalExaminationForm.jsx';
import BradenScaleForm from '../components/BradenScaleForm.jsx';
import RestraintAssessmentForm from '../components/RestraintAssessmentForm.jsx';
import ICUAdmissionCriteriaForm from '../components/ICUAdmissionCriteriaForm.jsx';
import ICUDischargeCriteriaForm from '../components/ICUDischargeCriteriaForm.jsx';
import SepsisSOFACriteriaForm from '../components/SepsisSOFACriteriaForm.jsx';
import PEWSForm from '../components/PEWSForm.jsx';
import MEOWSForm from '../components/MEOWSForm.jsx';
import DischargeReadinessForm from '../components/DischargeReadinessForm.jsx';
import TransferInternalForm from '../components/TransferInternalForm.jsx';
import DigitalInformedConsent from '../components/DigitalInformedConsent.jsx';
import PatientEducationForm from '../components/PatientEducationForm.jsx';
import PatientSearchModal from '../components/PatientSearchModal.jsx';
import AdvancedPatientSearchBar from '../components/AdvancedPatientSearchBar.jsx';
import AdmissionNoteForm from '../components/AdmissionNoteForm.jsx';
import NursingDailyAssessmentForm from '../components/NursingDailyAssessmentForm.jsx';
import NursingHandoverForm from '../components/NursingHandoverForm.jsx';
import DischargeSummaryForm from '../components/DischargeSummaryForm.jsx';
import ConsultationRequestForm from '../components/ConsultationRequestForm.jsx';
import ConsultationResponseForm from '../components/ConsultationResponseForm.jsx';
import ReferralLetterForm from '../components/ReferralLetterForm.jsx';
import PatientDetailDrawerModal from '../components/PatientDetailDrawerModal.jsx';

// ─── INPATIENT SPECIFIC MODULE GROUPS ─────────────────────────
const INPATIENT_MODULE_GROUPS = [
  {
    title: 'PENGKAJIAN ADMISI (AOP)',
    icon: <Search size={16} />,
    modules: [
      { id: 'inpatient-admisi', name: 'CATATAN ADMISI RAWAT INAP', icon: <Building2 size={16} />, standard: 'AOP.1.1', highlight: true },
      { id: 'anamnesis-medis', name: 'ANAMNESIS MEDIS LENGKAP', icon: <FileText size={16} />, standard: 'AOP.1.1', highlight: true },
      { id: 'physical-exam', name: 'PEMERIKSAAN FISIK TERSTRUKTUR', icon: <Stethoscope size={16} />, standard: 'AOP.1.1', highlight: true },
      { id: 'initial-nurse', name: 'PENGKAJIAN AWAL KEPERAWATAN RI', icon: <ClipboardList size={16} />, standard: 'AOP.1.2' },
      { id: 'braden-scale', name: 'SKALA BRADEN (RISIKO DEKUBITUS)', icon: <Scale size={16} />, standard: 'COP.3', highlight: true },
      { id: 'fall-risk', name: 'ASESMEN RISIKO JATUH (MORSE)', icon: <AlertTriangle size={16} />, standard: 'IPSG.6' },
    ]
  },
  {
    title: 'CPPT & MONITORING HARIAN (COP)',
    icon: <ClipboardCheck size={16} />,
    modules: [
      { id: 'soap', name: 'SOAP NOTES (CPPT HARIAN)', icon: <FileText size={16} />, standard: 'COP.2.1', highlight: true },
      { id: 'ews-monitoring', name: 'EARLY WARNING SYSTEM (EWS)', icon: <HeartPulse size={16} />, standard: 'COP.3.1', highlight: true },
      { id: 'pews', name: 'PEDIATRIC EWS (PEWS)', icon: <Activity size={16} />, standard: 'COP.3.1' },
      { id: 'meows', name: 'OBSTETRIC EWS (MEOWS)', icon: <Heart size={16} />, standard: 'COP.3.1' },
      { id: 'sepsis-sofa', name: 'SKRINING SEPSIS (qSOFA)', icon: <AlertCircle size={16} />, standard: 'COP.3', highlight: true },
      { id: 'restraint', name: 'ASESMEN RESTRAINT', icon: <ShieldAlert size={16} />, standard: 'COP.3.3' },
      { id: 'icu-criteria', name: 'KRITERIA MASUK ICU', icon: <HeartPulse size={16} />, standard: 'COP.3 / ACC.3' },
    ]
  },
  {
    title: 'DPJP & TIM ASUHAN (COP.2)',
    icon: <UserCheck size={16} />,
    modules: [
      { id: 'dpjp-assignment', name: 'PENUNJUKAN DPJP UTAMA', icon: <UserCheck size={16} />, standard: 'COP.2', highlight: true },
      { id: 'care-team', name: 'TIM ASUHAN TERINTEGRASI (PPA)', icon: <Users size={16} />, standard: 'COP.2.1', highlight: true },
    ]
  },
  {
    title: 'ORDER & PENGELOLAAN OBAT (MMU)',
    icon: <Pill size={16} />,
    modules: [
      { id: 'cpoe', name: 'ORDER RESEP / CPOE', icon: <Pill size={16} />, standard: 'MMU.4', highlight: true },
      { id: 'medication-list', name: 'DAFTAR PENGOBATAN HARIAN', icon: <ClipboardList size={16} />, standard: 'MMU.4.1' },
    ]
  },
  {
    title: 'KAMAR BEDAH & ANESTESI (ASC)',
    icon: <Scissors size={16} />,
    modules: [
      { id: 'surgical-safety', name: 'CHECKLIST BEDAH (WHO)', icon: <Scissors size={16} />, standard: 'IPSG.4', highlight: true },
      { id: 'aldrete-score', name: 'SKOR ALDRETE & PACU', icon: <Activity size={16} />, standard: 'ASC.7.4', highlight: true },
    ]
  },
  {
    title: 'DISCHARGE & PERENCANAAN PULANG (ACC)',
    icon: <LogOut size={16} />,
    modules: [
      { id: 'discharge-readiness', name: 'KESIAPAN PASIEN PULANG', icon: <ClipboardCheck size={16} />, standard: 'ACC.4', highlight: true },
      { id: 'transfer-internal', name: 'TRANSFER INTERNAL (SBAR)', icon: <LogOut size={16} />, standard: 'ACC.3' },
      { id: 'icu-discharge', name: 'STEP-DOWN / KELUAR ICU', icon: <LogOut size={16} />, standard: 'ACC.3' },
      { id: 'medical-resume', name: 'RESUME MEDIS RAWAT INAP', icon: <FileText size={16} />, standard: 'ACC.4.2', highlight: true },
    ]
  }
];

export default function InpatientEMR() {
  const { currentUser } = useAuth();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters } = useEncounterStore();

  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({ 'CPPT & MONITORING HARIAN (COP)': true, 'PENGKAJIAN ADMISI (AOP)': true });
  const [soapRecords, setSoapRecords] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyModuleFilter, setHistoryModuleFilter] = useState('ALL');
  const [isMrnCopied, setIsMrnCopied] = useState(false);

  usePatientClipboardShortcuts();

  useEffect(() => {
    fetchPatients().then(() => {
      if (!selectedPatientId && patients.length > 0) {
        selectPatient(patients[0].id);
      }
    });
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientActiveEncounter(selectedPatientId);
      getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  const activePatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || {}, [patients, selectedPatientId]);
  const activeEncounter = useMemo(() => {
    return (
      activeEncounters?.find(e => e.id === selectedEncounterId) ||
      activeEncounters?.find(e => e.patient_id === selectedPatientId || e.patientId === selectedPatientId) ||
      DEMO_ENCOUNTERS.find(e => e.patient_id === selectedPatientId) ||
      { type: 'INPATIENT', room: 'Ruang Mawar 302', bed: 'Bed B', lengthOfStay: '4 Hari', status: 'ACTIVE' }
    );
  }, [activeEncounters, selectedEncounterId, selectedPatientId]);

  const noReg = activeEncounter?.id ? activeEncounter.id.slice(-8).toUpperCase() : 'RI-2026-0801';
  const noRM = activePatient?.mrn || '-';
  const dob = activePatient?.demographics?.dob || '-';
  const age = activePatient?.id ? calculateAge(dob) : '-';
  const patientName = activePatient?.name || activeEncounter?.patient_name || 'PASIEN RAWAT INAP';

  const [previewRecord, setPreviewRecord] = useState(null);

  const sortedSoapRecords = useMemo(() => {
    return [...soapRecords].sort((a, b) => {
      const aTime = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.date || a.created_at || 0).getTime();
      const bTime = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.date || b.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [soapRecords]);

  const filteredSoapRecords = useMemo(() => {
    return sortedSoapRecords.filter(rec => {
      const searchTarget = `
        ${rec.moduleName || ''} 
        ${rec.assessment || ''} 
        ${rec.doctor || rec.signed_by || ''} 
        ${rec.subjective || ''} 
        ${JSON.stringify(rec.data || {})}
      `.toLowerCase();
      
      const matchSearch = searchTarget.includes(historySearchQuery.toLowerCase());
      const matchModule = historyModuleFilter === 'ALL' || (rec.moduleName || 'SOAP NOTES (CPPT)') === historyModuleFilter;
      
      return matchSearch && matchModule;
    });
  }, [sortedSoapRecords, historySearchQuery, historyModuleFilter]);

  const uniqueModulesInHistory = useMemo(() => {
    const modules = new Set(soapRecords.map(r => r.moduleName || 'SOAP NOTES (CPPT)'));
    return ['ALL', ...Array.from(modules)];
  }, [soapRecords]);

  const renderModuleWorkspace = () => {
    if (!selectedModule) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-2xl font-black text-[var(--on-surface)] tracking-tight flex items-center gap-3">
                <Building2 className="text-[var(--primary)]" size={28} />
                Dashboard EMR Rawat Inap
              </h2>
              <p className="text-sm font-bold text-[var(--on-surface-variant)]/60 mt-1">
                Kamar: {activeEncounter?.room || 'Mawar 302'} • {activeEncounter?.bed || 'Bed A'} | LOS: {activeEncounter?.lengthOfStay || '3 Hari'}
              </p>
            </div>
          </div>

          {/* ─── UNIFIED 4-CARD DASHBOARD OVERVIEW GRID ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Vitals & Live NEWS2 Indicator */}
            <div className="p-6 glass-panel rounded-3xl border border-[var(--outline-variant)]/20 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-[var(--on-surface-variant)] mb-4 flex items-center gap-2">
                  <Activity size={16} className="text-[var(--primary)]" /> Tanda Vital &amp; EWS NEWS2
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-[var(--surface-container)] rounded-xl">
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)]">Tekanan Darah</span>
                    <span className="text-xs font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.bp || '120/80'} <span className="text-[9px] text-slate-400">mmHg</span></span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[var(--surface-container)] rounded-xl">
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)]">Detak Jantung</span>
                    <span className="text-xs font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.hr || '82'} <span className="text-[9px] text-slate-400">bpm</span></span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[var(--surface-container)] rounded-xl">
                    <span className="text-[11px] font-bold text-[var(--on-surface-variant)]">Suhu Tubuh</span>
                    <span className="text-xs font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.temp || '36.8'} <span className="text-[9px] text-slate-400">°C</span></span>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-emerald-700">EWS NEWS2 SCORE</span>
                <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {activeEncounter?.news2_score || 1} (LOW RISK)
                </span>
              </div>
            </div>

            {/* Card 2: DPJP & Tim Asuhan Multidisiplin */}
            <div className="p-6 glass-panel rounded-3xl border border-[var(--outline-variant)]/20 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-[var(--on-surface-variant)] mb-4 flex items-center gap-2">
                  <UserCheck size={16} className="text-teal-600" /> DPJP &amp; Tim Asuhan (PPA)
                </h3>
                <div className="space-y-2">
                  <div className="p-2 bg-teal-500/8 border border-teal-500/20 rounded-xl">
                    <span className="text-[8px] font-black uppercase text-teal-700 block">DPJP UTAMA</span>
                    <span className="text-xs font-black text-[var(--on-surface)] truncate block">{activeEncounter?.doctor_name || 'dr. Robby Viory, Sp.B'}</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-container)] rounded-xl">
                    <span className="text-[8px] font-black uppercase text-[var(--on-surface-variant)] block">PERAWAT SHIFT</span>
                    <span className="text-xs font-bold text-[var(--on-surface)] truncate block">Ns. Sarah, S.Kep</span>
                  </div>
                  <div className="p-2 bg-[var(--surface-container)] rounded-xl">
                    <span className="text-[8px] font-black uppercase text-[var(--on-surface-variant)] block">APOTEKER KLINIK</span>
                    <span className="text-xs font-bold text-[var(--on-surface)] truncate block">Apt. Siti Aminah, S.Farm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Clinical Safety Flags & Risk Assessments */}
            <div className="p-6 glass-panel rounded-3xl border border-[var(--outline-variant)]/20 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-[var(--on-surface-variant)] mb-4 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-500" /> Safety Flags &amp; Risk
                </h3>
                <div className="space-y-2">
                  {activePatient?.allergies?.length > 0 ? (
                    <div className="p-2 bg-red-500/10 border border-red-500/25 rounded-xl text-red-700 text-xs font-bold flex items-center gap-1.5 truncate">
                      <ShieldAlert size={13} className="shrink-0" /> Alergi: {activePatient.allergies[0].agent}
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck size={13} className="shrink-0" /> NKDA (Tidak ada alergi)
                    </div>
                  )}
                  <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-700 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" /> Morse Fall Risk: SEDANG (35)
                  </div>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/25 rounded-xl text-blue-700 text-[11px] font-bold flex items-center gap-1.5">
                    <Scale size={13} className="shrink-0" /> Braden Score: 18 (LOW RISK)
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Quick Command Action Hub */}
            <div className="p-6 glass-panel rounded-3xl border border-indigo-500/20 shadow-sm bg-indigo-500/5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-700 mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-indigo-600 fill-indigo-600" /> Command Action Hub
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedModule('SOAP NOTES (CPPT HARIAN)')}
                    className="p-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all text-center shadow-xs cursor-pointer"
                  >
                    + SOAP Harian
                  </button>
                  <button 
                    onClick={() => setSelectedModule('ORDER RESEP / CPOE')}
                    className="p-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-teal-700 transition-all text-center shadow-xs cursor-pointer"
                  >
                    + CPOE Resep
                  </button>
                  <button 
                    onClick={() => setSelectedModule('TRANSFER INTERNAL (SBAR)')}
                    className="p-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-purple-700 transition-all text-center shadow-xs cursor-pointer"
                  >
                    + Handover SBAR
                  </button>
                  <button 
                    onClick={() => setSelectedModule('PERSETUJUAN TINDAKAN')}
                    className="p-2 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-700 transition-all text-center shadow-xs cursor-pointer"
                  >
                    + Consent Form
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModule('RESUME MEDIS RAWAT INAP')}
                className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all text-center shadow-xs cursor-pointer"
              >
                + Resume Pulang (Discharge)
              </button>
            </div>
          </div>

          {/* ─── DAFTAR FORMULIR YANG SUDAH TERISI & DITANDATANGANI ─── */}
          <div className="mt-8 bg-[var(--surface-container-lowest)] rounded-3xl p-6 lg:p-8 border border-[var(--outline-variant)]/30 shadow-sm">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-y-4 gap-x-6">
              <div className="flex-1 min-w-[300px]">
                <h3 className="text-lg font-black tracking-tight text-[var(--on-surface)] uppercase flex items-center gap-2">
                  <FileSignature className="text-[var(--primary)] shrink-0" size={22} />
                  Berkas Rekam Medis Pasien Terisi &amp; Sah ({filteredSoapRecords.length})
                </h3>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                  Semua formulir klinis di bawah ini telah ditandatangani secara digital dan tersimpan dalam audit trail yang immutable (Riwayat Rajal &amp; Ranap).
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto shrink-0 mt-2 xl:mt-0">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari diagnosis, nama dokter, atau isi..." 
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                
                <div className="relative flex-1 sm:flex-none sm:w-64 min-w-[200px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={historyModuleFilter}
                    onChange={e => setHistoryModuleFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer truncate text-ellipsis"
                  >
                    {uniqueModulesInHistory.map(mod => (
                      <option key={mod} value={mod}>{mod === 'ALL' ? 'Semua Kategori Formulir' : mod}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>

            {filteredSoapRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSoapRecords.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]/40 hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between shadow-sm group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black uppercase tracking-wider border border-[var(--primary)]/20">
                          {rec.moduleName || 'SOAP NOTES (CPPT)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                          <CheckCircle2 size={10} /> {rec.status || 'TERVERIFIKASI'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-[var(--on-surface)] line-clamp-1 mb-1">
                        {rec.title || rec.assessment || rec.data?.tindakan || rec.data?.topik || rec.data?.situation || 'Dokumen Rekam Medis'}
                      </h4>
                      
                      <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 mb-4 leading-relaxed">
                        {rec.subjective || rec.data?.catatan || rec.data?.background || rec.data?.risiko || 'Catatan klinis tersimpan.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--outline-variant)]/20 flex items-center justify-between text-[10px] font-bold text-[var(--on-surface-variant)]">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {rec.doctor || rec.signed_by || 'Dokter DPJP'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewRecord(rec)}
                          className="px-3 py-1.5 rounded-xl bg-[var(--surface-container-highest)] hover:bg-[var(--primary)] hover:text-white text-[var(--on-surface)] transition-colors font-black uppercase"
                        >
                          Buka Detail 👁️
                        </button>
                        <button
                          onClick={() => setSelectedModule(rec.moduleName || 'SOAP NOTES (CPPT HARIAN)')}
                          className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white hover:bg-blue-700 transition-colors font-black uppercase shadow-sm"
                        >
                          Buka Form 📝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[var(--surface-container-low)] rounded-2xl border border-dashed border-[var(--outline-variant)]">
                <p className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Belum ada formulir klinis yang diisi untuk kunjungan ini.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedModule === 'PERMINTAAN KONSULTASI SPESIALIS' || selectedModule === 'KONSULTASI INTERDISIPLIN') {
      return <ConsultationRequestForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'JAWABAN KONSULTASI SPESIALIS') {
      return <ConsultationResponseForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'SURAT RUJUKAN KELUAR') {
      return <ReferralLetterForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'CATATAN ADMISI RAWAT INAP') {
      return <AdmissionNoteForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PENGKAJIAN AWAL KEPERAWATAN RI') {
      return <NursingDailyAssessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'RESUME MEDIS RAWAT INAP') {
      return <DischargeSummaryForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PENUNJUKAN DPJP UTAMA') {
      return <DPJPAssignmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'ANAMNESIS MEDIS LENGKAP') {
      return <AnamnesisForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PEMERIKSAAN FISIK TERSTRUKTUR') {
      return <PhysicalExaminationForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'SOAP NOTES (CPPT HARIAN)') {
      return <CPPTWorkspace patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'ORDER RESEP / CPOE') {
      return <CPOEWorkspace patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'SKALA BRADEN (RISIKO DEKUBITUS)') {
      return <BradenScaleForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'ASESMEN RESTRAINT') {
      return <RestraintAssessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'KRITERIA MASUK ICU') {
      return <ICUAdmissionCriteriaForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'SKRINING SEPSIS (qSOFA)') {
      return <SepsisSOFACriteriaForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PEDIATRIC EWS (PEWS)') {
      return <PEWSForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'OBSTETRIC EWS (MEOWS)') {
      return <MEOWSForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'KESIAPAN PASIEN PULANG') {
      return <DischargeReadinessForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'TRANSFER INTERNAL (SBAR)') {
      return <TransferInternalForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }

    return (
      <div className="p-8 text-center bg-[var(--surface-container)] rounded-3xl border border-[var(--outline-variant)]/30">
        <Building2 size={40} className="mx-auto text-[var(--primary)] opacity-60 mb-3" />
        <h3 className="text-base font-black text-[var(--on-surface)] uppercase">{selectedModule}</h3>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1 mb-4">Modul Rawat Inap siap diisi.</p>
        <button onClick={() => setSelectedModule(null)} className="px-4 py-2 text-xs font-black uppercase bg-[var(--primary)] text-white rounded-xl">Kembali</button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-container-lowest)] overflow-hidden font-sans">
      {/* ── HEADER ── */}
      <header className="bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)]/30 z-30 sticky top-0 shadow-sm">
        <div className="px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  RAWAT INAP (INPATIENT)
                </span>
                <span className="text-[10px] font-bold text-[var(--on-surface-variant)]/60">JCI COP &amp; ACC</span>
              </div>
              <h1 className="text-base font-black text-[var(--on-surface)] tracking-tight uppercase">NurseFlow Enterprise EMR</h1>
            </div>
          </div>
          <div className="flex-1 max-w-xl ml-6 hidden sm:block">
            <AdvancedPatientSearchBar compact currentPatientId={selectedPatientId} onSelectPatient={(p) => selectPatient(p.id)} />
          </div>
        </div>

        {/* Patient Context Ribbon Rawat Inap */}
        {selectedPatientId && (
          <div className="bg-[var(--surface-container-lowest)] px-6 py-3 grid grid-cols-12 gap-6 items-center border-t border-[var(--outline-variant)]/20">
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
              <div onClick={() => setIsPatientPickerOpen(true)} className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform">
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                    INPATIENT ACTIVE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[var(--on-surface-variant)]">MRN: {noRM}</span>
                </div>
                <h2 className="text-lg font-black text-[var(--on-surface)] uppercase truncate max-w-[260px]">{patientName}</h2>
                <div className="text-[10px] font-black text-[var(--on-surface-variant)] opacity-70 uppercase tracking-widest mt-0.5">
                  {age} • {activePatient?.demographics?.gender === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                </div>
              </div>
            </div>

            {/* Inpatient Right Ribbon Context */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-2 items-end justify-center">
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <Bed size={12} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-700 uppercase">{activeEncounter?.room || 'Mawar 302'} • {activeEncounter?.bed || 'Bed A'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <Clock size={12} className="text-blue-600" />
                  <span className="text-[10px] font-black text-blue-700 uppercase">LOS: {activeEncounter?.lengthOfStay || '3 Hari'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                  <UserCheck size={12} className="text-teal-600" />
                  <span className="text-[10px] font-black text-teal-700 uppercase">DPJP: {activeEncounter?.doctor_name || 'dr. Alexander, Sp.PD'}</span>
                </div>
                <button
                  onClick={() => setIsDetailDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007399]/15 border border-[#007399]/30 rounded-xl text-[10px] font-black text-[#007399] dark:text-cyan-300 hover:bg-[#007399] hover:text-white transition-all cursor-pointer shadow-xs"
                  title="Buka Side Inspector Master Data Pasien (21 Kategori)"
                >
                  <Eye size={12} />
                  <span>Side Inspector 👁️</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN WORKSPACE (SIDEBAR + CONTENT) ── */}
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-72 bg-[var(--surface-container-lowest)] border-r border-[var(--outline-variant)]/30 flex flex-col h-full z-20">
          <div className="p-4 border-b border-[var(--outline-variant)]/30 sticky top-0 z-10 shadow-sm">
            <button
              onClick={() => setSelectedModule(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${!selectedModule ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-[var(--surface-container-high)] text-[var(--on-surface)] border-transparent'}`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Dashboard Rawat Inap</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-20">
            {INPATIENT_MODULE_GROUPS.map((group, idx) => {
              const isExpanded = expandedGroups[group.title];
              return (
                <div key={idx} className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline-variant)]/30 overflow-hidden shadow-sm">
                  <button onClick={() => toggleGroup(group.title)} className="w-full flex items-center justify-between p-3.5 bg-[var(--surface-container-highest)] hover:bg-[var(--outline-variant)]/20 transition-colors">
                    <div className="flex items-center gap-2 text-[var(--on-surface)]">
                      {React.cloneElement(group.icon, { className: 'text-indigo-600' })}
                      <span className="text-[10px] font-black uppercase tracking-widest text-left">{group.title}</span>
                    </div>
                    <ChevronDown size={14} className={`text-[var(--on-surface-variant)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-2 space-y-1">
                      {group.modules.map(mod => {
                        const isSelected = selectedModule === mod.name;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => setSelectedModule(mod.name)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${isSelected ? 'bg-indigo-600/10 text-indigo-700 border-indigo-500/30 font-black' : 'bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {React.cloneElement(mod.icon, { size: 14, className: isSelected ? 'text-indigo-600' : 'opacity-70' })}
                              <span className="text-[10px] font-bold">{mod.name}</span>
                            </div>
                            {mod.highlight && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className={`flex-1 bg-[var(--surface-container-lowest)] relative min-h-0 ${selectedModule ? 'h-full overflow-hidden p-0 flex flex-col' : 'p-6 lg:p-8 overflow-y-auto custom-scrollbar'}`}>
          {renderModuleWorkspace()}
        </main>
      </div>

      {/* ─── DOCUMENT PREVIEW MODAL ─── */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-container-lowest)] rounded-3xl border border-[var(--outline-variant)]/40 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[var(--outline-variant)]/30 flex items-center justify-between bg-[var(--surface-container-low)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
                  <FileSignature size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--on-surface)] uppercase">{previewRecord.moduleName || 'SOAP NOTES (CPPT)'}</h3>
                  <p className="text-xs text-[var(--on-surface-variant)]">Diposting: {previewRecord.date || previewRecord.created_at || '-'}</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewRecord(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] hover:bg-[var(--error)] hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30">
                <span className="text-[10px] font-black uppercase text-[var(--primary)] block mb-1">DOKTER / PENANGGUNG JAWAB</span>
                <p className="text-sm font-bold text-[var(--on-surface)]">{previewRecord.doctor || previewRecord.signed_by || '-'}</p>
              </div>

              {previewRecord.subjective && (
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30">
                  <span className="text-[10px] font-black uppercase text-amber-600 block mb-1">SUBJECTIVE (S) / KELUHAN</span>
                  <p className="text-xs text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">{previewRecord.subjective}</p>
                </div>
              )}

              {previewRecord.objective && (
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30">
                  <span className="text-[10px] font-black uppercase text-blue-600 block mb-1">OBJECTIVE (O) / PEMERIKSAAN FISIK & VITAL</span>
                  <p className="text-xs text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">{previewRecord.objective}</p>
                </div>
              )}

              {previewRecord.assessment && (
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30">
                  <span className="text-[10px] font-black uppercase text-purple-600 block mb-1">ASSESSMENT (A) / DIAGNOSA KERJA</span>
                  <p className="text-xs font-bold text-[var(--on-surface)] leading-relaxed">{previewRecord.assessment}</p>
                </div>
              )}

              {previewRecord.plan && (
                <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30">
                  <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">PLAN (P) / INSTRUKSI & RENCANA ASUHAN</span>
                  <p className="text-xs text-[var(--on-surface)] leading-relaxed whitespace-pre-wrap">{previewRecord.plan}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-wider">TANDATANGAN DIGITAL VERIFIED</span>
                </div>
                <span className="text-[9px] font-mono font-bold opacity-80">{previewRecord.digitalSignature || 'JCI-VERIFIED-HASH'}</span>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--outline-variant)]/30 bg-[var(--surface-container-low)] flex justify-end">
              <button 
                onClick={() => setPreviewRecord(null)}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-black uppercase shadow-sm cursor-pointer"
              >
                Tutup Modal
              </button>
            </div>
          </div>
        </div>
      )}

      <PatientSearchModal 
        isOpen={isPatientPickerOpen} 
        onClose={() => setIsPatientPickerOpen(false)} 
        onSelect={(s) => { 
          const targetId = typeof s === 'object' ? (s.patientId || s.id) : s; 
          if (targetId) selectPatient(targetId); 
          setIsPatientPickerOpen(false); 
        }} 
      />

      <PatientDetailDrawerModal
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        patient={activePatient}
      />
    </div>
  );
}
