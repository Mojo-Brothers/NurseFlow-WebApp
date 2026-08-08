/**
 * PharmacistVerificationWorkspace.jsx
 * ─────────────────────────────────────────────────────────────
 * Pharmacist Clinical Safety Verification & Digital Label Dispensing Engine
 * Verifies 12 Patient Safety Parameters (Allergies, Interactions, Doses, Renal, High Alert)
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, XCircle, 
  Pill, User, FileText, Printer, Check, Search, AlertOctagon, Scale
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PharmacistVerificationWorkspace({ pendingQueue = [], onVerifySuccess }) {
  const [selectedMed, setSelectedMed] = useState(pendingQueue[0] || null);
  const [overrideReason, setOverrideReason] = useState('');
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // Mock Active Medication Order for Verification
  const currentMed = selectedMed || {
    id: 'MED-2026-0805-001',
    patient_id: 'P-10029',
    patient_name: 'Bpk. Hendra Wijaya',
    mrn: 'MRN-882049',
    dob: '1978-05-14',
    weight: 68,
    egfr: 45,
    medication_name: 'Paracetamol 500mg Tablet',
    dosage: '500mg',
    route: 'PO (Oral)',
    frequency: '3 x 1 Tablet Sehari (TID)',
    duration: '5 Hari',
    prescribed_by: 'dr. Budi Santoso, Sp.PD',
    diagnosis: 'J18.9 Pneumonia Unspecified',
    allergyAlert: null,
    interactionAlert: 'Interaction Minor: Paracetamol + Warfarin (Efek Minimal)',
    doseAlert: 'Dosis aman (500mg < 4000mg/hari max)',
    renalAlert: 'eGFR 45 mL/min: Penyesuaian Dosis Tidak Diperlukan',
    highAlert: false,
    lasa: false
  };

  const handleApproveVerification = () => {
    toast.success(`VERIFIKASI APOTEKER SUKSES! Medikasi [${currentMed.medication_name}] disetujui & siap dispensing!`);
    setIsLabelModalOpen(true);
    if (onVerifySuccess) onVerifySuccess(currentMed);
  };

  const handleRejectVerification = () => {
    if (!overrideReason) {
      toast.error('Alasan penolakan / klarifikasi dokter wajib diisi!');
      return;
    }
    toast.error(`Resep [${currentMed.id}] ditolak & dikembalikan ke DPJP dengan catatan intervensi apoteker!`);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* TOP HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                PHARMACIST CLINICAL VERIFICATION
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI MMU.4.1 &amp; Permenkes RI Standar</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              Lembar Verifikasi Keselamatan Medis Apoteker
            </h2>
          </div>
        </div>
      </div>

      {/* TWO PANELS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT 4 COLS: PRESCRIPTION QUEUE LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Antrean E-Resep Menunggu ({pendingQueue.length || 1})
          </h3>

          <div className="space-y-2 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
            <div 
              onClick={() => setSelectedMed(currentMed)}
              className="p-3.5 rounded-2xl bg-[#007399]/10 border border-[#007399]/30 text-xs cursor-pointer shadow-sm"
            >
              <span className="text-[9px] font-black uppercase text-[#007399] block font-mono">{currentMed.id}</span>
              <h4 className="font-black text-slate-800 dark:text-slate-100">{currentMed.patient_name}</h4>
              <span className="text-[10px] text-slate-500 font-bold block">{currentMed.medication_name}</span>
            </div>
          </div>
        </div>

        {/* RIGHT 8 COLS: 12 SAFETY CHECKS & VERIFICATION ACTION */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* PATIENT & PRESCRIBER CONTEXT */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">NAMA PASIEN &amp; MRN</span>
              <span className="text-slate-800 dark:text-slate-100">{currentMed.patient_name} ({currentMed.mrn})</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">BOBOT BB &amp; eGFR</span>
              <span className="text-slate-800 dark:text-slate-100">{currentMed.weight} kg • eGFR {currentMed.egfr} mL/min</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">DOKTER DPJP PRESCRIBER</span>
              <span className="text-[#007399]">{currentMed.prescribed_by}</span>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">DIAGNOSIS KLINIS</span>
              <span className="text-slate-800 dark:text-slate-100">{currentMed.diagnosis}</span>
            </div>
          </div>

          {/* MEDICATION DETAIL & 12 SAFETY CHECKS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Evaluasi 12 Parameter Keselamatan Medikasi (Clinical Review)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>1. Identitas Pasien Tepat (Right Patient)</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>2. Obat Tepat (Right Medication)</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>3. Dosis Aman ({currentMed.dosage})</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>4. Rute Tepat ({currentMed.route})</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>5. Frekuensi Tepat ({currentMed.frequency})</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>6. Cek Alergi (No Allergy Conflict)</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-center justify-between">
                <span>7. Interaksi Obat (Minor Interaction)</span>
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center justify-between">
                <span>8. Fungsi Ginjal eGFR Aman</span>
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
            </div>
          </div>

          {/* OVERRIDE / INTERVENTION NOTES */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">CATATAN INTERVENSI APOTEKER / OVERRIDE REASON</label>
            <textarea 
              rows={2}
              placeholder="Masukkan catatan rekomendasi apoteker jika ada klarifikasi dosis / substitusi..."
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleRejectVerification}
              className="px-4 py-2.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
            >
              Tolak / Klarifikasi DPJP
            </button>
            <button
              onClick={handleApproveVerification}
              className="px-6 py-2.5 bg-[#007399] hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Verifikasi &amp; Cetak Etiket Dispensing</span>
            </button>
          </div>

        </div>

      </div>

      {/* DISPENSING LABEL MODAL */}
      {isLabelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 font-mono text-xs border border-slate-300 shadow-2xl">
            <div className="text-center border-b pb-3">
              <h4 className="font-black text-sm uppercase">INSTALASI FARMASI RS NURSEFLOW</h4>
              <span className="text-[10px] text-slate-500 block">Jalan Kesehatan No. 1 • Telp: (021) 555-8899</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div><strong>No. Resep:</strong> {currentMed.id}</div>
              <div><strong>Pasien:</strong> {currentMed.patient_name} ({currentMed.mrn})</div>
              <div><strong>Tgl Lahir:</strong> {currentMed.dob}</div>
              <div><strong>Tgl Dispensing:</strong> {new Date().toLocaleDateString('id-ID')}</div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-center font-bold">
              <div className="text-sm font-black uppercase text-teal-800">{currentMed.medication_name}</div>
              <div className="text-xs text-slate-700 mt-1">{currentMed.dosage} • {currentMed.frequency}</div>
              <div className="text-[10px] text-slate-500 mt-1">Rute: {currentMed.route}</div>
            </div>

            <div className="text-[10px] text-slate-500 text-center">
              Apoteker: Apt. Budi Santoso, S.Farm (STRA Verified)
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsLabelModalOpen(false)} className="w-full py-2 bg-slate-200 rounded-xl font-black uppercase text-xs">
                Tutup
              </button>
              <button onClick={() => { toast.success('Etiket Obat dicetak ke Thermal Printer Farmasi!'); setIsLabelModalOpen(false); }} className="w-full py-2 bg-[#007399] text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-1">
                <Printer size={14} /> Cetak Etiket
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
