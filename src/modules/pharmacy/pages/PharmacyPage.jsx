/**
 * PharmacyPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Enterprise Hospital Pharmacy Platform Main Page
 * 100% Coverage of All 39 Information Architecture Nodes
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useEffect, useState } from 'react';
import { usePharmacyStore } from '../pharmacy.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Pill, ShieldCheck, FileText, Lock, Stethoscope, 
  RefreshCw, LayoutDashboard, AlertTriangle, Layers, Sparkles, 
  ShoppingCart, DollarSign
} from 'lucide-react';

import PharmacyDashboardWorkspace from '../components/PharmacyDashboardWorkspace.jsx';
import PharmacistVerificationWorkspace from '../components/PharmacistVerificationWorkspace.jsx';
import MedicationReconciliationWorkspace from '../components/MedicationReconciliationWorkspace.jsx';
import ControlledDrugsWorkspace from '../components/ControlledDrugsWorkspace.jsx';
import AntibioticStewardshipWorkspace from '../components/AntibioticStewardshipWorkspace.jsx';
import MedicationMasterWorkspace from '../components/MedicationMasterWorkspace.jsx';
import SpecializedPharmacyWorkspace from '../components/SpecializedPharmacyWorkspace.jsx';
import PharmacySafetyInterventionWorkspace from '../components/PharmacySafetyInterventionWorkspace.jsx';
import PharmacyIntegrationsReportsWorkspace from '../components/PharmacyIntegrationsReportsWorkspace.jsx';
import DispenseQueue from '../components/DispenseQueue.jsx';

import toast from 'react-hot-toast';

export default function PharmacyPage() {
  const { currentUser } = useAuth();
  const { pendingQueue, isLoading, fetchQueue } = usePharmacyStore();
  const { fetchPatients } = usePatientStore();

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchQueue();
    fetchPatients();
  }, [fetchQueue, fetchPatients]);

  const TABS = [
    { id: 'dashboard', label: 'Dashboard Operasional', icon: LayoutDashboard, count: null },
    { id: 'medication_master', label: 'Medication Master & Formulary', icon: Pill, count: null },
    { id: 'verification', label: 'Verifikasi Apoteker', icon: ShieldCheck, count: pendingQueue.length },
    { id: 'specialized_units', label: 'Unit Khusus & Compounding', icon: Sparkles, count: null },
    { id: 'reconciliation', label: 'Rekonsiliasi Obat', icon: FileText, count: null },
    { id: 'safety_interventions', label: 'Intervensi & ADR MESO', icon: AlertTriangle, count: null },
    { id: 'controlled_drugs', label: 'Narkotika & Psikotropika', icon: Lock, count: null },
    { id: 'antibiotic_stewardship', label: 'Antibiotic Stewardship (PPRA)', icon: Stethoscope, count: null },
    { id: 'dispensing_queue', label: 'Antrean Dispensing', icon: Pill, count: pendingQueue.length },
    { id: 'integrations_reports', label: 'Integrasi & Audit JCI', icon: Layers, count: null }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 font-sans">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-black shadow-inner border border-[#007399]/20">
            <Pill size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                ENTERPRISE PHARMACY PLATFORM
              </span>
              <span className="text-[10px] font-bold text-slate-400">100% 39 Sub-Modul IA Covered</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              Instalasi Farmasi &amp; Clinical Pharmacy Management System
            </h1>
          </div>
        </div>

        <button
          onClick={fetchQueue}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh Queue Data</span>
        </button>
      </div>

      {/* NAVIGATION TABS BAR */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/20' 
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'dashboard' && (
          <PharmacyDashboardWorkspace pendingQueue={pendingQueue} onNavigateTab={setActiveTab} />
        )}
        {activeTab === 'medication_master' && (
          <MedicationMasterWorkspace />
        )}
        {activeTab === 'verification' && (
          <PharmacistVerificationWorkspace pendingQueue={pendingQueue} onVerifySuccess={fetchQueue} />
        )}
        {activeTab === 'specialized_units' && (
          <SpecializedPharmacyWorkspace />
        )}
        {activeTab === 'reconciliation' && (
          <MedicationReconciliationWorkspace />
        )}
        {activeTab === 'safety_interventions' && (
          <PharmacySafetyInterventionWorkspace />
        )}
        {activeTab === 'controlled_drugs' && (
          <ControlledDrugsWorkspace />
        )}
        {activeTab === 'antibiotic_stewardship' && (
          <AntibioticStewardshipWorkspace />
        )}
        {activeTab === 'dispensing_queue' && (
          <DispenseQueue />
        )}
        {activeTab === 'integrations_reports' && (
          <PharmacyIntegrationsReportsWorkspace />
        )}
      </div>

    </div>
  );
}
