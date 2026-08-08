/**
 * ExpiryManagementWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Specialized Expiry Management, FEFO Dispatch Engine, & Expired Stock Disposal
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, ShieldAlert, AlertTriangle, CheckCircle2, Search, Filter, 
  Trash2, ArrowRight, RefreshCw, Calendar, Package, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpiryManagementWorkspace({ items = [] }) {
  const [filterRange, setFilterRange] = useState('ALL'); // ALL, EXPIRED, NEAR_30, NEAR_60, NEAR_90
  const [searchQuery, setSearchQuery] = useState('');

  const expiryData = useMemo(() => {
    const today = new Date();
    
    return items.map(item => {
      const expDate = item.expiredDate ? new Date(item.expiredDate) : null;
      let status = 'SAFE';
      let daysRemaining = 999;

      if (expDate) {
        const diffTime = expDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) status = 'EXPIRED';
        else if (daysRemaining <= 30) status = 'NEAR_30';
        else if (daysRemaining <= 60) status = 'NEAR_60';
        else if (daysRemaining <= 90) status = 'NEAR_90';
      }

      return { ...item, daysRemaining, expiryStatus: status };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return expiryData.filter(item => {
      const matchSearch = `${item.name} ${item.code} ${item.batchNo} ${item.depo}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterRange === 'ALL' || item.expiryStatus === filterRange;
      return matchSearch && matchStatus;
    });
  }, [expiryData, searchQuery, filterRange]);

  const summary = useMemo(() => {
    const expired = expiryData.filter(i => i.expiryStatus === 'EXPIRED').length;
    const near30 = expiryData.filter(i => i.expiryStatus === 'NEAR_30').length;
    const near60 = expiryData.filter(i => i.expiryStatus === 'NEAR_60').length;
    const near90 = expiryData.filter(i => i.expiryStatus === 'NEAR_90').length;
    return { expired, near30, near60, near90 };
  }, [expiryData]);

  const handleDisposal = (item) => {
    toast.success(`Berhasil mengajukan pemusnahan stok kadaluarsa: ${item.name} [Batch: ${item.batchNo}]`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterRange('EXPIRED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${filterRange === 'EXPIRED' ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-red-500/10 border-red-500/30 text-red-700'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">KADALUARSA (EXPIRED)</span>
            <ShieldAlert size={18} />
          </div>
          <div className="text-2xl font-black">{summary.expired} Batch</div>
          <div className="text-[10px] font-bold opacity-80 mt-1">Blokir Otomatis &amp; Siapkan Berita Acara</div>
        </div>

        <div 
          onClick={() => setFilterRange('NEAR_30')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${filterRange === 'NEAR_30' ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-orange-500/10 border-orange-500/30 text-orange-700'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">CRITICAL (&le; 30 HARI)</span>
            <Clock size={18} />
          </div>
          <div className="text-2xl font-black">{summary.near30} Batch</div>
          <div className="text-[10px] font-bold opacity-80 mt-1">FEFO Priority Dispatch Level 1</div>
        </div>

        <div 
          onClick={() => setFilterRange('NEAR_60')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${filterRange === 'NEAR_60' ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-amber-500/10 border-amber-500/30 text-amber-700'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">WARNING (&le; 60 HARI)</span>
            <AlertTriangle size={18} />
          </div>
          <div className="text-2xl font-black">{summary.near60} Batch</div>
          <div className="text-[10px] font-bold opacity-80 mt-1">FEFO Priority Dispatch Level 2</div>
        </div>

        <div 
          onClick={() => setFilterRange('NEAR_90')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${filterRange === 'NEAR_90' ? 'bg-teal-500 text-white border-teal-600 shadow-md' : 'bg-teal-500/10 border-teal-500/30 text-teal-700'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">MONITORING (&le; 90 HARI)</span>
            <Calendar size={18} />
          </div>
          <div className="text-2xl font-black">{summary.near90} Batch</div>
          <div className="text-[10px] font-bold opacity-80 mt-1">Monitoring Mutasi Antar-Depo</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Cari SKU, Nama Item, Batch Number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterRange('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase ${filterRange === 'ALL' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Semua Batch
          </button>
        </div>
      </div>

      {/* EXPIRY CONTROL TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-[#007399]" size={18} />
            Pengendalian Kadaluarsa &amp; FEFO Dispatch Engine ({filteredItems.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Nama Item &amp; Kode</th>
                <th className="py-3.5 px-4">Nomor Batch / Lot</th>
                <th className="py-3.5 px-4 text-center">Tanggal Kadaluarsa</th>
                <th className="py-3.5 px-4 text-center">Sisa Hari</th>
                <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                <th className="py-3.5 px-4 text-center">Rekomendasi FEFO</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {filteredItems.map((item, idx) => {
                const isExp = item.expiryStatus === 'EXPIRED';
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-[#007399] font-black block">{item.code}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{item.name}</span>
                      <span className="text-[9px] text-slate-400 block">{item.depo}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {item.batchNo || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {item.expiredDate || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${isExp ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                        {isExp ? 'KADALUARSA' : `${item.daysRemaining} Hari`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-teal-600">
                      {item.stockQty} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isExp ? (
                        <span className="text-[9px] font-black uppercase text-red-600 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                          BLOKIR DISPENSING
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          KELUARKAN DULUAN (FEFO 1)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isExp ? (
                        <button 
                          onClick={() => handleDisposal(item)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                        >
                          Pemusnahan
                        </button>
                      ) : (
                        <button className="px-3 py-1.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm">
                          Prioritaskan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
