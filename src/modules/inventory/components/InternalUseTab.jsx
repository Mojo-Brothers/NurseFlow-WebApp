import React, { useState, useMemo } from 'react';
import { 
  Building, Plus, Search, DollarSign, Calendar, FileText, 
  Tag, ShieldCheck, CheckCircle2, User, ChevronDown, X,
  ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, Filter, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS } from '../../../core/departments.js';

const INITIAL_INTERNAL_USES = [
  {
    id: 'use-001',
    useCode: 'USE-20260805-01',
    useDate: '2026-08-05 08:30',
    depo: 'UGD (INSTALASI GAWAT DARURAT)',
    costCenter: 'Operasional Ruangan UGD',
    reason: 'Sanitasi & Desinfeksi Ruangan Tindakan',
    usedBy: 'Ns. Ratna Marlina, S.Kep',
    totalCost: 185000,
    items: [
      { name: 'Disinfektan Alkohol 70% 1 Liter', qty: 2, unit: 'Botol', total: 90000 },
      { name: 'Hand Soap Antiseptik 500ml', qty: 2, unit: 'Botol', total: 95000 }
    ]
  },
  {
    id: 'use-002',
    useCode: 'USE-20260805-02',
    useDate: '2026-08-05 09:15',
    depo: 'POLI DENTISTRY / GIGI',
    costCenter: 'Operasional Tindakan Dental',
    reason: 'Penggunaan Sarung Tangan & BMHP Non-Billing',
    usedBy: 'drg. Budi Santoso, Sp.KG',
    totalCost: 145000,
    items: [
      { name: 'Sarung Tangan Non-Steril Size M Box 100', qty: 1, unit: 'Box', total: 85000 },
      { name: 'Masker 3-Ply Earloop Box 50', qty: 1, unit: 'Box', total: 60000 }
    ]
  },
  {
    id: 'use-003',
    useCode: 'USE-20260805-03',
    useDate: '2026-08-05 10:45',
    depo: 'RAWAT INAP AMARYLIS',
    costCenter: 'Perlengkapan Linen & Kebersihan Ruangan',
    reason: 'Pengantian Set Seprai & Hand Towel Pasien',
    usedBy: 'Dewi Kusuma, S.Tr.Kes',
    totalCost: 260000,
    items: [
      { name: 'Tissue Hand Towel Interfold Livi', qty: 10, unit: 'Pack', total: 125000 },
      { name: 'Floor Cleaner Karbol Sereh 5L', qty: 1, unit: 'Jerigen', total: 135000 }
    ]
  }
];

export default function InternalUseTab({ uses, items }) {
  const [useList, setUseList] = useState(INITIAL_INTERNAL_USES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [newUse, setNewUse] = useState({
    depo: MASTER_DEPARTMENTS[0].name,
    costCenter: `Operasional Ruangan ${MASTER_DEPARTMENTS[0].name}`,
    reason: 'Penggunaan Rutin Operasional Unit',
    usedBy: 'Ns. Robby Viory, S.Kep',
    itemName: 'Disinfektan Alkohol 70% 1 Liter',
    qty: 2,
    unitPrice: 45000
  });

  const filteredUses = useMemo(() => {
    return useList.filter(u => {
      if (selectedDept !== 'ALL' && !u.depo.toLowerCase().includes(selectedDept.toLowerCase())) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        u.useCode.toLowerCase().includes(q) ||
        u.costCenter.toLowerCase().includes(q) ||
        u.reason.toLowerCase().includes(q) ||
        u.usedBy.toLowerCase().includes(q)
      );
    });
  }, [useList, selectedDept, searchTerm]);

  // Pagination Calculation
  const totalPages = Math.ceil(filteredUses.length / pageSize) || 1;
  const paginatedUses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUses.slice(start, start + pageSize);
  }, [filteredUses, currentPage, pageSize]);

  const handleCreateInternalUse = (e) => {
    e.preventDefault();
    const created = {
      id: `use-${Date.now()}`,
      useCode: `USE-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(10 + Math.random()*90)}`,
      useDate: new Date().toLocaleString('id-ID'),
      depo: newUse.depo,
      costCenter: newUse.costCenter,
      reason: newUse.reason,
      usedBy: newUse.usedBy,
      totalCost: Number(newUse.qty) * Number(newUse.unitPrice),
      items: [
        { name: newUse.itemName, qty: Number(newUse.qty), unit: 'Pcs/Botol', total: Number(newUse.qty) * Number(newUse.unitPrice) }
      ]
    };

    setUseList(prev => [created, ...prev]);
    toast.success(`Pemakaian Internal ${created.useCode} Berhasil Dicatat!`);
    setIsModalOpen(false);
  };

  const totalCostOverall = filteredUses.reduce((sum, u) => sum + (u.totalCost || 0), 0);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Building size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pemakaian Internal (Ward Floor Stock Consumption)</h2>
            <p className="text-xs text-slate-500 font-medium">
              Pencatatan Pemakaian BMHP/Alkes Non-Billing Untuk Operasional Ruangan & Cost Center Audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-right">
            <span className="text-[9px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400 block">Total Biaya Pemakaian</span>
            <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
              Rp {totalCostOverall.toLocaleString('id-ID')}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>+ Catat Pemakaian Internal</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kode Pemakaian, Cost Center, Alasan, atau Petugas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
          />
        </div>

        <div className="relative">
          <select
            value={selectedDept}
            onChange={e => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-3.5 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Ruangan / Depo</option>
            {MASTER_DEPARTMENTS.slice(0, 15).map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* TABLE LIST */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">Kode Transaksi & Waktu</th>
                <th className="py-2.5 px-3">Depo & Cost Center</th>
                <th className="py-2.5 px-3">Alasan Pemakaian</th>
                <th className="py-2.5 px-3">Rincian Barang Digunakan</th>
                <th className="py-2.5 px-3">Petugas Pengguna</th>
                <th className="py-2.5 px-3 text-right">Total Biaya (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {paginatedUses.map(use => (
                <tr key={use.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 font-mono">
                    <strong className="font-bold text-primary block">{use.useCode}</strong>
                    <span className="text-[10px] text-slate-400 block">{use.useDate}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold block w-fit mb-0.5">
                      {use.depo}
                    </span>
                    <strong className="text-slate-900 dark:text-white text-xs">{use.costCenter}</strong>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">
                    {use.reason}
                  </td>
                  <td className="py-3 px-3">
                    {use.items.map((it, idx) => (
                      <div key={idx} className="text-xs">
                        <strong className="text-slate-900 dark:text-white">{it.name}</strong> ({it.qty} {it.unit})
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {use.usedBy}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-xs">
                    Rp {(use.totalCost || 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="text-slate-500">
            Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredUses.length)} - {Math.min(currentPage * pageSize, filteredUses.length)} dari {filteredUses.length} Transaksi Pemakaian
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

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-2xl p-6 relative border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Catat Pemakaian Internal Operasional</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateInternalUse} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Depo / Ruangan:*</label>
                <div className="relative">
                  <select
                    value={newUse.depo}
                    onChange={e => setNewUse(prev => ({ 
                      ...prev, 
                      depo: e.target.value,
                      costCenter: `Operasional Ruangan ${e.target.value}`
                    }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                  >
                    {MASTER_DEPARTMENTS.slice(0, 20).map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Cost Center:*</label>
                <input
                  type="text"
                  value={newUse.costCenter}
                  onChange={e => setNewUse(prev => ({ ...prev, costCenter: e.target.value }))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Alasan Pemakaian:*</label>
                <input
                  type="text"
                  value={newUse.reason}
                  onChange={e => setNewUse(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Nama Barang Digunakan:*</label>
                <input
                  type="text"
                  value={newUse.itemName}
                  onChange={e => setNewItemForm(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Jumlah Qty:*</label>
                  <input
                    type="number"
                    value={newUse.qty}
                    onChange={e => setNewUse(prev => ({ ...prev, qty: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold text-center outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 font-bold uppercase text-[10px]">Harga Satuan (Rp):*</label>
                  <input
                    type="number"
                    value={newUse.unitPrice}
                    onChange={e => setNewUse(prev => ({ ...prev, unitPrice: e.target.value }))}
                    className="w-full h-9 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs shadow-md transition-all"
                >
                  Simpan Pemakaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
