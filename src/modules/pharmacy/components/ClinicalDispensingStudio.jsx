import React, { useState } from 'react';
import { enterprisePharmacyEngineService, DEPOT_CODES } from '../../../../server/services/enterprisePharmacyEngine.service.js';
import toast from 'react-hot-toast';

export default function ClinicalDispensingStudio() {
  const [selectedOrder] = useState({
    id: 'RX-2026-0817-009',
    encounterId: 'ENC-2026-003',
    patientMrn: 'MRX-2026-A1',
    patientName: 'Tn. Hendra (Mr. X)',
    doctorName: 'dr. Budi Santoso, Sp.B',
    depotCode: DEPOT_CODES.DEPO_RAWAT_INAP,
    medications: [
      { name: 'Ceftriaxone 1g Injeksi', code: 'MED-CEFTRIAXONE-1G', dose: '1g IV / 12 jam', qty: 2, isHighAlert: false, isNarcotic: false },
      { name: 'Fentanyl 0.05mg/ml Injeksi', code: 'MED-FENTANYL-0.05MG', dose: '100mcg IV bolus perlahan', qty: 1, isHighAlert: true, isNarcotic: true }
    ],
    allergyWarning: 'Tidak ada riwayat alergi penisilin/sefalosporin',
    interactionWarning: 'Aman: Tidak ditemukan interaksi obat mayor'
  });

  const [checklist, setChecklist] = useState({
    tepatPasien: true,
    tepatObat: true,
    tepatDosis: true,
    tepatRute: true,
    tepatWaktu: true,
    tepatDokumentasi: true,
    tepatIndikasi: true
  });

  const [primaryPharmacist, setPrimaryPharmacist] = useState('Apt. Rizky Kurniawan, S.Farm (SIP: 1990/SIPA/2024)');
  const [secondaryPharmacist, setSecondaryPharmacist] = useState('Apt. Sarah Amelia, S.Farm (SIP: 1994/SIPA/2025)');
  const [isVerified, setIsVerified] = useState(false);
  const [dualSigHash, setDualSigHash] = useState(null);

  const handleVerifyAndDispense = (e) => {
    e.preventDefault();
    try {
      // 1. FEFO Stock Deduction for each medication
      selectedOrder.medications.forEach(med => {
        enterprisePharmacyEngineService.deductStockFefo({
          depotCode: selectedOrder.depotCode,
          medicationCode: med.code,
          requestedQuantity: med.qty,
          reason: `DISPENSE_RX_${selectedOrder.id}`
        });
      });

      // 2. Dual Verification for Narcotic item (Fentanyl)
      const narcLog = enterprisePharmacyEngineService.verifyControlledSubstanceDispense({
        dispensingOrderId: selectedOrder.id,
        medicationName: 'Fentanyl 0.05mg/ml Injeksi',
        batchNumber: 'LOT-FENT-8891',
        quantityDispensed: 1,
        patientMrn: selectedOrder.patientMrn,
        primaryPharmacist: { id: 'APT-01', name: primaryPharmacist },
        secondaryVerifierPharmacist: { id: 'APT-02', name: secondaryPharmacist }
      });

      setDualSigHash(narcLog.dualSignatureHash);
      setIsVerified(true);
      toast.success(`Resep ${selectedOrder.id} Berhasil Diserahkan via FEFO & Diverifikasi 2 Apoteker!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleVerifyAndDispense} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">prescriptions</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Clinical Dispensing & Telaah Resep 7-Prinsip</h3>
            <p className="text-xs text-slate-400">
              Antrean Resep CPOE: <strong className="text-slate-700 dark:text-slate-200">{selectedOrder.id}</strong> • Pasien: {selectedOrder.patientName} ({selectedOrder.patientMrn})
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 font-mono">
          Narkotika & High-Alert Double Check
        </span>
      </div>

      {/* CDSS Clinical Screening Alert Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span>CDSS Screening: {selectedOrder.allergyWarning} • {selectedOrder.interactionWarning}</span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
          PASS CDSS
        </span>
      </div>

      {/* Medication List */}
      <div className="space-y-2">
        <span className="font-black text-slate-900 dark:text-white">Item Obat dalam Resep:</span>
        <div className="space-y-2">
          {selectedOrder.medications.map((m, i) => (
            <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{m.name}</span>
                  {m.isNarcotic && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">NARKOTIKA</span>}
                  {m.isHighAlert && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">HIGH ALERT</span>}
                </div>
                <div className="text-slate-500 text-[11px] font-mono">Dosis: {m.dose} • Jumlah: {m.qty} unit</div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">Depo: {selectedOrder.depotCode}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Prinsip Telaah Resep Checklist */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
        <span className="font-black text-slate-900 dark:text-white">7-Prinsip Telaah Resep Farmasi Klinis (Permenkes 73/2016):</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatPasien} onChange={(e) => setChecklist({ ...checklist, tepatPasien: e.target.checked })} className="accent-indigo-600" />
            <span>1. Tepat Pasien</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatObat} onChange={(e) => setChecklist({ ...checklist, tepatObat: e.target.checked })} className="accent-indigo-600" />
            <span>2. Tepat Obat</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatDosis} onChange={(e) => setChecklist({ ...checklist, tepatDosis: e.target.checked })} className="accent-indigo-600" />
            <span>3. Tepat Dosis</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatRute} onChange={(e) => setChecklist({ ...checklist, tepatRute: e.target.checked })} className="accent-indigo-600" />
            <span>4. Tepat Rute</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatWaktu} onChange={(e) => setChecklist({ ...checklist, tepatWaktu: e.target.checked })} className="accent-indigo-600" />
            <span>5. Tepat Waktu</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatDokumentasi} onChange={(e) => setChecklist({ ...checklist, tepatDokumentasi: e.target.checked })} className="accent-indigo-600" />
            <span>6. Tepat Dokumentasi</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={checklist.tepatIndikasi} onChange={(e) => setChecklist({ ...checklist, tepatIndikasi: e.target.checked })} className="accent-indigo-600" />
            <span>7. Tepat Indikasi</span>
          </label>
        </div>
      </div>

      {/* Dual Pharmacist Verification for Narcotics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Apoteker Penyiap (Primer):</label>
          <input
            type="text"
            value={primaryPharmacist}
            onChange={(e) => setPrimaryPharmacist(e.target.value)}
            className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Apoteker Verifikator (Sekunder - High Alert/Narkotika):</label>
          <input
            type="text"
            value={secondaryPharmacist}
            onChange={(e) => setSecondaryPharmacist(e.target.value)}
            className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
          />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 font-mono">
          {isVerified ? (
            <span className="text-emerald-600 font-bold">✔ TERVERIFIKASI & DISPENSING FEFO SAH ({dualSigHash})</span>
          ) : (
            <span>Wajib verifikasi ganda untuk obat narkotika golongan II.</span>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Verifikasi Resep & Potong Stok FEFO
        </button>
      </div>
    </form>
  );
}
