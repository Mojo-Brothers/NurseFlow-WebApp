import React from 'react';
import { useOrdersStore } from '../store/orders.store.js';

export default function PharmacyWorkspace() {
  const { medicationOrders, dispenseMedication } = useOrdersStore();

  const handleDispense = async (orderId) => {
    try {
      await dispenseMedication({
        orderId,
        pharmacistName: 'apt. Dimas Anggara, S.Farm'
      });
      alert('Obat Berhasil Didispensasi & Diserahkan! Tagihan otomatis tercatat di Billing Ledger via Canonical Event.');
    } catch (err) {
      alert(`Gagal Melakukan Dispensing: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Antrean Dispensing & Penyerahan Obat Farmasi ({medicationOrders.length})
          </h4>
          <p className="text-[11px] text-on-surface-variant">Penyerahan obat langsung memproyeksikan tagihan ke Billing Ledger melalui Event Bus.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicationOrders.map(med => {
          const isDispensed = med.status === 'DISPENSED';

          return (
            <div key={med.id} className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                      {med.medication_code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDispensed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                      {med.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-on-surface mt-1.5">{med.medication_name}</h4>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Dosis: {med.dosage} &bull; Rute: {med.route} &bull; Qty: {med.quantity}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs text-on-surface-variant block">Total Tarif</span>
                  <strong className="text-sm text-primary">Rp {med.total_price.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 text-xs">
                <span className="text-[10px] text-on-surface-variant block font-bold">Instruksi Penggunaan:</span>
                <strong className="text-on-surface">{med.frequency} &bull; Durasi: {med.duration}</strong>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {isDispensed ? `Diserahkan oleh: ${med.verified_by}` : 'Siap Diserahkan'}
                </span>

                {!isDispensed && (
                  <button
                    onClick={() => handleDispense(med.order_id)}
                    className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Dispense & Serah Obat (Emit SERVICE_CHARGED)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
