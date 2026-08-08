/**
 * WarehouseLocationWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Hospital Physical Warehouse & Storage Location Hierarchy System
 * Hierarchy: Hospital ➔ Warehouse ➔ Storage Area ➔ Rack ➔ Shelf ➔ Bin
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState, useMemo } from 'react';
import { 
  Building, MapPin, Layers, Boxes, Plus, Search, Filter, 
  CheckCircle2, AlertTriangle, ShieldCheck, Thermometer, Droplets,
  Edit2, Trash2, X, Eye, ChevronRight, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WarehouseLocationWorkspace({ items = [] }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Warehouse Hierarchy Data
  const WAREHOUSES = [
    {
      id: 'wh-001',
      code: 'WH-CENTRAL-MED',
      name: 'Gudang Logistik Medik Sentral',
      hospital: 'RS NURSEFLOW ENTERPRISE',
      type: 'CENTRAL_WAREHOUSE',
      manager: 'Apt. Budi Santoso, S.Farm',
      tempRange: '15°C - 25°C (Suhu Kamar AC)',
      humidity: '55%',
      racksCount: 12,
      binsCount: 144,
      areas: [
        { name: 'Area A - Tablet & Oral', rack: 'RACK-A01 s/d A04', binCount: 48 },
        { name: 'Area B - Cairan Infus & BMHP', rack: 'RACK-B01 s/d B04', binCount: 48 },
        { name: 'Area C - Cold Chain (2-8°C)', rack: 'CHILLER-C01', binCount: 12 },
        { name: 'Area D - Narkotika & Psikotropika', rack: 'BRANKAS-D01', binCount: 6 }
      ]
    },
    {
      id: 'wh-002',
      code: 'WH-FARMASI-CENTRAL',
      name: 'Depo Farmasi Central & Inpatient',
      hospital: 'RS NURSEFLOW ENTERPRISE',
      type: 'PHARMACY_DEPO',
      manager: 'Apt. Rina Pratama, S.Farm',
      tempRange: '18°C - 24°C',
      humidity: '50%',
      racksCount: 8,
      binsCount: 96,
      areas: [
        { name: 'Rak Fast Moving Oral', rack: 'RACK-FMO-01', binCount: 24 },
        { name: 'Rak Injeksi & Ampul', rack: 'RACK-INJ-01', binCount: 24 },
        { name: 'Chiller Vaksin & Insulin', rack: 'CHILLER-VAK-01', binCount: 12 }
      ]
    },
    {
      id: 'wh-003',
      code: 'WH-UGD',
      name: 'Gudang & Depo Satelit UGD',
      hospital: 'RS NURSEFLOW ENTERPRISE',
      type: 'EMERGENCY_DEPO',
      manager: 'Ns. Ratna Marlina, S.Kep',
      tempRange: '20°C - 25°C',
      humidity: '60%',
      racksCount: 4,
      binsCount: 32,
      areas: [
        { name: 'Troli Resusitasi & Emergency', rack: 'TROLI-UGD-01', binCount: 12 },
        { name: 'Rak BMHP Bedah UGD', rack: 'RACK-BDH-01', binCount: 20 }
      ]
    },
    {
      id: 'wh-004',
      code: 'WH-OK-SURGICAL',
      name: 'Gudang Steril Ruang Operasi (OK)',
      hospital: 'RS NURSEFLOW ENTERPRISE',
      type: 'SURGICAL_DEPO',
      manager: 'Staf Admin Ruang Operasi',
      tempRange: '18°C - 22°C (Positive Pressure)',
      humidity: '45%',
      racksCount: 6,
      binsCount: 64,
      areas: [
        { name: 'Rak Implan & Benang Bedah', rack: 'RACK-IMP-01', binCount: 24 },
        { name: 'Rak Anestesi & Gas Medis', rack: 'RACK-ANS-01', binCount: 16 }
      ]
    }
  ];

  // Bins Level Data
  const BINS = [
    { code: 'BIN-A01-01', warehouse: 'Gudang Logistik Medik Sentral', area: 'Area A - Tablet & Oral', rack: 'RACK-A01', shelf: 'SHELF-01', item: 'Paracetamol 500mg Tablet', qty: 500, unit: 'Tablet' },
    { code: 'BIN-A01-02', warehouse: 'Gudang Logistik Medik Sentral', area: 'Area A - Tablet & Oral', rack: 'RACK-A01', shelf: 'SHELF-02', item: 'Amoxicillin 500mg Kaplet', qty: 800, unit: 'Kaplet' },
    { code: 'BIN-B01-05', warehouse: 'Gudang Logistik Medik Sentral', area: 'Area B - Cairan Infus & BMHP', rack: 'RACK-B01', shelf: 'SHELF-03', item: 'Cairan Infus NaCl 0.9% 500ml', qty: 450, unit: 'Botol' },
    { code: 'BIN-C01-02', warehouse: 'Gudang Logistik Medik Sentral', area: 'Area C - Cold Chain (2-8°C)', rack: 'CHILLER-C01', shelf: 'SHELF-01', item: 'Vaksin Hepatitis B Inj', qty: 40, unit: 'Vial' },
    { code: 'BIN-D01-01', warehouse: 'Gudang Logistik Medik Sentral', area: 'Area D - Narkotika & Psikotropika', rack: 'BRANKAS-D01', shelf: 'LOCK-01', item: 'Fentanyl Injeksi 0.05mg/ml', qty: 50, unit: 'Ampul' }
  ];

  const filteredWarehouses = useMemo(() => {
    return WAREHOUSES.filter(w => {
      const matchSearch = `
        ${w.name} 
        ${w.code} 
        ${w.manager} 
        ${w.type}
      `.toLowerCase().includes(searchQuery.toLowerCase());

      const matchWh = selectedWarehouse === 'ALL' || w.id === selectedWarehouse;
      return matchSearch && matchWh;
    });
  }, [searchQuery, selectedWarehouse]);

  const handleAddBin = (e) => {
    e.preventDefault();
    toast.success('Lokasi Rak / Bin Fisik Baru berhasil ditambahkan ke Hirarki Gudang!');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Cari Gudang, Manajer, Rak, atau Bin..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#007399]"
            />
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Tambah Bin / Lokasi Rak Fisik Baru</span>
        </button>
      </div>

      {/* WAREHOUSE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredWarehouses.map((wh, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#007399]/40 transition-all">
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
                  <Building size={20} />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-black text-[#007399] bg-[#007399]/10 px-2 py-0.5 rounded-md border border-[#007399]/20">{wh.code}</span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1">{wh.name}</h3>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {wh.type}
              </span>
            </div>

            {/* Warehouse Details */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-bold">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">MANAJER GUDANG</span>
                <span className="text-slate-800 dark:text-slate-100">{wh.manager}</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">SUHU &amp; KELEMBABAN</span>
                <span className="text-[#007399] flex items-center gap-1">
                  <Thermometer size={12} /> {wh.tempRange} • {wh.humidity}
                </span>
              </div>
            </div>

            {/* Storage Areas */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">AREA PENYIMPANAN &amp; LOKASI RAK FISIK</span>
              {wh.areas.map((area, aIdx) => (
                <div key={aIdx} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-800 dark:text-slate-200 block">{area.name}</span>
                    <span className="text-[9px] font-mono text-slate-400">{area.rack}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#007399]/10 text-[#007399] rounded-md">
                    {area.binCount} Bins
                  </span>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

      {/* PHYSICAL BINS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <MapPin className="text-[#007399]" size={18} />
            Peta Lokasi Bin Fisik &amp; Posisi Item (Peta Gudang)
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">Kode Bin</th>
                <th className="py-3.5 px-4">Gudang &amp; Area</th>
                <th className="py-3.5 px-4">Rak &amp; Shelf</th>
                <th className="py-3.5 px-4">Item Terimpan</th>
                <th className="py-3.5 px-4 text-center">Stok di Bin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {BINS.map((bin, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono font-black text-[#007399] bg-[#007399]/10 px-2.5 py-1 rounded-lg border border-[#007399]/20">
                      {bin.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800 dark:text-slate-100 block">{bin.warehouse}</span>
                    <span className="text-[9px] text-slate-400 block">{bin.area}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 block">{bin.rack} • {bin.shelf}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-100">
                    {bin.item}
                  </td>
                  <td className="py-3.5 px-4 text-center text-teal-600 font-mono">
                    {bin.qty} {bin.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase">Tambah Lokasi Bin Fisik Baru</h3>
                  <p className="text-xs text-slate-500 font-medium">Hospital Warehouse Physical Location Hierarchy</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddBin} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">GUDANG UTAMA *</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100">
                  {WAREHOUSES.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">KODE RAK (RACK ID) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: RACK-A01"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">NOMOR SHELF / AMBALAN *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: SHELF-03"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">KODE BIN LOKASI FISIK *</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: BIN-A01-03-05"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-800 dark:text-slate-100"
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
                  Simpan Lokasi Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
