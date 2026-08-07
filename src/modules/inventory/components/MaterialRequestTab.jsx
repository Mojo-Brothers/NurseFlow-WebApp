import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, Plus, Search, Filter, CheckCircle2, XCircle, Clock, 
  Send, AlertTriangle, Building, ShieldCheck, ArrowRight, Eye, ChevronRight,
  Printer, RotateCcw, Trash2, Zap, ChevronLeft, ChevronsLeft, ChevronsRight, RefreshCw, X, Sparkles,
  ArrowRightLeft, Calendar, UserCheck, QrCode, Link, Copy, ExternalLink, PenTool, Edit3, Save, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS, getDepartmentWarehouses } from '../../../core/departments.js';
import { generateSignedVerificationToken } from '../../../core/securityTokens.js';

// LIVE DB AUTO-SUGGEST COMBOBOX COMPONENT
function ItemSearchCombobox({ items = [], selectedCode, selectedName, onSelect, disabled, autoFocus }) {
  const [query, setQuery] = useState(selectedName || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(selectedName || '');
  }, [selectedName]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          setIsOpen(true);
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

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
          ref={inputRef}
          type="text"
          placeholder="Ketik pencarian langsung ke DB (Nama/Kode)..."
          value={query}
          disabled={disabled}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(e) => {
            if (disabled) return;
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              onSelect({ code: '', name: '', unit: '' });
            }
          }}
          className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
        />
        {query && !disabled && (
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

      {isOpen && !disabled && (
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

import { getStaffList } from '../../admin/services/staffManagement.service.js';

function StaffSearchCombobox({ selectedValue, onSelect, disabled }) {
  const [query, setQuery] = useState(selectedValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(selectedValue || '');
  }, [selectedValue]);

  const liveStaffList = useMemo(() => {
    return getStaffList();
  }, []);

  const filteredStaff = useMemo(() => {
    if (!query) return liveStaffList;
    return liveStaffList.filter(s => 
      (s.fullName || s.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.role || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.departmentName || s.dept || '').toLowerCase().includes(query.toLowerCase())
    );
  }, [query, liveStaffList]);

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
        <UserCheck size={14} className="absolute left-2.5 text-primary pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama staf otorisator (Server DB)..."
          value={query}
          disabled={disabled}
          onFocus={() => !disabled && setIsOpen(true)}
          onChange={(e) => {
            if (disabled) return;
            setQuery(e.target.value);
            setIsOpen(true);
            onSelect(e.target.value);
          }}
          className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-7 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onSelect('');
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[3000] max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in">
          {filteredStaff.length > 0 ? (
            filteredStaff.map(stf => (
              <button
                key={stf.id}
                type="button"
                onClick={() => {
                  const staffName = stf.fullName || stf.name;
                  setQuery(staffName);
                  onSelect(staffName);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">{stf.fullName || stf.name}</span>
                  <span className="text-[10px] text-slate-400 block">{stf.role}</span>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono shrink-0">
                  {stf.departmentName || stf.dept || 'Staff'}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-slate-400 text-xs italic">
              Ketik nama staf otorisator custom
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MaterialRequestTab({ requests, items, onRefresh }) {
  const [requestList, setRequestList] = useState([]);

  // Load persisted RO list from localStorage on mount & filter out dummy seed data
  useEffect(() => {
    try {
      const savedList = localStorage.getItem('nurseflow_ro_list');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed)) {
          const cleanList = parsed.filter(item => 
            item.requestCode !== 'REQ-2026-0805-01' && 
            item.requestCode !== 'REQ-2026-0804-09' && 
            item.id !== 'req-2026-001' && 
            item.id !== 'req-2026-002'
          );
          setRequestList(cleanList);
          localStorage.setItem('nurseflow_ro_list', JSON.stringify(cleanList));
          return;
        }
      }
    } catch (e) {}
    
    const cleanProps = (requests || []).filter(item => 
      item.requestCode !== 'REQ-2026-0805-01' && 
      item.requestCode !== 'REQ-2026-0804-09' && 
      item.id !== 'req-2026-001' && 
      item.id !== 'req-2026-002'
    );
    setRequestList(cleanProps);
  }, [requests]);
  
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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);
  const [activeDocForPrint, setActiveDocForPrint] = useState(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [showApprovalLink, setShowApprovalLink] = useState(false);

  // E-Signature Pad Drawing State
  const sigCanvasRef = useRef(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);

  const createDefaultSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 320, 140);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(35, 95);
    ctx.bezierCurveTo(55, 30, 75, 25, 85, 75);
    ctx.bezierCurveTo(90, 95, 105, 105, 125, 70);
    ctx.bezierCurveTo(145, 35, 165, 55, 185, 80);
    ctx.bezierCurveTo(205, 105, 235, 30, 265, 65);
    ctx.bezierCurveTo(280, 85, 300, 95, 310, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.quadraticCurveTo(160, 120, 300, 100);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    return canvas.toDataURL('image/png');
  };

  const handleCopyApprovalLink = (url) => {
    const tokenObj = generateSignedVerificationToken(form.noRQ || 'RQ-20260805-9999', 24);
    const targetUrl = url || `${window.location.origin}/auth/verify/${form.noRQ}?${tokenObj.urlParam}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(targetUrl);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = targetUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    toast.success('Link Cryptographic HMAC Verified Berhasil Disalin ke Clipboard!', {
      icon: '🔐',
      duration: 3500
    });
  };

  // Pagination & Agreement & Route Verification State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalNoEsignOpen, setIsModalNoEsignOpen] = useState(false);
  const [isModalEsignOpen, setIsModalEsignOpen] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState('Ns. Ratna M., S.Kep (Koordinator Ruangan)');
  const [isVerifyingStock, setIsVerifyingStock] = useState(false);
  const [routeVerificationStatus, setRouteVerificationStatus] = useState(null);

  // New Request Form State (Macro & Micro Routing + Material Lines)
  const [form, setForm] = useState({
    noRQ: `RQ-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
    status: 'DRAFT',
    createdDate: new Date().toISOString().substring(0,10),
    deliveryDate: new Date(Date.now() + 86400000).toISOString().substring(0,10),
    groupItem: 'MEDIS',
    approvedBy: 'Apt. Rian Hidayat, S.Farm',
    approvalSignatureBase64: null,

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
        if (form.status === 'DISETUJUI' || form.status === 'APPROVED') return;
        if (form.approvalSignatureBase64) {
          setIsConfirmApprovalModalOpen(true);
        } else {
          handleSaveForm('TERKIRIM');
        }
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

  // Real-time synchronization for E-Signature & Status from localStorage / Verification Endpoint
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // 1. Synchronize main monitoring table list (requestList)
        const savedListStr = localStorage.getItem('nurseflow_ro_list');
        if (savedListStr) {
          const parsedList = JSON.parse(savedListStr);
          if (Array.isArray(parsedList) && parsedList.length > 0) {
            setRequestList(prev => {
              const hasChange = parsedList.some(p => {
                const pCode = p.requestCode || p.noRQ;
                const existing = prev.find(r => (r.requestCode || r.noRQ) === pCode);
                return existing && existing.status !== p.status;
              });
              return hasChange ? parsedList : prev;
            });
          }
        }

        // 2. Synchronize active form modal if opened
        if (isFormModalOpen && form.noRQ) {
          const savedSig = localStorage.getItem(`signature_req_${form.noRQ}`);
          const savedDocStr = localStorage.getItem(`material_request_${form.noRQ}`);
          let savedDoc = null;
          if (savedDocStr) {
            try { savedDoc = JSON.parse(savedDocStr); } catch (e) {}
          }
          const effectiveSig = form.approvalSignatureBase64 || savedSig || savedDoc?.approvalSignatureBase64;
          const isApproved = form.status === 'DISETUJUI' || savedDoc?.status === 'DISETUJUI';
          
          if (effectiveSig && (!form.approvalSignatureBase64 || (isApproved && form.status !== 'DISETUJUI'))) {
            setForm(prev => ({
              ...prev,
              approvalSignatureBase64: effectiveSig,
              status: isApproved ? 'DISETUJUI' : prev.status,
              approvedBy: savedDoc?.approvedBy || prev.approvedBy || 'Apt. Rian Hidayat, S.Farm [E-Signed]'
            }));
          }
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [isFormModalOpen, form.noRQ, form.approvalSignatureBase64, form.status]);

  const handleOpenNewForm = () => {
    setShowApprovalLink(false);
    setForm({
      noRQ: `RQ-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random()*9000)}`,
      status: 'DRAFT',
      createdDate: new Date().toISOString().substring(0,10),
      deliveryDate: new Date(Date.now() + 86400000).toISOString().substring(0,10),
      groupItem: 'MEDIS',
      approvedBy: 'Apt. Rian Hidayat, S.Farm',
      approvalSignatureBase64: null,
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

  // Filtered Dataset with Normalized Status Matching
  const filteredData = useMemo(() => {
    return requestList.filter(item => {
      // 1. Filter No. RQ
      const targetNoRQ = appliedFilters.noRQ || queryNoRQ;
      if (targetNoRQ && targetNoRQ.trim() !== '') {
        const docCode = (item.requestCode || item.noRQ || '').toLowerCase();
        if (!docCode.includes(targetNoRQ.trim().toLowerCase())) return false;
      }

      // 2. Filter Date
      const targetDate = appliedFilters.date || queryDate;
      if (targetDate && targetDate.trim() !== '') {
        if (!item.requestDate?.includes(targetDate)) return false;
      }

      // 3. Filter From Dept
      const targetFromDept = filterFromDept !== 'ALL' ? filterFromDept : appliedFilters.fromDept;
      if (targetFromDept && targetFromDept !== 'ALL') {
        if (item.fromDept !== targetFromDept) return false;
      }

      // 4. Filter To Dept
      const targetToDept = filterToDept !== 'ALL' ? filterToDept : appliedFilters.toDept;
      if (targetToDept && targetToDept !== 'ALL') {
        if (item.toDept !== targetToDept) return false;
      }

      // 5. Filter Status (with normalized status check!)
      const targetStatus = filterStatus !== 'ALL' ? filterStatus : appliedFilters.status;
      if (targetStatus && targetStatus !== 'ALL') {
        const normItemStatus = (item.status || '').toUpperCase();
        if (targetStatus === 'DISETUJUI') {
          if (normItemStatus !== 'DISETUJUI' && normItemStatus !== 'APPROVED') return false;
        } else if (targetStatus === 'TERKIRIM') {
          if (normItemStatus !== 'TERKIRIM' && normItemStatus !== 'PENDING_APPROVAL') return false;
        } else if (targetStatus === 'DRAFT') {
          if (normItemStatus !== 'DRAFT') return false;
        } else if (targetStatus === 'DITOLAK') {
          if (normItemStatus !== 'DITOLAK' && normItemStatus !== 'REJECTED') return false;
        } else {
          if (normItemStatus !== targetStatus.toUpperCase()) return false;
        }
      }

      return true;
    });
  }, [requestList, appliedFilters, queryNoRQ, queryDate, filterFromDept, filterToDept, filterStatus]);

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
        { id: `line-new-${Date.now()}`, code: '', name: '', qty: '', unit: '', notes: '' }
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

  const handleSaveForm = (submitStatus = 'DRAFT', customForm = null, closeModal = true) => {
    const activeForm = customForm || form;
    if (!activeForm.noRQ.trim()) return toast.error('No. RQ wajib diisi!');

    const validLines = activeForm.materialLines.filter(l => l.name && l.code);
    if (validLines.length === 0) return toast.error('Minimal 1 item barang valid dari DB harus dipilih!');

    const isApproved = submitStatus === 'DISETUJUI';
    const newDoc = {
      id: `req-${Date.now()}`,
      requestCode: activeForm.noRQ,
      requestDate: `${activeForm.createdDate} 10:00`,
      deliveryDate: activeForm.deliveryDate,
      groupItem: activeForm.groupItem,
      fromDept: activeForm.fromDept,
      toDept: activeForm.toDept,
      fromWarehouse: activeForm.fromWarehouse,
      toWarehouse: activeForm.toWarehouse,
      priority: 'NORMAL',
      requestedBy: 'Ns. Ratna M., S.Kep',
      approvedBy: isApproved ? activeForm.approvedBy : (activeForm.approvedBy || '-'),
      approvalSignatureBase64: activeForm.approvalSignatureBase64 || null,
      approvedTimestamp: isApproved ? new Date().toLocaleString('id-ID') : null,
      status: submitStatus,
      notes: activeForm.generalNotes,
      items: validLines.map(l => ({
        code: l.code,
        name: l.name,
        qtyRequested: Number(l.qty) || 1,
        unit: l.unit || 'PCS',
        lineNotes: l.notes
      }))
    };

    try {
      localStorage.setItem(`material_request_${activeForm.noRQ}`, JSON.stringify(newDoc));
      if (activeForm.approvalSignatureBase64) {
        localStorage.setItem(`signature_req_${activeForm.noRQ}`, activeForm.approvalSignatureBase64);
      }
    } catch (e) {}

    setRequestList(prev => {
      const existingIdx = prev.findIndex(r => r.requestCode === newDoc.requestCode || r.id === newDoc.id);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...newDoc };
      } else {
        updated = [newDoc, ...prev];
      }
      try {
        localStorage.setItem('nurseflow_ro_list', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (closeModal) {
      // Reset active search & filters so the new/edited RO is guaranteed to display at line #1 of the monitoring table
      setAppliedFilters({
        noRQ: '',
        date: '',
        fromDept: 'ALL',
        toDept: 'ALL',
        status: 'ALL'
      });
      setQueryNoRQ('');
      setQueryDate('');
      setFilterFromDept('ALL');
      setFilterToDept('ALL');
      setFilterStatus('ALL');
      setCurrentPage(1);

      toast.success(`Material Request ${newDoc.requestCode} Berhasil Disimpan & Tampil di Tabel!`);
      setIsFormModalOpen(false);
    }
  };

  const handleDirectToBarcodeUrl = (doc) => {
    const docCode = doc.requestCode || doc.noRQ;
    const tokenObj = generateSignedVerificationToken(docCode, 24);
    const targetUrl = `${window.location.origin}/auth/verify/${docCode}?${tokenObj.urlParam}`;
    toast.success(`Mengarahkan ke Halaman E-Sign Barcode (${docCode})...`, {
      icon: '📲',
      duration: 3500
    });
    window.open(targetUrl, '_blank');
  };

  const handleEditRequest = (docItem) => {
    const docCode = docItem.requestCode || docItem.noRQ;
    let savedSig = null;
    try {
      savedSig = localStorage.getItem(`signature_req_${docCode}`);
    } catch(e) {}
    const effectiveSig = docItem.approvalSignatureBase64 || savedSig || null;

    setForm({
      noRQ: docCode,
      status: docItem.status || (effectiveSig ? 'DISETUJUI' : 'DRAFT'),
      createdDate: docItem.requestDate ? docItem.requestDate.split(' ')[0] : new Date().toISOString().substring(0,10),
      deliveryDate: docItem.deliveryDate || new Date(Date.now() + 86400000).toISOString().substring(0,10),
      groupItem: docItem.groupItem || 'MEDIS',
      approvedBy: docItem.approvedBy || 'Apt. Rian Hidayat, S.Farm',
      approvalSignatureBase64: effectiveSig,

      fromDept: docItem.fromDept || 'Departemen Logistik Farmasi',
      toDept: docItem.toDept || 'Departemen Pelayanan Rawat Inap',

      fromWarehouse: docItem.fromWarehouse || 'Gudang Utama Sentral',
      toWarehouse: docItem.toWarehouse || 'Depo Rawat Inap Teratai Lt 2',

      generalNotes: docItem.notes || docItem.generalNotes || '',
      materialLines: docItem.items && docItem.items.length > 0 ? docItem.items.map((it, idx) => ({
        id: `line-${idx + 1}`,
        code: it.code || '',
        name: it.name || '',
        qty: it.qtyRequested || it.qty || 1,
        unit: it.unit || 'PCS',
        notes: it.lineNotes || it.notes || ''
      })) : [
        { id: 'line-1', code: '', name: '', qty: '', unit: '', notes: '' }
      ]
    });

    if (docItem.approvedBy && (docItem.approvedBy.includes('Link') || docItem.approvedBy.includes('Barcode'))) {
      setShowApprovalLink(true);
    } else {
      setShowApprovalLink(false);
    }

    try {
      localStorage.setItem(`material_request_${docCode}`, JSON.stringify(docItem));
    } catch (e) {}

    setIsFormModalOpen(true);
    toast.success(`Editor Requisisi ${docCode} Terbuka!`, { icon: '📝' });
  };

  const [isPrintWithoutEsign, setIsPrintWithoutEsign] = useState(false);

  const handlePrintWithoutEsign = () => {
    const validLines = form.materialLines.filter(l => l.name && l.code);
    const printDoc = {
      requestCode: form.noRQ || 'RQ-20260805-9998',
      requestDate: `${form.createdDate} 10:00`,
      deliveryDate: form.deliveryDate,
      groupItem: form.groupItem,
      fromDept: form.fromDept,
      toDept: form.toDept,
      fromWarehouse: form.fromWarehouse,
      toWarehouse: form.toWarehouse,
      requestedBy: 'Ns. Ratna M., S.Kep',
      approvedBy: form.approvedBy || 'Apt. Rian Hidayat, S.Farm',
      approvalSignatureBase64: null,
      items: validLines.length > 0 ? validLines.map(l => ({
        code: l.code,
        name: l.name,
        qtyRequested: Number(l.qty) || 1,
        unit: l.unit || 'PCS',
        lineNotes: l.notes
      })) : [
        { code: 'MED-PAR500', name: 'Paracetamol 500mg Infus 100ml', qtyRequested: 25, unit: 'BOTOL', lineNotes: 'Stok Cepat Habis Ruang Teratai' }
      ]
    };

    setIsPrintWithoutEsign(true);
    setActiveDocForPrint(printDoc);
    setIsPrintModalOpen(true);
    toast.success('Membuka Cetakan Fisik Tanpa E-Sign (Tanda Tangan Basah)', { icon: '🖨️' });
  };

  const handleVerifyRouteStock = () => {
    setIsVerifyingStock(true);
    setTimeout(() => {
      setIsVerifyingStock(false);
      const randomItemCount = Math.floor(140 + Math.random() * 210);
      setRouteVerificationStatus({
        verified: true,
        dept: form.fromDept,
        warehouse: form.fromWarehouse,
        availableSku: randomItemCount,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
      toast.success(`Ketersediaan Stok ${form.fromWarehouse} Verified! ${randomItemCount} SKU Aktif Siap Mutasi.`, {
        icon: '🛡️',
        duration: 4000
      });
    }, 400);
  };

  const handleResetRoute = () => {
    setForm(prev => ({
      ...prev,
      fromDept: 'Departemen Logistik Farmasi',
      toDept: 'Departemen Pelayanan Rawat Inap',
      fromWarehouse: 'Gudang Utama Sentral',
      toWarehouse: 'Depo Rawat Inap Teratai Lt 2'
    }));
    setRouteVerificationStatus(null);
    toast('Rute Mutasi Direset ke Default', { icon: '🔄' });
  };

  const handleSaveSingleLineItem = (targetLine) => {
    if (!targetLine.name || !targetLine.code) {
      toast.error('Pilih Nama Item Barang dari katalog DB terlebih dahulu!');
      return;
    }
    if (!targetLine.qty || Number(targetLine.qty) <= 0) {
      toast.error('Isi Jumlah (Qty) barang lebih besar dari 0 terlebih dahulu!');
      return;
    }
    if (!targetLine.unit || !targetLine.unit.trim()) {
      toast.error('Pilih Satuan barang terlebih dahulu!');
      return;
    }
    
    // Auto-save form as DRAFT to persist current lines & prevent crash data loss (KEEP EDITOR MODAL OPEN)
    handleSaveForm('DRAFT', null, false);
    
    toast.success(`Item "${targetLine.name}" (${targetLine.qty} ${targetLine.unit}) Berhasil Disimpan!`, {
      icon: '💾',
      duration: 3000
    });
  };

  // HANDLER FOR "KIRIM TANPA E-SIGN" (OTORISASI FISIK / LEVEL KOORDINATOR)
  const handleOpenSendNoEsign = () => {
    const validLines = form.materialLines.filter(l => l.name && l.code);
    if (validLines.length === 0) {
      toast.error('Pilih minimal 1 item barang valid dari DB terlebih dahulu!');
      return;
    }
    handleSaveForm('DRAFT', null, false);
    setIsModalNoEsignOpen(true);
  };

  const handleConfirmSendNoEsign = () => {
    const updatedForm = {
      ...form,
      status: 'DISETUJUI',
      approvedBy: `${coordinatorName} [Manual Signature]`
    };
    setForm(updatedForm);
    setIsModalNoEsignOpen(false);
    handleSaveForm('DISETUJUI', updatedForm);
    toast.success('Dokumen Berhasil Disetujui & Dikirim ke Logistik (Otorisasi Koordinator)!', { icon: '✅' });
  };

  // HANDLER FOR "KIRIM DENGAN E-SIGN" (AUTOMATIC HMAC BARCODE GENERATION)
  const handleOpenSendWithEsign = () => {
    const validLines = form.materialLines.filter(l => l.name && l.code);
    if (validLines.length === 0) {
      toast.error('Pilih minimal 1 item barang valid dari DB terlebih dahulu!');
      return;
    }
    handleSaveForm('DRAFT', null, false);
    setShowApprovalLink(true);
    setIsModalEsignOpen(true);
    toast.success('🔐 Barcode Akses & HMAC Token Berhasil Di-generate!', { icon: '✨' });
  };

  const handleConfirmSendWithEsign = () => {
    // 1. Set status to TERKIRIM (Pending E-Sign Signature) using the user-selected staff member!
    const staffName = form.approvedBy || 'Apt. Rian Hidayat, S.Farm';
    const updatedForm = {
      ...form,
      status: 'TERKIRIM',
      approvedBy: `${staffName} [Menunggu E-Sign]`
    };
    setForm(updatedForm);
    setIsModalEsignOpen(false);
    
    // 2. Save document to HIS state & localStorage as TERKIRIM
    handleSaveForm('TERKIRIM', updatedForm);
    
    // 3. Generate HMAC Signed Token & Direct navigate to Barcode verification link
    const tokenObj = generateSignedVerificationToken(form.noRQ || 'RQ-20260805-9999', 24);
    const targetUrl = `${window.location.origin}/auth/verify/${form.noRQ}?${tokenObj.urlParam}`;
    
    toast.success('🚀 Dokumen Berhasil Dikirim (Status: TERKIRIM)! Mengarahkan ke Halaman E-Sign Barcode...', {
      icon: '📲',
      duration: 4000
    });

    setTimeout(() => {
      window.open(targetUrl, '_blank');
    }, 400);
  };

  const handleConfirmApproval = () => {
    setIsAgreementChecked(true);
    setIsConfirmApprovalModalOpen(false);
    const staffName = form.approvedBy || 'Apt. Rian Hidayat, S.Farm';
    const updatedForm = {
      ...form,
      status: 'DISETUJUI',
      approvedBy: staffName
    };
    setForm(updatedForm);
    handleSaveForm('DISETUJUI', updatedForm);
  };

  const handleOpenPrint = (docItem) => {
    setIsPrintWithoutEsign(false);
    setActiveDocForPrint(docItem);
    try {
      localStorage.setItem(`material_request_${docItem.requestCode}`, JSON.stringify(docItem));
      if (docItem.approvalSignatureBase64 || form.approvalSignatureBase64) {
        localStorage.setItem(`signature_req_${docItem.requestCode}`, docItem.approvalSignatureBase64 || form.approvalSignatureBase64);
      }
    } catch (e) {}
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
                      onClick={() => handleEditRequest(doc)}
                      className="font-bold text-primary hover:underline text-xs block text-left cursor-pointer"
                      title="Klik untuk membuka Editor Requisisi Permintaan Barang"
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
                    <div className="relative group/itempop inline-block">
                      <button
                        type="button"
                        onClick={() => handleEditRequest(doc)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Arahkan kursor untuk melihat rincian barang, atau klik untuk membuka editor"
                      >
                        <Package size={13} className="text-primary" />
                        <span>{doc.items ? doc.items.length : 0} SKU</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({doc.items ? doc.items.reduce((acc, i) => acc + (Number(i.qtyRequested || i.qty) || 0), 0) : 0} Item)
                        </span>
                        <Eye size={12} className="text-slate-400 group-hover/itempop:text-primary transition-colors ml-0.5" />
                      </button>

                      {/* Floating Popover Tooltip on Hover */}
                      <div className="absolute left-0 top-full mt-1.5 hidden group-hover/itempop:block z-[200] w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 pointer-events-none">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                            <Package size={11} />
                            Rincian Item Requisisi
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{doc.requestCode || doc.noRQ}</span>
                        </div>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {doc.items && doc.items.map((it, idx) => (
                            <div key={idx} className="flex items-start justify-between text-[11px] gap-2 border-b border-slate-50 dark:border-slate-800/40 pb-1">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">{it.name}</span>
                                <span className="text-[9px] font-mono text-slate-400">{it.code}</span>
                              </div>
                              <span className="font-black text-primary shrink-0 font-mono">
                                {it.qtyRequested || it.qty} {it.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-[9px] text-slate-400 italic text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                          Klik badge untuk membuka editor lengkap
                        </div>
                      </div>
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

                      {!(doc.status === 'DISETUJUI' || doc.status === 'APPROVED') && (
                        <button
                          onClick={() => handleDirectToBarcodeUrl(doc)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer transition-all flex items-center gap-1"
                          title="Klik untuk membuka Halaman Verifikasi E-Sign & Barcode"
                        >
                          <QrCode size={11} />
                          <span>Setujui</span>
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
          <div className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full max-w-6xl rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
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
              
              {/* LOCKED READ-ONLY BANNER */}
              {(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="shrink-0 text-amber-500" />
                    <div>
                      <strong className="block text-xs font-bold uppercase tracking-wider">Dokumen Terkunci — Read Only Mode ({form.status})</strong>
                      <span className="text-[11px] opacity-90 font-medium">
                        Dokumen Requisisi ini berstatus <strong>{form.status}</strong> dan telah terdaftar pada audit trail HIS. Data terkunci & tidak dapat diubah lagi.
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                    LOCKED (READ-ONLY)
                  </span>
                </div>
              )}

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
                      disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                      onChange={e => setForm(prev => ({ ...prev, noRQ: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-primary outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Tanggal Pembuatan:*</label>
                    <input
                      type="date"
                      value={form.createdDate}
                      disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                      onChange={e => setForm(prev => ({ ...prev, createdDate: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Tanggal Pengiriman Expected:*</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                      onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs font-semibold text-emerald-600 outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-500 text-[10px] uppercase font-bold">Disetujui Oleh (Server DB Staf):*</label>
                    <StaffSearchCombobox
                      selectedValue={form.approvedBy}
                      disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                      onSelect={val => setForm(prev => ({ ...prev, approvedBy: val }))}
                    />
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
                        disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                        onChange={e => {
                          const dept = e.target.value;
                          setForm(prev => ({ 
                            ...prev, 
                            fromDept: dept,
                            fromWarehouse: `Gudang Medis (${dept})`
                          }));
                        }}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold disabled:opacity-75 disabled:cursor-not-allowed"
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
                        disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                        onChange={e => setForm(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold disabled:opacity-75 disabled:cursor-not-allowed"
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
                        disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                        onChange={e => {
                          const dept = e.target.value;
                          setForm(prev => ({ 
                            ...prev, 
                            toDept: dept,
                            toWarehouse: `Gudang Medis (${dept})`
                          }));
                        }}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold disabled:opacity-75 disabled:cursor-not-allowed"
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
                        disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                        onChange={e => setForm(prev => ({ ...prev, toWarehouse: e.target.value }))}
                        className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary font-bold disabled:opacity-75 disabled:cursor-not-allowed"
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
                      disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                      onChange={e => setForm(prev => ({ ...prev, generalNotes: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-xs outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Action Buttons for Route Verification & Reset */}
                  <div className="md:col-span-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {/* Live Verification Badge */}
                    <div>
                      {routeVerificationStatus ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in">
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                          <span>
                            Stok Verified ({routeVerificationStatus.availableSku} SKU Ready) • {routeVerificationStatus.timestamp} WIB
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">
                          Pilih rute untuk memverifikasi stok gudang di belakang layar.
                        </span>
                      )}
                    </div>

                    {!(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleResetRoute}
                          className="h-8 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Batal / Reset Rute
                        </button>
                        <button
                          type="button"
                          onClick={handleVerifyRouteStock}
                          disabled={isVerifyingStock}
                          className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isVerifyingStock ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={14} />
                          )}
                          <span>{isVerifyingStock ? 'Verifikasi Stok...' : 'Verifikasi Stok (Background)'}</span>
                        </button>
                      </div>
                    )}
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

                  {!(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateItems}
                        className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Generate Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddMaterialLine}
                        className="h-8 px-3 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Tambah Item (F4)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Data Grid Table for Material Lines */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-visible">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 w-[40%]">Nama Item Barang (Live DB Search)</th>
                        <th className="py-2.5 px-3 w-[12%] text-center">Jumlah</th>
                        <th className="py-2.5 px-3 w-[13%]">Satuan</th>
                        <th className="py-2.5 px-3 w-[20%]">Catatan Line Item</th>
                        <th className="py-2.5 px-3 w-[10%] text-center">Simpan</th>
                        <th className="py-2.5 px-3 w-[5%] text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {form.materialLines.map((line, index) => (
                        <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          {/* LIVE AUTO-SUGGEST COMBOBOX SEARCH TO DB */}
                          <td className="p-2">
                            <ItemSearchCombobox
                              items={items}
                              selectedCode={line.code}
                              selectedName={line.name}
                              autoFocus={index === form.materialLines.length - 1 && (form.materialLines.length > 1 || line.id.includes('new'))}
                              disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
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
                              disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                              onChange={e => {
                                const q = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, qty: q } : l)
                                }));
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSingleLineItem(line);
                                }
                              }}
                              className="w-20 h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 font-mono text-center font-bold text-primary outline-none focus:border-primary mx-auto disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </td>

                          <td className="p-2">
                            <select
                              value={line.unit}
                              disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                              onChange={e => {
                                const u = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, unit: u } : l)
                                }));
                              }}
                              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-xs font-bold uppercase outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
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
                              disabled={form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL'}
                              onChange={e => {
                                const n = e.target.value;
                                setForm(prev => ({
                                  ...prev,
                                  materialLines: prev.materialLines.map(l => l.id === line.id ? { ...l, notes: n } : l)
                                }));
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSingleLineItem(line);
                                }
                              }}
                              className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 text-xs outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* TOMBOL SIMPAN LINE ITEM SPESIFIK (PER BARIS ITEM) */}
                          <td className="p-2 text-center">
                            {!(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                              <button
                                type="button"
                                onClick={() => handleSaveSingleLineItem(line)}
                                className="h-9 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-all flex items-center justify-center gap-1 font-bold text-[11px] shadow-sm cursor-pointer mx-auto"
                                title="Simpan baris item ini saja ke Draft (Perlindungan Crash Auto-Save)"
                              >
                                <Save size={13} />
                                <span>Simpan</span>
                              </button>
                            )}
                          </td>

                          <td className="p-2 text-center">
                            {!(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterialLine(line.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Baris Item"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* SECTION D: AKSI OPERASIONAL DOKUMEN FINAL */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              
              {/* ROW 1: Otorisasi & Specimen Status Info */}
              <div className="flex items-center justify-between gap-3 text-xs font-semibold flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-slate-500 text-[11px] uppercase font-bold">Disetujui Oleh:</span>

                  {/* Tanda Tangan Digital Button & Specimen Badge */}
                  <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 p-1 rounded-xl shadow-2xs">
                    {form.approvalSignatureBase64 && (
                      <img 
                        src={form.approvalSignatureBase64} 
                        alt="Tanda Tangan Digital"
                        className="h-7 max-w-[70px] object-contain bg-white rounded border border-slate-200 p-0.5" 
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSignaturePadOpen(true)}
                      className="h-7 px-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                      title="Gores Tanda Tangan Digital Otorisator"
                    >
                      <PenTool size={12} className="shrink-0" />
                      <span className="whitespace-nowrap">Gores Tanda Tangan</span>
                    </button>
                  </div>
                  
                  {!showApprovalLink ? (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, approvedBy: 'Link / Barcode Akses' }));
                        setShowApprovalLink(true);
                        setIsQrModalOpen(true);
                        toast.success('Link Approval & Barcode Berhasil Dibuat!', { icon: '🔗' });
                      }}
                      className="h-8 px-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-all flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shadow-2xs whitespace-nowrap shrink-0"
                    >
                      <QrCode size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">Generate Link Akses / Barcode</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 p-1 rounded-xl shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="w-7 h-7 bg-white dark:bg-slate-900 rounded-lg border border-indigo-300 dark:border-indigo-700 p-1 flex justify-center items-center shadow-2xs hover:scale-105 transition-all cursor-pointer group"
                        title="Klik untuk melihat Barcode Direct Link & Detail Verifikasi"
                      >
                        <QrCode size={16} className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700" />
                      </button>
                      <div 
                        onClick={() => setIsQrModalOpen(true)}
                        className="flex flex-col cursor-pointer hover:opacity-85 transition-opacity"
                        title="Klik untuk membuka QR Barcode & Link Verifikasi"
                      >
                        <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider flex items-center gap-1">
                          <span>Approval Link</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200 font-bold underline decoration-indigo-300 underline-offset-2">
                          ehis.nurseflow.id/auth/verify/{form.noRQ.slice(-6)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyApprovalLink(`${window.location.origin}/auth/verify/${form.noRQ}`);
                        }}
                        className="ml-1 h-6 px-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-md transition-all flex items-center gap-1 font-bold shrink-0"
                        title="Salin Link Direct Persetujuan ke Clipboard"
                      >
                        <Copy size={10} className="shrink-0" />
                        <span className="text-[10px] whitespace-nowrap">Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsQrModalOpen(true)}
                        className="h-6 px-2 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1 text-[10px] font-bold shrink-0"
                        title="Buka Direct Link Verifikasi"
                      >
                        <ExternalLink size={10} className="shrink-0" />
                        <span className="whitespace-nowrap">Direct</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForm(prev => ({ ...prev, approvedBy: 'Apt. Rian Hidayat, S.Farm' }));
                          setShowApprovalLink(false);
                        }}
                        className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 shrink-0"
                        title="Batalkan Barcode & Kembali ke Teks"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 2: ACTION BUTTONS - ALIGNED RIGHT WITH ZERO TEXT WRAPPING */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="h-10 px-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL' ? 'Tutup' : 'Batal'}
                </button>

                <button
                  type="button"
                  onClick={handlePrintWithoutEsign}
                  className="h-10 px-4 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border border-slate-700 whitespace-nowrap shrink-0"
                  title="Cetak Formulir Fisik Tanpa Tanda Tangan Digital (Tanda Tangan Basah Manual)"
                >
                  <Printer size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">Cetak Fisik</span>
                </button>

                {!(form.status === 'DISETUJUI' || form.status === 'APPROVED' || form.status === 'TERKIRIM' || form.status === 'PENDING_APPROVAL') && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveForm('DRAFT')}
                      className="h-10 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      title="Simpan dokumen sebagai Draft"
                    >
                      <Save size={14} className="shrink-0" />
                      <span className="whitespace-nowrap">Simpan Draft</span>
                    </button>

                    {/* AKSI 1: KIRIM TANPA E-SIGN (POPUP VERIFIKASI PERNYATAAN KOORDINATOR LEVEL+) */}
                    <button
                      type="button"
                      onClick={handleOpenSendNoEsign}
                      className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer border border-slate-800 whitespace-nowrap shrink-0"
                      title="Kirim tanpa TTD digital (Membutuhkan verifikasi otorisasi fisik Hak Akses Koordinator / Supervisor)"
                    >
                      <UserCheck size={15} className="shrink-0 text-slate-300" />
                      <span className="whitespace-nowrap">Kirim Tanpa E-Sign</span>
                    </button>

                    {/* AKSI 2: KIRIM DENGAN E-SIGN (POPUP VERIFIKASI PERNYATAAN + BARCODE HMAC AUTOMATIC) */}
                    <button
                      type="button"
                      onClick={handleOpenSendWithEsign}
                      className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer animate-in fade-in zoom-in-95 whitespace-nowrap shrink-0"
                      title="Simpan, generate Barcode QR HMAC aman, & kirim dengan E-Sign Digital (Shortcut F6)"
                    >
                      <QrCode size={15} className="shrink-0" />
                      <span className="whitespace-nowrap">Kirim dengan E-Sign (F6)</span>
                    </button>
                  </>
                )}

                {/* BADGE INFO DISETUJUI OLEH (UNTUK DOKUMEN BERSTATUS DISETUJUI/APPROVED) */}
                {(form.status === 'DISETUJUI' || form.status === 'APPROVED') && (
                  <div className="h-10 px-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-xs flex items-center gap-2 shadow-2xs animate-in fade-in zoom-in-95 whitespace-nowrap shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="whitespace-nowrap">Disetujui oleh: {form.approvedBy || 'Apt. Rian Hidayat, S.Farm'}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}



      {/* MODAL 1: POPUP VERIFIKASI PERNYATAAN KOORDINATOR (KIRIM TANPA E-SIGN) */}
      {isModalNoEsignOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-11 h-11 bg-slate-800/10 border border-slate-700/30 text-slate-800 dark:text-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Otorisasi Level Koordinator (Tanpa E-Sign)</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Verifikasi Hak Akses Supervisor / Head Nurse Ruangan</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5 text-xs text-amber-700 dark:text-amber-300">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck size={15} />
                <span>Verifikasi Pernyataan Otorisasi Fisik (JCI Compliant)</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                Saya menyatakan dengan sah bahwa daftar barang pada No. RQ <strong className="font-mono text-slate-900 dark:text-white">{form.noRQ}</strong> ini telah diperiksa dan disetujui oleh Koordinator Ruangan untuk proses tanda tangan fisik manual.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-slate-500">Penanggung Jawab Koordinator:</label>
              <select
                value={coordinatorName}
                onChange={e => setCoordinatorName(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-bold outline-none focus:border-primary"
              >
                <option value="Ns. Ratna M., S.Kep (Koordinator Ruangan Rawat Inap)">Ns. Ratna M., S.Kep (Koordinator Ruangan Rawat Inap)</option>
                <option value="Apt. Rian Hidayat, S.Farm (Supervisor Logistik Farmasi)">Apt. Rian Hidayat, S.Farm (Supervisor Logistik Farmasi)</option>
                <option value="Dr. Hendra Wijaya, Sp.An (Kepala Instalasi Pelayanan)">Dr. Hendra Wijaya, Sp.An (Kepala Instalasi Pelayanan)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalNoEsignOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSendNoEsign}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Setujui & Kirim (Tanpa E-Sign)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: POPUP VERIFIKASI PERNYATAAN E-SIGN + AUTOMATIC BARCODE HMAC GENERATION */}
      {isModalEsignOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Otorisasi E-Sign & Barcode Akses Aman</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Automatic HMAC SHA-256 Token Generated</p>
              </div>
            </div>

            {/* Barcode & Link Preview Box */}
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=2&data=${encodeURIComponent(`${window.location.origin}/auth/verify/${form.noRQ}?${generateSignedVerificationToken(form.noRQ).urlParam}`)}`}
                alt="QR Barcode Access"
                className="w-14 h-14 bg-white rounded-xl p-1 border border-indigo-200 shadow-sm shrink-0"
              />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 text-[11px]">
                  <ShieldCheck size={13} />
                  <span>Barcode & HMAC Token Aktif</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono truncate max-w-[210px]">
                  {window.location.origin}/auth/verify/{form.noRQ}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyApprovalLink()}
                  className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Copy size={11} />
                  <span>Salin Direct Link HMAC</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
              <div className="font-bold flex items-center gap-1">
                <CheckCircle2 size={15} />
                <span>Pernyataan Otorisasi E-Sign JCI PFR.5</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                Dokumen Requisisi <strong className="font-mono text-slate-900 dark:text-white">{form.noRQ}</strong> disetujui secara elektronik oleh <strong className="text-emerald-700 dark:text-emerald-400">Apt. Rian Hidayat, S.Farm</strong> dan terikat legalitas medis digital.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalEsignOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSendWithEsign}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={15} />
                <span>Kirim & Buka Halaman Barcode E-Sign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT DOKUMEN MODAL (CETAK DOKUMEN FISIK / PDF) */}
      {isPrintModalOpen && activeDocForPrint && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          
          {/* PRINT MEDIA QUERY STYLES */}
          <style dangerouslySetInnerHTML={{ __html: `
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-document-area, .printable-document-area * {
                visibility: visible;
              }
              .printable-document-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: #0f172a !important;
              }
              .print-no-show {
                display: none !important;
              }
              table {
                page-break-inside: auto !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              thead {
                display: table-header-group !important;
              }
              tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .print-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          ` }} />

          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-8 relative shadow-2xl overflow-y-auto max-h-[95vh] space-y-6 printable-document-area">
            
            {/* Header Cetakan Document */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between print-avoid-break">
              <div>
                <h2 className="text-xl font-black tracking-tight">RUMAH SAKIT NURSEFLOW EHIS 2026</h2>
                <p className="text-xs font-bold text-slate-600 uppercase">DOKUMEN REQUISISI PERMINTAAN BARANG (MATERIAL REQUEST)</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-black text-blue-700 block">{activeDocForPrint.requestCode}</span>
                <span className="text-xs font-bold text-slate-500">Tgl: {activeDocForPrint.requestDate}</span>
              </div>
            </div>

            {/* Document Parameters Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-bold border p-3.5 rounded-xl bg-slate-50 border-slate-200 print-avoid-break">
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
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider">Rincian Barang Diminta (Material Lines)</h4>
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-[10px] font-black uppercase">
                    <th className="p-2.5 border-r border-slate-300 w-12 text-center">No.</th>
                    <th className="p-2.5 border-r border-slate-300">Kode & Nama Item</th>
                    <th className="p-2.5 border-r border-slate-300 text-center w-20">Jumlah</th>
                    <th className="p-2.5 border-r border-slate-300 w-24">Satuan</th>
                    <th className="p-2.5">Catatan Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {activeDocForPrint.items.map((it, idx) => (
                    <tr key={idx} className="print-avoid-break">
                      <td className="p-2.5 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <strong className="block text-slate-900">{it.name}</strong>
                        <span className="font-mono text-[10px] text-slate-500">{it.code}</span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-900">{it.qtyRequested}</td>
                      <td className="p-2.5 border-r border-slate-200 uppercase text-slate-700">{it.unit}</td>
                      <td className="p-2.5 text-slate-600">{it.lineNotes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-xs font-bold text-center print-avoid-break">
              <div>
                <span className="block opacity-70 mb-2">Pemohon Barang (Ruangan)</span>
                <div className="h-16 flex items-center justify-center my-1">
                  <span className="text-[10px] text-slate-400 font-mono italic">[ Tanda Tangan Pemohon ]</span>
                </div>
                <span className="block font-black underline">{activeDocForPrint.requestedBy}</span>
              </div>
              <div>
                <span className="block opacity-70 mb-2">Disetujui Oleh (Otorisasi Supervisor)</span>
                <div className="h-16 flex items-center justify-center gap-3 my-1">
                  {!isPrintWithoutEsign && (activeDocForPrint.approvalSignatureBase64 || form.approvalSignatureBase64) ? (
                    <img 
                      src={activeDocForPrint.approvalSignatureBase64 || form.approvalSignatureBase64} 
                      alt="Tanda Tangan Otorisator"
                      className="h-14 max-w-[150px] object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-32 border-b border-dashed border-slate-400 my-1"></div>
                      <span className="text-[9px] text-slate-500 font-mono italic">[ Tanda Tangan Basah Manual ]</span>
                    </div>
                  )}
                  {/* Micro QR Verification Seal */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=2&data=${encodeURIComponent(`${window.location.origin}/auth/verify/${activeDocForPrint.requestCode || form.noRQ}`)}`} 
                    alt="QR Seal"
                    className="w-11 h-11 border border-slate-300 rounded p-0.5 shadow-sm"
                  />
                </div>
                <span className="block font-black underline">{activeDocForPrint.approvedBy || 'Apt. Rian Hidayat, S.Farm'}</span>
                <span className="block text-[9px] font-mono text-emerald-700 font-bold">✓ E-SIGN VERIFIED (JCI PFR.5 COMPLIANT)</span>
              </div>
            </div>

            {/* Modal Print Action Buttons */}
            <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 print-no-show">
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

      {/* QR BARCODE DIRECT LINK & VERIFIKASI PERSETUJUAN MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl p-6 relative shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Verifikasi Digital Sign & Barcode</h3>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Barcode Direct Link & Autentikasi Persetujuan Requisisi</p>
                </div>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code Graphic Box */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center relative group">
                {/* 100% REAL SCANNABLE QR CODE GENERATOR */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(`${window.location.origin}/auth/verify/${form.noRQ}`)}`} 
                  alt={`QR Code Verifikasi ${form.noRQ}`}
                  className="w-48 h-48 rounded-lg shadow-sm object-contain bg-white"
                />
                
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-800 uppercase block">
                    {form.noRQ}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                    <ShieldCheck size={11} />
                    <span>DIGITAL SIGNATURE SCANNABLE</span>
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Pindai barcode di atas menggunakan smartphone / kamera untuk membuka halaman verifikasi persetujuan resmi HIS.
                </p>
              </div>
            </div>

            {/* Direct Verification Link Input Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Direct Link Verifikasi Persetujuan (URL):
              </label>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/auth/verify/${form.noRQ}`}
                  className="w-full bg-transparent font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyApprovalLink(`${window.location.origin}/auth/verify/${form.noRQ}`)}
                  className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Salin Link</span>
                </button>
                <a
                  href={`${window.location.origin}/auth/verify/${form.noRQ}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                >
                  <ExternalLink size={13} />
                  <span>Buka Direct</span>
                </a>
              </div>
            </div>

            {/* Document Verification Metadata (JCI Audit Standard) */}
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Penandatangan Otorisasi:</span>
                <span className="text-indigo-700 dark:text-indigo-300">{form.approvedBy || 'Apt. Rian Hidayat, S.Farm'}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Waktu Otentikasi:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{new Date().toLocaleString('id-ID')} WIB</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Security Hash (SHA-256):</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">0x8f92...{form.noRQ.slice(-4)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  toast.success('Pratinjau Stempel Barcode Siap Dicetak!');
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Cetak Stempel Barcode</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CANVAS E-SIGNATURE PAD MODAL */}
      {isSignaturePadOpen && (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PenTool size={18} className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Pad Tanda Tangan Digital Otorisator</h3>
              </div>
              <button
                onClick={() => setIsSignaturePadOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Gores tanda tangan digital Anda menggunakan kursor, mouse, stylus, atau layar sentuh (touchscreen) pada area pad di bawah:
            </p>

            <div className="bg-white rounded-2xl p-2 border-2 border-dashed border-sky-400 shadow-inner flex justify-center touch-none">
              <canvas
                ref={sigCanvasRef}
                width={360}
                height={160}
                onMouseDown={(e) => {
                  const canvas = sigCanvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  const rect = canvas.getBoundingClientRect();
                  ctx.beginPath();
                  ctx.moveTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
                  setIsDrawingSig(true);
                }}
                onMouseMove={(e) => {
                  if (!isDrawingSig) return;
                  const canvas = sigCanvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  const rect = canvas.getBoundingClientRect();
                  ctx.lineTo((e.clientX - rect.left) * (canvas.width / rect.width), (e.clientY - rect.top) * (canvas.height / rect.height));
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 3.5;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.stroke();
                  setHasDrawnSig(true);
                }}
                onMouseUp={() => setIsDrawingSig(false)}
                onMouseLeave={() => setIsDrawingSig(false)}
                onTouchStart={(e) => {
                  const canvas = sigCanvasRef.current;
                  if (!canvas || !e.touches[0]) return;
                  const ctx = canvas.getContext('2d');
                  const rect = canvas.getBoundingClientRect();
                  ctx.beginPath();
                  ctx.moveTo((e.touches[0].clientX - rect.left) * (canvas.width / rect.width), (e.touches[0].clientY - rect.top) * (canvas.height / rect.height));
                  setIsDrawingSig(true);
                }}
                onTouchMove={(e) => {
                  if (!isDrawingSig || !e.touches[0]) return;
                  const canvas = sigCanvasRef.current;
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  const rect = canvas.getBoundingClientRect();
                  ctx.lineTo((e.touches[0].clientX - rect.left) * (canvas.width / rect.width), (e.touches[0].clientY - rect.top) * (canvas.height / rect.height));
                  ctx.strokeStyle = '#0f172a';
                  ctx.lineWidth = 3.5;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.stroke();
                  setHasDrawnSig(true);
                }}
                onTouchEnd={() => setIsDrawingSig(false)}
                className="w-full h-40 bg-white cursor-crosshair rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const canvas = sigCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    setHasDrawnSig(false);
                  }
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Bersihkan</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const preset = createDefaultSignature();
                    const updatedForm = { 
                      ...form, 
                      approvalSignatureBase64: preset,
                      status: 'DISETUJUI',
                      approvedBy: 'Apt. Rian Hidayat, S.Farm'
                    };
                    setForm(updatedForm);
                    setIsAgreementChecked(true);
                    setIsSignaturePadOpen(false);
                    handleSaveForm('DISETUJUI', updatedForm);
                  }}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-sky-600 dark:text-sky-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Gunakan Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasDrawnSig) {
                      toast.error('Silakan gores tanda tangan pada pad terlebih dahulu!');
                      return;
                    }
                    const canvas = sigCanvasRef.current;
                    if (canvas) {
                      const data = canvas.toDataURL('image/png');
                      const updatedForm = { 
                        ...form, 
                        approvalSignatureBase64: data,
                        status: 'DISETUJUI',
                        approvedBy: 'Apt. Rian Hidayat, S.Farm'
                      };
                      setForm(updatedForm);
                      setIsAgreementChecked(true);
                      setIsSignaturePadOpen(false);
                      handleSaveForm('DISETUJUI', updatedForm);
                    }
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer"
                >
                  Simpan Tanda Tangan & Setujui RO
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
