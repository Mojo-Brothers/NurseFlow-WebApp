import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

/**
 * [COMP-UI-13] PillSearchBar - Reusable Oceanic Teal Pill Search Bar
 * Bilah pencarian lonjong terstandar dengan border Oceanic Teal #007399,
 * tombol reset instan, dan tombol aksi "ADVANCED" embedded.
 */
export default function PillSearchBar({
  value = '',
  onChange,
  onSearch,
  onFocus,
  onClick,
  onPaste,
  onAdvancedClick,
  placeholder = 'Cari pasien canggih (Nama, No. RM, NIK, No. Kartu BPJS)...',
  advancedLabel = 'ADVANCED',
  showAdvancedButton = true,
  variant = 'primary', // 'primary' (#007399) | 'emerald' | 'violet'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  autoFocus = false,
}) {
  const [internalValue, setInternalValue] = useState(value);
  const isControlled = onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    if (onChange) onChange(val);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData?.getData('text') || '';
    if (pastedText) {
      e.preventDefault();
      // Clean potential prefixes from pasted NRM text (e.g. "MRN: 100001" -> "100001")
      const cleaned = pastedText.replace(/^(mrn[:\s-]*|rm[:\s-]*|no\.?\s*rm[:\s-]*|#\s*)/i, '').trim();
      if (!isControlled) setInternalValue(cleaned);
      if (onChange) onChange(cleaned);
      if (onPaste) onPaste(cleaned, e);
    }
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue('');
    if (onChange) onChange('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(currentValue);
    }
  };

  // Color Variant Styles
  const variantStyles = {
    primary: {
      border: 'border-2 border-[#007399]',
      icon: 'text-[#007399]',
      ring: 'focus:ring-4 focus:ring-[#007399]/20',
      badge: 'bg-[#007399]/10 hover:bg-[#007399] text-[#007399] hover:text-white border-[#007399]/30',
    },
    emerald: {
      border: 'border-2 border-emerald-600',
      icon: 'text-emerald-600',
      ring: 'focus:ring-4 focus:ring-emerald-600/20',
      badge: 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-600/30',
    },
    violet: {
      border: 'border-2 border-violet-600',
      icon: 'text-violet-600',
      ring: 'focus:ring-4 focus:ring-violet-600/20',
      badge: 'bg-violet-600/10 hover:bg-violet-600 text-violet-600 hover:text-white border-violet-600/30',
    },
  }[variant] || variantStyles.primary;

  // Size Padding Styles
  const sizeStyles = {
    sm: 'py-1.5 pl-9 pr-24 text-xs',
    md: 'py-2.5 pl-11 pr-28 text-xs',
    lg: 'py-3.5 pl-12 pr-32 text-sm',
  }[size] || sizeStyles.md;

  const iconSizes = { sm: 14, md: 18, lg: 20 }[size] || 18;

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Search Icon */}
      <Search
        size={iconSizes}
        className={`absolute left-4 font-bold ${variantStyles.icon} shrink-0 pointer-events-none`}
      />

      {/* Pill Input */}
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onFocus={onFocus}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full bg-white dark:bg-slate-900 ${variantStyles.border} ${variantStyles.ring} rounded-full ${sizeStyles} font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-500/80 focus:outline-none transition-all shadow-xs`}
      />

      {/* Clear Button */}
      {currentValue && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute ${showAdvancedButton ? 'right-24 sm:right-28' : 'right-4'} text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition-colors`}
          aria-label="Bersihkan pencarian"
        >
          <X size={14} />
        </button>
      )}

      {/* Embedded Advanced Trigger Button */}
      {showAdvancedButton && (
        <button
          type="button"
          onClick={onAdvancedClick}
          className={`absolute right-2 px-3 py-1.5 border rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${variantStyles.badge}`}
          title="Membuka Pencarian Komprehensif / Filter Lanjutan"
        >
          <SlidersHorizontal size={12} />
          <span className="inline">{advancedLabel}</span>
        </button>
      )}
    </div>
  );
}
