import React from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';
import { useAuth } from '../../../contexts/useAuth.js';

export default function MasterDataTable() {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || 'admin@nurseflow.id';

  const {
    activeEntity,
    entitiesData,
    searchQuery,
    statusFilter,
    selectedIds,
    toggleSelectId,
    selectAllVisible,
    clearSelection,
    sortConfig,
    setSortConfig,
    pagination,
    setPage,
    setPageSize,
    openEditModal,
    openDetailDrawer,
    softDeleteRecord,
    restoreRecord,
    batchSoftDelete,
    batchRestore,
    isLoading
  } = useMasterDataStore();

  const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || MASTER_DATA_ENTITIES[activeEntity] || {};
  const allRecords = entitiesData[activeEntity] || [];

  // Filter pipeline
  let filtered = allRecords;

  // Status Filter
  if (statusFilter === 'TRASH') {
    filtered = filtered.filter(item => item.is_deleted);
  } else {
    filtered = filtered.filter(item => !item.is_deleted);
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
  }

  // Search Filter
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      return Object.values(item).some(val => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }

  // Sort Pipeline
  const sorted = [...filtered].sort((a, b) => {
    const field = sortConfig.field;
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    let valA = a[field];
    let valB = b[field];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * dir;
    }
    if (typeof valA === 'number') {
      return (valA - valB) * dir;
    }
    return 0;
  });

  // Pagination Slice
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const paginatedData = sorted.slice(startIndex, startIndex + pagination.pageSize);

  const visibleIds = paginatedData.map(d => d.id);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

  // Cell Formatter
  const renderCellContent = (item, col) => {
    const value = item[col.key];

    if (col.format === 'status_badge') {
      if (item.is_deleted) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            TERHAPUS (TRASH)
          </span>
        );
      }
      const isActive = item.status === 'ACTIVE';
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
          isActive 
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          {isActive ? 'AKTIF' : 'NON-AKTIF'}
        </span>
      );
    }

    if (col.format === 'gender') {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
          value === 'L' ? 'bg-blue-500/10 text-blue-600' : 'bg-pink-500/10 text-pink-600'
        }`}>
          <span className="material-symbols-outlined text-[14px]">
            {value === 'L' ? 'male' : 'female'}
          </span>
          {value === 'L' ? 'Laki-Laki' : 'Perempuan'}
        </span>
      );
    }

    if (col.format === 'currency') {
      return (
        <span className="font-mono font-bold text-xs text-on-surface">
          Rp {Number(value || 0).toLocaleString('id-ID')}
        </span>
      );
    }

    if (col.format === 'chip') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-semibold truncate max-w-[200px]">
          {value || '-'}
        </span>
      );
    }

    if (col.format === 'badge_pk') {
      return (
        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
          {value || '-'}
        </span>
      );
    }

    if (col.format === 'bed_status_badge') {
      const colors = {
        AVAILABLE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        OCCUPIED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        RESERVED: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        CLEANING: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        MAINTENANCE: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
      };
      return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${colors[value] || 'bg-slate-500/10 text-slate-600'}`}>
          {value || 'AVAILABLE'}
        </span>
      );
    }

    if (col.format === 'danger_tag') {
      return value ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow-xs">
          <span className="material-symbols-outlined text-[12px]">warning</span>
          HIGH-ALERT
        </span>
      ) : (
        <span className="text-on-surface-variant/60 text-xs">-</span>
      );
    }

    if (col.format === 'boolean_tag') {
      return (
        <span className={`text-[11px] font-bold ${value ? 'text-rose-600' : 'text-on-surface-variant'}`}>
          {value ? 'Ya' : 'Tidak'}
        </span>
      );
    }

    if (col.primary) {
      return (
        <button
          onClick={() => openDetailDrawer(item)}
          className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1"
        >
          <span>{value || item.id}</span>
          <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
        </button>
      );
    }

    return <span className="text-xs font-medium text-on-surface">{value !== undefined && value !== null ? String(value) : '-'}</span>;
  };

  return (
    <div className="flex flex-col rounded-2xl bg-surface-container-high border border-outline-variant/30 shadow-sm overflow-hidden">
      
      {/* Batch Action Ribbon (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/10 border-b border-primary/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-black">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-on-surface">
              {selectedIds.length} {config.singular || 'item'} terpilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            {statusFilter === 'TRASH' ? (
              <button
                onClick={() => batchRestore(userEmail)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restore</span>
                <span>Pulihkan Terpilih</span>
              </button>
            ) : (
              <button
                onClick={() => batchSoftDelete(userEmail)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-rose-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Hapus Lunak Terpilih</span>
              </button>
            )}

            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container/60">
              {/* Checkbox Column */}
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  onChange={() => selectAllVisible(visibleIds)}
                  className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                />
              </th>

              {/* Dynamic Columns */}
              {config.columns?.map(col => {
                const isSorted = sortConfig.field === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && setSortConfig(col.key)}
                    className={`p-3.5 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider select-none ${
                      col.sortable ? 'cursor-pointer hover:text-primary transition-colors' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className={`material-symbols-outlined text-[14px] ${isSorted ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                          {isSorted && sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Action Column */}
              <th className="p-3.5 text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider text-right w-24">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20">
            {isLoading ? (
              <tr>
                <td colSpan={(config.columns?.length || 0) + 2} className="p-12 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-xs font-bold text-on-surface">Memuat master data...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={(config.columns?.length || 0) + 2} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/50 mb-3">
                      <span className="material-symbols-outlined text-3xl">folder_off</span>
                    </div>
                    <h4 className="text-base font-bold text-on-surface mb-1">Tidak Ada Data Ditemukan</h4>
                    <p className="text-xs text-on-surface-variant text-center mb-4">
                      {searchQuery ? `Tidak ada data yang sesuai dengan kata kunci "${searchQuery}".` : 'Belum ada record master data pada kategori ini.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr
                    key={item.id || idx}
                    className={`group transition-colors ${
                      isSelected 
                        ? 'bg-primary/5' 
                        : item.is_deleted 
                          ? 'bg-rose-500/5 hover:bg-rose-500/10 opacity-75' 
                          : 'hover:bg-surface-container/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectId(item.id)}
                        className="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Dynamic Data Cells */}
                    {config.columns?.map(col => (
                      <td key={col.key} className="p-3.5">
                        {renderCellContent(item, col)}
                      </td>
                    ))}

                    {/* Actions Column */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Detail / View */}
                        <button
                          onClick={() => openDetailDrawer(item)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                          title="Lihat Detail & Audit"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>

                        {/* Edit (if not soft-deleted) */}
                        {!item.is_deleted && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                            title="Ubah Data"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}

                        {/* Soft Delete or Restore */}
                        {item.is_deleted ? (
                          <button
                            onClick={() => restoreRecord(item.id, userEmail)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            title="Pulihkan Data (Restore)"
                          >
                            <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus lunak data ${item[config.nameField] || item.id}? Data dapat dipulihkan dari tempat sampah.`)) {
                                softDeleteRecord(item.id, userEmail);
                              }
                            }}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Lunak (Soft Delete)"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container/30">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span>Menampilkan</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-bold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>dari <strong>{totalItems}</strong> data total</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            title="Halaman Sebelumnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          <span className="text-xs font-bold text-on-surface px-3">
            Halaman {pagination.page} dari {totalPages}
          </span>

          <button
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            title="Halaman Berikutnya"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
