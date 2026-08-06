import React from 'react';

const DISCHARGE_MOCK = [
  { regId: 'P260800567', rm: '00490084', nama: 'SRI INDAH FILAELY', bangsal: 'CHRYSANT', progress: 65, step: 'Penyelesaian Billing Kasir' },
  { regId: 'P260800167', rm: '00302274', nama: 'GIBRAN AMMAR HARYANTO', bangsal: 'CHRYSANT', progress: 40, step: 'Pengambilan Obat Farmasi' },
  { regId: 'P260801568', rm: '00472328', nama: 'SRI MULYANI', bangsal: 'CHRYSANT', progress: 100, step: 'Lengkap - Siap Keluar' },
  { regId: 'P260802606', rm: '00474022', nama: 'WAHYU NUGRAHANINGSIH', bangsal: 'CHRYSANT', progress: 20, step: 'Penyusunan Resume Medis' },
  { regId: 'P260801826', rm: '00491808', nama: 'MARYAM SAKINAH ALYAHYA', bangsal: 'CHRYSANT', progress: 75, step: 'Verifikasi Klaim Asuransi' },
  { regId: 'P260801751', rm: '00462629', nama: 'KEYSHA ALMIRA BAIHAQI', bangsal: 'CHRYSANT', progress: 100, step: 'Lengkap - Siap Keluar' },
];

export default function DischargeModalList({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-800 to-cyan-900 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
              LIVE PROGRESS TRACKER
            </span>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Daftar Pasien Proses Pulang (Varian 3: Progress List)
            </h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body Cards List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50 dark:bg-slate-950">
          {DISCHARGE_MOCK.map((p) => (
            <div key={p.regId} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Left Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-red-600 text-xs">{p.regId}</span>
                  <span className="text-[10px] font-bold text-slate-400">RM: {p.rm}</span>
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                    {p.bangsal}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{p.nama}</h4>
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">{p.step}</p>
              </div>

              {/* Right Progress & Action */}
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Progress</span>
                    <span className={p.progress === 100 ? 'text-emerald-600 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
                      {p.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${p.progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                      style={{ width: `${p.progress}%` }}
                    ></div>
                  </div>
                </div>

                <button className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                  p.progress === 100 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}>
                  {p.progress === 100 ? 'Checkout' : 'Detail'}
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl cursor-pointer">
            Tutup Tracker
          </button>
        </div>

      </div>
    </div>
  );
}
