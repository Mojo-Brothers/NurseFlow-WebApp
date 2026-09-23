import React, { useState, useMemo } from 'react';
import { 
  Users, Stethoscope, Clock, CheckCircle2, AlertCircle, ArrowRight,
  Filter, Search, Calendar, ChevronRight, ArrowLeft, Pill, GitFork, Eye,
  FileText, Activity, ShieldAlert, Plus, RefreshCw, BookOpen, AlertTriangle,
  History, CalendarDays, UploadCloud, FileCheck, Layers, ExternalLink,
  ChevronDown, X, Download, HeartPulse, UserCheck, ShieldCheck, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { ClinicalModal } from '../../../design-system/components/ClinicalModal.jsx';
import toast from 'react-hot-toast';

export default function DaftarPemeriksaanRjPage() {
  const navigate = useNavigate();
  const { selectPatient } = usePatientStore();
  const { setLiveContext } = useEncounterStore();

  // Mode: 'WORKSPACE' (Patient Examination Workspace) vs 'WORKLIST' (Antrean Poliklinik)
  const [viewMode, setViewMode] = useState('WORKSPACE');

  // Active Patient Examination Detail
  const [examData, setExamData] = useState(() => emrSupportingDocsService.getExaminationDetail('P260907814'));

  // Active Tab in Workspace (1 to 13)
  const [activeTab, setActiveTab] = useState('MODUL_EMR');

  // Worklist state
  const [selectedClinic, setSelectedClinic] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [worklistDate, setWorklistDate] = useState(new Date().toISOString().slice(0, 10));
  const [patientsList, setPatientsList] = useState(() => emrSupportingDocsService.getOutpatientWorklist());

  // Search Pasien Modal State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({
    regId: '',
    mrn: '',
    name: '',
    departmentId: '',
    payerId: ''
  });
  const [searchResults, setSearchResults] = useState([]);

  // Clinical Sub-modals
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [allergyInput, setAllergyInput] = useState({ allergen: '', reaction: '', severity: 'SEDANG' });

  const [isVaccineModalOpen, setIsVaccineModalOpen] = useState(false);
  const [vaccineInput, setVaccineInput] = useState({ name: '', date: '', provider: 'Puskesmas', notes: '' });

  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [diagnosisInput, setDiagnosisInput] = useState({
    workingDiagnosis: examData.workingDiagnosis || '',
    primaryDiagnosis: examData.primaryDiagnosis || '',
    secondaryDiagnosesText: (examData.secondaryDiagnoses || []).join('\n')
  });

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [rxInput, setRxInput] = useState({ name: '', instructions: '', quantity: '1 Botol', isRacikan: false });

  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralInput, setReferralInput] = useState({ target: 'Laboratorium Sentral', description: '', cito: false });

  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [controlInput, setControlInput] = useState({ controlDate: '', clinic: 'Poli Penyakit Dalam', doctor: 'dr. Alexander, Sp.PD', notes: '' });

  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterInput, setLetterInput] = useState({ type: 'Surat Keterangan Sakit', duration: '3 Hari', notes: '' });

  const [previewDoc, setPreviewDoc] = useState(null);

  // Departments & Payers lookup
  const departments = useMemo(() => emrSupportingDocsService.getDepartmentList(), []);
  const payers = useMemo(() => emrSupportingDocsService.getPayersList(), []);

  // Filtered worklist
  const filteredList = useMemo(() => {
    return patientsList.filter(item => {
      if (selectedClinic !== 'ALL' && item.clinic !== selectedClinic) return false;
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (item.queueNo || '').toLowerCase().includes(q) ||
          (item.mrn || '').toLowerCase().includes(q) ||
          (item.patientName || '').toLowerCase().includes(q) ||
          (item.chiefComplaint || '').toLowerCase().includes(q) ||
          (item.doctor || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [patientsList, selectedClinic, selectedStatus, searchQuery]);

  // Handlers
  const handleSelectPatientFromWorklist = (patientItem) => {
    const updated = emrSupportingDocsService.updateExaminationDetail(patientItem.mrn, {
      regId: `P2609-${patientItem.id}`,
      mrn: patientItem.mrn,
      patientName: patientItem.patientName,
      dob: patientItem.dob,
      gender: patientItem.gender,
      departmentName: patientItem.clinic,
      doctorName: patientItem.doctor,
      payerName: patientItem.paymentMethod,
      queueNo: patientItem.queueNo
    });
    setExamData(updated);
    selectPatient(patientItem.mrn);
    setLiveContext(patientItem.mrn, `ENC-RJ-${patientItem.id}`);
    setViewMode('WORKSPACE');
    toast.success(`Memuat lembar pemeriksaan ${patientItem.patientName}`);
  };

  const handleSearchPasienSubmit = (e) => {
    if (e) e.preventDefault();
    const res = emrSupportingDocsService.searchPatientsComprehensive(searchCriteria);
    setSearchResults(res);
    if (res.length === 0) {
      toast('Tidak ada data pasien yang sesuai kriteria pencarian.', { icon: 'ℹ️' });
    }
  };

  const handlePickSearchResult = (p) => {
    handleSelectPatientFromWorklist(p);
    setIsSearchModalOpen(false);
  };

  const handleSaveAllergy = (e) => {
    e.preventDefault();
    if (!allergyInput.allergen) return;
    const newAllergies = [...(examData.allergies || []), allergyInput];
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, { allergies: newAllergies });
    setExamData(updated);
    setAllergyInput({ allergen: '', reaction: '', severity: 'SEDANG' });
    setIsAllergyModalOpen(false);
    toast.success('Riwayat alergi berhasil ditambahkan');
  };

  const handleSaveVaccine = (e) => {
    e.preventDefault();
    if (!vaccineInput.name) return;
    const newVaccines = [...(examData.vaccines || []), { id: `VAC-${Date.now()}`, ...vaccineInput }];
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, { vaccines: newVaccines });
    setExamData(updated);
    setVaccineInput({ name: '', date: '', provider: 'Puskesmas', notes: '' });
    setIsVaccineModalOpen(false);
    toast.success('Data vaksinasi berhasil ditambahkan');
  };

  const handleSaveDiagnosis = (e) => {
    e.preventDefault();
    const secondaries = diagnosisInput.secondaryDiagnosesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, {
      workingDiagnosis: diagnosisInput.workingDiagnosis,
      primaryDiagnosis: diagnosisInput.primaryDiagnosis,
      secondaryDiagnoses: secondaries
    });
    setExamData(updated);
    setIsDiagnosisModalOpen(false);
    toast.success('Diagnosa pasien berhasil diperbarui');
  };

  const handleSavePrescription = (e) => {
    e.preventDefault();
    if (!rxInput.name) return;
    const newRx = {
      id: `RX-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      name: rxInput.name,
      instructions: rxInput.instructions,
      quantity: rxInput.quantity,
      type: rxInput.isRacikan ? 'RACIKAN' : 'REGULER',
      status: 'TERKIRIM'
    };
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, {
      onlinePrescriptions: [newRx, ...(examData.onlinePrescriptions || [])]
    });
    setExamData(updated);
    setRxInput({ name: '', instructions: '', quantity: '1 Botol', isRacikan: false });
    setIsPrescriptionModalOpen(false);
    toast.success('Resep online berhasil diteruskan ke Farmasi');
  };

  const handleSaveReferral = (e) => {
    e.preventDefault();
    if (!referralInput.description) return;
    const newRef = {
      id: `REF-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      target: referralInput.target,
      description: referralInput.description,
      cito: referralInput.cito,
      status: 'MENUNGGU'
    };
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, {
      referrals: [newRef, ...(examData.referrals || [])]
    });
    setExamData(updated);
    setReferralInput({ target: 'Laboratorium Sentral', description: '', cito: false });
    setIsReferralModalOpen(false);
    toast.success(`Permintaan rujukan ke ${newRef.target} berhasil diajukan`);
  };

  const handleSaveControl = (e) => {
    e.preventDefault();
    if (!controlInput.controlDate) return;
    const newCtrl = {
      id: `CTL-${Date.now()}`,
      controlDate: controlInput.controlDate,
      clinic: controlInput.clinic,
      doctor: controlInput.doctor,
      notes: controlInput.notes
    };
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, {
      controlSchedules: [newCtrl, ...(examData.controlSchedules || [])]
    });
    setExamData(updated);
    setControlInput({ controlDate: '', clinic: 'Poli Penyakit Dalam', doctor: 'dr. Alexander, Sp.PD', notes: '' });
    setIsControlModalOpen(false);
    toast.success('Jadwal kontrol dokter berhasil disimpan');
  };

  const handleSaveLetter = (e) => {
    e.preventDefault();
    const newLetter = {
      id: `SK-${Date.now()}`,
      number: `445/SKD/RSUP/IX/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      type: letterInput.type,
      date: new Date().toISOString().slice(0, 10),
      doctor: examData.doctorName,
      duration: letterInput.duration,
      statusTte: 'TERTANDATANGAN_ELEKTRONIK',
      tteSignId: `TTE-${Date.now()}`
    };
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, {
      medicalLetters: [newLetter, ...(examData.medicalLetters || [])]
    });
    setExamData(updated);
    setLetterInput({ type: 'Surat Keterangan Sakit', duration: '3 Hari', notes: '' });
    setIsLetterModalOpen(false);
    toast.success('Surat Keterangan berhasil diterbitkan dan ditandatangani secara elektronik (TTE)');
  };

  const handleSyncProfile = () => {
    toast.loading('Sinkronisasi Profil Medis Pasien Kompleks...', { id: 'sync-profile' });
    setTimeout(() => {
      toast.success('Profil Medis Terintegrasi berhasil dimutakhirkan!', { id: 'sync-profile' });
    }, 800);
  };

  const handleToggleComplexPatient = (val) => {
    const isComp = val === 'Y';
    const updated = emrSupportingDocsService.updateExaminationDetail(examData.regId, { isComplexPatient: isComp });
    setExamData(updated);
    toast.success(`Status Pasien Kompleks: ${isComp ? 'Aktif' : 'Non-Aktif'}`);
  };

  // 14 e-MR Module Launchers
  const emrModulesList = [
    { id: '25', title: 'Surat Permintaan Konsultasi', category: 'Konsultasi', icon: GitFork, action: () => { setActiveTab('TAB_RUJUKAN'); setIsReferralModalOpen(true); } },
    { id: '24', title: 'Catatan Terintegrasi (CPPT)', category: 'Multi-PPA', icon: FileText, action: () => navigate('/emr/catatan-terintegrasi') },
    { id: '30', title: 'Catatan Keperawatan', category: 'Keperawatan', icon: Activity, action: () => toast.success('Membuka Formulir Catatan Keperawatan Terpadu') },
    { id: '21', title: 'Observasi Keadaan Khusus', category: 'Monitoring', icon: HeartPulse, action: () => toast.success('Membuka Lembar Observasi Khusus Pasien') },
    { id: '31', title: 'Pengkajian Risiko Jatuh', category: 'Patient Safety', icon: ShieldAlert, action: () => toast.success('Membuka Skala Risiko Jatuh Morse / Humpty Dumpty') },
    { id: '26', title: 'Resume Keperawatan', category: 'Keperawatan', icon: FileCheck, action: () => toast.success('Membuka Lembar Resume Keperawatan') },
    { id: '44', title: 'Monitoring Nyeri Pasien', category: 'Monitoring', icon: AlertTriangle, action: () => toast.success('Membuka Skala Nyeri NRS / Wong-Baker') },
    { id: '41', title: 'Daftar Pengobatan / e-MAR', category: 'Farmasi', icon: Pill, action: () => { setActiveTab('TAB_RESEP'); setIsPrescriptionModalOpen(true); } },
    { id: '56', title: 'Laporan Pembedahan', category: 'Bedah', icon: Layers, action: () => navigate('/emr-ri/catatan-anestesi') },
    { id: '60', title: 'Pengkajian Awal Perawat HD', category: 'Hemodialisa', icon: Activity, action: () => toast.success('Membuka Pengkajian Unit Hemodialisa') },
    { id: '65', title: 'Monitoring Reaksi Transfusi', category: 'Bank Darah', icon: HeartPulse, action: () => toast.success('Membuka Lembar Pemantauan Transfusi Darah') },
    { id: '5', title: 'Pengkajian Gawat Darurat (UGD)', category: 'UGD', icon: Stethoscope, action: () => toast.success('Membuka Form Triase & Asesmen UGD Lengkap') },
    { id: '50', title: 'Pengkajian MCU', category: 'MCU', icon: UserCheck, action: () => toast.success('Membuka Form General Medical Checkup') },
    { id: '45', title: 'Resume Medis RJ', category: 'Dokter DPJP', icon: ShieldCheck, action: () => navigate('/doctor-workspace') }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-5 animate-in fade-in duration-300">
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emr')}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs transition-colors"
            title="Kembali ke EMR Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Daftar Pemeriksaan Pasien RJ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 text-[10px] font-black uppercase">
                EMR RJ Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pusat Pelayanan Rawat Jalan, Rekam Medis Terpadu & Pemeriksaan Poliklinik
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('WORKSPACE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'WORKSPACE'
                  ? 'bg-white dark:bg-slate-900 text-[#015C80] dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Lembar Pemeriksaan Pasien
            </button>
            <button
              type="button"
              onClick={() => setViewMode('WORKLIST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'WORKLIST'
                  ? 'bg-white dark:bg-slate-900 text-[#015C80] dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Antrean Poliklinik ({filteredList.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setIsSearchModalOpen(true); handleSearchPasienSubmit(); }}
            className="px-3.5 py-2 rounded-xl bg-[#015C80] hover:bg-[#014c6a] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari Pasien</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/emr/rujukan-internal')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer relative"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-500" />
            <span>Pasien Rujukan</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-black text-[10px]">5</span>
          </button>

          <button
            type="button"
            onClick={() => toast('Membuka Panduan Edukasi Pasien Terintegrasi', { icon: '📖' })}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Link Edukasi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExamData(emrSupportingDocsService.getExaminationDetail(examData.regId));
              toast.success('Data pasien berhasil di-refresh');
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
            title="Refresh Data Pasien"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── CONDITIONAL RENDER: WORKLIST MODE ── */}
      {viewMode === 'WORKLIST' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Poliklinik</option>
                {departments.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Status</option>
                <option value="MENUNGGU">Menunggu</option>
                <option value="SEDANG_DIPERIKSA">Sedang Diperiksa</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIRUJUK">Dirujuk</option>
              </select>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari antrean, nama, no RM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#015C80]"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4 text-center">No. Antrean</th>
                    <th className="p-4">Pasien & Rekam Medis</th>
                    <th className="p-4">Poliklinik & DPJP</th>
                    <th className="p-4">Keluhan & TTV</th>
                    <th className="p-4">Penjamin</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi Pelayanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="inline-block px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black font-mono text-sm">
                          {item.queueNo}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{item.arrivalTime} WIB</span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{item.patientName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>{item.mrn}</span>
                          <span>•</span>
                          <span>{item.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.clinic}</p>
                        <span className="text-[10px] text-slate-500">{item.doctor}</span>
                      </td>

                      <td className="p-4 max-w-xs">
                        <p className="truncate text-slate-800 dark:text-slate-200 font-medium mb-1" title={item.chiefComplaint}>
                          {item.chiefComplaint}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <span>TD: {item.vitals?.td}</span>
                          <span>HR: {item.vitals?.hr}</span>
                          <span>SpO2: {item.vitals?.spo2}</span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                          {item.paymentMethod}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                          item.status === 'SEDANG_DIPERIKSA' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 animate-pulse' :
                          item.status === 'MENUNGGU' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          item.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectPatientFromWorklist(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#015C80] hover:bg-[#014c6a] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer mx-auto"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Pilih & Buka Pemeriksaan</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── WORKSPACE MODE: FULL PATIENT EXAMINATION HUB ── */
        <div className="flex flex-col gap-5">
          {/* Discharge Alert if Pulang */}
          {examData.isDischarged && (
            <div className="p-3 bg-rose-600 text-white font-black text-center text-sm uppercase tracking-wider rounded-2xl shadow-md animate-pulse">
              PASIEN INI SUDAH PULANG / BERKAS TELAH DITUTUP
            </div>
          )}

          {/* Patient Demographic & Encounter Header Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">No. Registrasi / No. RM</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-[#015C80] dark:text-teal-400">{examData.regId}</span>
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    {examData.mrn}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Antrean: {examData.queueNo || '-'}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Identitas Pasien</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{examData.patientName}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>{examData.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  <span>•</span>
                  <span>{examData.dob} ({examData.age})</span>
                  <span>•</span>
                  <span>{examData.religion}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Departemen & DPJP</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{examData.departmentName}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{examData.doctorName}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Penjamin Biaya</span>
                <span className="inline-block px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold text-xs mt-0.5">
                  {examData.payerName}
                </span>
                {examData.isComplexPatient && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded-lg bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider">
                    Kompleks
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Safety Bar (Allergies, Vaccines, Diagnoses, Markers, Complex Patient) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Alergi Card */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-black text-rose-900 dark:text-rose-200">Riwayat Alergi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAllergyModalOpen(true)}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Alergi</span>
                  </button>
                </div>
                {(!examData.allergies || examData.allergies.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">Tidak Ada Riwayat Alergi Diketahui (NKDA)</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {examData.allergies.map((alg, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 text-[10px] font-bold">
                        {alg.allergen} ({alg.reaction})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Vaksin Card */}
              <div className="p-3.5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-black text-teal-900 dark:text-teal-200">Riwayat Vaksinasi</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVaccineModalOpen(true)}
                    className="px-2 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Vaksin</span>
                  </button>
                </div>
                {(!examData.vaccines || examData.vaccines.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">Belum ada riwayat vaksin tercatat</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {examData.vaccines.slice(0, 2).map((v) => (
                      <span key={v.id} className="text-xs text-teal-900 dark:text-teal-200 truncate">
                        • {v.name} ({v.date})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnosa Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">Diagnosa & Masalah Klinis</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDiagnosisModalOpen(true)}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Edit Diagnosa</span>
                  </button>
                </div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate">
                  Kerja: {examData.workingDiagnosis || '-'}
                </p>
                <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium truncate mt-0.5">
                  ICD-10: {examData.primaryDiagnosis || '-'}
                </p>
              </div>
            </div>

            {/* Sub-row: Penanda & Pasien Kompleks Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-600 dark:text-slate-300">Penanda Klinis:</span>
                {(examData.clinicalMarkers || []).map((m, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Pasien Kompleks:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="complex_radio"
                      value="Y"
                      checked={examData.isComplexPatient === true}
                      onChange={() => handleToggleComplexPatient('Y')}
                      className="text-[#015C80]"
                    />
                    <span className="font-medium">Ya</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="complex_radio"
                      value="N"
                      checked={examData.isComplexPatient !== true}
                      onChange={() => handleToggleComplexPatient('N')}
                      className="text-[#015C80]"
                    />
                    <span className="font-medium">Tidak</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSyncProfile}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 13 CLINICAL TABS BAR ── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
            <div className="flex items-center gap-1.5 p-2 bg-slate-100/80 dark:bg-slate-800/80 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
              {[
                { id: 'MODUL_EMR', label: 'Modul e-MR' },
                { id: 'LIST_PEMERIKSAAN', label: 'List Pemeriksaan' },
                { id: 'PROFILE_MEDIS', label: 'Profile Medis (Kompleks)' },
                { id: 'TAB_LAB', label: 'Laboratorium' },
                { id: 'TAB_RAD', label: 'Radiologi' },
                { id: 'TAB_DIAGNOSA', label: 'Diagnosa' },
                { id: 'TAB_RESEP', label: 'Resep Online' },
                { id: 'TAB_RUJUKAN', label: 'Rujukan' },
                { id: 'TAB_HISTORI', label: 'Histori Pemeriksaan' },
                { id: 'TAB_KONTROL', label: 'Jadwal Kontrol' },
                { id: 'TAB_SCAN_DOKUMEN', label: 'Hasil Scan Dokumen' },
                { id: 'TAB_SURAT_KET', label: 'Surat Keterangan' },
                { id: 'TAB_ICARE_JKN', label: 'Riwayat Pelayanan JKN' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#015C80] text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="p-5">
              {/* ── TAB 1: MODUL E-MR (14 CLINICAL FORMS GRID) ── */}
              {activeTab === 'MODUL_EMR' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Formulir & Modul Klinis Terintegrasi e-MR Pasien
                    </h3>
                    <span className="text-xs text-slate-500">14 Formulir Standar Akreditasi KARS</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {emrModulesList.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={m.action}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500 text-left transition-all group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-8 h-8 rounded-xl bg-[#015C80]/10 dark:bg-teal-900/30 text-[#015C80] dark:text-teal-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {m.category}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#015C80] dark:group-hover:text-teal-400 leading-tight">
                            {m.title}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── TAB 2: LIST PEMERIKSAAN ENCOUNTER AKTIF ── */}
              {activeTab === 'LIST_PEMERIKSAAN' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Daftar Pemeriksaan Encounter Kunjungan Ini
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate('/emr/catatan-terintegrasi')}
                      className="px-3 py-1.5 rounded-xl bg-[#015C80] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah CPPT Baru</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3 text-center w-12">No</th>
                          <th className="p-3">Tanggal & Jam</th>
                          <th className="p-3">Oleh (PPA / Tenaga Medis)</th>
                          <th className="p-3">Nama Pemeriksaan / Catatan</th>
                          <th className="p-3 text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.assessments || []).map((asm, idx) => (
                          <tr key={asm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="p-3 font-mono text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">{asm.date}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{asm.practitioner}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{asm.title}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => navigate('/emr/catatan-terintegrasi')}
                                className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat Berkas Pemeriksaan"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 3: PROFILE MEDIS PASIEN KOMPLEKS ── */}
              {activeTab === 'PROFILE_MEDIS' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Profil Medis Terintegrasi Pasien Kompleks
                      </h3>
                      <p className="text-xs text-slate-500">Rekapitulasi riwayat tindakan, terapi, dan penunjang lintas episode pelayanan</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncProfile}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Segarkan Data</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Tanggal & No. Reg</th>
                          <th className="p-3">Poli Kunjungan</th>
                          <th className="p-3">Diagnosa</th>
                          <th className="p-3">Tindakan</th>
                          <th className="p-3">Terapi</th>
                          <th className="p-3">Penunjang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.medicalProfile || []).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-bold text-slate-900 dark:text-white block">{p.date}</span>
                              <span className="font-mono text-[10px] text-teal-600 dark:text-teal-400">{p.regId}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{p.clinic}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{p.diagnosis}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{p.procedure}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{p.therapy}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{p.diagnostic}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 4: LABORATORIUM ── */}
              {activeTab === 'TAB_LAB' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Hasil Pemeriksaan Laboratorium Pasien
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('TAB_RUJUKAN'); setIsReferralModalOpen(true); }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Lab Baru</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Parameter Uji</th>
                          <th className="p-3">Hasil Pemeriksaan</th>
                          <th className="p-3">Satuan</th>
                          <th className="p-3">Nilai Rujukan Normal</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.laboratoryResults || []).map((lab) => (
                          <tr key={lab.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{lab.parameter}</td>
                            <td className={`p-3 font-mono font-black ${
                              lab.status === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400 text-sm' :
                              lab.status === 'LOW' ? 'text-amber-600' :
                              lab.status === 'ABNORMAL' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'
                            }`}>
                              {lab.value}
                            </td>
                            <td className="p-3 text-slate-500">{lab.unit}</td>
                            <td className="p-3 text-slate-500 font-mono">{lab.normal}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                lab.status === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse' :
                                lab.status === 'LOW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                                lab.status === 'ABNORMAL' ? 'bg-rose-100 text-rose-800' :
                                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}>
                                {lab.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 5: RADIOLOGI ── */}
              {activeTab === 'TAB_RAD' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Ekspertise & Citra Radiologi
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('TAB_RUJUKAN'); setIsReferralModalOpen(true); }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Order Radiologi</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(examData.radiologyResults || []).map((rad) => (
                      <div key={rad.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{rad.study}</span>
                            <span className="text-[10px] text-slate-500 ml-2">Tanggal: {rad.date}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase">
                            {rad.status}
                          </span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <p className="font-bold text-slate-900 dark:text-white mb-1">Kesan Ekspertise:</p>
                          <p>{rad.impression}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Dokter Radiolog: {rad.doctor}</span>
                          <button
                            type="button"
                            onClick={() => toast.success('Membuka PACS DICOM Web Viewer')}
                            className="px-3 py-1 rounded-xl bg-[#015C80] text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Citra PACS</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 6: DIAGNOSA ── */}
              {activeTab === 'TAB_DIAGNOSA' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Riwayat Diagnosa ICD-10 Pasien
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsDiagnosisModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ubah Diagnosa</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <span className="font-black text-indigo-900 dark:text-indigo-200 block mb-1">Diagnosa Utama (Primary):</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{examData.primaryDiagnosis}</p>
                    <span className="font-black text-indigo-900 dark:text-indigo-200 block mt-3 mb-1">Diagnosa Sekunder / Penyerta:</span>
                    <ul className="list-disc list-inside text-slate-700 dark:text-slate-300">
                      {(examData.secondaryDiagnoses || []).map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ── TAB 7: RESEP ONLINE ── */}
              {activeTab === 'TAB_RESEP' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Order Resep Online Pasien
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setRxInput(prev => ({ ...prev, isRacikan: false })); setIsPrescriptionModalOpen(true); }}
                        className="px-3 py-1.5 rounded-xl bg-[#015C80] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Resep Reguler</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRxInput(prev => ({ ...prev, isRacikan: true })); setIsPrescriptionModalOpen(true); }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Resep Racikan</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Tanggal Order</th>
                          <th className="p-3">Nama Obat / Racikan</th>
                          <th className="p-3">Aturan Pakai & Signa</th>
                          <th className="p-3">Jumlah</th>
                          <th className="p-3">Tipe</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.onlinePrescriptions || []).map((rx) => (
                          <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{rx.date}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{rx.name}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{rx.instructions}</td>
                            <td className="p-3 font-bold text-teal-700 dark:text-teal-300">{rx.quantity}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                rx.type === 'RACIKAN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {rx.type}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                                {rx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 8: RUJUKAN INTERNAL & PENUNJANG ── */}
              {activeTab === 'TAB_RUJUKAN' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Rujukan Penunjang & Konsultasi Spesialis
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => { setReferralInput({ target: 'Laboratorium Sentral', description: '', cito: false }); setIsReferralModalOpen(true); }}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ruj. Lab</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReferralInput({ target: 'Instalasi Radiologi', description: '', cito: false }); setIsReferralModalOpen(true); }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ruj. Radiologi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReferralInput({ target: 'Bank Darah Rumah Sakit (BDRS)', description: '', cito: false }); setIsReferralModalOpen(true); }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Ruj. Bank Darah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReferralInput({ target: 'Panel Penunjang Diagnostik', description: '', cito: false }); setIsReferralModalOpen(true); }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Panel Diagnostik</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Tujuan Rujukan</th>
                          <th className="p-3">Instruksi / Permintaan Klinis</th>
                          <th className="p-3 text-center">Urgensi</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.referrals || []).map((ref) => (
                          <tr key={ref.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{ref.date}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{ref.target}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{ref.description}</td>
                            <td className="p-3 text-center">
                              {ref.cito ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] animate-pulse">CITO</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[9px]">RUTIN</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black">
                                {ref.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 9: HISTORI PEMERIKSAAN (LONGITUDINAL) ── */}
              {activeTab === 'TAB_HISTORI' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Histori Pemeriksaan Longitudinal Lintas Tahun Pasien
                    </h3>
                    <span className="text-xs text-slate-500">10 Pemeriksaan Terdokumentasi</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3 text-center w-12">No</th>
                          <th className="p-3">Tanggal & Waktu</th>
                          <th className="p-3">Oleh (Pemeriksa)</th>
                          <th className="p-3">Nama Pemeriksaan / Layanan</th>
                          <th className="p-3 text-center w-24">Lihat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {(examData.examinationHistory || []).map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 text-center text-slate-400 font-mono">{h.id}</td>
                            <td className="p-3 font-mono text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">{h.date}</td>
                            <td className="p-3 font-bold text-slate-900 dark:text-white">{h.examiner}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{h.examName}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => toast.success(`Membuka arsip pemeriksaan ${h.examName}`)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer inline-flex items-center justify-center"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── TAB 10: JADWAL KONTROL ── */}
              {activeTab === 'TAB_KONTROL' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Jadwal Kontrol Rawat Jalan Selanjutnya
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsControlModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#015C80] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Jadwal Kontrol</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(examData.controlSchedules || []).map((ctrl) => (
                      <div key={ctrl.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-[#015C80] dark:text-teal-400">
                            {ctrl.controlDate}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-bold">
                            Terkonfirmasi
                          </span>
                        </div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white">{ctrl.clinic}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Dokter: {ctrl.doctor}</p>
                        <p className="text-xs text-slate-500 italic mt-1">Catatan: {ctrl.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 11: HASIL SCAN DOKUMEN LUAR ── */}
              {activeTab === 'TAB_SCAN_DOKUMEN' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Hasil Scan Dokumen Penunjang & Berkas Luar
                      </h3>
                      <p className="text-xs text-slate-500">Berkas pindaian eksternal dari UGD, laboratorium luar, dan edukasi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/emr/upload-penunjang')}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Dokumen Baru</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {(examData.scannedExternalDocs || []).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between hover:border-teal-500 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                            PDF
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[220px]">
                              {doc.fileName}
                            </p>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {doc.category} • {doc.date} • {doc.size}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="px-3 py-1.5 rounded-xl bg-[#015C80] hover:bg-[#014c6a] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 12: SURAT KETERANGAN DOKTER DENGAN TTE ── */}
              {activeTab === 'TAB_SURAT_KET' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Surat Keterangan Medis Terverifikasi TTE
                      </h3>
                      <p className="text-xs text-slate-500">Tanda Tangan Elektronik (TTE) Tersertifikasi BSrE</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLetterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#015C80] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Surat Keterangan</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(examData.medicalLetters || []).map((sk) => (
                      <div key={sk.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{sk.type}</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black">
                              {sk.statusTte}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">No: {sk.number}</p>
                          <p className="text-xs text-slate-500">Dokter: {sk.doctor} • Durasi: {sk.duration}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toast.success('Mencetak Surat Keterangan Medis')}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 13: RIWAYAT PELAYANAN JKN (ICARE JKN) ── */}
              {activeTab === 'TAB_ICARE_JKN' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Integrasi i-Care JKN (BPJS Kesehatan)
                      </h3>
                      <p className="text-xs text-slate-500">Riwayat Pelayanan Faskes Tingkat 1 & Program Rujuk Balik (PRB)</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-xs">
                      Status BPJS: {examData.icareJkn?.status || 'AKTIF'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Nomor Kartu BPJS</span>
                      <p className="font-mono font-black text-sm text-[#015C80] dark:text-teal-400">
                        {examData.icareJkn?.bpjsNumber}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fasilitas Kesehatan Tingkat 1 (FKTP)</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {examData.icareJkn?.faskesTingkat1}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Riwayat PRB Kronis</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {examData.icareJkn?.riwayatKronisPrb}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
                    <span className="font-bold text-teal-900 dark:text-teal-200 block mb-1">Riwayat Kunjungan Faskes Primer Terakhir:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-mono">{examData.icareJkn?.riwayatKunjunganFktp}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1: CARI PASIEN COMPREHENSIVE MODAL ── */}
      <ClinicalModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Pencarian Pasien Rawat Jalan (EMR RJ)"
        description="Filter pencarian multi-kriteria berdasarkan No. Reg, No. RM, Nama, Poliklinik, dan Penjamin"
        size="lg"
      >
        <form onSubmit={handleSearchPasienSubmit} className="flex flex-col gap-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">No. Registrasi</label>
              <input
                type="text"
                placeholder="P260907..."
                value={searchCriteria.regId}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, regId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">No. Rekam Medis</label>
              <input
                type="text"
                placeholder="00360..."
                value={searchCriteria.mrn}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, mrn: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Pasien</label>
              <input
                type="text"
                placeholder="Nama Pasien..."
                value={searchCriteria.name}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Departemen / Poliklinik</label>
              <select
                value={searchCriteria.departmentId}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, departmentId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">Semua Departemen / Poli...</option>
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Penjamin Biaya</label>
              <select
                value={searchCriteria.payerId}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, payerId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <option value="">Semua Penjamin / Asuransi...</option>
                {payers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSearchCriteria({ regId: '', mrn: '', name: '', departmentId: '', payerId: '' })}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Sekarang</span>
            </button>
          </div>

          {/* Search Results Preview */}
          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <span className="font-bold text-slate-500 text-[11px]">Hasil Pencarian ({searchResults.length} Pasien):</span>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handlePickSearchResult(p)}
                    className="p-3 hover:bg-teal-50/60 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.patientName}</p>
                      <span className="text-[10px] text-slate-500 font-mono">RM: {p.mrn} • Poli: {p.clinic} • {p.paymentMethod}</span>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-[#015C80] text-white font-bold text-[10px]">
                      Pilih Pasien
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </ClinicalModal>

      {/* ── MODAL 2: TAMBAH ALERGI ── */}
      <ClinicalModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        title="Tambah Riwayat Alergi Pasien"
        size="md"
      >
        <form onSubmit={handleSaveAllergy} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Alergen / Zat Pemicu *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Amoxicillin, Paracetamol, Seafood..."
              value={allergyInput.allergen}
              onChange={(e) => setAllergyInput(prev => ({ ...prev, allergen: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reaksi Klinis</label>
            <input
              type="text"
              placeholder="Contoh: Urtikaria, Gatal, Sesak Nafas..."
              value={allergyInput.reaction}
              onChange={(e) => setAllergyInput(prev => ({ ...prev, reaction: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tingkat Keparahan</label>
            <select
              value={allergyInput.severity}
              onChange={(e) => setAllergyInput(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="RINGAN">Ringan</option>
              <option value="SEDANG">Sedang</option>
              <option value="BERAT">Berat / Anafilaksis</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAllergyModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs cursor-pointer"
            >
              Simpan Alergi
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 3: TAMBAH VAKSIN ── */}
      <ClinicalModal
        isOpen={isVaccineModalOpen}
        onClose={() => setIsVaccineModalOpen(false)}
        title="Tambah Riwayat Vaksinasi Pasien"
        size="md"
      >
        <form onSubmit={handleSaveVaccine} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Vaksin *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Vaksin Hepatitis B, BCG, Influenza..."
              value={vaccineInput.name}
              onChange={(e) => setVaccineInput(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tanggal Pemberian</label>
              <input
                type="date"
                value={vaccineInput.date}
                onChange={(e) => setVaccineInput(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Fasilitas Pelaksana</label>
              <input
                type="text"
                value={vaccineInput.provider}
                onChange={(e) => setVaccineInput(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVaccineModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs cursor-pointer"
            >
              Simpan Vaksin
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 4: EDIT DIAGNOSA ── */}
      <ClinicalModal
        isOpen={isDiagnosisModalOpen}
        onClose={() => setIsDiagnosisModalOpen(false)}
        title="Perbarui Diagnosa Klinis & ICD-10"
        size="md"
      >
        <form onSubmit={handleSaveDiagnosis} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnosa Kerja (Free Text / Deskriptif) *</label>
            <input
              type="text"
              required
              value={diagnosisInput.workingDiagnosis}
              onChange={(e) => setDiagnosisInput(prev => ({ ...prev, workingDiagnosis: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnosa Utama (ICD-10) *</label>
            <input
              type="text"
              required
              value={diagnosisInput.primaryDiagnosis}
              onChange={(e) => setDiagnosisInput(prev => ({ ...prev, primaryDiagnosis: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Diagnosa Sekunder (Satu per baris)</label>
            <textarea
              rows={3}
              value={diagnosisInput.secondaryDiagnosesText}
              onChange={(e) => setDiagnosisInput(prev => ({ ...prev, secondaryDiagnosesText: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDiagnosisModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs cursor-pointer"
            >
              Simpan Diagnosa
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 5: TAMBAH RESEP ONLINE ── */}
      <ClinicalModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        title={rxInput.isRacikan ? "Buat Resep Racikan / Kompounding" : "Buat Resep Obat Reguler"}
        size="md"
      >
        <form onSubmit={handleSavePrescription} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Nama Obat & Sediaan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Paracetamol 500mg, Amoxicillin 500mg..."
              value={rxInput.name}
              onChange={(e) => setRxInput(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Signa / Aturan Pakai *</label>
            <input
              type="text"
              required
              placeholder="Contoh: 3 x 1 tablet sesudah makan..."
              value={rxInput.instructions}
              onChange={(e) => setRxInput(prev => ({ ...prev, instructions: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jumlah</label>
            <input
              type="text"
              value={rxInput.quantity}
              onChange={(e) => setRxInput(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold text-xs cursor-pointer"
            >
              Kirim ke Farmasi
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 6: BUAT RUJUKAN ── */}
      <ClinicalModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        title="Ajukan Rujukan Penunjang / Konsultasi"
        size="md"
      >
        <form onSubmit={handleSaveReferral} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Unit Tujuan Rujukan</label>
            <input
              type="text"
              value={referralInput.target}
              onChange={(e) => setReferralInput(prev => ({ ...prev, target: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Instruksi & Permintaan Klinis *</label>
            <textarea
              rows={3}
              required
              placeholder="Jelaskan indikasi pemeriksaan atau pertanyaan klinis..."
              value={referralInput.description}
              onChange={(e) => setReferralInput(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={referralInput.cito}
              onChange={(e) => setReferralInput(prev => ({ ...prev, cito: e.target.checked }))}
              className="rounded text-rose-600"
            />
            <span className="font-bold text-rose-600">CITO / Darurat (Prioritas Tinggi)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReferralModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold text-xs cursor-pointer"
            >
              Kirim Rujukan
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 7: JADWAL KONTROL ── */}
      <ClinicalModal
        isOpen={isControlModalOpen}
        onClose={() => setIsControlModalOpen(false)}
        title="Jadwal Kontrol Poliklinik Pasien"
        size="md"
      >
        <form onSubmit={handleSaveControl} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tanggal Kontrol *</label>
            <input
              type="date"
              required
              value={controlInput.controlDate}
              onChange={(e) => setControlInput(prev => ({ ...prev, controlDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Poliklinik Tujuan</label>
            <input
              type="text"
              value={controlInput.clinic}
              onChange={(e) => setControlInput(prev => ({ ...prev, clinic: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Dokter DPJP</label>
            <input
              type="text"
              value={controlInput.doctor}
              onChange={(e) => setControlInput(prev => ({ ...prev, doctor: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catatan Khusus</label>
            <input
              type="text"
              placeholder="Contoh: Membawa hasil lab terbaru..."
              value={controlInput.notes}
              onChange={(e) => setControlInput(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsControlModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold text-xs cursor-pointer"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 8: SURAT KETERANGAN ── */}
      <ClinicalModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        title="Terbitkan Surat Keterangan Medis"
        size="md"
      >
        <form onSubmit={handleSaveLetter} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Jenis Surat</label>
            <select
              value={letterInput.type}
              onChange={(e) => setLetterInput(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="Surat Keterangan Sakit (Istirahat)">Surat Keterangan Sakit (Istirahat)</option>
              <option value="Surat Keterangan Berbadan Sehat">Surat Keterangan Berbadan Sehat</option>
              <option value="Surat Keterangan Kematian">Surat Keterangan Kematian</option>
              <option value="Surat Keterangan Lahir">Surat Keterangan Lahir</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Durasi / Masa Berlaku</label>
            <input
              type="text"
              placeholder="Contoh: 3 Hari (10 s.d. 12 September 2026)..."
              value={letterInput.duration}
              onChange={(e) => setLetterInput(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
            ✓ Surat akan otomatis dibubuhi Tanda Tangan Elektronik (TTE) terverifikasi atas nama {examData.doctorName}.
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsLetterModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
            >
              Terbitkan & TTE
            </button>
          </div>
        </form>
      </ClinicalModal>

      {/* ── MODAL 9: PDF LIGHTBOX PREVIEW ── */}
      <ClinicalModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc ? previewDoc.fileName : 'Pratinjau Dokumen'}
        size="lg"
      >
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl mb-3">
            PDF
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{previewDoc?.fileName}</h4>
          <p className="text-xs text-slate-500 mb-4">{previewDoc?.category} • {previewDoc?.date} • {previewDoc?.size}</p>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full text-xs text-slate-600 dark:text-slate-300 text-left mb-4">
            <p className="font-bold mb-1">Status Verifikasi Sistem:</p>
            <p className="text-emerald-600 font-semibold">✓ Tervalidasi Dokumen Resmi Pasien ({examData.mrn})</p>
            <p className="text-slate-400 text-[10px] mt-1">Hash SHA-256: 8f9b2c...a14e</p>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Mengunduh dokumen PDF...')}
            className="px-4 py-2 rounded-xl bg-[#015C80] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Berkas Asli</span>
          </button>
        </div>
      </ClinicalModal>
    </div>
  );
}
