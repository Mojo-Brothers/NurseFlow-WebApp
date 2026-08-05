import React, { useState, useMemo } from 'react';
import { 
  Truck, CheckCircle, AlertCircle, ArrowRight, PackageCheck, 
  FileCheck, ShieldCheck, RefreshCw, ChevronRight, Search, Filter,
  RotateCcw, Edit3, Eye, Calendar, User, FileText, CheckCircle2,
  QrCode, Radio, Cpu, Sparkles, X, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS } from '../../../core/departments.js';
import { useInventoryStore } from '../inventory.store.js';

// MOCK MUTATION RECEIVE DEMO DATA
const INITIAL_RECEIVE_LOGS = [
  {
    id: 'REC-2026-001',
    receiveNo: 'RCV-2026-0801',
    mutationCode: 'MT-2026-0041',
    date: '2026-08-05 09:30',
    fromDept: 'LOGISTIK MEDIK SENTRAL',
    toDept: 'UGD (INSTALASI GAWAT DARURAT)',
    dispatchedBy: 'Ns. Robby Viory, S.Kep',
    receivedBy: 'Ns. Ratna Marlina, S.Kep',
    status: 'IN_TRANSIT', // Belum Diterima
    notes: 'Permintaan Darurat BMHP & Infus Set UGD',
    hasAiAnomaly: true,
    items: [
      { code: 'MED-PCM-500', name: 'Paracetamol 500mg Tablet', batchNo: 'B2026-089', expDate: '2028-12-31', qtyDispatched: 500, qtyReceived: 0, unit: 'Tablet' },
      { code: 'MED-INF-001', name: 'Cairan Infus NaCl 0.9% 500ml', batchNo: 'B2026-044', expDate: '2028-10-15', qtyDispatched: 100, qtyReceived: 0, unit: 'Botol' }
    ]
  },
  {
    id: 'REC-2026-002',
    receiveNo: 'RCV-2026-0802',
    mutationCode: 'MT-2026-0042',
    date: '2026-08-05 10:15',
    fromDept: 'FARMASI UTAMA',
    toDept: 'POLI PENYAKIT DALAM',
    dispatchedBy: 'Apt. Budi Santoso, S.Farm',
    receivedBy: 'Ns. Siti Wijaya, S.Kep',
    status: 'RECEIVED', // Sudah Diterima
    notes: 'Stok Rutin Mingguan Poliklinik',
    hasAiAnomaly: false,
    items: [
      { code: 'MED-AMX-500', name: 'Amoxicillin 500mg Kaplet', batchNo: 'B2026-112', expDate: '2028-06-30', qtyDispatched: 200, qtyReceived: 200, unit: 'Kaplet' },
      { code: 'MED-CFR-500', name: 'Cefadroxil 500mg Kapsul', batchNo: 'B2026-078', expDate: '2028-08-20', qtyDispatched: 150, qtyReceived: 150, unit: 'Kapsul' }
    ]
  },
  {
    id: 'REC-2026-003',
    receiveNo: 'RCV-2026-0803',
    mutationCode: 'MT-2026-0043',
    date: '2026-08-05 11:00',
    fromDept: 'GUDANG LOGISTIK UMUM',
    toDept: 'RAWAT INAP AMARYLIS',
    dispatchedBy: 'Bambang Hidayat, S.E',
    receivedBy: 'Dewi Kusuma, S.Tr.Kes',
    status: 'IN_TRANSIT',
    notes: 'Kertas HVS A4 & Tissue Hand Towel',
    hasAiAnomaly: false,
    items: [
      { code: 'UMUM-KER-201', name: 'Kertas HVS A4 70gr Sinar Dunia (Box 5 Ream)', batchNo: 'UM-2026-88', expDate: '2029-12-31', qtyDispatched: 5, qtyReceived: 0, unit: 'Box' },
      { code: 'UMUM-TIS-211', name: 'Tissue Hand Towel Interfold Livi Fold', batchNo: 'UM-2026-90', expDate: '2029-12-31', qtyDispatched: 20, qtyReceived: 0, unit: 'Pack' }
    ]
  },
  {
    id: 'REC-2026-004',
    receiveNo: 'RCV-2026-0804',
    mutationCode: 'MT-2026-0044',
    date: '2026-08-05 11:45',
    fromDept: 'DEPO FARMASI RAWAT INAP',
    toDept: 'ICU (INTENSIVE CARE UNIT)',
    dispatchedBy: 'Apt. Rina Pratama, S.Farm',
    receivedBy: 'Ns. Joko Sutrisno, M.Kep',
    status: 'RECEIVED',
    notes: 'Mutasi Obat Injeksi High Alert ICU',
    hasAiAnomaly: false,
    items: [
      { code: 'MED-INJ-009', name: 'Furosemide Injection 20mg/2ml Ampul', batchNo: 'B2026-901', expDate: '2027-12-31', qtyDispatched: 50, qtyReceived: 50, unit: 'Ampul' }
    ]
  }
];

export default function ReceiveMutasiTab({ onRefresh }) {
  const { mutations, confirmReceiveMutation } = useInventoryStore();

  // Query Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Applied Filters State (for Tampilkan & Reset)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDept, setAppliedDept] = useState('ALL');
  const [appliedStatus, setAppliedStatus] = useState('ALL');

  // Modals State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRfidSimulating, setIsRfidSimulating] = useState(false);
  const [receiveNoteInput, setReceiveNoteInput] = useState('');

  // Map mutations from store to the format expected by Receive UI
  const receiveLogs = useMemo(() => {
    return mutations.map(m => ({
      id: m.id,
      receiveNo: `RCV-${m.mutationNo.replace('MT-', '')}`,
      mutationCode: m.mutationNo,
      date: m.date,
      fromDept: m.fromDept,
      toDept: m.toDept,
      dispatchedBy: m.createdBy,
      status: m.status,
      notes: m.notes,
      hasAiAnomaly: false,
      items: m.items.map(it => ({
        ...it,
        qtyDispatched: it.qty,
        qtyReceived: m.status === 'RECEIVED' ? it.qty : 0
      }))
    }));
  }, [mutations]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Apply Filter Handler
  const handleApplyFilter = () => {
    setAppliedSearch(searchQuery);
    setAppliedDept(deptFilter);
    setAppliedStatus(statusFilter);
    setCurrentPage(1);
    toast.success('Filter Data Penerimaan Mutasi Diperbarui!');
  };

  // Reset Filter Handler
  const handleResetFilter = () => {
    setSearchQuery('');
    setDeptFilter('ALL');
    setStatusFilter('ALL');
    setAppliedSearch('');
    setAppliedDept('ALL');
    setAppliedStatus('ALL');
    setCurrentPage(1);
    toast.success('Filter Berhasil Di-reset!');
  };

  // Filtered Records Calculation
  const filteredRecords = useMemo(() => {
    return receiveLogs.filter(record => {
      // 1. STATUS FILTER
      if (appliedStatus !== 'ALL' && record.status !== appliedStatus) return false;

      // 2. DEPARTMENT FILTER
      if (appliedDept !== 'ALL' && !record.toDept.toLowerCase().includes(appliedDept.toLowerCase())) return false;

      // 3. SEARCH QUERY (No.Receive or No.Mutasi)
      if (!appliedSearch.trim()) return true;
      const q = appliedSearch.toLowerCase();
      return (
        record.receiveNo.toLowerCase().includes(q) ||
        record.mutationCode.toLowerCase().includes(q) ||
        record.fromDept.toLowerCase().includes(q) ||
        record.toDept.toLowerCase().includes(q) ||
        record.dispatchedBy.toLowerCase().includes(q)
      );
    });
  }, [receiveLogs, appliedStatus, appliedDept, appliedSearch]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Open Process Modal
  const handleOpenProcess = (record) => {
    setSelectedRecord(record);
    setReceiveNoteInput(record.notes || '');
    setIsProcessModalOpen(true);
  };

  // Confirm Receive Handler
  const handleConfirmReceiveSubmit = (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    confirmReceiveMutation(selectedRecord.id, receiveNoteInput || 'Sudah Diterima & Verifikasi Fisik Lengkap');

    setIsProcessModalOpen(false);
  };

  // Simulate RFID Smart Gate Auto-Receive
  const handleTriggerRfidAutoReceive = () => {
    setIsRfidSimulating(true);
    toast.loading('RFID Smart Gate Scanning Sensor Gate Antena...', { id: 'rfid-toast' });
    
    setTimeout(() => {
      const firstInTransit = mutations.find(m => m.status === 'IN_TRANSIT');
      if (firstInTransit) {
        confirmReceiveMutation(firstInTransit.id, 'Auto-Received via RFID Smart Gate Antenna (Hands-Free)');
        toast.success(`RFID Smart Gate Auto-Receive Berhasil! Dokumen ${firstInTransit.mutationNo} Terverifikasi Bebas Sentuh.`, { id: 'rfid-toast', icon: '📡' });
      } else {
        toast.error('Tidak ada dokumen IN_TRANSIT untuk disimulasikan.', { id: 'rfid-toast' });
      }
      setIsRfidSimulating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* HEADER BANNER & FUTURE STATE SMART HARDWARE SHORTCUTS */}
      <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Truck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Penerimaan Mutasi Barang (Mutation Receive)</h2>
            <p className="text-xs text-slate-500 font-medium">
              Verifikasi Kuantitas Fisik Barang Transfer Inter-Depo & Konfirmasi Serah Terima (*Goods Receipt*)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* FUTURE STATE BUTTON 1: RFID SMART GATE */}
          <button
            onClick={handleTriggerRfidAutoReceive}
            disabled={isRfidSimulating}
            className="h-9 px-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            title="Simulasi Auto-Receive Sensor RFID Pintu Depo"
          >
            <Radio size={15} className="animate-pulse" />
            <span>RFID Smart Gate</span>
          </button>

          {/* FUTURE STATE BUTTON 2: MOBILE QR SCAN */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Verifikasi QR Code Scanner Mobile Handheld"
          >
            <QrCode size={15} />
            <span>Mobile QR Scan</span>
          </button>

          {/* REFRESH BUTTON */}
          <button
            onClick={onRefresh || handleApplyFilter}
            className="h-9 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL (No.Receive, No.Mutasi, Dept. Kerja, Status, Tampilkan, Reset) */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          <Filter size={15} />
          <span>Filter & Pencarian Dokumen Penerimaan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs font-semibold">
          {/* SEARCH INPUT (No.Receive / No.Mutasi) */}
          <div className="md:col-span-5 relative">
            <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Cari No.Receive / No.Mutasi / Pengirim:*</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="No.Receive (RCV-...) atau No.Mutasi (MT-...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* DEPT KERJA (DEPARTEMEN PENERIMA) */}
          <div className="md:col-span-3">
            <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Dept. Kerja Penerima:*</label>
            <div className="relative">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white truncate"
              >
                <option value="ALL">Semua Departemen Kerja</option>
                {MASTER_DEPARTMENTS.slice(0, 20).map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* STATUS FILTER */}
          <div className="md:col-span-2">
            <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Status Dokumen:*</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="IN_TRANSIT">Belum Diterima</option>
                <option value="RECEIVED">Sudah Diterima</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* ACTION BUTTONS (TAMPILKAN & RESET) */}
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              onClick={handleApplyFilter}
              className="h-9 flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1"
            >
              <span>Tampilkan</span>
            </button>
            <button
              onClick={handleResetFilter}
              className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center"
              title="Reset Filter"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* RECEIVE MONITORING DASHBOARD (DATA GRID TABLE) */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Monitoring Penerimaan Mutasi</h3>
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-mono text-[10px] font-bold">
              {filteredRecords.length} Dokumen
            </span>
          </div>
        </div>

        {/* Data Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Tanggal & Identitas Dokumen</th>
                <th className="py-2.5 px-3">Asal Mutasi (Pengirim)</th>
                <th className="py-2.5 px-3">Tujuan (Dept. Kerja)</th>
                <th className="py-2.5 px-3">Dikirim Oleh</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Catatan Penerimaan</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    Tidak ada data dokumen penerimaan mutasi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <strong className="block text-slate-900 dark:text-white font-mono text-xs">{rec.receiveNo}</strong>
                          <span className="font-mono text-[10px] text-primary block">Mutasi: {rec.mutationCode}</span>
                        </div>
                        {rec.hasAiAnomaly && (
                          <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded text-[9px] font-bold flex items-center gap-1 border border-purple-500/20" title="AI Anomaly Warning: Lonjakan Mutasi">
                            <Cpu size={10} />
                            <span>AI Alert</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{rec.date}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] block w-fit">
                        {rec.fromDept}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded font-semibold text-[10px] block w-fit">
                        {rec.toDept}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="block font-bold text-xs">{rec.dispatchedBy}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {rec.status === 'RECEIVED' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle size={11} />
                          <span>Sudah diterima</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase border border-amber-500/20 inline-flex items-center gap-1">
                          <Truck size={11} />
                          <span>Belum diterima</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate" title={rec.notes}>
                        {rec.notes || '-'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenProcess(rec)}
                        className={`p-1.5 rounded-lg transition-all ${
                          rec.status === 'IN_TRANSIT'
                            ? 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title={rec.status === 'IN_TRANSIT' ? 'Validasi & Terima Mutasi' : 'Lihat Rincian Mutasi'}
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="text-slate-500">
            Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)} - {Math.min(currentPage * pageSize, filteredRecords.length)} dari {filteredRecords.length} Total Dokumen Mutasi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-bold font-mono text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: PROSES VALIDASI & PENERIMAAN MUTASI */}
      {isProcessModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Validasi & Penerimaan Mutasi Barang</h3>
                <span className="font-mono text-xs text-primary font-bold">{selectedRecord.receiveNo} • No. Mutasi: {selectedRecord.mutationCode}</span>
              </div>
              <button onClick={() => setIsProcessModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* AI ANOMALY ALERT BANNER IF APPLICABLE */}
            {selectedRecord.hasAiAnomaly && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center gap-3 text-xs text-purple-700 dark:text-purple-300">
                <Cpu size={20} className="shrink-0 text-purple-600" />
                <div>
                  <strong className="block font-bold">AI Discrepancy Alert: Lonjakan Mutasi Terdeteksi</strong>
                  <span className="text-[11px] block">Sistem AI mendeteksi kuantitas mutasi Paracetamol (+500) melebihi konsumsi rata-rata bulanan UGD. Mohon pastikan jumlah fisik barang sesuai.</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Asal Mutasi:</span>
                <span className="text-slate-900 dark:text-white font-bold">{selectedRecord.fromDept}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Dikirim oleh: {selectedRecord.dispatchedBy}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Tujuan Mutasi:</span>
                <span className="text-primary font-bold">{selectedRecord.toDept}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tanggal: {selectedRecord.date}</span>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Rincian Fisik Item Mutasi:</span>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                      <th className="py-2 px-3">Kode & Nama Item</th>
                      <th className="py-2 px-3">No. Batch & Exp</th>
                      <th className="py-2 px-3 text-center">Qty Dikirim</th>
                      <th className="py-2 px-3 text-right">Qty Diterima Fisik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedRecord.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <strong className="block text-slate-900 dark:text-white">{it.name}</strong>
                          <span className="font-mono text-[10px] text-primary">{it.code}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px]">
                          <span className="block font-bold">{it.batchNo}</span>
                          <span className="text-slate-400">Exp: {it.expDate}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600">
                          {it.qtyDispatched} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          {selectedRecord.status === 'RECEIVED' ? `${it.qtyDispatched} ${it.unit}` : `${it.qtyDispatched} ${it.unit} (Match)`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleConfirmReceiveSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Catatan Penerimaan / Keterangan Fisik:*</label>
                <textarea
                  rows={2}
                  value={receiveNoteInput}
                  onChange={e => setReceiveNoteInput(e.target.value)}
                  placeholder="Misal: Diterima dalam kondisi lengkap, fisik sesuai..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:font-normal"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProcessModalOpen(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
                {selectedRecord.status === 'IN_TRANSIT' && (
                  <button
                    type="submit"
                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <PackageCheck size={16} />
                    <span>Konfirmasi Terima Mutasi (*Goods Receipt*)</span>
                  </button>
                )}
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: MOBILE QR SCAN VERIFICATION SIMULATION */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mx-auto">
              <QrCode size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Mobile QR Scanner Verification</h3>
              <p className="text-xs text-slate-500 mt-1">Pemindaian QR Code Dokumen Mutasi via Handheld Mobile App</p>
            </div>

            <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
              <QrCode size={90} className="text-slate-800 dark:text-slate-200" />
              <span className="font-mono text-xs font-bold text-primary">Scan QR-RCV-2026-0801</span>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  toast.success('QR Code Terverifikasi! Dokumen RC-2026-001 Diterima via Mobile.');
                  setIsQrModalOpen(false);
                }}
                className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md"
              >
                Simulasi Verifikasi QR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
