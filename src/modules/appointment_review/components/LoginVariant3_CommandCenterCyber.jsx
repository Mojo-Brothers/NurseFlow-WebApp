import React, { useState } from 'react';

/**
 * LoginVariant3_CommandCenterCyber - Varian 3: Command Center Cyberpunk / Tactical HIS
 */
export default function LoginVariant3_CommandCenterCyber({ onSelectVariant }) {
  const [pinCode, setPinCode] = useState(['4', '8', '1', '2']);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyClick = (num) => {
    if (pinCode.length < 6) {
      setPinCode([...pinCode, num]);
    }
  };

  const handleClear = () => {
    setPinCode([]);
  };

  const handleVerifyPin = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      alert('Akses Command Center Diberikan!');
    }, 1500);
  };

  return (
    <div className="relative min-h-[640px] rounded-3xl overflow-hidden bg-slate-950 p-8 border border-cyan-500/40 text-cyan-100 shadow-2xl flex flex-col justify-between font-mono">
      {/* Background Cyber Grid */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-40 pointer-events-none"
      ></div>

      {/* Top Header */}
      <div className="flex items-center justify-between relative z-10 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined text-lg">terminal</span>
          </div>
          <div>
            <div className="font-black text-sm text-cyan-300 tracking-widest uppercase">
              NURSEFLOW // COMMAND CENTER AUTH
            </div>
            <div className="text-[10px] text-cyan-500">CLEARANCE LEVEL: MEDICAL OFFICER (EAL4+)</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold">
            LATENCY: 4ms
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('variant3')}
              className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/30"
            >
              Gunakan Varian Ini
            </button>
          )}
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto relative z-10 items-center py-6">
        {/* Left Pane: PIN Pad & Biometric Trigger */}
        <div className="lg:col-span-6 bg-slate-900/90 backdrop-blur-md p-6 rounded-xl border border-cyan-500/30 shadow-2xl space-y-5">
          <div className="border-b border-cyan-500/20 pb-3">
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest">TACTICAL INPUT PANEL</div>
            <h3 className="text-lg font-bold text-white">MASUKKAN PIN KEAMANAN RS</h3>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-2 py-3 bg-slate-950 rounded border border-cyan-500/30">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-8 h-10 rounded border flex items-center justify-center text-lg font-bold ${
                  pinCode[idx]
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/30'
                    : 'border-slate-800 text-slate-700'
                }`}
              >
                {pinCode[idx] ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'C') handleClear();
                  else if (key === '✓') handleVerifyPin();
                  else handleKeyClick(key);
                }}
                className={`py-3 rounded font-mono font-bold text-sm border transition-all cursor-pointer ${
                  key === '✓'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300'
                    : key === 'C'
                    ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/40'
                    : 'bg-slate-950 hover:bg-slate-800 text-cyan-200 border-cyan-500/20'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={handleVerifyPin}
            disabled={isVerifying}
            className="w-full py-3 rounded bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <span className="material-symbols-outlined text-sm">{isVerifying ? 'sync' : 'fingerprint'}</span>
            {isVerifying ? 'AUTHENTICATING ENCRYPTED TOKEN...' : 'AUTHENTICATE ACCESS TOKEN'}
          </button>
        </div>

        {/* Right Pane: Live Telemetry Wallboard */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-xl border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <span className="text-xs font-bold text-cyan-300 tracking-wider">SYSTEM NODE TELEMETRY</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">SATUSEHAT FHIR R4 NODE</span>
                <span className="text-emerald-400 font-bold">CONNECTED (34ms)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">KFA V3 DRUG CATALOG</span>
                <span className="text-emerald-400 font-bold">ACTIVE (22ms)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">BPJS V-CLAIM V2 API</span>
                <span className="text-emerald-400 font-bold">ONLINE (58ms)</span>
              </div>

              <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-400">BSRE E-SIGN APPLIANCE</span>
                <span className="text-cyan-400 font-bold">READY (12ms)</span>
              </div>
            </div>

            <div className="p-3 rounded bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300">
              AUDIT TRAIL HASH CHAINING IS ACTIVE. ALL LOGIN ATTEMPTS ARE IMMUTABLY RECORDED.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-cyan-600 border-t border-cyan-500/20 pt-3 relative z-10">
        <div>HIS-NURSEFLOW-COMMAND-CENTER // VERSION 2026.1</div>
        <div>ZERO-TRUST MESH ARCHITECTURE</div>
      </div>
    </div>
  );
}
