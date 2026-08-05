import React, { useState } from 'react';
import { X, Package, Plus, Trash2, Save, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceBundleModal({ services, onClose, onSaveSuccess }) {
  const [bundleForm, setBundleForm] = useState({
    name: 'Paket MCU Executive & Screening Jantung',
    code: 'BND-MCU-001',
    category: 'MCU_PAKET',
    flatPrice: 850000,
    items: [
      { serviceId: 'srv-101', name: 'Konsultasi & Pemeriksaan Dokter Spesialis Penyakit Dalam', price: 250000 },
      { serviceId: 'srv-102', name: 'Pemeriksaan EKG 12 Lead & Interprestasi Hasil', price: 175000 },
      { serviceId: 'srv-103', name: 'Panel Hematologi Lengkap & Troponin I', price: 320000 },
      { serviceId: 'srv-104', name: 'Foto Thorax AP/PA & Ekspertise Radiologi', price: 280000 }
    ]
  });

  const originalTotalPrice = bundleForm.items.reduce((sum, item) => sum + item.price, 0);

  const handleAddItem = (srvId) => {
    const srv = services.find(s => s.id === srvId);
    if (!srv) return;
    if (bundleForm.items.some(i => i.serviceId === srvId)) {
      toast.error('Layanan ini sudah ada dalam paket!');
      return;
    }

    setBundleForm(prev => ({
      ...prev,
      items: [...prev.items, { serviceId: srv.id, name: srv.name, price: srv.totalTariff || 100000 }]
    }));
  };

  const handleRemoveItem = (srvId) => {
    setBundleForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.serviceId !== srvId)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bundleForm.name.trim()) return toast.error('Nama Paket Wajib Diisi!');
    if (bundleForm.items.length === 0) return toast.error('Paket harus berisi minimal 1 layanan!');

    toast.success(`Paket Bundling "${bundleForm.name}" Berhasil Disimpan!`);
    onSaveSuccess(bundleForm);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 relative shadow-2xl overflow-hidden border border-outline-variant/40 animate-scale-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shadow-sm">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-on-surface">
                Konfigurasi Paket Layanan Medis (Clinical Bundling)
              </h3>
              <p className="text-xs text-on-surface-variant/70 font-medium">
                Buat Paket MCU, Paket Persalinan, atau Paket Bedah dengan Harga Flat / Diskon Terikat
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 text-xs font-bold flex-1">
          <div>
            <label className="block mb-1 opacity-80">Nama Paket Layanan:*</label>
            <input
              type="text"
              required
              value={bundleForm.name}
              onChange={e => setBundleForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-black text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 opacity-80">Kode Paket:</label>
              <input
                type="text"
                value={bundleForm.code}
                onChange={e => setBundleForm(prev => ({ ...prev, code: e.target.value }))}
                className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block mb-1 opacity-80">Tarif Flat Paket (Rp):*</label>
              <input
                type="number"
                value={bundleForm.flatPrice}
                onChange={e => setBundleForm(prev => ({ ...prev, flatPrice: Number(e.target.value) || 0 }))}
                className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono text-primary text-sm font-black"
              />
            </div>
          </div>

          {/* Add Item Selection Dropdown */}
          <div className="space-y-2 pt-2 border-t border-outline-variant/20">
            <label className="block opacity-80">Tambahkan Layanan ke Paket:</label>
            <select
              onChange={e => {
                if (e.target.value) {
                  handleAddItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full bg-surface-container-high border border-outline-variant p-2.5 rounded-xl font-bold cursor-pointer"
            >
              <option value="">-- Pilih Layanan dari Katalog Master --</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Rp {(s.totalTariff || 0).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* Item List Table */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider block">
              Daftar Komponen Layanan Dalam Paket ({bundleForm.items.length} Item)
            </span>
            <div className="rounded-xl border border-outline-variant/30 overflow-hidden divide-y divide-outline-variant/20">
              {bundleForm.items.map((item, idx) => (
                <div key={item.serviceId} className="p-3 flex items-center justify-between gap-3 hover:bg-surface-container-low/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{idx + 1}.</span>
                    <span className="font-bold text-on-surface">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.serviceId)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Price Card */}
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-600 block">Total Akumulasi Tarif Normal</span>
              <span className="text-sm font-black line-through text-slate-400">Rp {originalTotalPrice.toLocaleString('id-ID')}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-600 block">Tarif Flat Paket Bundling</span>
              <span className="text-lg font-black text-purple-600 dark:text-purple-400">Rp {bundleForm.flatPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-surface-container rounded-xl font-bold">
              Batal
            </button>
            <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md flex items-center gap-1.5">
              <Save size={16} />
              <span>Simpan Paket Bundling</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
