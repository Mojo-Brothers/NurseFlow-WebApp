import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

/**
 * FilterToolbar - Komponen Bilah Pencarian & Filter Terpadu NurseFlow HIS 2026
 */
export default function FilterToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  children,
  onSearchSubmit,
  onReset,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xs ${className}`}>
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
        
        {/* Main Search Input */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#007399]" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-full pl-10 pr-4 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007399]/30 focus:border-[#007399] transition-all shadow-2xs"
            />
          </div>
        )}

        {/* Custom Dropdowns & Date Pickers passed as children */}
        {children}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onSearchSubmit && (
          <button
            type="button"
            onClick={onSearchSubmit}
            className="px-4 py-1.5 bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold rounded-full shadow-sm shadow-[#007399]/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Search size={14} />
            <span>Tampilkan Data</span>
          </button>
        )}

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-full shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
