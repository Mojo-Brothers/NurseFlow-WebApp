import React from 'react';

/**
 * SegmentedTabs - Komponen Tabulasi Navigasi Lonjong (Pill Switcher) Terstandar NurseFlow HIS 2026
 * Options: Array of { id: string, label: string, icon?: ReactNode }
 */
export default function SegmentedTabs({
  options = [],
  activeTab,
  onChange,
  size = 'md',
  className = ''
}) {
  const sizeStyles = {
    sm: 'p-0.5 text-[10px] gap-1',
    md: 'p-1 text-xs gap-1',
    lg: 'p-1.5 text-xs gap-1.5'
  };

  const buttonSizeStyles = {
    sm: 'px-3 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-5 py-2'
  };

  return (
    <div className={`inline-flex items-center bg-slate-100 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xs ${sizeStyles[size] || sizeStyles.md} ${className}`}>
      {options.map((opt) => {
        const isActive = activeTab === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange && onChange(opt.id)}
            className={`flex items-center gap-1.5 rounded-full font-extrabold transition-all cursor-pointer ${buttonSizeStyles[size] || buttonSizeStyles.md} ${
              isActive
                ? 'bg-[#007399] text-white shadow-sm shadow-[#007399]/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            {opt.icon && <span className="flex items-center">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
