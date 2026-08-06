import React, { useState } from 'react';

export default function ModalVariantDrawer({ isOpen, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Right Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">side_navigation</span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Detail Pasien (Inspector Drawer)</h3>
                <p className="text-[10px] text-slate-500 font-medium">Side-Panel EHR Inspector</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            
            {/* Patient Header Card */}
            <div className="p-4 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-[11px]">RM: 00414097</span>
                  <button 
                    onClick={() => handleCopy('00414097', 'MRN')}
                    className="px-1.5 py-0.5 text-[10px] bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 rounded font-bold hover:bg-teal-300 cursor-pointer"
                  >
                    {copiedField === 'MRN' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <span className="px-2 py-0.5 bg-teal-600 text-white font-extrabold text-[10px] rounded">Perempuan</span>
              </div>
              <h4 className="font-black text-base text-slate-900 dark:text-white">Ny. SRI SUWARNINGSIH</h4>
              <p className="text-[11px] text-slate-500 font-medium">GOMBONG, 03/09/1974 (51 Thn) • Gol. Darah: O+</p>
            </div>

            {/* Field Groups */}
            <div className="space-y-4 font-medium text-slate-700 dark:text-slate-300">
              
              <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h5 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Identitas Resmi</h5>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">KTP (NIK):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">3175074309740005</span>
                    <button 
                      onClick={() => handleCopy('3175074309740005', 'NIK')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded font-bold hover:bg-teal-600 hover:text-white cursor-pointer"
                    >
                      {copiedField === 'NIK' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Nama Panggilan:</span>
                  <span className="font-bold">SRI SUWARN</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status Perkawinan:</span>
                  <span className="font-bold">Menikah</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Agama:</span>
                  <span className="font-bold">Islam</span>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Domisili</h5>
                  <button 
                    onClick={() => handleCopy('KP RAWADAS RT 010/003, Kel. Pondok Kopi, Kec. Duren Sawit', 'Alamat')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded font-bold hover:bg-teal-600 hover:text-white cursor-pointer"
                  >
                    {copiedField === 'Alamat' ? '✓ Copied' : 'Copy Alamat'}
                  </button>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block text-[10px]">Alamat Lengkap:</span>
                  <span className="font-bold text-slate-900 dark:text-white">KP RAWADAS RT 010/003</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kelurahan:</span>
                  <span className="font-bold">Pondok Kopi (13460)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kecamatan:</span>
                  <span className="font-bold">Duren Sawit</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Kota & Negara:</span>
                  <span className="font-bold">Jakarta Timur, INDONESIA</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold text-[10px] uppercase text-slate-400 tracking-wider">Kontak Pasien</h5>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Ponsel / WhatsApp:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-teal-600">08129695149</span>
                    <button 
                      onClick={() => handleCopy('08129695149', 'Phone')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded font-bold hover:bg-teal-600 hover:text-white cursor-pointer"
                    >
                      {copiedField === 'Phone' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Telepon Rumah:</span>
                  <span className="font-mono">081248831282</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Email:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[150px]">dewi.sartika@example.com</span>
                    <button 
                      onClick={() => handleCopy('dewi.sartika@example.com', 'Email')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 rounded font-bold hover:bg-teal-600 hover:text-white cursor-pointer"
                    >
                      {copiedField === 'Email' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 bg-slate-200 dark:bg-slate-700 font-bold rounded-lg hover:bg-slate-300 text-slate-800 dark:text-slate-200 cursor-pointer">
              Tutup Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
