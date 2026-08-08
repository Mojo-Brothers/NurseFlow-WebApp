/**
 * ProcurementSupplierWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Supplier Master, Purchase Requisitions, Purchase Orders, Receiving & Quality Inspection
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  Truck, ShoppingCart, FileCheck, ShieldCheck, Search, Plus, 
  Building, CheckCircle2, DollarSign, Clock, AlertTriangle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProcurementSupplierWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState('PO_LIST'); // SUPPLIERS, PR_LIST, PO_LIST, RECEIVING_QC

  // Mock Procurement Data
  const SUPPLIERS = [
    { id: 'SUP-001', name: 'PT Kimia Farma Trading & Distribution', contact: 'Bpk. Ahmad Fauzi (0812-9988-1122)', city: 'Jakarta Selatan', category: 'PHARMACEUTICAL', rating: '5.0 / 5.0 (A+)', leadTime: '2 Hari', status: 'ACTIVE' },
    { id: 'SUP-002', name: 'PT Kalbe Farma Tbk', contact: 'Ibu Siska Utami (0811-2233-4455)', city: 'Jakarta Timur', category: 'PHARMACEUTICAL', rating: '4.9 / 5.0 (A)', leadTime: '3 Hari', status: 'ACTIVE' },
    { id: 'SUP-003', name: 'PT Medika Ortho Utama', contact: 'Bpk. Erik Setiawan (0815-6677-8899)', city: 'Surabaya', category: 'IMPLANT & SURGICAL', rating: '4.8 / 5.0 (A)', leadTime: '1 Hari', status: 'ACTIVE' }
  ];

  const PURCHASE_ORDERS = [
    { poNo: 'PO-LOGISTIK-202608-0041', date: '2026-08-04', supplier: 'PT Kimia Farma Trading & Distribution', totalItems: 3, totalValue: 45000000, status: 'APPROVED', leadTimeEst: '2026-08-07', receivingStatus: 'PENDING_RECEIVING' },
    { poNo: 'PO-FARMASI-202608-0042', date: '2026-08-05', supplier: 'PT Kalbe Farma Tbk', totalItems: 5, totalValue: 78000000, status: 'IN_DELIVERY', leadTimeEst: '2026-08-08', receivingStatus: 'IN_TRANSIT' }
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
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                PROCUREMENT INTEGRATION ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">PR ➔ PO ➔ Receiving ➔ QC</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Supplier Master, Order Pembelian (PO), &amp; Quality Control
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveSubTab('PO_LIST')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'PO_LIST' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Purchase Order (PO)
          </button>
          <button 
            onClick={() => setActiveSubTab('SUPPLIERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${activeSubTab === 'SUPPLIERS' ? 'bg-[#007399] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >
            Master Supplier Vendor
          </button>
        </div>
      </div>

      {/* PO LIST TABLE */}
      {activeSubTab === 'PO_LIST' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <ShoppingCart className="text-[#007399]" size={18} />
              Daftar Purchase Order Pembelian Medis &amp; Logistik ({PURCHASE_ORDERS.length})
            </h3>
            <button 
              onClick={() => toast.success('Draft Purchase Requisition (PR) Otomatis Berhasil Di-generate berdasarkan Reorder Point!')}
              className="px-4 py-2 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-sm"
            >
              + Buat PO / Replenishment Baru
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">Nomor PO &amp; Tanggal</th>
                  <th className="py-3.5 px-4">Supplier Vendor</th>
                  <th className="py-3.5 px-4 text-center">Jumlah SKU</th>
                  <th className="py-3.5 px-4 text-right">Total Nilai PO (IDR)</th>
                  <th className="py-3.5 px-4 text-center">Status PO</th>
                  <th className="py-3.5 px-4 text-center">Receiving QC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                {PURCHASE_ORDERS.map((po, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-[#007399] font-black block">{po.poNo}</span>
                      <span className="text-[9px] text-slate-400 block">{po.date}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-100">
                      {po.supplier}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {po.totalItems} Item
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600">
                      {formatIDR(po.totalValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => toast.success(`Membuka Form Receiving & Quality Inspection untuk ${po.poNo}`)}
                        className="px-3 py-1.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-sm"
                      >
                        Terima &amp; QC
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS LIST TABLE */}
      {activeSubTab === 'SUPPLIERS' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Building className="text-[#007399]" size={18} />
              Master Supplier Vendor &amp; Rating Kinerja ({SUPPLIERS.length})
            </h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-3.5 px-4">Kode &amp; Nama Supplier</th>
                  <th className="py-3.5 px-4">Kontak Person</th>
                  <th className="py-3.5 px-4">Kategori Produk</th>
                  <th className="py-3.5 px-4 text-center">Lead Time SLA</th>
                  <th className="py-3.5 px-4 text-center">Rating Kinerja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
                {SUPPLIERS.map((sup, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono text-[#007399] font-black block">{sup.id}</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100">{sup.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {sup.contact}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono">
                      {sup.category}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-teal-600">
                      {sup.leadTime}
                    </td>
                    <td className="py-3.5 px-4 text-center text-amber-600 font-bold">
                      {sup.rating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
