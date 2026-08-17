import React, { useState, useEffect } from 'react';
import { useOrdersStore } from '../store/orders.store.js';
import OrderEntryWorkspace from './OrderEntryWorkspace.jsx';
import PharmacyWorkspace from './PharmacyWorkspace.jsx';
import MedicationReviewWorkspace from './MedicationReviewWorkspace.jsx';
import LaboratoryWorkspace from './LaboratoryWorkspace.jsx';
import LaboratoryResultWorkspace from './LaboratoryResultWorkspace.jsx';
import RadiologyWorkspace from './RadiologyWorkspace.jsx';
import RadiologyViewerWorkspace from './RadiologyViewerWorkspace.jsx';
import OrderTimelineWorkspace from './OrderTimelineWorkspace.jsx';

export default function OrdersWorkspace() {
  const {
    orders,
    medicationOrders,
    labOrders,
    radOrders,
    fetchOrdersData
  } = useOrdersStore();

  const [activeTab, setActiveTab] = useState('ENTRY'); // 'ENTRY' | 'PHARMACY_REVIEW' | 'PHARMACY_DISPENSE' | 'LAB_SPECIMEN' | 'LAB_RESULTS' | 'RAD_WORKLIST' | 'RAD_VIEWER' | 'TIMELINE'

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Top Command Center Banner ─── */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
              SPRINT 5 &bull; UNIVERSAL ORDER, FARMASI, LIS & PACS
            </span>
            <span className="text-slate-400 text-xs font-mono">DICOM PS 3.10, LOINC & JCI MMU Standards</span>
          </div>
          <h2 className="text-xl font-headline font-black tracking-tight text-white">
            Pusat Layanan Order Klinis Terpadu (CPOE Hub)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Arsitektur: <span className="text-teal-300 font-bold">SOAP Plan &rarr; Universal Order &rarr; Farmasi / LIS / PACS &rarr; Event Bus &rarr; Billing Ledger</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Orders</span>
            <span className="text-sm font-mono font-black text-teal-400">{orders.length} Permintaan</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">E-Resep Farmasi</span>
            <span className="text-sm font-mono font-black text-purple-400">{medicationOrders.length} Item</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">LIS & PACS</span>
            <span className="text-sm font-mono font-black text-amber-400">{labOrders.length + radOrders.length} Item</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('ENTRY')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ENTRY' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>1. Input Order Dokter (CPOE)</span>
        </button>

        <button
          onClick={() => setActiveTab('PHARMACY_REVIEW')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'PHARMACY_REVIEW' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">checklist</span>
          <span>2. Telaah Resep Farmasi ({medicationOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PHARMACY_DISPENSE')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'PHARMACY_DISPENSE' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">medication</span>
          <span>3. Dispensing Obat</span>
        </button>

        <button
          onClick={() => setActiveTab('LAB_SPECIMEN')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'LAB_SPECIMEN' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">biotech</span>
          <span>4. LIS Spesimen ({labOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LAB_RESULTS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'LAB_RESULTS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">science</span>
          <span>5. LIS Hasil Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('RAD_WORKLIST')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'RAD_WORKLIST' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">radiology</span>
          <span>6. RIS Worklist ({radOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RAD_VIEWER')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'RAD_VIEWER' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          <span>7. PACS DICOM Viewer</span>
        </button>

        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'TIMELINE' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span>8. Riwayat Order FSM ({orders.length})</span>
        </button>
      </div>

      {/* ─── Active Tab Content ─── */}
      {activeTab === 'ENTRY' && <OrderEntryWorkspace onOrderCreated={() => setActiveTab('TIMELINE')} />}
      {activeTab === 'PHARMACY_REVIEW' && <MedicationReviewWorkspace onReviewed={() => setActiveTab('PHARMACY_DISPENSE')} />}
      {activeTab === 'PHARMACY_DISPENSE' && <PharmacyWorkspace />}
      {activeTab === 'LAB_SPECIMEN' && <LaboratoryWorkspace onNavigateResults={() => setActiveTab('LAB_RESULTS')} />}
      {activeTab === 'LAB_RESULTS' && <LaboratoryResultWorkspace />}
      {activeTab === 'RAD_WORKLIST' && <RadiologyWorkspace onNavigateViewer={() => setActiveTab('RAD_VIEWER')} />}
      {activeTab === 'RAD_VIEWER' && <RadiologyViewerWorkspace />}
      {activeTab === 'TIMELINE' && <OrderTimelineWorkspace />}

    </div>
  );
}
