import React, { useState } from 'react';
import { 
  DEFAULT_ROLES, 
  PERMISSION_MODULES, 
  PERMISSION_ACTIONS, 
  DEFAULT_ROLE_PERMISSIONS 
} from '../../data/permissionsRegistry.js';

export default function RbacMatrixModal({ isOpen, onClose }) {
  const [selectedRole, setSelectedRole] = useState('DOCTOR');
  const [rolePermissions, setRolePermissions] = useState(DEFAULT_ROLE_PERMISSIONS);

  if (!isOpen) return null;

  const currentPerms = rolePermissions[selectedRole] || [];

  const togglePermission = (permCode) => {
    setRolePermissions(prev => {
      const current = prev[selectedRole] || [];
      const has = current.includes(permCode);
      return {
        ...prev,
        [selectedRole]: has ? current.filter(p => p !== permCode) : [...current, permCode]
      };
    });
  };

  const toggleModuleAll = (moduleId) => {
    const modulePerms = PERMISSION_ACTIONS.map(a => `${moduleId}:${a.code}`);
    const allActive = modulePerms.every(p => currentPerms.includes(p));

    setRolePermissions(prev => {
      const current = prev[selectedRole] || [];
      if (allActive) {
        return {
          ...prev,
          [selectedRole]: current.filter(p => !modulePerms.includes(p))
        };
      } else {
        return {
          ...prev,
          [selectedRole]: [...new Set([...current, ...modulePerms])]
        };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-high w-full max-w-5xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">shield_person</span>
            </div>
            <div>
              <h3 className="text-lg font-headline font-black text-on-surface">
                Matriks Hak Akses & Kewenangan Klinis (RBAC Matrix)
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Standar JCI Need-to-Know: Atur hak akses (Read, Create, Update, Delete, Restore, Export, Import) per role.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-rose-600 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Role Selector Ribbon */}
        <div className="px-6 py-3 border-b border-outline-variant/20 bg-surface-container/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
            Pilih Role:
          </span>
          {DEFAULT_ROLES.map(r => (
            <button
              key={r.code}
              onClick={() => setSelectedRole(r.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedRole === r.code
                  ? 'bg-purple-600 text-white shadow-xs scale-[1.02]'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {r.name.split('/')[0].trim()}
            </button>
          ))}
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container">
                <th className="p-3 font-extrabold text-on-surface-variant uppercase text-[11px] w-64">
                  Modul Rumah Sakit
                </th>
                <th className="p-3 font-extrabold text-on-surface-variant uppercase text-[11px] text-center w-20">
                  Semua
                </th>
                {PERMISSION_ACTIONS.map(act => (
                  <th key={act.code} className="p-3 font-extrabold text-on-surface-variant uppercase text-[10px] text-center">
                    {act.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {PERMISSION_MODULES.map(mod => {
                const modulePerms = PERMISSION_ACTIONS.map(a => `${mod.id}:${a.code}`);
                const isAllActive = modulePerms.every(p => currentPerms.includes(p));

                return (
                  <tr key={mod.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-3 font-bold text-on-surface">
                      {mod.name}
                    </td>

                    {/* Toggle All in Module */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleModuleAll(mod.id)}
                        className={`w-6 h-6 rounded-md text-[10px] font-black transition-colors ${
                          isAllActive ? 'bg-purple-600 text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                        title="Toggle Semua Izin Modul Ini"
                      >
                        {isAllActive ? '✓' : 'ALL'}
                      </button>
                    </td>

                    {/* Action Checkboxes */}
                    {PERMISSION_ACTIONS.map(act => {
                      const code = `${mod.id}:${act.code}`;
                      const isChecked = currentPerms.includes(code);

                      return (
                        <td key={act.code} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(code)}
                            className="rounded border-outline-variant text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/20 bg-surface-container/50 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">
            Total izin aktif untuk <strong>{selectedRole}</strong>: <strong>{currentPerms.length} permissions</strong>
          </p>

          <button
            onClick={() => {
              alert(`Konfigurasi izin untuk role ${selectedRole} berhasil disimpan.`);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Simpan Matriks Izin
          </button>
        </div>

      </div>
    </div>
  );
}
