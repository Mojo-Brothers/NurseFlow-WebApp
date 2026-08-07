import React, { useState } from 'react';
import { useAuthStore } from '../../auth/auth.store.js';
import { useNavigate } from 'react-router-dom';

/**
 * LoginVariantHybridV5V2 - Varian Hybrid: Design V5 (Soft Neumorphic) + Formulir V2 (Tabbed Modes SSO/Card/NIP)
 */
export default function LoginVariantHybridV5V2({ onSelectVariant, onNavigate }) {
  const [tabMode, setTabMode] = useState('sso');
  const [activeRole, setActiveRole] = useState('DOCTOR');
  const [nip, setNip] = useState('19840312-201101-1-002');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleKredensialLogin = (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (useAuthStore && useAuthStore.getState) {
        useAuthStore.getState().setUser({ email: 'admin@nurseflow.id', displayName: 'dr. Alexander, Sp.JP' }, activeRole);
      }
      if (onNavigate) onNavigate();
      else if (navigate) navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="relative min-h-[660px] rounded-3xl overflow-hidden bg-slate-100 text-slate-800 shadow-2xl flex flex-col justify-between p-6 lg:p-10 border border-slate-200">
      {/* Top Header Accent */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
            <span className="material-symbols-outlined text-2xl">medical_services</span>
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">NurseFlow HIS</h1>
            <p className="text-xs text-slate-500 font-semibold">Enterprise Clinical Infrastructure (V5 Aesthetic + V2 Form)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 text-xs font-bold rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            System Online (JCI Certified)
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('hybrid_v5_v2')}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Pilihan Utama
            </button>
          )}
        </div>
      </div>

      {/* Main Centered Floating Neumorphic Card with V2 Form */}
      <div className="max-w-xl w-full mx-auto my-auto py-8 relative z-10">
        <div className="bg-slate-100 p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-[14px_14px_28px_#cbd5e1,-14px_-14px_28px_#ffffff] space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-emerald-600 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff]">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sistem Akses Medis Terpusat</h2>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Login eksklusif tenaga medis dengan kredensial terverifikasi SatuSehat / RFID Smart Card.
            </p>
          </div>

          {/* V2 Form Tab Mode Switcher (Neumorphic Style) */}
          <div className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] gap-1">
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
                    ? 'bg-emerald-600 text-white shadow-[4px_4px_8px_#94a3b8]'
                    : 'text-slate-600 hover:text-slate-900'
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
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <span className={`material-symbols-outlined text-xl ${isSubmitting ? 'animate-spin' : ''}`}>
                  {isSubmitting ? 'sync' : 'verified_user'}
                </span>
                {isSubmitting ? 'Memverifikasi SSO Kemenkes...' : 'Masuk dengan Single Sign-On (SSO SatuSehat)'}
              </button>

              <button
                onClick={handleKredensialLogin}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] transition-all flex items-center justify-center gap-3 border border-white cursor-pointer"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                G-Suite Medical Workspace Access
              </button>
            </div>
          )}

          {/* Tab 2: Scan Smart RFID Card */}
          {tabMode === 'card' && (
            <div className="p-8 text-center rounded-2xl bg-slate-100 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff]">
                <span className="material-symbols-outlined text-4xl animate-pulse">contactless</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900">Tempelkan Smart Card Medis</h4>
                <p className="text-xs text-slate-500">
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
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Peran Medis</label>
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
                          ? 'bg-emerald-600 text-white shadow-[3px_3px_6px_#94a3b8]'
                          : 'bg-slate-100 text-slate-600 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{r.icon}</span>
                      <span className="text-[9px]">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Nomor Induk Pegawai (NIP)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-sm">badge</span>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-xs font-semibold text-slate-900 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Masukkan NIP Pegawai..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Kata Sandi RS</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-sm">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-100 text-xs font-semibold text-slate-900 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span className={`material-symbols-outlined text-base ${isSubmitting ? 'animate-spin' : ''}`}>
                  {isSubmitting ? 'sync' : 'login'}
                </span>
                {isSubmitting ? 'Otentikasi Kredensial...' : 'Masuk Akses Medis'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-200 pt-4 relative z-10">
        <div>© 2026 NurseFlow Enterprise Clinical Infrastructure</div>
        <div className="flex gap-4">
          <span>Standar Permenkes No. 24/2022</span>
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </div>
  );
}
