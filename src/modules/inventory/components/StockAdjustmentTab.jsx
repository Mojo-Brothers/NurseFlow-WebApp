import React, { useState } from 'react';
import { 
  Scale, Plus, Search, Filter, AlertCircle, CheckCircle2, 
  ShieldCheck, FileText, UserCheck, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockAdjustmentTab({ adjustments, items }) {
  const [adjList, setAdjList] = useState(adjustments || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newAdj, setNewAdj] = useState({
    depo: 'DEPO_RAWAT_INAP',
    itemCode: 'MED-CTX-1G',
    itemName: 'Ceftriaxone Inj 1gr Vial',
    batchNo: 'BTC-2026-0105',
    systemQty: 10,
    physicalQty: 8,
    reason: 'Kerusakan / Vial Pecah Saat Handling',
    adjustedBy: 'Ns. Ratna M.'
  });

  const filteredAdjustments = adjList.filter(adj => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      adj.adjCode.toLowerCase().includes(q) ||
      adj.itemName.toLowerCase().includes(q) ||
      adj.reason.toLowerCase().includes(q)
    );
  });

  const handleCreateAdjustment = (e) => {
    e.preventDefault();
    const variance = newAdj.physicalQty - newAdj.systemQty;

    const created = {
      id: `adj-${Date.now()}`,
      adjCode: `ADJ-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(10 + Math.random()*90)}`,
      adjDate: new Date().toLocaleString('id-ID'),
      depo: newAdj.depo,
      itemCode: newAdj.itemCode,
      itemName: newAdj.itemName,
      batchNo: newAdj.batchNo,
      systemQty: newAdj.systemQty,
      physicalQty: newAdj.physicalQty,
      variance: variance,
      reason: newAdj.reason,
      adjustedBy: newAdj.adjustedBy,
      status: 'APPROVED'
    };

    setAdjList(prev => [created, ...prev]);
    toast.success(`Stock Adjustment ${created.adjCode} Berhasil Disimpan & Disetujui!`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-on-surface">Stock Adjustment (Penyesuaian Stok Opname)</h3>
          <p className="text-xs text-on-surface-variant font-medium">
            Form Penyesuaian Kuantitas Fisik vs Sistem (Opname, Kerusakan, Kadaluarsa, & Defisit)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>+ Buat Penyesuaian (Stock Opname)</span>
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="glass-panel p-3 rounded-2xl border border-outline-variant/30 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          type="text"
          placeholder="Cari Kode Adjustment, Nama Obat, atau Alasan Penyesuaian..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2 text-xs font-bold"
        />
      </div>

      {/* ADJUSTMENT TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] font-black uppercase text-on-surface-variant">
                <th className="py-3 px-4">No. Adjustment & Tanggal</th>
                <th className="py-3 px-4">Depo & Barang</th>
                <th className="py-3 px-4">No. Batch</th>
                <th className="py-3 px-4">Stok Sistem</th>
                <th className="py-3 px-4">Stok Fisik</th>
                <th className="py-3 px-4 font-black">Selisih (Variance)</th>
                <th className="py-3 px-4">Alasan Adjustment</th>
                <th className="py-3 px-4 text-right">Otorisasi Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium">
              {filteredAdjustments.map(adj => (
                <tr key={adj.id} className="hover:bg-surface-container-low/60 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <span className="font-bold text-primary block">{adj.adjCode}</span>
                    <span className="text-[10px] opacity-60 block">{adj.adjDate}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold block w-fit mb-0.5">
                      {adj.depo}
                    </span>
                    <strong className="text-on-surface text-xs block">{adj.itemName}</strong>
                    <span className="font-mono text-[10px] text-slate-400">{adj.itemCode}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {adj.batchNo}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {adj.systemQty} Pcs
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-on-surface">
                    {adj.physicalQty} Pcs
                  </td>
                  <td className="py-3 px-4 font-mono font-black text-sm">
                    {adj.variance < 0 ? (
                      <span className="text-rose-600 font-black">{adj.variance} Pcs (Defisit)</span>
                    ) : adj.variance > 0 ? (
                      <span className="text-emerald-600 font-black">+{adj.variance} Pcs (Surplus)</span>
                    ) : (
                      <span className="text-slate-400 font-bold">0 (Sesuai)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-bold">
                    {adj.reason}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-500/20">
                      Approved ({adj.adjustedBy})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative border border-outline-variant/40 shadow-2xl">
            <h3 className="text-base font-black text-on-surface mb-4">Input Penyesuaian Stok Opname (Stock Adjustment)</h3>
            
            <form onSubmit={handleCreateAdjustment} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1 opacity-80">Depo / Ruangan:*</label>
                <select
                  value={newAdj.depo}
                  onChange={e => setNewAdj(prev => ({ ...prev, depo: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                >
                  <option value="DEPO_IGD">DEPO IGD</option>
                  <option value="DEPO_OK">DEPO OK (Kamar Bedah)</option>
                  <option value="DEPO_RAWAT_INAP">DEPO RAWAT INAP</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 opacity-80">Pilih Barang:*</label>
                <select
                  onChange={e => {
                    const sel = items.find(i => i.code === e.target.value);
                    if (sel) {
                      setNewAdj(prev => ({
                        ...prev,
                        itemCode: sel.code,
                        itemName: sel.name,
                        batchNo: sel.batchNo,
                        systemQty: sel.stockQty
                      }));
                    }
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.code}>{i.name} (Stok System: {i.stockQty} {i.unit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 opacity-80">Stok Sistem (Recorded):</label>
                  <input
                    type="number"
                    readOnly
                    value={newAdj.systemQty}
                    className="w-full bg-surface-container border border-outline-variant p-2.5 rounded-xl font-mono text-sm font-black opacity-70"
                  />
                </div>
                <div>
                  <label className="block mb-1 opacity-80">Stok Fisik Hasil Opname:*</label>
                  <input
                    type="number"
                    min="0"
                    value={newAdj.physicalQty}
                    onChange={e => setNewAdj(prev => ({ ...prev, physicalQty: Number(e.target.value) || 0 }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono text-sm font-black text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 opacity-80">Alasan Penyesuaian:*</label>
                <select
                  value={newAdj.reason}
                  onChange={e => setNewAdj(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                >
                  <option value="Kerusakan / Vial Pecah Saat Handling">Kerusakan / Vial Pecah Saat Handling</option>
                  <option value="Kadaluarsa (Expired Date)">Kadaluarsa (Expired Date)</option>
                  <option value="Selisih Hitung Opname Fisik">Selisih Hitung Opname Fisik</option>
                  <option value="Hilang / Selisih Administrasi">Hilang / Selisih Administrasi</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-outline-variant/30">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-surface-container rounded-xl">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-black">
                  Simpan Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
