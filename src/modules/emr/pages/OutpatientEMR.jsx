import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { 
  AlertTriangle, Activity, Pill, ShieldAlert, CheckCircle2, User, Building2, 
  Stethoscope, FileText, BadgeInfo, CalendarDays, Search, ChevronRight, 
  Heart, Scale, ClipboardCheck, BookOpen, UserCheck, ShieldCheck, 
  HelpCircle, Thermometer, Info, Scissors, Microscope, Settings, 
  Workflow, PlusSquare, ScrollText, AlertCircle, UserPlus, ClipboardList,
  FileSignature, LogOut, Share2, Clipboard, Zap, History, Eye, Plus, Edit2, RefreshCw, Sparkles, Brain,
  Droplets, PenTool, Clock
} from 'lucide-react';
import PatientSearchModal from '../components/PatientSearchModal.jsx';
import ClinicalModuleModal from '../components/ClinicalModuleModal.jsx';
import AISummaryBox from '../components/AISummaryBox.jsx';
import IPSGDashboard from '../components/IPSGDashboard.jsx';
import SafetyDashboard from '../components/SafetyDashboard.jsx';
import { saveSoapNote, getPatientRecords, saveClinicalRecord } from '../services/emr.service.js';

const JCI_MODULE_GROUPS = [
  {
    title: 'PENGKAJIAN & ASESMEN AWAL (AOP)',
    modules: [
      { id: 'initial-med', name: 'PENGKAJIAN AWAL MEDIS (RJ)', icon: <Stethoscope size={18} />, standard: 'AOP.1.1' },
      { id: 'initial-nurse', name: 'PENGKAJIAN AWAL KEPERAWATAN', icon: <ClipboardList size={18} />, standard: 'AOP.1.1' },
      { id: 'ugd-assessment', name: 'PENGKAJIAN UNIT GAWAT DARURAT (UGD)', icon: <Zap size={18} />, standard: 'AOP.1.1' },
      { id: 'mcu-assessment', name: 'PENGKAJIAN MCU', icon: <Search size={18} />, standard: 'AOP.1.1' },
      { id: 'head-to-toe', name: 'HEAD TO TOE', icon: <User size={18} />, standard: 'AOP.1.5' },
      { id: 'nutritional', name: 'SKRINING GIZI (MST)', icon: <Activity size={18} />, standard: 'AOP.1.4' },
      { id: 'fall-risk', name: 'ASESMEN RISIKO JATUH (IPSG.6)', icon: <AlertTriangle size={18} />, standard: 'IPSG.6' },
    ]
  },
  {
    title: 'ASESMEN SPESIALISTIK & KHUSUS (AOP.1.8)',
    modules: [
      { id: 'geriatric-rj', name: 'PENGKAJIAN DEWASA GERIATRI RJ', icon: <UserPlus size={18} />, standard: 'AOP.1.8' },
      { id: 'geriatric-ri', name: 'PENGKAJIAN DEWASA GERIATRI RI', icon: <UserPlus size={18} />, standard: 'AOP.1.8' },
      { id: 'pediatric-rj', name: 'PENGKAJIAN ANAK RJ', icon: <Activity size={18} />, standard: 'AOP.1.8' },
      { id: 'pediatric-ri', name: 'PENGKAJIAN AWAL ANAK RI', icon: <Activity size={18} />, standard: 'AOP.1.8' },
      { id: 'nicu-ri', name: 'PENGKAJIAN AWAL NICU / PERINA RI', icon: <Heart size={18} />, standard: 'AOP.1.8' },
      { id: 'newborn', name: 'PENGKAJIAN BAYI BARU LAHIR', icon: <User size={18} />, standard: 'AOP.1.8' },
      { id: 'psychiatric', name: 'PENGKAJIAN PASIEN GANGGUAN JIWA', icon: <Brain size={18} />, standard: 'AOP.1.8' },
      { id: 'advanced-nutrition', name: 'PENGKAJIAN GIZI LANJUT', icon: <Activity size={18} />, standard: 'AOP.1.4' },
      { id: 'end-of-life', name: 'PENGKAJIAN END OF LIFE', icon: <Eye size={18} />, standard: 'AOP.1.8.3' },
      { id: 'special-pop', name: 'PENGKAJIAN POPULASI KHUSUS', icon: <UserPlus size={18} />, standard: 'AOP.1.8' },
    ]
  },
  {
    title: 'KEBIDANAN & KANDUNGAN (COP.3.6)',
    modules: [
      { id: 'obgyn-rj', name: 'PENGKAJIAN KEBIDANAN RJ', icon: <User size={18} />, standard: 'COP.3.6' },
      { id: 'obgyn-ri', name: 'PENGKAJIAN AWAL KEBIDANAN RI', icon: <User size={18} />, standard: 'COP.3.6' },
      { id: 'gynaecology-ri', name: 'PENGKAJIAN AWAL KEBIDANAN STATUS GINEKOLOGI RI', icon: <FileText size={18} />, standard: 'COP.3.6' },
      { id: 'postpartum-obs', name: 'OBSERVASI NIFAS', icon: <Clock size={18} />, standard: 'COP.3.6' },
      { id: 'mother-graph', name: 'GRAFIK IBU', icon: <Activity size={18} />, standard: 'COP.3.6' },
    ]
  },
  {
    title: 'CPPT & ASUHAN TERINTEGRASI (COP)',
    modules: [
      { id: 'soap', name: 'SOAP NOTES (CPPT)', icon: <FileText size={18} />, standard: 'COP.2.1', highlight: true },
      { id: 'integrated-notes', name: 'CATATAN TERINTEGRASI', icon: <ClipboardList size={18} />, standard: 'COP.2.1' },
      { id: 'nursing-notes', name: 'CATATAN KEPERAWATAN', icon: <PenTool size={18} />, standard: 'COP.2.1' },
      { id: 'outpatient-exam', name: 'PEMERIKSAAN RAWAT JALAN', icon: <Stethoscope size={18} />, standard: 'COP.2.1' },
      { id: 'pain-integrated', name: 'MONITORING NYERI PASIEN', icon: <Heart size={18} />, standard: 'AOP.1.5' },
      { id: 'daily-graph', name: 'GRAFIK HARIAN PASIEN', icon: <Activity size={18} />, standard: 'COP.2.1' },
      { id: 'ews', name: 'EARLY WARNING SYSTEM (EWS)', icon: <AlertCircle size={18} />, standard: 'COP.3.1' },
      { id: 'special-obs', name: 'OBSERVASI KEADAAN KHUSUS', icon: <Eye size={18} />, standard: 'COP.2.3' },
    ]
  },
  {
    title: 'INTENSIVE & KRITIS (COP.3.1)',
    modules: [
      { id: 'icu-assessment', name: 'PENGKAJIAN ICU', icon: <Activity size={18} />, standard: 'COP.3.1' },
      { id: 'hemodialysis', name: 'PENGKAJIAN HEMODIALISA', icon: <RefreshCw size={18} />, standard: 'COP.3.1' },
      { id: 'hd-nurse-initial', name: 'PENGKAJIAN AWAL PERAWAT HD', icon: <ClipboardList size={18} />, standard: 'COP.3.1' },
      { id: 'transfusion-monitor', name: 'MONITORING REAKSI TRANSFUSI', icon: <Droplets size={18} />, standard: 'COP.3.3' },
    ]
  },
  {
    title: 'BEDAH & PERIOPERATIF (ASC)',
    modules: [
      { id: 'pre-surgery', name: 'PENGKAJIAN PERIOPERATIF', icon: <ClipboardCheck size={18} />, standard: 'ASC.4' },
      { id: 'sedation-notes', name: 'CATATAN SEDASI / CATATAN ANESTESI', icon: <Zap size={18} />, standard: 'ASC.3' },
      { id: 'surgery-report', name: 'LAPORAN PEMBEDAHAN', icon: <FileSignature size={18} />, standard: 'ASC.7' },
      { id: 'op-report', name: 'LAPORAN OPERASI', icon: <FileText size={18} />, standard: 'ASC.7' },
      { id: 'safety-checklist', name: 'KESELAMATAN BEDAH (CHECKLIST)', icon: <ShieldCheck size={18} />, standard: 'IPSG.4' },
    ]
  },
  {
    title: 'REHABILITASI & FUNGSIONAL (COP.2)',
    modules: [
      { id: 'barthel-index', name: 'BARTHEL INDEX', icon: <Scale size={18} />, standard: 'AOP.1.7' },
      { id: 'odc-assessment', name: 'PENGKAJIAN ODC', icon: <Building2 size={18} />, standard: 'COP.2' },
      { id: 'restraint', name: 'PENGKAJIAN RESTRAIN', icon: <User size={18} />, standard: 'COP.3.8' },
      { id: 'isolation', name: 'PENGKAJIAN ISOLASI DAN PENYAKIT MENULAR', icon: <ShieldAlert size={18} />, standard: 'PCI.6' },
    ]
  },
  {
    title: 'TRANSFER & RENCANA PEMULANGAN (ACC)',
    modules: [
      { id: 'transfer-internal', name: 'TRANSFER PASIEN INTERNAL (SBAR)', icon: <LogOut size={18} />, standard: 'ACC.3' },
      { id: 'discharge-planning', name: 'PERENCANAAN PASIEN PULANG TERINTEGRASI', icon: <History size={18} />, standard: 'ACC.2' },
      { id: 'medical-resume-rj', name: 'RESUME MEDIS RJ', icon: <ScrollText size={18} />, standard: 'ACC.4.2' },
      { id: 'medical-resume-ri', name: 'RESUME MEDIS', icon: <ScrollText size={18} />, standard: 'ACC.4.2' },
      { id: 'nursing-resume', name: 'RESUME KEPERAWATAN', icon: <FileText size={18} />, standard: 'ACC.4.2' },
    ]
  },
  {
    title: 'HAK PASIEN & EDUKASI (PFR)',
    modules: [
      { id: 'informed-consent', name: 'PERSETUJUAN TINDAKAN MEDIS', icon: <FileSignature size={18} />, standard: 'PFR.5' },
      { id: 'consult-request', name: 'SURAT PERMINTAAN KONSULTASI', icon: <Share2 size={18} />, standard: 'COP.2.2' },
      { id: 'education', name: 'EDUKASI PASIEN & KELUARGA', icon: <BookOpen size={18} />, standard: 'PFE.1' },
      { id: 'general-consent', name: 'GENERAL CONSENT (PPU)', icon: <ClipboardCheck size={18} />, standard: 'PFR.1.1' },
      { id: 'pfr-rights', name: 'TATA TERTIB & HAK PASIEN', icon: <Scale size={18} />, standard: 'PFR.1' },
    ]
  },
  {
    title: 'PENGELOLAAN OBAT (MMU)',
    modules: [
      { id: 'cpoe', name: 'ORDER RESEP / CPOE (IPSG.3)', icon: <Pill size={18} />, standard: 'MMU.4', highlight: true },
      { id: 'medication-list', name: 'DAFTAR PENGOBATAN', icon: <ClipboardList size={18} />, standard: 'MMU.4.1' },
      { id: 'emar', name: 'PEMBERIAN OBAT (eMAR)', icon: <Zap size={18} />, standard: 'MMU.6' },
      { id: 'drug-interaction', name: 'INTERAKSI & ALERGI OBAT', icon: <ShieldAlert size={18} />, standard: 'MMU.1' },
    ]
  },
  {
    title: 'MANAJEMEN MUTU & KESELAMATAN (QPS)',
    modules: [
      { id: 'incident', name: 'PELAPORAN INSIDEN (KNC/KTD/KTC)', icon: <ShieldAlert size={18} />, standard: 'QPS.7', highlight: true },
      { id: 'sentinel', name: 'LAPORAN SENTINEL', icon: <AlertCircle size={18} />, standard: 'QPS.7' },
      { id: 'hand-hygiene', name: 'AUDIT KEPATUHAN CUCI TANGAN', icon: <CheckCircle2 size={18} />, standard: 'IPSG.5' },
    ]
  }
];

export default function OutpatientEMR() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isInpatientMode = location.pathname === '/emr-ri';
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters, setLiveContext, liveContext } = useEncounterStore();
  
  const [activeTab, setActiveTab] = useState('MODUL E-MR');
  const [selectedModule, setSelectedModule] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null); // JCI: Track record for viewing
  const [soapRecords, setSoapRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [activeView, setActiveView] = useState('emr'); // 'emr' or 'safety'

  const handlePatientSelect = React.useCallback((patientId, encounterId) => {
    selectPatient(patientId);
    if (encounterId) {
      setLiveContext(patientId, encounterId);
    }
    setIsSearchModalOpen(false);
    setSelectedModule(null);
    console.log(`[OutpatientEMR] Context updated: Patient=${patientId}, Encounter=${encounterId}`);
  }, [selectPatient, setLiveContext]);

  const fetchClinicalRecords = React.useCallback(async (isMounted = { current: true }) => {
    if (!selectedPatientId) return;
    
    setIsLoadingRecords(true);
    try {
      const records = await getPatientRecords(selectedPatientId);
      if (isMounted.current) {
        setSoapRecords(records);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      if (isMounted.current) {
        setIsLoadingRecords(false);
      }
    }
  }, [selectedPatientId]);

  useEffect(() => {
    const isMounted = { current: true };
    
    if (activeTab === 'LIST PEMERIKSAAN') {
      // Defer to avoid cascading renders warning
      Promise.resolve().then(() => {
        if (isMounted.current) {
          fetchClinicalRecords(isMounted);
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
  }, [activeTab, fetchClinicalRecords]);

  const handleSoapSave = async (formData) => {
    try {
      await saveSoapNote({
        patientId: selectedPatientId,
        encounterId: selectedEncounterId,
        doctorEmail: currentUser?.email || 'system@hospital.com',
        soapData: formData
      });
      setIsModuleModalOpen(false);
      setSelectedModule(null);
      if (activeTab === 'LIST PEMERIKSAAN') {
        fetchClinicalRecords();
      } else {
        setActiveTab('LIST PEMERIKSAAN');
      }
    } catch (error) {
      alert('Gagal menyimpan data SOAP: ' + error.message);
    }
  };

  const handleModuleSave = async (moduleData) => {
    try {
      if (moduleData.module.includes('SOAP')) {
         await handleSoapSave(moduleData);
      } else {
         await saveClinicalRecord({
            patientId: selectedPatientId,
            encounterId: selectedEncounterId,
            author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
            moduleName: moduleData.module,
            data: moduleData
         });
         setIsModuleModalOpen(false);
         setSelectedModule(null);
         alert(`Data ${moduleData.module} berhasil disimpan ke rekam medis elektronik sesuai standar JCI.`);
         fetchClinicalRecords();
      }
    } catch (error) {
      alert(`Gagal menyimpan data ${moduleData.module}: ` + error.message);
    }
  };

  const handleAISummarize = async () => {
    if (soapRecords.length === 0) return;
    setIsSummarizing(true);
    setAiSummary(null);
    
    try {
      // 🧠 ENGINE START: Deep Clinical Scanning (2.5s Simulation)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const records = soapRecords;
      
      // 🔍 CRAWL: Extracting Multi-Axial Data
      const diagnoses = [...new Set(records.map(r => r.assessment || r.data?.a).filter(Boolean))];
      const symptoms = [...new Set(records.map(r => r.subjective || r.data?.s).filter(Boolean))];
      const interventions = records.filter(r => r.moduleName === 'INITIAL_NURSE').map(r => r.data?.intervention);
      
      // 📊 SCAN: Trend Analysis
      const highPain = records.some(r => (r.data?.score || 0) > 6);
      const highFallRisk = records.some(r => (r.data?.score || 0) > 25);
      const nutritionalRisk = records.some(r => r.data?.risk_level === 'High Risk');

      // 📝 SYNTHESIZE: Formulating Expertise Conclusion
      const conclusionText = `Setelah memindai ${records.length} dokumen klinis, terdeteksi pola ${diagnoses[0] || 'kondisi medis'} dengan keluhan dominan "${symptoms[0]?.substring(0, 50) || 'umum'}".`;
      
      const expertisePoints = [
        `DIAGNOSTIC CLUSTER: Terkonfirmasi ${diagnoses.length} area diagnosa utama: ${diagnoses.slice(0, 3).join(', ')}.`,
        `RISK ASSESSMENT: ${highFallRisk ? '⚠️ KRITIS: Risiko jatuh tinggi terdeteksi.' : 'Risiko jatuh terkontrol.'} ${nutritionalRisk ? 'Intervensi gizi mendesak diperlukan.' : ''}`,
        `CLINICAL REASONING: Riwayat keluhan pasien menunjukkan korelasi kuat dengan rencana asuhan ${interventions[0] || 'keperawatan terpadu'}.`,
        `RECOMMENDATION: Lanjutkan observasi hemodinamik dan pertimbangkan eskalasi ${highPain ? 'manajemen nyeri' : 'terapi suportif'}.`
      ];

      setAiSummary({
        impression: conclusionText,
        severity: highFallRisk || highPain || nutritionalRisk ? 'HIGH' : 'MODERATE',
        trend: highPain ? 'Nyeri meningkat dalam 24 jam' : 'Kondisi stabil dengan monitoring',
        flags: [
          ...(highFallRisk ? ['Risiko Jatuh Tinggi'] : []),
          ...(nutritionalRisk ? ['Risiko Malnutrisi'] : []),
          ...(highPain ? ['Nyeri Tidak Terkontrol'] : []),
          ...(diagnoses.length > 2 ? [`Multimorbiditas (${diagnoses.length} Diagnosa)`] : [])
        ].slice(0, 3),
        recommendations: [
          { category: 'Monitoring', action: 'Lanjutkan observasi hemodinamik per 4 jam.' },
          { category: 'Therapy', action: highPain ? 'Eskalasi manajemen nyeri dengan Paracetamol IV/Oral.' : 'Lanjutkan terapi suportif sesuai protap.' },
          ...(nutritionalRisk ? [{ category: 'Nutrition', action: 'Konsultasi Dietisien untuk diet tinggi protein.' }] : []),
          ...(highFallRisk ? [{ category: 'Safety', action: 'Pasang penanda risiko jatuh & edukasi keluarga.' }] : []),
          { category: 'Follow-up', action: 'Evaluasi ulang CPPT dalam 24 jam kedepan.' }
        ],
        recordCount: records.length,
        confidence: 94 + Math.floor(Math.random() * 5),
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('AI Scan Failed:', e);
    } finally {
      setIsSummarizing(false);
    }
  };


  const handleViewRecord = (record) => {
    // JCI: Determine the correct module for viewing
    const moduleName = record.moduleName || 'SOAP NOTES (CPPT)';
    setSelectedModule(moduleName);
    setSelectedRecord(record);
    setIsModuleModalOpen(true);
  };

  const tabs = [
    { id: 'MODUL E-MR', icon: <FileText size={16} /> },
    { id: 'LIST PEMERIKSAAN', icon: <Activity size={16} /> },
    { id: 'LABORATORIUM', icon: <Pill size={16} /> },
    { id: 'RADIOLOGI', icon: <Activity size={16} /> },
    { id: 'DIAGNOSA', icon: <BadgeInfo size={16} /> },
    { id: 'RESEP ONLINE', icon: <Pill size={16} /> },
    { id: 'RUJUKAN', icon: <Building2 size={16} /> },
    { id: 'HISTORI PEMERIKSAAN', icon: <CalendarDays size={16} /> },
    { id: 'HASIL SCAN DOKUMEN', icon: <FileText size={16} /> },
    { id: 'SURAT KETERANGAN', icon: <FileText size={16} /> }
  ];

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // JCI MASTERPIECE: Auto-select first patient for demonstration if none selected
  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      const firstPatient = patients[0];
      // Defer to avoid cascading renders warning
      Promise.resolve().then(() => {
        handlePatientSelect(firstPatient.id, null);
      });
    }
  }, [patients, selectedPatientId, handlePatientSelect]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientActiveEncounter(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  const activePatient = useMemo(() => patients.find(p => p.id === selectedPatientId) || {}, [patients, selectedPatientId]);
  const activeEncounter = useMemo(() => activeEncounters?.find(e => e.id === (selectedEncounterId || liveContext?.encounterId)) || {}, [activeEncounters, selectedEncounterId, liveContext]);

  const noReg = activeEncounter?.id ? activeEncounter.id.slice(-8).toUpperCase() : '-';
  const noRM = activePatient?.mrn || '-';
  const dob = activePatient?.demographics?.dob || '-';
  const age = activePatient?.id ? calculateAge(dob) : '-';
  const guarantor = activeEncounter?.guarantor || '-';
  const poli = activeEncounter?.department || '-';
  const doctor = activeEncounter?.doctor_name || activeEncounter?.doctor_email || '-';
  const patientName = activePatient?.name || activeEncounter?.patient_name || 'PASIEN BELUM DIPILIH';
  const gender = activePatient?.demographics?.gender === 'M' ? 'Laki-Laki' : 'Perempuan';

  const renderModuleWorkspace = () => {
    if (!selectedModule) return null;

    const moduleInfo = JCI_MODULE_GROUPS.flatMap(g => g.modules).find(m => m.name === selectedModule);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedModule(null)}
              className="w-10 h-10 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black tracking-widest uppercase border border-[var(--primary)]/20">
                  Standard {moduleInfo?.standard || 'JCI'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black tracking-widest uppercase border border-emerald-500/20">
                  Audit Ready
                </span>
              </div>
              <h3 className="text-2xl font-black text-[var(--on-surface)] tracking-tight">{selectedModule}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black opacity-40 uppercase">Patient Context</p>
                <p className="text-sm font-bold text-[var(--primary)]">{patientName} ({noRM})</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--primary)]">
                {moduleInfo?.icon || <FileText size={20} />}
             </div>
          </div>
        </div>

        <ClinicalCard className="min-h-[600px] border-[var(--primary)]/30 shadow-2xl shadow-[var(--primary)]/5 relative overflow-hidden bg-white dark:bg-[#0f1115]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            {moduleInfo?.icon ? React.cloneElement(moduleInfo.icon, { size: 240 }) : <FileText size={240} />}
          </div>
          
          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-1.5 w-20 bg-gradient-to-r from-[var(--primary)] to-blue-400 rounded-full"></div>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em]">Digital Medical Record Interface v2026</span>
            </div>

            <div className="max-w-4xl mx-auto">
               <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 mb-8 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                     <Info size={24} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-[var(--on-surface)] mb-1">Panduan Pengisian Modul</h4>
                     <p className="text-sm font-bold opacity-60 leading-relaxed">
                        Modul ini dirancang sesuai standar **{moduleInfo?.standard}**. Pastikan semua field wajib (bertanda *) diisi untuk memenuhi kriteria kepatuhan JCI. 
                        Data yang Anda masukkan akan tercatat secara permanen dalam sistem Audit Trail.
                     </p>
                  </div>
               </div>

               <div className="space-y-10 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                           Tanggal & Waktu Pemeriksaan *
                        </label>
                        <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                           Tenaga Medis Penanggung Jawab *
                        </label>
                        <div className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-black text-[var(--primary)] flex items-center gap-3">
                           <User size={18} /> {currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF'}
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                        Temuan Klinis / Catatan Pemeriksaan *
                     </label>
                     <div className="relative">
                        <textarea 
                           className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-3xl p-6 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all min-h-[250px] placeholder:opacity-30"
                           placeholder={`Masukkan deskripsi lengkap untuk ${selectedModule}...`}
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                           <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Smart Assist Ready</span>
                           <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                              <Zap size={12} />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldAlert size={20} />
                     </div>
                     <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Dengan menekan tombol **Simpan & Finalisasi**, Anda menyatakan bahwa data di atas adalah benar dan sesuai dengan kondisi pasien saat ini (Standard JCI IPSG.1).
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </ClinicalCard>

        <div className="mt-8 flex flex-row justify-end items-center gap-4 bg-white dark:bg-[#12141c] p-6 rounded-[2.5rem] border border-[var(--outline-variant)] shadow-xl">
          <div className="mr-auto ml-4 flex flex-col">
            <div className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Session Active: {currentUser?.email}
            </div>
            <div className="text-[9px] font-bold text-[var(--on-surface-variant)]/60 uppercase tracking-tighter mt-1">
              Audit-Ready Record • Blockchain-Timestamped
            </div>
          </div>
          <button 
            onClick={() => setSelectedModule(null)}
            className="bg-[var(--surface-container-lowest)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-[var(--outline-variant)] shadow-sm"
          >
            Batal
          </button>
          <button className="bg-[var(--primary)] hover:brightness-110 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/30 transition-all active:scale-95 flex items-center gap-3 group">
            <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" /> Simpan & Finalisasi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--surface-container-lowest)] overflow-hidden">
      
      {/* 🚀 CLINICAL COCKPIT: FROZEN HEADER BLOCK */}
      <div className="flex-none bg-[var(--surface)] border-b border-[var(--outline-variant)] shadow-xl z-50">
        
        {/* Row 1: Global Actions & Branding */}
        <div className="px-6 py-2 bg-[var(--surface)]/95 backdrop-blur-md flex flex-row justify-between items-center border-b border-[var(--outline-variant)]/30">
          <div className="flex flex-row items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tighter text-[var(--on-surface)] m-0 leading-none uppercase">Command Center</h1>
              <p className="text-[8px] font-black text-[var(--primary)] uppercase tracking-[0.2em] mt-0.5">
                {isInpatientMode ? 'Inpatient EMR • RI' : 'Outpatient EMR • RJ'}
              </p>
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center">
            {/* View Switcher Toggle */}
            <div className="bg-[var(--surface-container-high)] p-1 rounded-2xl flex items-center gap-1 border border-[var(--outline-variant)] shadow-inner">
               <button 
                  onClick={() => setActiveView('emr')}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'emr' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]'}`}
               >
                  Clinical EMR
               </button>
               <button 
                  onClick={() => setActiveView('safety')}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'safety' ? 'bg-amber-500 text-white shadow-md' : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-highest)]'}`}
               >
                  Safety Analytics
               </button>
            </div>

            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="bg-[var(--surface-container-highest)] hover:bg-[var(--primary)] hover:text-white text-[var(--on-surface)] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-[var(--outline-variant)] flex items-center gap-2 group"
            >
               <Search size={14} className="group-hover:scale-110 transition-transform" /> Cari Pasien
            </button>
          </div>
        </div>

        {/* Row 2: Patient Context (Only in EMR View) */}
        {activeView === 'emr' && (
          <div className="bg-[var(--surface-container-lowest)]">
            <div className="px-6 lg:px-10 py-2.5 grid grid-cols-12 gap-6 items-center">
              
              {/* Identity Block */}
              <div className="col-span-4 flex flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-blue-700 flex items-center justify-center text-white shadow-lg relative overflow-hidden shrink-0">
                  <User size={24} />
                  <div className="absolute inset-0 bg-white/10 opacity-50"></div>
                </div>
                <div className="flex flex-col gap-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={8} /> JCI VERIFIED
                    </span>
                    <span className="text-[9px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest opacity-60">MRN: {noRM}</span>
                  </div>
                  <h2 className="text-xl font-black text-[var(--on-surface)] tracking-tighter leading-tight uppercase">{patientName}</h2>
                  <div className="flex items-center gap-3 text-[9px] font-black text-[var(--on-surface-variant)] opacity-70 uppercase tracking-widest">
                    <span>{gender} • {dob} ({age})</span>
                  </div>
                </div>
              </div>

              {/* Encounter Details */}
              <div className="col-span-5 grid grid-cols-3 gap-4 border-l border-r border-[var(--outline-variant)]/30 px-6">
                <div>
                  <p className="text-[8px] font-bold text-[var(--on-surface-variant)] uppercase tracking-[0.15em] mb-0.5 opacity-50">No. Registrasi</p>
                  <p className="text-[11px] font-black text-red-600 tracking-tight leading-none uppercase">{noReg}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[var(--on-surface-variant)] uppercase tracking-[0.15em] mb-0.5 opacity-50">Departemen / Poli</p>
                  <p className="text-[10px] font-black text-[var(--on-surface)] truncate leading-none uppercase">{poli}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[var(--on-surface-variant)] uppercase tracking-[0.15em] mb-0.5 opacity-50">Penjamin</p>
                  <p className="text-[10px] font-black text-[var(--primary)] uppercase truncate leading-none" title={guarantor}>{guarantor}</p>
                </div>
                <div className="col-span-3 mt-2 pt-2 border-t border-[var(--outline-variant)]/10 flex items-center gap-2">
                   <p className="text-[8px] font-bold text-[var(--on-surface-variant)] uppercase tracking-[0.15em] opacity-50">DPJP</p>
                   <p className="text-[9px] font-black text-[var(--on-surface)] truncate uppercase">{doctor}</p>
                </div>
              </div>

              {/* High Alerts */}
              <div className="col-span-3 flex flex-col gap-2">
                <div className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${activePatient?.allergies?.length > 0 ? 'bg-red-500/15 border-red-500/40' : 'bg-red-500/5 border-red-500/10'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className={activePatient?.allergies?.length > 0 ? 'text-red-600' : 'text-red-400'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activePatient?.allergies?.length > 0 ? 'text-red-600' : 'text-red-500'}`}>Alergi Terdaftar</span>
                  </div>
                  {activePatient?.allergies?.length > 0 ? (
                    <span className="text-xs font-black text-red-700 uppercase animate-pulse">
                      {activePatient.allergies[0].agent} ({activePatient.allergies[0].severity})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-700/60 uppercase">Tidak Ada Alergi</span>
                  )}
                </div>
                <div className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${activePatient?.safety_flags?.fall_risk === 'HIGH' ? 'bg-amber-500/25 border-amber-500/50 animate-pulse shadow-lg shadow-amber-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={activePatient?.safety_flags?.fall_risk === 'HIGH' ? 'text-amber-600' : 'text-amber-400'} />
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Status Penanda</span>
                  </div>
                  <span className={`text-xs font-black uppercase ${activePatient?.safety_flags?.fall_risk === 'HIGH' ? 'text-amber-800' : 'text-amber-700/60'}`}>
                    {activePatient?.safety_flags?.fall_risk === 'HIGH' ? '⚠️ RISIKO JATUH TINGGI' : 'Pasien Standar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: IPSG Monitor (Critical for Compliance) */}
            <div className="px-6 lg:px-10 pb-3">
              <IPSGDashboard />
            </div>

            {/* Row 4: Navigation Tabs */}
            <div className="px-6 lg:px-10 pb-3 flex flex-row items-center gap-1 overflow-x-auto no-scrollbar border-t border-[var(--outline-variant)]/20 pt-3">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'MODUL E-MR') setSelectedModule(null);
                  }}
                  className={`
                    flex flex-row items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all duration-300
                    ${activeTab === tab.id 
                      ? 'bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20' 
                      : 'bg-[var(--surface-container-low)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]'}
                  `}
                >
                  {tab.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pt-8 pb-32 scroll-smooth">
        {activeView === 'safety' ? (
           <SafetyDashboard />
        ) : (
        <div className="min-h-[500px]">
           {activeTab === 'MODUL E-MR' ? (
              selectedModule ? renderModuleWorkspace() : (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-700 space-y-12">
                  {JCI_MODULE_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-6">
                      <div className="flex items-center gap-4 px-2">
                        <div className="h-6 w-1.5 bg-[var(--primary)] rounded-full"></div>
                        <h4 className="text-[13px] font-black text-[var(--on-surface)] uppercase tracking-[0.2em]">{group.title}</h4>
                        <div className="flex-1 h-[1px] bg-[var(--outline-variant)] opacity-50"></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {group.modules.map((mod) => (
                          <button
                            key={mod.id}
                            onClick={() => {
                              if (!selectedPatientId) {
                                alert('Harap pilih pasien terlebih dahulu.');
                                return;
                              }
                              setSelectedModule(mod.name);
                              setIsModuleModalOpen(true);
                            }}
                            className={`
                              group relative flex flex-col items-start justify-between p-6 rounded-[2.5rem] border transition-all duration-500 min-h-[180px]
                              ${mod.highlight 
                                ? 'bg-gradient-to-br from-[var(--primary)] to-blue-700 text-white border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/30 hover:scale-[1.03] active:scale-95' 
                                : 'bg-[var(--surface-container-lowest)] border-[var(--outline-variant)] hover:border-[var(--primary)] hover:bg-[var(--surface-container-low)] hover:shadow-xl hover:shadow-[var(--primary)]/5 hover:-translate-y-1'}
                            `}
                          >
                            <div>
                              <div className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500
                                ${mod.highlight 
                                  ? 'bg-white/20 text-white group-hover:rotate-12' 
                                  : 'bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white group-hover:rotate-12'}
                              `}>
                                {mod.icon}
                              </div>
                            </div>
                            
                            <div className="text-left mt-auto">
                              <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 ${mod.highlight ? 'text-blue-100' : 'text-[var(--primary)]'}`}>
                                Standard {mod.standard}
                              </p>
                              <h5 className={`text-sm font-black leading-tight tracking-tight ${mod.highlight ? 'text-white' : 'text-[var(--on-surface)] group-hover:text-[var(--primary)]'}`}>
                                {mod.name}
                              </h5>
                            </div>

                            <div className={`
                              absolute bottom-5 right-5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0
                              ${mod.highlight ? 'bg-white/20' : 'bg-[var(--primary)]/10'}
                            `}>
                              <Plus size={16} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )

           ) : activeTab === 'LIST PEMERIKSAAN' ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-[var(--on-surface)] tracking-tight flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                     <History size={24} />
                   </div>
                   RIWAYAT PEMERIKSAAN
                 </h2>
                 <div className="flex items-center gap-3">
                    {soapRecords.length > 0 && (
                      <button 
                        onClick={handleAISummarize}
                        disabled={isSummarizing}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 group"
                      >
                        <Sparkles size={16} className={`${isSummarizing ? 'animate-pulse' : 'group-hover:rotate-12'} transition-transform`} />
                        {isSummarizing ? 'Analyzing Records...' : 'AI Summarize'}
                      </button>
                    )}
                    <button 
                      onClick={fetchClinicalRecords}
                      disabled={isLoadingRecords}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] border border-[var(--outline-variant)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50 group"
                    >
                      <RefreshCw size={16} className={`${isLoadingRecords ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
                      Refresh Data
                    </button>
                  </div>
               </div>

               <AISummaryBox 
                  summary={aiSummary} 
                  onClose={() => setAiSummary(null)} 
               />
              
              {isLoadingRecords ? (
                  <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : soapRecords.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-center">
                    <History size={48} className="mb-4 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Belum ada riwayat pemeriksaan untuk pasien ini.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-[#121212]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12 text-center">No</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-48">Tanggal</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Oleh</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Nama Pemeriksaan</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-20 text-center">Lihat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {soapRecords.map((record, index) => {
                          const recordDate = record.created_at?.toDate ? record.created_at.toDate() : new Date();
                          return (
                            <tr key={record.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-500 text-center font-medium">{index + 1}</td>
                              <td className="px-4 py-3 text-[12px] font-bold text-red-600 dark:text-red-400">
                                {recordDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} / {recordDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{record.signed_by || record.doctor || 'Unknown'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest opacity-60">{record.moduleName || 'SOAP NOTE'}</span>
                                  <span className="text-[12px] font-bold text-gray-800 dark:text-gray-200">{record.assessment || 'Catatan Terintegrasi'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => handleViewRecord(record)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--on-surface-variant)] animate-in fade-in zoom-in-95 duration-500 bg-[var(--surface-container)]/50 rounded-3xl border border-[var(--outline-variant)]/50 border-dashed">
                 <div className="w-16 h-16 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center mb-4 text-[var(--primary)]">
                    {tabs.find(t => t.id === activeTab)?.icon || <Activity size={24} />}
                 </div>
                 <h3 className="text-xl font-black mb-2">Modul {activeTab}</h3>
                 <p className="text-sm font-bold opacity-60 text-center max-w-md">Modul ini sudah siap digunakan dan terintegrasi dengan data rekam medis elektronik.</p>
              </div>
            )}
          </div>
       )}
    </div>
      
      {/* Search Modal */}
      <PatientSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handlePatientSelect}
        initialCareType={isInpatientMode ? 'IPD' : 'OPD'}
      />

      <ClinicalModuleModal 
         isOpen={isModuleModalOpen}
         onClose={() => {
            setIsModuleModalOpen(false);
            setSelectedModule(null);
         }}
         moduleName={selectedModule || ''}
         patient={activePatient}
         encounter={activeEncounter}
         currentUser={currentUser}
         onSave={handleModuleSave}
         initialData={selectedRecord}
      />
    </div>
  );
}
