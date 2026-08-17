import React from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';

export default function MasterDataFilterBar() {
  const {
    activeEntity,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    openCreateModal,
    openImportModal,
    exportData,
    fetchCurrentEntityData,
    resetEntireEnterpriseData,
    isLoading
  } = useMasterDataStore();

  const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || MASTER_DATA_ENTITIES[activeEntity] || {};

  const handleResetData = async () => {
    if (window.confirm(`Apakah Anda yakin ingin memulihkan seluruh dataset awal untuk ${config.title}? Data perubahan lokal akan di-reset ke standar default.`)) {
      if (resetEntireEnterpriseData) await resetEntireEnterpriseData();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top Action Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-lg">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari ${config.singular || 'data'} (Nama, Kode, Spesifikasi, dll)...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => fetchCurrentEntityData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-all"
            title="Muat Ulang Data"
          >
            <span className={`material-symbols-outlined text-[20px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Seed / Reset Default */}
          <button
            onClick={handleResetData}
            className="px-3 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-amber-600 font-bold text-xs flex items-center gap-1.5 transition-all"
            title="Reset ke Dataset Awal RS"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset Demo</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={openImportModal}
            className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Import</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-xl bg-surface-container-high border border-outline-variant/30 p-0.5">
            <button
              onClick={() => exportData('EXCEL')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-emerald-600 hover:bg-emerald-500/10 flex items-center gap-1 transition-all"
              title="Ekspor ke Excel CSV"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_view</span>
              <span>Excel</span>
            </button>
            <div className="h-4 w-px bg-outline-variant/40"></div>
            <button
              onClick={() => exportData('PDF')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 flex items-center gap-1 transition-all"
              title="Cetak Laporan PDF"
            >
              <span className="material-symbols-outlined text-[16px] text-rose-600">picture_as_pdf</span>
              <span>PDF</span>
            </button>
          </div>

          {/* Primary Create Button */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-extrabold text-xs flex items-center gap-2 shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all ml-auto lg:ml-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah {config.singular || 'Data'}</span>
          </button>
        </div>
      </div>

      {/* Filter Status Tabs (Semua, Aktif, Non-Aktif, Tempat Sampah) */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mr-2 shrink-0">
          Filter Status:
        </span>

        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            statusFilter === 'ALL'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Semua Data
        </button>

        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-surface-container-high text-on-surface-variant hover:text-emerald-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Aktif
        </button>

        <button
          onClick={() => setStatusFilter('INACTIVE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            statusFilter === 'INACTIVE'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-surface-container-high text-on-surface-variant hover:text-amber-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Non-Aktif
        </button>

        <button
          onClick={() => setStatusFilter('TRASH')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            statusFilter === 'TRASH'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-surface-container-high text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          Tempat Sampah (Soft-Deleted)
        </button>
      </div>
    </div>
  );
}
