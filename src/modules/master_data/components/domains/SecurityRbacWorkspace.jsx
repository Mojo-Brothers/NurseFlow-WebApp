import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';
import { RBAC_MODULE_PERMISSIONS } from '../../data/permissionsRegistry.js';

export default function SecurityRbacWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const users = entitiesData['users'] || [];
  const roles = entitiesData['roles'] || [];
  const permissions = entitiesData['permissions'] || [];
  const sessions = entitiesData['sessions'] || [];

  const [activeSecTab, setActiveSecTab] = useState('USERS'); // 'USERS' | 'ROLES' | 'PERMISSIONS' | 'MATRIX' | 'SESSIONS'
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState('DOCTOR');
  const [rolePermissionsState, setRolePermissionsState] = useState({
    SUPER_ADMIN: ['*'],
    DOCTOR: ['PATIENT:READ', 'EMR:READ', 'EMR:WRITE', 'ORDER:WRITE', 'PRESCRIPTION:WRITE'],
    NURSE: ['PATIENT:READ', 'TRIAGE:WRITE', 'NURSING_CARE:WRITE', 'EMAR:WRITE', 'BED:WRITE'],
    PHARMACIST: ['PRESCRIPTION:READ', 'DISPENSE:WRITE', 'MEDICINE:READ'],
    BILLING_OFFICER: ['PATIENT:READ', 'BILLING:READ', 'BILLING:WRITE', 'PAYMENT:WRITE']
  });

  const togglePermissionForRole = (roleCode, permKey) => {
    setRolePermissionsState(prev => {
      const currentList = prev[roleCode] || [];
      const hasIt = currentList.includes(permKey) || currentList.includes('*');
      const updated = hasIt
        ? currentList.filter(k => k !== permKey && k !== '*')
        : [...currentList, permKey];
      return { ...prev, [roleCode]: updated };
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Governance Security Header ─── */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <span className="material-symbols-outlined text-[26px]">shield</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ENTERPRISE RBAC & ACCESS CONTROL
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI Patient Data Security Compliance</span>
            </div>
            <h3 className="text-lg font-headline font-black">Pusat Keamanan & Hak Akses Pengguna</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSecTab('USERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSecTab === 'USERS' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSecTab('ROLES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSecTab === 'ROLES' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>Peran ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveSecTab('MATRIX')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSecTab === 'MATRIX' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Matriks Perizinan</span>
          </button>

          <button
            onClick={() => setActiveSecTab('SESSIONS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSecTab === 'SESSIONS' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">devices</span>
            <span>Sesi Aktif ({sessions.length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: User Accounts ─── */}
      {activeSecTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-headline font-black text-on-surface">Daftar Akun Pengguna SIMRS</h4>
            <button
              onClick={() => {
                setActiveEntity('users');
                openCreateModal();
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/25"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tambah Pengguna</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => openDetailDrawer(u)}
                className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                      {u.display_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h5 className="text-sm font-headline font-black text-on-surface">{u.display_name}</h5>
                      <p className="text-xs text-on-surface-variant font-mono">{u.username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    AKTIF
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-container text-xs space-y-1">
                  <p className="font-bold text-purple-600">Peran: {u.role_name}</p>
                  <p className="text-on-surface-variant">Departemen: {u.department_name}</p>
                </div>

                <div className="text-[11px] font-mono text-on-surface-variant pt-2 border-t border-outline-variant/20">
                  Login Terakhir: {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Roles ─── */}
      {activeSecTab === 'ROLES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(r => (
            <div
              key={r.id}
              onClick={() => openDetailDrawer(r)}
              className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-mono">
                  {r.tier_level}
                </span>
                <span className="font-mono text-xs font-bold text-purple-600">{r.code}</span>
              </div>
              <h4 className="text-base font-headline font-black text-on-surface">{r.name}</h4>
              <p className="text-xs text-on-surface-variant">{r.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 3: Matriks Perizinan Interaktif ─── */}
      {activeSecTab === 'MATRIX' && (
        <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
            <div>
              <h4 className="text-base font-headline font-black text-on-surface">Matriks Hak Akses Granular Role-Based Access Control</h4>
              <p className="text-xs text-on-surface-variant font-medium">Konfigurasikan perizinan modul untuk setiap jabatan secara real-time.</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-on-surface">Pilih Peran:</label>
              <select
                value={selectedRoleForMatrix}
                onChange={(e) => setSelectedRoleForMatrix(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-purple-600 focus:ring-primary"
              >
                <option value="SUPER_ADMIN">Super Admin (Tier 1)</option>
                <option value="DOCTOR">Dokter Spesialis / DPJP (Tier 3)</option>
                <option value="NURSE">Perawat / Head Nurse (Tier 3)</option>
                <option value="PHARMACIST">Apoteker / Farmasis (Tier 3)</option>
                <option value="BILLING_OFFICER">Kasir / Petugas Billing (Tier 4)</option>
              </select>
            </div>
          </div>

          {/* Matrix Modules List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RBAC_MODULE_PERMISSIONS.map(mod => {
              const currentActivePerms = rolePermissionsState[selectedRoleForMatrix] || [];
              const isSuper = currentActivePerms.includes('*');

              return (
                <div key={mod.moduleKey} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[20px] text-purple-600">{mod.icon}</span>
                    <h5 className="text-sm font-headline font-black text-on-surface">{mod.moduleTitle}</h5>
                  </div>

                  <div className="space-y-2">
                    {mod.permissions.map(perm => {
                      const isChecked = isSuper || currentActivePerms.includes(perm.key);

                      return (
                        <label
                          key={perm.key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/20 hover:border-purple-500/40 cursor-pointer text-xs transition-all"
                        >
                          <div>
                            <span className="font-bold text-on-surface block">{perm.label}</span>
                            <span className="text-[10px] font-mono text-on-surface-variant">{perm.key}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSuper}
                            onChange={() => togglePermissionForRole(selectedRoleForMatrix, perm.key)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ─── TAB 4: Sesi Aktif ─── */}
      {activeSecTab === 'SESSIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-headline font-black text-on-surface">Daftar Sesi Pengguna Aktif & Keamanan Token</h4>
          </div>

          <div className="space-y-3">
            {sessions.map(ses => (
              <div
                key={ses.id}
                className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">laptop_mac</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-on-surface">{ses.user_email}</h5>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.2 rounded-full">
                        SESI AKTIF
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                      IP: <strong>{ses.ip_address}</strong> &bull; Perangkat: {ses.device_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-on-surface-variant">{ses.login_time}</span>
                  <button
                    onClick={() => alert(`Sesi ${ses.session_id} berhasil diputus oleh administrator.`)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-black transition-colors"
                  >
                    Putus Sesi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
