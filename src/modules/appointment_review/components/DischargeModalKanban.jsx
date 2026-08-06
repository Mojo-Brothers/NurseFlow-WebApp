import React from 'react';

const STAGE_1 = [
  { regId: 'P260802606', rm: '00474022', nama: 'WAHYU NUGRAHANINGSIH', bangsal: 'CHRYSANT' },
  { regId: 'P260802690', rm: '00492034', nama: 'LASIPAH', bangsal: 'CHRYSANT' },
];

const STAGE_2 = [
  { regId: 'P260800567', rm: '00490084', nama: 'SRI INDAH FILAELY', bangsal: 'CHRYSANT' },
  { regId: 'P260800167', rm: '00302274', nama: 'GIBRAN AMMAR HARYANTO', bangsal: 'CHRYSANT' },
  { regId: 'P260801826', rm: '00491808', nama: 'MARYAM SAKINAH ALYAHYA', bangsal: 'CHRYSANT' },
  { regId: 'P260802661', rm: '00495307', nama: 'SOIMAH', bangsal: 'CHRYSANT' },
];

const STAGE_3 = [
  { regId: 'P260801568', rm: '00472328', nama: 'SRI MULYANI', bangsal: 'CHRYSANT' },
  { regId: 'P260801751', rm: '00462629', nama: 'KEYSHA ALMIRA BAIHAQI', bangsal: 'CHRYSANT' },
  { regId: 'P260802339', rm: '00402909', nama: 'STEVANUS WILLIAM INDAP', bangsal: 'CHRYSANT' },
];

export default function DischargeModalKanban({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">view_kanban</span>
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">Daftar Pasien Proses Pulang (Varian 2: Discharge Kanban Pipeline)</h2>
              <p className="text-xs text-slate-400 font-medium">Pemantauan Alur Pemulangan Pasien per Tahapan Proses Medis & Billing</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Kanban Board Container */}
        <div className="p-6 overflow-x-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950">
          
          {/* Column 1: Tahap 1 - Medis & Resume */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <span className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> 1. Medis & Resume (2)
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {STAGE_1.map((p) => (
                <div key={p.regId} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-all space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-red-400 text-xs">{p.regId}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.bangsal}</span>
                  </div>
                  <div className="font-bold text-sm text-white">{p.nama}</div>
                  <div className="text-[10px] text-slate-400 font-mono">RM: {p.rm}</div>
                  <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                    <button className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded cursor-pointer">
                      Verifikasi Resume →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Tahap 2 - Billing & Farmasi */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <span className="font-black text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> 2. Billing & Farmasi (4)
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {STAGE_2.map((p) => (
                <div key={p.regId} className="p-3 bg-slate-800 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-red-400 text-xs">{p.regId}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.bangsal}</span>
                  </div>
                  <div className="font-bold text-sm text-white">{p.nama}</div>
                  <div className="text-[10px] text-slate-400 font-mono">RM: {p.rm}</div>
                  <div className="pt-2 border-t border-slate-700/50 flex justify-end">
                    <button className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded cursor-pointer">
                      Proses Kasir →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Tahap 3 - Siap Keluar / Checkout */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
              <span className="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 3. Siap Checkout (3)
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {STAGE_3.map((p) => (
                <div key={p.regId} className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400 transition-all space-y-1.5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-emerald-400 text-xs">{p.regId}</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded">SIAP PULANG</span>
                  </div>
                  <div className="font-bold text-sm text-white">{p.nama}</div>
                  <div className="text-[10px] text-slate-400 font-mono">RM: {p.rm} • {p.bangsal}</div>
                  <div className="pt-2 border-t border-emerald-900/40 flex justify-end">
                    <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold rounded-lg shadow-sm cursor-pointer active:scale-95">
                      ✓ Final Checkout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer">
            Tutup Kanban
          </button>
        </div>

      </div>
    </div>
  );
}
