import React, { useState } from 'react';

/**
 * LoginVariant6_HolodockEnterprise - Varian 6: Holographic Medical Dock & Zero-Trust SSO Hub
 */
export default function LoginVariant6_HolodockEnterprise({ onSelectVariant }) {
  const [activeDock, setActiveDock] = useState('sso');
  const [authStep, setAuthStep] = useState(1);
  const [authenticating, setAuthenticating] = useState(false);

  const startAuthFlow = () => {
    setAuthenticating(true);
    setAuthStep(2);
    setTimeout(() => setAuthStep(3), 1200);
    setTimeout(() => {
      setAuthenticating(false);
      setAuthStep(1);
      alert('Sesi Zero-Trust Berhasil Diverifikasi!');
    }, 2400);
  };

  return (
    <div className="relative min-h-[660px] rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl flex flex-col justify-between p-8 border border-cyan-500/40 font-sans">
      {/* Background Holographic Ring Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-cyan-500/20 bg-cyan-500/5 animate-pulse pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-indigo-500/30 pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined text-2xl">hub</span>
          </div>
          <div>
            <div className="font-black text-lg text-white tracking-tight">HoloDock Enterprise HIS</div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
              ZERO-TRUST SINGLE SIGN-ON HUB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
            GATEKEEPER ACTIVE
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('variant6')}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/30 cursor-pointer"
            >
              Gunakan Varian Ini
            </button>
          )}
        </div>
      </div>

      {/* Holographic Center Stage */}
      <div className="max-w-lg w-full mx-auto my-auto relative z-10 py-6 text-center space-y-6">
        {/* Holographic Ring Stage */}
        <div className="relative w-44 h-44 mx-auto rounded-full bg-slate-900/80 border-2 border-cyan-400/50 flex flex-col items-center justify-center shadow-2xl shadow-cyan-500/20 space-y-2">
          <span className={`material-symbols-outlined text-5xl text-cyan-300 ${authenticating ? 'animate-spin' : ''}`}>
            {authStep === 3 ? 'verified_user' : 'fingerprint'}
          </span>
          <div className="text-[11px] font-mono font-bold text-cyan-200">
            {authStep === 1 && 'STEP 1: IDENTITY CHECK'}
            {authStep === 2 && 'STEP 2: BIOMETRIC MATCH'}
            {authStep === 3 && 'VERIFIED ACCREDITED'}
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">Stasiun Akses Medis HoloDock</h2>
          <p className="text-xs text-slate-400">
            Otentikasi bertingkat dengan dukungan SSO SatuSehat, Smart RFID Kiosk, & e-Sign BSSN.
          </p>
        </div>

        <button
          onClick={startAuthFlow}
          disabled={authenticating}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 transition-all cursor-pointer border border-cyan-300/40"
        >
          {authenticating ? 'Memverifikasi Akses Zero-Trust...' : 'Mulai Verifikasi HoloDock'}
        </button>
      </div>

      {/* Floating Bottom Holo Dock Bar */}
      <div className="relative z-10 max-w-xl mx-auto w-full bg-slate-900/90 backdrop-blur-2xl p-2 rounded-2xl border border-cyan-500/30 shadow-2xl flex items-center justify-around">
        {[
          { id: 'sso', label: 'SSO Kemenkes', icon: 'key' },
          { id: 'rfid', label: 'RFID Kiosk', icon: 'credit_card' },
          { id: 'narcotics', label: 'Dual Sign-Off', icon: 'security' },
          { id: 'bpjs', label: 'BPJS Sync', icon: 'sync_alt' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveDock(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeDock === item.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
