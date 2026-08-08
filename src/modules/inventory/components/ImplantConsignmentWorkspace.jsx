/**
 * ImplantConsignmentWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Surgical & Implant Inventory, UDI Serial Tracking, & Vendor Consignment Management
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Scissors, Hash, User, Building, CheckCircle2, ShieldCheck, 
  Search, Plus, Layers, DollarSign, Tag, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImplantConsignmentWorkspace({ items = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('IMPLANTS'); // IMPLANTS, CONSIGNMENT, SERIALS

  // Mock Implants & Consignment Data
  const IMPLANTS = [
    { udi: 'UDI-(01)008892110291(21)SN-994812', name: 'Titanium Orthopedic Plate 8-Hole', category: 'IMPLANT ORTOPEDI', manufacturer: 'Stryker Orthopedics', serialNo: 'SN-994812', lotNo: 'LOT-2026-08', location: 'Gudang Steril Ruang Operasi (OK)', qty: 4, unit: 'Set', unitCost: 15500000, supplier: 'PT Medika Ortho Utama', consignmentStatus: 'CONSIGNMENT_ACTIVE' },
    { udi: 'UDI-(01)008892110442(21)SN-882019', name: 'Coronary Stent Cobalt Chromium 3.0x18mm', category: 'IMPLANT CATH LAB', manufacturer: 'Medtronic Cardiology', serialNo: 'SN-882019', lotNo: 'LOT-2026-11', location: 'Gudang Cath Lab Unit', qty: 6, unit: 'Pcs', unitCost: 22000000, supplier: 'PT Kardia Nusantara', consignmentStatus: 'CONSIGNMENT_ACTIVE' }
  ];

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
            <Scissors size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                SURGICAL &amp; IMPLANT ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">UDI &amp; Consignment Billing Trigger</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Implant Traceability &amp; Vendor Consignment Stock
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('IMPLANTS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'IMPLANTS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Stok Implan &amp; UDI Serial
          </button>
          <button 
            onClick={() => setActiveSubTab('CONSIGNMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'CONSIGNMENT' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Barang Konsinyasi Supplier
          </button>
        </div>
      </div>

      {/* IMPLANTS CATALOG TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Tag className="text-[#007399]" size={18} />
            Daftar Implan Bedah &amp; Pelacakan UDI Barcode ({IMPLANTS.length})
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                <th className="py-3.5 px-4">UDI / Serial Number</th>
                <th className="py-3.5 px-4">Nama Implan &amp; Pabrikan</th>
                <th className="py-3.5 px-4">Supplier Konsinyasi</th>
                <th className="py-3.5 px-4 text-center">Lokasi OK / Cath Lab</th>
                <th className="py-3.5 px-4 text-center">Stok</th>
                <th className="py-3.5 px-4 text-right">Harga HPP Unit</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
              {IMPLANTS.map((imp, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-mono font-black text-[#007399] bg-[#007399]/10 px-2 py-0.5 rounded-md border border-[#007399]/20 block w-fit mb-0.5">
                      {imp.serialNo}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block">{imp.udi}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">{imp.name}</span>
                    <span className="text-[9px] text-slate-400 block">{imp.category} • {imp.manufacturer}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {imp.supplier}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-600 dark:text-slate-300">
                    {imp.location}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-teal-600">
                    {imp.qty} {imp.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                    {formatIDR(imp.unitCost)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button 
                      onClick={() => toast.success(`Implan UDI ${imp.serialNo} berhasil ditautkan ke Prosedur OK Pasien!`)}
                      className="px-3 py-1.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                    >
                      Tautkan Pasien
                    </button>
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
