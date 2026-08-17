import React from 'react';
import { useOrdersStore } from '../store/orders.store.js';

export default function OrderTimelineWorkspace() {
  const { orders } = useOrdersStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Alur & Riwayat Order Klinis Universal (Order FSM History)
          </h4>
          <p className="text-[11px] text-on-surface-variant">Traceability penuh dari DRAFT &rarr; ORDERED &rarr; VERIFIED &rarr; IN_PROGRESS &rarr; COMPLETED.</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(ord => (
          <div key={ord.id} className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-teal-600 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                    {ord.order_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface">
                    {ord.order_category}
                  </span>
                  {ord.is_cito && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                      CITO
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-black text-on-surface mt-1.5">{ord.patient_name} (MRN: {ord.mrn})</h4>
                <p className="text-xs text-on-surface-variant">Indikasi: {ord.clinical_indication}</p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-on-surface-variant block">Status FSM</span>
                <strong className="text-sm text-teal-600 dark:text-teal-400">{ord.status}</strong>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase block">Jejak Audit Status (Audit Trail):</span>
              <div className="space-y-1 text-[11px] font-mono">
                {ord.history?.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-on-surface">
                    <span>
                      <strong className="text-teal-600 mr-2">[{h.status}]</strong> {h.actor} {h.note && `— ${h.note}`}
                    </span>
                    <span className="text-on-surface-variant">{new Date(h.timestamp).toLocaleTimeString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
