import React, { useState, useMemo } from 'react';
import { 
  Database, UserPlus, RefreshCw, Download, Upload, Trash2, Search, 
  CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, FileText, Pill, 
  Receipt, Stethoscope, Hash, Fingerprint, Calendar, Eye, Code, 
  Sliders, PlusCircle, Check, Copy, Activity, Building2, Layers,
  FileCheck, Shield, FileSpreadsheet, FolderPlus, FolderOpen, ExternalLink,
  Users, BadgeCheck, Briefcase, Mail, Phone, Lock, Award, Inbox, CheckSquare, Square, Zap, SlidersHorizontal,
  MapPin, Heart, BookOpen, UserCheck, ShieldAlert, Globe, Compass, LifeBuoy, HeartPulse, UserX, AlertCircle,
  QrCode, Cpu, History, UserCheck2, FileSpreadsheet as FileSpreadsheetIcon, Baby, Wallet, Landmark, Info, Clock, UserCog
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../patient/patient.store.js';
import { saveStaffMember, saveStaffList, getStaffList } from '../services/staffManagement.service.js';
import StaffPortfolioDetailModal from '../components/StaffPortfolioDetailModal.jsx';
import { HOSPITAL_PROFESSION_CATEGORIES, HOSPITAL_PROFESSIONS } from '../services/hospitalProfessionsTaxonomy.js';
import { PATIENT_MASTER_32_CATEGORIES } from '../services/patientMaster32Taxonomy.js';
import OceanicTealLoadingSpinner from '../../../components/ui/OceanicTealLoadingSpinner.jsx';

// Random Generator Helpers for Realistic Indonesian Clinical & Staff Data
const FIRST_NAMES_MALE = ['Budi', 'Hendra', 'Nicholas', 'Ahmad', 'Rizky', 'Bambang', 'Agung', 'Doni', 'Eko', 'Fajar', 'Gede', 'Irfan', 'Joko', 'Lukman', 'Muhammad', 'Rudi', 'Sutisna', 'Taufik', 'Wahyu', 'Yudi'];
const FIRST_NAMES_FEMALE = ['Siti', 'Sri', 'Najwa', 'Retno', 'Kartini', 'Dewi', 'Amanda', 'Anisa', 'Citra', 'Dian', 'Endang', 'Fitri', 'Indah', 'Maya', 'Nita', 'Putri', 'Rina', 'Tuti', 'Wulan', 'Yulia'];
const LAST_NAMES = ['Nurhaliza', 'Saputra', 'Gunawan', 'Shihab', 'Marsudi', 'Rahayu', 'Sutisna', 'Wijaya', 'Kusuma', 'Utami', 'Hidayat', 'Pratama', 'Santoso', 'Wibowo', 'Firmansyah', 'Suryani', 'Mulyani', 'Lestari', 'Subagyo'];

const MOTHER_NAMES = ['Siti Aminah', 'Sri Rahayu', 'Dewi Kartika', 'Endang Lestari', 'Retno Wulandari', 'Tuti Alawiyah', 'Yulia Pratiwi'];
const FATHER_NAMES = ['Bambang Wijaya', 'Hendra Kusuma', 'Joko Santoso', 'Muhammad Hidayat', 'Ahmad Pratama', 'Rudi Firmansyah'];

const CITIES = ['Bandung', 'Jakarta Selatan', 'Surabaya', 'Semarang', 'Medan', 'Yogyakarta', 'Makassar', 'Denpasar', 'Palembang', 'Balikpapan'];
const BLOOD_TYPES = ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'];
const RELIGIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const MARITAL_STATUSES = ['Menikah', 'Belum Menikah', 'Cerai Hidup', 'Cerai Mati'];
const ETHNICITIES = ['Sunda', 'Jawa', 'Batak', 'Minang', 'Bugis', 'Betawi', 'Tionghoa', 'Bali'];
const EDUCATIONS = ['SMA / SMK', 'Diploma 3 (D3)', 'Sarjana (S1)', 'Magister (S2)', 'SMP / Sederajat'];
const OCCUPATIONS = ['Karyawan Swasta', 'Pegawai Negeri Sipil (PNS)', 'Wirausaha / Pengusaha', 'Ibu Rumah Tangga', 'BUMN', 'TNI / POLRI', 'Pelajar / Mahasiswa'];
const EMERGENCY_RELATIONS = ['Suami', 'Istri', 'Orang Tua (Ayah/Ibu)', 'Anak Kandung', 'Saudara Kandung', 'Wali Legal'];

const CLINICAL_DIAGNOSES = [
  { code: 'J00', name: 'Acute Nasopharyngitis (Common Cold)' },
  { code: 'I10', name: 'Essential (Primary) Hypertension' },
  { code: 'E11.9', name: 'Type 2 Diabetes Mellitus without Complications' },
  { code: 'R50.9', name: 'Fever, Unspecified (Obs. Febris)' },
  { code: 'K29.7', name: 'Gastritis, Unspecified' },
  { code: 'A09', name: 'Infectious Gastroenteritis and Colitis, Unspecified' }
];

const DOCTORS = [
  { name: 'dr. Ahmad Hidayat, Sp.PD', nip: 'NIP-19800101-2026-001', str: 'STR-19800101-2026-001', sip: 'SIP-440/1234/DISKES' },
  { name: 'dr. Hendra Kusuma, Sp.A', nip: 'NIP-19820315-2026-002', str: 'STR-19820315-2026-002', sip: 'SIP-440/2345/DISKES' },
  { name: 'dr. Rizky Pratama, Sp.B', nip: 'NIP-19850720-2026-003', str: 'STR-19850720-2026-003', sip: 'SIP-440/3456/DISKES' },
  { name: 'dr. Najwa Shihab, Sp.OG', nip: 'NIP-19881112-2026-004', str: 'STR-19881112-2026-004', sip: 'SIP-440/4567/DISKES' },
  { name: 'dr. Budi Santoso, Sp.JP', nip: 'NIP-19790909-2026-005', str: 'STR-19790909-2026-005', sip: 'SIP-440/5678/DISKES' },
  { name: 'dr. Lukman Hakim, Sp.OG', nip: 'NIP-19840614-2026-006', str: 'STR-19840614-2026-006', sip: 'SIP-440/6280/DISKES' }
];

const NURSES = [
  { name: 'Ns. Ratna Mulyani, S.Kep', nip: 'NIP-19910510-2026-101', str: 'STR-NURSE-991' },
  { name: 'Ns. Endang Lestari, S.Kep', nip: 'NIP-19930718-2026-102', str: 'STR-NURSE-992' },
  { name: 'Ns. Rudi Firmansyah, S.Kep', nip: 'NIP-19891204-2026-103', str: 'STR-NURSE-993' }
];

const PHARMACISTS = [
  { name: 'Apt. Siti Aminah, S.Farm', sipa: 'SIPA-440/0912/DISKES', stra: 'STRA-19900512-001' },
  { name: 'Apt. Budi Wijaya, M.Farm', sipa: 'SIPA-440/1823/DISKES', stra: 'STRA-19871109-002' }
];

// 1. DEDICATED PATIENT DUMMY MOCK CATEGORIES (32 MASTER CATEGORIES COMPLETE)
const PATIENT_INJECTION_CATEGORIES = PATIENT_MASTER_32_CATEGORIES.map(cat => ({
  id: cat.id,
  label: cat.title,
  desc: cat.desc,
  category: cat.category,
  badgeColor: cat.badgeColor,
  details: cat.details
}));

// 2. DEDICATED STAFF & EMPLOYEE DUMMY MOCK CATEGORIES (20 ENTERPRISE HRMS & RBAC SUB-MODULES)
const STAFF_INJECTION_CATEGORIES = [
  { 
    id: 'staff_identitas', 
    label: '1. Identitas & Demografi Karyawan', 
    desc: 'NIK 16-Digit, Nama Lengkap + Gelar, TTL, Usia, Gender, Agama, Gol. Darah, Rhesus', 
    category: 'Demografi Karyawan',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'Identitas Utama (NIP RS, NIK 16-Digit Dukcapil Verified, Paspor)',
      'Data Pribadi (Nama Lengkap, Gelar Depan/Belakang, TTL, Usia, Gender, Agama)',
      'Fisik & Biometri (Golongan Darah, Rhesus, Status Pernikahan, WNI/WNA)'
    ]
  },
  { 
    id: 'staff_kepegawaian', 
    label: '2. Data Kepegawaian & Status NIP', 
    desc: 'NIP Resmi RS, Status Kepegawaian (PNS/Tetap/Kontrak/Mitra), TMT, Fingerprint ID', 
    category: 'Kepegawaian',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    details: [
      'NIP Resmi Rumah Sakit & Status Kepegawaian (PNS / Tetap / Kontrak / Dokter Mitra)',
      'Tanggal Mulai Tugas (TMT), Masa Kerja, Status Keaktifan (Active / Leave / Retired)',
      'ID Biometri Fingerprint (Presensi) & Tag RFID Badge Card Karyawan'
    ]
  },
  { 
    id: 'staff_organisasi', 
    label: '3. Jabatan & Struktur Organisasi', 
    desc: 'Departemen/Unit Kerja, Jabatan Struktural & Fungsional, Supervisor, Grade Eselon', 
    category: 'Struktur Organisasi',
    badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    details: [
      'Departemen & Unit Kerja Penugasan (Pelayanan Medis, Keperawatan, Farmasi, Admin)',
      'Jabatan Struktural (Kepala SMF, Head Nurse, Supervisor) & Jabatan Fungsional',
      'Atasan Langsung (Direct Supervisor Name) & Level Grade Eselon Kepegawaian'
    ]
  },
  { 
    id: 'staff_lisensi', 
    label: '4. Lisensi & STR/SIP/SIK Kredensial', 
    desc: 'Nomor STR, Masa Berlaku STR, Nomor SIP, Masa Berlaku SIP, Issuer, Warning 90 Hari', 
    category: 'Kredensial Medis',
    badgeColor: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    details: [
      'Surat Tanda Registrasi (Nomor STR Aktif & Masa Berlaku KKTK/KKI)',
      'Surat Izin Praktik (Nomor SIP Active, Masa Berlaku & Jenis SIP Praktik 1/2/3)',
      'Instansi Penerbit (Dinas Kesehatan) & Peringatan Dini Status Warning 90 Hari'
    ]
  },
  { 
    id: 'staff_pendidikan', 
    label: '5. Pendidikan & Sertifikasi Klinis', 
    desc: 'Pendidikan Terakhir, PT/Universitas Asal, No. Ijazah, Sertifikasi BTCLS/ACLS/GCP', 
    category: 'Pendidikan & Kompetensi',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
    details: [
      'Pendidikan Terakhir (Sub-Spesialis, Spesialis, S2, S1 Ns, S.Farm, D3)',
      'Universitas / Perguruan Tinggi Asal & Nomor Ijazah Legalisir',
      'Sertifikasi Klinis Aktif (BTCLS, ACLS, ENLS, ATLS, HIPKABI, GCP International)'
    ]
  },
  { 
    id: 'staff_pengalaman', 
    label: '6. Riwayat Pekerjaan & Portofolio', 
    desc: 'Pengalaman RS Lain, Jabatan Terakhir, Prestasi Klinis & Refferal', 
    category: 'Karir & Pengalaman',
    badgeColor: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    details: [
      'Riwayat Pengalaman RS / Instansi Kesehatan Sebelumnya',
      'Jabatan Terakhir & Portofolio Tindakan Klinis yang Pernah Dilakukan'
    ]
  },
  { 
    id: 'staff_kredensial', 
    label: '7. Kompetensi & Kredensial (JCI SQE)', 
    desc: 'Komite Medis Credentialing, Rincian Kewenangan Klinis (RKK), White Paper L1-4', 
    category: 'Audit JCI SQE',
    badgeColor: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    details: [
      'Keputusan Komite Medis / Keperawatan Credentialing JCI SQE',
      'Rincian Kewenangan Klinis (RKK / Clinical Privilege Document)',
      'White Paper Competency Level (Level 1 Mandiri s/d Level 4 Kompleks)'
    ]
  },
  { 
    id: 'staff_jadwal', 
    label: '8. Jadwal Kerja & Shift (Duty Roster)', 
    desc: 'Pola Shift Pagi/Siang/Malam, Duty Roster Quota, On-Call Emergency IGD', 
    category: 'Jadwal Kerja',
    badgeColor: 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
    details: [
      'Pola Duty Roster Shift (Pagi 07:30-15:30, Siang 14:00-21:30, Malam 21:00-07:30)',
      'Jadwal On-Call Emergency Dokter Spesialis & Perawat Kritis',
      'Kuota Jam Kerja Bulanan (160 Jam / Bulan) & Roster Pertukaran Shift'
    ]
  },
  { 
    id: 'staff_absensi', 
    label: '9. Absensi & Cuti Karyawan', 
    desc: 'Presensi Biometri Fingerprint, Kuota Cuti Tahunan 12 Hari, Cuti Melahirkan/Sakit', 
    category: 'Presensi & Cuti',
    badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    details: [
      'Rekapitulasi Presensi Biometri Fingerprint & Log Terlambat',
      'Sisa Kuota Cuti Tahunan (12 Hari), Cuti Melahirkan, Cuti Sakit'
    ]
  },
  { 
    id: 'staff_payroll', 
    label: '10. Payroll, Remunerasi & Benefit', 
    desc: 'No. Rekening Bank BCA/Mandiri, Gaji Pokok, Tunjangan Klinis, Fee for Service, NPWP', 
    category: 'Payroll & Remunerasi',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'Nomor Rekening Bank Payroll (Bank BCA / Mandiri / BNI) & NPWP Tax ID',
      'Gaji Pokok, Tunjangan Jabatan, Tunjangan Risiko Klinis, Jasa Medis (Fee for Service)'
    ]
  },
  { 
    id: 'staff_kpi', 
    label: '11. Penilaian Kinerja (KPI & 360 Evaluation)', 
    desc: 'Key Performance Indicators, Indeks Kepuasan Pasien, Evaluasi 360-Derajat', 
    category: 'Kinerja Karyawan',
    badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    details: [
      'Score KPI (Key Performance Indicators) Tahunan Staff (Sangat Baik / Baik)',
      'Rating Kepuasan Pasien (Patient Satisfaction Score 4.9/5.0) & Evaluasi 360°'
    ]
  },
  { 
    id: 'staff_cme', 
    label: '12. Pelatihan & CME (SKP Kemenkes RI)', 
    desc: 'Pelatihan K3RS, JCI Safety Hours, SKP Kemenkes RI, CPD Seminar', 
    category: 'Pendidikan Berkelanjutan',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
    details: [
      'Perolehan Satuan Kredit Profesi (SKP Kemenkes RI / Plataran Sehat)',
      'Jam Pelatihan Keselamatan Pasien (JCI Patient Safety Officer Training)'
    ]
  },
  { 
    id: 'staff_kesehatan', 
    label: '13. Kesehatan Karyawan & Vaksinasi', 
    desc: 'Annual MCU Result, Vaksin Hepatitis B, COVID Booster, TB Screening, Fit-for-Duty', 
    category: 'Occupational Health',
    badgeColor: 'bg-teal-500/10 text-teal-600 border border-teal-500/20',
    details: [
      'Hasil Medical Check-Up (MCU) Tahunan & Status Fit-for-Duty',
      'Status Vaksinasi Hepatitis B, COVID-19 Booster & Skrining Tuberkulosis (TBC)'
    ]
  },
  { 
    id: 'staff_dokumen', 
    label: '14. Dokumen Personalia Digital (Vault)', 
    desc: 'File Vault Scan KTP, NPWP, KK, Ijazah, STR, SIP, Kontrak Kerja', 
    category: 'Arsip Digital',
    badgeColor: 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
    details: [
      'Digital File Cabinet (Scan KTP, NPWP, KK, Ijazah Legalisir, Transkrip)',
      'Scan Berkas STR, Scan SIP, Sertifikat BTCLS, SKCK & Surat Kontrak Kerja'
    ]
  },
  { 
    id: 'staff_akses', 
    label: '15. Akses Sistem & RBAC Matrix', 
    desc: 'Username, Access Level Role SUPER_ADMIN/DOCTOR/NURSE/PHARMACIST, 2FA/MFA', 
    category: 'Keamanan System RBAC',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    details: [
      'Role Level Access RBAC (SUPER_ADMIN, DOCTOR_SPECIALIST, HEAD_NURSE, PHARMACIST)',
      'Status Multi-Factor Authentication (MFA / 2FA), Username & IP Session Login'
    ]
  },
  { 
    id: 'staff_aset', 
    label: '16. Aset yang Dipinjamkan (Assets)', 
    desc: 'Laptop/Tablet Medis RS, Stetoskop, Badge RFID, Token Digital Signature', 
    category: 'Inventaris Aset',
    badgeColor: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
    details: [
      'Inventaris Aset RS Dipinjamkan (Tablet Medis iPad Pro, Stetoskop, RFID Badge)',
      'Kode Aset Barcode & Status Penyerahan Aset Kedinasan'
    ]
  },
  { 
    id: 'staff_disiplin', 
    label: '17. Riwayat Disiplin & Penghargaan', 
    desc: 'Catatan SP 1/2/3, Award Employee of the Month, Best Clinical Performance', 
    category: 'Reward & Disiplin',
    badgeColor: 'bg-pink-500/10 text-pink-600 border border-pink-500/20',
    details: [
      'Bebas Surat Peringatan (SP 1/2/3) & Catatan Komplain Pasien',
      'Penghargaan Kedinasan (Employee of the Month & Best Clinical Compliance)'
    ]
  },
  { 
    id: 'staff_ttd', 
    label: '18. Digital Signature & Approval Authority', 
    desc: 'BSRE Digital Certificate Hash, Approval Limit Nominal Material Request', 
    category: 'Otorisasi & E-Sign',
    badgeColor: 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
    details: [
      'Certificate Hash Tanda Tangan Digital BSRE / Privy Verification',
      'Batas Maksimum Wewenang Approval Nominal Material Request & Prescription'
    ]
  },
  { 
    id: 'staff_audit', 
    label: '19. Audit Trail Perubahan Data', 
    desc: 'Immutable Event Logs, Editor NIP, Field Changed, IP Address, Device Fingerprint', 
    category: 'Audit Log Kepegawaian',
    badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    details: [
      'Log Perubahan Data Kepegawaian (Waktu Edit, NIP Editor, Field Modified)',
      'Traceability Audit Trail IP Address & Device Fingerprint'
    ]
  },
  { 
    id: 'staff_integrasi', 
    label: '20. Integrasi SATUSEHAT Practitioner & External', 
    desc: 'SATUSEHAT Practitioner ID Practitioner/P-1002..., BPJS Kesehatan/Ketenagakerjaan, SSO ID', 
    category: 'Integrasi External',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
    details: [
      'SATUSEHAT FHIR Practitioner Resource ID (`Practitioner/P-1002998811`)',
      'SATUSEHAT FHIR PractitionerRole Resource ID (`PractitionerRole/PR-998811`)',
      'Nomor BPJS Kesehatan, BPJS Ketenagakerjaan & Active Directory SSO ID'
    ]
  }
];

const STAFF_PORTFOLIO_NAV_ITEMS = [
  { id: 'identitas', label: '1. Identitas & Demografi', icon: Fingerprint },
  { id: 'kepegawaian', label: '2. Data Kepegawaian', icon: BadgeCheck },
  { id: 'organisasi', label: '3. Jabatan & Struktur', icon: Building2 },
  { id: 'lisensi', label: '4. Lisensi STR/SIP', icon: Award },
  { id: 'pendidikan', label: '5. Pendidikan & Sertifikasi', icon: BookOpen },
  { id: 'pengalaman', label: '6. Riwayat Kerja', icon: Briefcase },
  { id: 'kredensial', label: '7. Kredensial (JCI SQE)', icon: ShieldCheck },
  { id: 'jadwal', label: '8. Jadwal & Shift', icon: Calendar },
  { id: 'absensi', label: '9. Absensi & Cuti', icon: Clock },
  { id: 'payroll', label: '10. Payroll & Benefit', icon: Wallet },
  { id: 'kpi', label: '11. Penilaian Kinerja (KPI)', icon: Activity },
  { id: 'cme', label: '12. Pelatihan & CME (SKP)', icon: Award },
  { id: 'kesehatan', label: '13. Kesehatan & MCU', icon: HeartPulse },
  { id: 'dokumen', label: '14. Dokumen Personalia', icon: FileSpreadsheetIcon },
  { id: 'akses', label: '15. Akses System & RBAC', icon: Lock },
  { id: 'aset', label: '16. Aset Dipinjamkan', icon: Layers },
  { id: 'disiplin', label: '17. Disiplin & Reward', icon: ShieldAlert },
  { id: 'ttd', label: '18. Digital Signature', icon: FileCheck },
  { id: 'audit', label: '19. Audit Trail Data', icon: History },
  { id: 'integrasi', label: '20. SATUSEHAT & External', icon: Cpu }
];

export default function DummyDataManagementPage() {
  const navigate = useNavigate();
  const { patients, addPatient, deletePatient } = usePatientStore();

  const [staffList, setStaffList] = useState([]);
  const [emrDocuments, setEmrDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('patients');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemJSON, setSelectedItemJSON] = useState(null);
  const [selectedPatientPortfolio, setSelectedPatientPortfolio] = useState(null);
  const [selectedStaffPortfolio, setSelectedStaffPortfolio] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [portfolioActiveCategory, setPortfolioActiveCategory] = useState('1_master_pasien');
  const [staffPortfolioActiveCategory, setStaffPortfolioActiveCategory] = useState('identitas');

  // Preview Category Info Modal State
  const [previewCategoryInfo, setPreviewCategoryInfo] = useState(null);

  // Multi-Select Smart Injector Modal State & Tab Switcher (PATIENTS VS STAFF)
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('patients'); // 'patients' | 'staff'
  const [injectCount, setInjectCount] = useState(10);
  
  const [selectedPatientCategories, setSelectedPatientCategories] = useState(() => PATIENT_MASTER_32_CATEGORIES.map(c => c.id));
  const [selectedStaffCategories, setSelectedStaffCategories] = useState(['staff_doctors', 'staff_nurses', 'staff_pharmacists']);

  // Exhaustive Hospital Professions Taxonomy Multi-Checkbox Selection State
  const [selectedProfessions, setSelectedProfessions] = useState(() => HOSPITAL_PROFESSIONS.map(p => p.id));
  const [professionCategoryFilter, setProfessionCategoryFilter] = useState('ALL');
  const [professionSearchQuery, setProfessionSearchQuery] = useState('');

  const filteredProfessionsTaxonomy = useMemo(() => {
    return HOSPITAL_PROFESSIONS.filter(prof => {
      const matchesCategory = professionCategoryFilter === 'ALL' || prof.categoryId === professionCategoryFilter;
      const q = professionSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        prof.title.toLowerCase().includes(q) || 
        prof.categoryId.toLowerCase().includes(q) ||
        prof.dept.toLowerCase().includes(q) ||
        (prof.degree || '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [professionCategoryFilter, professionSearchQuery]);

  // New Custom Patient Form State
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '', gender: 'Laki-laki', age: 30, nik: '', phone: '081234567890',
    insuranceType: 'BPJS', insuranceNo: '', allergy: '', riskLevel: 'LOW'
  });

  // New Custom Staff Form State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    fullName: '', role: 'DOCTOR_SPECIALIST', departmentName: 'Departemen Pelayanan Medis',
    email: '', phone: '+628123456789', sipNumber: '', strNumber: ''
  });

  const patientList = useMemo(() => patients || [], [patients]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientList;
    const q = searchQuery.toLowerCase().trim();
    return patientList.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      String(p.mrn || '').toLowerCase().includes(q) ||
      String(p.nik || '').includes(q) ||
      (p.insurance?.type || '').toLowerCase().includes(q) ||
      (p.religion || '').toLowerCase().includes(q) ||
      (p.ethnicity || '').toLowerCase().includes(q) ||
      (p.family_pedigree?.mother_maiden_name || '').toLowerCase().includes(q)
    );
  }, [patientList, searchQuery]);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staffList;
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter(s => 
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.nip || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.role || '').toLowerCase().includes(q) ||
      (s.departmentName || '').toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  const handleCopyText = (text, idKey, label) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.warn(err);
    }
    setCopiedId(idKey);
    toast.dismiss('copy-toast');
    toast.success(`${label} (${text}) disalin ke clipboard!`, { id: 'copy-toast', icon: '📋' });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const generatePatientsBatch = (countToGenerate) => {
    let createdCount = 0;
    for (let i = 0; i < countToGenerate; i++) {
      const isMale = Math.random() > 0.5;
      const firstNameList = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
      const firstName = firstNameList[Math.floor(Math.random() * firstNameList.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const title = isMale ? 'Tn.' : 'Ny.';
      const fullName = `${title} ${firstName} ${lastName}`;
      const gender = isMale ? 'Laki-laki' : 'Perempuan';
      const age = Math.floor(Math.random() * 65) + 12;

      const birthPlace = CITIES[Math.floor(Math.random() * CITIES.length)];
      const bloodType = BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)];
      const religion = RELIGIONS[Math.floor(Math.random() * RELIGIONS.length)];
      const maritalStatus = MARITAL_STATUSES[Math.floor(Math.random() * MARITAL_STATUSES.length)];
      const ethnicity = ETHNICITIES[Math.floor(Math.random() * ETHNICITIES.length)];
      const education = EDUCATIONS[Math.floor(Math.random() * EDUCATIONS.length)];
      const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];

      const motherMaidenName = MOTHER_NAMES[Math.floor(Math.random() * MOTHER_NAMES.length)];
      const fatherName = FATHER_NAMES[Math.floor(Math.random() * FATHER_NAMES.length)];
      const emergencyRelation = EMERGENCY_RELATIONS[Math.floor(Math.random() * EMERGENCY_RELATIONS.length)];
      const emergencyContactName = `${isMale ? 'Ny. ' : 'Tn. '}${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
      const emergencyPhone = `0813${Math.floor(10000000 + Math.random() * 90000000)}`;

      const doctorMeta = DOCTORS[i % DOCTORS.length];
      const nurseMeta = NURSES[i % NURSES.length];
      const pharmacistMeta = PHARMACISTS[i % PHARMACISTS.length];

      const randomMRN = String(100000 + patientList.length + i + 1);
      const randomNIK = `327301${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const satusehatId = `ihs-p-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      
      const isBPJS = Math.random() > 0.3;
      const insuranceType = isBPJS ? 'BPJS KESEHATAN (PBI/NON-PBI)' : 'ASURANSI PRUDENTIAL / MANDIRI';
      const insuranceNo = isBPJS ? `000${Math.floor(1000000000 + Math.random() * 9000000000)}` : `PRU-${randomMRN}`;

      const hasAllergy = Math.random() > 0.7;
      const allergyText = hasAllergy ? 'Amoxicillin / Penicillin (Reaksi: Anafilaksis / Urtikaria)' : 'Tidak ada riwayat alergi obat';

      const newPatientObj = {
        id: `gen-patient-${Date.now()}-${i}`,
        mrn: randomMRN,
        satusehat_ihs_no: satusehatId,
        queue_number: `A-${Math.floor(1 + Math.random() * 45)}`,
        nik: randomNIK,
        passport_no: null,
        kitas_kitap_no: null,
        bpjs_no: isBPJS ? insuranceNo : null,
        private_insurance_no: isBPJS ? null : insuranceNo,
        identity_type: 'KTP (Kartu Tanda Penduduk)',
        identity_no: randomNIK,
        identity_verification_status: 'VERIFIED_DUKCAPIL_ONLINE',

        name: fullName,
        full_name: fullName,
        first_name: firstName,
        middle_name: '',
        last_name: lastName,
        nickname: firstName,
        maiden_name: motherMaidenName,
        title_prefix: title,
        title_suffix: '',
        gender: gender,
        gender_identity: gender,
        pronouns: isMale ? 'He/Him' : 'She/Her',
        birth_date: `19${90 - Math.floor(age / 2)}-05-15`,
        birth_place: birthPlace,
        age: age,
        age_details: `${age} Thn 4 Bln 12 Hari`,
        blood_type: bloodType,
        rhesus: 'Positive (+)',
        vital_status: 'ALIVE',
        deceased_date: null,
        cause_of_death: null,

        citizenship: 'WNI (Warga Negara Indonesia)',
        dual_citizenship: false,
        origin_country: 'Indonesia',
        ethnicity: ethnicity,
        tribe: ethnicity,
        race: 'Mongoloid / Austronesia',
        religion: religion,
        primary_language: 'Bahasa Indonesia',
        secondary_language: 'Bahasa Inggris (Pasif)',
        interpreter_needed: false,
        interpreter_name: null,

        marital_status: maritalStatus,
        last_education: education,
        occupation: occupation,
        job_title: 'Staff / Manager',
        company_name: 'PT. Nusantara Medika Indonesia',
        employment_status: 'Karyawan Tetap',
        income_range: 'Rp 7.500.000 - Rp 15.000.000 / Bulan',
        economic_status: 'Menengah (Middle Class)',

        primary_phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        secondary_phone: `0813${Math.floor(10000000 + Math.random() * 90000000)}`,
        home_phone: '(022) 2501234',
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        whatsapp_no: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: `Jl. Merdeka No. ${Math.floor(1 + Math.random() * 150)}, RT 04 / RW 09, ${birthPlace}`,
        city: birthPlace,
        province: 'Jawa Barat',
        emergency_contact_name: emergencyContactName,
        emergency_name: emergencyContactName,
        emergency_contact_relation: emergencyRelation,
        emergency_contact_phone: emergencyPhone,
        emergency_phone: emergencyPhone,
        emergency_contact_email: `emergency.${firstName.toLowerCase()}@gmail.com`,

        ktp_address: {
          full_address: `Jl. Merdeka No. ${Math.floor(1 + Math.random() * 150)}, RT 04 / RW 09`,
          rt: '004', rw: '009', subdistrict: 'Kelurahan Dago', district: 'Kecamatan Coblong',
          city: birthPlace, province: 'Jawa Barat', postal_code: '40135', country: 'Indonesia'
        },

        domicile_address: {
          full_address: `Jl. Merdeka No. ${Math.floor(1 + Math.random() * 150)}, RT 04 / RW 09, ${birthPlace}`,
          rt: '004', rw: '009', subdistrict: 'Kelurahan Dago', district: 'Kecamatan Coblong',
          city: birthPlace, province: 'Jawa Barat', postal_code: '40135', country: 'Indonesia',
          same_as_ktp: true, kemendagri_region_code: '32.73.01.1002',
          coordinates: { lat: -6.8915 + (Math.random() * 0.01), lng: 107.6106 + (Math.random() * 0.01) }
        },

        father_name: fatherName,
        mother_name: motherMaidenName,
        spouse_name: isMale ? `Ny. ${FIRST_NAMES_FEMALE[0]} ${LAST_NAMES[0]}` : `Tn. ${FIRST_NAMES_MALE[0]} ${LAST_NAMES[0]}`,
        guardian_name: emergencyContactName,
        guardian_relation: emergencyRelation,
        guardian_phone: emergencyPhone,

        infant_info: {
          is_infant: false,
          mother_maiden_name: motherMaidenName,
          mother_mrn: `MOM-${randomMRN}`,
          infant_mrn: null,
          birth_delivery_type: 'Spontan / Normal',
          birth_weight_gram: 3200,
          birth_length_cm: 49,
          head_circumference_cm: 34,
          apgar_score: '9/10'
        },

        insurance: {
          type: insuranceType,
          payment_type: isBPJS ? 'BPJS' : 'SWASTA',
          guarantor: isBPJS ? 'BPJS Kesehatan RI' : 'PT. Asuransi Prudential Indonesia',
          insurance_provider: isBPJS ? 'BPJS Kesehatan' : 'Prudential Financial',
          policy_number: insuranceNo,
          member_number: `MEM-${insuranceNo}`,
          care_class: isBPJS ? 'Kelas 1' : 'VIP / Non-BPJS',
          valid_from: '2024-01-01',
          valid_until: '2028-12-31',
          coverage: '100% Full Coverage',
          status_active: true
        },

        bpjs_details: {
          bpjs_no: isBPJS ? insuranceNo : '0001910009871',
          bpjs_class: 'Kelas 1 (PBI / Non-PBI)',
          fktp_name: 'Puskesmas Kecamatan Coblong',
          care_class_rights: 'Hak Kelas 1',
          membership_status: 'AKTIF (Iuran Terbayar)',
          sep_no: `SEP-3273R001-${Math.floor(100000 + Math.random() * 900000)}`,
          referral_no: `FASKES1-REF-${Math.floor(100000 + Math.random() * 900000)}`
        },

        work_info: {
          occupation: occupation,
          company_name: 'PT. Nusantara Medika Indonesia',
          company_address: 'Jl. Asia Afrika No. 100, Bandung',
          office_phone: '(022) 4209988',
          job_title: 'Senior Specialist / Staff',
          employment_status: 'Karyawan Tetap'
        },

        basic_clinical: {
          allergies: hasAllergy ? 'Amoxicillin / Penicillin (Reaksi: Anafilaksis/Urtikaria)' : 'Tidak ada riwayat alergi obat',
          disability_status: 'Tidak Ada (Mandiri)',
          pregnancy_status: isMale ? 'N/A (Laki-laki)' : 'Tidak Hamil',
          gestational_age_weeks: 0,
          breastfeeding_status: 'TIDAK',
          smoking_status: 'Bukan Perokok (Non-Smoker)',
          alcohol_status: 'Tidak Mengonsumsi Alkohol',
          drug_use_status: 'Bebas Narkoba (Negative)',
          organ_donor_status: 'Tidak Terdaftar Donor',
          advance_directive: 'Full Resuscitation (Semua Tindakan Medikasi)'
        },

        special_risks: {
          fall_risk: Math.random() > 0.8 ? 'MEDIUM (Morse Scale: 45)' : 'LOW (Morse Scale: 15)',
          violence_risk: 'LOW (Pasien Kooperatif)',
          suicide_risk: 'LOW (Skrining Depresi Normal)',
          isolation_required: false,
          infection_status: 'CLEAN (Tanpa Infeksi Nosokomial)',
          mrsa_status: 'NEGATIVE',
          covid_status: 'NEGATIVE',
          tuberculosis_status: 'NEGATIVE',
          hiv_status: 'NON-REACTIVE (Sesuai Regulasi Permenkes)'
        },

        // EXPLICIT TRACEABLE MEDICAL STAFF DATA ATTACHED TO PATIENT
        admin_info: {
          registration_date: new Date().toISOString().substring(0, 10),
          registration_time: '08:30:00 WIB',
          source_unit: 'Poliklinik Spesialis Rawat Jalan',
          destination_unit: 'Poli Penyakit Dalam',
          dpjp_doctor: doctorMeta.name,
          dpjp_doctor_nip: doctorMeta.nip,
          dpjp_doctor_str: doctorMeta.str,
          dpjp_doctor_sip: doctorMeta.sip,
          attending_nurse: nurseMeta.name,
          attending_nurse_nip: nurseMeta.nip,
          dispensing_pharmacist: pharmacistMeta.name,
          dispensing_pharmacist_sipa: pharmacistMeta.sipa,
          case_manager: nurseMeta.name,
          patient_status: 'ACTIVE_IN_TREATMENT',
          patient_type: 'PASIEN_RAWAT_JALAN'
        },

        patient_preferences: {
          communication_language: 'Bahasa Indonesia',
          preferred_channel: 'WhatsApp & Email',
          email_reminder: true,
          sms_reminder: true,
          whatsapp_reminder: true,
          promo_consent: true,
          research_consent: true,
          data_sharing_consent: true
        },

        biometrics: {
          patient_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          fingerprint_enrolled: true,
          face_recognition_id: `FACE-REC-${randomMRN}`,
          iris_scan_id: `IRIS-${randomMRN}`,
          digital_signature_hash: `JCI-SIG-PATIENT-${randomMRN}`
        },

        digital_info: {
          patient_qr_code: `QR-HIS-${randomMRN}`,
          rfid_tag: `RFID-${randomMRN}`,
          barcode_wristband: `BAR-WRIST-${randomMRN}`,
          patient_portal_id: `PORTAL-${randomMRN}`,
          portal_username: `${firstName.toLowerCase()}${randomMRN}`,
          last_login_portal: new Date().toISOString()
        },

        satusehat_info: {
          ihs_number: satusehatId,
          fhir_patient_id: `fhir-patient-${randomMRN}`,
          fhir_identifier: `http://sys-ids.kemkes.go.id/nik/${randomNIK}`,
          fhir_resource_version: 'v4.0.1 (FHIR R4)',
          last_synchronization: new Date().toISOString(),
          sync_status: 'SYNCED_SATUSEHAT_SUCCESS',
          verification_status: 'VERIFIED_BY_KEMENKES_RI'
        },

        audit_trail: {
          created_by: 'ADMIN_REGISTRATION_OFFICER',
          created_date: new Date().toISOString(),
          updated_by: doctorMeta.name,
          updated_date: new Date().toISOString(),
          last_visit: new Date().toISOString().substring(0, 10),
          total_visits: Math.floor(1 + Math.random() * 12),
          last_admission: '2026-02-01',
          last_discharge: '2026-02-03',
          record_status: 'ACTIVE_IMMUTABLE'
        },

        status: 'ACTIVE',
        registered_at: new Date().toISOString(),
        safety_flags: {
          wristband_colors: hasAllergy ? ['RED (Alergi)', 'YELLOW (Risiko Jatuh)'] : ['GREEN (Standard)'],
          allergy_risk: hasAllergy,
          allergy_details: allergyText,
          allergy_severity: hasAllergy ? 'HIGH (Anafilaksis)' : 'NONE',
          fall_risk: Math.random() > 0.8 ? 'MEDIUM (Morse Scale: 45)' : 'LOW (Morse Scale: 15)',
          debit_risk: 'LOW'
        }
      };

      const currentList = usePatientStore.getState().patients || [];
      const updatedList = [newPatientObj, ...currentList];
      usePatientStore.setState({ patients: updatedList });
      try {
        localStorage.setItem('nurseflow_patients_master', JSON.stringify(updatedList));
        
        // Sync active encounters for all HIS modules
        const existingEncountersRaw = localStorage.getItem('nurseflow_encounters_master');
        const existingEncounters = existingEncountersRaw ? JSON.parse(existingEncountersRaw) : [];
        const newEnc = {
          id: `enc-${newPatientObj.id}`,
          encounter_id: `ENC-2026-${newPatientObj.mrn}`,
          patient_id: newPatientObj.id,
          patient_name: newPatientObj.name || newPatientObj.full_name,
          mrn: newPatientObj.mrn,
          nik: newPatientObj.nik,
          encounter_type: i % 3 === 0 ? 'RAWAT_INAP' : i % 3 === 1 ? 'RAWAT_JALAN' : 'IGD',
          chief_complaint: `Pasien ${newPatientObj.name} mengeluh fatique dan demam observasi. Perlu monitoring vital sign.`,
          admitting_doctor: newPatientObj.admin_info?.dpjp_doctor || 'dr. Ahmad Hidayat, Sp.PD',
          nurse_in_charge: newPatientObj.admin_info?.attending_nurse || 'Ns. Ratna Mulyani, S.Kep',
          ward: i % 3 === 0 ? 'Bangsal Melati' : i % 3 === 1 ? 'Poli Penyakit Dalam' : 'IGD Red Zone',
          status: 'IN_TREATMENT',
          escalation_level: 'NONE',
          admitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('nurseflow_encounters_master', JSON.stringify([newEnc, ...existingEncounters]));
      } catch (e) {}

      try { addPatient(newPatientObj); } catch (e) {}
      createdCount++;
    }
    return createdCount;
  };

  const generateStaffBatchFromTaxonomy = (countToGenerate) => {
    let createdCount = 0;
    const newStaffList = [...staffList];

    // Filter taxonomy by selectedProfessions user checkboxes
    let targetProfessions = HOSPITAL_PROFESSIONS.filter(p => selectedProfessions.includes(p.id));
    if (targetProfessions.length === 0) {
      targetProfessions = HOSPITAL_PROFESSIONS;
    }

    const itemsPerProf = targetProfessions.length > 5 ? 1 : countToGenerate;
    targetProfessions.forEach((profObj, pIdx) => {
      for (let i = 0; i < itemsPerProf; i++) {
        const itemIdx = createdCount;
        const isMale = Math.random() > 0.5;
        const firstNameList = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
        const firstName = firstNameList[Math.floor(Math.random() * firstNameList.length)];
        const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        const fullStaffName = `${profObj.prefix}${firstName} ${lastName}${profObj.degree}`;
        const randomNIP = `NIP-19${Math.floor(80 + Math.random() * 18)}0512-2026-${String(staffList.length + itemIdx + 1).padStart(4, '0')}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${itemIdx + 1}@nurseflow.id`;
        const isNonMedical = !profObj.isMedical;

        const strNo = isNonMedical ? null : `STR-199${Math.floor(0 + Math.random() * 9)}0512-2026-${String(staffList.length + itemIdx + 1).padStart(4, '0')}`;
        const sipNo = isNonMedical ? null : `SIP-440/${Math.floor(1000 + Math.random() * 9000)}/DISKES`;

      const newStaffObj = {
        id: `STF-GEN-${Date.now()}-${i}`,
        nip: randomNIP,
        nik: `327301${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        fullName: fullStaffName,
        degree: profObj.degree,
        email: email,
        phone: `+62812${Math.floor(10000000 + Math.random() * 90000000)}`,
        gender: isMale ? 'Laki-laki' : 'Perempuan',
        birthPlace: CITIES[Math.floor(Math.random() * CITIES.length)],
        birthDate: `19${Math.floor(80 + Math.random() * 15)}-05-15`,
        age: 30 + (i % 20),
        bloodType: BLOOD_TYPES[Math.floor(Math.random() * BLOOD_TYPES.length)],
        religion: RELIGIONS[Math.floor(Math.random() * RELIGIONS.length)],
        maritalStatus: 'Menikah',
        citizenship: 'WNI',
        role: profObj.roleKey,
        professionTitle: profObj.title,
        professionCategory: profObj.categoryId,
        departmentName: profObj.dept,
        strNumber: strNo,
        strExpiry: isNonMedical ? null : '2029-12-31',
        sipNumber: sipNo,
        sipExpiry: isNonMedical ? null : '2028-06-30',

        // 16 SUB-CATEGORIES OF IDENTITAS & DEMOGRAFI KARYAWAN (JCI & HRMS 2026 ENTERPRISE)
        identitasAndDemografi: {
          identitasUtama: {
            employeeId: `EMP-2026-${String(staffList.length + i + 1).padStart(4, '0')}`,
            employeeNumber: `PEG-${Math.floor(100000 + Math.random() * 900000)}`,
            barcodePegawai: `BAR-STF-${String(staffList.length + i + 1).padStart(4, '0')}`,
            qrCodePegawai: `QR-STF-${randomNIP}`,
            rfidCardNumber: `RFID-STF-${String(staffList.length + i + 1).padStart(4, '0')}`,
            uuid: `uuid-stf-${Date.now()}-${i}`,
            statusPegawai: 'Aktif (On-Duty)',
            tanggalBergabung: '2019-03-01',
            tanggalBerhenti: null,
            alasanBerhenti: null,
            statusVerifikasiData: 'VERIFIED_HRD_SYSTEM'
          },
          identitasPribadi: {
            namaLengkap: fullStaffName,
            namaDepan: firstName,
            namaTengah: '',
            namaBelakang: lastName,
            namaPanggilan: firstName,
            namaSebelumMenikah: lastName,
            gelarDepan: profObj.prefix.trim(),
            gelarBelakang: profObj.degree.replace(/^, /, '').trim(),
            jenisKelamin: isMale ? 'Laki-laki' : 'Perempuan',
            genderIdentity: isMale ? 'Man' : 'Woman',
            preferredPronoun: isMale ? 'He/Him' : 'She/Her',
            tempatLahir: CITIES[i % CITIES.length],
            tanggalLahir: `19${Math.floor(80 + Math.random() * 15)}-05-15`,
            usia: `${30 + (i % 20)} Tahun`,
            golonganDarah: BLOOD_TYPES[i % BLOOD_TYPES.length],
            rhesus: 'Positive (+)',
            tinggiBadan: `${isMale ? 172 + (i % 10) : 160 + (i % 8)} cm`,
            beratBadan: `${isMale ? 68 + (i % 15) : 54 + (i % 12)} kg`,
            bmi: '22.4 (Ideal)',
            warnaMata: 'Cokelat Tua',
            warnaRambut: 'Hitam',
            ciriKhusus: 'Tahi lalat pipi kanan',
            disabilitas: 'Tidak Ada',
            statusHidup: 'ALIVE'
          },
          kewarganegaraan: {
            kewarganegaraan: 'WNI (Warga Negara Indonesia)',
            kewarganegaraanGanda: false,
            negaraAsal: 'Indonesia',
            nomorPaspor: `A-${Math.floor(1000000 + Math.random() * 9000000)}`,
            tanggalTerbitPaspor: '2023-01-15',
            tanggalExpiredPaspor: '2033-01-15',
            kitas: null,
            kitap: null,
            visa: null,
            nomorVisa: null,
            statusImigrasi: 'WNI_PERMANENT_RESIDENT'
          },
          identitasResmi: {
            nik: `327301${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            npwp: '72.901.882.1-423.000',
            nomorKk: `327301${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            nomorBpjsKesehatan: `000191${Math.floor(1000000 + Math.random() * 9000000)}`,
            nomorBpjsKetenagakerjaan: `190${Math.floor(100000000 + Math.random() * 90000000)}`,
            nomorSim: `3273${Math.floor(10000000 + Math.random() * 90000000)}`,
            jenisSim: 'SIM A & SIM C',
            tanggalExpiredSim: '2029-05-15'
          },
          demografi: {
            agama: RELIGIONS[i % RELIGIONS.length],
            suku: ETHNICITIES[i % ETHNICITIES.length],
            etnis: ETHNICITIES[i % ETHNICITIES.length],
            ras: 'Mongoloid / Austronesia',
            bahasaUtama: 'Bahasa Indonesia',
            bahasaKedua: 'Bahasa Sunda / Jawa',
            bahasaKetiga: 'Bahasa Inggris',
            kemampuanBahasaInggris: 'Fluent (TOEFL 580)',
            kemampuanBahasaLain: 'Bahasa Arab (Dasar)',
            butuhInterpreter: false
          },
          statusSosial: {
            statusPernikahan: MARITAL_STATUSES[i % MARITAL_STATUSES.length],
            tanggalMenikah: '2020-08-17',
            jumlahAnak: i % 3,
            pendidikanTerakhir: EDUCATIONS[i % EDUCATIONS.length],
            jurusan: profObj.degree.includes('Sp.') ? 'Kedokteran Spesialis' : profObj.degree.includes('S.Kep') ? 'Keperawatan' : profObj.degree.includes('S.Farm') ? 'Farmasi' : 'Teknologi Informasi / Manajemen',
            profesi: profObj.title,
            pekerjaanSebelumBergabung: 'RSUP Dr. Hasan Sadikin Bandung',
            statusEkonomi: 'Menengah Ke Atas'
          },
          alamatKtp: {
            alamat: 'Jl. Sukajadi No. 128, RT 03 / RW 07',
            rt: '003',
            rw: '007',
            kelurahan: 'Pasteur',
            kecamatan: 'Sukajadi',
            kabupatenKota: 'Kota Bandung',
            provinsi: 'Jawa Barat',
            kodePos: '40161',
            negara: 'Indonesia',
            latitude: '-6.892451',
            longitude: '107.597652'
          },
          alamatDomisili: {
            alamat: 'Jl. Dago Asri No. 45, Komplek Dago Asri',
            rt: '002',
            rw: '005',
            kelurahan: 'Dago',
            kecamatan: 'Coblong',
            kabupatenKota: 'Kota Bandung',
            provinsi: 'Jawa Barat',
            kodePos: '40135',
            negara: 'Indonesia',
            latitude: '-6.883120',
            longitude: '107.614300',
            statusTempatTinggal: 'Milik Sendiri'
          },
          kontak: {
            nomorHpUtama: `+62812${Math.floor(10000000 + Math.random() * 90000000)}`,
            nomorHpKedua: `+62857${Math.floor(10000000 + Math.random() * 90000000)}`,
            whatsApp: `+62812${Math.floor(10000000 + Math.random() * 90000000)}`,
            emailPribadi: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
            emailKantor: email,
            teleponRumah: '(022) 2038841',
            linkedIn: `linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
            website: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.id`,
            mediaSosial: `@${firstName.toLowerCase()}_${lastName.toLowerCase()}`
          },
          kontakDarurat: {
            namaKontakDarurat: `Ny. ${LAST_NAMES[(i + 1) % LAST_NAMES.length]} ${LAST_NAMES[(i + 2) % LAST_NAMES.length]}`,
            hubungan: isMale ? 'Istri' : 'Suami',
            nomorHp: `+62813${Math.floor(10000000 + Math.random() * 90000000)}`,
            nomorTelepon: '(022) 2038842',
            email: `darurat.${firstName.toLowerCase()}@gmail.com`,
            alamat: 'Jl. Dago Asri No. 45, Coblong, Kota Bandung',
            prioritasKontak: 'PRIORITAS_1_UTAMA'
          },
          dataKeluarga: {
            namaAyah: FATHER_NAMES[i % FATHER_NAMES.length],
            namaIbu: MOTHER_NAMES[i % MOTHER_NAMES.length],
            namaPasangan: isMale ? `Ny. Ratna Mulyani` : `Tn. Bambang Wijaya`,
            namaAnak: '1. Anisa Putri (8 Thn), 2. Rizky Pratama (5 Thn)',
            jumlahAnak: 2,
            namaWali: FATHER_NAMES[i % FATHER_NAMES.length],
            hubunganWali: 'Ayah Kandung'
          },
          informasiKesehatanDasar: {
            golonganDarah: BLOOD_TYPES[i % BLOOD_TYPES.length],
            rhesus: 'Positive (+)',
            alergiObat: 'Tidak Ada Riwayat Alergi Obat',
            alergiMakanan: 'Tidak Ada Alergi Makanan',
            penyakitKronis: 'Tidak Ada (Nir-Komorbid)',
            riwayatOperasi: 'Operasi Apendektomi (2018)',
            statusKehamilan: isMale ? 'N/A' : 'Tidak Hamil',
            statusMenyusui: isMale ? 'N/A' : 'Tidak Menyusui',
            statusMerokok: 'Tidak Merokok (Bukan Perokok)',
            statusAlkohol: 'Bebas Alkohol (Non-Drinker)',
            statusNarkoba: 'Bebas Narkoba (Screening Negatif)',
            disabilitas: 'Tidak Ada',
            kontakDokterPribadi: 'dr. Hendra Wijaya, Sp.PD (081234567890)'
          },
          fotoDanBiometri: {
            fotoPegawai: 'avatar_employee_hd.jpg',
            fotoKtp: 'scan_ktp_verified.pdf',
            fotoKk: 'scan_kk_verified.pdf',
            fotoPaspor: 'scan_paspor_verified.pdf',
            sidikJari: 'ENROLLED_FINGERPRINT_10_FINGERS',
            faceRecognition: 'ENROLLED_FACE_3D_VECTOR',
            irisScan: 'ENROLLED_IRIS_SCAN',
            tandaTanganDigital: `BSRE-HASH-${randomNIP}`
          },
          preferensi: {
            bahasaKomunikasi: 'Bahasa Indonesia',
            metodeKomunikasiFavorit: 'WhatsApp & Email Resmi',
            emailNotification: true,
            smsNotification: true,
            whatsAppNotification: true
          },
          informasiDigital: {
            username: email,
            employeePortalId: `PORTAL-EMP-${String(staffList.length + i + 1).padStart(4, '0')}`,
            microsoftAccount: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nurseflow.onmicrosoft.com`,
            googleWorkspaceAccount: email,
            activeDirectoryAccount: `AD-STF-${String(i + 1).padStart(3, '0')}`,
            ssoId: `SSO-UID-${randomNIP}`,
            mfaEnabled: true
          },
          audit: {
            createdBy: 'SUPER_ADMIN_SYSTEM',
            createdDate: new Date().toISOString(),
            updatedBy: 'SYSTEM_AUTOMATION_HUB',
            updatedDate: new Date().toISOString(),
            verifiedBy: 'MANAJER_SDM_HOSPITAL',
            verifiedDate: new Date().toISOString().substring(0, 10),
            approvalStatus: 'APPROVED_IMMUTABLE',
            lastLogin: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            recordStatus: 'ACTIVE_RECORD'
          }
        },

        employment: {
          employmentStatus: isNonMedical ? 'Tetap (Karyawan RS)' : 'Tetap (PNS / Perumda Medis)',
          joinDate: '2018-03-01',
          yearsOfService: '8 Tahun',
          fingerprintId: `FP-${Math.floor(1000 + Math.random() * 9000)}`,
          rfidTag: `RFID-STF-${String(staffList.length + i + 1).padStart(3, '0')}`,
          isActive: true
        },

        organization: {
          departmentId: `DEPT-${profObj.categoryId}`,
          departmentName: profObj.dept,
          unitName: profObj.dept,
          structuralPosition: profObj.title,
          functionalPosition: profObj.title,
          supervisorName: 'Dr. Hendra Wijaya, Sp.An (Direktur Pelayanan Medis)',
          eschelonLevel: 'Grade 10 (Officer / Professional)'
        },

        licensing: {
          skNumber: isNonMedical ? `SK-RS/2024/${profObj.id}` : null,
          nonMedicalCert: isNonMedical ? `Sertifikasi Profesi (${profObj.title})` : null,
          strNumber: strNo,
          strExpiry: isNonMedical ? null : '2029-12-31',
          sipNumber: sipNo,
          sipExpiry: isNonMedical ? null : '2028-06-30',
          sipType: isNonMedical ? null : 'SIP 1 (Praktik Utama RS)',
          issuer: isNonMedical ? 'Badan Kepegawaian RS' : 'Dinas Kesehatan Kota Bandung',
          status: 'ACTIVE_VERIFIED'
        },

        education: {
          lastEducation: profObj.degree.includes('Sp.') ? 'Spesialis Medis' : profObj.degree.includes('S.') ? 'Sarjana (S1)' : 'Diploma (D3)',
          institution: 'Universitas Indonesia (UI) / UNPAD',
          graduationYear: 2016,
          diplomaNumber: `IJZ-UI-2016-${Math.floor(1000 + Math.random() * 9000)}`,
          certifications: isNonMedical ? ['Sertifikasi SIMRS & EHIS', 'Pelatihan CS Rumah Sakit', 'Ahli K3 RS'] : ['BTCLS Certified', 'ACLS Certified', 'GCP International']
        },

        experience: {
          previousExperience: 'RSUP Dr. Hasan Sadikin (2016 - 2020)',
          lastPosition: profObj.title,
          achievements: 'Staf Teladan RS 2025'
        },

        credentialing: {
          committee: isNonMedical ? 'Komite SDM & Etik RS' : 'Komite Medis & Keperawatan RS',
          clinicalPrivilege: isNonMedical ? 'Evaluasi Standar Operasional Prosedur (SOP RS)' : 'Rincian Kewenangan Klinis (RKK) Level 4 Full Privilege',
          whitePaperLevel: isNonMedical ? 'Standar Manajerial RS' : 'Level 4 (Prosedur Kompleks)',
          reCredentialDate: '2025-11-10',
          status: 'APPROVED_IMMUTABLE'
        },

        schedule: {
          defaultShift: 'Pagi (07:30 - 15:30 WIB)',
          onCallStatus: isNonMedical ? 'Non-OnCall' : 'On-Call Emergency IGD',
          dutyRosterQuota: '160 Jam / Bulan'
        },

        attendance: {
          fingerprintEnrolled: true,
          annualLeaveQuota: '12 Hari / Tahun',
          remainingLeave: 8,
          latenessPercentage: '0.2%'
        },

        payroll: {
          bankName: 'Bank Mandiri',
          bankAccountNumber: `13000${Math.floor(10000000 + Math.random() * 90000000)}`,
          taxIdNpwp: '72.901.882.1-423.000',
          incentiveTier: 'Tier 1'
        },

        performance: {
          kpiScore: '95.5 / 100',
          patientSatisfactionRating: '4.9 / 5.0',
          annualRating: 'A (Exceeds Expectations)'
        },

        cmeTraining: {
          skpPointsKemenkes: isNonMedical ? 0 : 50,
          jciSafetyHours: '24 Jam / Tahun',
          lastSeminarDate: '2026-01-15'
        },

        healthStatus: {
          mcuDate: '2025-12-01',
          mcuResult: 'FIT_FOR_DUTY',
          hepatitisBVaccine: 'VACCINATED_BOOSTER',
          covidBoosterVaccine: 'BOOSTER_2_COMPLETED',
          tbScreening: 'NEGATIVE'
        },

        documents: {
          ktpScan: 'VERIFIED',
          strScan: isNonMedical ? 'N/A' : 'VERIFIED',
          sipScan: isNonMedical ? 'N/A' : 'VERIFIED',
          diplomaScan: 'VERIFIED'
        },

        systemAccess: {
          username: email,
          role: profObj.roleKey,
          mfaEnabled: true,
          lastLogin: new Date().toISOString()
        },

        assets: [
          { name: 'ID Badge RFID RS', code: `BADGE-${randomNIP}` },
          { name: 'Tablet Medis / Perangkat SIMRS', code: `AST-DEV-${i + 1}` }
        ],

        discipline: {
          warningLetterStatus: 'BEBAS_SP',
          awards: ['Employee of the Month 2025']
        },

        digitalSignature: {
          bsreHash: `BSRE-HASH-${randomNIP}`,
          approvalLimit: 'Rp 50.000.000'
        },

        auditTrail: {
          createdBy: 'SUPER_ADMIN_SYSTEM',
          createdDate: new Date().toISOString(),
          recordStatus: 'ACTIVE_IMMUTABLE'
        },

        externalIntegrations: {
          satusehatPractitionerId: isNonMedical ? `User/U-ADM-${String(i+1).padStart(3, '0')}` : `Practitioner/P-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          bpjsKesehatanNo: `000191${Math.floor(1000000 + Math.random() * 9000000)}`,
          activeDirectoryId: `AD-STF-${String(i+1).padStart(3, '0')}`
        }
      };

      newStaffList.unshift(newStaffObj);
      saveStaffMember(newStaffObj);
      createdCount++;
    }
  });

  setStaffList(newStaffList);
  saveStaffList(newStaffList);
  return createdCount;
};

  const generateEMRBatch = (chapterType = 'COP', count = 5) => {
    let created = 0;
    const chaptersMeta = {
      AOP: { module: 'PENGKAJIAN AWAL (AOP)', title: 'Pengkajian Awal Medis & Keperawatan JCI' },
      COP: { module: 'SOAP NOTES (CPPT)', title: 'Catatan CPPT & SOAP Perkembangan Pasien' },
      ASC: { module: 'KAMAR BEDAH & ANESTESI (ASC)', title: 'WHO Safe Surgery Checklist & Laporan Anestesi' },
      MMU: { module: 'PENGELOLAAN OBAT (MMU)', title: 'Rekonsiliasi & Resep Obat Elektronik' },
      PFR: { module: 'HAK PASIEN & EDUKASI (PFR)', title: 'Formulir Informed Consent & Hak Pasien' },
      ACC: { module: 'TRANSFER & PULANG (ACC)', title: 'Handover SBAR & Resume Medis Pulang' }
    };

    const targetMeta = chaptersMeta[chapterType] || chaptersMeta.COP;
    const newDocsList = [];

    for (let i = 0; i < count; i++) {
      const pName = patientList.length > 0 ? patientList[i % patientList.length].name : 'NY. SITI NURHALIZA';
      const pMRN = patientList.length > 0 ? patientList[i % patientList.length].mrn : '100001';
      const doctorMeta = DOCTORS[i % DOCTORS.length];
      const nurseMeta = NURSES[i % NURSES.length];
      const pharmacistMeta = PHARMACISTS[i % PHARMACISTS.length];
      const diag = CLINICAL_DIAGNOSES[i % CLINICAL_DIAGNOSES.length];

      const newDoc = {
        id: `emr-doc-gen-${Date.now()}-${i}`,
        chapter: chapterType,
        moduleName: targetMeta.module,
        title: targetMeta.title,
        patientName: pName,
        mrn: pMRN,
        
        // TRACEABLE MEDICAL STAFF CREDENTIALS
        doctor: doctorMeta.name,
        doctorNip: doctorMeta.nip,
        doctorSip: doctorMeta.sip,
        attendingNurse: nurseMeta.name,
        attendingNurseNip: nurseMeta.nip,
        pharmacist: pharmacistMeta.name,
        pharmacistSipa: pharmacistMeta.sipa,

        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'SIGNED_VERIFIED',
        subjective: `Pasien ${pName} ditangani oleh DPJP ${doctorMeta.name} (${doctorMeta.nip}) bersama ${nurseMeta.name}. Keluhan ringan terkontrol.`,
        objective: `TD: ${110 + (i * 3)}/${70 + i} mmHg, HR: ${75 + i} bpm, Temp: 36.5°C, SpO2: 99%`,
        assessment: `${diag.name} (ICD-10: ${diag.code})`,
        plan: `Instruksi DPJP ${doctorMeta.name}: Berikan terapi standar. Disiapkan oleh ${pharmacistMeta.name} (${pharmacistMeta.sipa}).`,
        digitalSignature: `JCI-VERIFIED-HASH-${doctorMeta.nip}-${chapterType}`
      };

      newDocsList.push(newDoc);
      created++;
    }

    setEmrDocuments(prev => [...newDocsList, ...prev]);
    return created;
  };

  const handleExecuteMultiInjection = () => {
    setIsGenerating(true);
    let totalGeneratedRecords = 0;

    if (modalTab === 'patients') {
      if (selectedPatientCategories.length === 0) {
        toast.error('Pilih setidaknya 1 kategori data pasien untuk di-inject!');
        setIsGenerating(false);
        return;
      }

      // Execute patient master injection for selected 32 categories
      totalGeneratedRecords = generatePatientsBatch(injectCount);
      
      // Also generate associated EMR documents
      generateEMRBatch('COP', injectCount);
    } else {
      if (selectedProfessions.length === 0) {
        toast.error('Pilih setidaknya 1 profesi rumah sakit untuk di-inject!');
        setIsGenerating(false);
        return;
      }

      totalGeneratedRecords = generateStaffBatchFromTaxonomy(injectCount);
    }

    setIsGenerating(false);
    setIsInjectModalOpen(false);

    toast.dismiss('copy-toast');
    toast.success(
      modalTab === 'patients'
        ? `⚡ Berhasil meng-inject ${totalGeneratedRecords} data dummy Pasien (${selectedPatientCategories.length} kategori Master Pasien terpilih)!`
        : `⚡ Berhasil meng-inject ${totalGeneratedRecords} data dummy Karyawan (${selectedProfessions.length} profesi terpilih)!`,
      { id: 'copy-toast', icon: '✨', duration: 4000 }
    );
  };

  const toggleCategorySelection = (catId) => {
    if (modalTab === 'patients') {
      setSelectedPatientCategories(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
      );
    } else {
      setSelectedStaffCategories(prev => 
        prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
      );
    }
  };

  const handleCreateCustomPatient = (e) => {
    e.preventDefault();
    if (!newPatientData.name.trim()) {
      toast.error('Nama pasien wajib diisi!');
      return;
    }

    const randomMRN = String(100000 + patientList.length + 1);
    const customPatient = {
      id: `custom-patient-${Date.now()}`,
      mrn: randomMRN,
      satusehat_ihs_no: `ihs-p-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      nik_verification_status: 'VERIFIED_DUKCAPIL_ONLINE',
      citizenship: 'WNI',
      name: newPatientData.name.toUpperCase(),
      full_name: newPatientData.name.toUpperCase(),
      gender: newPatientData.gender,
      age: parseInt(newPatientData.age) || 25,
      birth_place: 'Bandung',
      birth_date: '1995-01-01',
      blood_type: 'O+',
      religion: 'Islam',
      marital_status: 'Menikah',
      ethnicity: 'Sunda',
      education: 'Sarjana (S1)',
      occupation: 'Karyawan Swasta',
      family_pedigree: { mother_maiden_name: 'Siti Aminah', father_name: 'Joko Santoso', birth_order: '1 dari 3 Bersaudara' },
      nik: newPatientData.nik || `327301${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      phone: newPatientData.phone,
      primary_phone: newPatientData.phone,
      status: 'ACTIVE',
      registered_at: new Date().toISOString(),
      address: { street: 'Jl. Merdeka No. 45, RT 02 / RW 05', subdistrict: 'Dago', district: 'Coblong', city: 'Bandung', province: 'Jawa Barat', postal_code: '40135', country: 'Indonesia' },
      emergency_contact: { name: 'Ny. Ratna Mulyani', relation: 'Istri', phone: '081399887766' },
      insurance: { type: newPatientData.insuranceType, no: newPatientData.insuranceNo || `000${Math.floor(1000000000 + Math.random() * 9000000000)}`, class: 'Kelas 1' },
      safety_flags: { allergy_risk: Boolean(newPatientData.allergy), allergy_details: newPatientData.allergy || 'Tidak ada riwayat alergi', fall_risk: newPatientData.riskLevel, debit_risk: 'LOW' }
    };

    addPatient(customPatient);
    setIsAddPatientModalOpen(false);
    setNewPatientData({ name: '', gender: 'Laki-laki', age: 30, nik: '', phone: '081234567890', insuranceType: 'BPJS', insuranceNo: '', allergy: '', riskLevel: 'LOW' });
    toast.success(`Pasien baru (${customPatient.name} - MRN: ${customPatient.mrn}) berhasil ditambahkan!`, { icon: '🧑‍⚕️' });
  };

  const handleCreateCustomStaff = (e) => {
    e.preventDefault();
    if (!newStaffData.fullName.trim()) {
      toast.error('Nama karyawan wajib diisi!');
      return;
    }

    const randomNIP = `NIP-199${Math.floor(10 + Math.random() * 80)}-2026-${String(staffList.length + 1).padStart(3, '0')}`;
    const customStaff = {
      id: `STF-CUSTOM-${Date.now()}`,
      nip: randomNIP, fullName: newStaffData.fullName, degree: '',
      email: newStaffData.email || `${newStaffData.fullName.toLowerCase().replace(/\s+/g, '.')}@nurseflow.id`,
      phone: newStaffData.phone, departmentId: 'DEPT-GEN-01', departmentName: newStaffData.departmentName,
      role: newStaffData.role, pin: '123456', strNumber: newStaffData.strNumber || `STR-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      strExpiry: '2029-12-31', sipNumber: newStaffData.sipNumber || `SIP-440/${Math.floor(1000 + Math.random() * 9000)}/DISKES`,
      sipExpiry: '2028-06-30', status: 'ACTIVE', avatar: null
    };

    const updated = [customStaff, ...staffList];
    setStaffList(updated);
    saveStaffMember(customStaff);
    setIsAddStaffModalOpen(false);
    setNewStaffData({ fullName: '', role: 'DOCTOR_SPECIALIST', departmentName: 'Departemen Pelayanan Medis', email: '', phone: '+628123456789', sipNumber: '', strNumber: '' });
    toast.success(`Karyawan baru (${customStaff.fullName} - ${customStaff.nip}) berhasil ditambahkan!`, { icon: '🧑‍⚕️' });
  };

  const handleExportJSON = () => {
    const dataExport = {
      exportDate: new Date().toISOString(),
      systemVersion: 'Enterprise HIS 2026 Master Data Hub',
      totalMasterPatients: patientList.length,
      totalMasterStaff: staffList.length,
      totalEMRDocs: emrDocuments.length,
      masterPatients: patientList,
      masterStaff: staffList,
      emrDocuments: emrDocuments
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nurseflow_his_master_datasets_${new Date().toISOString().substring(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success('File JSON Master Pasien & Master Karyawan berhasil diunduh!', { icon: '💾' });
  };

  const handleHardResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh data dummy menjadi 0 (Kosong)?')) {
      usePatientStore.setState({ patients: [] });
      setStaffList([]);
      setEmrDocuments([]);
      localStorage.setItem('nurseflow_staff_master_list', '[]');
      toast.dismiss('copy-toast');
      toast.success('Seluruh data dummy berhasil di-reset menjadi 0 (Kosong)!', { id: 'copy-toast', icon: '🧹' });
    }
  };

  const PORTFOLIO_NAV_ITEMS = [
    { id: '1_master_pasien', label: '1. Master Pasien', icon: Fingerprint },
    { id: '2_master_kunjungan', label: '2. Master Kunjungan', icon: Calendar },
    { id: '3_master_rawat_jalan', label: '3. Master Rawat Jalan', icon: UserCheck },
    { id: '4_master_igd', label: '4. Master IGD', icon: AlertTriangle },
    { id: '5_master_rawat_inap', label: '5. Master Rawat Inap', icon: HomeIcon },
    { id: '6_master_dokumen_medis', label: '6. Master Dokumen Medis', icon: FileText },
    { id: '7_master_keperawatan', label: '7. Master Keperawatan', icon: HeartPulse },
    { id: '8_master_dokumen_penunjang', label: '8. Master Penunjang', icon: Activity },
    { id: '9_master_gambar', label: '9. Master Gambar', icon: Eye },
    { id: '10_master_resep', label: '10. Master Resep', icon: Pill },
    { id: '11_master_tindakan', label: '11. Master Tindakan', icon: Stethoscope },
    { id: '12_master_diagnosis', label: '12. Master Diagnosis', icon: ShieldAlert },
    { id: '13_master_vital_sign', label: '13. Master Vital Sign', icon: Heart },
    { id: '14_master_asuransi', label: '14. Master Asuransi', icon: ShieldCheck },
    { id: '15_master_billing', label: '15. Master Billing', icon: Receipt },
    { id: '16_master_appointment', label: '16. Master Appointment', icon: Clock },
    { id: '17_master_telemedicine', label: '17. Master Telemedicine', icon: Globe },
    { id: '18_master_penelitian', label: '18. Master Penelitian', icon: BookOpen },
    { id: '19_master_rehabilitasi', label: '19. Master Rehabilitasi', icon: UserCog },
    { id: '20_master_dialisis', label: '20. Master Dialisis', icon: LifeBuoy },
    { id: '21_master_onkologi', label: '21. Master Onkologi', icon: Shield },
    { id: '22_master_obgyn', label: '22. Master OBGYN', icon: Baby },
    { id: '23_master_pediatri', label: '23. Master Pediatri', icon: Baby },
    { id: '24_master_dental', label: '24. Master Dental', icon: Hash },
    { id: '25_master_mortality', label: '25. Master Mortality', icon: UserX },
    { id: '26_master_audit', label: '26. Master Audit', icon: History },
    { id: '27_master_dokumen_digital', label: '27. Dokumen Digital', icon: FileSpreadsheetIcon },
    { id: '28_master_device', label: '28. Master Device', icon: Cpu },
    { id: '29_master_satusehat', label: '29. Master SATUSEHAT', icon: Cpu },
    { id: '30_master_ai', label: '30. Master AI', icon: Sparkles },
    { id: '31_master_keamanan', label: '31. Master Keamanan', icon: Lock },
    { id: '32_master_file_pasien', label: '32. Master File Repositori', icon: FolderOpen }
  ];

  function HomeIcon(props) {
    return <MapPin {...props} />;
  }

  const openInjectModal = (tabTarget = 'patients') => {
    setModalTab(tabTarget);
    setIsInjectModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Full-screen Oceanic Teal Loading Spinner during bulk injection */}
      {isGenerating && (
        <OceanicTealLoadingSpinner 
          variant="v1" 
          size="full" 
          label="Menginjeksi & Mengonstruksi Dataset Bulk Multi-Profesi SDM / Pasien (Oceanic Teal #007399)..." 
        />
      )}
      
      {/* ─── PAGE HEADER & STATS BANNER ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#004d66] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#007399]/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <Database size={12} /> ENTERPRISE HIS MASTER DATA HUB 2026
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Modul Manajemen Data Dummy Proyek HIS
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-2xl font-medium">
              Pusat kendali utama untuk mengelola 2 entitas data master utama proyek HIS: <strong>Data Master Pasien (21 Kategori Lengkap)</strong> dan <strong>Data Master Karyawan / SDM Medis</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => openInjectModal(activeTab)}
              className="bg-[#007399] hover:bg-[#005e7e] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-cyan-400/40"
            >
              <Zap size={16} className="text-amber-400 fill-amber-400" /> Smart Multi-Inject Generator
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Download size={16} /> Ekspor Dataset JSON
            </button>
            <button
              onClick={handleHardResetData}
              className="bg-rose-600/30 hover:bg-rose-600 border border-rose-500/40 text-rose-200 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={16} /> Reset Ke Default (0 Data)
            </button>
          </div>
        </div>

        {/* ─── KPI METRICS CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-700/60 relative z-10 max-w-4xl">
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
              <UserPlus size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">DATA MASTER PASIEN</div>
              <div className="text-3xl font-black text-white font-mono mt-0.5">{patientList.length} Pasien</div>
              <div className="text-[10px] text-cyan-400 font-bold">Terintegrasi 21 Kategori Lengkap</div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <Users size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">DATA MASTER KARYAWAN (SDM)</div>
              <div className="text-3xl font-black text-white font-mono mt-0.5">{staffList.length} Karyawan</div>
              <div className="text-[10px] text-emerald-400 font-bold">Terintegrasi NIP, STR, SIP & RBAC</div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black">
              <FileCheck size={24} />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">DOKUMEN EMR & CLINICAL</div>
              <div className="text-3xl font-black text-white font-mono mt-0.5">{emrDocuments.length} Dokumen</div>
              <div className="text-[10px] text-pink-400 font-bold">AOP, COP, ASC, MMU, PFR</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTROL PANEL (EXACTLY 2 SEPARATED TABS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        
        {/* ─── TABS HEADER & GENERATOR BUTTONS ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'patients'
                  ? 'bg-[#007399] text-white shadow-lg shadow-[#007399]/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <UserPlus size={18} /> 1. DATA MASTER PASIEN ({filteredPatients.length})
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Users size={18} /> 2. DATA MASTER KARYAWAN ({filteredStaff.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => openInjectModal(activeTab)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-amber-600/30"
            >
              <SlidersHorizontal size={15} /> Pilih Komponen Mock ({activeTab === 'patients' ? 'Pasien' : 'Karyawan'})
            </button>

            {activeTab === 'patients' ? (
              <>
                <button
                  onClick={() => generatePatientsBatch(10)}
                  disabled={isGenerating}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle size={15} /> +10 Pasien
                </button>
                <button
                  onClick={() => setIsAddPatientModalOpen(true)}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={15} /> Input Manual Pasien
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => generateStaffBatchTargeted('DOCTOR_SPECIALIST', 10)}
                  disabled={isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle size={15} /> +10 Karyawan Medis
                </button>
                <button
                  onClick={() => setIsAddStaffModalOpen(true)}
                  className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Users size={15} /> Input Manual Karyawan
                </button>
              </>
            )}
          </div>

        </div>

        {/* ─── TAB 1: DATA MASTER PASIEN ─── */}
        {activeTab === 'patients' && (
          <div className="space-y-4 pt-2">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pasien (Nama, MRN, NIK, Ibu Kandung, Agama, Etnis)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007399]"
              />
            </div>

            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto font-black">
                  <Inbox size={32} />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Belum Ada Data Master Pasien (0 Pasien)</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                  Klik tombol <strong>"Smart Multi-Inject Generator"</strong> di atas untuk meng-generate data demografi pasien 21 Kategori Lengkap.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-4">Pasien & Demografi Sosial</th>
                      <th className="px-6 py-4">Identifikasi (No. RM, NIK & SatuSehat)</th>
                      <th className="px-6 py-4">Dokter DPJP & Perawat (SDM Medis)</th>
                      <th className="px-6 py-4">Penjamin & Keselamatan</th>
                      <th className="px-6 py-4 text-right">Aksi Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-bold">
                    {filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#007399]/10 text-[#007399] dark:text-cyan-300 flex items-center justify-center font-black text-sm shrink-0 border border-[#007399]/20">
                              {p.gender === 'Perempuan' ? 'P' : 'L'}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-sm uppercase flex items-center gap-2">
                                <span>{p.name || p.full_name}</span>
                                {p.blood_type && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[9px] font-mono font-black border border-rose-500/20">
                                    Gol. {p.blood_type}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                {p.gender} • {p.age} Thn ({p.birth_place || 'Bandung'}, {p.birth_date || '1995-01-01'})
                              </div>
                              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium mt-0.5">
                                Ibu: {p.maiden_name || p.family_pedigree?.mother_maiden_name || 'Siti Aminah'} • {p.religion || 'Islam'} • {p.ethnicity || 'Sunda'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-900 dark:text-white font-black text-xs">MRN: {p.mrn}</span>
                            <button
                              onClick={() => handleCopyText(p.mrn, `mrn-${p.id}`, 'No. RM')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white text-slate-400 hover:text-white transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Salin No. RM"
                            >
                              {copiedId === `mrn-${p.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 font-bold mt-1">NIK: {p.nik || '-'}</div>
                          <div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            SatuSehat: {p.satusehat_ihs_no || p.satusehat_id || 'ihs-p-99882211'}
                          </div>
                        </td>

                        {/* EXPLICIT TRACEABLE MEDICAL STAFF COLUMN (CLEAN DISPLAY WITHOUT LEGAL NUMBERS) */}
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Stethoscope size={13} className="text-[#007399]" />
                            <span>{p.admin_info?.dpjp_doctor || 'dr. Ahmad Hidayat, Sp.PD'}</span>
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                            <UserCheck size={11} /> Perawat: {p.admin_info?.attending_nurse || 'Ns. Siti Rahma, S.Kep'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            (p.insurance?.type || p.insurance?.payment_type || '').includes('BPJS')
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                          }`}>
                            <ShieldCheck size={11} /> {p.insurance?.type || p.insurance?.payment_type || 'BPJS'} ({p.bpjs_no || p.insurance?.no || '-'})
                          </span>
                          <div className="mt-1">
                            {p.safety_flags?.allergy_risk ? (
                              <span className="bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                                <AlertTriangle size={9} /> Alergi Medikasi
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                                <CheckCircle2 size={9} /> Aman JCI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPatientPortfolio(p)}
                              className="px-3 py-1.5 rounded-xl bg-[#007399]/10 text-[#007399] dark:text-cyan-400 hover:bg-[#007399] hover:text-white border border-[#007399]/20 transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Lihat 21 Kategori Demografi Pasien Ini"
                            >
                              <Eye size={14} />
                              <span>21 Kategori Demografi</span>
                            </button>
                            <button
                              onClick={() => setSelectedItemJSON(p)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#007399] hover:text-white transition-colors cursor-pointer"
                              title="Inspeksi Struktur JSON Raw Data"
                            >
                              <Code size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus data pasien ${p.name}?`)) {
                                  deletePatient(p.id);
                                  toast.success(`Pasien ${p.name} dihapus.`);
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Hapus Pasien Dummy Ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: DATA MASTER KARYAWAN / SDM MEDIS ─── */}
        {activeTab === 'staff' && (
          <div className="space-y-4 pt-2">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari karyawan dummy (Nama, NIP, Email, Spesialisasi)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007399]"
              />
            </div>

            {filteredStaff.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto font-black">
                  <Users size={32} />
                </div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Belum Ada Data Master Karyawan (0 Karyawan)</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                  Klik tombol <strong>"Smart Multi-Inject Generator"</strong> di atas untuk meng-generate data SDM medis simulasi pilihan (Dokter, Perawat, Apoteker, Admin).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-6 py-4">Karyawan / SDM Medis</th>
                      <th className="px-6 py-4">NIP & Kontak</th>
                      <th className="px-6 py-4">Departemen & Peran RBAC</th>
                      <th className="px-6 py-4">Kredensial STR & SIP (JCI SQE)</th>
                      <th className="px-6 py-4 text-right">Aksi Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-bold">
                    {filteredStaff.map((stf) => (
                      <tr key={stf.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-500/20">
                              <Users size={18} />
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white text-sm">{stf.fullName}</div>
                              <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{stf.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-900 dark:text-white font-black text-xs">{stf.nip}</span>
                            <button
                              onClick={() => handleCopyText(stf.nip, `nip-${stf.id}`, 'NIP Karyawan')}
                              className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white text-slate-400 hover:text-white transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Salin NIP"
                            >
                              {copiedId === `nip-${stf.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1">{stf.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 dark:text-white font-bold">{stf.departmentName}</div>
                          <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            <BadgeCheck size={10} /> {stf.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">STR: {stf.strNumber || 'TERVERIFIKASI'}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">SIP: {stf.sipNumber || 'AKTIF'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStaffPortfolio(stf)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 transition-all font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="Lihat atau Edit Detail Data Karyawan"
                            >
                              <Eye size={14} />
                              <span>Lihat atau Edit</span>
                            </button>
                            <button
                              onClick={() => setSelectedItemJSON(stf)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#007399] hover:text-white transition-colors cursor-pointer"
                              title="Inspeksi Struktur JSON Raw Data"
                            >
                              <Code size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus karyawan ${stf.fullName}?`)) {
                                  setStaffList(prev => prev.filter(s => s.id !== stf.id));
                                  toast.success(`Karyawan ${stf.fullName} dihapus.`);
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              title="Hapus Karyawan Ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ─── SMART MULTI-INJECT MOCK GENERATOR MODAL (WITH MODAL TAB SWITCHER PASIEN VS KARYAWAN) ─── */}
      {isInjectModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#004d66] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400">
                  <Zap size={24} className="fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Smart Multi-Inject Mock Generator</h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    Pilih kategori simulasi data dummy spesifik yang ingin di-inject ke dalam sistem.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsInjectModalOpen(false)} className="text-slate-400 hover:text-white font-black text-2xl p-2 cursor-pointer">✕</button>
            </div>

            {/* TAB SWITCHER DEDICATED PASIEN VS KARYAWAN INSIDE MODAL */}
            <div className="bg-slate-100 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setModalTab('patients')}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalTab === 'patients'
                    ? 'bg-[#007399] text-white shadow-lg shadow-[#007399]/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <UserPlus size={16} /> 1. DUMMY MOCK DATA PASIEN & REKAM MEDIS
              </button>

              <button
                onClick={() => setModalTab('staff')}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modalTab === 'staff'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Users size={16} /> 2. DUMMY MOCK DATA KARYAWAN & SDM MEDIS
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Target Count Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Jumlah Record per Komponen (Target Generation Count):
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Berapa banyak baris data dummy {modalTab === 'patients' ? 'Pasien' : 'Karyawan'} yang ingin dibuat
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[5, 10, 25, 50, 100].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setInjectCount(cnt)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                        injectCount === cnt
                          ? (modalTab === 'patients' ? 'bg-[#007399] text-white shadow-md' : 'bg-emerald-600 text-white shadow-md')
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode 1: DUMMY MOCK PASIEN & REKAM MEDIS (WITH TRACEABLE STAFF NOTICE) */}
              {modalTab === 'patients' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-[#007399] shrink-0" />
                      <span><strong>Integrasi Otomatis SDM Medis:</strong> Setiap rekam medis pasien akan otomatis dikaitkan dengan NIP, STR & SIP Dokter DPJP, Perawat, dan Apoteker.</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[9px] font-black uppercase shrink-0">JCI & FHIR Traceable</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#007399] flex items-center gap-2">
                      <UserPlus size={16} /> Opsi Dummy Mock Pasien (Centang Multiple):
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <button onClick={() => setSelectedPatientCategories(PATIENT_INJECTION_CATEGORIES.map(c => c.id))} className="text-[#007399] dark:text-cyan-400 hover:underline cursor-pointer">Pilih Semua ({PATIENT_INJECTION_CATEGORIES.length})</button>
                      <span className="text-slate-300">•</span>
                      <button onClick={() => setSelectedPatientCategories(['patients'])} className="text-[#007399] dark:text-cyan-400 hover:underline cursor-pointer">Master Pasien Saja</button>
                      <span className="text-slate-300">•</span>
                      <button onClick={() => setSelectedPatientCategories(['soap', 'aop', 'asc', 'pfr', 'acc'])} className="text-[#007399] dark:text-cyan-400 hover:underline cursor-pointer">Rekam Medis Saja</button>
                      <span className="text-slate-300">•</span>
                      <button onClick={() => setSelectedPatientCategories([])} className="text-rose-500 hover:underline cursor-pointer">Kosongkan</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PATIENT_INJECTION_CATEGORIES.map((cat) => {
                      const isChecked = selectedPatientCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategorySelection(cat.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 h-full relative ${
                            isChecked
                              ? 'bg-[#007399]/10 border-[#007399] dark:bg-[#007399]/20 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? <CheckSquare className="text-[#007399] dark:text-cyan-400" size={20} /> : <Square className="text-slate-400" size={20} />}
                          </div>
                          <div className="flex-1 pr-7">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-xs text-slate-900 dark:text-white line-clamp-1">{cat.label}</span>
                            </div>
                            
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-1 flex-1">
                                {cat.desc}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${cat.badgeColor}`}>
                                {cat.category}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewCategoryInfo(cat);
                            }}
                            className="absolute top-3.5 right-3.5 p-1 rounded-full bg-slate-200/80 dark:bg-slate-800 hover:bg-[#007399] hover:text-white text-slate-500 dark:text-slate-400 transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
                            title="Preview Kelengkapan Data"
                          >
                            <Info size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode 2: DUMMY MOCK KARYAWAN & TAXONOMY PROFESI RS (150+ PROFESI) */}
              {modalTab === 'staff' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Category Filter Pills & Search Input */}
                  <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Pilih Data Profesi Rumah Sakit (Multi-Checkbox Taxonomy):
                          </h4>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Terpilih: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{selectedProfessions.length}</strong> dari <strong>{HOSPITAL_PROFESSIONS.length} Profesi RS</strong>
                          </p>
                        </div>
                      </div>

                      {/* Quick Selection Action Buttons */}
                      <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                        <button 
                          type="button" 
                          onClick={() => setSelectedProfessions(HOSPITAL_PROFESSIONS.map(p => p.id))} 
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black cursor-pointer text-[11px] shadow-sm"
                        >
                          ✓ Pilih Semua ({HOSPITAL_PROFESSIONS.length})
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const currentCatIds = filteredProfessionsTaxonomy.map(p => p.id);
                            setSelectedProfessions(prev => Array.from(new Set([...prev, ...currentCatIds])));
                          }} 
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-all font-black cursor-pointer text-[11px] shadow-sm"
                        >
                          ✓ Pilih Kategori Ini ({filteredProfessionsTaxonomy.length})
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedProfessions([])} 
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-black cursor-pointer text-[11px]"
                        >
                          ✕ Kosongkan
                        </button>
                      </div>
                    </div>

                    {/* Category Dropdown & Search Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="sm:col-span-1">
                        <select
                          value={professionCategoryFilter}
                          onChange={(e) => setProfessionCategoryFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="ALL">🌐 SEMUA KATEGORI ({HOSPITAL_PROFESSIONS.length} Profesi)</option>
                          {HOSPITAL_PROFESSION_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label} ({HOSPITAL_PROFESSIONS.filter(p => p.categoryId === cat.id).length})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={professionSearchQuery}
                          onChange={(e) => setProfessionSearchQuery(e.target.value)}
                          placeholder="Cari profesi (mis: Bedah Saraf, Perawat ICU, Coder, Full Stack, Kasir)..."
                          className="w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Checkbox Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[440px] overflow-y-auto p-1 custom-scrollbar">
                    {filteredProfessionsTaxonomy.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-xs font-bold text-slate-400">
                        Tidak ditemukan profesi yang cocok dengan pencarian "{professionSearchQuery}".
                      </div>
                    ) : (
                      filteredProfessionsTaxonomy.map((prof) => {
                        const isChecked = selectedProfessions.includes(prof.id);
                        const catMeta = HOSPITAL_PROFESSION_CATEGORIES.find(c => c.id === prof.categoryId);

                        return (
                          <div
                            key={prof.id}
                            onClick={() => {
                              setSelectedProfessions(prev => 
                                prev.includes(prof.id) ? prev.filter(id => id !== prof.id) : [...prev, prof.id]
                              );
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                              isChecked
                                ? 'bg-emerald-500/10 border-emerald-500 dark:bg-emerald-500/20 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={18} /> : <Square className="text-slate-400" size={18} />}
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="font-black text-xs text-slate-900 dark:text-white truncate">
                                {prof.title}
                              </div>
                              <div className="text-[10px] font-mono text-slate-500 font-semibold mt-0.5 truncate">
                                {prof.prefix}{prof.degree || ''}
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${catMeta?.color || 'bg-slate-200 text-slate-700'}`}>
                                  {prof.categoryId.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-[9px] font-bold ${prof.isMedical ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`}>
                                  {prof.isMedical ? 'STR/SIP Active' : 'Non-Klinis (SK)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-500">
                Mode Active: <strong className={modalTab === 'patients' ? 'text-[#007399]' : 'text-emerald-600'}>
                  {modalTab === 'patients' ? `Pasien (${selectedPatientCategories.length} Kategori)` : `Karyawan (${selectedProfessions.length} Profesi RS Terpilih)`}
                </strong> • Total Inject Target: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {modalTab === 'patients' ? `${selectedPatientCategories.length * injectCount} Record Baru` : `${selectedProfessions.length} Profesi × ${injectCount} = ${selectedProfessions.length * injectCount} Record Karyawan Baru`}
                </strong>
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsInjectModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer">Batal</button>
                <button
                  type="button" onClick={handleExecuteMultiInjection} disabled={isGenerating}
                  className={`text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    modalTab === 'patients' ? 'bg-[#007399] hover:bg-[#005e7e]' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Zap size={16} className="text-amber-400 fill-amber-400" />
                  <span>INJECT DATA DUMMY {modalTab === 'patients' ? 'PASIEN' : 'KARYAWAN'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── PREVIEW KELENGKAPAN DATA SUB-MODAL ─── */}
      {previewCategoryInfo && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#007399]/10 text-[#007399] dark:text-cyan-400 flex items-center justify-center font-black shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${previewCategoryInfo.badgeColor}`}>
                    {previewCategoryInfo.category}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    Preview Kelengkapan Data: {previewCategoryInfo.label}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewCategoryInfo(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 py-2">
              <p className="text-xs font-semibold text-slate-500">
                Berikut adalah rincian seluruh struktur field dan sub-kategori data yang akan di-inject ke dalam sistem untuk komponen ini:
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[350px] overflow-y-auto custom-scrollbar space-y-2">
                {previewCategoryInfo.details ? (
                  previewCategoryInfo.details.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic">{previewCategoryInfo.desc}</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewCategoryInfo(null)}
                className="bg-[#007399] hover:bg-[#005e7e] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PATIENT DUMMY DATA PORTFOLIO MODAL ─── */}
      {selectedPatientPortfolio && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2.5rem] w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#004d66] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#007399]/30 border border-cyan-400/40 flex items-center justify-center font-black text-2xl text-cyan-300">
                  {selectedPatientPortfolio.gender === 'Perempuan' ? 'P' : 'L'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white uppercase">{selectedPatientPortfolio.name || selectedPatientPortfolio.full_name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      32 KATEGORI MASTER PASIEN COMPLETE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-1 font-bold">
                    <span>MRN: {selectedPatientPortfolio.mrn}</span> • <span>NIK: {selectedPatientPortfolio.nik || '3273010002998341'}</span> • <span>IHS: {selectedPatientPortfolio.satusehat_ihs_no || selectedPatientPortfolio.satusehat_id || 'ihs-p-998811'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPatientPortfolio(null)} className="text-slate-400 hover:text-white font-black text-2xl p-2 cursor-pointer">✕</button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 custom-scrollbar">
              {PORTFOLIO_NAV_ITEMS.map((item) => {
                const IconComp = item.icon;
                const isActive = portfolioActiveCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setPortfolioActiveCategory(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive ? 'bg-[#007399] text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <IconComp size={13} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#007399] flex items-center gap-2">
                    <Database size={16} /> INSPEKSI KATEGORI MASTER: {PORTFOLIO_NAV_ITEMS.find(n => n.id === portfolioActiveCategory)?.label || portfolioActiveCategory.toUpperCase()}
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">Terverifikasi 100% Complete & Audit-Ready</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[450px]">
                  <pre>{JSON.stringify(selectedPatientPortfolio, null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button onClick={() => handleCopyText(JSON.stringify(selectedPatientPortfolio, null, 2), 'portfolio-json', 'Bundle Complete 32 Master Pasien JSON')} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Copy size={14} /> Salin Complete 32 Master Pasien JSON
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedPatientPortfolio(null)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Tutup</button>
                <button onClick={() => { navigate(`/emr?patientId=${selectedPatientPortfolio.id}`); setSelectedPatientPortfolio(null); }} className="bg-[#007399] hover:bg-[#005e7e] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer">
                  <span>Buka di EMR Rawat Jalan</span> <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENTERPRISE STAFF DUMMY DATA PORTFOLIO MODAL (20 CATEGORIES JCI SQE & SATUSEHAT) ─── */}
      <StaffPortfolioDetailModal
        staff={selectedStaffPortfolio}
        onClose={() => setSelectedStaffPortfolio(null)}
      />

      {/* ─── JSON INSPECTOR MODAL ─── */}
      {selectedItemJSON && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black flex items-center gap-2 text-cyan-400">
                <Code size={18} /> JSON Raw Record: {selectedItemJSON.fullName || selectedItemJSON.name} ({selectedItemJSON.id || selectedItemJSON.nip})
              </h3>
              <button onClick={() => setSelectedItemJSON(null)} className="text-slate-400 hover:text-white font-black text-lg p-1 cursor-pointer">✕</button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 leading-relaxed custom-scrollbar">
              <pre>{JSON.stringify(selectedItemJSON, null, 2)}</pre>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button onClick={() => handleCopyText(JSON.stringify(selectedItemJSON, null, 2), 'json-dump', 'Struktur JSON Raw')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer">
                <Copy size={14} /> Salin JSON String
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MANUAL INPUT PATIENT MODAL ─── */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black flex items-center gap-2 text-[#007399]">
                <UserPlus size={20} /> Input Pasien Dummy Manual
              </h3>
              <button onClick={() => setIsAddPatientModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateCustomPatient} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nama Pasien Lengkap *</label>
                <input type="text" required value={newPatientData.name} onChange={(e) => setNewPatientData(prev => ({ ...prev, name: e.target.value }))} placeholder="Contoh: TN. AGUNG PRATAMA, S.ST" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#007399] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Jenis Kelamin</label>
                  <select value={newPatientData.gender} onChange={(e) => setNewPatientData(prev => ({ ...prev, gender: e.target.value }))} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Usia (Tahun)</label>
                  <input type="number" value={newPatientData.age} onChange={(e) => setNewPatientData(prev => ({ ...prev, age: e.target.value }))} className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddPatientModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer">Batal</button>
                <button type="submit" className="bg-[#007399] hover:bg-[#005e7e] text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">Simpan Pasien Dummy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MANUAL INPUT STAFF MODAL ─── */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black flex items-center gap-2 text-emerald-600">
                <Users size={20} /> Input Karyawan / SDM Medis Dummy
              </h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateCustomStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Nama Karyawan & Gelar *</label>
                <input type="text" required value={newStaffData.fullName} onChange={(e) => setNewStaffData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Contoh: dr. Budi Santoso, Sp.PD" className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsAddStaffModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer">Batal</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer">Simpan Karyawan Dummy</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
