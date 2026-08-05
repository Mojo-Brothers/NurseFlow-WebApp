import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, Plus, Search, Filter, CheckCircle2, XCircle, Clock, 
  Send, AlertTriangle, Building, ShieldCheck, ArrowRight, Eye, ChevronRight,
  Printer, RotateCcw, Trash2, Zap, ChevronLeft, ChevronsLeft, ChevronsRight, RefreshCw, X, Sparkles,
  ArrowRightLeft, Calendar, UserCheck, QrCode, Link, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS, getDepartmentWarehouses } from '../../../core/departments.js';

// LIVE DB AUTO-SUGGEST COMBOBOX COMPONENT
function ItemSearchCombobox({ items = [], selectedCode, selectedName, onSelect }) {
  const [query, setQuery] = useState(selectedName || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(selectedName || '');
  }, [selectedName]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 10);
    const q = query.toLowerCase();
    return items.filter(i => 
      i.name?.toLowerCase().includes(q) || 
      i.code?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [items, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Ketik pencarian langsung ke DB (Nama/Kode)..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onSelect({ code: '', name: '', unit: '' });
            }
          }}
          className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSelect({ code: '', name: '', unit: '' });
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[3000] max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Katalog Master DB ({filtered.length})</span>
            <span className="text-primary font-mono text-[9px] font-black">Direct DB Query</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">Barang tidak ditemukan di DB</div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id || item.code}
                onClick={() => {
                  setQuery(item.name);
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="p-2.5 hover:bg-primary/10 cursor-pointer transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{item.name}</div>
                  <div className="font-mono text-[10px] text-primary">{item.code} • Unit: {item.unit || 'PCS'}</div>
                </div>
                {item.stockQty !== undefined && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 rounded">
                    Stok: {item.stockQty}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function MaterialRequestTab({ requests, items, onRefresh }) {
  const [requestList, setRequestList] = useState(requests || []);
  
  // Query Filters & Search State
  const [queryNoRQ, setQueryNoRQ] = useState('');
  const [queryDate, setQueryDate] = useState('');
  const [filterFromDept, setFilterFromDept] = useState('ALL');
  const [filterToDept, setFilterToDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Active Filter Applied State
  const [appliedFilters, setAppliedFilters] = useState({
    noRQ: '',
    date: '',
    fromDept: 'ALL',
    toDept: 'ALL',
    status: 'ALL'
  });

  // Modals & Active Document State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeDocForPrint, setActiveDocForPrint] = useState(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [showApprovalLink, setShowApprovalLink] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // New Request Form State (Macro & Micro Routing + Material Lines)
  const [form, setForm] = useState({
    noRQ: `RQ-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
    status: 'DRAFT',
    createdDate: new Date().toISOString().substring(0,10),
    deliveryDate: new Date(Date.now() + 86400000).toISOString().substring(0,10),
    groupItem: 'MEDIS',
    approvedBy: 'Apt. Rian Hidayat, S.Farm',

    // Macro Routing
    fromDept: 'Departemen Logistik Farmasi',
    toDept: 'Departemen Pelayanan Rawat Inap',

    // Micro Routing
    fromWarehouse: 'Gudang Utama Sentral',
    toWarehouse: 'Depo Rawat Inap Teratai Lt 2',

    generalNotes: '',
    materialLines: [
      { id: 'line-1', code: '', name: '', qty: '', unit: '', notes: '' }
    ]
  });

  // KEYBOARD SHORTCUTS (F1, F4, F6, ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        handleOpenNewForm();
      } else if (e.key === 'F4' && isFormModalOpen) {
        e.preventDefault();
        handleAddMaterialLine();
      } else if (e.key === 'F6' && isFormModalOpen) {
        e.preventDefault();
        handleSaveForm();
      } else if (e.key === 'Escape') {
        setIsFormModalOpen(false);
        setIsPrintModalOpen(false);
        setSelectedDocDetails(null);
        setShowApprovalLink(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormModalOpen, form]);

  const handleOpenNewForm = () => {
    setForm({
      noRQ: `RQ-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
      status: 'DRAFT',
      createdDate: new Date().toISOString().substring(0,10),
      deliveryDate: new Date(Date.now() + 86400000).toISOString().substring(0,10),
      groupItem: 'MEDIS',
      approvedBy: 'Apt. Rian Hidayat, S.Farm',
      fromDept: 'Departemen Logistik Farmasi',
      toDept: 'Departemen Pelayanan Rawat Inap',
      fromWarehouse: 'Gudang Utama Sentral',
      toWarehouse: 'Depo Rawat Inap Teratai Lt 2',
      generalNotes: '',
      materialLines: [
        { id: `line-${Date.now()}-1`, code: '', name: '', qty: '', unit: '', notes: '' }
      ]
    });
    setIsFormModalOpen(true);
  };

  // Filter Handling
  const handleApplyFilter = () => {
    setAppliedFilters({
      noRQ: queryNoRQ,
      date: queryDate,
      fromDept: filterFromDept,
      toDept: filterToDept,
      status: filterStatus
    });
    setCurrentPage(1);
    toast.success('Filter Pencarian Diterapkan!');
  };

  const handleResetFilter = () => {
    setQueryNoRQ('');
    setQueryDate('');
    setFilterFromDept('ALL');
    setFilterToDept('ALL');
    setFilterStatus('ALL');
    setAppliedFilters({
      noRQ: '',
      date: '',
      fromDept: 'ALL',
      toDept: 'ALL',
      status: 'ALL'
    });
    setCurrentPage(1);
    toast.success('Filter Pencarian Direset');
  };

  // Filtered Dataset
  const filteredData = useMemo(() => {
    return requestList.filter(item => {
      if (appliedFilters.noRQ && !item.requestCode?.toLowerCase().includes(appliedFilters.noRQ.toLowerCase())) return false;
      if (appliedFilters.date && !item.requestDate?.includes(appliedFilters.date)) return false;
      if (appliedFilters.fromDept !== 'ALL' && item.fromDept !== appliedFilters.fromDept) return false;
      if (appliedFilters.toDept !== 'ALL' && item.toDept !== appliedFilters.toDept) return false;
      if (appliedFilters.status !== 'ALL' && item.status !== appliedFilters.status) return false;
      return true;
    });
  }, [requestList, appliedFilters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Form Material Lines Manipulation - STARTS WITH EMPTY VALUES!
  const handleAddMaterialLine = () => {
    setForm(prev => ({
      ...prev,
      materialLines: [
        ...prev.materialLines,
        { id: `line-${Date.now()}`, code: '', name: '', qty: '', unit: '', notes: '' }
      ]
    }));
    toast.success('Baris Item Kosong Ditambahkan (F4)');
  };

  const handleRemoveMaterialLine = (lineId) => {
    if (form.materialLines.length <= 1) {
      toast.error('Dokumen permintaan harus memiliki minimal 1 item!');
      return;
    }
    setForm(prev => ({
      ...prev,
      materialLines: prev.materialLines.filter(l => l.id !== lineId)
    }));
  };

  const handleGenerateItems = () => {
    setForm(prev => ({
      ...prev,
      materialLines: [
        { id: 'g1', code: 'BMHP-IVC-20G', name: 'IV Catheter 20G Pink (Terumo)', qty: 100, unit: 'PCS', notes: 'Paket Standar IGD' },
        { id: 'g2', code: 'BMHP-INF-NS5', name: 'Cairan Infus NaCl 0.9% 500ml', qty: 50, unit: 'BOTOL', notes: 'Paket Standar IGD' },
        { id: 'g3', code: 'MED-PCM-500', name: 'Paracetamol 500mg Tablet', qty: 200, unit: 'TABLET', notes: 'Stok Cadangan' },
        { id: 'g4', code: 'BMHP-GLV-STER', name: 'Sarung Tangan Steril Size M', qty: 50, unit: 'PASANG', notes: 'Steril Surgicare' }
      ]
    }));
    toast.success('Paket Barang Standar Ruangan Berhasil Di-generate!', { icon: '✨' });
  };

  const handleSaveForm = (submitStatus = 'TERKIRIM') => {
    if (!form.noRQ.trim()) return toast.error('No. RQ wajib diisi!');

    const validLines = form.materialLines.filter(l => l.name && l.code);
    if (validLines.length === 0) return toast.error('Minimal 1 item barang valid dari DB harus dipilih!');

    const isApproved = submitStatus === 'DISETUJUI';
    const newDoc = {
      id: `req-${Date.now()}`,
      requestCode: form.noRQ,
      requestDate: `${form.createdDate} 10:00`,
      deliveryDate: form.deliveryDate,
      groupItem: form.groupItem,
      fromDept: form.fromDept,
      toDept: form.toDept,
      fromWarehouse: form.fromWarehouse,
      toWarehouse: form.toWarehouse,
      priority: 'NORMAL',
      requestedBy: 'Ns. Ratna M., S.Kep',
      approvedBy: isApproved ? form.approvedBy : (form.approvedBy || '-'),
      approvedTimestamp: isApproved ? new Date().toLocaleString('id-ID') : null,
      status: submitStatus,
      notes: form.generalNotes,
      items: validLines.map(l => ({
        code: l.code,
        name: l.name,
        qtyRequested: Number(l.qty) || 1,
        unit: l.unit || 'PCS',
        lineNotes: l.notes
      }))
    };

    setRequestList(prev => [newDoc, ...prev]);
    toast.success(`Material Request ${newDoc.requestCode} Berhasil Disimpan [Status: ${submitStatus}]!`);
    setIsFormModalOpen(false);
  };

  const handleApproveExisting = (docId) => {
    const timestamp = new Date().toLocaleString('id-ID');
    setRequestList(prev => prev.map(r => r.id === docId ? {
      ...r,
      status: 'DISETUJUI',
      approvedBy: 'Apt. Rian Hidayat, S.Farm',
      approvedTimestamp: timestamp
    } : r));
    toast.success(`Dokumen Disetujui (${timestamp})!`);
  };

  const handleOpenPrint = (docItem) => {
    setActiveDocForPrint(docItem);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* SECTION 1: ELEGANT SEARCH & FILTER CONTROL PANEL */}
      <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Filter size={15} />
            <span>Filter & Pencarian Requisisi Barang</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Search size={14} />
              <span>Tampilkan Data</span>
            </button>
            <button
              onClick={handleResetFilter}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-semibold">
          <div>
            <label className="block mb-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">No. RQ:</label>
            <input
              type="text"
              placeholder="Cari No. RQ..."
              value={queryNoRQ}
              onChange={e => setQueryNoRQ(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 font-mono text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Tanggal Pembuatan:</label>
            <input
              type="date"
              value={queryDate}
              onChange={e => setQueryDate(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Dari Departemen:</label>
            <select
              value={filterFromDept}
              onChange={e => setFilterFromDept(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="ALL">Semua Departemen (104 Unit)</option>
              {MASTER_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Ke Departemen:</label>
            <select
              value={filterToDept}
              onChange={e => setFilterToDept(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="ALL">Semua Tujuan (104 Unit)</option>
              {MASTER_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold">Status RQ:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="TERKIRIM">TERKIRIM (Pending Approval)</option>
              <option value="DISETUJUI">DISETUJUI (Approved)</option>
              <option value="DITOLAK">DITOLAK</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMMAND ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNewForm}
            className="h-10 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            <span>+ Buat RQ (F1)</span>
            <span className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[10px] text-white">F1</span>
          </button>

          <button
            onClick={onRefresh}
            className="h-10 px-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} />
            <span>Segarkan</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total Requisisi: <strong className="text-primary font-mono text-sm">{filteredData.length} Dokumen</strong>
        </div>
      </div>

      {/* SECTION 3: DASHBOARD MONITORING GRID TABLE */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">No. RQ & Tanggal</th>
                <th className="py-3 px-4">Rute Logistik (Dari $\rightarrow$ Ke)</th>
                <th className="py-3 px-4">Group Item</th>
                <th className="py-3 px-4">Detail Item Req</th>
                <th className="py-3 px-4">Status & Approval</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedData.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <button
                      onClick={() => setSelectedDocDetails(doc)}
                      className="font-bold text-primary hover:underline text-xs block"
                    >
                      {doc.requestCode}
                    </button>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{doc.requestDate}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px]">{doc.fromDept || 'Logistik Farmasi'}</span>
                        <ChevronRight size={14} className="text-slate-400" />
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px]">{doc.toDept || 'Rawat Inap'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Gudang: {doc.fromWarehouse || doc.fromDepo} $\rightarrow$ {doc.toWarehouse || doc.toDepo}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
                      {doc.groupItem || 'MEDIS'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {doc.items.map((it, idx) => (
                        <div key={idx} className="text-xs">
                          <strong className="text-slate-900 dark:text-white">{it.name}</strong> ({it.qtyRequested} {it.unit})
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {doc.status === 'DISETUJUI' || doc.status === 'APPROVED' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase border border-emerald-500/20 block w-fit">
                          Disetujui
                        </span>
                      ) : doc.status === 'TERKIRIM' || doc.status === 'PENDING_APPROVAL' ? (
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold uppercase border border-amber-500/20 block w-fit">
                          Terkirim
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase block w-fit">
                          {doc.status}
                        </span>
                      )}
                      
                      {doc.approvedBy && doc.approvedBy !== '-' && (
                        <span className="text-[10px] text-slate-400 block">
                          Oleh: {doc.approvedBy}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {(doc.status === 'TERKIRIM' || doc.status === 'PENDING_APPROVAL') && (
                        <button
                          onClick={() => handleApproveExisting(doc.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm"
                        >
                          Setujui
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenPrint(doc)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all"
                        title="Cetak Dokumen RQ"
                      >
                        <Printer size={12} />
                        <span>Cetak</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 4: PAGINATION CONTROLS */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="text-slate-500">
            Displaying {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} Material Lines
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

      {/* RE-DESIGNED ULTRA-SLEEK FORM INPUT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full max-w-5xl rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Clean Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Form Requisisi Permintaan Barang (Material Request)</h3>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded font-mono text-[10px] font-bold uppercase border border-amber-500/20">
                      {form.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Shortcut: <strong className="text-primary font-mono">F4</strong> (+Tambah Item) • <strong className="text-primary font-mono">F6</strong> (Simpan & Kirim) • <strong className="text-primary font-mono">ESC</strong> (Batal)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body with Clean Spacing */}
            <div className="space-y-6 overflow-y-auto pr-1 text-xs font-semibold flex-1">
              
              {/* SECTION A: PARAMETER & IDENTITAS PERMINTAAN */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  <span>1. Parameter & Identitas Dokumen</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">No. RQ (Auto-Generated):*</label>
                    <input
                      type="text"
                      value={form.noRQ}
                      onChange={e => setForm(prev => ({ ...prev, noRQ: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Tanggal Pembuatan:*</label>
                    <input
                      type="date"
                      value={form.createdDate}
                      onChange={e => setForm(prev => ({ ...prev, createdDate: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Tanggal Pengiriman Expected:*</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold text-emerald-600 outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Group Item:*</label>
                    <select
                      value={form.groupItem}
                      onChange={e => setForm(prev => ({ ...prev, groupItem: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold outline-none focus:border-primary"
                    >
                      <option value="MEDIS">OBAT & MEDIS</option>
                      <option value="BMHP">BMHP & ALKES</option>
                      <option value="REAGEN">REAGEN LABORATORIUM</option>
                      <option value="NON_MEDIS">NON-MEDIS & ALAT KANTOR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: RUTE MUTASI LOGISTIK BERJENJANG (MACRO & MICRO ROUTING) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                  <span>2. Pemetaan Rute Mutasi Logistik Berjenjang</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {/* ASAL */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-600 block tracking-wider">Titik Asal Barang (Dispatched From)</span>
                    <div>
                      <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Dari Departemen:*</label>
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
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold"
                      >
                        {MASTER_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Dari Gudang / Depo:*</label>
                      <select
                        value={form.fromWarehouse}
                        onChange={e => setForm(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold"
                      >
                        {getDepartmentWarehouses(form.fromDept).map((wh, idx) => (
                          <option key={idx} value={wh}>{wh}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* TUJUAN */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">Titik Tujuan Barang (Destination Unit)</span>
                    <div>
                      <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Ke Departemen:*</label>
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
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold"
                      >
                        {MASTER_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Ke Gudang / Depo:*</label>
                      <select
                        value={form.toWarehouse}
                        onChange={e => setForm(prev => ({ ...prev, toWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold"
                      >
                        {getDepartmentWarehouses(form.toDept).map((wh, idx) => (
                          <option key={idx} value={wh}>{wh}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Anotasi / Catatan General Dokumen:</label>
                    <input
                      type="text"
                      placeholder="Masukkan catatan spesifik operasional permintaan..."
                      value={form.generalNotes}
                      onChange={e => setForm(prev => ({ ...prev, generalNotes: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: TABEL RINCIAN BARANG (MATERIAL LINES) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                    <span>3. Tabel Rincian Item (Material Lines)</span>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-mono text-[10px]">
                      {form.materialLines.length} Item
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateItems}
                      className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                    >
                      <Sparkles size={13} />
                      <span>Generate Item</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddMaterialLine}
                      className="h-8 px-3 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                    >
                      <Plus size={13} />
                      <span>Tambah Item (F4)</span>
                    </button>
                  </div>
                </div>

                {/* Data Grid Table for Material Lines */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-visible">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 w-[45%]">Nama Item Barang (Live DB Search)</th>
                        <th className="py-2.5 px-3 w-[15%] text-center">Jumlah</th>
                        <th className="py-2.5 px-3 w-[15%]">Satuan</th>
                        <th className="py-2.5 px-3 w-[20%]">Catatan Line Item</th>
                        <th className="py-2.5 px-3 w-[5%] text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {form.materialLines.map(line => (
                        <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          {/* LIVE AUTO-SUGGEST COMBOBOX SEARCH TO DB */}
                          <td className="p-2">
                            <ItemSearchCombobox
                              items={items}
                              selectedCode={line.code}
                              selectedName={line.name}
                              onSelect={(selItem) => {
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? {
                                    ...l, 
                                    code: selItem.code || '', 
                                    name: selItem.name || '', 
                                    unit: selItem.unit || 'PCS'
                                  } : l)
                                }));
                              }}
                            />
                          </td>

                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              placeholder="0"
                              value={line.qty}
                              onChange={e => {
                                const q = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, qty: q } : l)
                                }));
                              }}
                              className="w-20 h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 font-mono text-center font-bold text-primary outline-none focus:border-primary mx-auto"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={line.unit}
                              onChange={e => {
                                const u = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, unit: u } : l)
                                }));
                              }}
                              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-bold uppercase outline-none focus:border-primary"
                            >
                              <option value="">Pilih Satuan...</option>
                              <option value="TABLET">TABLET</option>
                              <option value="CAPSUL">CAPSUL</option>
                              <option value="VIAL">VIAL</option>
                              <option value="PCS">PCS</option>
                              <option value="BOTOL">BOTOL</option>
                              <option value="PASANG">PASANG</option>
                              <option value="ROLL">ROLL</option>
                            </select>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Catatan item..."
                              value={line.notes}
                              onChange={e => {
                                const n = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, notes: n } : l)
                                }));
                              }}
                              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs outline-none focus:border-primary"
                            />
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterialLine(line.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Baris Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* SECTION D: AKSI OPERASIONAL DOKUMEN FINAL */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="text-slate-500 text-[11px] uppercase font-bold">Disetujui Oleh:</span>
                
                {!showApprovalLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, approvedBy: 'Link / Barcode Akses' }));
                      setShowApprovalLink(true);
                      toast.success('Link Approval & Barcode Berhasil Dibuat!', { icon: '🔗' });
                    }}
                    className="h-9 px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-sm"
                  >
                    <QrCode size={14} />
                    <span>Generate Link Akses / Barcode</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                    <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-1 flex justify-center items-center shadow-sm">
                      <QrCode size={20} className="text-slate-800 dark:text-slate-200" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">Approval Link</span>
                      <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold">ehis.nurseflow.id/auth/{form.noRQ.slice(-6)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toast.success('Link Approval berhasil disalin ke Clipboard!')}
                      className="ml-2 h-7 px-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-1 font-bold shadow-sm"
                      title="Copy Link"
                    >
                      <Copy size={11} />
                      <span className="text-[10px]">Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, approvedBy: 'Apt. Rian Hidayat, S.Farm' }));
                        setShowApprovalLink(false);
                      }}
                      className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-900/30"
                      title="Batalkan Barcode & Kembali ke Teks"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-10 px-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl text-xs transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveForm('DRAFT')}
                  className="h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  Simpan Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveForm('DISETUJUI')}
                  className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  Setujui Langsung
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveForm('TERKIRIM')}
                  className="h-10 px-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                >
                  <Send size={15} />
                  <span>Simpan & Kirim (F6)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT DOKUMEN MODAL (CETAK DOKUMEN FISIK / PDF) */}
      {isPrintModalOpen && activeDocForPrint && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[95vh] space-y-6">
            
            {/* Header Cetakan Document */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight">RUMAH SAKIT NURSEFLOW EHIS 2026</h2>
                <p className="text-xs font-bold text-slate-600">DOKUMEN REQUISISI PERMINTAAN BARANG (MATERIAL REQUEST)</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-black text-blue-700 block">{activeDocForPrint.requestCode}</span>
                <span className="text-xs font-bold text-slate-500">Tgl: {activeDocForPrint.requestDate}</span>
              </div>
            </div>

            {/* Document Parameters Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold border p-3 rounded-xl bg-slate-50 border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-black">Routing Titik Asal:</span>
                <span>Dept: {activeDocForPrint.fromDept}</span><br />
                <span>Gudang: {activeDocForPrint.fromWarehouse || activeDocForPrint.fromDepo}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-black">Routing Titik Tujuan:</span>
                <span>Dept: {activeDocForPrint.toDept}</span><br />
                <span>Gudang: {activeDocForPrint.toWarehouse || activeDocForPrint.toDepo}</span>
              </div>
            </div>

            {/* Material Lines Table */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider mb-2">Rincian Barang Diminta (Material Lines)</h4>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase">
                    <th className="p-2 border-r border-slate-300">No.</th>
                    <th className="p-2 border-r border-slate-300">Kode & Nama Item</th>
                    <th className="p-2 border-r border-slate-300 text-center">Jumlah</th>
                    <th className="p-2 border-r border-slate-300">Satuan</th>
                    <th className="p-2">Catatan Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {activeDocForPrint.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-slate-200 font-mono">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <strong className="block">{it.name}</strong>
                        <span className="font-mono text-[10px] text-slate-500">{it.code}</span>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold">{it.qtyRequested}</td>
                      <td className="p-2 border-r border-slate-200 uppercase">{it.unit}</td>
                      <td className="p-2 opacity-80">{it.lineNotes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs font-bold text-center">
              <div>
                <span className="block opacity-70 mb-12">Pemohon Barang (Ruangan)</span>
                <span className="block font-black underline">{activeDocForPrint.requestedBy}</span>
              </div>
              <div>
                <span className="block opacity-70 mb-12">Disetujui Oleh (Otorisasi Supervisor)</span>
                <span className="block font-black underline">{activeDocForPrint.approvedBy || 'Apt. Rian Hidayat, S.Farm'}</span>
              </div>
            </div>

            {/* Modal Print Action Buttons */}
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintModalOpen(false);
                }}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5"
              >
                <Printer size={15} />
                <span>Cetak Dokumen Physical / PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
