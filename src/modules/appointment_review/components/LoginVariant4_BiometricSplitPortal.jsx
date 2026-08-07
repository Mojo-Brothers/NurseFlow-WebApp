import React, { useState } from 'react';

/**
 * LoginVariant4_BiometricSplitPortal - Varian 4: High-Tech Split Screen Medical Portal & Live Wallboard
 */
export default function LoginVariant4_BiometricSplitPortal({ onSelectVariant }) {
  const [faceScanActive, setFaceScanActive] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const triggerFaceScan = () => {
    setFaceScanActive(true);
    setScanStep(1);
    setTimeout(() => setScanStep(2), 1000);
    setTimeout(() => {
      setScanStep(3);
      setFaceScanActive(false);
    }, 2200);
  };

  return (
    <div className="relative min-h-[660px] rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl flex flex-col justify-between border border-slate-800">
      {/* 50/50 Split Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* Left 6 Columns: High-Tech Biometric Login */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-slate-900/90 backdrop-blur-2xl flex flex-col justify-between border-r border-slate-800/80 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
                <span className="material-symbols-outlined text-2xl">medical_services</span>
              </div>
              <div>
                <div className="font-extrabold text-xl text-white tracking-tight">NurseFlow OS</div>
                <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
                  CLINICAL SECURITY PORTAL
                </div>
              </div>
            </div>

            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SPLIT PORTAL v4
            </span>
          </div>

          {/* Center Form & Face Scan HUD */}
          <div className="my-auto py-6 space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
                // SECURE ACCESS GATEWAY
              </span>
              <h2 className="text-3xl font-black text-white mt-1 tracking-tight">Otentikasi Wajah & NIP Medis</h2>
              <p className="text-xs text-slate-400 mt-1">
                Sistem pangkalan data klinis terisolasi terenkripsi AES-256 untuk seluruh staf medis terpindai.
              </p>
            </div>

            {/* Interactive Face Recognition Scanner Box */}
            <div className="relative p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">center_focus_strong</span>
                  <span className="text-xs font-bold text-slate-200">FaceID / Iris Scanner System</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">CAMERA ID: CAM-FRONT-01</span>
              </div>

              {/* Scanning HUD Screen */}
              <div className="relative h-32 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center overflow-hidden">
                <div className="text-center space-y-1 relative z-10">
                  <span className={`material-symbols-outlined text-4xl text-emerald-400 ${faceScanActive ? 'animate-bounce' : ''}`}>
                    {scanStep === 3 ? 'verified' : 'face'}
                  </span>
                  <div className="text-xs font-bold text-slate-300">
                    {scanStep === 0 && 'Klik tombol di bawah untuk memindai wajah'}
                    {scanStep === 1 && 'Mendeteksi titik koordinat biometrik wajah...'}
                    {scanStep === 2 && 'Mencocokkan NIP & Sertifikat Digital BSrE...'}
                    {scanStep === 3 && 'Akses Terverifikasi! dr. Alexander (DPJP)'}
                  </div>
                </div>

                {faceScanActive && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse"></div>
                )}
              </div>

              <button
                onClick={triggerFaceScan}
                disabled={faceScanActive}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">filter_center_focus</span>
                {faceScanActive ? 'Proses Pemindaian...' : 'Aktifkan Face Recognition AI'}
              </button>
            </div>

            {/* Quick SSO Button */}
            <button className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">key</span>
              Login dengan SatuSehat SSO Kemenkes RI
            </button>
          </div>

          {/* Footer Left */}
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>Encrypted Session Token: Active</span>
            <span>JCI Accredited Infrastructure</span>
          </div>
        </div>

        {/* Right 6 Columns: Real-Time Emergency & Occupancy Live Wallboard */}
        <div className="lg:col-span-6 p-8 lg:p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Wallboard Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                LIVE HOSPITAL METRICS
              </span>
              <h3 className="text-sm font-bold text-white">Status Operasional RS Real-Time</h3>
            </div>
            {onSelectVariant && (
              <button
                onClick={() => onSelectVariant('variant4')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                Pilih Varian Ini
              </button>
            )}
          </div>

          {/* Middle Metrics Live Grid */}
          <div className="space-y-4 relative z-10 my-auto py-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">Bed Occupancy Rate (BOR)</div>
                <div className="text-2xl font-black text-emerald-400">78.4%</div>
                <div className="text-[10px] text-slate-500">142 / 180 Bed Terisi</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">SLA Resusitasi IGD</div>
                <div className="text-2xl font-black text-cyan-400">14 Detik</div>
                <div className="text-[10px] text-slate-500">Target &lt; 30 Detik</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-200">Dokter DPJP On-Duty Saat Ini</span>
                <span className="text-[10px] font-mono text-emerald-400">8 Dokter Shift Pagi</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>dr. Alexander Sp.JP (Jantung)</span>
                  <span className="text-emerald-400 font-semibold">Poli Jantung (Bed 1)</span>
                </div>
                <div className="flex justify-between">
                  <span>dr. Ratna Sp.A (Anak)</span>
                  <span className="text-emerald-400 font-semibold">Poli Anak (Bed 3)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Right */}
          <div className="text-[11px] text-slate-500 relative z-10 border-t border-slate-800 pt-4">
            Rumah Sakit Umum Terakreditasi Paripurna Kemenkes RI
          </div>
        </div>
      </div>
    </div>
  );
}
