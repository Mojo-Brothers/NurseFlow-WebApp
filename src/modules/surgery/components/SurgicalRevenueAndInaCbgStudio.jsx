import React, { useState } from 'react';
import { surgicalRevenueCycleService } from '../../../../server/services/surgicalRevenueCycle.service.js';
import toast from 'react-hot-toast';

export default function SurgicalRevenueAndInaCbgStudio({ activeCase }) {
  const currentCase = activeCase || {
    id: 'CASE-SURG-001',
    bookingNumber: 'SURG-2026-0817-001',
    patientName: 'Tn. Hendra (Mr. X)',
    patientMrn: 'MRX-2026-A1',
    procedureName: 'Laparotomi Eksplorasi & Apendektomi Cito'
  };

  const [billing, setBilling] = useState(() => {
    return surgicalRevenueCycleService.calculateSurgicalBilling(currentCase.id, {
      patientMrn: currentCase.patientMrn,
      icd10: 'K35.8',
      icd9cm: '47.0'
    });
  });

  const [implants] = useState(() => surgicalRevenueCycleService.getImplantsByCase(currentCase.id));
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitVclaim = () => {
    try {
      const payload = surgicalRevenueCycleService.generateBpjsVclaimSurgicalPayload(currentCase.id);
      setIsSubmitted(true);
      toast.success(`Klaim Tindakan Bedah ${currentCase.bookingNumber} Berhasil Dikirim ke BPJS V-Claim 2.0! (Kode: ${billing.inacbgCode})`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Surgical Revenue Cycle & INA-CBG Grouper Studio</h3>
            <p className="text-xs text-slate-400">
              Rincian Biaya Riil RS, Tracking Implan UDI & Klaim Paket BPJS V-Claim 2.0
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 font-mono">
          Permenkes Tarif INA-CBG
        </span>
      </div>

      {/* Grid: 1. Itemized Hospital Cost vs 2. INA-CBG Package */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Itemized Real Cost */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="font-black text-slate-900 dark:text-white">Komponen Biaya Riil Rumah Sakit</span>
            <span className="text-slate-500 font-mono">Biaya Aktual</span>
          </div>

          <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span>Sewa Kamar Operasi & Sterilisasi:</span>
              <strong className="font-mono">{formatRupiah(billing.operatingRoomFee)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Jasa Operator Utama & Asisten:</span>
              <strong className="font-mono">{formatRupiah(billing.surgeonProfessionalFee)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Jasa Dokter Anestesi:</span>
              <strong className="font-mono">{formatRupiah(billing.anesthesiaProfessionalFee)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Bahan Habis Pakai / BHP Bedah:</span>
              <strong className="font-mono">{formatRupiah(billing.consumablesCharge)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Obat Anestesi & Gas Volatil:</span>
              <strong className="font-mono">{formatRupiah(billing.anestheticDrugsCharge)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Implan Ortopedi / Medis Permanen ({implants.length} item):</span>
              <strong className="font-mono">{formatRupiah(billing.implantsCharge)}</strong>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white">
            <span>Total Biaya Riil RS:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatRupiah(billing.totalHospitalCost)}</span>
          </div>
        </div>

        {/* Right: INA-CBG Grouper Engine */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800 pb-2">
            <span className="font-black text-indigo-900 dark:text-indigo-300">Hasil INA-CBG Grouper BPJS</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
              {billing.inacbgCode}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <span className="text-slate-500">Deskripsi Kasus:</span>
              <div className="font-bold text-slate-900 dark:text-white">{billing.inacbgDescription}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Diagnosa (ICD-10): <strong className="font-mono">{billing.icd10PrimaryDiagnosis}</strong></div>
              <div>Prosedur (ICD-9-CM): <strong className="font-mono">{billing.icd9cmPrimaryProcedure}</strong></div>
            </div>
            <div>Tingkat Keparahan: <strong className="text-indigo-600 dark:text-indigo-400">{billing.inacbgSeverity}</strong></div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-1">
            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Tarif Paket Klaim INA-CBG:</span>
              <span className="font-mono text-emerald-600 font-black">{formatRupiah(billing.inacbgTariff)}</span>
            </div>
            <div className="flex justify-between font-bold text-xs">
              <span>Margin Keuntungan / Efisiensi RS:</span>
              <span className={`font-mono font-black ${billing.hospitalMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatRupiah(billing.hospitalMargin)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Implant Tracking Box (UDI) */}
      {implants.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 space-y-2">
          <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              <span>Pelacakan Implan Permanen (UDI FDA / Kemenkes Compliance)</span>
            </div>
            <span className="text-[10px] font-mono">{implants.length} Implan Terpasang</span>
          </div>

          {implants.map((imp, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 text-[11px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-400">Nama Implan:</span>
                <div className="font-bold text-slate-900 dark:text-white">{imp.implantName}</div>
              </div>
              <div>
                <span className="text-slate-400">Barcode UDI:</span>
                <div className="font-mono font-bold text-amber-700 dark:text-amber-400 truncate">{imp.udiBarcode}</div>
              </div>
              <div>
                <span className="text-slate-400">Serial & Lot:</span>
                <div className="font-mono">{imp.serialNumber} • {imp.lotNumber}</div>
              </div>
              <div>
                <span className="text-slate-400">Lokasi Anatomi:</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{imp.anatomicalLocation}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs text-slate-500 font-mono">
          Status: {isSubmitted ? <span className="text-emerald-600 font-bold">TERKIRIM KE BPJS V-CLAIM 2.0 ✔</span> : <span>Klaim Siap Diajukan</span>}
        </div>

        <button
          type="button"
          onClick={handleSubmitVclaim}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">send</span>
          Kirim Berkas Klaim ke BPJS V-Claim 2.0
        </button>
      </div>
    </div>
  );
}
