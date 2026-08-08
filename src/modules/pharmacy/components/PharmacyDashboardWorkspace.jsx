/**
 * PharmacyDashboardWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Central Enterprise Pharmacy Operations & Clinical Safety Dashboard
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useMemo } from 'react';
import { 
  Pill, AlertTriangle, ShieldAlert, FileText, CheckCircle2, 
  Clock, HeartPulse, RefreshCw, UserCheck, ShieldCheck, Activity,
  ChevronRight, AlertCircle, Layers, DollarSign, Stethoscope, Scissors
} from 'lucide-react';

export default function PharmacyDashboardWorkspace({ pendingQueue = [], onNavigateTab }) {

  // KPI Calculations
  const stats = useMemo(() => {
    const totalPending = pendingQueue.length;
    const highAlertCount = pendingQueue.filter(m => m.isHighAlert || ['IV', 'SC', 'IM'].includes(m.route?.toUpperCase())).length;
    const lasaCount = pendingQueue.filter(m => m.lasaWarning || m.isLasa).length;
    const allergyAlertCount = pendingQueue.filter(m => m.allergyConflict || m.allergyAlert).length;
    const interactionCount = pendingQueue.filter(m => m.drugInteraction || m.interactionSeverity === 'MAJOR').length;
    const controlledCount = pendingQueue.filter(m => m.isControlled || m.isNarcotic || m.isPsychotropic).length;
    const antibioticCount = pendingQueue.filter(m => m.isAntibiotic || m.category === 'ANTIBIOTIK').length;

    const uniquePatients = new Set(pendingQueue.map(m => m.patient_id)).size;

    return {
      totalPending,
      highAlertCount,
      lasaCount,
      allergyAlertCount,
      interactionCount,
      controlledCount,
      antibioticCount,
      uniquePatients
    };
  }, [pendingQueue]);

  return (
    <div className="space-y-6 font-sans">

      {/* TOP SUMMARY CARDS (OPERATIONAL & SAFETY KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: ANTREAN VERIFIKASI RESEP */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('verification')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#007399] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ANTREAN VERIFIKASI APOTEKER</span>
            <div className="w-9 h-9 rounded-xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold group-hover:bg-[#007399] group-hover:text-white transition-all">
              <Pill size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.totalPending} Resep</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">Daftar E-Resep Menunggu Verifikasi Klinis</div>
        </div>

        {/* KPI 2: HIGH ALERT MEDICATION */}
        <div className="p-5 rounded-2xl bg-rose-500/8 border border-rose-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">HIGH ALERT MEDICATION</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.highAlertCount} Order</div>
          <div className="text-[10px] font-bold text-rose-600/80 mt-1">Wajib Independent Double-Check</div>
        </div>

        {/* KPI 3: PERINGATAN LASA (TALL MAN) */}
        <div className="p-5 rounded-2xl bg-amber-500/8 border border-amber-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">OBAT LASA (LOOK-ALIKE)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.lasaCount} Order</div>
          <div className="text-[10px] font-bold text-amber-600/80 mt-1">Gunakan Tall Man Lettering</div>
        </div>

        {/* KPI 4: DRUG ALLERGY ALERTS */}
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">ALERGI OBAT (ALLERGY ALERT)</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-red-700 dark:text-red-400">{stats.allergyAlertCount} Pasien</div>
          <div className="text-[10px] font-bold text-red-600/80 mt-1">Potensi Reaksi Anafilaksis / Alergi</div>
        </div>

        {/* KPI 5: NARKOTIKA & PSIKOTROPIKA */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('controlled_drugs')}
          className="p-5 rounded-2xl bg-purple-500/8 border border-purple-500/30 shadow-sm hover:bg-purple-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">NARKOTIKA &amp; PSIKOTROPIKA</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">{stats.controlledCount} Order</div>
          <div className="text-[10px] font-bold text-purple-600/80 mt-1">Pencatatan Saksi Ganda (Double Sign)</div>
        </div>

        {/* KPI 6: ANTIBIOTIC STEWARDSHIP */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('antibiotic_stewardship')}
          className="p-5 rounded-2xl bg-indigo-500/8 border border-indigo-500/30 shadow-sm hover:bg-indigo-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">ANTIBIOTIC STEWARDSHIP</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold">
              <Stethoscope size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{stats.antibioticCount} Resep</div>
          <div className="text-[10px] font-bold text-indigo-600/80 mt-1">Evaluasi Kultur &amp; De-eskalasi</div>
        </div>

        {/* KPI 7: PASIEN DALAM ANTREAN */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">TOTAL PASIEN DALAM ANTREAN</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">{stats.uniquePatients} Pasien</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">Pasien Rawat Jalan &amp; Rawat Inap</div>
        </div>

        {/* KPI 8: REKONSILIASI OBAT PENDING */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('reconciliation')}
          className="p-5 rounded-2xl bg-cyan-500/8 border border-cyan-500/30 shadow-sm hover:bg-cyan-500/15 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">REKONSILIASI OBAT</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-600 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-400">Aktif</div>
          <div className="text-[10px] font-bold text-cyan-600/80 mt-1">Admisi, Transfer, &amp; Pemulangan Pasien</div>
        </div>

      </div>

      {/* OPERATIONAL QUEUES SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Activity className="text-[#007399]" size={20} />
              Ringkasan Antrean Verifikasi Medikasi Aktif
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Seluruh e-resep dokter yang memerlukan verifikasi keselamatan klinis apoteker</p>
          </div>

          <button
            onClick={() => onNavigateTab && onNavigateTab('verification')}
            className="px-4 py-2 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Buka Lembar Verifikasi Apoteker</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {pendingQueue.length > 0 ? (
            pendingQueue.slice(0, 5).map((med, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#007399] block font-mono">
                    {med.id || `MED-${idx + 1}`} • {med.route || 'PO'}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{med.medication_name || 'Paracetamol 500mg'}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">Dosis: {med.dosage || '500mg'} • Prescriber: {med.prescribed_by || 'dr. DPJP'}</span>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 block w-fit ml-auto mb-1">
                    MENUNGGU VERIFIKASI
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold block">Status Stok: Tersedia (FEFO)</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-emerald-700 uppercase">Tidak ada resep pending. Seluruh medikasi telah terverifikasi!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
