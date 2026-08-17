import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ResuscitationBoardModal({ isOpen, onClose, patient, encounterId }) {
  const [cprSeconds, setCprSeconds] = useState(0);
  const [isCprRunning, setIsCprRunning] = useState(false);
  const [cprCycle, setCprCycle] = useState(1);
  const [rhythm, setRhythm] = useState('VF_PVT'); // 'VF_PVT' (Shockable) | 'ASYSTOLE_PEA' (Non-shockable)
  const [shocksDelivered, setShocksDelivered] = useState(0);
  const [epinephrineDoses, setEpinephrineDoses] = useState([]);
  const [teamLeader, setTeamLeader] = useState('dr. Surya Johnson, Sp.PD (Team Leader)');
  const [airwayOperator, setAirwayOperator] = useState('dr. David, Sp.An (Airway)');
  const [compressorNurse, setCompressorNurse] = useState('Ns. Sarah (Kompresi & Defibrilator)');

  useEffect(() => {
    let timer = null;
    if (isCprRunning) {
      timer = setInterval(() => {
        setCprSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCprRunning]);

  if (!isOpen || !patient) return null;

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDeliverShock = (joules = 200) => {
    setShocksDelivered(prev => prev + 1);
    toast.error(`⚡ DEFIBRILLATION DELIVERED: ${joules} Joule Biphasic Shock #${shocksDelivered + 1}! Lanjutkan CPR segera!`, {
      duration: 4000,
      icon: '⚡'
    });
  };

  const handleGiveEpi = () => {
    const nowStr = new Date().toLocaleTimeString('id-ID');
    const dose = `Epinefrin 1mg IV (${nowStr} - Siklus ${cprCycle})`;
    setEpinephrineDoses(prev => [...prev, dose]);
    toast.success(`💉 ${dose} diberikan & dicatat di log resusitasi!`);
  };

  const handleNextCycle = () => {
    setCprCycle(prev => prev + 1);
    setCprSeconds(0);
    toast('🔄 SIKLUS 2 MENIT SELESAI: Evaluasi irama jantung (Rhythm Check) & ganti kompresor dada!', {
      icon: '🔄',
      duration: 5000
    });
  };

  const handleRosc = () => {
    setIsCprRunning(false);
    toast.success(`🎉 ROSC (Return of Spontaneous Circulation) TERCAPAI! Nadi karotis teraba! Persiapkan stabilisasi pasca resusitasi & transfer ICU!`, {
      duration: 6000
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl border-2 border-rose-600 w-full max-w-3xl shadow-2xl flex flex-col p-6 gap-5 max-h-[95vh] overflow-y-auto">
        {/* Top Header Banner */}
        <div className="flex items-center justify-between border-b border-rose-900/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-black animate-pulse shadow-lg shadow-rose-600/50">
              <span className="material-symbols-outlined text-[28px]">emergency</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest">
                  CODE BLUE • RESUSCITASI AKTIF
                </span>
                <span className="text-xs font-mono text-rose-300">ESI 1 (IMMEDIATE)</span>
              </div>
              <h2 className="text-lg font-black text-white">{patient.name} ({patient.mrn})</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Resuscitation Stopwatches & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* CPR Stopwatch */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/50 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Timer Siklus CPR</span>
            <span className="font-mono text-4xl font-black text-white tracking-wider">
              {formatTimer(cprSeconds)}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setIsCprRunning(prev => !prev)}
                className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                  isCprRunning ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isCprRunning ? 'Jeda CPR' : 'Mulai CPR'}
              </button>
              <button
                onClick={handleNextCycle}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-black cursor-pointer"
              >
                Siklus Berikutnya
              </button>
            </div>
          </div>

          {/* Shock & Defibrillator */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/50 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Defibrilasi Biphasic</span>
            <span className="font-mono text-3xl font-black text-amber-400">
              {shocksDelivered}x Shock
            </span>
            <button
              onClick={() => handleDeliverShock(200)}
              className="mt-1 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md shadow-amber-500/40 cursor-pointer active:scale-95 transition-transform"
            >
              ⚡ DELIVER SHOCK 200J
            </button>
          </div>

          {/* Epinephrine Dosing */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-rose-900/50 flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Epinefrin 1mg IV</span>
            <span className="font-mono text-3xl font-black text-emerald-400">
              {epinephrineDoses.length} Dosis
            </span>
            <button
              onClick={handleGiveEpi}
              className="mt-1 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/40 cursor-pointer active:scale-95 transition-transform"
            >
              💉 Berikan Epinefrin 1mg
            </button>
          </div>
        </div>

        {/* Rhythm & Team Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cardiac Rhythm Selection */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Irama Jantung (Rhythm Evaluation)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRhythm('VF_PVT')}
                className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  rhythm === 'VF_PVT'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                ⚡ VF / Pulseless VT (Shockable)
              </button>
              <button
                onClick={() => setRhythm('ASYSTOLE_PEA')}
                className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  rhythm === 'ASYSTOLE_PEA'
                    ? 'bg-rose-700 text-white border-rose-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                🚫 Asystole / PEA (Non-Shockable)
              </button>
            </div>
          </div>

          {/* Resuscitation Team */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 text-xs">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Tim Resusitasi Bertugas</span>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
              <div>👨‍⚕️ {teamLeader}</div>
              <div>💨 {airwayOperator}</div>
              <div>❤️ {compressorNurse}</div>
            </div>
          </div>
        </div>

        {/* Action Log Stream */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Jejak Log Terapi Resusitasi</span>
          <div className="space-y-1 max-h-24 overflow-y-auto text-xs font-mono text-slate-300">
            {epinephrineDoses.map((d, i) => (
              <div key={i} className="text-emerald-400">✓ {d}</div>
            ))}
            {shocksDelivered > 0 && (
              <div className="text-amber-400">✓ {shocksDelivered}x Kejutan Listrik 200J Diberikan</div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Tutup Monitor
          </button>

          <button
            onClick={handleRosc}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/40 cursor-pointer transition-transform active:scale-95"
          >
            🎉 ROSC BERHASIL (Kembalinya Sirkulasi Spontan)
          </button>
        </div>
      </div>
    </div>
  );
}
