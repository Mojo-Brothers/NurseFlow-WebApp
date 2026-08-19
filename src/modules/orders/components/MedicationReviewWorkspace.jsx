import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useOrdersStore } from '../store/orders.store.js';

export default function MedicationReviewWorkspace({ onReviewed }) {
  const { medicationOrders, reviewPrescription } = useOrdersStore();

  const [adminCheck, setAdminCheck] = useState(true);
  const [pharmaCheck, setPharmaCheck] = useState(true);
  const [clinicalCheck, setClinicalCheck] = useState(true);
  const [pharmacistName, setPharmacistName] = useState('apt. Dimas Anggara, S.Farm');

  const handleReview = async (medOrder, verdict) => {
    try {
      await reviewPrescription({
        orderId: medOrder.order_id,
        medicationOrderId: medOrder.id,
        pharmacistName,
        administrativeCheck: adminCheck,
        pharmaceuticalCheck: pharmaCheck,
        clinicalCheck,
        reviewVerdict: verdict,
        clinicalNotes: verdict === 'APPROVED' ? 'Telaah resep farmasi disetujui, siap dispensing.' : 'Peringatan klinis di-override oleh farmasis.'
      });
      toast.success(`💊 Telaah Resep untuk ${medOrder.medication_name} Berhasil Disimpan: ${verdict}`);
      if (onReviewed) onReviewed();
    } catch (err) {
      toast.error(`Gagal Menyimpan Telaah: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Meja Telaah Resep Farmasi Klinis (7 Benar & Safeguard Review)
          </h4>
          <p className="text-[11px] text-on-surface-variant">Kepatuhan Permenkes No. 72/2016: Telaah Administratif, Farmasetik, dan Klinis.</p>
        </div>
      </div>

      <div className="space-y-3">
        {medicationOrders.map(med => (
          <div key={med.id} className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                    {med.medication_code}
                  </span>
                  {med.high_alert && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                      HIGH-ALERT
                    </span>
                  )}
                  {med.lasa_flag && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-600 text-white">
                      LASA
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-on-surface mt-1.5">{med.medication_name}</h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  Dosis: {med.dosage} &bull; Rute: {med.route} &bull; Aturan: {med.frequency} &bull; Jumlah: {med.quantity} unit
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm font-black font-mono text-primary">Rp {med.total_price.toLocaleString('id-ID')}</span>
                <span className="text-[10px] font-mono text-on-surface-variant block">{med.status}</span>
              </div>
            </div>

            {/* Checklist 7 Benar */}
            <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 grid grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                <input type="checkbox" checked={adminCheck} onChange={(e) => setAdminCheck(e.target.checked)} className="rounded text-teal-600" />
                <span>1. Telaah Administratif (Identitas/SIP)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                <input type="checkbox" checked={pharmaCheck} onChange={(e) => setPharmaCheck(e.target.checked)} className="rounded text-teal-600" />
                <span>2. Telaah Farmasetik (Bentuk/Dosis)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface">
                <input type="checkbox" checked={clinicalCheck} onChange={(e) => setClinicalCheck(e.target.checked)} className="rounded text-teal-600" />
                <span>3. Telaah Klinis (Alergi/DDI)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/20">
              <button
                onClick={() => handleReview(med, 'APPROVED')}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Setujui Resep (Approved Safe)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
