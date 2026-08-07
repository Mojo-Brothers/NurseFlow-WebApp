import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
  Droplets, PenTool, Clock, LayoutDashboard, ChevronDown, HeartPulse, Filter
} from 'lucide-react';
import { saveSoapNote, getPatientRecords, saveClinicalRecord } from '../services/emr.service.js';
import { DEMO_ENCOUNTERS } from '../../../core/demoData.js';
import CPPTWorkspace from '../components/CPPTWorkspace.jsx';
import CPOEWorkspace from '../components/CPOEWorkspace.jsx';
import InitialAssessment from '../components/InitialAssessment.jsx';
import SafetyDashboard from '../components/SafetyDashboard.jsx';
import PatientEducationForm from '../components/PatientEducationForm.jsx';
import DigitalInformedConsent from '../components/DigitalInformedConsent.jsx';
import TransferInternalForm from '../components/TransferInternalForm.jsx';
import ICUAdmissionCriteriaForm from '../components/ICUAdmissionCriteriaForm.jsx';
import AldreteScoreForm from '../components/AldreteScoreForm.jsx';
import SurgicalSafetyChecklistForm from '../components/SurgicalSafetyChecklistForm.jsx';
import ICUDischargeCriteriaForm from '../components/ICUDischargeCriteriaForm.jsx';
import SepsisSOFACriteriaForm from '../components/SepsisSOFACriteriaForm.jsx';
import PEWSForm from '../components/PEWSForm.jsx';
import MEOWSForm from '../components/MEOWSForm.jsx';
import BradenScaleForm from '../components/BradenScaleForm.jsx';
import RestraintAssessmentForm from '../components/RestraintAssessmentForm.jsx';
import DischargeReadinessForm from '../components/DischargeReadinessForm.jsx';
import PAPSForm from '../components/PAPSForm.jsx';
import WHOLabourCareGuideForm from '../components/WHOLabourCareGuideForm.jsx';
import MedicalCertificateCauseOfDeathForm from '../components/MedicalCertificateCauseOfDeathForm.jsx';
import BPOMMESOPharmacovigilanceForm from '../components/BPOMMESOPharmacovigilanceForm.jsx';
import WHOChildAnthropometryForm from '../components/WHOChildAnthropometryForm.jsx';
import WHOHandHygieneAuditForm from '../components/WHOHandHygieneAuditForm.jsx';
import PatientCarePanel from '../components/PatientCarePanel.jsx';
import PatientSearchModal from '../components/PatientSearchModal.jsx';

const JCI_MODULE_GROUPS = [
  {
    title: 'PELAYANAN PASIEN TERPADU (CARE)',
    icon: <Activity size={16} />,
    modules: [
      { id: 'patient-care-workspace', name: 'WORKSPACES PELAYANAN PASIEN', icon: <HeartPulse size={16} />, standard: 'JCI COP & ACC', highlight: true },
    ]
  },
  {
    title: 'PENGKAJIAN AWAL (AOP)',
    icon: <Search size={16} />,
    modules: [
      { id: 'initial-med', name: 'PENGKAJIAN AWAL MEDIS (RJ)', icon: <Stethoscope size={16} />, standard: 'AOP.1.1' },
      { id: 'initial-nurse', name: 'PENGKAJIAN AWAL KEPERAWATAN', icon: <ClipboardList size={16} />, standard: 'AOP.1.1' },
      { id: 'fall-risk', name: 'ASESMEN RISIKO JATUH', icon: <AlertTriangle size={16} />, standard: 'IPSG.6' },
      { id: 'braden-scale', name: 'SKALA BRADEN (DEKUBITUS)', icon: <Scale size={16} />, standard: 'COP.3', highlight: true },
      { id: 'who-anthropometry', name: 'ANTROPOMETRI & STUNTING (WHO-Z)', icon: <Scale size={16} />, standard: 'AOP.1.4', highlight: true },
      { id: 'nutritional', name: 'SKRINING GIZI (MST)', icon: <Activity size={16} />, standard: 'AOP.1.4' },
    ]
  },
  {
    title: 'CPPT & ASUHAN (COP)',
    icon: <ClipboardCheck size={16} />,
    modules: [
      { id: 'soap', name: 'SOAP NOTES (CPPT)', icon: <FileText size={16} />, standard: 'COP.2.1', highlight: true },
      { id: 'who-labour', name: 'PARTOGRAF & PERSALINAN (WHO)', icon: <Heart size={16} />, standard: 'COP.3.1', highlight: true },
      { id: 'pews', name: 'PEDIATRIC EWS (PEWS)', icon: <Activity size={16} />, standard: 'COP.3.1', highlight: true },
      { id: 'meows', name: 'OBSTETRIC EWS (MEOWS)', icon: <Heart size={16} />, standard: 'COP.3.1', highlight: true },
      { id: 'sepsis-sofa', name: 'SKRINING SEPSIS (qSOFA)', icon: <AlertCircle size={16} />, standard: 'COP.3', highlight: true },
      { id: 'restraint', name: 'ASESMEN RESTRAINT', icon: <ShieldAlert size={16} />, standard: 'COP.3.3', highlight: true },
      { id: 'icu-criteria', name: 'KRITERIA MASUK ICU', icon: <HeartPulse size={16} />, standard: 'COP.3 / ACC.3' },
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
    title: 'PENGELOLAAN OBAT (MMU)',
    icon: <Pill size={16} />,
    modules: [
      { id: 'cpoe', name: 'ORDER RESEP / CPOE', icon: <Pill size={16} />, standard: 'MMU.4', highlight: true },
      { id: 'bpom-meso', name: 'PELAPORAN MESO (BPOM-WHO)', icon: <AlertTriangle size={16} />, standard: 'MMU.7', highlight: true },
      { id: 'medication-list', name: 'DAFTAR PENGOBATAN', icon: <ClipboardList size={16} />, standard: 'MMU.4.1' },
      { id: 'emar', name: 'PEMBERIAN OBAT (eMAR)', icon: <Zap size={16} />, standard: 'MMU.6' },
      { id: 'drug-interaction', name: 'INTERAKSI & ALERGI', icon: <ShieldAlert size={16} />, standard: 'MMU.1' },
    ]
  },
  {
    title: 'HAK PASIEN & EDUKASI (PFR)',
    icon: <BookOpen size={16} />,
    modules: [
      { id: 'informed-consent', name: 'PERSETUJUAN TINDAKAN', icon: <FileSignature size={16} />, standard: 'PFR.5' },
      { id: 'paps-form', name: 'SURAT PAPS (AMA)', icon: <AlertTriangle size={16} />, standard: 'PFR.5.4', highlight: true },
      { id: 'hand-hygiene', name: 'AUDIT 5 MOMEN CUCI TANGAN', icon: <Droplets size={16} />, standard: 'PCI.9', highlight: true },
      { id: 'education', name: 'EDUKASI PASIEN', icon: <BookOpen size={16} />, standard: 'PFE.1' },
      { id: 'general-consent', name: 'GENERAL CONSENT', icon: <ClipboardCheck size={16} />, standard: 'PFR.1.1' },
    ]
  },
  {
    title: 'TRANSFER & PULANG (ACC)',
    icon: <LogOut size={16} />,
    modules: [
      { id: 'icu-transfer', name: 'KRITERIA & TRANSFER ICU', icon: <HeartPulse size={16} />, standard: 'ACC.3', highlight: true },
      { id: 'icu-discharge', name: 'STEP-DOWN / KELUAR ICU', icon: <LogOut size={16} />, standard: 'ACC.3', highlight: true },
      { id: 'transfer-internal', name: 'TRANSFER INTERNAL (SBAR)', icon: <LogOut size={16} />, standard: 'ACC.3' },
      { id: 'discharge-readiness', name: 'KESIAPAN PASIEN PULANG', icon: <ClipboardCheck size={16} />, standard: 'ACC.4', highlight: true },
      { id: 'death-certificate', name: 'SERTIFIKAT KEMATIAN (SMPK)', icon: <FileText size={16} />, standard: 'ACC.4 / WHO ICD', highlight: true },
      { id: 'medical-resume', name: 'RESUME MEDIS', icon: <ScrollText size={16} />, standard: 'ACC.4.2' },
    ]
  }
];

export default function OutpatientEMR() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isInpatientMode = location.pathname === '/emr-ri';
  
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters, setLiveContext, liveContext } = useEncounterStore();
  
  const [isPatientPickerOpen, setIsPatientPickerOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [previewRecord, setPreviewRecord] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeView, setActiveView] = useState('emr'); // 'emr' or 'safety'
  const [expandedGroups, setExpandedGroups] = useState({ 'CPPT & ASUHAN (COP)': true, 'TRANSFER & PULANG (ACC)': true });
  const [soapRecords, setSoapRecords] = useState([]);
  const [genericFormData, setGenericFormData] = useState({ observation: '', notes: '' });
  const [isGenericSaving, setIsGenericSaving] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyModuleFilter, setHistoryModuleFilter] = useState('ALL');

  useEffect(() => {
    fetchPatients().then(() => {
      const dewi = patients.find(p => p.id === 'demo-patient-dewi');
      if (dewi) {
        selectPatient(dewi.id);
      } else if (!selectedPatientId && patients.length > 0) {
        selectPatient(patients[0].id);
      }
    });
  }, [fetchPatients]);

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      const dewi = patients.find(p => p.id === 'demo-patient-dewi');
      selectPatient(dewi ? dewi.id : patients[0].id);
    }
  }, [patients, selectedPatientId, selectPatient]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientActiveEncounter(selectedPatientId);
      // Fetch historical records here for dashboard
      getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
  }, [selectedModule]);

  const activePatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || {}, [patients, selectedPatientId]);
  const activeEncounter = useMemo(() => {
    return (
      activeEncounters?.find(e => e.id === (selectedEncounterId || liveContext?.encounterId)) ||
      activeEncounters?.find(e => e.patient_id === selectedPatientId || e.patientId === selectedPatientId) ||
      DEMO_ENCOUNTERS.find(e => e.patient_id === selectedPatientId) ||
      {}
    );
  }, [activeEncounters, selectedEncounterId, liveContext, selectedPatientId]);

  const noReg = activeEncounter?.id ? activeEncounter.id.slice(-8).toUpperCase() : '-';
  const noRM = activePatient?.mrn || '-';
  const dob = activePatient?.demographics?.dob || '-';
  const age = activePatient?.id ? calculateAge(dob) : '-';
  const patientName = activePatient?.name || activeEncounter?.patient_name || 'PASIEN BELUM DIPILIH';

  const toggleGroup = (title) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const sortedSoapRecords = useMemo(() => {
    return [...soapRecords].sort((a, b) => {
      const aTime = a.created_at?.seconds ? a.created_at.seconds * 1000 : new Date(a.created_at?.toDate?.() || a.created_at || 0).getTime();
      const bTime = b.created_at?.seconds ? b.created_at.seconds * 1000 : new Date(b.created_at?.toDate?.() || b.created_at || 0).getTime();
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
  }, [soapRecords, historySearchQuery, historyModuleFilter]);

  const uniqueModulesInHistory = useMemo(() => {
    const modules = new Set(soapRecords.map(r => r.moduleName || 'SOAP NOTES (CPPT)'));
    return ['ALL', ...Array.from(modules)];
  }, [soapRecords]);

  const renderDashboardOverview = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black text-[var(--on-surface)] tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-[var(--primary)]" size={28} />
              Clinical Dashboard
            </h2>
            <p className="text-sm font-bold text-[var(--on-surface-variant)]/60 mt-1">Ikhtisar Rekam Medis & Riwayat Pasien</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Cards Grid (Vitals, Problems, Allergies, Risks) */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Recent Vitals Card */}
            <div className="h-full flex flex-col glass-panel rounded-3xl p-6 shadow-premium-soft border border-white/10 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface-variant)] mb-6 flex items-center gap-2 relative z-10">
                 <Activity size={16} className="text-[var(--primary)]" /> Tanda Vital Terakhir
               </h3>
               <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center bg-blue-500/5 p-3 rounded-2xl border border-blue-500/10 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Tekanan Darah</span>
                     <span className="text-lg font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.bp || '--'} <span className="text-[10px] text-[var(--on-surface-variant)]/50">mmHg</span></span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Detak Jantung</span>
                     <span className="text-lg font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.hr || '--'} <span className="text-[10px] text-[var(--on-surface-variant)]/50">bpm</span></span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Suhu</span>
                     <span className="text-lg font-black text-[var(--on-surface)]">{activeEncounter?.vitals?.temp || '--'} <span className="text-[10px] text-[var(--on-surface-variant)]/50">°C</span></span>
                  </div>
               </div>
            </div>

            {/* Active Problems / Diagnoses */}
            <div className="h-full flex flex-col glass-panel rounded-3xl p-6 shadow-premium-soft border border-white/10 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle size={100} className="text-red-500" /></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface-variant)] mb-6 flex items-center gap-2 relative z-10">
                 <AlertCircle size={16} className="text-red-500" /> Masalah Aktif / Diagnosis
               </h3>
               {sortedSoapRecords.length > 0 ? (
                  <div className="space-y-3 relative z-10">
                    {sortedSoapRecords.slice(0, 3).map((record, idx) => (
                      <div key={idx} className="p-3 bg-red-500/5 rounded-2xl border border-red-500/10 flex flex-col justify-center gap-1 min-h-[76px]">
                         <span className="text-[10px] font-black uppercase tracking-widest text-red-500/60">{new Date(record.created_at?.toDate?.() || record.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
                         <span className="text-sm font-bold text-[var(--on-surface)] line-clamp-2">
                           {record.assessment || record.data?.diagnosisKerja || record.data?.assessment || (record.moduleName === 'ORDER RESEP / CPOE' ? 'E-Prescription' : 'Diagnosis Tidak Spesifik')}
                         </span>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="flex flex-1 items-center justify-center relative z-10 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)]/50 uppercase tracking-widest">Belum Ada Diagnosis</span>
                  </div>
               )}
            </div>

            {/* Allergies Card */}
            <div className="h-full flex flex-col glass-panel rounded-3xl p-6 shadow-premium-soft border border-red-500/10 relative overflow-hidden group hover:border-red-500/30 transition-all bg-red-500/5">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ShieldAlert size={100} className="text-red-500" /></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2 relative z-10">
                 <ShieldAlert size={16} /> Alergi & Peringatan
               </h3>
               <div className="space-y-3 relative z-10">
                  {activePatient?.allergies?.length > 0 ? (
                    activePatient.allergies.map((alg, idx) => (
                      <div key={idx} className="flex flex-col justify-center p-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-red-500/20 min-h-[76px]">
                        <span className="text-xs font-bold text-red-600 uppercase flex items-center gap-1">
                          <AlertTriangle size={12} /> {alg.agent || 'Obat/Zat'}
                        </span>
                        <span className="text-[10px] text-[var(--on-surface-variant)] mt-1">Reaksi: {alg.reaction || 'Tidak diketahui'}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 text-center flex-1 flex items-center justify-center min-h-[76px]">
                      <span className="text-xs font-bold text-emerald-600 uppercase flex items-center justify-center gap-1">
                        <ShieldCheck size={14} /> Tidak Ada Alergi Diketahui
                      </span>
                    </div>
                  )}
               </div>
            </div>

            {/* Safety Risk Card */}
            <div className="h-full flex flex-col glass-panel rounded-3xl p-6 shadow-premium-soft border border-orange-500/10 relative overflow-hidden group hover:border-orange-500/30 transition-all bg-orange-500/5">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle size={100} className="text-orange-500" /></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-orange-600 mb-6 flex items-center gap-2 relative z-10">
                 <AlertTriangle size={16} /> Skrining Risiko
               </h3>
               <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-orange-500/20 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Risiko Jatuh</span>
                     <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${activePatient?.safety_flags?.fall_risk === 'HIGH' ? 'bg-red-500/20 text-red-600' : 'bg-orange-500/20 text-orange-600'}`}>{activePatient?.safety_flags?.fall_risk || 'BELUM DIKAJI'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-orange-500/20 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Risiko Dekubitus</span>
                     <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${activePatient?.safety_flags?.pressure_ulcer === 'HIGH' ? 'bg-red-500/20 text-red-600' : 'bg-emerald-500/20 text-emerald-600'}`}>{activePatient?.safety_flags?.pressure_ulcer || 'RENDAH'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-orange-500/20 min-h-[76px]">
                     <span className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Isolasi</span>
                     <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-500/20 text-blue-600">{activePatient?.safety_flags?.isolation === 'NONE' ? 'TIDAK PERLU' : (activePatient?.safety_flags?.isolation || 'STANDAR')}</span>
                  </div>
               </div>
            </div>
          </div>

           {/* Recent Timeline */}
          <div className="col-span-1 lg:relative min-h-[500px] lg:min-h-0">
             <div className="lg:absolute lg:inset-0 flex flex-col h-full w-full">
                <div className="h-full glass-panel rounded-3xl p-6 shadow-premium-soft border border-white/10 relative overflow-hidden group hover:border-[var(--primary)]/30 transition-all flex flex-col">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><History size={100} /></div>
             <h3 className="text-sm font-black uppercase tracking-widest text-[var(--on-surface-variant)] mb-6 flex items-center gap-2 relative z-10">
               <History size={16} className="text-purple-500" /> Histori Rekam Medis
             </h3>
             <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-2">
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--primary)] before:to-transparent">
                   {sortedSoapRecords.length > 0 ? sortedSoapRecords.map((r, i) => (
                      <div 
                        key={i} 
                        onClick={() => setPreviewRecord(r)}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active cursor-pointer"
                        title="Klik untuk lihat detail"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-[var(--primary)] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]/30 shadow-sm transition-all">
                           <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black uppercase text-[var(--primary)]">{r.moduleName || 'CPPT'}</span>
                              <span className="text-[8px] font-bold text-[var(--on-surface-variant)]/60">{new Date(r.created_at?.toDate?.() || r.created_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                           </div>
                           <p className="text-xs font-medium text-[var(--on-surface)] line-clamp-1">{r.doctor || r.signed_by}</p>
                        </div>
                      </div>
                   )) : (
                     <div className="text-center text-xs font-bold text-[var(--on-surface-variant)]/50 uppercase tracking-widest pt-8">
                       Belum ada histori
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
        </div>
        </div>

        {/* ─── DAFTAR FORMULIR YANG SUDAH TERISI & DITANDATANGANI ─── */}
        <div className="mt-8 bg-[var(--surface-container-lowest)] rounded-3xl p-6 lg:p-8 border border-[var(--outline-variant)]/30 shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-y-4 gap-x-6">
            <div className="flex-1 min-w-[300px]">
              <h3 className="text-lg font-black tracking-tight text-[var(--on-surface)] uppercase flex items-center gap-2">
                <FileSignature className="text-[var(--primary)] shrink-0" size={22} />
                Berkas Rekam Medis Pasien Terisi & Sah ({filteredSoapRecords.length})
              </h3>
              <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                Semua formulir klinis di bawah ini telah ditandatangani secara digital dan tersimpan dalam audit trail yang immutable.
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
                      {rec.assessment || rec.data?.tindakan || rec.data?.topik || rec.data?.situation || 'Dokumen Rekam Medis'}
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
                        onClick={() => setSelectedModule(rec.moduleName || 'SOAP NOTES (CPPT)')}
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
  };

  const renderModuleWorkspace = () => {
    if (!selectedModule) return renderDashboardOverview();

    const moduleInfo = JCI_MODULE_GROUPS.flatMap(g => g.modules).find(m => m.name === selectedModule);

    // CPPT specialized workspace
    if (selectedModule === 'WORKSPACES PELAYANAN PASIEN' || selectedModule === 'patient-care-workspace') {
      return (
        <PatientCarePanel 
          patient={activePatient}
          encounter={activeEncounter}
          onDischargeSuccess={() => {
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SOAP NOTES (CPPT)') {
      return (
        <CPPTWorkspace 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => {
            setSelectedModule(null);
            getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'ORDER RESEP / CPOE') {
      return (
        <CPOEWorkspace 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'PENGKAJIAN AWAL MEDIS (RJ)') {
      return (
        <InitialAssessment 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'EDUKASI PASIEN') {
      return (
        <PatientEducationForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'PERSETUJUAN TINDAKAN') {
      return (
        <DigitalInformedConsent 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'TRANSFER INTERNAL (SBAR)') {
      return (
        <TransferInternalForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'KRITERIA & TRANSFER ICU' || selectedModule === 'KRITERIA MASUK ICU') {
      return (
        <ICUAdmissionCriteriaForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SKOR ALDRETE & PACU') {
      return (
        <AldreteScoreForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'CHECKLIST BEDAH (WHO)') {
      return (
        <SurgicalSafetyChecklistForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'STEP-DOWN / KELUAR ICU') {
      return (
        <ICUDischargeCriteriaForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SKRINING SEPSIS (qSOFA)') {
      return (
        <SepsisSOFACriteriaForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'PEDIATRIC EWS (PEWS)') {
      return (
        <PEWSForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'OBSTETRIC EWS (MEOWS)') {
      return (
        <MEOWSForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SKALA BRADEN (DEKUBITUS)') {
      return (
        <BradenScaleForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'ASESMEN RESTRAINT') {
      return (
        <RestraintAssessmentForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'KESIAPAN PASIEN PULANG') {
      return (
        <DischargeReadinessForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SURAT PAPS (AMA)') {
      return (
        <PAPSForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'PARTOGRAF & PERSALINAN (WHO)') {
      return (
        <WHOLabourCareGuideForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'SERTIFIKAT KEMATIAN (SMPK)') {
      return (
        <MedicalCertificateCauseOfDeathForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'PELAPORAN MESO (BPOM-WHO)') {
      return (
        <BPOMMESOPharmacovigilanceForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'ANTROPOMETRI & STUNTING (WHO-Z)') {
      return (
        <WHOChildAnthropometryForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    if (selectedModule === 'AUDIT 5 MOMEN CUCI TANGAN') {
      return (
        <WHOHandHygieneAuditForm 
          patient={activePatient}
          encounter={activeEncounter}
          onClose={() => setSelectedModule(null)}
          onSaveSuccess={() => { 
             setSelectedModule(null);
             getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
          }}
        />
      );
    }

    const handleGenericSave = async () => {
      if (!genericFormData.notes) {
        alert("Catatan Deskriptif / Evaluasi wajib diisi untuk Audit Trail JCI!");
        return;
      }
      setIsGenericSaving(true);
      try {
        await saveClinicalRecord({
          patientId: selectedPatientId,
          encounterId: selectedEncounterId || liveContext?.encounterId,
          author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
          moduleName: selectedModule,
          data: genericFormData
        });
        alert(`Data ${selectedModule} berhasil disimpan.`);
        setSelectedModule(null);
        setGenericFormData({ observation: '', notes: '' });
        getPatientRecords(selectedPatientId).then(setSoapRecords).catch(console.error);
      } catch(e) {
        alert('Gagal menyimpan: ' + e.message);
      } finally {
        setIsGenericSaving(false);
      }
    };

    // Generic Workspace for other modules (Smart Form Engine)
    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedModule(null)}
              className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200 dark:border-white/10"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                  Standard {moduleInfo?.standard || 'JCI'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                  Audit Ready
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{selectedModule}</h3>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20">
             {moduleInfo?.icon || <FileText size={20} />}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] flex-1 relative overflow-y-auto custom-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform -rotate-12">
            {moduleInfo?.icon ? React.cloneElement(moduleInfo.icon, { size: 400 }) : <FileText size={400} />}
          </div>
          
          <div className="relative z-10 p-8 lg:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
               
               {/* Minimalist Header Guide */}
               <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                     <Info size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Audit Trail Active (Standard {moduleInfo?.standard || 'JCI'})</h4>
                     <p className="text-[11px] font-medium text-slate-500 dark:text-slate-500 mt-1 leading-relaxed max-w-2xl">
                        Dokumen ini akan ditandatangani secara digital atas nama <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser?.displayName || currentUser?.email}</span>. Semua entri tidak dapat dihapus setelah difinalisasi.
                     </p>
                  </div>
               </div>

               {/* Smart Form: Interactive Toggles (Ultra-Minimalist) */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-50/50 dark:bg-[var(--surface-container-lowest)]/50 rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors shadow-sm">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Prioritas Penanganan</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Cito / Segera</p>
                   </div>
                   <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center p-1 cursor-pointer transition-colors hover:bg-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                     <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                   </div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[var(--surface-container-lowest)]/50 rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors shadow-sm">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Kepatuhan Edukasi</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Edukasi telah diberikan</p>
                   </div>
                   <div className="w-10 h-5 bg-blue-500 rounded-full flex items-center justify-end p-1 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                     <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"></div>
                   </div>
                 </div>
               </div>

               {/* Smart Form: Seamless Inputs */}
               <div className="space-y-8">
                  <div className="group">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-blue-500 transition-colors flex items-center gap-2 mb-3 ml-2">
                        Data Kuantitatif / Observasi
                     </label>
                     <input 
                        type="text" 
                        value={genericFormData.observation}
                        onChange={(e) => setGenericFormData({...genericFormData, observation: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[var(--surface-container-lowest)] border-2 border-dashed border-slate-300 focus:border-solid focus:border-blue-500 dark:border-slate-700 rounded-2xl p-5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all placeholder:text-slate-400" 
                        placeholder="Contoh: Tekanan darah stabil, tidak ada nyeri tekan..." 
                     />
                  </div>
                  <div className="group">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-blue-500 transition-colors flex items-center gap-2 mb-3 ml-2">
                        Catatan Deskriptif / Evaluasi *
                     </label>
                     <textarea 
                        value={genericFormData.notes}
                        onChange={(e) => setGenericFormData({...genericFormData, notes: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-[var(--surface-container-lowest)] border-2 border-dashed border-slate-300 focus:border-solid focus:border-blue-500 dark:border-slate-700 rounded-3xl p-6 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[250px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] placeholder:text-slate-400 resize-none"
                        placeholder={`Ketikkan catatan naratif medis secara detail di sini...`}
                     />
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-row justify-end items-center gap-4 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm shrink-0">
          <button 
            onClick={() => setSelectedModule(null)}
            disabled={isGenericSaving}
            className="bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleGenericSave}
            disabled={isGenericSaving || !genericFormData.notes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:active:scale-100 group"
          >
            {isGenericSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldAlert size={16} className="group-hover:scale-110 transition-transform" />} 
            Finalisasi Dokumen
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden font-sans">
      
      {/* ─── COCKPIT HEADER ─── */}
      <header className="flex-none bg-[var(--surface)] border-b border-[var(--outline-variant)]/40 shadow-sm z-50">
        <div className="px-6 py-3 flex justify-between items-center bg-[var(--surface)]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[var(--on-surface)] leading-none uppercase">Electronic Medical Record</h1>
              <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.3em] mt-1">
                {isInpatientMode ? 'Inpatient • Rawat Inap' : 'Outpatient • IGD'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPatientPickerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-container-high)] hover:bg-[var(--primary)] hover:text-white text-[var(--on-surface)] rounded-xl border border-[var(--outline-variant)]/40 text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              <UserPlus size={15} className="text-[var(--primary)] group-hover:text-white" />
              <span>Ganti Pasien / Antrean</span>
            </button>
          </div>
        </div>

        {/* Patient Context Ribbon */}
        {selectedPatientId && (
          <div className="bg-[var(--surface-container-lowest)] px-6 py-3 grid grid-cols-12 gap-6 items-center border-t border-[var(--outline-variant)]/20">
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
              <div 
                onClick={() => setIsPatientPickerOpen(true)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-blue-700 flex items-center justify-center text-white shadow-md relative overflow-hidden shrink-0 cursor-pointer hover:scale-105 transition-transform group"
                title="Klik untuk ganti pasien"
              >
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> JCI VERIFIED
                  </span>
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest opacity-80">MRN: {noRM}</span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 
                    onClick={() => setIsPatientPickerOpen(true)}
                    className="text-xl font-black text-[var(--on-surface)] tracking-tighter leading-tight uppercase truncate max-w-[300px] cursor-pointer hover:text-[var(--primary)] transition-colors"
                  >
                    {patientName}
                  </h2>
                  <button 
                    onClick={() => setIsPatientPickerOpen(true)}
                    className="p-1 hover:bg-[var(--surface-container-high)] rounded-lg text-[var(--on-surface-variant)] transition-colors"
                    title="Ganti Pasien"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                <div className="text-[10px] font-black text-[var(--on-surface-variant)] opacity-70 uppercase tracking-widest mt-0.5">
                  {age} • {activePatient?.demographics?.gender === 'M' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-8 flex justify-end gap-3">
              {activePatient?.allergies?.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 shadow-inner">
                  <ShieldAlert size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alergi: {activePatient.allergies[0].agent}</span>
                </div>
              )}
              {activePatient?.safety_flags?.fall_risk === 'HIGH' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-700 shadow-inner animate-pulse">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Risiko Jatuh Tinggi</span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─── MAIN LAYOUT (SIDEBAR + WORKSPACE) ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT SIDEBAR: NAVIGATION */}
        <aside className="w-72 bg-[var(--surface-container-lowest)] border-r border-[var(--outline-variant)]/30 flex flex-col h-full z-20">
          <div className="p-4 border-b border-[var(--outline-variant)]/30 bg-[var(--surface-container-lowest)] sticky top-0 z-10 shadow-sm">
            <button 
              onClick={() => setSelectedModule(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${!selectedModule ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20' : 'bg-[var(--surface-container-high)] text-[var(--on-surface)] border-transparent hover:border-[var(--outline-variant)]'}`}
            >
              <LayoutDashboard size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Dashboard EMR</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 pb-20">
            {JCI_MODULE_GROUPS.map((group, idx) => {
              const isExpanded = expandedGroups[group.title];
              return (
                <div key={idx} className="bg-[var(--surface-container-low)] rounded-2xl border border-[var(--outline-variant)]/30 overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between p-3.5 bg-[var(--surface-container-highest)] hover:bg-[var(--outline-variant)]/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-[var(--on-surface)]">
                      {React.cloneElement(group.icon, { className: 'text-[var(--primary)]' })}
                      <span className="text-[10px] font-black uppercase tracking-widest text-left">{group.title}</span>
                    </div>
                    <ChevronDown size={14} className={`text-[var(--on-surface-variant)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`transition-all duration-300 ease-in-out origin-top ${isExpanded ? 'max-h-[800px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-0'}`}>
                    <div className="p-2 space-y-1 bg-gradient-to-b from-black/5 to-transparent">
                      {group.modules.map(mod => {
                        const isSelected = selectedModule === mod.name;
                        return (
                          <button
                            key={mod.id}
                            onClick={() => setSelectedModule(mod.name)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border text-left ${
                              isSelected 
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30 shadow-inner' 
                              : 'bg-transparent text-[var(--on-surface-variant)] border-transparent hover:bg-[var(--surface-container-high)] hover:text-[var(--on-surface)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                               {React.cloneElement(mod.icon, { size: 14, className: isSelected ? 'text-[var(--primary)]' : 'opacity-70' })}
                               <span className={`text-[10px] font-bold ${isSelected ? 'text-[var(--primary)] font-black' : ''}`}>{mod.name}</span>
                            </div>
                            {mod.highlight && !isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></div>}
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

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 bg-[var(--surface-container-lowest)] p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">
          
          {/* Subtle Background Elements */}
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

          <div className="relative z-10 min-h-full flex flex-col max-w-[1400px] mx-auto pb-16">
             {!selectedPatientId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-[var(--surface-container-high)] rounded-[2rem] flex items-center justify-center text-[var(--primary)] shadow-inner mb-6 border border-[var(--outline-variant)]/30">
                    <User size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-[var(--on-surface)] tracking-tight mb-2">Pilih Pasien</h3>
                  <p className="text-sm font-medium text-[var(--on-surface-variant)] mb-8">Harap masuk melalui Modul Kunjungan (Encounters) atau pilih pasien di bawah ini untuk memulai pencatatan EMR.</p>
                  
                  <div className="w-full flex flex-col gap-3">
                     {patients.slice(0, 3).map(p => (
                        <button 
                           key={p.id}
                           onClick={() => selectPatient(p.id)}
                           className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--primary)]/10 border border-[var(--outline-variant)]/30 hover:border-[var(--primary)]/30 transition-all text-left group"
                        >
                           <div className="w-10 h-10 rounded-full bg-[var(--surface-container-high)] group-hover:bg-[var(--primary)] group-hover:text-white flex items-center justify-center transition-colors">
                              <User size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">{p.name}</p>
                              <p className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mt-0.5">MRN: {p.mrn} • {p.demographics?.gender === 'M' ? 'L' : 'P'}</p>
                           </div>
                        </button>
                     ))}
                  </div>
                </div>
             ) : (
               renderModuleWorkspace()
             )}
          </div>
        </main>

      </div>

      {/* ─── PATIENT PICKER MODAL (ENTERPRISE MASTERPIECE) ─── */}
      {/* ─── OFFICIAL COMMAND CENTER PATIENT SEARCH MODAL ─── */}
      <PatientSearchModal 
        isOpen={isPatientPickerOpen} 
        onClose={() => setIsPatientPickerOpen(false)} 
        onSelect={(selected) => {
          selectPatient(selected.patientId || selected.id);
          setSelectedModule(null);
          setIsPatientPickerOpen(false);
        }} 
      />

      {/* ─── DOCUMENT PREVIEW & AUDIT MODAL (JCI CERTIFIED) ─── */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-container-lowest)] rounded-3xl border border-[var(--outline-variant)]/40 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-[var(--outline-variant)]/30 flex items-center justify-between bg-[var(--surface-container-low)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      JCI Immutable Record
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)] font-bold">
                      {new Date(previewRecord.created_at?.toDate?.() || previewRecord.created_at || Date.now()).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[var(--on-surface)] tracking-tight uppercase mt-0.5">
                    {previewRecord.moduleName || 'REKAM MEDIS'}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setPreviewRecord(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-500 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Patient info snippet */}
              <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">Pasien</span>
                  <p className="text-sm font-black text-[var(--on-surface)]">{activePatient?.name || previewRecord.patientName}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">No. RM</span>
                  <p className="text-sm font-black text-[var(--primary)]">{activePatient?.mrn || '009944'}</p>
                </div>
              </div>

              {/* Record Content Dynamic */}
              {previewRecord.subjective && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">S — Subjektif (Anamnesis / Keluhan)</label>
                  <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 text-xs font-medium text-[var(--on-surface)] leading-relaxed">
                    {previewRecord.subjective}
                  </div>
                </div>
              )}

              {previewRecord.objective && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">O — Objektif (Pemeriksaan Fisik & Penunjang)</label>
                  <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 text-xs font-medium text-[var(--on-surface)] leading-relaxed">
                    {previewRecord.objective}
                  </div>
                </div>
              )}

              {previewRecord.assessment && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-red-500">A — Asesmen / Diagnosis Kerja</label>
                  <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-xs font-bold text-red-600 leading-relaxed">
                    {previewRecord.assessment}
                  </div>
                </div>
              )}

              {previewRecord.plan_instructions && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-500">P — Plan / Rencana Tindakan</label>
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs font-medium text-[var(--on-surface)] leading-relaxed">
                    {previewRecord.plan_instructions}
                  </div>
                </div>
              )}

              {/* Data object for structured forms (Informed consent, Education, SBAR) */}
              {previewRecord.data && Object.keys(previewRecord.data).length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Rincian Formulir Khusus</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(previewRecord.data)
                      .filter(([key]) => key !== 'patientSignatureBase64')
                      .map(([key, val]) => {
                        // Render Prescriptions Beautifully
                        if (key === 'prescriptions' && Array.isArray(val)) {
                          return (
                            <div key={key} className="md:col-span-2 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3 block">DAFTAR E-RESEP / CPOE</span>
                              <div className="space-y-2">
                                {val.map((item, idx) => (
                                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div>
                                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{item.name}</span>
                                      <span className="text-[10px] text-slate-500">{item.form} • {item.category}</span>
                                    </div>
                                    <div className="flex gap-4 text-xs bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                                      <div><span className="text-[9px] text-slate-400 block uppercase">Dosis/Rute</span><strong className="text-slate-700 dark:text-slate-300">{item.dose} ({item.route})</strong></div>
                                      <div><span className="text-[9px] text-slate-400 block uppercase">Signa</span><strong className="text-slate-700 dark:text-slate-300">{item.frequency}</strong></div>
                                      <div><span className="text-[9px] text-slate-400 block uppercase">Durasi</span><strong className="text-slate-700 dark:text-slate-300">{item.duration}</strong></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        // Render CDSS Warnings Beautifully
                        if ((key === 'interactions' || key === 'allergyWarnings') && Array.isArray(val) && val.length > 0) {
                          return (
                            <div key={key} className="md:col-span-2 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20">
                              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 block">CDSS WARNING: {key.toUpperCase()}</span>
                              <div className="space-y-2">
                                {val.map((item, idx) => (
                                  <div key={idx} className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 p-2.5 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                                    {key === 'allergyWarnings' ? `⚠️ Alergi ${item.drugName} (${item.allergen}): ${item.reason}` : `⚠️ Interaksi ${item.drugA} + ${item.drugB}: ${item.desc}`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        // Fallback for empty arrays like interactions: []
                        if (Array.isArray(val) && val.length === 0) return null;

                        // Default Render
                        return (
                          <div key={key} className="p-3 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">{key}</span>
                            <p className="text-xs font-bold text-[var(--on-surface)] mt-0.5">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Dual Digital Signature Section */}
              <div className="pt-4 border-t border-[var(--outline-variant)]/30 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">
                  Otentikasi & Verifikasi Tanda Tangan (JCI PFR.5)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DPJP Card */}
                  <div className="p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <FileSignature size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">Tanda Tangan DPJP</span>
                        <p className="text-xs font-black text-[var(--on-surface)]">{previewRecord.doctor || previewRecord.signed_by || 'Dr. Robby Viory, Sp.B'}</p>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} /> Terverifikasi SSO
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Signature Card */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Tanda Tangan Pasien / Saksi</span>
                        <p className="text-xs font-black text-[var(--on-surface)]">
                          {previewRecord.data?.saksi || activePatient?.name || 'Ny. Dewi Sartika, S.Pd'}
                        </p>
                        <span className="text-[9px] text-emerald-600 font-bold">
                          {previewRecord.data?.witnessSignature || 'Sah Digital via Tablet/HP'}
                        </span>
                      </div>
                    </div>

                    {(previewRecord.data?.patientSignatureBase64 || previewRecord.patientSignatureBase64) && (
                      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-sm flex items-center justify-center">
                        <img 
                          src={previewRecord.data?.patientSignatureBase64 || previewRecord.patientSignatureBase64} 
                          alt="Tanda Tangan Pasien" 
                          className="h-10 max-w-[110px] object-contain filter dark:invert" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--outline-variant)]/20 bg-[var(--surface-container-low)] flex justify-end gap-3">
              <button
                onClick={() => {
                  const targetModule = previewRecord.moduleName;
                  setPreviewRecord(null);
                  setSelectedModule(targetModule);
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md"
              >
                Buka Formulir di Workspace 📝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
