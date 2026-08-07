import React, { useState } from 'react';
import { 
  Copy, Check, Code, Eye, Layers, Palette, Table as TableIcon, 
  Tag, Sliders, Layout, BellRing, Search, RefreshCcw, Calendar, 
  User, CheckCircle2, AlertTriangle, ShieldCheck, Hash, Building2, Stethoscope 
} from 'lucide-react';

import DataTable from '../../../components/ui/DataTable.jsx';
import TablePagination from '../../../components/ui/TablePagination.jsx';
import StatusBadge from '../../../components/ui/StatusBadge.jsx';
import SegmentedTabs from '../../../components/ui/SegmentedTabs.jsx';
import FilterToolbar from '../../../components/ui/FilterToolbar.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import ClinicalAlertBanner from '../../../components/ui/ClinicalAlertBanner.jsx';
import PillSearchBar from '../../../components/ui/PillSearchBar.jsx';
import AdvancedPatientSearchBar from '../../emr/components/AdvancedPatientSearchBar.jsx';
import PatientSearchModal from '../../emr/components/PatientSearchModal.jsx';

/**
 * ModularDesignSystemReviewPage - Halaman Review Design System & Pustaka Komponen Modular HIS 2026
 * Menyediakan tampilan live dan snippet kode JSX siap salin untuk seluruh komponen modular.
 */
export default function ModularDesignSystemReviewPage() {
  const [activeCategory, setActiveCategory] = useState('data-display');
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [viewModeMap, setViewModeMap] = useState({}); // id -> 'preview' | 'code'
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  
  // Interactive Component States
  const [segmentedTabState, setSegmentedTabState] = useState('rj');
  const [searchValue, setSearchValue] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Katalog Kode Identifikasi Komponen Resmi
  const COMPONENT_MATRIX = [
    { code: '[COMP-UI-01]', name: 'Data Table Grid', file: 'DataTable.jsx', category: 'data-display' },
    { code: '[COMP-UI-02]', name: 'Table Pagination', file: 'TablePagination.jsx', category: 'data-display' },
    { code: '[COMP-UI-03]', name: 'Status Badge Semantik', file: 'StatusBadge.jsx', category: 'data-display' },
    { code: '[COMP-UI-04]', name: 'Segmented Tabs Pill', file: 'SegmentedTabs.jsx', category: 'wayfinding' },
    { code: '[COMP-UI-05]', name: 'Filter Toolbar Terpadu', file: 'FilterToolbar.jsx', category: 'interaction-forms' },
    { code: '[COMP-UI-06]', name: 'Clinical Card Data', file: 'ClinicalCard.jsx', category: 'data-display' },
    { code: '[COMP-UI-07]', name: 'Clinical Alert Banner', file: 'ClinicalAlertBanner.jsx', category: 'feedback-modal' },
    { code: '[COMP-UI-13]', name: 'Pill Search Bar (Oceanic Teal)', file: 'PillSearchBar.jsx', category: 'interaction-forms' },
    { code: '[COMP-EMR-01]', name: 'Advanced Patient Search Bar', file: 'AdvancedPatientSearchBar.jsx', category: 'interaction-forms' },
    { code: '[COMP-EMR-02]', name: 'Patient Search Modal Command Center', file: 'PatientSearchModal.jsx', category: 'feedback-modal' },
    { code: '[PAGE-ADM-01]', name: 'Design System Review Page', file: 'ModularDesignSystemReviewPage.jsx', category: 'wayfinding' },
    { code: '[PAGE-AUTH-01]', name: 'Login Screen Enterprise', file: 'LoginPage.jsx', category: 'wayfinding' },
    { code: '[PAGE-EMR-01]', name: 'EMR Outpatient Command Center', file: 'OutpatientEMR.jsx', category: 'wayfinding' }
  ];

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const toggleViewMode = (id) => {
    setViewModeMap(prev => ({
      ...prev,
      [id]: prev[id] === 'code' ? 'preview' : 'code'
    }));
  };

  // Demo Table Data
  const sampleTableColumns = [
    { key: 'noReg', label: 'NO. REGISTRASI', render: (r) => <span className="font-mono text-rose-600 font-extrabold">{r.noReg}</span> },
    { key: 'noRM', label: 'NO. RM', render: (r) => <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{r.noRM}</span> },
    { key: 'nama', label: 'NAMA PASIEN', render: (r) => <span className="font-black text-slate-900 dark:text-white uppercase">{r.nama}</span> },
    { key: 'departemen', label: 'DEPARTEMEN', render: (r) => (
      <StatusBadge variant="primary" icon={Building2}>{r.departemen}</StatusBadge>
    )},
    { key: 'penjamin', label: 'PENJAMIN', render: (r) => (
      <StatusBadge variant={r.penjamin === 'BPJS' ? 'success' : 'info'} icon={ShieldCheck}>{r.penjamin}</StatusBadge>
    )},
    { key: 'status', label: 'STATUS', render: (r) => (
      <StatusBadge variant={r.status === 'SELESAI' ? 'success' : r.status === 'TERKIRIM' ? 'info' : 'warning'} icon={CheckCircle2}>
        {r.status}
      </StatusBadge>
    )}
  ];

  const sampleTableData = [
    { id: '1', noReg: 'REG-88201', noRM: '100001', nama: 'NY. SITI NURHALIZA', departemen: 'Poli Kandungan', penjamin: 'BPJS', status: 'SELESAI' },
    { id: '2', noReg: 'REG-88202', noRM: '100002', nama: 'TN. BUDI GUNAWAN', departemen: 'Poli Penyakit Dalam', penjamin: 'BPJS', status: 'TERKIRIM' },
    { id: '3', noReg: 'REG-88203', noRM: '100003', nama: 'AN. SRI MULYANI', departemen: 'Poli Anak', penjamin: 'MANDIRI', status: 'PROSES' },
  ];

  const CODE_SNIPPETS = {
    status_badge: `import StatusBadge from '@/components/ui/StatusBadge.jsx';

// Lencana Status Semantik Terstandar (Oceanic Teal #007399)
<StatusBadge variant="primary" icon={Building2}>Poliklinik Utama</StatusBadge>
<StatusBadge variant="success" icon={CheckCircle2}>BPJS Verifikasi</StatusBadge>
<StatusBadge variant="danger" icon={AlertTriangle}>Cito / Darurat</StatusBadge>
<StatusBadge variant="warning">Menunggu Konfirmasi</StatusBadge>`,

    data_table: `import DataTable from '@/components/ui/DataTable.jsx';

const columns = [
  { key: 'noReg', label: 'NO. REG', render: (r) => <span className="font-mono text-rose-600 font-extrabold">{r.noReg}</span> },
  { key: 'nama', label: 'PASIEN', render: (r) => <span className="font-black uppercase">{r.nama}</span> },
  { key: 'status', label: 'STATUS', render: (r) => <StatusBadge variant="success">{r.status}</StatusBadge> }
];

<DataTable 
  columns={columns}
  data={data}
  isLoading={false}
  currentPage={currentPage}
  totalPages={5}
  pageSize={10}
  totalItems={50}
  onPageChange={(p) => setCurrentPage(p)}
/>`,

    segmented_tabs: `import SegmentedTabs from '@/components/ui/SegmentedTabs.jsx';

<SegmentedTabs 
  options={[
    { id: 'all', label: 'Semua Layanan' },
    { id: 'rj', label: 'Rawat Jalan (OPD)' },
    { id: 'ri', label: 'Rawat Inap (IPD)' }
  ]}
  activeTab={activeTab}
  onChange={(tabId) => setActiveTab(tabId)}
/>`,

    filter_toolbar: `import FilterToolbar from '@/components/ui/FilterToolbar.jsx';

<FilterToolbar
  searchValue={searchValue}
  onSearchChange={(val) => setSearchValue(val)}
  searchPlaceholder="Cari nama, No. RM, atau NIK..."
  onSearchSubmit={() => handleSearch()}
  onReset={() => handleReset()}
>
  <select 
    value={selectedDept} 
    onChange={(e) => setSelectedDept(e.target.value)}
    className="bg-white border border-slate-300 rounded-full px-3 py-1.5 text-xs font-bold"
  >
    <option value="">Pilih Departemen</option>
    <option value="IGD">IGD</option>
    <option value="POLI">Poliklinik</option>
  </select>
</FilterToolbar>`,

    patient_search_bar: `import AdvancedPatientSearchBar from '@/modules/emr/components/AdvancedPatientSearchBar.jsx';

// Bilah Pencarian Pasien Resmi Terpadu (Oceanic Teal Pill Border #007399)
<AdvancedPatientSearchBar 
  onSelectPatient={(patient) => console.log('Pasien terpilih:', patient)}
/>`,

    pill_search_bar: `import PillSearchBar from '@/components/ui/PillSearchBar.jsx';

// [COMP-UI-13] Bilah Pencarian Lonjong Terstandar (Oceanic Teal #007399)
<PillSearchBar 
  value={searchQuery}
  onChange={(val) => setSearchQuery(val)}
  onSearch={(query) => console.log('Search:', query)}
  onAdvancedClick={() => setIsModalOpen(true)}
  placeholder="Cari pasien canggih (Nama, No. RM, NIK, No. Kartu BPJS)..."
  advancedLabel="ADVANCED"
  variant="primary"
/>`,

    patient_search_modal: `import PatientSearchModal from '@/modules/emr/components/PatientSearchModal.jsx';

// Modal Resmi Command Center Outpatient
<PatientSearchModal 
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSelect={(patientId, encounterId) => handleSelect(patientId)}
/>`
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 space-y-8 text-slate-800 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#007399] text-white flex items-center justify-center font-black shadow-lg shadow-[#007399]/25 shrink-0">
            <Palette size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border border-[#007399]/30 text-[10px] font-black uppercase tracking-wider">
                Design System & Component Library
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-black uppercase">
                v2026 Enterprise Ready
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Galeri Review Design System & Komponen Modular HIS
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
              Katalog seluruh komponen UI terstandar dengan warna aksen <span className="font-extrabold text-[#007399]">Oceanic Teal #007399</span>. Setiap komponen dapat dipreview secara live dan kode JSX dapat disalin instan.
            </p>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <SegmentedTabs 
          options={[
            { id: 'data-display', label: 'Presentasi Data', icon: <TableIcon size={14} /> },
            { id: 'interaction-forms', label: 'Interaksi & Form', icon: <Sliders size={14} /> },
            { id: 'wayfinding', label: 'Navigasi', icon: <Layout size={14} /> },
            { id: 'feedback-modal', label: 'Feedback & Modal', icon: <BellRing size={14} /> },
          ]}
          activeTab={activeCategory}
          onChange={(cat) => setActiveCategory(cat)}
          size="lg"
        />
      </div>

      {/* QUICK REFERENCE KODE KOMPONEN MODULAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#004d66] p-6 rounded-3xl text-white shadow-md border border-slate-700/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 font-mono font-black text-xs border border-rose-500/30 flex items-center gap-1">
              <Hash size={14} /> KODE MATRIX
            </span>
            <h2 className="text-base font-black tracking-tight text-white">
              Papan Referensi Kode Komponen Modular (Komponen ID)
            </h2>
          </div>
          <span className="text-[11px] text-cyan-300 font-medium">
            Gunakan kode ini saat memberi instruksi perbaikan / fitur kepada AI Agent!
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {COMPONENT_MATRIX.map((item) => (
            <div 
              key={item.code}
              onClick={() => copyToClipboard(item.code, item.code)}
              className="bg-slate-950/60 hover:bg-slate-950 p-2.5 rounded-xl border border-slate-700/60 hover:border-[#007399] transition-all cursor-pointer group flex items-center justify-between gap-2"
              title="Klik untuk menyalin Kode Komponen"
            >
              <div className="min-w-0">
                <span className="font-mono text-rose-400 font-black text-xs block group-hover:text-rose-300">
                  {item.code}
                </span>
                <span className="text-[11px] font-bold text-slate-300 truncate block">
                  {item.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block truncate">
                  {item.file}
                </span>
              </div>
              <button className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-[#007399] transition-all shrink-0">
                {copiedCodeId === item.code ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY 1: PRESENTASI DATA */}
      {activeCategory === 'data-display' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Component Card: StatusBadge */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-UI-03]
                  </span>
                  <span>Lencana Status Semantik (StatusBadge.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Lencana status visual presisi dengan varian warna semantik baku untuk prioritas klinis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('status_badge')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['status_badge'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['status_badge'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.status_badge, 'status_badge')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'status_badge' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'status_badge' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['status_badge'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.status_badge}
              </pre>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge variant="primary" icon={Building2}>Primary (Oceanic Teal #007399)</StatusBadge>
                  <StatusBadge variant="success" icon={CheckCircle2}>Success / Verified (Emerald)</StatusBadge>
                  <StatusBadge variant="danger" icon={AlertTriangle}>Danger / Emergency (Crimson)</StatusBadge>
                  <StatusBadge variant="warning">Warning / Pending (Amber)</StatusBadge>
                  <StatusBadge variant="info">Info / Notice (Sky)</StatusBadge>
                  <StatusBadge variant="neutral">Neutral / Draft</StatusBadge>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-slate-400">Ukuran:</span>
                  <StatusBadge size="sm" variant="primary">Small (9px)</StatusBadge>
                  <StatusBadge size="md" variant="primary">Medium (10px)</StatusBadge>
                  <StatusBadge size="lg" variant="primary">Large (12px)</StatusBadge>
                </div>
              </div>
            )}
          </div>

          {/* Component Card: DataTable & TablePagination */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TableIcon size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-UI-01] & [COMP-UI-02]
                  </span>
                  <span>Data Grid & Pagination (DataTable.jsx & TablePagination.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tabel data grid terstandar dengan perataan No. RM monospaced, row height uniform, dan navigasi halaman lonjong.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('data_table')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['data_table'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['data_table'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.data_table, 'data_table')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'data_table' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'data_table' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['data_table'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.data_table}
              </pre>
            ) : (
              <DataTable 
                columns={sampleTableColumns}
                data={sampleTableData}
                currentPage={currentPage}
                totalPages={10}
                pageSize={10}
                totalItems={100}
                onPageChange={(p) => setCurrentPage(p)}
                onRefresh={() => alert('Refreshing Data Grid...')}
              />
            )}
          </div>
        </div>
      )}

      {/* CATEGORY 2: INTERAKSI & FORMULIR */}
      {activeCategory === 'interaction-forms' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Component Card: AdvancedPatientSearchBar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Search size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-EMR-01]
                  </span>
                  <span>Bilah Pencarian Pasien Resmi (AdvancedPatientSearchBar.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Bilah pencarian lonjong terpadu dengan border-2 Oceanic Teal #007399 dan peluncur modal Command Center.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('patient_search_bar')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['patient_search_bar'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['patient_search_bar'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.patient_search_bar, 'patient_search_bar')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'patient_search_bar' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'patient_search_bar' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['patient_search_bar'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.patient_search_bar}
              </pre>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <AdvancedPatientSearchBar 
                  onSelectPatient={(p) => alert(`Pasien dipilih: ${p.name || p.nama}`)}
                />
              </div>
            )}
          </div>

          {/* Component Card: PillSearchBar [COMP-UI-13] */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Search size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-UI-13]
                  </span>
                  <span>Bilah Pencarian Lonjong Modern (PillSearchBar.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Komponen modular pencarian lonjong presisi sesuai referensi spesifikasi dengan border Oceanic Teal #007399 dan tombol ADVANCED.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('pill_search_bar')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['pill_search_bar'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['pill_search_bar'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.pill_search_bar, 'pill_search_bar')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'pill_search_bar' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'pill_search_bar' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['pill_search_bar'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.pill_search_bar}
              </pre>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Presisi Sesuai Referensi Gambar (Oceanic Teal #007399):</span>
                  <PillSearchBar 
                    placeholder="Cari pasien canggih (Nama, No. RM, NIK, No. Kartu BPJS)..."
                    onAdvancedClick={() => setIsModalOpen(true)}
                    onSearch={(q) => alert(`Memulai pencarian: ${q}`)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Component Card: FilterToolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-UI-05]
                  </span>
                  <span>Bilah Filter & Pencarian Terpadu (FilterToolbar.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Toolbar filter terpadu untuk pencarian teks, dropdown departemen, date picker, dan aksi Tampilkan Data / Reset.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('filter_toolbar')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['filter_toolbar'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['filter_toolbar'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.filter_toolbar, 'filter_toolbar')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'filter_toolbar' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'filter_toolbar' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['filter_toolbar'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.filter_toolbar}
              </pre>
            ) : (
              <FilterToolbar
                searchValue={searchValue}
                onSearchChange={(val) => setSearchValue(val)}
                searchPlaceholder="Cari pasien canggih (Nama, No. RM, NIK)..."
                onSearchSubmit={() => alert(`Mencari data: ${searchValue}`)}
                onReset={() => setSearchValue('')}
              >
                <select 
                  value={selectedDept} 
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1.5 text-xs font-bold"
                >
                  <option value="">Pilih Departemen</option>
                  <option value="IGD">IGD / Emergency</option>
                  <option value="POLI">Poliklinik Rawat Jalan</option>
                  <option value="ICU">ICU / HCU</option>
                </select>

                <input type="date" className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-1 text-xs font-bold" />
              </FilterToolbar>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY 3: NAVIGASI WAYFINDING */}
      {activeCategory === 'wayfinding' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Component Card: SegmentedTabs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layout size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-UI-04]
                  </span>
                  <span>Tabulasi Navigasi Lonjong (SegmentedTabs.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pill tab switcher terstandar untuk berpindah modul/tampilan cepat dengan warna aktif Oceanic Teal #007399.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('segmented_tabs')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['segmented_tabs'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['segmented_tabs'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.segmented_tabs, 'segmented_tabs')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'segmented_tabs' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'segmented_tabs' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['segmented_tabs'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.segmented_tabs}
              </pre>
            ) : (
              <div className="space-y-4">
                <SegmentedTabs 
                  options={[
                    { id: 'all', label: 'SEMUA PASIEN' },
                    { id: 'rj', label: 'RAWAT JALAN (OPD)' },
                    { id: 'ri', label: 'RAWAT INAP (IPD)' }
                  ]}
                  activeTab={segmentedTabState}
                  onChange={(id) => setSegmentedTabState(id)}
                  size="md"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY 4: FEEDBACK & MODAL */}
      {activeCategory === 'feedback-modal' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Component Card: PatientSearchModal Trigger */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <BellRing size={20} className="text-[#007399]" />
                  <span className="font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-black">
                    [COMP-EMR-02]
                  </span>
                  <span>Modal Pasien Resmi Command Center (PatientSearchModal.jsx)</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Modal terpusat resmi untuk pencarian data grid pasien dengan 6 filter atribut dan warna kontras tinggi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleViewMode('patient_search_modal')} 
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {viewModeMap['patient_search_modal'] === 'code' ? <Eye size={14} /> : <Code size={14} />}
                  <span>{viewModeMap['patient_search_modal'] === 'code' ? 'Tampilan Live' : 'Lihat Kode JSX'}</span>
                </button>
                
                <button 
                  onClick={() => copyToClipboard(CODE_SNIPPETS.patient_search_modal, 'patient_search_modal')} 
                  className="px-4 py-1.5 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedCodeId === 'patient_search_modal' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCodeId === 'patient_search_modal' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {viewModeMap['patient_search_modal'] === 'code' ? (
              <pre className="bg-slate-950 text-cyan-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800">
                {CODE_SNIPPETS.patient_search_modal}
              </pre>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#007399]/10 text-[#007399] flex items-center justify-center font-black">
                  <Search size={24} />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">Uji Coba Modal Command Center Outpatient</h4>
                  <p className="text-xs text-slate-500 max-w-md mt-1 font-medium">
                    Klik tombol di bawah ini untuk membuka dialog modal resmi berukuran penuh dengan filter data grid 6 atribut.
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md shadow-[#007399]/25 transition-all active:scale-95 cursor-pointer"
                >
                  Buka Modal Cari Pasien (Command Center)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Interactive Modal Handler */}
      <PatientSearchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(patientId, encounterId) => {
          alert(`Pasien terpilih dari Modal! ID: ${patientId}`);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
