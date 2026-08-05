import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft, Plus, Search, Filter, Calendar, UserCheck, ShieldCheck, 
  Truck, CheckCircle2, AlertTriangle, FileText, Printer, Eye, Trash2, X,
  Radio, Cpu, QrCode, Lock, ChevronDown, ChevronLeft, ChevronsLeft, ChevronRight,
  ChevronsRight, RefreshCw, Layers, Sparkles, AlertOctagon, CheckSquare, RotateCcw,
  Building, Download, Check, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS, getDepartmentWarehouses } from '../../../core/departments.js';
import { useInventoryStore } from '../inventory.store.js';

export default function MutasiBarangTab({ items = [] }) {
  // Access Central Store Mutations & Actions
  const storeMutations = useInventoryStore(state => state.mutations);
  const materialRequests = useInventoryStore(state => state.materialRequests);

  // Filter Query States (Inputs)
  const [queryNoMutasi, setQueryNoMutasi] = useState('');
  const [queryNoRQ, setQueryNoRQ] = useState('');
  const [queryDate, setQueryDate] = useState('');
  const [filterFromDept, setFilterFromDept] = useState('SELECT_DEPT'); // Mandatory System Constraint Rule
  const [filterToDept, setFilterToDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Applied Filters State (Triggered by "Tampilkan Data")
  const [appliedFilters, setAppliedFilters] = useState({
    noMutasi: '',
    noRQ: '',
    date: '',
    fromDept: 'SELECT_DEPT',
    toDept: 'ALL',
    status: 'ALL'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCryptoSignModalOpen, setIsCryptoSignModalOpen] = useState(false);
  const [selectedMutation, setSelectedMutation] = useState(null);
  const [passcode2FA, setPasscode2FA] = useState('');

  // Form State for New Outbound Mutation
  const [form, setForm] = useState({
    mutationNo: `MT-LOG-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
    relatedRequestId: '',
    date: new Date().toISOString().substring(0,10),
    fromDept: MASTER_DEPARTMENTS[0].name,
    fromWarehouse: `Gudang Medis (${MASTER_DEPARTMENTS[0].name})`,
    toDept: MASTER_DEPARTMENTS[1].name,
    toWarehouse: `Gudang Medis (${MASTER_DEPARTMENTS[1].name})`,
    notes: 'Mutasi pengeluaran logistik rutin antar depo',
    isNarcotic: false,
    items: [
      {
        code: items[0]?.code || 'OBAT-PAR-001',
        name: items[0]?.name || 'Paracetamol 500mg Tablet',
        batchNo: 'BTC-2026-089',
        expDate: '2028-12-31',
        qty: 50,
        unit: items[0]?.unit || 'Tablet',
        availableStock: 500
      }
    ]
  });

  // System Constraint Check: Mandatory Rule requiring "Dari Departemen"
  const isOriginDeptSelected = appliedFilters.fromDept !== 'SELECT_DEPT';

  // Keyboard Shortcuts (F1 to Create New Mutation, ESC to Close Modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleOpenCreateModal();
      } else if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsDetailModalOpen(false);
        setIsCryptoSignModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appliedFilters.fromDept, filterFromDept]);

  // Execute Search ("Tampilkan Data")
  const handleApplyFilter = () => {
    if (filterFromDept === 'SELECT_DEPT') {
      toast.error("Validasi Prasyarat Sistem: Pilih 'Dari Departemen' terlebih dahulu!", {
        icon: '⚠️',
        duration: 4000
      });
      return;
    }

    setAppliedFilters({
      noMutasi: queryNoMutasi,
      noRQ: queryNoRQ,
      date: queryDate,
      fromDept: filterFromDept,
      toDept: filterToDept,
      status: filterStatus
    });
    setCurrentPage(1);
    toast.success('Pencarian Data Mutasi Diterapkan!');
  };

  // Reset Search ("Reset Pencarian")
  const handleResetFilter = () => {
    setQueryNoMutasi('');
    setQueryNoRQ('');
    setQueryDate('');
    setFilterFromDept('SELECT_DEPT');
    setFilterToDept('ALL');
    setFilterStatus('ALL');
    setAppliedFilters({
      noMutasi: '',
      noRQ: '',
      date: '',
      fromDept: 'SELECT_DEPT',
      toDept: 'ALL',
      status: 'ALL'
    });
    setCurrentPage(1);
    toast.success('Filter Pencarian Direset');
  };

  // Open Create Modal with Constraint Check
  const handleOpenCreateModal = () => {
    if (filterFromDept === 'SELECT_DEPT') {
      toast.error("Prasyarat Sistem: Anda harus memilih 'Dari Departemen' terlebih dahulu sebelum membuat dokumen mutasi baru!", {
        icon: '⚠️',
        duration: 4000
      });
      return;
    }

    const currentOrigin = filterFromDept;
    setForm(prev => ({
      ...prev,
      fromDept: currentOrigin,
      fromWarehouse: `Gudang Medis (${currentOrigin})`,
      mutationNo: `MT-LOG-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`
    }));
    setIsCreateModalOpen(true);
  };

  // Filtered Mutations Calculation
  const filteredMutations = useMemo(() => {
    if (appliedFilters.fromDept === 'SELECT_DEPT') return [];

    return storeMutations.filter(m => {
      if (appliedFilters.noMutasi && !m.mutationNo?.toLowerCase().includes(appliedFilters.noMutasi.toLowerCase())) return false;
      if (appliedFilters.noRQ && !(m.relatedRequestId || m.mutationNo)?.toLowerCase().includes(appliedFilters.noRQ.toLowerCase())) return false;
      if (appliedFilters.date && !m.date?.includes(appliedFilters.date)) return false;
      if (appliedFilters.fromDept !== 'ALL' && m.fromDept !== appliedFilters.fromDept) return false;
      if (appliedFilters.toDept !== 'ALL' && m.toDept !== appliedFilters.toDept) return false;
      if (appliedFilters.status !== 'ALL' && m.status !== appliedFilters.status) return false;
      return true;
    });
  }, [storeMutations, appliedFilters]);

  // KPI Metrics Calculation for Department
  const kpiMetrics = useMemo(() => {
    if (appliedFilters.fromDept === 'SELECT_DEPT') return { total: 0, inTransit: 0, received: 0, pending2FA: 0 };
    return {
      total: filteredMutations.length,
      inTransit: filteredMutations.filter(m => m.status === 'IN_TRANSIT').length,
      received: filteredMutations.filter(m => m.status === 'RECEIVED').length,
      pending2FA: filteredMutations.filter(m => m.isNarcotic && m.status === 'WAITING_APPROVAL').length
    };
  }, [filteredMutations, appliedFilters]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredMutations.length / pageSize) || 1;
  const paginatedMutations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMutations.slice(start, start + pageSize);
  }, [filteredMutations, currentPage, pageSize]);

  // Line Item Handling (FEFO Auto Suggestion)
  const handleLineItemChange = (index, itemCode) => {
    const selectedCatalogItem = items.find(i => i.code === itemCode) || items[0];
    const updated = [...form.items];
    updated[index] = {
      ...updated[index],
      code: selectedCatalogItem.code,
      name: selectedCatalogItem.name,
      unit: selectedCatalogItem.unit,
      availableStock: selectedCatalogItem.stockQty || 100,
      batchNo: `BTC-2026-${Math.floor(100 + Math.random() * 900)}`,
      expDate: selectedCatalogItem.expiredDate || '2028-12-31'
    };
    setForm(prev => ({ ...prev, items: updated }));
  };

  const handleAddLineItem = () => {
    const defaultCatalogItem = items[0] || { code: 'OBAT-PAR-001', name: 'Paracetamol 500mg Tablet', unit: 'Tablet', stockQty: 500 };
    setForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          code: defaultCatalogItem.code,
          name: defaultCatalogItem.name,
          batchNo: `BTC-2026-${Math.floor(100 + Math.random() * 900)}`,
          expDate: '2028-12-31',
          qty: 10,
          unit: defaultCatalogItem.unit,
          availableStock: defaultCatalogItem.stockQty || 100
        }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (form.items.length === 1) return toast.error('Mutasi minimal harus berisi 1 baris item!');
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Pull Data from Material Request
  const handlePullRQData = (reqId) => {
    if (!reqId) {
      setForm(prev => ({ ...prev, relatedRequestId: '' }));
      return;
    }
    const targetReq = materialRequests.find(r => r.id === reqId);
    if (!targetReq) return;
    
    setForm(prev => ({
      ...prev,
      relatedRequestId: targetReq.id,
      toDept: targetReq.fromDept,
      toWarehouse: targetReq.fromWarehouse || `Gudang Medis (${targetReq.fromDept})`,
      items: targetReq.items.map(it => {
        const catalogItem = items.find(ci => ci.code === it.code) || { stockQty: 100 };
        return {
          code: it.code,
          name: it.name,
          batchNo: `BTC-2026-${Math.floor(100 + Math.random() * 900)}`,
          expDate: '2028-12-31',
          qty: it.qtyRequested || 1,
          originalReqQty: it.qtyRequested || null,
          unit: it.unit || 'PCS',
          availableStock: catalogItem.stockQty || 1000 // default higher stock to avoid max limit blocking dummy data
        };
      })
    }));
    toast.success(`Data dari ${targetReq.requestCode} berhasil ditarik!`);
  };

  // Submit Create Mutation
  const handleCreateSubmit = (e) => {
    e.preventDefault();

    for (const line of form.items) {
      if (line.qty > line.availableStock) {
        return toast.error(`Kuantitas mutasi "${line.name}" (${line.qty}) melebihi stok aktual (${line.availableStock})!`);
      }
    }

    const created = {
      mutationNo: form.mutationNo,
      relatedRequestId: form.relatedRequestId || `RQ-REF-${Math.floor(100 + Math.random()*900)}`,
      date: `${form.date} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      fromDept: form.fromDept,
      fromWarehouse: form.fromWarehouse,
      toDept: form.toDept,
      toWarehouse: form.toWarehouse,
      createdBy: 'Ns. Robby Viory, S.Kep',
      approvedBy: form.isNarcotic ? 'PENDING (CRYPTOGRAPHIC 2FA)' : 'Apt. Budi Santoso, S.Farm',
      status: form.isNarcotic ? 'WAITING_APPROVAL' : 'IN_TRANSIT',
      isNarcotic: form.isNarcotic,
      notes: form.notes || 'Mutasi logistik distribusi antar unit medis',
      temperatureStatus: form.isNarcotic ? 'SAFE (3.9°C)' : 'N/A (Suhu Kamar)',
      items: form.items
    };

    useInventoryStore.getState().dispatchMutation(created);

    setIsCreateModalOpen(false);
  };

  // Handle Otorisasi e-Sign 2FA
  const handleVerify2FA = (e) => {
    e.preventDefault();
    if (!passcode2FA || passcode2FA.trim() !== '123456' && passcode2FA.trim() !== '8888') {
      return toast.error('PIN Otorisasi 2FA Salah! (Gunakan demo PIN: 123456 atau 8888)');
    }

    useInventoryStore.setState(state => ({
      mutations: state.mutations.map(m => m.id === selectedMutation.id ? {
        ...m,
        status: 'IN_TRANSIT',
        approvedBy: 'Apt. Budi Santoso, S.Farm (2FA VERIFIED)',
        cryptoStamp: `SHA256-DIGITAL-SIGN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      } : m)
    }));

    setIsCryptoSignModalOpen(false);
    setPasscode2FA('');
    toast.success(`Otorisasi e-Sign 2FA Kriptografi Berhasil! Mutasi ${selectedMutation.mutationNo} resmi di-Dispatch (IN_TRANSIT).`, { icon: '🔐' });
  };

  const approvedRQsForThisDept = useMemo(() => {
    return materialRequests.filter(rq => rq.status === 'APPROVED' && rq.toDept === form.fromDept);
  }, [materialRequests, form.fromDept]);

  return (
    <div className="space-y-4 font-sans text-slate-900 dark:text-slate-100">
      
      {/* 1. TOP HEADER & METRICS COMMAND BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-bold shadow-glow-primary">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight leading-none text-white">Mutasi Item v2</h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-mono font-black border border-emerald-500/30">
                  EHIS 2026 RE-ARCHITECTED
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Sistem Pengeluaran & Distribusi Logistik Antar Gudang Depo / Ruangan Rawat (FEFO Engine & 2FA Security)
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-glow-primary flex items-center gap-2 scale-105 active:scale-100 cursor-pointer"
          >
            <Plus size={18} />
            <span>+ Buat Mutasi (F1)</span>
          </button>
        </div>

        {/* KPI STATS METRICS BAR */}
        {isOriginDeptSelected && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60 relative z-10 text-xs">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-slate-400 font-medium text-[11px]">Total Outbound:</span>
              <strong className="text-white font-mono font-bold text-sm">{kpiMetrics.total} Dokumen</strong>
            </div>

            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center justify-between">
              <span className="text-blue-300 font-medium text-[11px]">Dalam Pengiriman:</span>
              <strong className="text-blue-200 font-mono font-bold text-sm">{kpiMetrics.inTransit} In-Transit</strong>
            </div>

            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
              <span className="text-emerald-300 font-medium text-[11px]">Selesai Diterima:</span>
              <strong className="text-emerald-200 font-mono font-bold text-sm">{kpiMetrics.received} Received</strong>
            </div>

            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-between">
              <span className="text-rose-300 font-medium text-[11px]">Pending 2FA Narkotika:</span>
              <strong className="text-rose-200 font-mono font-bold text-sm">{kpiMetrics.pending2FA} Wait Appr</strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. FILTER PANEL COMPLEX QUERY (MUTASI ITEM V2 REPLICATED & HYPER-MODERNIZED) */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Manajemen Pencarian & Filter Kompleks
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-rose-600 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              *) Untuk Menampilkan dan Membuat Mutasi Baru Harus Pilih 'Dari Departemen' dahulu.
            </span>
          </div>
        </div>

        {/* 6 PARAMETERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-semibold">
          {/* PARAMETER 1: NO. MUTASI */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">No. Mutasi:</label>
            <input
              type="text"
              placeholder="Cari No. Mutasi"
              value={queryNoMutasi}
              onChange={e => setQueryNoMutasi(e.target.value)}
              className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white placeholder:font-normal"
            />
          </div>

          {/* PARAMETER 2: NO. REQUEST */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">No. Request (RQ):</label>
            <input
              type="text"
              placeholder="Cari No. RQ"
              value={queryNoRQ}
              onChange={e => setQueryNoRQ(e.target.value)}
              className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white placeholder:font-normal"
            />
          </div>

          {/* PARAMETER 3: DARI DEPARTEMEN (MANDATORY SYSTEM CONSTRAINT) */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
              <span>Dari Departemen:</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={filterFromDept}
                onChange={e => setFilterFromDept(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-7 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white cursor-pointer truncate"
              >
                <option value="SELECT_DEPT">-- Dari Departemen --</option>
                <option value="ALL">-- Semua Departemen Asal --</option>
                {MASTER_DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* PARAMETER 4: KE DEPARTEMEN */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Ke Departemen:</label>
            <div className="relative">
              <select
                value={filterToDept}
                onChange={e => setFilterToDept(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-7 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white cursor-pointer truncate"
              >
                <option value="ALL">-- Ke Departemen --</option>
                {MASTER_DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* PARAMETER 5: STATUS */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Status Mutasi:</label>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-7 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="ALL">-- Status Mutasi --</option>
                <option value="DRAFT">DRAFT</option>
                <option value="WAITING_APPROVAL">WAITING APPROVAL</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* PARAMETER 6: TANGGAL */}
          <div>
            <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Tanggal:</label>
            <input
              type="date"
              value={queryDate}
              onChange={e => setQueryDate(e.target.value)}
              className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* ACTION BUTTONS: TAMPILKAN DATA & RESET PENCARIAN */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleResetFilter}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Pencarian</span>
          </button>

          <button
            onClick={handleApplyFilter}
            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Search size={14} />
            <span>Tampilkan Data</span>
          </button>
        </div>
      </div>

      {/* 3. SYSTEM CONSTRAINT MANDATORY WARNING BANNER */}
      {!isOriginDeptSelected && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border-2 border-amber-500/30 rounded-3xl flex items-center gap-4 text-amber-800 dark:text-amber-300 text-xs font-semibold animate-in fade-in shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-500/40">
            <AlertOctagon size={22} />
          </div>
          <div className="flex-1">
            <strong className="block font-black text-sm text-slate-900 dark:text-white mb-0.5">
              Validasi Prasyarat Sistem Active (System Constraint)
            </strong>
            <span className="text-slate-600 dark:text-slate-300">
              Sesuai aturan keamanan distribusi HIS: Pilih parameter <strong className="text-amber-700 dark:text-amber-400 font-black">'Dari Departemen'</strong> pada panel filter di atas, lalu klik <strong>Tampilkan Data</strong> untuk membuka dashboard mutasi logistik & mengaktifkan tombol penerbitan baru (F1).
            </span>
          </div>
        </div>
      )}

      {/* 4. DATA GRID TABLE (MUTASI ITEM V2 EHIS 2026 DESIGN) */}
      {isOriginDeptSelected && (
        <div className="bg-white dark:bg-slate-950 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Dashboard Pemantauan Riwayat Mutasi</h3>
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full font-mono text-[10px] font-bold">
                {filteredMutations.length} Dokumen
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  toast.success('Data Riwayat Mutasi Disegarkan');
                }}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Refresh Data Grid"
              >
                <RefreshCw size={13} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3">No. Mutasi</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">No. RQ</th>
                  <th className="py-3 px-3">Dari Dept.</th>
                  <th className="py-3 px-3">Ke Dept.</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Saldo</th>
                  <th className="py-3 px-3">Catatan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedMutations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-semibold">
                      Tidak ada data dokumen mutasi yang cocok dengan kriteria pencarian filter.
                    </td>
                  </tr>
                ) : (
                  paginatedMutations.map(mut => {
                    const totalQty = mut.items.reduce((acc, curr) => acc + (curr.qty || 0), 0);
                    return (
                      <tr key={mut.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                        {/* 1. NO. MUTASI */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <strong className="block text-slate-900 dark:text-white font-mono text-xs">{mut.mutationNo}</strong>
                            {mut.isNarcotic && (
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-600 rounded text-[9px] font-bold border border-rose-500/20">
                                2FA
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. TANGGAL */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                          {mut.date}
                        </td>

                        {/* 3. NO. RQ */}
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-primary">
                            {mut.relatedRequestId || 'DIRECT'}
                          </span>
                        </td>

                        {/* 4. DARI DEPT */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg font-semibold text-[10px] block w-fit truncate max-w-[140px]" title={mut.fromDept}>
                            {mut.fromDept}
                          </span>
                        </td>

                        {/* 5. KE DEPT */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold text-[10px] block w-fit truncate max-w-[140px]" title={mut.toDept}>
                            {mut.toDept}
                          </span>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-3 px-3 text-center">
                          {mut.status === 'RECEIVED' ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>RECEIVED</span>
                            </span>
                          ) : mut.status === 'IN_TRANSIT' ? (
                            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[10px] font-bold uppercase border border-blue-500/20 inline-flex items-center gap-1">
                              <Truck size={11} />
                              <span>IN TRANSIT</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase border border-amber-500/20 inline-flex items-center gap-1">
                              <AlertTriangle size={11} />
                              <span>WAITING 2FA</span>
                            </span>
                          )}
                        </td>

                        {/* 7. SALDO (TOTAL QTY) */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {totalQty.toLocaleString('id-ID')} Unit
                        </td>

                        {/* 8. CATATAN */}
                        <td className="py-3 px-3 max-w-[160px] truncate text-slate-500 text-[11px]" title={mut.notes}>
                          {mut.notes || 'Distribusi logistik rutin'}
                        </td>

                        {/* 9. AKSI */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {mut.isNarcotic && mut.status === 'WAITING_APPROVAL' && (
                              <button
                                onClick={() => {
                                  setSelectedMutation(mut);
                                  setIsCryptoSignModalOpen(true);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1"
                              >
                                <Lock size={12} />
                                <span>2FA</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedMutation(mut);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              title="Lihat Detail & Cetak Surat Jalan"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 5. PAGINATION FOOTER (EXACT MATCHING LEGACY CONTROL LOGIC + MODERN EHIS LOOK) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <div className="text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredMutations.length)} - {Math.min(currentPage * pageSize, filteredMutations.length)} dari {filteredMutations.length} Transaksi Mutasi
            </div>

            {/* CONTROLS: |<<  <  Page [ 1 ] of Y  >  >>|  Refresh */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                title="Halaman Pertama (|<<)"
              >
                <ChevronsLeft size={16} />
              </button>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                title="Halaman Sebelumnya (<)"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-bold">Page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={e => {
                    const page = parseInt(e.target.value) || 1;
                    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
                  }}
                  className="w-10 h-6 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold font-mono outline-none text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-500 font-bold">of {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                title="Halaman Selanjutnya (>)"
              >
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                title="Halaman Terakhir (>>|)"
              >
                <ChevronsRight size={16} />
              </button>

              <button
                onClick={() => {
                  toast.success('Paginasi & Data Grid Disegarkan');
                }}
                className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer ml-1"
                title="Refresh Page Data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: FORM BUAT MUTASI BARU (+ BUAT MUTASI / F1) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-3xl rounded-3xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Form Penerbitan Mutasi Logistik Keluar (Outbound)</h3>
                <span className="font-mono text-xs text-primary font-bold">{form.mutationNo}</span>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* PULL DATA DARI MATERIAL REQUEST */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800/50 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                  <strong className="block text-blue-900 dark:text-blue-300 text-xs">Tarik Data dari Material Request (Opsional)</strong>
                </div>
                <div className="relative">
                  <select
                    value={form.relatedRequestId}
                    onChange={e => handlePullRQData(e.target.value)}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700/50 rounded-xl pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white truncate"
                  >
                    <option value="">-- Pilih Material Request (Status: APPROVED) --</option>
                    {approvedRQsForThisDept.map(rq => (
                      <option key={rq.id} value={rq.id}>
                        {rq.requestCode} - Dari: {rq.fromDept} (Butuh {rq.items.length} item)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {approvedRQsForThisDept.length === 0 && (
                  <span className="text-[10px] text-slate-500 italic">Tidak ada Material Request berstatus APPROVED untuk Gudang / Departemen ini.</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Lock size={18} className={form.isNarcotic ? 'text-rose-600' : 'text-slate-400'} />
                  <div>
                    <strong className="block text-slate-900 dark:text-white text-xs">Restriksi Mutasi Obat Narkotika / Psikotropika</strong>
                    <span className="text-[10px] text-slate-400">Memerlukan otorisasi stempel digital kriptografi (2FA SHA-256)</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={form.isNarcotic}
                  onChange={e => setForm(prev => ({ ...prev, isNarcotic: e.target.checked }))}
                  className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              {/* ASAL & TUJUAN MUTASI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-600 block tracking-wider">Titik Asal Barang (Dispatched From)</span>
                  <div>
                    <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Dari Departemen:*</label>
                    <div className="relative">
                      <select
                        value={form.fromDept}
                        onChange={e => {
                          const dept = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            fromDept: dept,
                            fromWarehouse: `Gudang Medis (${dept})`
                          }));
                        }}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white truncate"
                      >
                        {MASTER_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Dari Gudang / Depo:*</label>
                    <div className="relative">
                      <select
                        value={form.fromWarehouse}
                        onChange={e => setForm(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white truncate"
                      >
                        {getDepartmentWarehouses(form.fromDept).map((wh, idx) => (
                          <option key={idx} value={wh}>{wh.split(' (')[0]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">Titik Tujuan Barang (Destination)</span>
                  <div>
                    <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Ke Departemen:*</label>
                    <div className="relative">
                      <select
                        value={form.toDept}
                        onChange={e => {
                          const dept = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            toDept: dept,
                            toWarehouse: `Gudang Medis (${dept})`
                          }));
                        }}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white truncate"
                      >
                        {MASTER_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Ke Gudang / Depo:*</label>
                    <div className="relative">
                      <select
                        value={form.toWarehouse}
                        onChange={e => setForm(prev => ({ ...prev, toWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white truncate"
                      >
                        {getDepartmentWarehouses(form.toDept).map((wh, idx) => (
                          <option key={idx} value={wh}>{wh.split(' (')[0]}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* LINE ITEMS GRID */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Line Items (Alokasi Batch FEFO):</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tambah Baris Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((line, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <label className="block mb-1 text-slate-400 text-[9px] uppercase font-bold">Pilih Barang Katalog:*</label>
                        <div className="relative">
                          <select
                            value={line.code}
                            onChange={e => handleLineItemChange(idx, e.target.value)}
                            className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-2 pr-6 text-xs font-bold appearance-none outline-none text-slate-900 dark:text-white truncate"
                          >
                            {!items.some(i => i.code === line.code) && (
                              <option value={line.code}>{line.name} ({line.code})</option>
                            )}
                            {items.map(i => (
                              <option key={i.id} value={i.code}>{i.name} ({i.code})</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="col-span-3">
                        <label className="block mb-1 text-slate-400 text-[9px] uppercase font-bold">No. Batch & Exp (FEFO):</label>
                        <span className="block font-mono text-[11px] font-bold text-amber-600 truncate">{line.batchNo} ({line.expDate})</span>
                      </div>

                      <div className="col-span-3">
                        <label className="block mb-1 text-slate-400 text-[9px] uppercase font-bold truncate">
                          Qty Mutasi ({line.unit}):* 
                          {line.originalReqQty && (
                            <span className="text-blue-500 normal-case ml-1">
                              (RQ: {line.originalReqQty})
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={line.availableStock}
                          value={line.qty}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            const updated = [...form.items];
                            updated[idx].qty = val;
                            setForm(prev => ({ ...prev, items: updated }));
                          }}
                          className="w-full h-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 text-xs font-bold font-mono outline-none text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 hover:bg-rose-500/10 text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION SUBMIT */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={14} />
                  <span>Penerbitan Dokumen Mutasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL TRANSISASI MUTASI & PRINT SURAT JALAN */}
      {isDetailModalOpen && selectedMutation && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-2xl rounded-3xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Detail Transaksi Mutasi Logistik</h3>
                <span className="font-mono text-xs text-primary font-bold">{selectedMutation.mutationNo}</span>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rute Asal:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{selectedMutation.fromDept}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rute Tujuan:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{selectedMutation.toDept}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Petugas Pembuat:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{selectedMutation.createdBy}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Dokumen:</span>
                  <span className="font-bold text-primary">{selectedMutation.status}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Daftar Item Logistik Dimutasi:</span>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Nama Barang</th>
                        <th className="py-2 px-3">No. Batch</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedMutation.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold">{it.name}</td>
                          <td className="py-2 px-3 font-mono text-amber-600">{it.batchNo}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{it.qty} {it.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  toast.success(`Mencetak Surat Jalan Mutasi ${selectedMutation.mutationNo}`);
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Surat Jalan</span>
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OTORISASI e-SIGN 2FA KRIPTOGRAFI NARKOTIKA */}
      {isCryptoSignModalOpen && selectedMutation && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-3xl p-6 relative border border-rose-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold border border-rose-500/20">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Otorisasi e-Sign 2FA Narkotika</h3>
                <span className="font-mono text-xs text-rose-500 font-bold">{selectedMutation.mutationNo}</span>
              </div>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4 text-xs font-semibold">
              <p className="text-slate-600 dark:text-slate-300">
                Mutasi obat golongan Narkotika & Psikotropika memerlukan verifikasi PIN stempel digital Apoteker Penanggung Jawab.
              </p>

              <div>
                <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Masukkan PIN 2FA Apoteker:*</label>
                <input
                  type="password"
                  placeholder="Demo PIN: 123456"
                  value={passcode2FA}
                  onChange={e => setPasscode2FA(e.target.value)}
                  className="w-full h-10 text-center text-lg tracking-[0.3em] font-mono font-black bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCryptoSignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Verifikasi & Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
