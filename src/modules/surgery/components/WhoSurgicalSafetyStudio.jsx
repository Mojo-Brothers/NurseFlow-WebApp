import React, { useState } from 'react';
import { operatingTheatreEngineService } from '../services/operatingTheatreEngine.service.js';
import toast from 'react-hot-toast';

export default function WhoSurgicalSafetyStudio({ activeCase }) {
  const currentCase = activeCase || {
    id: 'CASE-SURG-001',
    bookingNumber: 'SURG-2026-0817-001',
    patientName: 'Tn. Hendra (Mr. X)',
    patientMrn: 'MRX-2026-A1',
    procedureName: 'Laparotomi Eksplorasi & Apendektomi Cito',
    theatreName: 'OK-01',
    primarySurgeonName: 'dr. Budi Santoso, Sp.B',
    anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI'
  };

  const [activePhase, setActivePhase] = useState('SIGN_IN'); // 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT'

  // Sign-In State
  const [signIn, setSignIn] = useState({
    identityConfirmed: true,
    siteMarked: true,
    consentVerified: true,
    pulseOxAttached: true,
    allergyChecked: true,
    airwayAssessed: true,
    bloodLossPrepared: true
  });

  // Time-Out State
  const [timeOut, setTimeOut] = useState({
    teamIntroductions: true,
    patientNameProcedureSite: true,
    surgeonCriticalSteps: true,
    anesthesiaConcerns: true,
    sterilityVerified: true,
    antibioticProphylaxis: true,
    imagingDisplayed: true
  });

  // Sign-Out State
  const [signOut, setSignOut] = useState({
    procedureRecorded: true,
    instrumentSpongeCountCorrect: true,
    specimenLabeled: true,
    equipmentAddressed: true,
    recoveryPlanBriefed: true
  });

  const [isSigned, setIsSigned] = useState(false);
  const [signatureHash, setSignatureHash] = useState(null);

  const handleVerifyChecklist = (e) => {
    e.preventDefault();
    try {
      const record = operatingTheatreEngineService.signWhoChecklist(currentCase.id, {
        signIn,
        timeOut,
        signOut
      });

      setIsSigned(true);
      setSignatureHash(record.signatureHash);
      toast.success(`WHO Surgical Safety Checklist untuk ${currentCase.patientName} Berhasil Ditandatangani Secara Digital!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleVerifyChecklist} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">fact_check</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">WHO Surgical Safety Checklist (JCI IPSG 4)</h3>
            <p className="text-xs text-slate-400">
              Kasus: <strong className="text-slate-700 dark:text-slate-300">{currentCase.bookingNumber}</strong> • {currentCase.procedureName}
            </p>
          </div>
        </div>

        {/* Phase Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActivePhase('SIGN_IN')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activePhase === 'SIGN_IN' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            1. SIGN-IN
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('TIME_OUT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activePhase === 'TIME_OUT' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            2. TIME-OUT
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('SIGN_OUT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activePhase === 'SIGN_OUT' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            3. SIGN-OUT
          </button>
        </div>
      </div>

      {/* Phase 1: SIGN-IN (Before Induction of Anesthesia) */}
      {activePhase === 'SIGN_IN' && (
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold border-b border-amber-200 dark:border-amber-800 pb-2">
            <span>Fase 1: SIGN-IN (Sebelum Induksi Anestesi) — Dipimpin oleh Dokter Anestesi / Penata Anestesi</span>
            <span className="material-symbols-outlined text-[18px]">lock_clock</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.identityConfirmed}
                onChange={(e) => setSignIn({ ...signIn, identityConfirmed: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Identitas Pasien, Lokasi Operasi & Surat Izin Operasi (Consent) Terverifikasi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.siteMarked}
                onChange={(e) => setSignIn({ ...signIn, siteMarked: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Penandaan Lokasi Operasi (Surgical Site Marking) Jelas</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.pulseOxAttached}
                onChange={(e) => setSignIn({ ...signIn, pulseOxAttached: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Pulse Oximeter Terpasang & Berfungsi Optimal (SpO2 Terbaca)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.allergyChecked}
                onChange={(e) => setSignIn({ ...signIn, allergyChecked: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Riwayat Alergi Obat Telah Dikonfirmasi & Gelang Alergi Merah Terpasang</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.airwayAssessed}
                onChange={(e) => setSignIn({ ...signIn, airwayAssessed: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Risiko Jalan Napas Sulit / Aspirasi (Mallampati) & Alat Bantuan Siap</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signIn.bloodLossPrepared}
                onChange={(e) => setSignIn({ ...signIn, bloodLossPrepared: e.target.checked })}
                className="w-4 h-4 accent-rose-600"
              />
              <span>Risiko Perdarahan &gt;500 ml Diantisipasi & Akses IV / Darah Siap</span>
            </label>
          </div>
        </div>
      )}

      {/* Phase 2: TIME-OUT (Before Skin Incision) */}
      {activePhase === 'TIME_OUT' && (
        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 font-bold border-b border-blue-200 dark:border-blue-800 pb-2">
            <span>Fase 2: TIME-OUT (Sebelum Insisi Kulit) — Seluruh Tim Bedah Berhenti Sejenak & Mengonfirmasi</span>
            <span className="material-symbols-outlined text-[18px]">pause_circle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.teamIntroductions}
                onChange={(e) => setTimeOut({ ...timeOut, teamIntroductions: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Seluruh Anggota Tim Memperkenalkan Nama & Peran Masing-Masing</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.patientNameProcedureSite}
                onChange={(e) => setTimeOut({ ...timeOut, patientNameProcedureSite: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Konfirmasi Verbal Bersama: Nama Pasien, Tindakan, dan Lokasi Insisi Tepat</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.surgeonCriticalSteps}
                onChange={(e) => setTimeOut({ ...timeOut, surgeonCriticalSteps: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Operator Menjelaskan: Langkah Kritis, Estimasi Waktu, dan Antisipasi Perdarahan</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.sterilityVerified}
                onChange={(e) => setTimeOut({ ...timeOut, sterilityVerified: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Indikator Sterilisasi Instrumen & Linen Terverifikasi Lengkap</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.antibioticProphylaxis}
                onChange={(e) => setTimeOut({ ...timeOut, antibioticProphylaxis: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Profilaksis Antibiotik Telah Diberikan dalam 60 Menit Terakhir</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={timeOut.imagingDisplayed}
                onChange={(e) => setTimeOut({ ...timeOut, imagingDisplayed: e.target.checked })}
                className="w-4 h-4 accent-blue-600"
              />
              <span>Hasil Citra Radiologi / CT-Scan Esensial Terpasang di Monitor Kamar Operasi</span>
            </label>
          </div>
        </div>
      )}

      {/* Phase 3: SIGN-OUT (Before Patient Leaves Operating Room) */}
      {activePhase === 'SIGN_OUT' && (
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold border-b border-emerald-200 dark:border-emerald-800 pb-2">
            <span>Fase 3: SIGN-OUT (Sebelum Pasien Keluar Kamar Operasi) — Dipimpin oleh Perawat Sirkuler</span>
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signOut.procedureRecorded}
                onChange={(e) => setSignOut({ ...signOut, procedureRecorded: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>Nama Tindakan Bedah Telah Dicatat Sesuai Pelaksanaan</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signOut.instrumentSpongeCountCorrect}
                onChange={(e) => setSignOut({ ...signOut, instrumentSpongeCountCorrect: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>Penghitungan Instrumen, Kassa (Sponge), dan Jarum: 100% Lengkap & Cocok</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signOut.specimenLabeled}
                onChange={(e) => setSignOut({ ...signOut, specimenLabeled: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>Spesimen Jaringan/Patologi Diberi Label Barcode & Identitas Lengkap</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={signOut.recoveryPlanBriefed}
                onChange={(e) => setSignOut({ ...signOut, recoveryPlanBriefed: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              <span>Rencana Pemulihan Pasca-Bedah di PACU / ICU Telah Diarahkan ke Tim Ruangan</span>
            </label>
          </div>
        </div>
      )}

      {/* Signature & Verification Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500">
          {isSigned ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Checklist Sah & Tersimpan di Rekam Medis ({signatureHash})
            </span>
          ) : (
            <span>Seluruh 3 fase harus diverifikasi bersama oleh Operator, Dokter Anestesi, dan Perawat.</span>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-900/20 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          Sahkan WHO Checklist & Rilis ke EMR
        </button>
      </div>
    </form>
  );
}
