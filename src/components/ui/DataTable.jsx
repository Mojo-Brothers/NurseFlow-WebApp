import React from 'react';
import TablePagination from './TablePagination.jsx';

/**
 * DataTable - Komponen Data Grid Terstandar NurseFlow HIS 2026
 * Columns: Array of { key: string, label: string, align?: 'left'|'center'|'right', render?: (row) => ReactNode, width?: string }
 */
export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'Tidak ada data ditemukan',
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onRefresh,
  className = ''
}) {
  return (
    <div className={`bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse min-w-[700px]">
          
          {/* Header Row */}
          <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{ width: col.width }}
                  className={`py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#007399] border-t-transparent rounded-full animate-spin"></div>
                    <span>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr 
                  key={row.id || rIdx} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      className={`py-3 px-4 text-slate-700 dark:text-slate-200 font-medium ${
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Table Pagination */}
      {currentPage !== undefined && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems || data.length}
          onPageChange={onPageChange}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
