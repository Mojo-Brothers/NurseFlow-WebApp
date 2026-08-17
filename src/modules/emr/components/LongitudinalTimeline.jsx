import React from 'react';
import { useEmrStore } from '../store/emr.store.js';

export default function LongitudinalTimeline() {
  const { patientTimeline } = useEmrStore();

  if (!patientTimeline) {
    return <p className="text-xs text-on-surface-variant">Memuat rekam medis longitudinal...</p>;
  }

  return (
    <div className="space-y-6">
      
      {/* ─── Timeline Overview Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Total Peristiwa Klinis</span>
          <span className="text-3xl font-headline font-black text-teal-600">{patientTimeline.total_clinical_events}</span>
          <p className="text-[11px] text-on-surface-variant">Terintegrasi lintas episode & encounter.</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Peringatan Alergi Aktif</span>
          <span className="text-3xl font-headline font-black text-rose-600">{patientTimeline.allergies_count}</span>
          <p className="text-[11px] text-rose-500">Tercatat pada profil keselamatan pasien JCI.</p>
        </div>

        <div className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-1">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Format Standar</span>
          <span className="text-lg font-headline font-black text-primary">HL7 FHIR R4</span>
          <p className="text-[11px] text-on-surface-variant">Kompatibel penuh SATUSEHAT Kemenkes.</p>
        </div>
      </div>

      {/* ─── Chronological Care Journey Stream ─── */}
      <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <h4 className="text-sm font-headline font-black text-on-surface uppercase">
          Alur Perjalanan Klinis Pasien (Longitudinal Medical Journey)
        </h4>

        <div className="relative border-l-2 border-outline-variant/40 ml-4 pl-6 space-y-6">
          {patientTimeline.timeline.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-surface" />

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {new Date(item.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>

                <h5 className="text-xs font-black text-on-surface">{item.title}</h5>
                <p className="text-[11px] text-on-surface-variant">{item.subtitle}</p>

                {item.details && (
                  <div className="mt-2 p-2.5 rounded-xl bg-surface-container-highest font-mono text-[10px] text-on-surface-variant whitespace-pre-line">
                    {item.details}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
