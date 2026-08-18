import React, { useState } from 'react';
import { fefoMultiDepotInventoryEngine, DEPOT_TYPES, BATCH_STATUS } from '../../../core/services/fefoMultiDepotInventoryEngine.service.js';
import toast from 'react-hot-toast';

export default function MultiDepotFefoInventoryStudio() {
  const [activeTab, setActiveTab] = useState('FEFO_BATCHES'); // 'FEFO_BATCHES' | 'TRANSFER_MUTASI' | 'COLD_CHAIN' | 'QUARANTINE'
  const [selectedDepot, setSelectedDepot] = useState('DEPOT-RAWAT-INAP');

  const depots = [
    { id: 'DEPOT-GUDANG-UTAMA', name: 'Gudang Farmasi Sentral', type: DEPOT_TYPES.CENTRAL_WAREHOUSE },
    { id: 'DEPOT-RAWAT-INAP', name: 'Depo Farmasi Rawat Inap', type: DEPOT_TYPES.INPATIENT_SATELLITE },
    { id: 'DEPOT-RAWAT-JALAN', name: 'Depo Farmasi Rawat Jalan', type: DEPOT_TYPES.OUTPATIENT_SATELLITE },
    { id: 'DEPOT-IGD', name: 'Depo Farmasi Gawat Darurat (IGD)', type: DEPOT_TYPES.EMERGENCY_DEPOT },
    { id: 'DEPOT-BANGSAL-MELATI', name: 'Floor Stock Bangsal Melati', type: DEPOT_TYPES.WARD_FLOOR_STOCK }
  ];

  const [batches, setBatches] = useState([
    {
      id: 'STK-01',
      depotId: 'DEPOT-RAWAT-INAP',
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      batchNumber: 'BATCH-CFX-2027A',
      lotNumber: 'LOT-99120',
      expiryDate: '2027-04-30',
      currentQuantity: 85,
      reorderPoint: 20,
      storageCondition: 'ROOM_TEMPERATURE',
      tempTarget: '15-25°C',
      currentTemp: '21.4°C',
      isHighAlert: false,
      status: BATCH_STATUS.ACTIVE
    },
    {
      id: 'STK-02',
      depotId: 'DEPOT-RAWAT-INAP',
      medicationCode: 'MED-CEFTRIAXONE-1G',
      medicationName: 'Ceftriaxone 1g Vial',
      batchNumber: 'BATCH-CFX-2028B',
      lotNumber: 'LOT-99881',
      expiryDate: '2028-11-15',
      currentQuantity: 120,
      reorderPoint: 20,
      storageCondition: 'ROOM_TEMPERATURE',
      tempTarget: '15-25°C',
      currentTemp: '21.4°C',
      isHighAlert: false,
      status: BATCH_STATUS.ACTIVE
    },
    {
      id: 'STK-03',
      depotId: 'DEPOT-RAWAT-INAP',
      medicationCode: 'MED-INS-NOVORAPID',
      medicationName: 'Novorapid Flexpen 100 IU/mL',
      batchNumber: 'BATCH-NVR-2026C',
      lotNumber: 'LOT-NVR-01',
      expiryDate: '2026-11-30',
      currentQuantity: 24,
      reorderPoint: 10,
      storageCondition: 'COLD_CHAIN_2_8C',
      tempTarget: '2-8°C',
      currentTemp: '4.2°C',
      isHighAlert: true,
      status: BATCH_STATUS.CRITICAL_EXPIRY
    },
    {
      id: 'STK-04',
      depotId: 'DEPOT-GUDANG-UTAMA',
      medicationCode: 'MED-PARACETAMOL-500',
      medicationName: 'Paracetamol Infus 1000 mg / 100 mL',
      batchNumber: 'BATCH-PCT-2028X',
      lotNumber: 'LOT-PCT-88',
      expiryDate: '2028-09-30',
      currentQuantity: 450,
      reorderPoint: 50,
      storageCondition: 'ROOM_TEMPERATURE',
      tempTarget: '15-25°C',
      currentTemp: '22.0°C',
      isHighAlert: false,
      status: BATCH_STATUS.ACTIVE
    }
  ]);

  const [transferOrders, setTransferOrders] = useState([
    {
      id: 'TRF-001',
      transferNumber: 'MUTASI-2026-8819',
      sourceDepot: 'Gudang Farmasi Sentral',
      targetDepot: 'Depo Farmasi Rawat Inap',
      medicationName: 'Ceftriaxone 1g Vial',
      requestedQty: 50,
      status: 'DISPATCHED',
      dispatchedBy: 'Apt. Logistik Gudang',
      dispatchedAt: '08:30 WIB'
    }
  ]);

  const [quarantineReason, setQuarantineReason] = useState('');
  const [selectedBatchForQuarantine, setSelectedBatchForQuarantine] = useState(null);

  const currentDepotBatches = batches
    .filter(b => b.depotId === selectedDepot)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const getDaysUntilExpiry = (expiryDate) => {
    const diffTime = new Date(expiryDate).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSimulateFefoDeduct = (medCode) => {
    const matchingBatches = currentDepotBatches.filter(b => b.medicationCode === medCode && b.status !== BATCH_STATUS.QUARANTINED);
    if (matchingBatches.length === 0) {
      toast.error('Tidak ada stok FEFO aktif yang tersedia!');
      return;
    }

    const targetBatch = matchingBatches[0]; // Earliest expiry
    if (targetBatch.currentQuantity < 5) {
      toast.error('Stok tidak mencukupi untuk pemotongan FEFO!');
      return;
    }

    setBatches(prev => prev.map(b => b.id === targetBatch.id ? { ...b, currentQuantity: b.currentQuantity - 5 } : b));
    toast.success(`Dipotong 5 unit via FEFO dari batch ${targetBatch.batchNumber} (Kedaluwarsa: ${targetBatch.expiryDate})!`);
  };

  const handleQuarantineBatch = (batch) => {
    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: BATCH_STATUS.QUARANTINED } : b));
    toast.error(`Batch ${batch.batchNumber} (${batch.medicationName}) telah DIKARANTINA/RECALL! Tidak dapat didispensing.`);
    setSelectedBatchForQuarantine(null);
  };

  const handleReceiveTransfer = (transferId) => {
    setTransferOrders(prev => prev.map(t => t.id === transferId ? { ...t, status: 'RECEIVED', receivedBy: 'Apt. Rawat Inap' } : t));
    toast.success('Penerimaan mutasi stok berhasil! Stok telah ditambahkan ke Depo Rawat Inap via verifikasi batch/lot.');
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
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Multi-Depot FEFO & Batch/Expiry Inventory Engine</h3>
            <p className="text-xs text-slate-400">
              Logistik Farmasi RS: Gudang Utama ➔ Depo Rawat Inap ➔ Floor Stock Bangsal • FEFO Strict • Cold Chain 2-8°C • Karantina BPOM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 font-mono text-[11px]">
            JCI MMU & Permenkes 73/2016
          </span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('FEFO_BATCHES')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'FEFO_BATCHES'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          📦 Alokasi Stok FEFO Multi-Depot
        </button>
        <button
          onClick={() => setActiveTab('TRANSFER_MUTASI')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'TRANSFER_MUTASI'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          🔄 Mutasi Antar Depo (Stock Transfer)
        </button>
        <button
          onClick={() => setActiveTab('COLD_CHAIN')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'COLD_CHAIN'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          ❄️ Cold Chain Monitoring (2-8°C)
        </button>
      </div>

      {/* Tab 1: FEFO Batches Table */}
      {activeTab === 'FEFO_BATCHES' && (
        <div className="space-y-3">
          {/* Depot Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-wrap text-xs font-bold">
            {depots.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDepot(d.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedDepot === d.id
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono text-[11px]">
                  <th className="py-2 px-3">PRIORITAS FEFO</th>
                  <th className="py-2 px-3">NAMA OBAT & KODE</th>
                  <th className="py-2 px-3">BATCH / LOT</th>
                  <th className="py-2 px-3">KEDALUWARSA (EXPIRY)</th>
                  <th className="py-2 px-3">SISA STOK</th>
                  <th className="py-2 px-3">STATUS BATCH</th>
                  <th className="py-2 px-3 text-right">AKSI FEFO / SAFETY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {currentDepotBatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada batch obat aktif di depo ini saat ini.
                    </td>
                  </tr>
                ) : (
                  currentDepotBatches.map((batch, idx) => {
                    const daysLeft = getDaysUntilExpiry(batch.expiryDate);
                    const isCriticalExpiry = daysLeft < 90;
                    const isQuarantined = batch.status === BATCH_STATUS.QUARANTINED;

                    return (
                      <tr key={batch.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isQuarantined ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}`}>
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
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {batch.batchNumber}
                          <div className="text-[10px] text-slate-400 font-normal">Lot: {batch.lotNumber}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                            isCriticalExpiry
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {batch.expiryDate} ({daysLeft} hari)
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-black text-slate-800 dark:text-slate-200 text-sm">
                            {batch.currentQuantity} unit
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isQuarantined ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black border border-rose-300 text-[10px]">
                              ⛔ DIKARANTINA / RECALL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                              ✓ AKTIF
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          {!isQuarantined && (
                            <>
                              <button
                                onClick={() => handleSimulateFefoDeduct(batch.medicationCode)}
                                className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-bold text-[11px] border border-teal-200 dark:border-teal-800 transition-all cursor-pointer"
                              >
                                Potong FEFO (-5)
                              </button>
                              <button
                                onClick={() => handleQuarantineBatch(batch)}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                              >
                                Karantina
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Transfer */}
      {activeTab === 'TRANSFER_MUTASI' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">Daftar Surat Mutasi Stok Antar Depo</h4>
            <span className="text-slate-400 text-xs">Otomatisasi Dispatch & Receipt Reconciliation</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono text-[11px]">
                  <th className="py-2 px-3">NO MUTASI</th>
                  <th className="py-2 px-3">ASAL DEPOT</th>
                  <th className="py-2 px-3">TUJUAN DEPOT</th>
                  <th className="py-2 px-3">OBAT & JUMLAH</th>
                  <th className="py-2 px-3">STATUS TRANSFER</th>
                  <th className="py-2 px-3 text-right">AKSI VERIFIKASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {transferOrders.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-teal-600">{t.transferNumber}</td>
                    <td className="py-3 px-3">{t.sourceDepot}</td>
                    <td className="py-3 px-3">{t.targetDepot}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {t.medicationName} ({t.requestedQty} unit)
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.status === 'DISPATCHED' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {t.status === 'DISPATCHED' ? (
                        <button
                          onClick={() => handleReceiveTransfer(t.id)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Terima & Tambah Stok
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Selesai Diterima</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cold Chain Monitoring */}
      {activeTab === 'COLD_CHAIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">Chiller Depo Rawat Inap (Insulin & Vaksin)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">NORMAL (4.2°C)</span>
            </div>
            <div className="text-xs text-slate-500">Rentang Target: 2.0°C - 8.0°C • Sensor IoT RT-2026-CH01</div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <div>Batch Tersimpan: BATCH-NVR-2026C (Novorapid Flexpen)</div>
              <div>Status: Tidak ada riwayat deviasi suhu dalam 30 hari terakhir.</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200">Ruang Simpan Suhu Kamar (Gudang Utama)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">NORMAL (21.4°C)</span>
            </div>
            <div className="text-xs text-slate-500">Rentang Target: 15.0°C - 25.0°C • AC Inverter HVAC Terkoneksi</div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <div>Batch Tersimpan: Ceftriaxone, Paracetamol, Meropenem</div>
              <div>Kelembaban Relatif (RH): 52% (Optimal)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
