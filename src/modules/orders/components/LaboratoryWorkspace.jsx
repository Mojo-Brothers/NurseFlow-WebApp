import React from 'react';
import { useOrdersStore } from '../store/orders.store.js';

export default function LaboratoryWorkspace({ onNavigateResults }) {
  const { labOrders, updateSpecimenStatus } = useOrdersStore();

  const handleCollect = async (id) => {
    await updateSpecimenStatus({ labOrderId: id, nextStatus: 'SPECIMEN_COLLECTED' });
    alert('Spesimen berhasil diambil (Sample Barcoded).');
  };

  const handleReceive = async (id) => {
    await updateSpecimenStatus({ labOrderId: id, nextStatus: 'SPECIMEN_RECEIVED' });
    alert('Spesimen diterima di laboratorium (LIS In-Lab).');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Pengelolaan Spesimen Laboratorium (LIS Specimen Workflow)
          </h4>
          <p className="text-[11px] text-on-surface-variant">Tahapan: Order Masuk &rarr; Pengambilan Sampel &rarr; Penerimaan di Lab &rarr; Analyzer.</p>
        </div>
      </div>

      <div className="space-y-3">
        {labOrders.map(lab => (
          <div key={lab.id} className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                  LOINC: {lab.loinc_code}
                </span>
                <h4 className="text-sm font-black text-on-surface mt-1.5">{lab.test_name}</h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  Jenis Spesimen: <strong>{lab.specimen_type}</strong> &bull; Rujukan: {lab.reference_range}
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600">
                {lab.result_status}
              </span>
            </div>

            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-on-surface-variant">
                Tarif: Rp {lab.unit_price.toLocaleString('id-ID')}
              </span>

              <div className="flex items-center gap-2">
                {lab.result_status === 'ORDERED' && (
                  <button
                    onClick={() => handleCollect(lab.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    1. Ambil Sampel (Sampling)
                  </button>
                )}

                {lab.result_status === 'SPECIMEN_COLLECTED' && (
                  <button
                    onClick={() => handleReceive(lab.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    2. Terima di Laboratorium
                  </button>
                )}

                {(lab.result_status === 'SPECIMEN_RECEIVED' || lab.result_status === 'ANALYZING') && (
                  <button
                    onClick={onNavigateResults}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    3. Buka Panel Validasi Analyzer &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
