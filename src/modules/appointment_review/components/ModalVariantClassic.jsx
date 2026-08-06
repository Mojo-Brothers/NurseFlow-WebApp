import React from 'react';

export default function ModalVariantClassic({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">badge</span>
            <h2 className="font-extrabold text-sm uppercase tracking-wider">DETAIL PASIEN (Varian 1: Classic Medical Grid)</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-medium">
          
          {/* Section 1: Demografi Utama */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 pb-1">
              Identitas Utama Pasien
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Nomor Medrec:</label>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">00414097</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block">Nama Lengkap Pasien:</label>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">Ny. SRI SUWARNINGSIH</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Nama Panggilan:</label>
                <div className="font-semibold text-slate-800 dark:text-slate-200">SRI SUWARN</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Jenis Kelamin:</label>
                <div className="font-bold text-slate-800 dark:text-slate-200">Perempuan</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Golongan Darah:</label>
                <div className="font-bold text-red-600 dark:text-red-400">O+</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block">Tempat / Tgl. Lahir:</label>
                <div className="font-bold text-slate-800 dark:text-slate-200">GOMBONG, 03/09/1974 (51 Thn)</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Identitas (KTP):</label>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">3175074309740005</div>
              </div>
            </div>
          </div>

          {/* Section 2: Status & Alamat */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 pb-1">
              Status Sosial & Alamat Domisili
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Status Perkawinan:</label>
                <div className="font-semibold">Menikah</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Agama:</label>
                <div className="font-semibold">Islam</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Pendidikan:</label>
                <div className="font-semibold">SLTA / Sederajat</div>
              </div>

              <div className="md:col-span-3">
                <label className="text-[10px] font-bold text-slate-500 block">Alamat Rumah:</label>
                <div className="font-bold text-slate-900 dark:text-slate-100">KP RAWADAS RT 010/003</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Kelurahan / Kodepos:</label>
                <div>Pondok Kopi (13460)</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Kecamatan:</label>
                <div>Duren Sawit</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Kota / Negara:</label>
                <div>Jakarta Timur, INDONESIA</div>
              </div>
            </div>
          </div>

          {/* Section 3: Kontak */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-extrabold text-teal-700 dark:text-teal-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700 pb-1">
              Kontak Pasien
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Telepon:</label>
                <div className="font-mono">081248831282</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Ponsel (WA):</label>
                <div className="font-mono font-bold text-teal-700 dark:text-teal-300">08129695149</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">Email:</label>
                <div className="font-mono text-slate-700 dark:text-slate-300">srirarasuwarningsih@gmail.com</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-6 py-1.5 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded hover:bg-slate-400 transition-colors cursor-pointer">
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
