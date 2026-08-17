import React from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';

export default function MasterDataStatsBar() {
  const { activeEntity, entitiesData } = useMasterDataStore();
  const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || MASTER_DATA_ENTITIES[activeEntity] || {};
  const currentData = entitiesData[activeEntity] || [];

  const totalRecords = currentData.length;
  const activeRecords = currentData.filter(d => !d.is_deleted && d.status === 'ACTIVE').length;
  const inactiveRecords = currentData.filter(d => !d.is_deleted && d.status === 'INACTIVE').length;
  const trashRecords = currentData.filter(d => d.is_deleted).length;
  const activePercent = totalRecords > 0 ? Math.round((activeRecords / (totalRecords - trashRecords || 1)) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Data */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center gap-3.5 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">{config.icon || 'database'}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider truncate">Total {config.singular || 'Data'}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-headline font-black text-on-surface">{totalRecords}</span>
            <span className="text-[10px] font-bold text-primary">Records</span>
          </div>
        </div>
      </div>

      {/* Status Aktif */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center gap-3.5 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">check_circle</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider truncate">Status Aktif</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-headline font-black text-emerald-600 dark:text-emerald-400">{activeRecords}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">({activePercent}%)</span>
          </div>
        </div>
      </div>

      {/* Non-Aktif / Suspended */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center gap-3.5 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">pause_circle</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider truncate">Non-Aktif</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-headline font-black text-amber-600 dark:text-amber-400">{inactiveRecords}</span>
            <span className="text-[10px] font-bold text-on-surface-variant">Records</span>
          </div>
        </div>
      </div>

      {/* Tempat Sampah (Soft-Deleted) */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center gap-3.5 shadow-xs">
        <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">delete_sweep</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider truncate">Tempat Sampah</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-headline font-black text-rose-600 dark:text-rose-400">{trashRecords}</span>
            <span className="text-[10px] font-bold text-rose-500">Soft-Deleted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
