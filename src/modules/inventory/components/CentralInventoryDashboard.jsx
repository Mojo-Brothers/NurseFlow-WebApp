/**
 * CentralInventoryDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Central Hospital Inventory Operations Dashboard
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useMemo } from 'react';
import { 
  Boxes, Package, DollarSign, AlertTriangle, AlertCircle, 
  Clock, ShieldAlert, FileText, Truck, ArrowRightLeft, 
  TrendingUp, TrendingDown, Layers, CheckCircle2, Search,
  RefreshCw, Building, Eye, ChevronRight, Scale
} from 'lucide-react';

export default function CentralInventoryDashboard({ items = [], requests = [], mutations = [], uses = [], adjustments = [], onNavigateTab }) {

  // KPI Calculations
  const stats = useMemo(() => {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const totalItems = items.length;
    const totalQty = items.reduce((acc, i) => acc + (Number(i.stockQty) || 0), 0);
    const totalValue = items.reduce((acc, i) => acc + ((Number(i.stockQty) || 0) * (Number(i.unitPrice) || 0)), 0);

    const lowStock = items.filter(i => (Number(i.stockQty) || 0) > 0 && (Number(i.stockQty) || 0) <= (Number(i.minStock) || 10));
    const outOfStock = items.filter(i => (Number(i.stockQty) || 0) === 0);

    const nearExpiry = items.filter(i => {
      if (!i.expiredDate) return false;
      const exp = new Date(i.expiredDate);
      return exp >= today && exp <= ninetyDaysFromNow;
    });

    const expired = items.filter(i => {
      if (!i.expiredDate) return false;
      return new Date(i.expiredDate) < today;
    });

    const quarantine = items.filter(i => i.status === 'QUARANTINE' || i.quarantineQty > 0);
    const damaged = items.filter(i => i.status === 'DAMAGED' || i.damagedQty > 0);

    const pendingRequests = requests.filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'SUBMITTED');
    const inTransitMutations = mutations.filter(m => m.status === 'IN_TRANSIT' || m.status === 'OUTBOUND_DISPATCHED');
    const pendingAdjustments = adjustments.filter(a => a.status === 'PENDING_APPROVAL');

    return {
      totalItems,
      totalQty,
      totalValue,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      nearExpiryCount: nearExpiry.length,
      expiredCount: expired.length,
      quarantineCount: quarantine.length,
      damagedCount: damaged.length,
      pendingRequestsCount: pendingRequests.length,
      inTransitMutationsCount: inTransitMutations.length,
      pendingAdjustmentsCount: pendingAdjustments.length,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      nearExpiryItems: nearExpiry,
      expiredItems: expired
    };
  }, [items, requests, mutations, adjustments]);

  // Category Breakdown
  const categorySummary = useMemo(() => {
    const map = {};
    items.forEach(item => {
      const cat = item.category || 'LAIN-LAIN';
      if (!map[cat]) {
        map[cat] = { count: 0, totalQty: 0, totalValue: 0 };
      }
      map[cat].count += 1;
      map[cat].totalQty += (Number(item.stockQty) || 0);
      map[cat].totalValue += ((Number(item.stockQty) || 0) * (Number(item.unitPrice) || 0));
    });
    return Object.entries(map).map(([category, val]) => ({ category, ...val }));
  }, [items]);

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* TOP SUMMARY CARDS (12 OPERATIONAL KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TOTAL MASTER ITEM */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('item_master')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#007399] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">TOTAL MASTER ITEM</span>
            <div className="w-9 h-9 rounded-xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold group-hover:bg-[#007399] group-hover:text-white transition-all">
              <Boxes size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalItems}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">Item Medis, Konsumabel, &amp; Logistik</div>
        </div>

        {/* KPI 2: TOTAL STOK FISIK */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">TOTAL STOK FISIK</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{stats.totalQty.toLocaleString('id-ID')}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">Kuantitas di Seluruh Depo &amp; Gudang</div>
        </div>

        {/* KPI 3: VALUASI INVENTARIS */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">VALUASI STOK (HPP)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">{formatIDR(stats.totalValue)}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">Total Nilai Persediaan Aktif</div>
        </div>

        {/* KPI 4: STOK KRITIS (LOW STOCK) */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('item_department')}
          className="p-5 rounded-2xl bg-amber-500/8 border border-amber-500/30 shadow-sm hover:bg-amber-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">STOK KRITIS (LOW STOCK)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.lowStockCount} Item</div>
          <div className="text-[10px] font-bold text-amber-600/80 mt-1">Stok &le; Reorder Minimum Limit</div>
        </div>

        {/* KPI 5: OUT OF STOCK */}
        <div className="p-5 rounded-2xl bg-rose-500/8 border border-rose-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">STOK KOSONG (HABIS)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.outOfStockCount} Item</div>
          <div className="text-[10px] font-bold text-rose-600/80 mt-1">Perlu Pembelian / Order Ulang Instan</div>
        </div>

        {/* KPI 6: NEAR EXPIRY (90 HARI) */}
        <div className="p-5 rounded-2xl bg-orange-500/8 border border-orange-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-400">HAMPIR ED (&le; 90 HARI)</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center font-bold">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-700 dark:text-orange-400">{stats.nearExpiryCount} Batch</div>
          <div className="text-[10px] font-bold text-orange-600/80 mt-1">Prinsip Utamakan FEFO Dispensing</div>
        </div>

        {/* KPI 7: EXPIRED (KADALUARSA) */}
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">KADALUARSA (EXPIRED)</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-red-700 dark:text-red-400">{stats.expiredCount} Batch</div>
          <div className="text-[10px] font-bold text-red-600/80 mt-1">Wajib Karantina / Pemusnahan</div>
        </div>

        {/* KPI 8: MATERIAL REQUEST PENDING */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('material_request')}
          className="p-5 rounded-2xl bg-indigo-500/8 border border-indigo-500/30 shadow-sm hover:bg-indigo-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">REQUEST PENDING</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{stats.pendingRequestsCount} Permintaan</div>
          <div className="text-[10px] font-bold text-indigo-600/80 mt-1">Menunggu Persetujuan Manajer</div>
        </div>

        {/* KPI 9: MUTASI IN TRANSIT */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('receive_mutasi')}
          className="p-5 rounded-2xl bg-cyan-500/8 border border-cyan-500/30 shadow-sm hover:bg-cyan-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">MUTASI IN TRANSIT</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-400">{stats.inTransitMutationsCount} Pengiriman</div>
          <div className="text-[10px] font-bold text-cyan-600/80 mt-1">Menunggu Konfirmasi Penerimaan Unit</div>
        </div>

        {/* KPI 10: STOK KARANTINA */}
        <div className="p-5 rounded-2xl bg-purple-500/8 border border-purple-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">STOK KARANTINA</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{stats.quarantineCount} Item</div>
          <div className="text-[10px] font-bold text-purple-600/80 mt-1">Dicegah dari Penggunaan Klinik</div>
        </div>

        {/* KPI 11: RECALL & STOK RUSAK */}
        <div className="p-5 rounded-2xl bg-slate-500/8 border border-slate-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">STOK RUSAK / DAMAGE</span>
            <div className="w-9 h-9 rounded-xl bg-slate-500/20 text-slate-600 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300">{stats.damagedCount} Item</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Klaim Retur Supplier / Penghapusan</div>
        </div>

        {/* KPI 12: OPNAME & ADJUSTMENT PENDING */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('stock_adjustment')}
          className="p-5 rounded-2xl bg-emerald-500/8 border border-emerald-500/30 shadow-sm hover:bg-emerald-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">OPNAME ADJUSTMENT</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
              <Scale size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.pendingAdjustmentsCount} Verifikasi</div>
          <div className="text-[10px] font-bold text-emerald-600/80 mt-1">Penyesuaian Fisik vs Sistem</div>
        </div>

      </div>

      {/* DASHBOARD MIDDLE SECTION: CATEGORY SUMMARY & LOW STOCK ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT 2 COLUMNS: CATEGORY BREAKDOWN TABLE */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <Layers className="text-[#007399]" size={20} />
                Ringkasan Persediaan per Kategori Material
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Distribusi kuantitas dan nilai aset persediaan rumah sakit</p>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Kategori Material</th>
                  <th className="py-3 px-4 text-center">Jumlah SKU / Item</th>
                  <th className="py-3 px-4 text-center">Total Stok Fisik</th>
                  <th className="py-3 px-4 text-right">Total Nilai HPP (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                {categorySummary.map((cat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#007399]"></span>
                      <span>{cat.category}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300 font-mono">{cat.count} SKU</td>
                    <td className="py-3 px-4 text-center text-teal-600 dark:text-teal-400 font-mono">{cat.totalQty.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-mono">{formatIDR(cat.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: LOW STOCK ALERTS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-amber-600 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle size={20} />
                Peringatan Stok Kritis ({stats.lowStockCount})
              </h3>
            </div>
            
            <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase text-amber-700 block">{item.code} • {item.depo}</span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1">{item.name}</h4>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-black text-amber-700 block">{item.stockQty} {item.unit}</span>
                      <span className="text-[9px] font-bold text-slate-400 block">Min: {item.minStock}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-emerald-700 uppercase">Seluruh Stok persediaan dalam kondisi aman.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('item_master')}
            className="mt-4 w-full py-3 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Buka Master Item Enterprise</span>
            <ChevronRight size={16} />
          </button>
        </div>

      </div>

    </div>
  );
}
