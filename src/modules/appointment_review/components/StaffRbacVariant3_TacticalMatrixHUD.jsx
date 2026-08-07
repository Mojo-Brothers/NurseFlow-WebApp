import React, { useState } from 'react';

/**
 * StaffRbacVariant3_TacticalMatrixHUD - Varian 3: Command Center Tactical Matrix & Interactive RBAC Grid
 */
export default function StaffRbacVariant3_TacticalMatrixHUD({ onSelectVariant }) {
  const [matrixState, setMatrixState] = useState({
    DOCTOR: { cpoe: true, narcotics: true, soap: true, discharge: true, triageOverride: true },
    HEAD_NURSE: { cpoe: false, narcotics: false, soap: true, discharge: true, triageOverride: false },
    PHARMACIST: { cpoe: false, narcotics: true, soap: false, discharge: false, triageOverride: false },
    ADMIN: { cpoe: true, narcotics: true, soap: true, discharge: true, triageOverride: true },
  });

  const togglePermission = (role, key) => {
    setMatrixState((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }));
  };

  return (
    <div className="bg-slate-950 p-6 rounded-3xl border border-cyan-500/40 space-y-6 text-cyan-100 shadow-2xl font-mono">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined text-xl">matrix</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-cyan-300 tracking-wider uppercase">
              Varian 3: Command Center Interactive RBAC Matrix Table
            </h1>
            <p className="text-[11px] text-cyan-500 mt-0.5">
              Matriks Kontrol Hak Akses Medis Real-Time dengan Toggle Izin Otentikasi Langsung.
            </p>
          </div>
        </div>

        {onSelectVariant && (
          <button
            onClick={() => onSelectVariant('staff_v3')}
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/30 cursor-pointer"
          >
            Pilih Varian 3 (Tactical Matrix)
          </button>
        )}
      </div>

      {/* Interactive RBAC Matrix Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                <th className="p-4">Peran Medis (Role)</th>
                <th className="p-4 text-center">CPOE Prescribing</th>
                <th className="p-4 text-center">Narcotics Dual Sign</th>
                <th className="p-4 text-center">SOAP CPPT Entry</th>
                <th className="p-4 text-center">Discharge Patient</th>
                <th className="p-4 text-center">Override Triage ESI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10">
              {[
                { role: 'DOCTOR', label: 'Doctor Specialist (DPJP)' },
                { role: 'HEAD_NURSE', label: 'Head Nurse (Perawat Utama)' },
                { role: 'PHARMACIST', label: 'Pharmacist Supervisor (Apoteker)' },
                { role: 'ADMIN', label: 'System Administrator (IT Admin)' },
              ].map((r) => (
                <tr key={r.role} className="hover:bg-cyan-950/30 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    {r.label}
                  </td>

                  {['cpoe', 'narcotics', 'soap', 'discharge', 'triageOverride'].map((permKey) => (
                    <td key={permKey} className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(r.role, permKey)}
                        className={`w-6 h-6 rounded border transition-all cursor-pointer ${
                          matrixState[r.role]?.[permKey]
                            ? 'bg-cyan-500 border-cyan-300 text-slate-950 shadow-md shadow-cyan-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-700'
                        }`}
                      >
                        {matrixState[r.role]?.[permKey] ? '✓' : ''}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300">
        INFORMASI: Matriks hak akses di atas memperbarui izin API backend secara langsung dengan Hash Audit Logging permanen.
      </div>
    </div>
  );
}
