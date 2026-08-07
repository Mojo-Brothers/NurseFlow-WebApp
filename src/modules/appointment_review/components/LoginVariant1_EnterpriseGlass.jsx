import React, { useState } from 'react';

/**
 * LoginVariant1_EnterpriseGlass - Varian 1: Enterprise Glassmorphism & Biometric HUD
 */
export default function LoginVariant1_EnterpriseGlass({ onSelectVariant }) {
  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [isScanning, setIsScanning] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleScanBiometrics = () => {
    setIsScanning(true);
    setAuthSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setAuthSuccess(true);
    }, 1800);
  };

  return (
    <div className="relative min-h-[640px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 border border-indigo-500/30 text-white shadow-2xl flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar */}
      <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
          </div>
          <div>
            <div className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
              NurseFlow OS
            </div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
              ENTERPRISE CLINICAL INFRASTRUCTURE v2026
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SYSTEM ONLINE (HOSP-01)
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('variant1')}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Gunakan Varian Ini
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto relative z-10 items-center py-6">
        {/* Left Card: Credential & Biometrics Login */}
        <div className="lg:col-span-7 bg-slate-900/70 backdrop-blur-2xl p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">lock</span>
              Otentikasi Akses Terpusat (JCI Compliant)
            </span>
            <h2 className="text-2xl font-black text-white mt-1">Sistem Akses Tenaga Medis</h2>
            <p className="text-xs text-slate-400 mt-1">
              Login eksklusif menggunakan kredensial terdaftar atau pemindaian biometrik sidik jari / FaceID RS.
            </p>
          </div>

          {/* Quick Role Selection Preview */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pilih Role / Peran Medis
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'DOCTOR', label: 'Dokter DPJP', icon: 'stethoscope' },
                { id: 'NURSE', label: 'Perawat IGD', icon: 'medical_services' },
                { id: 'PHARMACIST', label: 'Apoteker', icon: 'local_pharmacy' },
                { id: 'ADMIN', label: 'Admin HIS', icon: 'admin_panel_settings' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === r.id
                      ? 'bg-gradient-to-b from-indigo-600/30 to-indigo-800/40 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{r.icon}</span>
                  <span className="text-[10px] font-bold tracking-tight">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleScanBiometrics}
              disabled={isScanning}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 border border-cyan-400/30 cursor-pointer"
            >
              <span className={`material-symbols-outlined ${isScanning ? 'animate-spin' : ''}`}>
                {isScanning ? 'sync' : 'fingerprint'}
              </span>
              {isScanning ? 'Memindai Biometrik RS...' : 'Masuk dengan Biometrik / FaceID'}
            </button>

            <button className="w-full py-3 px-5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">badge</span>
              Login dengan NIP & Password Kredensial RS
            </button>
          </div>

          {/* Biometrics Scan Result Alert */}
          {authSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-bounce">
              <span className="material-symbols-outlined text-emerald-400">check_circle</span>
              Otentikasi Berhasil! Selamat datang, dr. Alexander (Spesialis Jantung).
            </div>
          )}
        </div>

        {/* Right Card: Security Accreditation & Live Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="material-symbols-outlined text-cyan-400">verified_user</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Sertifikasi & Keamanan Terakreditasi
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-xl mt-0.5">verified</span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Compliance & Accreditations</div>
                  <div className="text-[11px] text-slate-400">JCI Elite Accredited & ISO 27001 Certified</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <span className="material-symbols-outlined text-cyan-400 text-xl mt-0.5">shield_lock</span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Integritas Rekam Medis</div>
                  <div className="text-[11px] text-slate-400">AES-256 Encryption at Rest & HMAC Audit Logging</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <span className="material-symbols-outlined text-purple-400 text-xl mt-0.5">monitoring</span>
                <div>
                  <div className="text-xs font-bold text-slate-200">Real-Time Threat Detection</div>
                  <div className="text-[11px] text-slate-400">Pencegahan Akses Ilegal & Anomali Sesi Login</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 font-mono">
              SECURITY PROTOCOL: EAL4+ VERIFIED (Zero Trust Mesh)
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-4 relative z-10">
        <div>© 2026 NurseFlow Enterprise Clinical Infrastructure</div>
        <div className="flex gap-4">
          <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
          <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
          <span className="hover:text-slate-300 cursor-pointer">Bantuan IT Support</span>
        </div>
      </div>
    </div>
  );
}
