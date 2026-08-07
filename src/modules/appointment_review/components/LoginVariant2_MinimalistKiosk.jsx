import React, { useState } from 'react';

/**
 * LoginVariant2_MinimalistKiosk - Varian 2: Modern Minimalist Medical Kiosk Aesthetic
 */
export default function LoginVariant2_MinimalistKiosk({ onSelectVariant }) {
  const [tabMode, setTabMode] = useState('sso');
  const [nip, setNip] = useState('198403122011011002');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Login Berhasil (Simulasi)!');
    }, 1200);
  };

  return (
    <div className="relative min-h-[640px] rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 p-8 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col justify-between">
      {/* Subtle Top Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between relative z-10 border-b border-slate-200 dark:border-slate-800 pb-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-2xl">health_and_safety</span>
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">NurseFlow HIS</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Smart Clinical Access Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-bold rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
            Kiosk Mode Active
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('variant2')}
              className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Gunakan Varian Ini
            </button>
          )}
        </div>
      </div>

      {/* Centered Login Card */}
      <div className="max-w-md w-full mx-auto my-auto relative z-10 py-6">
        <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Silakan pilih metode otentikasi resmi tenaga medis rumah sakit.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
            {[
              { id: 'sso', label: 'Hospital SSO', icon: 'key' },
              { id: 'card', label: 'Scan Smart Card', icon: 'credit_card' },
              { id: 'nip', label: 'NIP & Password', icon: 'badge' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTabMode(t.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tabMode === t.id
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Form Content Based on Mode */}
          {tabMode === 'sso' && (
            <div className="space-y-3">
              <button
                onClick={handleLoginSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">encrypted</span>
                {isSubmitting ? 'Verifikasi SSO...' : 'Login Single Sign-On (SSO Kemenkes)'}
              </button>

              <button className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-300 dark:border-slate-800 transition-all flex items-center justify-center gap-2">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Masuk dengan G-Suite Workspace Medis
              </button>
            </div>
          )}

          {tabMode === 'card' && (
            <div className="p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl space-y-3 bg-slate-50 dark:bg-slate-900/50">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl animate-pulse">contactless</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tempelkan ID Card Medis</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dekatkan kartu RFID / NFC pegawai ke sensor pembaca smart card.
                </p>
              </div>
            </div>
          )}

          {tabMode === 'nip' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nomor Induk Pegawai (NIP)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">badge</span>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Masukkan NIP Resmi..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Kata Sandi / Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Otentikasi Kredensial
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 relative z-10">
        Dikembangkan khusus untuk Rumah Sakit Kategori Enterprise | Standardisasi JCI & Permenkes No. 24/2022
      </div>
    </div>
  );
}
