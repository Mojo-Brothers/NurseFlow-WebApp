import React, { useState } from 'react';
import { ShieldCheck, Check, X, Lock, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getRolePermissions, saveRolePermissions } from '../services/staffManagement.service';

const PERMISSION_COLUMNS = [
  { key: 'canCreateMaterialRequest', label: 'Buat Requisisi (RQ)' },
  { key: 'canApproveMaterialRequest', label: 'Otorisasi RQ (Approve)' },
  { key: 'canEsignBarcode', label: 'E-Sign & Barcode Akses' },
  { key: 'canManageStaffData', label: 'Kelola Data Staf' },
  { key: 'canEditRbacMatrix', label: 'Edit Matrix Hak Akses' },
  { key: 'canViewPatientEmr', label: 'Lihat EMR Pasien' },
  { key: 'canManageInventory', label: 'Kelola Stok Logistik' },
  { key: 'canViewBilling', label: 'Lihat Transaksi Billing' }
];

export default function RbacMatrixTable() {
  const [matrix, setMatrix] = useState(() => getRolePermissions());
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (roleKey, permKey) => {
    if (roleKey === 'SUPER_ADMIN') {
      toast.error('Hak Akses SUPER_ADMIN bersifat terproteksi permanen!');
      return;
    }

    setMatrix(prev => {
      const roleObj = prev[roleKey] || {};
      const updatedRole = {
        ...roleObj,
        [permKey]: !roleObj[permKey]
      };
      return {
        ...prev,
        [roleKey]: updatedRole
      };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveRolePermissions(matrix);
    setHasChanges(false);
    toast.success('Matrix Hak Akses (RBAC) Berhasil Disimpan & Berlaku Real-time!', {
      icon: '🛡️'
    });
  };

  const handleReset = () => {
    const loaded = getRolePermissions();
    setMatrix(loaded);
    setHasChanges(false);
    toast('Matrix Hak Akses Direset', { icon: '🔄' });
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header & Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Matrix Kewenangan Hak Akses (RBAC Permission Grid)</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-mono font-bold uppercase border border-emerald-500/20">
                JCI Audit Ready
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Atur kewenangan setiap peran staf rumah sakit secara terpusat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-1.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} />
            <span>Simpan Matriks RBAC</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3 w-56 border-r border-slate-200 dark:border-slate-800">Peran / Role Staf</th>
              {PERMISSION_COLUMNS.map(col => (
                <th key={col.key} className="p-2.5 text-center border-r border-slate-200 dark:border-slate-800 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {Object.keys(matrix).map(roleKey => {
              const roleData = matrix[roleKey];
              const isSuperAdmin = roleKey === 'SUPER_ADMIN';

              return (
                <tr key={roleKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{roleData.roleName}</div>
                    <span className="font-mono text-[10px] text-primary">{roleKey}</span>
                  </td>

                  {PERMISSION_COLUMNS.map(col => {
                    const isAllowed = !!roleData[col.key];

                    return (
                      <td key={col.key} className="p-2 text-center border-r border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={isSuperAdmin}
                          onClick={() => handleToggle(roleKey, col.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            isAllowed
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          } ${isSuperAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
                          title={`${roleData.roleName} — ${col.label}: ${isAllowed ? 'Diberikan' : 'Ditolak'}`}
                        >
                          {isAllowed ? <Check size={14} className="font-black" /> : <X size={14} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
