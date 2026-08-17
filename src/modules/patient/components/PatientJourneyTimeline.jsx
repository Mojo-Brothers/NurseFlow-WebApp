import React from 'react';

export default function PatientJourneyTimeline({ patient, encounter }) {
  // Synthesize rich clinical event journey based on current patient and encounter state
  const timelineEvents = [
    {
      id: 'EVT-1',
      title: 'Pendaftaran / Registrasi Pasien',
      timestamp: '08:12 WIB',
      department: 'Loket Admisi & Rekam Medis',
      actor: 'Petugas Admisi Rina',
      status: 'COMPLETED',
      icon: 'how_to_reg',
      details: `Pasien terdaftar dengan No. RM ${patient?.mrn || 'MRN-2026-001'} (Penjamin: ${patient?.payer || 'BPJS Kesehatan'}). Verifikasi biometrik & NIK SATUSEHAT sukses.`
    },
    {
      id: 'EVT-2',
      title: 'Triase Gawat Darurat (Emergency Severity Index)',
      timestamp: '08:17 WIB',
      department: 'Instalasi Gawat Darurat',
      actor: 'Ns. Sarah, S.Kep',
      status: 'COMPLETED',
      icon: 'emergency',
      details: 'Skor Triase: ESI Kategori 2 (Emergent). TTV: TD 152/89 mmHg, Nadi 102x/m, SpO2 96%, Skala Nyeri 7/10. Penempatan: Bed A-12 IGD.'
    },
    {
      id: 'EVT-3',
      title: 'Pemeriksaan Klinis Awal & SOAP DPJP',
      timestamp: '08:25 WIB',
      department: 'Ruang Tindakan IGD',
      actor: 'dr. Surya Johnson, Sp.PD-KGEH',
      status: 'COMPLETED',
      icon: 'stethoscope',
      details: 'Pemeriksaan fisik menunjukkan distensi abdomen & defans muskular lokal di kuadran kanan bawah. Diagnosis Kerja: Suspek Akut Appendisitis.'
    },
    {
      id: 'EVT-4',
      title: 'Order Penunjang Cito: Laboratorium & Radiologi',
      timestamp: '08:31 WIB',
      department: 'Instalasi Laboratorium & Radiologi',
      actor: 'dr. Surya Johnson, Sp.PD-KGEH',
      status: 'COMPLETED',
      icon: 'science',
      details: 'Order Hematologi Lengkap, CRP kuantitatif, Urinalisis, dan USG Abdomen Whole. Status: Sampel darah terambil & diproses di analyzer.'
    },
    {
      id: 'EVT-5',
      title: 'Uji Silang Serasi Darah (Crossmatch BDRS)',
      timestamp: '08:42 WIB',
      department: 'Bank Darah Rumah Sakit (BDRS)',
      actor: 'Analis BDRS Ahmad',
      status: 'COMPLETED',
      icon: 'bloodtype',
      details: 'Permintaan 2 Bag PRC Golongan O Rh+. Uji Mayor/Minor: KOMPATIBEL. Kantong #UTD-88219 siap diserahterimakan.'
    },
    {
      id: 'EVT-6',
      title: 'Persiapan Tindakan Operasi Cito (IBS)',
      timestamp: '09:15 WIB',
      department: 'Instalasi Bedah Sentral (Kamar Operasi 2)',
      actor: 'dr. Budi Santoso, Sp.B',
      status: 'IN_PROGRESS',
      icon: 'theater_comedy',
      details: 'Penjadwalan Laparoscopic Appendectomy. Verifikasi WHO Surgical Safety Checklist (Fase Sign-In) selesai.'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
            <span className="material-symbols-outlined text-[20px]">timeline</span>
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Alur Perjalanan Pasien (Patient Journey Timeline)</h3>
            <p className="text-[11px] text-slate-500">Jejak peristiwa klinis dan administratif end-to-end terverifikasi</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
          EPISODE RAWAT AKTIF
        </span>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {timelineEvents.map((evt, idx) => (
          <div key={evt.id} className="relative group">
            {/* Timeline Bullet */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] ${
              evt.status === 'COMPLETED'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-blue-600 text-white animate-ping'
            }`}>
              <span className="material-symbols-outlined text-[12px]">{evt.icon}</span>
            </div>

            {/* Event Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-1.5 hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-black text-slate-900 dark:text-white">{evt.title}</span>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                  {evt.timestamp}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {evt.details}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-200/50 dark:border-slate-800/80">
                <span>Unit: {evt.department}</span>
                <span>Oleh: {evt.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
