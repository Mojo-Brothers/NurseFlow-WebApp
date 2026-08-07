import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react';

/**
 * TablePagination - Komponen Pembagian Halaman Tabel Terstandar NurseFlow HIS 2026
 */
export default function TablePagination({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onRefresh,
  className = ''
}) {
  return (
    <div className={`bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-bold ${className}`}>
      
      {/* Page Jumpers & Indicators */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange && onPageChange(1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#007399] hover:text-white hover:border-[#007399] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          title="Halaman Pertama"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#007399] hover:text-white hover:border-[#007399] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="mx-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Page <span className="text-[#007399] dark:text-cyan-400 font-black">{currentPage}</span> of <span className="text-slate-900 dark:text-white font-black">{totalPages || 1}</span>
        </span>

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#007399] hover:text-white hover:border-[#007399] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          title="Halaman Selanjutnya"
        >
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => onPageChange && onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#007399] hover:text-white hover:border-[#007399] transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
          title="Halaman Terakhir"
        >
          <ChevronsRight size={14} />
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="ml-2 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#007399] transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Item Counter Indicator */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-2xs">
        Menampilkan <span className="text-[#007399] dark:text-cyan-300 font-extrabold">{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}–{Math.min(totalItems, currentPage * pageSize)}</span> dari <span className="text-slate-900 dark:text-white font-extrabold">{totalItems}</span> Data
      </div>
    </div>
  );
}
