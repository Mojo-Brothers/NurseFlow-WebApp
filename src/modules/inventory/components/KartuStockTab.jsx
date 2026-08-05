import React, { useState } from 'react';
import { 
  BookOpen, Search, Filter, ArrowUpRight, ArrowDownLeft, 
  History, Building2, Calendar, Tag, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function KartuStockTab({ ledger, items }) {
  const [selectedItemCode, setSelectedItemCode] = useState('ALL');
  const [selectedDepo, setSelectedDepo] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLedger = ledger.filter(led => {
    if (selectedItemCode !== 'ALL' && led.itemCode !== selectedItemCode) return false;
    if (selectedDepo !== 'ALL' && led.depo !== selectedDepo) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      led.itemName.toLowerCase().includes(q) ||
      led.itemCode.toLowerCase().includes(q) ||
      led.refNo.toLowerCase().includes(q) ||
      led.batchNo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-on-surface">Kartu Stock (Batch Stock Ledger Card)</h3>
          <p className="text-xs text-on-surface-variant font-medium">
            Buku Besar Jejak Alur Pergerakan Fisik Stok Barang & No. Batch (Masuk, Keluar, & Saldo Akhir)
          </p>
        </div>

        {/* Filter Selection Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedItemCode}
            onChange={e => setSelectedItemCode(e.target.value)}
            className="bg-surface-container-high border border-outline-variant/30 px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            <option value="ALL">-- Pilih Filter Barang --</option>
            {items.map(i => (
              <option key={i.id} value={i.code}>{i.name} ({i.code})</option>
            ))}
          </select>

          <select
            value={selectedDepo}
            onChange={e => setSelectedDepo(e.target.value)}
            className="bg-surface-container-high border border-outline-variant/30 px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            <option value="ALL">Semua Depo</option>
            <option value="DEPO_IGD">DEPO IGD</option>
            <option value="DEPO_OK">DEPO OK</option>
            <option value="DEPO_RAWAT_INAP">DEPO RAWAT INAP</option>
          </select>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="glass-panel p-3 rounded-2xl border border-outline-variant/30 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          type="text"
          placeholder="Cari No. Referensi Transaksi, Batch No, atau Nama Obat/Alkes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2 text-xs font-bold"
        />
      </div>

      {/* LEDGER TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] font-black uppercase text-on-surface-variant">
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Barang & Depo</th>
                <th className="py-3 px-4">Batch No & Expired</th>
                <th className="py-3 px-4 text-emerald-600 font-black">Masuk (IN)</th>
                <th className="py-3 px-4 text-rose-600 font-black">Keluar (OUT)</th>
                <th className="py-3 px-4 font-black">Saldo Akhir</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium">
              {filteredLedger.map(led => (
                <tr key={led.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4 font-mono opacity-80">
                    {led.date}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {led.refNo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] text-slate-400 block">{led.itemCode}</span>
                    <strong className="text-on-surface">{led.itemName}</strong>
                    <span className="text-[10px] opacity-70 block">({led.depo})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <span className="block font-bold">{led.batchNo}</span>
                    <span className="text-[10px] opacity-60">Exp: {led.expiredDate}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-emerald-600 text-sm">
                    {led.qtyIn > 0 ? `+${led.qtyIn}` : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-rose-600 text-sm">
                    {led.qtyOut > 0 ? `-${led.qtyOut}` : '-'}
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-on-surface text-sm">
                    {led.balance}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-bold">
                    {led.operator}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
