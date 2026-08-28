/**
 * NurseFlow Enterprise HIS 2026 — ClinicalSelect Component
 * 
 * Medical-Grade Selection Primitive
 * Standards: Dual-Mode (Native + Searchable Combobox), WCAG ARIA Combobox/Listbox, Keyboard Accessible.
 */

import React, { useState, useRef, useEffect, useId } from 'react';

export const ClinicalSelect = React.forwardRef(function ClinicalSelect(
  {
    id,
    name,
    label,
    value,
    defaultValue = '',
    onChange,
    options = [],
    placeholder = '-- Pilih Opsi --',
    status = 'default', // 'default' | 'error' | 'warning' | 'success'
    validationMessage = '',
    helperText = '',
    required = false,
    disabled = false,
    isSearchable = false,
    isClearable = false,
    size = 'md', // 'sm' | 'md' | 'lg'
    fullWidth = true,
    className = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const helperId = `${selectId}-helper`;
  const messageId = `${selectId}-message`;

  // Normalize options array into { value, label, description, disabled, group }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value,
      label: opt.label || String(opt.value),
      description: opt.description || null,
      disabled: Boolean(opt.disabled),
      group: opt.group || null
    };
  });

  // State for Searchable Combobox Mode
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Filtered options for searchable combobox
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!isSearchable || !isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSearchable, isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectOption = (opt) => {
    if (opt.disabled) return;
    setInternalValue(opt.value);
    setIsOpen(false);
    setSearchTerm('');
    if (onChange) {
      onChange({ target: { name, value: opt.value } });
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setInternalValue('');
    if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  // Keyboard navigation for combobox
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Size styling
  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5 rounded-md',
    md: 'h-9 text-sm px-3 rounded-lg',
    lg: 'h-11 text-base px-3.5 rounded-lg'
  };

  // Status border and focus ring styling
  const statusStyles = {
    default:
      'border-[var(--nf-border-default,#cbd5e1)] text-[var(--nf-text-primary,#0f172a)] focus:border-[var(--nf-border-focus,#0284c7)] focus:ring-[var(--nf-border-focus,#0284c7)]/20 dark:border-[var(--nf-border-default,#334155)] dark:text-[var(--nf-text-primary,#f8fafc)]',
    error:
      'border-[var(--nf-clinical-panic,#dc2626)] text-[var(--nf-clinical-panic,#dc2626)] focus:border-[var(--nf-clinical-panic,#dc2626)] focus:ring-[var(--nf-clinical-panic,#dc2626)]/25 dark:border-red-500',
    warning:
      'border-[var(--nf-clinical-warning,#d97706)] text-[var(--nf-clinical-warning,#d97706)] focus:border-[var(--nf-clinical-warning,#d97706)] focus:ring-[var(--nf-clinical-warning,#d97706)]/25 dark:border-amber-500',
    success:
      'border-[var(--nf-clinical-normal,#059669)] text-[var(--nf-text-primary,#0f172a)] focus:border-[var(--nf-clinical-normal,#059669)] focus:ring-[var(--nf-clinical-normal,#059669)]/25 dark:border-emerald-500'
  };

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(internalValue));

  return (
    <div
      ref={containerRef}
      className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1 relative`}
    >
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--nf-text-secondary,#334155)] dark:text-[var(--nf-text-secondary,#cbd5e1)]">
          <label htmlFor={selectId} className="flex items-center gap-1 cursor-pointer select-none">
            <span>{label}</span>
            {required && (
              <span className="text-[var(--nf-clinical-panic,#dc2626)] font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
      )}

      {/* Select Container */}
      {!isSearchable ? (
        // ─── Mode 1: Clean Native Select ───
        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              if (onChange) onChange(e);
            }}
            disabled={disabled}
            required={required}
            aria-required={required}
            aria-invalid={status === 'error'}
            aria-describedby={validationMessage ? messageId : helperText ? helperId : undefined}
            className={`
              w-full
              appearance-none
              bg-[var(--nf-surface-card,#ffffff)]
              border
              font-medium
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-3
              disabled:cursor-not-allowed disabled:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] disabled:opacity-60
              dark:bg-[var(--nf-surface-card,#0f172a)]
              pr-9
              ${sizeStyles[size] || sizeStyles.md}
              ${statusStyles[status] || statusStyles.default}
              ${className}
            `.trim()}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 pointer-events-none text-[var(--nf-text-muted,#64748b)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      ) : (
        // ─── Mode 2: Searchable Combobox Mode ───
        <div className="relative w-full">
          <button
            ref={ref}
            id={selectId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-listbox`}
            aria-required={required}
            aria-invalid={status === 'error'}
            aria-describedby={validationMessage ? messageId : helperText ? helperId : undefined}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`
              w-full
              flex items-center justify-between
              bg-[var(--nf-surface-card,#ffffff)]
              border
              font-medium
              text-left
              transition-all duration-150 ease-out
              focus:outline-none focus:ring-3
              disabled:cursor-not-allowed disabled:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] disabled:opacity-60
              dark:bg-[var(--nf-surface-card,#0f172a)]
              ${sizeStyles[size] || sizeStyles.md}
              ${statusStyles[status] || statusStyles.default}
              ${className}
            `.trim()}
            {...props}
          >
            <span className={selectedOption ? 'text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)]' : 'text-[var(--nf-text-muted,#64748b)]'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-1.5 ml-2 text-[var(--nf-text-muted,#64748b)]">
              {isClearable && internalValue && !disabled && (
                <span
                  role="button"
                  aria-label="Hapus Pilihan"
                  onClick={handleClear}
                  className="hover:text-slate-900 dark:hover:text-white p-0.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              )}
              <svg className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Combobox Dropdown Popover */}
          {isOpen && (
            <div
              id={`${selectId}-listbox`}
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1 bg-[var(--nf-surface-card,#ffffff)] dark:bg-[var(--nf-surface-card,#0f172a)] border border-[var(--nf-border-default,#cbd5e1)] dark:border-[var(--nf-border-default,#334155)] rounded-lg shadow-xl z-[var(--nf-z-dropdown,100)] max-h-60 overflow-hidden flex flex-col animate-fadeIn"
            >
              {/* Search Bar Input */}
              <div className="p-2 border-b border-[var(--nf-border-subtle,#e2e8f0)] dark:border-[var(--nf-border-subtle,#1e293b)] bg-[var(--nf-surface-canvas-subtle,#f8fafc)] dark:bg-slate-900">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik untuk mencari..."
                  className="w-full text-xs px-2.5 py-1.5 bg-[var(--nf-surface-card,#ffffff)] dark:bg-[var(--nf-surface-card,#0f172a)] border border-[var(--nf-border-default,#cbd5e1)] dark:border-[var(--nf-border-default,#334155)] rounded focus:outline-none focus:border-[var(--nf-border-focus,#0284c7)]"
                />
              </div>

              {/* Options List */}
              <div className="overflow-y-auto max-h-48 p-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[var(--nf-text-muted,#64748b)] text-center">
                    Tidak ada opsi yang cocok
                  </div>
                ) : (
                  filteredOptions.map((opt, idx) => {
                    const isSelected = String(opt.value) === String(internalValue);
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onClick={() => handleSelectOption(opt)}
                        className={`
                          flex flex-col px-3 py-2 text-xs rounded-md cursor-pointer select-none transition-colors
                          ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-[var(--nf-brand-ocean,#015c80)] text-white font-semibold' : ''}
                          ${isHighlighted && !isSelected ? 'bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] dark:bg-slate-800 text-[var(--nf-text-primary,#0f172a)] dark:text-white' : ''}
                          ${!isSelected && !isHighlighted ? 'text-[var(--nf-text-secondary,#334155)] dark:text-[var(--nf-text-secondary,#cbd5e1)]' : ''}
                        `.trim()}
                      >
                        <span className="font-medium">{opt.label}</span>
                        {opt.description && (
                          <span className={`text-[11px] ${isSelected ? 'text-slate-200' : 'text-[var(--nf-text-muted,#64748b)]'}`}>
                            {opt.description}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Message or Helper Text */}
      {validationMessage ? (
        <p
          id={messageId}
          className={`text-xs font-medium ${
            status === 'error'
              ? 'text-[var(--nf-clinical-panic,#dc2626)]'
              : status === 'warning'
              ? 'text-[var(--nf-clinical-warning,#d97706)]'
              : 'text-[var(--nf-clinical-normal,#059669)]'
          }`}
          role="alert"
        >
          {validationMessage}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-[var(--nf-text-muted,#64748b)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default ClinicalSelect;
