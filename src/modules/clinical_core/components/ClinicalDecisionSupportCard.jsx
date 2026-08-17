import React from 'react';

export default function ClinicalDecisionSupportCard({ diagnosis, vitals, onApplyProtocol }) {
  if (!diagnosis) return null;

  const diagLower = (typeof diagnosis === 'string' ? diagnosis : diagnosis.name || '').toLowerCase();

  const getProtocols = () => {
    if (diagLower.includes('sepsis') || diagLower.includes('syok septik')) {
      return {
        title: '🚨 Hour-1 Sepsis Bundle (Surviving Sepsis Campaign 2026)',
        severity: 'CRITICAL',
        badge: 'SURVIVING SEPSIS 2026',
        items: [
          'Ambil Kultur Darah sebelum pemberian antibiotik spektrum luas',
          'Pemeriksaan Laktat Darah Serial (Target < 2 mmol/L)',
          'Berikan Antibiotik Spektrum Luas IV dalam 1 jam pertama',
          'Resusitasi Cairan Kristaloid 30 mL/kgBB untuk hipotensi / laktat ≥ 4 mmol/L'
        ],
        orders: ['LAB-KULTUR', 'LAB-LAKTAT', 'RX-CEFTRIAXONE', 'RX-RL-30ML']
      };
    }

    if (diagLower.includes('stemi') || diagLower.includes('coronary') || diagLower.includes('jantung koroner') || diagLower.includes('infark')) {
      return {
        title: '⚡ Acute Coronary Syndrome (ACS / STEMI) Rapid Pathway',
        severity: 'HIGH',
        badge: 'AHA / PERKI 2026',
        items: [
          'Perekaman EKG 12-Lead selesai dalam waktu ≤ 10 menit',
          'Pemberian Loading Antiplatelet Ganda: Aspilet 160-320 mg + Clopidogrel 300-600 mg',
          'Pemeriksaan Cito Troponin I / T kuantitatif',
          'Konsultasi Sp.JP Cito untuk aktivasi Primary PCI'
        ],
        orders: ['RAD-EKG', 'LAB-TROPONIN', 'RX-ASPILET', 'RX-CLOPIDOGREL']
      };
    }

    if (diagLower.includes('dhf') || diagLower.includes('dengue') || diagLower.includes('dbd')) {
      return {
        title: '🦟 Protokol Terapi DHF / Dengue Fase Kritis (WHO)',
        severity: 'MEDIUM',
        badge: 'WHO DENGUE GUIDELINE',
        items: [
          'Monitoring Darah Lengkap serial (Trombosit & Hematokrit) per 12 jam',
          'Resusitasi cairan kristaloid rumatan sesuai rumus BB (Hindari Overhidrasi)',
          'KONTRAINDIKASI NSAID / Asam Mefenamat / Aspirin (Risiko perdarahan gastrointestinal)'
        ],
        orders: ['LAB-DL-SERIAL', 'RX-PARACETAMOL', 'RX-RL-MAINTENANCE']
      };
    }

    return null;
  };

  const protocol = getProtocols();
  if (!protocol) return null;

  return (
    <div className={`p-4 rounded-2xl border transition-all animate-in fade-in duration-300 ${
      protocol.severity === 'CRITICAL'
        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
        : protocol.severity === 'HIGH'
        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-600 text-[20px]">smart_toy</span>
          <h4 className="text-xs font-black text-slate-900 dark:text-white">{protocol.title}</h4>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
          {protocol.badge}
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 mb-3">
        {protocol.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-rose-600 font-bold">✓</span>
            <span className="font-medium text-[11px]">{item}</span>
          </div>
        ))}
      </div>

      {onApplyProtocol && (
        <button
          onClick={() => onApplyProtocol(protocol.orders)}
          className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">playlist_add_check</span>
          <span>Terapkan Paket Order Protokol Ini Sekaligus</span>
        </button>
      )}
    </div>
  );
}
