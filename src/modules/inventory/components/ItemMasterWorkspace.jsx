/**
 * ItemMasterWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Enterprise Item Master Workspace & Product Catalog Management
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState, useMemo } from 'react';
import { 
  Boxes, Search, Filter, Plus, Edit2, Barcode, Package, 
  CheckCircle2, AlertTriangle, ShieldCheck, Trash2, X, Eye, 
  Tag, Layers, DollarSign, RefreshCw, Thermometer, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ItemMasterWorkspace({ items = [], onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDepo, setSelectedDepo] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    sku: '',
    barcode: '',
    name: '',
    category: 'OBAT',
    depo: 'GUDANG_UTAMA',
    unit: 'Pcs',
    stockQty: 100,
    minStock: 20,
    maxStock: 500,
    unitPrice: 5000,
    batchNo: 'BTC-2026-001',
    expiredDate: '2028-12-31',
    storageCondition: 'SUHU_KAMAR',
    expiryRequired: true,
    batchRequired: true,
    serialRequired: false
  });

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category || 'OBAT'));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const depos = useMemo(() => {
    const set = new Set(items.map(i => i.depo || 'GUDANG_UTAMA'));
    return ['ALL', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = `
        ${item.name || ''} 
        ${item.code || ''} 
        ${item.sku || ''} 
        ${item.barcode || ''} 
        ${item.batchNo || ''}
      `.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchDepo = selectedDepo === 'ALL' || item.depo === selectedDepo;

      return matchSearch && matchCategory && matchDepo;
    });
  }, [items, searchQuery, selectedCategory, selectedDepo]);

  const handleOpenAddModal = () => {
    const randomCode = `ITEM-${Math.floor(1000 + Math.random() * 9000)}`;
    setEditingItem(null);
    setFormData({
      code: randomCode,
      sku: `SKU-${randomCode}`,
      barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: '',
      category: 'OBAT',
      depo: 'GUDANG_UTAMA',
      unit: 'Pcs',
      stockQty: 100,
      minStock: 20,
      maxStock: 500,
      unitPrice: 5000,
      batchNo: `BTC-2026-${Math.floor(100 + Math.random() * 900)}`,
      expiredDate: '2028-12-31',
      storageCondition: 'SUHU_KAMAR',
      expiryRequired: true,
      batchRequired: true,
      serialRequired: false
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Nama Item dan Kode Item wajib diisi!');
      return;
    }
    toast.success(`Master Item [${formData.code}] - ${formData.name} berhasil disimpan!`);
    setIsModalOpen(false);
    if (onRefresh) onRefresh();
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* WORKSPACE TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari SKU, Barcode, Nama Item, Batch..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007399]"
            />
          </div>

          <div className="relative">
            <select 
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007399] appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.filter(c => c !== 'ALL').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select 
              value={selectedDepo}
              onChange={e => setSelectedDepo(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007399] appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Depo / Gudang</option>
              {depos.filter(d => d !== 'ALL').map(depo => (
                <option key={depo} value={depo}>{depo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Item Master Baru</span>
          </button>
        </div>
      </div>

      {/* ITEMS CATALOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Boxes className="text-[#007399]" size={18} />
            Katalog Item Master Persediaan ({filteredItems.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode / Barcode</th>
                <th className="py-3.5 px-4">Nama Item &amp; Spesifikasi</th>
                <th className="py-3.5 px-4">Kategori &amp; Lokasi Depo</th>
                <th className="py-3.5 px-4 text-center">Batch / Expiry</th>
                <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                <th className="py-3.5 px-4 text-right">Harga HPP</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {filteredItems.map((item, idx) => {
                const isLow = Number(item.stockQty) <= Number(item.minStock);
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono font-black text-[#007399] bg-[#007399]/10 px-2 py-0.5 rounded-md border border-[#007399]/20 block w-fit mb-0.5">
                        {item.code}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block">{item.barcode || item.sku || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-100 font-black text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Satuan: {item.unit || 'Pcs'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 block">{item.category || 'OBAT'}</span>
                      <span className="text-[9px] font-bold text-[#007399] uppercase block">{item.depo || 'GUDANG_UTAMA'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 block">{item.batchNo || '-'}</span>
                      <span className="text-[9px] font-mono text-amber-600 block">{item.expiredDate || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${isLow ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : 'bg-teal-500/10 text-teal-700 border-teal-500/30'}`}>
                        {item.stockQty} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatIDR(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setFormData({ ...item });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white transition-colors text-slate-600 dark:text-slate-300"
                        title="Edit Master Item"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">
                    {editingItem ? 'Edit Master Item Persediaan' : 'Tambah Master Item Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Enterprise Supply Chain Master Catalog</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">KODE ITEM *</label>
                  <input 
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">BARCODE / SKU</label>
                  <input 
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">NAMA ITEM &amp; FORMULASI *</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Paracetamol 500mg Tablet / IV Infus..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">KATEGORI</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="OBAT">OBAT / PHARMACEUTICAL</option>
                    <option value="BMHP">BMHP / CONSUMABLE</option>
                    <option value="ALKES">ALKES / EQUIPMENT</option>
                    <option value="IMPLANT">IMPLANT / SURGICAL</option>
                    <option value="LABORATORIUM">LABORATORIUM / REAGENT</option>
                    <option value="LINEN">LINEN / LAUNDRY</option>
                    <option value="UMUM">LOGISTIK UMUM</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">SATUAN (UOM)</label>
                  <input 
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">HARGA HPP (IDR)</label>
                  <input 
                    type="number"
                    value={formData.unitPrice}
                    onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">STOK AWAL</label>
                  <input 
                    type="number"
                    value={formData.stockQty}
                    onChange={e => setFormData({...formData, stockQty: Number(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-amber-600 block mb-1">MINIMUM STOK</label>
                  <input 
                    type="number"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-teal-600 block mb-1">MAXIMUM STOK</label>
                  <input 
                    type="number"
                    value={formData.maxStock}
                    onChange={e => setFormData({...formData, maxStock: Number(e.target.value)})}
                    className="w-full p-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 text-xs font-bold text-teal-700"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 block">KONTROL EXPIRY &amp; FEFO</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Wajibkan pencatatan Batch &amp; Expiry Date saat penerimaan barang</span>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.expiryRequired}
                  onChange={e => setFormData({...formData, expiryRequired: e.target.checked})}
                  className="w-5 h-5 accent-[#007399] rounded cursor-pointer"
                />
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-3 -mx-6 -mb-6 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#007399] hover:bg-teal-700 text-white text-xs font-black uppercase shadow-sm cursor-pointer"
                >
                  Simpan Master Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
