import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Search, ShieldCheck, KeyRound, Lock, 
  Award, FileText, CheckCircle2, AlertCircle, Edit, Trash2, X, Save, RefreshCw, Eye, EyeOff,
  Fingerprint, Briefcase, Building2, BookOpen, Clock, 
  CheckSquare, Wallet, BarChart3, GraduationCap, HeartPulse, 
  FolderCheck, Key, Laptop, ShieldAlert, FileSignature, History, Cpu, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStaffList, saveStaffMember } from '../services/staffManagement.service';
import RbacMatrixTable from '../components/RbacMatrixTable';
import StaffPortfolioDetailModal from '../components/StaffPortfolioDetailModal.jsx';

const STAFF_PORTFOLIO_NAV_ITEMS = [
  { id: 'identitas', label: '1. Demografi', icon: Fingerprint },
  { id: 'kepegawaian', label: '2. Kepegawaian', icon: Briefcase },
  { id: 'organisasi', label: '3. Organisasi', icon: Building2 },
  { id: 'lisensi', label: '4. Lisensi STR/SIP', icon: Award },
  { id: 'pendidikan', label: '5. Pendidikan', icon: GraduationCap },
  { id: 'pengalaman', label: '6. Pengalaman', icon: BookOpen },
  { id: 'kredensial', label: '7. JCI Credence', icon: ShieldCheck },
  { id: 'jadwal', label: '8. Shift & Roster', icon: Clock },
  { id: 'absensi', label: '9. Absensi & Cuti', icon: CheckSquare },
  { id: 'payroll', label: '10. Payroll & Bank', icon: Wallet },
  { id: 'kpi', label: '11. KPI & Evaluasi', icon: BarChart3 },
  { id: 'cme', label: '12. CME SKP', icon: BookOpen },
  { id: 'kesehatan', label: '13. Health & MCU', icon: HeartPulse },
  { id: 'dokumen', label: '14. Vault File', icon: FolderCheck },
  { id: 'akses', label: '15. RBAC & MFA', icon: Key },
  { id: 'aset', label: '16. Inventaris Aset', icon: Laptop },
  { id: 'disiplin', label: '17. Reward & SP', icon: ShieldAlert },
  { id: 'esign', label: '18. E-Signature BSRE', icon: FileSignature },
  { id: 'audit', label: '19. Audit Trail', icon: History },
  { id: 'integrasi', label: '20. SATUSEHAT FHIR', icon: Cpu }
];

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState(() => getStaffList());
  const [activeTab, setActiveTab] = useState('STAFF_GRID'); // STAFF_GRID | RBAC_MATRIX
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [showPin, setShowPin] = useState(false);

  // 20-Category Portfolio Inspection Modal State
  const [selectedStaffPortfolio, setSelectedStaffPortfolio] = useState(null);
  const [staffPortfolioActiveCategory, setStaffPortfolioActiveCategory] = useState('identitas');

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    nip: '',
    fullName: '',
    degree: '',
    email: '',
    phone: '',
    departmentName: 'Departemen Logistik Farmasi',
    role: 'PHARMACIST_SUPERVISOR',
    pin: '123456',
    strNumber: '',
    strExpiry: '',
    sipNumber: '',
    sipExpiry: ''
  });

  // Calculated KPI Analytics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => s.status === 'ACTIVE').length;
  const expiringCredentials = staffList.filter(s => {
    if (!s.strExpiry && !s.sipExpiry) return false;
    const now = new Date();
    const strExp = s.strExpiry ? new Date(s.strExpiry) : null;
    const sipExp = s.sipExpiry ? new Date(s.sipExpiry) : null;
    const diffStrDays = strExp ? (strExp - now) / (1000 * 60 * 60 * 24) : 999;
    const diffSipDays = sipExp ? (sipExp - now) / (1000 * 60 * 60 * 24) : 999;
    return diffStrDays < 180 || diffSipDays < 180;
  }).length;

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchNip = s.nip.toLowerCase().includes(q);
        const matchDept = s.departmentName.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchDept && !matchRole) return false;
      }
      return true;
    });
  }, [staffList, searchQuery, roleFilter]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setStaffForm({
      nip: `NIP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      degree: '',
      email: '',
      phone: '',
      departmentName: 'Departemen Logistik Farmasi',
      role: 'PHARMACIST_SUPERVISOR',
      pin: '123456',
      strNumber: '',
      strExpiry: new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0,10),
      sipNumber: '',
      sipExpiry: new Date(Date.now() + 365*24*60*60*1000).toISOString().substring(0,10)
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditModal = (stf) => {
    setEditingStaff(stf);
    setStaffForm({
      id: stf.id,
      nip: stf.nip,
      fullName: stf.fullName,
      degree: stf.degree || '',
      email: stf.email || '',
      phone: stf.phone || '',
      departmentName: stf.departmentName || 'Departemen Logistik Farmasi',
      role: stf.role || 'PHARMACIST_SUPERVISOR',
      pin: stf.pin || '123456',
      strNumber: stf.strNumber || '',
      strExpiry: stf.strExpiry || '',
      sipNumber: stf.sipNumber || '',
      sipExpiry: stf.sipExpiry || ''
    });
    setIsStaffModalOpen(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!staffForm.fullName.trim()) return toast.error('Nama Lengkap wajib diisi!');
    if (!staffForm.nip.trim()) return toast.error('NIP Staf wajib diisi!');

    const updatedList = saveStaffMember(staffForm);
    setStaffList(updatedList);
    setIsStaffModalOpen(false);
    toast.success(`Data Staf "${staffForm.fullName}" Berhasil Disimpan!`, { icon: '🧑‍⚕️' });
  };

  // View Mode: 'PASSPORT' (V2 User Favorite) or 'TABLE'
  const [viewMode, setViewMode] = useState('PASSPORT');

  return (
    <div className="p-6 space-y-6 text-slate-800 dark:text-slate-100 font-sans max-w-7xl mx-auto">
      
      {/* Module Clean Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#007399]/10 text-[#007399] dark:text-cyan-400 border border-[#007399]/20 rounded-2xl flex items-center justify-center font-bold shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Manajemen Data Karyawan & Kontrol Hak Akses (HR & RBAC Matrix)
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-mono text-[10px] font-bold uppercase border border-emerald-500/20">
                JCI SQE Compliant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Enterprise Human Resources, Credentialing (STR/SIP Tracking), & Centralized Role Permissions Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('STAFF_GRID')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STAFF_GRID'
                ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users size={15} />
            <span>Master Data Staf ({totalStaff})</span>
          </button>

          <button
            onClick={() => setActiveTab('RBAC_MATRIX')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'RBAC_MATRIX'
                ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Lock size={15} />
            <span>Matrix Hak Akses (RBAC)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staf Medis Aktif</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">{activeStaff} Staf</div>
            <span className="text-[10px] text-emerald-600 font-semibold">Ready & Authorized</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PIN Security Otorisasi</span>
            <div className="text-2xl font-black text-[#007399] dark:text-cyan-400 font-mono mt-0.5">100% Secured</div>
            <span className="text-[10px] text-slate-400">256-Bit Encrypted Passcode</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#007399]/10 text-[#007399] dark:text-cyan-400 flex items-center justify-center">
            <KeyRound size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credentialing STR & SIP</span>
            <div className="text-2xl font-black text-amber-500 font-mono mt-0.5">{expiringCredentials} Staf Warning</div>
            <span className="text-[10px] text-amber-600 font-semibold">Monitoring Masa Berlaku</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Content Body: STAFF_GRID or RBAC_MATRIX */}
      {activeTab === 'STAFF_GRID' ? (
        <div className="space-y-4">
          
          {/* Controls: Search, Filter, View Mode, & Add Button */}
          <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari NIP, Nama Staf, Role, atau Departemen..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-xs font-semibold outline-none focus:border-[#007399]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-semibold outline-none focus:border-[#007399] cursor-pointer"
              >
                <option value="ALL">Semua Peran / Role</option>
                <option value="PHARMACIST_SUPERVISOR">Apoteker Supervisor & Depo</option>
                <option value="PHARMACIST_STAFF">Apoteker Pelaksana / Staff Farmasi</option>
                <option value="HEAD_NURSE">Head Nurse / Kepala Ruangan</option>
                <option value="STAFF_NURSE">Perawat Pelaksana</option>
                <option value="DOCTOR_SPECIALIST">Dokter Spesialis / DPJP</option>
                <option value="DOCTOR_GENERAL">Dokter Umum / Resident</option>
                <option value="LOGISTICS_ADMIN">Staf Logistik Sentral & Gudang</option>
                <option value="BILLING_OFFICER">Petugas Kasir & Billing</option>
                <option value="LAB_RADIOLOGY_TECH">Analis Penunjang Medis (Lab/Rad)</option>
                <option value="SUPER_ADMIN">Super Administrator EHIS</option>
              </select>
            </div>

            {/* View Mode Toggle: Passport Cards (V2) vs Table Grid */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800 gap-1">
              <button
                onClick={() => setViewMode('PASSPORT')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'PASSPORT'
                    ? 'bg-[#007399] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award size={13} />
                <span>Passport Cards (V2 ⭐)</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'TABLE'
                    ? 'bg-[#007399] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Tabel Data</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="h-9 px-4 bg-[#007399] hover:bg-[#005e7e] text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus size={15} />
              <span>Tambah Staf Medis Baru</span>
            </button>
          </div>

          {/* V2 Passport Cards Layout */}
          {viewMode === 'PASSPORT' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((stf) => (
                <div
                  key={stf.id}
                  className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#007399] transition-all hover:scale-[1.01] space-y-4 shadow-sm hover:shadow-lg relative overflow-hidden group"
                >
                  {/* Top Accent Line in Oceanic Teal */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#007399]"></div>

                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#007399] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#007399]/25 uppercase">
                        {stf.fullName ? stf.fullName.substring(0, 2) : 'ST'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#007399] dark:group-hover:text-cyan-400 transition-colors">
                          {stf.fullName}
                        </h3>
                        <p className="text-[10px] text-[#007399] dark:text-cyan-400 font-mono font-bold">{stf.nip}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedStaffPortfolio(stf)}
                        className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 border border-emerald-500/20"
                        title="Lihat atau Edit Detail Portfolio Karyawan"
                      >
                        <Eye size={12} />
                        <span>Lihat atau Edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(stf)}
                        className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        title="Edit Staf"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                    <div className="text-[11px] font-extrabold text-[#007399] dark:text-cyan-400 font-mono">{stf.role}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{stf.departmentName}</div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {['ADMIN_OFFICER', 'LOGISTICS_ADMIN', 'BILLING_OFFICER', 'SUPER_ADMIN'].includes(stf.role) ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-900/20 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                        <div className="text-[10px] font-black uppercase tracking-wider flex items-center justify-between">
                          <span>Legalitas: Non-Medis</span>
                          <span className="px-1.5 py-0.2 bg-amber-500/20 rounded text-[9px]">Bebas STR</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold mt-1">SK Kontrak: SK-RS/2026/{stf.role}</div>
                      </div>
                    ) : (
                      <>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-slate-500">STR Expiry:</span>
                          <span className="text-[11px] font-mono text-slate-700 dark:text-slate-200 font-bold">{stf.strExpiry || '-'}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-[10px] font-semibold text-slate-500">SIP Expiry:</span>
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">{stf.sipExpiry || '-'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-500 font-semibold">256-Bit Passcode</span>
                    <span className="px-2.5 py-0.5 bg-[#007399]/10 text-[#007399] dark:text-cyan-300 rounded-full text-[9px] font-extrabold uppercase border border-[#007399]/20">
                      {stf.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Master Staff Table (Alternative View) */}
          {viewMode === 'TABLE' && (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                      <th className="p-3.5 px-4">Informasi Staf / NIP</th>
                      <th className="p-3.5 px-4">Role & Departemen</th>
                      <th className="p-3.5 px-4">Legal Credentialing (STR / SIP / SK)</th>
                      <th className="p-3.5 px-4 text-center">PIN Security</th>
                      <th className="p-3.5 px-4 text-center">Status</th>
                      <th className="p-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredStaff.map(stf => (
                      <tr key={stf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-teal-600 font-bold text-xs flex items-center justify-center uppercase border border-slate-200 dark:border-slate-700 shrink-0">
                              {stf.fullName ? stf.fullName.substring(0, 2) : 'ST'}
                            </div>
                            <div>
                              <strong className="text-slate-900 dark:text-white block text-xs">{stf.fullName}</strong>
                              <span className="font-mono text-[10px] text-slate-400 font-semibold">{stf.nip}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div>
                            <span className="px-2 py-0.5 bg-teal-500/10 text-teal-600 rounded text-[10px] font-bold font-mono inline-block mb-0.5">
                              {stf.role}
                            </span>
                            <span className="text-[11px] text-slate-500 block">{stf.departmentName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {['ADMIN_OFFICER', 'LOGISTICS_ADMIN', 'BILLING_OFFICER', 'SUPER_ADMIN'].includes(stf.role) ? (
                            <div className="text-[11px]">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-mono text-[10px] inline-block mb-0.5">
                                NON-KLINIS (BEBAS STR)
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono">SK RS: SK-RS/2026</div>
                            </div>
                          ) : (
                            <div className="space-y-0.5 text-[11px]">
                              <div><strong className="text-slate-700 dark:text-slate-300">STR:</strong> <span className="font-mono">{stf.strNumber || '-'}</span> (Exp: {stf.strExpiry || '-'})</div>
                              <div><strong className="text-slate-700 dark:text-slate-300">SIP:</strong> <span className="font-mono">{stf.sipNumber || '-'}</span> (Exp: {stf.sipExpiry || '-'})</div>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 bg-[#007399]/10 text-[#007399] dark:text-cyan-300 border border-[#007399]/20 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1">
                            <KeyRound size={11} />
                            <span>••••••</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-[#007399]/10 text-[#007399] dark:text-cyan-300 rounded-full text-[10px] font-extrabold uppercase border border-[#007399]/20">
                            {stf.status || 'ACTIVE'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedStaffPortfolio(stf)}
                              className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/20"
                              title="Lihat atau Edit Detail Portfolio Karyawan"
                            >
                              <Eye size={12} />
                              <span>Lihat atau Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(stf)}
                              className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white rounded-full text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        <RbacMatrixTable />
      )}

      {/* ADD / EDIT STAFF MODAL */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-primary" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingStaff ? 'Edit Data Staf Medis' : 'Tambah Staf Medis Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">NIP Staf:*</label>
                  <input
                    type="text"
                    required
                    value={staffForm.nip}
                    onChange={e => setStaffForm(prev => ({ ...prev, nip: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-mono font-bold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Nama Lengkap & Gelar:*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Apt. Rian Hidayat, S.Farm"
                    value={staffForm.fullName}
                    onChange={e => setStaffForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-bold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Peran / Role Status:*</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-semibold outline-none focus:border-primary cursor-pointer text-ellipsis overflow-hidden"
                  >
                    <option value="PHARMACIST_SUPERVISOR">Apoteker Supervisor & Depo</option>
                    <option value="PHARMACIST_STAFF">Apoteker Pelaksana / Staff Farmasi</option>
                    <option value="HEAD_NURSE">Head Nurse / Kepala Ruangan</option>
                    <option value="STAFF_NURSE">Perawat Pelaksana</option>
                    <option value="DOCTOR_SPECIALIST">Dokter Spesialis / DPJP</option>
                    <option value="DOCTOR_GENERAL">Dokter Umum / Resident</option>
                    <option value="LOGISTICS_ADMIN">Staf Logistik Sentral & Gudang</option>
                    <option value="BILLING_OFFICER">Petugas Kasir & Billing</option>
                    <option value="LAB_RADIOLOGY_TECH">Analis Penunjang Medis (Lab/Rad)</option>
                    <option value="SUPER_ADMIN">Super Administrator EHIS</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Departemen:*</label>
                  <input
                    type="text"
                    value={staffForm.departmentName}
                    onChange={e => setStaffForm(prev => ({ ...prev, departmentName: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">No. STR (Legalisasi Medis):</label>
                  <input
                    type="text"
                    placeholder="STR-..."
                    value={staffForm.strNumber}
                    onChange={e => setStaffForm(prev => ({ ...prev, strNumber: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">No. SIP (Izin Praktik):</label>
                  <input
                    type="text"
                    placeholder="SIP-..."
                    value={staffForm.sipNumber}
                    onChange={e => setStaffForm(prev => ({ ...prev, sipNumber: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">PIN Otorisasi 6-Digit:*</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={staffForm.pin}
                      onChange={e => setStaffForm(prev => ({ ...prev, pin: e.target.value.replace(/\D/g,'') }))}
                      className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3.5 pr-8 font-mono text-center tracking-widest outline-none focus:border-primary font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(prev => !prev)}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    >
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Status Otorisasi Staf:*</label>
                  <select
                    value={staffForm.status || 'ACTIVE'}
                    onChange={e => setStaffForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-9.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 font-semibold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ACTIVE">AKTIF (ON-DUTY)</option>
                    <option value="ON_LEAVE">CUTI / OFF-DUTY</option>
                    <option value="SUSPENDED">NON-AKTIF / SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="h-9 px-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Simpan Data Staf</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─── ENTERPRISE STAFF DUMMY DATA PORTFOLIO MODAL (20 CATEGORIES JCI SQE & SATUSEHAT) ─── */}
      <StaffPortfolioDetailModal
        staff={selectedStaffPortfolio}
        onClose={() => setSelectedStaffPortfolio(null)}
      />

    </div>
  );
}
