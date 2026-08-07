import React, { useState } from 'react';

/**
 * LoginVariant5_NeumorphicMinimalCare - Varian 5: Soft Neumorphic Medical White & Emerald Focus
 */
export default function LoginVariant5_NeumorphicMinimalCare({ onSelectVariant }) {
  const [activeRole, setActiveRole] = useState('DOKTER');
  const [nip, setNip] = useState('19880412-201502-1-004');
  const [pass, setPass] = useState('••••••••••••');

  return (
    <div className="relative min-h-[660px] rounded-3xl overflow-hidden bg-slate-50 text-slate-800 shadow-2xl flex flex-col justify-between p-8 border border-slate-200">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/30">
            <span className="material-symbols-outlined text-2xl">local_hospital</span>
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">NurseFlow HIS</h1>
            <p className="text-xs text-slate-500 font-medium">Soft Neumorphic Clinical Access</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300">
            Varian 5: Neumorphic Care
          </span>
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('variant5')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Gunakan Varian Ini
            </button>
          )}
        </div>
      </div>

      {/* Main Centered Floating Neumorphic Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 relative z-10">
        <div className="bg-slate-50 p-8 rounded-3xl border border-white shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-600 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff]">
              <span className="material-symbols-outlined text-2xl">lock</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-2">Login Kredensial Medis</h2>
            <p className="text-xs text-slate-500 font-medium">Pilih peran tenaga medis & masukkan sandi otentikasi.</p>
          </div>

          {/* Role Selection Neumorphic Pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'DOKTER', label: 'Dokter DPJP', icon: 'stethoscope' },
              { id: 'PERAWAT', label: 'Perawat', icon: 'medical_services' },
              { id: 'FARMASI', label: 'Apoteker', icon: 'local_pharmacy' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeRole === r.id
                    ? 'bg-emerald-600 text-white shadow-[4px_4px_10px_#94a3b8]'
                    : 'bg-slate-50 text-slate-600 shadow-[4px_4px_8px_#cbd5e1,-4px_-4px_8px_#ffffff] hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">{r.icon}</span>
                <span className="text-[10px]">{r.label}</span>
              </button>
            ))}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Nomor Induk Pegawai (NIP)</label>
              <div className="relative">
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-900 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Kata Sandi RS</label>
              <div className="relative">
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 text-xs font-semibold text-slate-900 shadow-[inset_3px_3px_6px_#cbd5e1,inset_-3px_-3px_6px_#ffffff] outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-[6px_6px_12px_#cbd5e1,-6px_-6px_12px_#ffffff] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2">
              <span className="material-symbols-outlined text-base">login</span>
              Masuk Sistem Akses Medis
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 font-medium relative z-10">
        Design System Neumorphic Minimalist -- Hospital Information System v2026
      </div>
    </div>
  );
}
