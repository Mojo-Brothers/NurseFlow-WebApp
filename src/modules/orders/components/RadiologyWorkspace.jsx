import React from 'react';
import { useOrdersStore } from '../store/orders.store.js';

export default function RadiologyWorkspace({ onNavigateViewer }) {
  const { radOrders, acquireImages } = useOrdersStore();

  const handleAcquire = async (id) => {
    await acquireImages({ radOrderId: id, imageCount: 4 });
    alert('Gambar radiologi berhasil diakuisisi dari modalitas ke PACS!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Manajemen Pemeriksaan Radiologi (RIS Worklist)
          </h4>
          <p className="text-[11px] text-on-surface-variant">Penjadwalan modalitas, DICOM Study UID & akuisisi citra radiologi.</p>
        </div>
      </div>

      <div className="space-y-3">
        {radOrders.map(rad => (
          <div key={rad.id} className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                  Modalitas: {rad.modality}
                </span>
                <h4 className="text-sm font-black text-on-surface mt-1.5">{rad.examination_name}</h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  DICOM Study UID: <span className="text-primary">{rad.dicom_study_uid}</span>
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600">
                {rad.result_status}
              </span>
            </div>

            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-[10px] font-mono text-on-surface-variant">
                Tarif: Rp {rad.unit_price.toLocaleString('id-ID')} &bull; Citra: {rad.image_count || 0} Seri
              </span>

              <div className="flex items-center gap-2">
                {rad.result_status === 'ORDERED' && (
                  <button
                    onClick={() => handleAcquire(rad.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                    <span>1. Akuisisi Citra (Modality Scan)</span>
                  </button>
                )}

                {(rad.result_status === 'IMAGE_ACQUIRED' || rad.result_status === 'RELEASED') && (
                  <button
                    onClick={onNavigateViewer}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>2. Buka DICOM Viewer & Ekspertise &rarr;</span>
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
