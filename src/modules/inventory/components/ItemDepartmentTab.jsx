import React, { useState, useMemo } from 'react';
import { 
  Boxes, Search, Filter, AlertTriangle, Clock, ShieldAlert, 
  ArrowUpRight, Building2, Package, Tag, RefreshCw, Plus, FileSpreadsheet,
  QrCode, Printer, MapPin, Settings2, Edit3, Trash2, CheckCircle2, ChevronRight,
  ChevronLeft, ChevronsLeft, ChevronsRight, X, Sparkles, Building, Layers, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS, getDepartmentWarehouses } from '../../../core/departments.js';

export default function ItemDepartmentTab({ items }) {
  // Active Selected Department State (Default: UGD or ADMISSION)
  const [selectedDept, setSelectedDept] = useState(MASTER_DEPARTMENTS[0]);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  // Item Search & Category Filter
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortFilter, setSortFilter] = useState('NEWEST');

  // Modals State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSetRakModalOpen, setIsSetRakModalOpen] = useState(false);
  const [isPrintRakModalOpen, setIsPrintRakModalOpen] = useState(false);
  const [isAddWarehouseModalOpen, setIsAddWarehouseModalOpen] = useState(false);

  // Active Item for Set Rak / Print
  const [activeItemForRak, setActiveItemForRak] = useState(null);
  const [rakInput, setRakInput] = useState('');
  const [allocatedWhInput, setAllocatedWhInput] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Department Warehouses Mapping State
  const [deptWarehouses, setDeptWarehouses] = useState([
    { id: 'wh-med-1', code: `WH-MED-${selectedDept.id}`, name: `Gudang Medis (${selectedDept.name})`, isMedical: true, isDefault: true, capacity: '85%' },
    { id: 'wh-um-1', code: `WH-UM-${selectedDept.id}`, name: `Gudang Umum (${selectedDept.name})`, isMedical: false, isDefault: false, capacity: '40%' }
  ]);

  // Master Items State for Department
  const [deptItems, setDeptItems] = useState(items || []);

  // New Item Form State
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    category: 'OBAT',
    warehouse: `Gudang Medis (${selectedDept.name})`,
    shelf: 'RAK-MED-A01',
    stockQty: 100,
    minStock: 20,
    maxStock: 500,
    unit: 'Tablet',
    unitPrice: 2500
  });

  // Filtered Departments for Left Sidebar
  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery.trim()) return MASTER_DEPARTMENTS;
    const q = deptSearchQuery.toLowerCase();
    return MASTER_DEPARTMENTS.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.id.toLowerCase().includes(q)
    );
  }, [deptSearchQuery]);

  // Handle Department Switch
  const handleSelectDepartment = (dept) => {
    setSelectedDept(dept);
    setDeptWarehouses([
      { id: `wh-med-${dept.id}`, code: `WH-MED-${dept.id}`, name: `Gudang Medis (${dept.name})`, isMedical: true, isDefault: true, capacity: '85%' },
      { id: `wh-um-${dept.id}`, code: `WH-UM-${dept.id}`, name: `Gudang Umum (${dept.name})`, isMedical: false, isDefault: false, capacity: '40%' }
    ]);
    setNewItemForm(prev => ({
      ...prev,
      warehouse: `Gudang Medis (${dept.name})`
    }));
    setCurrentPage(1);
    toast.success(`Departemen Aktif: ${dept.name}`);
  };

  // Filtered Items for Active Department
  const filteredItems = useMemo(() => {
    let result = deptItems.filter(item => {
      // 1. WAREHOUSE FILTER (Medis vs Umum vs ALL)
      if (warehouseFilter === 'Medis') {
        const isMed = item.category === 'OBAT' || item.category === 'BMHP' || item.category === 'MEDIS' || item.warehouse?.toLowerCase().includes('medis');
        if (!isMed) return false;
      } else if (warehouseFilter === 'Umum') {
        const isUmum = item.category === 'NON_MEDIS' || item.category === 'UMUM' || item.warehouse?.toLowerCase().includes('umum');
        if (!isUmum) return false;
      }

      // 2. STATUS FILTER (NORMAL vs LOW_STOCK vs ALL)
      if (statusFilter === 'LOW_STOCK') {
        const isLow = (item.stockQty <= item.minStock) || item.status === 'LOW_STOCK';
        if (!isLow) return false;
      } else if (statusFilter === 'NORMAL') {
        const isNormal = (item.stockQty > item.minStock) && item.status !== 'LOW_STOCK';
        if (!isNormal) return false;
      }

      // 3. ITEM SEARCH QUERY
      if (!itemSearchQuery.trim()) return true;
      const q = itemSearchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q) ||
        item.shelf?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    });

    // 4. SORT FILTER (TERBARU vs TERLAMA)
    if (sortFilter === 'NEWEST') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortFilter === 'OLDEST') {
      result.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }

    return result;
  }, [deptItems, warehouseFilter, statusFilter, itemSearchQuery, sortFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Actions
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) return toast.error('Nama item wajib diisi!');

    const created = {
      id: `item-${Date.now()}`,
      code: newItemForm.code || `ITEM-${Math.floor(1000 + Math.random()*9000)}`,
      name: newItemForm.name,
      category: newItemForm.category,
      department: selectedDept.name,
      warehouse: newItemForm.warehouse,
      shelf: newItemForm.shelf || 'RAK-A01',
      stockQty: Number(newItemForm.stockQty) || 0,
      minStock: Number(newItemForm.minStock) || 10,
      maxStock: Number(newItemForm.maxStock) || 100,
      unit: newItemForm.unit || 'PCS',
      unitPrice: Number(newItemForm.unitPrice) || 1000,
      status: Number(newItemForm.stockQty) <= Number(newItemForm.minStock) ? 'LOW_STOCK' : 'NORMAL',
      created_at: new Date().toISOString()
    };

    setDeptItems(prev => [created, ...prev]);
    toast.success(`Item "${created.name}" Berhasil Ditambahkan ke ${selectedDept.name}!`);
    setIsAddItemModalOpen(false);
  };

  const handleOpenSetRak = (item) => {
    setActiveItemForRak(item);
    setRakInput(item.shelf || `RAK-${item.category === 'OBAT' ? 'MED' : 'UMUM'}-A01`);
    setAllocatedWhInput(item.warehouse || `Gudang ${item.category === 'OBAT' ? 'Medis' : 'Umum'} (${selectedDept.name})`);
    setIsSetRakModalOpen(true);
  };

  const handleSaveSetRak = () => {
    if (!activeItemForRak) return;
    setDeptItems(prev => prev.map(i => i.id === activeItemForRak.id ? {
      ...i,
      shelf: rakInput,
      warehouse: allocatedWhInput
    } : i));
    toast.success(`Alokasi Rak Fisik (${rakInput}) untuk "${activeItemForRak.name}" Berhasil Diperbarui!`);
    setIsSetRakModalOpen(false);
  };

  const handleOpenPrintRak = (item) => {
    setActiveItemForRak(item);
    setIsPrintRakModalOpen(true);
  };

  const handleSimulateImport = () => {
    toast.success('Simulasi Import Data Inventaris Berhasil (50 Item Diimpor)!', { icon: '📊' });
    setIsImportModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* SIDEBAR LEFT: INTERACTIVE 104 DEPARTMENTS SELECTOR */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Building size={16} />
              <span>Navigasi Departemen</span>
            </div>
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-mono text-[10px] font-bold">
              104 Unit
            </span>
          </div>

          {/* Department Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Departemen..."
              value={deptSearchQuery}
              onChange={e => setDeptSearchQuery(e.target.value)}
              className="w-full h-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 text-xs outline-none focus:border-primary font-semibold"
            />
          </div>

          {/* Department List Scrollable */}
          <div className="max-h-[600px] overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {filteredDepartments.map(dept => {
              const isSelected = selectedDept.id === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 my-0.5 ${
                    isSelected
                      ? 'bg-primary text-white font-bold shadow-md scale-[1.02]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="truncate">
                    <span className="block truncate text-xs">{dept.name}</span>
                    <span className={`text-[9px] block ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      Kategori: {dept.category}
                    </span>
                  </div>
                  {isSelected && <ChevronRight size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* MAIN CONTENT RIGHT: WAREHOUSE HIERARCHY & ITEM CATALOG */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* DEPARTMENT TITLE HEADER & ACTIONS */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedDept.name}</h2>
              <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold rounded-md uppercase">
                ID: {selectedDept.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manajemen Katalog Barang, Dual-Gudang (Medis & Umum), serta Lokasi Rak Fisik
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} />
              <span>+ Item Import</span>
            </button>
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="h-9 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>+ Item Baru</span>
            </button>
          </div>
        </div>

        {/* DUAL WAREHOUSE HIERARCHY CARDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Layers size={15} />
              <span>Hierarki Dual-Gudang Departemen ({selectedDept.name})</span>
            </div>
            <button
              onClick={() => toast.success('Tambah Gudang Baru')}
              className="text-xs text-primary hover:underline font-bold flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Tambah Gudang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deptWarehouses.map(wh => (
              <div 
                key={wh.id} 
                className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    wh.isMedical ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{wh.name}</h4>
                      {wh.isDefault && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded font-mono text-[9px] font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">Kode: {wh.code} • Medis: {wh.isMedical ? 'YA' : 'TIDAK'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Kapasitas</span>
                  <span className="text-xs font-mono font-bold text-primary">{wh.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ITEM CATALOG TABLE & FILTER PANEL */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
          
          {/* Table Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex-1 min-w-[240px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari item, kode, atau posisi rak..."
                value={itemSearchQuery}
                onChange={e => setItemSearchQuery(e.target.value)}
                className="w-full h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <div className="relative">
                <select
                  value={warehouseFilter}
                  onChange={e => {
                    setWarehouseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Semua Gudang</option>
                  <option value="Medis">Gudang Medis</option>
                  <option value="Umum">Gudang Umum</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="LOW_STOCK">LOW STOCK</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortFilter}
                  onChange={e => {
                    setSortFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3.5 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  <option value="NEWEST">Terbaru</option>
                  <option value="OLDEST">Terlama</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Catalog Data Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3">Kode & Nama Item</th>
                  <th className="py-2.5 px-3">Alokasi Gudang</th>
                  <th className="py-2.5 px-3">Lokasi Rak Fisik</th>
                  <th className="py-2.5 px-3 text-center">Stok (Min / Max)</th>
                  <th className="py-2.5 px-3">Satuan & Harga</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-3">
                      <strong className="block text-slate-900 dark:text-white font-bold text-xs">{item.name}</strong>
                      <span className="font-mono text-[10px] text-primary">{item.code}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px] block w-fit">
                        {item.warehouse || `Gudang Medis (${selectedDept.name})`}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded font-mono font-bold text-[10px] flex items-center gap-1 w-fit">
                        <MapPin size={11} />
                        <span>{item.shelf || 'RAK-MED-A01'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{item.stockQty}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Min: {item.minStock} | Max: {item.maxStock}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="block font-bold">{item.unit || 'PCS'}</span>
                      <span className="font-mono text-[10px] text-slate-400">Rp {(item.unitPrice || 1000).toLocaleString('id-ID')}</span>
                    </td>

                    <td className="py-3 px-3">
                      {item.stockQty <= item.minStock ? (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded text-[10px] font-bold uppercase border border-rose-500/20">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold uppercase border border-emerald-500/20">
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSetRak(item)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Set Rak
                        </button>
                        <button
                          onClick={() => handleOpenPrintRak(item)}
                          className="px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          title="Cetak Barcode Rak"
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
            <div className="text-slate-500">
              Displaying {Math.min((currentPage - 1) * pageSize + 1, filteredItems.length)} - {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length} Katalog Barang
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

      </div>

      {/* MODAL 1: ADD ITEM BARU */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Item Baru ke {selectedDept.name}</h3>
              <button onClick={() => setIsAddItemModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Nama Barang:*</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Paracetamol 500mg Tablet"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Kode Barang:</label>
                  <input
                    type="text"
                    placeholder="Auto-Generated"
                    value={newItemForm.code}
                    onChange={e => setNewItemForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Kategori:*</label>
                  <div className="relative">
                    <select
                      value={newItemForm.category}
                      onChange={e => setNewItemForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white"
                    >
                      <option value="OBAT">OBAT</option>
                      <option value="BMHP">BMHP</option>
                      <option value="NON_MEDIS">NON-MEDIS</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Alokasi Gudang:*</label>
                  <div className="relative">
                    <select
                      value={newItemForm.warehouse}
                      onChange={e => setNewItemForm(prev => ({ ...prev, warehouse: e.target.value }))}
                      className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white truncate"
                    >
                      {getDepartmentWarehouses(selectedDept.name).map((wh, idx) => (
                        <option key={idx} value={wh}>{wh.split(' (')[0]}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Posisi Rak Mikro:*</label>
                  <input
                    type="text"
                    placeholder="Misal: RAK-MED-A01"
                    value={newItemForm.shelf}
                    onChange={e => setNewItemForm(prev => ({ ...prev, shelf: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Stok Awal:*</label>
                  <input
                    type="number"
                    value={newItemForm.stockQty}
                    onChange={e => setNewItemForm(prev => ({ ...prev, stockQty: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Min Stock:*</label>
                  <input
                    type="number"
                    value={newItemForm.minStock}
                    onChange={e => setNewItemForm(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Satuan:*</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold uppercase text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs shadow-md transition-all"
                >
                  Simpan Item Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SET RAK FISIK MIKRO */}
      {isSetRakModalOpen && activeItemForRak && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Alokasi Rak Fisik Mikro</h3>
              <button onClick={() => setIsSetRakModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white text-xs font-bold">{activeItemForRak.name}</strong>
                <span className="font-mono text-[10px] text-primary block mt-0.5">{activeItemForRak.code} • Stok: {activeItemForRak.stockQty} {activeItemForRak.unit}</span>
              </div>

              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Pilih Gudang Alokasi:*</label>
                <div className="relative">
                  <select
                    value={allocatedWhInput}
                    onChange={e => setAllocatedWhInput(e.target.value)}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white truncate"
                  >
                    {getDepartmentWarehouses(selectedDept.name).map((wh, idx) => (
                      <option key={idx} value={wh}>{wh.split(' (')[0]}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Kode Rak Fisik Mikro:*</label>
                <input
                  type="text"
                  placeholder="Misal: RAK-MED-A01"
                  value={rakInput}
                  onChange={e => setRakInput(e.target.value)}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsSetRakModalOpen(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSetRak}
                  className="h-9 px-5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs shadow-md transition-all"
                >
                  Simpan Alokasi Rak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINT LABEL BARCODE RAK */}
      {isPrintRakModalOpen && activeItemForRak && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 text-center">
            
            <div className="border-b-2 border-slate-900 pb-2">
              <h4 className="text-xs font-black tracking-widest uppercase">LABEL RAK FISIK HIS 2026</h4>
              <p className="text-[10px] font-bold text-slate-500">{selectedDept.name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-lg font-black text-blue-700 block font-mono">{activeItemForRak.shelf || 'RAK-MED-A01'}</span>
              <strong className="text-sm block">{activeItemForRak.name}</strong>
              <span className="text-[10px] font-mono text-slate-500 block">{activeItemForRak.code} • Unit: {activeItemForRak.unit}</span>
            </div>

            {/* QR Code Thermal Mock */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-center">
              <QrCode size={100} className="text-slate-800" />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
              <button
                onClick={() => setIsPrintRakModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                  setIsPrintRakModalOpen(false);
                }}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Cetak Label</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: SIMULASI ITEM IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mx-auto">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Massal Inventaris (+Item Import)</h3>
              <p className="text-xs text-slate-500 mt-1">Unggah file Excel/CSV data inventaris untuk {selectedDept.name}</p>
            </div>

            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 cursor-pointer transition-colors">
              <Sparkles size={24} className="mx-auto text-emerald-500 mb-2" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Klik atau Seret file CSV/Excel ke sini</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Format: Kode, Nama, Kategori, Stok, Satuan, Min, Max</span>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSimulateImport}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Proses Import Massal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
