import React from 'react';

export default function PatientWristbandPrintPreview({ patient, onClose }) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-2xl border border-outline-variant/30 space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">badge</span>
            <h3 className="text-sm font-headline font-black text-on-surface uppercase tracking-wider">
              Pratinjau Gelang Pasien (JCI IPSG 1)
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ─── Standard JCI Patient Identification Wristband Simulation ─── */}
        <div className="p-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-900 shadow-md font-mono space-y-2">
          <div className="flex items-start justify-between border-b border-slate-300 pb-2">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500">RS NURSEFLOW ENTERPRISE JAKARTA</p>
              <h4 className="text-base font-black text-black tracking-tight">{patient.patient_name || patient.full_name}</h4>
              <p className="text-xs font-bold text-slate-700">NIK: {patient.nik || '3171055508890001'}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-200 rounded text-black block">RAWAT INAP/JALAN</span>
              <p className="text-xs font-black text-rose-700 mt-1">{patient.gender === 'FEMALE' ? 'WANITA' : 'PRIA'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <div>
              <p className="text-slate-600">No. Rekam Medis (MRN):</p>
              <p className="font-black text-sm text-black">{patient.mrn}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-600">Tanggal Lahir:</p>
              <p className="font-black text-xs text-black">{patient.birth_date || '1989-08-15'}</p>
            </div>
          </div>

          <div className="p-2 bg-slate-100 rounded-lg flex items-center justify-between text-[10px] text-slate-600 border border-slate-200">
            <span>|||||||| ||||| |||||||||||| ||||||||||</span>
            <span className="font-bold text-teal-800">BARCODE 2D TERSTANDARISASI JCI IPSG 1</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface cursor-pointer">
            Tutup
          </button>
          <button
            onClick={() => {
              window.print();
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak Gelang Pasien</span>
          </button>
        </div>
      </div>
    </div>
  );
}
