import React from 'react';

export default function ModalVariantPassport({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl w-full max-w-3xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-600 p-6 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                NS
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                  PASSPORT PASIEN DIGITAL
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">
                  Ny. SRI SUWARNINGSIH
                </h2>
                <div className="flex items-center gap-3 text-xs text-teal-100 font-medium mt-0.5">
                  <span className="font-mono font-bold">RM: 00414097</span>
                  <span>•</span>
                  <span>Perempuan (51 Thn)</span>
                  <span>•</span>
                  <span className="font-bold text-amber-300">Gol. Darah O+</span>
                </div>
              </div>
            </div>

            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Official ID Pill Badge */}
          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">verified</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">NIK (KTP Terverifikasi):</span>
              <span className="font-mono font-black text-slate-900 dark:text-white text-sm">3175074309740005</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold rounded-full border border-emerald-300">
              STATUS: MENIKAH
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Biodata */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person</span> Biodata Lengkap
              </h4>
              
              <div className="space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Panggilan:</span>
                  <span className="font-bold">SRI SUWARN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tempat Lahir:</span>
                  <span className="font-bold">GOMBONG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Lahir:</span>
                  <span className="font-bold font-mono">03/09/1974</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agama:</span>
                  <span className="font-bold">Islam</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pendidikan:</span>
                  <span className="font-bold">SLTA / Sederajat</span>
                </div>
              </div>
            </div>

            {/* Card 2: Kontak & Alamat */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span> Domisili & Kontak
              </h4>

              <div className="space-y-1.5 font-medium text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Alamat:</span>
                  <span className="font-bold text-slate-900 dark:text-white">KP RAWADAS RT 010/003</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kelurahan:</span>
                  <span className="font-bold">Pondok Kopi (13460)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kecamatan:</span>
                  <span className="font-bold">Duren Sawit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ponsel:</span>
                  <span className="font-bold font-mono text-teal-600">08129695149</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-[11px] truncate max-w-[150px]">srirarasuwarningsih@gmail.com</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95">
            Tutup Informasi
          </button>
        </div>

      </div>
    </div>
  );
}
