import React, { useState } from 'react';
import { enterprisePharmacyEngineService, DEPOT_CODES } from '../../../../server/services/enterprisePharmacyEngine.service.js';
import toast from 'react-hot-toast';

export default function MultiDepotFefoInventoryStudio() {
  const [depots] = useState(enterprisePharmacyEngineService.getDepots());
  const [selectedDepot, setSelectedDepot] = useState(DEPOT_CODES.DEPO_RAWAT_INAP);
  const [batches, setBatches] = useState(enterprisePharmacyEngineService.getAllBatches());

  const currentBatches = batches.filter(b => b.depotCode === selectedDepot);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const diffTime = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSimulateDeduct = (medCode) => {
    try {
      const result = enterprisePharmacyEngineService.deductStockFefo({
        depotCode: selectedDepot,
        medicationCode: medCode,
        requestedQuantity: 5,
        reason: 'SIMULASI_DISPENSING_FEFO'
      });

      setBatches([...enterprisePharmacyEngineService.getAllBatches()]);
      toast.success(`Dipotong 5 unit ${medCode} via FEFO dari batch ${result.deductedBatches[0].batchNumber}!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Multi-Depot FEFO Inventory Management Studio</h3>
            <p className="text-xs text-slate-400">
              Siklus Stok Obat Multi-Depot Berbasis First-Expired First-Out & Peringatan Reorder Point
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 font-mono">
          Permenkes 73/2016 FEFO
        </span>
      </div>

      {/* Depot Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-wrap text-xs font-bold">
        {depots.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDepot(d.depotCode)}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedDepot === d.depotCode
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {d.depotName}
          </button>
        ))}
      </div>

      {/* Batches Table with FEFO Prioritization */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono text-[11px]">
              <th className="py-2 px-3">PRIORITAS FEFO</th>
              <th className="py-2 px-3">NAMA OBAT & KODE</th>
              <th className="py-2 px-3">BATCH LOT</th>
              <th className="py-2 px-3">KEDALUWARSA (EXPIRY)</th>
              <th className="py-2 px-3">SISA STOK</th>
              <th className="py-2 px-3">HARGA SATUAN</th>
              <th className="py-2 px-3 text-right">AKSI FEFO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {currentBatches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Tidak ada batch obat aktif di depo ini saat ini.
                </td>
              </tr>
            ) : (
              currentBatches.map((batch, idx) => {
                const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                const isNearExpiry = daysLeft < 90;
                const isLowStock = batch.currentStock <= batch.reorderPoint;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-black font-mono px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{batch.medicationName}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{batch.medicationCode}</span>
                        {batch.isHighAlert && <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">HIGH ALERT</span>}
                        {batch.isNarcoticPsychotropic && <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">NARKOTIKA</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                        isNearExpiry
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {batch.expiryDate} ({daysLeft} hari)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={`font-black ${isLowStock ? 'text-rose-600 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
                        {batch.currentStock} {batch.dosageForm}
                      </span>
                      {isLowStock && (
                        <div className="text-[10px] text-rose-500 font-sans font-bold">⚠ Di Bawah Reorder Point ({batch.reorderPoint})</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {formatRupiah(batch.sellingPriceIdr)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleSimulateDeduct(batch.medicationCode)}
                        className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 transition-all cursor-pointer"
                      >
                        Potong FEFO (-5)
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
