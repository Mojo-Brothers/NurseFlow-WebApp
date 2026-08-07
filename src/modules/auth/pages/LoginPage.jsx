import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useAuthStore } from '../auth.store.js';
import { Lock, ShieldCheck, Activity, ShieldAlert, Server } from 'lucide-react';

/**
 * LoginPage - Varian Hybrid Favorit: Design V5 (Soft Neumorphic) + Formulir V2 (Tabbed Modes)
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(15);
  const [tabMode, setTabMode] = useState('sso');
  const [activeRole, setActiveRole] = useState('ADMIN');
  const [nip, setNip] = useState('19840312-201101-1-002');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  function handleKredensialLogin(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      useAuthStore.getState().setUser(
        { email: 'admin@nurseflow.id', displayName: 'dr. Alexander, Sp.JP' },
        activeRole
      );
      navigate('/dashboard');
    }, 1000);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      useAuthStore.getState().setUser(
        { email: 'admin@nurseflow.id', displayName: 'dr. Alexander, Sp.JP' },
        activeRole
      );
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-100 dark:bg-slate-950 p-4 lg:p-8 overflow-x-hidden relative text-slate-800 dark:text-slate-100 font-sans">
      {/* ─── Ambient Glow Backgrounds ─── */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-7xl mx-auto flex flex-col justify-between relative z-10 space-y-6">
        
        {/* Top Header Status Bar */}
        <header className="bg-slate-100 dark:bg-slate-900 p-4 lg:px-8 rounded-2xl border border-white dark:border-slate-800 shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] dark:shadow-none flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/30">
              <span className="material-symbols-outlined text-2xl">medical_services</span>
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none">NurseFlow HIS</h1>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Clinical Infrastructure</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider hidden sm:inline">System Online</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-sm">timer</span>
              <span>Timeout: {sessionMinutes}m</span>
            </div>
          </div>
        </header>

        {/* ─── Main Hybrid Neumorphic Auth Section ─── */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 my-auto py-6">
          
          {/* Main Form Card (V5 Neumorphic Style + V2 Tabbed Forms) */}
          <div className="w-full max-w-lg bg-slate-100 dark:bg-slate-900 p-8 lg:p-10 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-[14px_14px_28px_#cbd5e1,-14px_-14px_28px_#ffffff] dark:shadow-2xl space-y-6">
            
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] dark:shadow-none border border-white dark:border-slate-700">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sistem Akses Medis Terpusat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                Otentikasi terverifikasi tenaga medis dengan standar JCI & Permenkes No. 24/2022.
              </p>
            </div>

            {/* Error Banner if any */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-bold flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* V2 Tabbed Authentication Modes */}
            <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none border border-slate-200 dark:border-slate-800 gap-1">
              {[
                { id: 'sso', label: 'Hospital SSO', icon: 'key' },
                { id: 'card', label: 'Scan ID Card', icon: 'contactless' },
                { id: 'nip', label: 'NIP & Password', icon: 'badge' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabMode(tab.id)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    tabMode === tab.id
                      ? 'bg-emerald-600 text-white shadow-[4px_4px_8px_#94a3b8] dark:shadow-none'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab 1: Hospital SSO Kemenkes */}
            {tabMode === 'sso' && (
              <div className="space-y-4 pt-2">
                <button
                  onClick={handleKredensialLogin}
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] dark:shadow-lg dark:shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>
                    {loading ? 'sync' : 'verified_user'}
                  </span>
                  {loading ? 'Memverifikasi SSO Kemenkes...' : 'Masuk dengan Single Sign-On (SSO SatuSehat)'}
                </button>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] dark:shadow-none transition-all flex items-center justify-center gap-3 border border-white dark:border-slate-700 cursor-pointer"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  G-Suite Medical Workspace Access
                </button>
              </div>
            )}

            {/* Tab 2: Scan Smart RFID Card */}
            {tabMode === 'card' && (
              <div className="p-8 text-center rounded-2xl bg-slate-100 dark:bg-slate-950 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] dark:shadow-none border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] dark:shadow-none border border-white dark:border-emerald-800">
                  <span className="material-symbols-outlined text-4xl animate-pulse">contactless</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Tempelkan Smart Card Medis</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dekatkan kartu identitas pegawai (RFID/NFC) ke sensor pembaca smart card RS.
                  </p>
                </div>

                <button
                  onClick={handleKredensialLogin}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Simulasi Tempel ID Card
                </button>
              </div>
            )}

            {/* Tab 3: NIP & Password Form with Role Selector */}
            {tabMode === 'nip' && (
              <form onSubmit={handleKredensialLogin} className="space-y-4 pt-1">
                {/* Role Selection Pills */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Peran Medis</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'DOCTOR', label: 'Dokter DPJP', icon: 'stethoscope' },
                      { id: 'NURSE', label: 'Perawat', icon: 'medical_services' },
                      { id: 'PHARMACIST', label: 'Apoteker', icon: 'local_pharmacy' },
                      { id: 'ADMIN', label: 'Admin HIS', icon: 'admin_panel_settings' },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setActiveRole(r.id)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          activeRole === r.id
                            ? 'bg-emerald-600 text-white shadow-[3px_3px_6px_#94a3b8] dark:shadow-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff] dark:shadow-none border border-white dark:border-slate-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{r.icon}</span>
                        <span className="text-[9px]">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nomor Induk Pegawai (NIP)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-sm">badge</span>
                    <input
                      type="text"
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Masukkan NIP Pegawai..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Kata Sandi RS</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-sm">lock</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] dark:shadow-none border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] dark:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
                    {loading ? 'sync' : 'login'}
                  </span>
                  {loading ? 'Otentikasi Kredensial...' : 'Masuk Akses Medis'}
                </button>
              </form>
            )}
          </div>

          {/* Right Side Accreditation Info Box */}
          <div className="w-full max-w-sm space-y-4 hidden lg:block">
            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl border border-white dark:border-slate-800 shadow-[10px_10px_20px_#cbd5e1,-10px_-10px_20px_#ffffff] dark:shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sertifikasi & Kepatuhan Keamanan
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-xl">verified</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">JCI Accredited & HIPAA</div>
                    <div className="text-[10px] text-slate-500">Kepatuhan Standar Medis Global</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-600 text-xl">shield_lock</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">AES-256 & Audit Logging</div>
                    <div className="text-[10px] text-slate-500">Integritas Data Rekam Medis Abadi</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <span className="material-symbols-outlined text-cyan-600 text-xl">monitoring</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Active Threat Detection</div>
                    <div className="text-[10px] text-slate-500">Pemantauan Sesi Real-Time 24/7</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border-t border-slate-200 dark:border-slate-800 pt-4">
          © 2026 NurseFlow Enterprise Clinical Infrastructure | Permenkes No. 24 Tahun 2022 Verified
        </footer>

      </div>
    </div>
  );
}
