import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { 
  AlertTriangle, Activity, Pill, ShieldAlert, CheckCircle2, User, Building2, 
  Stethoscope, FileText, BadgeInfo, CalendarDays, Search, ChevronRight, 
  Heart, Scale, ClipboardCheck, BookOpen, UserCheck, ShieldCheck,
  HelpCircle, Thermometer, Info, Scissors, Microscope, Settings, 
  Workflow, PlusSquare, ScrollText, AlertCircle, UserPlus, ClipboardList,
  FileSignature, LogOut, Share2, Clipboard, Zap, History, Eye, Plus, Edit2, RefreshCw, Sparkles, Brain,
  Droplets, PenTool, Clock, LayoutDashboard, ChevronDown, HeartPulse, Filter, Copy, Check, Hash, Bed, Users
} from 'lucide-react';
import usePatientClipboardShortcuts from '../../../hooks/usePatientClipboardShortcuts.js';
import toast from 'react-hot-toast';
import { saveSoapNote, getPatientRecords, saveClinicalRecord } from '../../emr/services/emr.service.js';
import { CARE_STATES } from '../../../core/services/careStateEngine.service.js';
import { clinicalActionabilityEngine } from '../../../core/services/clinicalActionabilityEngine.service.js';

// ─── 34 MEDICAL FORMS IMPORTS (REUSE WITHOUT REWRITE) ──────────

// AOP: Assessment of Patients
import AdmissionNoteForm from '../../emr/components/AdmissionNoteForm.jsx';
import AnamnesisForm from '../../emr/components/AnamnesisForm.jsx';
import PhysicalExaminationForm from '../../emr/components/PhysicalExaminationForm.jsx';
import InitialAssessment from '../../emr/components/InitialAssessment.jsx';
import NursingDailyAssessmentForm from '../../emr/components/NursingDailyAssessmentForm.jsx';
import BradenScaleForm from '../../emr/components/BradenScaleForm.jsx';
import NutritionScreeningForm from '../../emr/components/NutritionScreeningForm.jsx';
import WHOChildAnthropometryForm from '../../emr/components/WHOChildAnthropometryForm.jsx';
import PainReassessmentForm from '../../emr/components/PainReassessmentForm.jsx';

// COP: Care of Patients
import CPPTWorkspace from '../../emr/components/CPPTWorkspace.jsx';
import SoapWorkspace from '../../emr/components/SoapWorkspace.jsx';
import EarlyWarningSystem from '../../emr/components/EarlyWarningSystem.jsx';
import PEWSForm from '../../emr/components/PEWSForm.jsx';
import MEOWSForm from '../../emr/components/MEOWSForm.jsx';
import SepsisSOFACriteriaForm from '../../emr/components/SepsisSOFACriteriaForm.jsx';
import RestraintAssessmentForm from '../../emr/components/RestraintAssessmentForm.jsx';
import WHOLabourCareGuideForm from '../../emr/components/WHOLabourCareGuideForm.jsx';
import DNRForm from '../../emr/components/DNRForm.jsx';
import NursingHandoverForm from '../../emr/components/NursingHandoverForm.jsx';
import ICUAdmissionCriteriaForm from '../../emr/components/ICUAdmissionCriteriaForm.jsx';

// ASC: Anesthesia & Surgical Care
import SurgicalSafetyChecklistForm from '../../emr/components/SurgicalSafetyChecklistForm.jsx';
import AldreteScoreForm from '../../emr/components/AldreteScoreForm.jsx';
import PreAnesthesiaAssessmentForm from '../../emr/components/PreAnesthesiaAssessmentForm.jsx';

// MMU: Medication Management & Use
import EMARForm from '../../emr/components/EMARForm.jsx';
import EmarAdministrationStudio from '../../nursing/components/EmarAdministrationStudio.jsx';
import CPOEWorkspace from '../../emr/components/CPOEWorkspace.jsx';
import MedicationReconciliationForm from '../../emr/components/MedicationReconciliationForm.jsx';
import BPOMMESOPharmacovigilanceForm from '../../emr/components/BPOMMESOPharmacovigilanceForm.jsx';
import BloodTransfusionForm from '../../emr/components/BloodTransfusionForm.jsx';

// PFR & PFE: Patient Rights & Education
import DigitalInformedConsent from '../../emr/components/DigitalInformedConsent.jsx';
import PAPSForm from '../../emr/components/PAPSForm.jsx';
import PatientEducationForm from '../../emr/components/PatientEducationForm.jsx';
import WHOHandHygieneAuditForm from '../../emr/components/WHOHandHygieneAuditForm.jsx';

// ACC: Access, Continuity & Discharge
import DischargeSummaryForm from '../../emr/components/DischargeSummaryForm.jsx';
import DischargeReadinessForm from '../../emr/components/DischargeReadinessForm.jsx';
import ReferralLetterForm from '../../emr/components/ReferralLetterForm.jsx';
import TransferInternalForm from '../../emr/components/TransferInternalForm.jsx';
import ICUDischargeCriteriaForm from '../../emr/components/ICUDischargeCriteriaForm.jsx';
import MedicalCertificateCauseOfDeathForm from '../../emr/components/MedicalCertificateCauseOfDeathForm.jsx';

// DPJP & Coordination
import DPJPAssignmentForm from '../../emr/components/DPJPAssignmentForm.jsx';
import ConsultationRequestForm from '../../emr/components/ConsultationRequestForm.jsx';
import ConsultationResponseForm from '../../emr/components/ConsultationResponseForm.jsx';

// Modal & Side Inspector
import GlobalPatientSearchModal from '../../../components/common/GlobalPatientSearchModal.jsx';
import PatientDetailDrawerModal from '../../emr/components/PatientDetailDrawerModal.jsx';
import PatientJourneyTimeline from '../../patient/components/PatientJourneyTimeline.jsx';

// ─── MASTER JCI CLINICAL MODULE GROUPS ─────────────────────────
const MASTER_CHART_MODULE_GROUPS = [
  {
    title: 'PENGKAJIAN AWAL & ADMISI (AOP)',
    icon: <Search size={16} />,
    chapter: 'AOP',
    modules: [
      { id: 'inpatient-admisi', name: 'CATATAN ADMISI RAWAT INAP', icon: <Building2 size={16} />, standard: 'AOP.1.1', highlight: true, encounterTypes: ['INPATIENT'] },
      { id: 'anamnesis-medis', name: 'ANAMNESIS MEDIS LENGKAP', icon: <FileText size={16} />, standard: 'AOP.1.1', highlight: true },
      { id: 'physical-exam', name: 'PEMERIKSAAN FISIK TERSTRUKTUR', icon: <Stethoscope size={16} />, standard: 'AOP.1.1', highlight: true },
      { id: 'initial-med', name: 'PENGKAJIAN AWAL MEDIS (RJ)', icon: <Stethoscope size={16} />, standard: 'AOP.1.1', encounterTypes: ['OUTPATIENT'] },
      { id: 'initial-nurse', name: 'PENGKAJIAN AWAL KEPERAWATAN', icon: <ClipboardList size={16} />, standard: 'AOP.1.2' },
      { id: 'fall-risk', name: 'ASESMEN RISIKO JATUH (MORSE)', icon: <AlertTriangle size={16} />, standard: 'IPSG.6' },
      { id: 'braden-scale', name: 'SKALA BRADEN (DEKUBITUS)', icon: <Scale size={16} />, standard: 'COP.3', highlight: true },
      { id: 'nutritional', name: 'SKRINING GIZI (MST)', icon: <Activity size={16} />, standard: 'AOP.1.4' },
      { id: 'who-anthropometry', name: 'ANTROPOMETRI & STUNTING (WHO-Z)', icon: <Scale size={16} />, standard: 'AOP.1.4', highlight: true, encounterTypes: ['OUTPATIENT'] },
      { id: 'pain-reassessment', name: 'PENGKAJIAN ULANG NYERI', icon: <Thermometer size={16} />, standard: 'AOP.1.5', encounterTypes: ['INPATIENT', 'EMERGENCY'] }
    ]
  },
  {
    title: 'CPPT & MONITORING ASUHAN (COP)',
    icon: <ClipboardCheck size={16} />,
    chapter: 'COP',
    modules: [
      { id: 'soap', name: 'SOAP NOTES (CPPT HARIAN)', icon: <FileText size={16} />, standard: 'COP.2.1', highlight: true },
      { id: 'ews-monitoring', name: 'EARLY WARNING SYSTEM (EWS)', icon: <HeartPulse size={16} />, standard: 'COP.3.1', highlight: true, encounterTypes: ['INPATIENT', 'EMERGENCY'] },
      { id: 'pews', name: 'PEDIATRIC EWS (PEWS)', icon: <Activity size={16} />, standard: 'COP.3.1' },
      { id: 'meows', name: 'OBSTETRIC EWS (MEOWS)', icon: <Heart size={16} />, standard: 'COP.3.1' },
      { id: 'sepsis-sofa', name: 'SKRINING SEPSIS (qSOFA)', icon: <AlertCircle size={16} />, standard: 'COP.3', highlight: true },
      { id: 'restraint', name: 'ASESMEN RESTRAINT', icon: <ShieldAlert size={16} />, standard: 'COP.3.3' },
      { id: 'who-labour', name: 'PARTOGRAF & PERSALINAN (WHO)', icon: <Heart size={16} />, standard: 'COP.3.1', highlight: true },
      { id: 'dnr-form', name: 'PROTOKOL DNR / AKHIR HAYAT', icon: <HeartPulse size={16} />, standard: 'PFR.4', encounterTypes: ['INPATIENT', 'EMERGENCY'] },
      { id: 'nursing-handover', name: 'SERAH TERIMA KEPERAWATAN (ISBAR)', icon: <ClipboardList size={16} />, standard: 'IPSG.2', encounterTypes: ['INPATIENT', 'EMERGENCY'] },
      { id: 'icu-criteria', name: 'KRITERIA MASUK ICU', icon: <HeartPulse size={16} />, standard: 'COP.3 / ACC.3' }
    ]
  },
  {
    title: 'ORDER & PENGELOLAAN OBAT (MMU)',
    icon: <Pill size={16} />,
    chapter: 'MMU',
    modules: [
      { id: 'cpoe', name: 'ORDER RESEP / CPOE', icon: <Pill size={16} />, standard: 'MMU.4', highlight: true },
      { id: 'emar', name: 'PEMBERIAN OBAT (eMAR 5-BENAR)', icon: <Zap size={16} />, standard: 'MMU.6', highlight: true },
      { id: 'med-reconciliation', name: 'REKONSILIASI OBAT', icon: <ClipboardCheck size={16} />, standard: 'MMU.4.1', encounterTypes: ['INPATIENT', 'EMERGENCY'] },
      { id: 'bpom-meso', name: 'PELAPORAN MESO (BPOM-WHO)', icon: <AlertTriangle size={16} />, standard: 'MMU.7', highlight: true },
      { id: 'blood-transfusion', name: 'MONITORING TRANSFUSI DARAH', icon: <Droplets size={16} />, standard: 'COP.3.4', encounterTypes: ['INPATIENT', 'EMERGENCY'] }
    ]
  },
  {
    title: 'KAMAR BEDAH & ANESTESI (ASC)',
    icon: <Scissors size={16} />,
    chapter: 'ASC',
    modules: [
      { id: 'surgical-safety', name: 'CHECKLIST BEDAH (WHO)', icon: <Scissors size={16} />, standard: 'IPSG.4', highlight: true },
      { id: 'aldrete-score', name: 'SKOR ALDRETE & PACU', icon: <Activity size={16} />, standard: 'ASC.7.4', highlight: true },
      { id: 'pre-anesthesia', name: 'ASESMEN PRA-ANESTESI', icon: <Stethoscope size={16} />, standard: 'ASC.3.0', encounterTypes: ['INPATIENT', 'EMERGENCY'] }
    ]
  },
  {
    title: 'HAK PASIEN & EDUKASI (PFR/PFE)',
    icon: <BookOpen size={16} />,
    chapter: 'PFR',
    modules: [
      { id: 'informed-consent', name: 'DIGITAL INFORMED CONSENT', icon: <FileSignature size={16} />, standard: 'PFR.5', highlight: true },
      { id: 'paps-form', name: 'SURAT PAPS (AMA)', icon: <AlertTriangle size={16} />, standard: 'PFR.5.4', highlight: true },
      { id: 'patient-education', name: 'LEMBAR EDUKASI PASIEN (KIE)', icon: <BookOpen size={16} />, standard: 'PFE.1', highlight: true },
      { id: 'hand-hygiene', name: 'AUDIT 5 MOMEN CUCI TANGAN', icon: <Droplets size={16} />, standard: 'PCI.9' }
    ]
  },
  {
    title: 'DISCHARGE, RUJUKAN & KEMATIAN (ACC)',
    icon: <LogOut size={16} />,
    chapter: 'ACC',
    modules: [
      { id: 'medical-resume', name: 'RESUME MEDIS PULANG (DISCHARGE)', icon: <FileText size={16} />, standard: 'ACC.4.2', highlight: true },
      { id: 'discharge-readiness', name: 'KESIAPAN PASIEN PULANG', icon: <ClipboardCheck size={16} />, standard: 'ACC.4', highlight: true, encounterTypes: ['INPATIENT'] },
      { id: 'referral-letter', name: 'SURAT RUJUKAN KELUAR', icon: <Share2 size={16} />, standard: 'ACC.3.1', highlight: true },
      { id: 'transfer-internal', name: 'TRANSFER INTERNAL (SBAR)', icon: <LogOut size={16} />, standard: 'ACC.3.0' },
      { id: 'icu-discharge', name: 'STEP-DOWN / KELUAR ICU', icon: <LogOut size={16} />, standard: 'ACC.3' },
      { id: 'death-certificate', name: 'SERTIFIKAT KEMATIAN (SMPK)', icon: <FileText size={16} />, standard: 'ACC.4 / WHO ICD', highlight: true }
    ]
  },
  {
    title: 'DPJP & KOORDINASI PPA (COP.2)',
    icon: <UserCheck size={16} />,
    chapter: 'COP',
    modules: [
      { id: 'dpjp-assignment', name: 'PENUNJUKAN DPJP UTAMA', icon: <UserCheck size={16} />, standard: 'COP.2', highlight: true },
      { id: 'consult-request', name: 'KONSULTASI INTERDISIPLIN', icon: <Users size={16} />, standard: 'COP.2.1', highlight: true },
      { id: 'consult-response', name: 'JAWABAN KONSULTASI SPESIALIS', icon: <FileText size={16} />, standard: 'COP.2.1' }
    ]
  }
];

export default function UnifiedPatientChart() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters, liveContext } = useEncounterStore();

  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedEncounterId, setSelectedEncounterId] = useState(null);
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isMrnCopied, setIsMrnCopied] = useState(false);

  // Active view tab: 'OVERVIEW' | 'TIMELINE' | 'MODULE'
  const [mainViewTab, setMainViewTab] = useState('OVERVIEW');

  // Sidebar expanded groups
  const [expandedGroups, setExpandedGroups] = useState({
    'PENGKAJIAN AWAL & ADMISI (AOP)': true,
    'CPPT & MONITORING ASUHAN (COP)': true
  });

  // History / Form records query state
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyModuleFilter, setHistoryModuleFilter] = useState('ALL');
  const [soapRecords, setSoapRecords] = useState([]);
  const [previewRecord, setPreviewRecord] = useState(null);

  // Global Clipboard Shortcut
  usePatientClipboardShortcuts();

  useEffect(() => {
    fetchPatients();
    fetchActiveEncounters();
  }, [fetchPatients, fetchActiveEncounters]);

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId || p.mrn === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  const activeEncounter = useMemo(() => {
    if (!activePatient) return null;
    return activeEncounters.find(e => e.patientId === activePatient.id && e.status === 'ACTIVE') ||
           activeEncounters.find(e => e.patientId === activePatient.id) || null;
  }, [activeEncounters, activePatient]);

  const encounterType = useMemo(() => {
    if (activeEncounter?.type) return activeEncounter.type.toUpperCase();
    if (activeEncounter?.primaryState === CARE_STATES.INPATIENT_ACTIVE) return 'INPATIENT';
    if (activeEncounter?.primaryState === CARE_STATES.OUTPATIENT_ACTIVE) return 'OUTPATIENT';
    if (activeEncounter?.primaryState === CARE_STATES.IGD_ACTIVE) return 'EMERGENCY';
    return 'INPATIENT'; // default fallback
  }, [activeEncounter]);

  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    if (activePatient?.id) {
      getPatientRecords(activePatient.id).then(setSoapRecords).catch(console.error);
    }
  }, [activePatient?.id]);

  // Encounter-based Dynamic Module Filtering
  const filteredModuleGroups = useMemo(() => {
    return MASTER_CHART_MODULE_GROUPS.map(group => {
      const validModules = group.modules.filter(mod => {
        if (!mod.encounterTypes) return true;
        return mod.encounterTypes.includes(encounterType);
      });
      return { ...group, modules: validModules };
    }).filter(group => group.modules.length > 0);
  }, [encounterType]);

  const noRM = activePatient?.mrn || activePatient?.no_rm || activePatient?.id || '-';
  const patientName = activePatient?.name || activePatient?.nama || 'Pasien Tanpa Nama';
  const age = calculateAge(activePatient?.dob || activePatient?.demographics?.dob || '1990-01-01');
  const noReg = activeEncounter?.encounterNumber || activeEncounter?.no_registrasi || '-';

  const filteredSoapRecords = useMemo(() => {
    return soapRecords.filter(r => {
      const matchesSearch = 
        (r.title || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (r.assessment || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (r.doctor || '').toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        (r.subjective || '').toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchesFilter = historyModuleFilter === 'ALL' || r.moduleName === historyModuleFilter;
      return matchesSearch && matchesFilter;
    });
  }, [soapRecords, historySearchQuery, historyModuleFilter]);

  const uniqueModulesInHistory = useMemo(() => {
    const mods = new Set(soapRecords.map(r => r.moduleName).filter(Boolean));
    return ['ALL', ...Array.from(mods)];
  }, [soapRecords]);

  // Real-Time Clinical Actionability State
  const actionability = useMemo(() => {
    return clinicalActionabilityEngine.evaluateActionability({
      patient: activePatient,
      encounter: activeEncounter,
      role: currentUser?.role || 'DOCTOR',
      clinicalRecords: soapRecords
    });
  }, [activePatient, activeEncounter, currentUser?.role, soapRecords]);

  // ─── DYNAMIC FORM WORKSPACE RENDERER (ALL 34 FORMS) ───────────
  const renderModuleWorkspace = () => {
    if (mainViewTab === 'TIMELINE') {
      return (
        <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
          <PatientJourneyTimeline patient={activePatient} encounter={activeEncounter} />
        </div>
      );
    }

    if (!selectedModule) {
      // ─── DASHBOARD OVERVIEW & COMPREHENSIVE CLINICAL DOSSIER ───
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent p-5 rounded-3xl border border-blue-500/20">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
                <span className="material-symbols-outlined text-[26px]">folder_shared</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-black text-[var(--on-surface)] tracking-tight">
                    Patient Chart & Rekam Medis Longitudinal
                  </h2>
                  {actionability?.isClosed && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-white font-mono text-[9px] font-black uppercase">
                      HISTORICAL ENCOUNTER (READONLY)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  Kamar/Unit: <strong className="text-[var(--primary)]">{activeEncounter?.room || 'Rawat Aktif'} • {activeEncounter?.bed || 'Bed Utama'}</strong> | Mode Encounter: <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[10px]">{encounterType}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainViewTab('TIMELINE')}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-blue-600">timeline</span>
                <span>Alur Timeline Pasien</span>
              </button>
            </div>
          </div>

          {/* ─── CLINICAL ACTIONABILITY COCKPIT (WHAT TO DO NOW) ─── */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/50 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-400 text-[24px]">crisis_alert</span>
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase">Clinical Actionability & Decision Cockpit</h3>
                  <p className="text-[11px] text-slate-300">Rangkuman kondisi aktif & tindakan yang harus dilakukan oleh tim medis saat ini</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  {actionability?.totalPendingCount || 0} TINDAKAN PENDING
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-mono font-bold">
                  EVENT TERAKHIR: {new Date(actionability?.lastClinicalEvent?.timestamp || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Active Problems */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-indigo-400">format_list_bulleted</span>
                  Active Problems (Masalah Aktif)
                </span>
                <ul className="space-y-1 text-[11px] text-slate-200">
                  {actionability?.activeProblems?.map((prob, pIdx) => (
                    <li key={pIdx} className="flex items-center gap-2 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>{prob}</span>
                    </li>
                  )) || <li>Observasi Klinis Aktif</li>}
                </ul>
              </div>

              {/* Pending Clinical Actions (What to do NOW) */}
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                  Pending Actions (Wajib Ditindaklanjuti)
                </span>
                {actionability?.pendingActions?.length > 0 ? (
                  <div className="space-y-1.5">
                    {actionability.pendingActions.map((act) => (
                      <div key={act.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-amber-900/40 border border-amber-500/30">
                        <span className="text-[11px] font-bold text-amber-200">{act.title}</span>
                        <button
                          onClick={() => setSelectedModule(act.targetModule)}
                          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase cursor-pointer"
                        >
                          Tindak ⚡
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-300 flex items-center gap-1.5 py-2 font-bold">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Semua pengkajian & tindakan utama terkini terpenuhi.
                  </div>
                )}
              </div>

              {/* Safety Flags & Last Event */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-rose-400">security</span>
                  Safety Flags & Jejak Terakhir
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-200 font-bold flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-rose-400" />
                    {actionability?.allergies?.[0] || 'Tidak ada alergi'}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1">
                    Event Terakhir: <strong>{actionability?.lastClinicalEvent?.title}</strong> oleh <em>{actionability?.lastClinicalEvent?.doctor}</em>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Clinical Overview & Safety Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Tanda Vital & EWS NEWS2 */}
            <div className="p-4 rounded-3xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-[var(--primary)] tracking-wider flex items-center gap-1.5">
                  <Activity size={14} /> Tanda Vital & EWS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                  NEWS2: 0 (NORMAL)
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--on-surface)]">
                <div className="flex justify-between"><span>Tekanan Darah:</span><strong className="font-mono">{activePatient?.vitals?.bp || '120/80 mmHg'}</strong></div>
                <div className="flex justify-between"><span>Detak Jantung:</span><strong className="font-mono">{activePatient?.vitals?.hr || '78 bpm'}</strong></div>
                <div className="flex justify-between"><span>Suhu Tubuh:</span><strong className="font-mono">{activePatient?.vitals?.temp || '36.6 °C'}</strong></div>
              </div>
            </div>

            {/* DPJP & Tim Asuhan */}
            <div className="p-4 rounded-3xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} /> DPJP & Tim Asuhan
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[var(--on-surface)]">
                <div><span className="text-[10px] text-slate-400 block">DPJP UTAMA:</span><strong>{activeEncounter?.doctor_name || 'dr. Alexander, Sp.PD'}</strong></div>
                <div><span className="text-[10px] text-slate-400 block">PERAWAT SHIFT:</span><strong>Ners Rina, S.Kep</strong></div>
              </div>
            </div>

            {/* Safety Flags & Alergi */}
            <div className="p-4 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Safety Flags & Risk
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="p-1.5 rounded-xl bg-rose-100/80 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-bold flex items-center gap-1">
                  <AlertTriangle size={12} /> Alergi: {activePatient?.allergies?.[0] || 'Aspirin, Penisilin'}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Risiko Jatuh: <strong>Rendah (Morse 15)</strong> • Dekubitus: <strong>Braden 20</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Hub */}
            <div className="p-4 rounded-3xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/30 flex flex-col justify-between shadow-xs">
              <span className="text-[11px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider flex items-center gap-1.5 mb-2">
                <Zap size={14} /> Command Action Hub
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setSelectedModule('SOAP NOTES (CPPT HARIAN)')}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase transition-all shadow-xs"
                >
                  + SOAP CPPT
                </button>
                <button
                  onClick={() => setSelectedModule('ORDER RESEP / CPOE')}
                  className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase transition-all shadow-xs"
                >
                  + CPOE RESEP
                </button>
                <button
                  onClick={() => setSelectedModule('DIGITAL INFORMED CONSENT')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase transition-all shadow-xs"
                >
                  + CONSENT
                </button>
                <button
                  onClick={() => setSelectedModule('RESUME MEDIS PULANG (DISCHARGE)')}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase transition-all shadow-xs"
                >
                  + RESUME
                </button>
              </div>
            </div>

          </div>

          {/* Dossier Berkas Rekam Medis Sah */}
          <div className="p-6 rounded-3xl bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/30 space-y-4 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[var(--outline-variant)]/30 pb-4">
              <div>
                <h3 className="text-base font-black text-[var(--on-surface)] flex items-center gap-2">
                  <FileText size={18} className="text-[var(--primary)]" />
                  Berkas Rekam Medis Pasien Terisi & Sah ({filteredSoapRecords.length})
                </h3>
                <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                  Arsip formulir klinis longitudinal dengan tanda tangan digital tersertifikasi dan audit trail WORM.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Cari diagnosis, nama dokter, form..."
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden focus:border-[#015C80]"
                  />
                </div>

                <select
                  value={historyModuleFilter}
                  onChange={e => setHistoryModuleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-hidden cursor-pointer"
                >
                  {uniqueModulesInHistory.map(m => (
                    <option key={m} value={m}>{m === 'ALL' ? 'Semua Kategori Formulir' : m}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredSoapRecords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSoapRecords.map((rec, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]/40 transition-all flex flex-col justify-between shadow-xs group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-wider border border-[var(--primary)]/20">
                          {rec.moduleName || 'SOAP NOTES (CPPT)'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={10} /> {rec.status || 'TERVERIFIKASI'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-[var(--on-surface)] line-clamp-1 mb-1">
                        {rec.title || rec.assessment || rec.data?.tindakan || 'Dokumen Rekam Medis Sah'}
                      </h4>
                      <p className="text-xs text-[var(--on-surface-variant)] line-clamp-2 mb-3 leading-relaxed">
                        {rec.subjective || rec.data?.catatan || rec.data?.risiko || 'Catatan klinis tersimpan.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--outline-variant)]/20 flex items-center justify-between text-[10px] font-bold text-[var(--on-surface-variant)]">
                      <span>👤 {rec.doctor || rec.signed_by || 'Dokter DPJP'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewRecord(rec)}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-[#015C80] hover:text-white transition-colors font-black uppercase cursor-pointer"
                        >
                          Detail 👁️
                        </button>
                        <button
                          onClick={() => setSelectedModule(rec.moduleName || 'SOAP NOTES (CPPT HARIAN)')}
                          className="px-3 py-1.5 rounded-xl bg-[#015C80] text-white hover:bg-blue-700 transition-colors font-black uppercase shadow-xs cursor-pointer"
                        >
                          Buka Form 📝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500">
                  Belum ada formulir klinis yang tersimpan untuk kunjungan ini. Silakan pilih form dari sidebar kiri.
                </p>
              </div>
            )}
          </div>

        </div>
      );
    }

    // ─── 34 DYNAMIC FORM SWITCHER ─────────────────────────────────
    
    // AOP Group
    if (selectedModule === 'CATATAN ADMISI RAWAT INAP') {
      return <AdmissionNoteForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'ANAMNESIS MEDIS LENGKAP') {
      return <AnamnesisForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PEMERIKSAAN FISIK TERSTRUKTUR') {
      return <PhysicalExaminationForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'PENGKAJIAN AWAL MEDIS (RJ)') {
      return <InitialAssessment patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PENGKAJIAN AWAL KEPERAWATAN' || selectedModule === 'PENGKAJIAN AWAL KEPERAWATAN RI') {
      return <NursingDailyAssessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SKALA BRADEN (DEKUBITUS)' || selectedModule === 'SKALA BRADEN (RISIKO DEKUBITUS)') {
      return <BradenScaleForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SKRINING GIZI (MST)') {
      return <NutritionScreeningForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'ANTROPOMETRI & STUNTING (WHO-Z)') {
      return <WHOChildAnthropometryForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PENGKAJIAN ULANG NYERI') {
      return <PainReassessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // COP Group
    if (selectedModule === 'SOAP NOTES (CPPT HARIAN)' || selectedModule === 'SOAP NOTES (CPPT)' || selectedModule === 'CPPT') {
      return <CPPTWorkspace patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'EARLY WARNING SYSTEM (EWS)') {
      return <EarlyWarningSystem patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PEDIATRIC EWS (PEWS)') {
      return <PEWSForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'OBSTETRIC EWS (MEOWS)') {
      return <MEOWSForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SKRINING SEPSIS (qSOFA)') {
      return <SepsisSOFACriteriaForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'ASESMEN RESTRAINT') {
      return <RestraintAssessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PARTOGRAF & PERSALINAN (WHO)') {
      return <WHOLabourCareGuideForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PROTOKOL DNR / AKHIR HAYAT' || selectedModule === 'DNR') {
      return <DNRForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SERAH TERIMA KEPERAWATAN (ISBAR)' || selectedModule === 'ISBAR HANDOVER') {
      return <NursingHandoverForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'KRITERIA MASUK ICU') {
      return <ICUAdmissionCriteriaForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // MMU Group
    if (selectedModule === 'ORDER RESEP / CPOE') {
      return <CPOEWorkspace patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PEMBERIAN OBAT (eMAR 5-BENAR)' || selectedModule === 'PEMBERIAN OBAT (eMAR)') {
      return <EmarAdministrationStudio activePatient={activePatient} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'REKONSILIASI OBAT') {
      return <MedicationReconciliationForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'PELAPORAN MESO (BPOM-WHO)') {
      return <BPOMMESOPharmacovigilanceForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'MONITORING TRANSFUSI DARAH') {
      return <BloodTransfusionForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // ASC Group
    if (selectedModule === 'CHECKLIST BEDAH (WHO)') {
      return <SurgicalSafetyChecklistForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SKOR ALDRETE & PACU') {
      return <AldreteScoreForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'ASESMEN PRA-ANESTESI') {
      return <PreAnesthesiaAssessmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // PFR / PFE Group
    if (selectedModule === 'DIGITAL INFORMED CONSENT' || selectedModule === 'PERSETUJUAN TINDAKAN') {
      return <DigitalInformedConsent patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SURAT PAPS (AMA)') {
      return <PAPSForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'LEMBAR EDUKASI PASIEN (KIE)' || selectedModule === 'EDUKASI PASIEN') {
      return <PatientEducationForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'AUDIT 5 MOMEN CUCI TANGAN') {
      return <WHOHandHygieneAuditForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // ACC Group
    if (selectedModule === 'RESUME MEDIS PULANG (DISCHARGE)' || selectedModule === 'RESUME MEDIS RAWAT INAP' || selectedModule === 'RESUME MEDIS') {
      return <DischargeSummaryForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'KESIAPAN PASIEN PULANG') {
      return <DischargeReadinessForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SURAT RUJUKAN KELUAR') {
      return <ReferralLetterForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'TRANSFER INTERNAL (SBAR)') {
      return <TransferInternalForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'STEP-DOWN / KELUAR ICU') {
      return <ICUDischargeCriteriaForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }
    if (selectedModule === 'SERTIFIKAT KEMATIAN (SMPK)') {
      return <MedicalCertificateCauseOfDeathForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} onSaveSuccess={() => { setSelectedModule(null); getPatientRecords(activePatient?.id).then(setSoapRecords); }} />;
    }

    // Coordination Group
    if (selectedModule === 'PENUNJUKAN DPJP UTAMA' || selectedModule === 'PENUNJUKAN DPJP') {
      return <DPJPAssignmentForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'KONSULTASI INTERDISIPLIN' || selectedModule === 'PERMINTAAN KONSULTASI SPESIALIS') {
      return <ConsultationRequestForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }
    if (selectedModule === 'JAWABAN KONSULTASI SPESIALIS') {
      return <ConsultationResponseForm patient={activePatient} encounter={activeEncounter} onClose={() => setSelectedModule(null)} />;
    }

    // Default Fallback
    return (
      <div className="p-8 text-center bg-[var(--surface-container)] rounded-3xl border border-[var(--outline-variant)]/30">
        <Building2 size={40} className="mx-auto text-[var(--primary)] opacity-60 mb-3" />
        <h3 className="text-base font-black text-[var(--on-surface)] uppercase">{selectedModule}</h3>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1 mb-4">Modul Rekam Medis siap diisi.</p>
        <button onClick={() => setSelectedModule(null)} className="px-4 py-2 text-xs font-black uppercase bg-[var(--primary)] text-white rounded-xl">Kembali ke Dashboard Chart</button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-container-lowest)] overflow-hidden font-sans">
      
      {/* ─── 1. TOP HEADER & PATIENT CONTEXT RIBBON (CANONICAL INPATIENT TEMPLATE) ─── */}
      <header className="bg-[var(--surface-container-lowest)] border-b border-[var(--outline-variant)]/30 z-30 sticky top-0 shadow-sm">
        
        {/* Unit Branding Header */}
        <div className="px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#015C80] to-teal-700 flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">folder_shared</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                  PATIENT CHART (UNIFIED EMR)
                </span>
                <span className="text-[10px] font-bold text-[var(--on-surface-variant)]/60">JCI ACC, COP &amp; MOI</span>
              </div>
              <h1 className="text-base font-black text-[var(--on-surface)] tracking-tight uppercase">
                NurseFlow Enterprise Clinical Dossier
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPatientPickerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#015C80]/10 hover:bg-[#015C80] text-[#015C80] hover:text-white font-black text-xs transition-all flex items-center gap-1.5 border border-[#015C80]/20 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
              <span>Ganti Pasien Aktif</span>
            </button>
          </div>
        </div>

        {/* Dynamic Patient Context Ribbon */}
        {activePatient && (
          <div className="bg-[var(--surface-container-lowest)] px-6 py-3 grid grid-cols-12 gap-6 items-center border-t border-[var(--outline-variant)]/20">
            
            {/* Left: Patient Identity */}
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
              <div 
                onClick={() => setIsPatientPickerOpen(true)} 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#015C80] to-teal-600 flex items-center justify-center text-white shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform group"
                title="Klik untuk ganti pasien"
              >
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> JCI VERIFIED
                  </span>
                  <div 
                    onClick={() => {
                      if (!noRM || noRM === '-') return;
                      navigator.clipboard.writeText(noRM);
                      setIsMrnCopied(true);
                      toast.success(`No. RM (${noRM}) disalin!`, { icon: '📋' });
                      setTimeout(() => setIsMrnCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#015C80] hover:text-white px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                    title="Klik untuk salin No. RM"
                  >
                    <span>MRN: {noRM}</span>
                    {isMrnCopied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                  </div>
                </div>
                <h2 className="text-lg font-black text-[var(--on-surface)] uppercase truncate max-w-[260px]">{patientName}</h2>
                <div className="text-[10px] font-black text-[var(--on-surface-variant)] opacity-70 uppercase tracking-widest mt-0.5">
                  {age} • {activePatient?.demographics?.gender === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'} • NIK: {activePatient?.demographics?.nik || activePatient?.nik || '-'}
                </div>
              </div>
            </div>

            {/* Right: Encounter Status & Clinical Team Pills */}
            <div className="col-span-12 md:col-span-8 flex flex-col gap-2 items-end justify-center">
              <div className="flex flex-wrap items-center gap-2 justify-end">
                
                {/* No. Kunjungan */}
                {noReg && noReg !== '-' && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-container-high)] border border-[var(--outline-variant)]/40 rounded-xl">
                    <Hash size={11} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest">REG:</span>
                    <span className="text-[10px] font-black text-[var(--on-surface)] font-mono">{noReg}</span>
                  </div>
                )}

                {/* Encounter Type */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <span className="material-symbols-outlined text-[14px] text-blue-600">domain</span>
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase">{encounterType}</span>
                </div>

                {/* Location / Bed */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                  <Bed size={12} className="text-indigo-600" />
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 uppercase">
                    {activeEncounter?.room || 'Rawat Aktif'} • {activeEncounter?.bed || 'Bed Utama'}
                  </span>
                </div>

                {/* DPJP Utama */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-xl">
                  <UserCheck size={12} className="text-teal-600" />
                  <span className="text-[10px] font-black text-teal-700 dark:text-teal-300 uppercase">
                    DPJP: {activeEncounter?.doctor_name || 'dr. Alexander, Sp.PD'}
                  </span>
                </div>

                {/* Side Inspector Button */}
                <button
                  onClick={() => setIsDetailDrawerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#015C80]/15 border border-[#015C80]/30 rounded-xl text-[10px] font-black text-[#015C80] dark:text-cyan-300 hover:bg-[#015C80] hover:text-white transition-all cursor-pointer shadow-2xs"
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

      {/* ─── 2. MAIN WORKSPACE (SIDEBAR FORMULIR + CONTENT VIEW) ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Form Navigator Sidebar */}
        <aside className="w-80 bg-[var(--surface-container-lowest)] border-r border-[var(--outline-variant)]/30 flex flex-col h-full z-20 shrink-0">
          
          {/* Dashboard Chart Button */}
          <div className="p-3.5 border-b border-[var(--outline-variant)]/30 sticky top-0 z-10 shadow-2xs bg-[var(--surface-container-lowest)] flex flex-col gap-2">
            <button
              onClick={() => { setSelectedModule(null); setMainViewTab('OVERVIEW'); }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border cursor-pointer ${
                !selectedModule && mainViewTab === 'OVERVIEW'
                  ? 'bg-[#015C80] text-white border-[#015C80] shadow-md'
                  : 'bg-[var(--surface-container-high)] text-[var(--on-surface)] border-transparent hover:border-[#015C80]/40'
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Dashboard Patient Chart</span>
            </button>

            <button
              onClick={() => { setSelectedModule(null); setMainViewTab('TIMELINE'); }}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border cursor-pointer ${
                mainViewTab === 'TIMELINE'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">timeline</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Timeline Perjalanan Pasien</span>
            </button>
          </div>

          {/* Form Groups Accordion */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 pb-24">
            {filteredModuleGroups.map((group, idx) => {
              const isExpanded = expandedGroups[group.title];
              return (
                <div key={idx} className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline-variant)]/30 overflow-hidden shadow-2xs">
                  <button 
                    onClick={() => toggleGroup(group.title)} 
                    className="w-full flex items-center justify-between p-3 bg-[var(--surface-container-highest)] hover:bg-[var(--outline-variant)]/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[var(--on-surface)]">
                      {React.cloneElement(group.icon, { className: 'text-[#015C80]' })}
                      <span className="text-[10px] font-black uppercase tracking-widest text-left">{group.title}</span>
                    </div>
                    <ChevronDown size={14} className={`text-[var(--on-surface-variant)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="p-2 space-y-1">
                      {group.modules.map(mod => {
                        const isSelected = selectedModule === mod.name;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => { setSelectedModule(mod.name); setMainViewTab('MODULE'); }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left cursor-pointer ${
                              isSelected 
                                ? 'bg-[#015C80]/15 text-[#015C80] dark:text-cyan-400 border-[#015C80]/40 font-black' 
                                : 'bg-transparent text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {React.cloneElement(mod.icon, { size: 13, className: isSelected ? 'text-[#015C80]' : 'opacity-70' })}
                              <span className="text-[10px] font-bold truncate max-w-[190px]">{mod.name}</span>
                            </div>
                            {mod.highlight && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#015C80] animate-pulse"></div>}
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

        {/* Right Content Workspace */}
        <main className={`flex-1 bg-[var(--surface-container-lowest)] relative min-h-0 ${selectedModule ? 'h-full overflow-hidden p-0 flex flex-col' : 'p-6 lg:p-8 overflow-y-auto custom-scrollbar'}`}>
          {renderModuleWorkspace()}
        </main>
      </div>

      {/* ─── 3. MODALS (SEARCH, SWITCHER, INSPECTOR, PREVIEW) ──────── */}
      <GlobalPatientSearchModal 
        isOpen={isPatientPickerOpen} 
        onClose={() => setIsPatientPickerOpen(false)} 
        title="Ganti Pasien Aktif (Patient Chart)"
        mode="SWITCHER"
        onSelectPatient={(s) => { 
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

      {/* Document Preview & Audit Modal */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                  {previewRecord.moduleName || 'DOKUMEN REKAM MEDIS'}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {previewRecord.title || previewRecord.assessment || 'Detail Catatan Klinis'}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong>Catatan / Observasi:</strong>
                <p className="mt-1">{previewRecord.subjective || previewRecord.data?.catatan || JSON.stringify(previewRecord.data || {})}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Ditandatangani oleh: <strong>{previewRecord.doctor || previewRecord.signed_by || 'Staf Medis'}</strong></span>
                <span>Waktu: <strong>{previewRecord.created_at || 'Tersimpan'}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPreviewRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
