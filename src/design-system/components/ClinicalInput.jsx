/**
 * NurseFlow Enterprise HIS 2026 — ClinicalInput Component
 * 
 * Medical-Grade Form Input Primitive
 * Standards: Tabular Numerals ("tnum" 1) for Clinical Vitals, WCAG Form Association, Unit Adornments.
 */

import React, { useId } from 'react';

export const ClinicalInput = React.forwardRef(function ClinicalInput(
  {
    id,
    name,
    label,
    value,
    defaultValue,
    onChange,
    type = 'text',
    placeholder = '',
    status = 'default', // 'default' | 'error' | 'warning' | 'success'
    validationMessage = '',
    helperText = '',
    required = false,
    disabled = false,
    readOnly = false,
    loading = false,
    prefixAdornment = null,
    suffixAdornment = null,
    isVitalsMono = false,
    size = 'md', // sm: 32px (dense table/HUD), md: 38px (standard), lg: 44px
    className = '',
    fullWidth = true,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const messageId = `${inputId}-message`;

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

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} flex flex-col gap-1`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--nf-text-secondary,#334155)] dark:text-[var(--nf-text-secondary,#cbd5e1)]">
          <label htmlFor={inputId} className="flex items-center gap-1 cursor-pointer select-none">
            <span>{label}</span>
            {required && (
              <span className="text-[var(--nf-clinical-panic,#dc2626)] font-bold" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </div>
      )}

      {/* Input Group Container */}
      <div className="relative flex items-center w-full">
        {/* Prefix Adornment */}
        {prefixAdornment && (
          <div className="absolute left-3 flex items-center pointer-events-none text-[var(--nf-text-muted,#64748b)]">
            {prefixAdornment}
          </div>
        )}

        {/* Core Input Element */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-required={required}
          aria-invalid={status === 'error'}
          aria-describedby={
            validationMessage ? messageId : helperText ? helperId : undefined
          }
          className={`
            w-full
            bg-[var(--nf-surface-card,#ffffff)]
            border
            font-medium
            transition-all duration-150 ease-out
            focus:outline-none focus:ring-3
            disabled:cursor-not-allowed disabled:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] disabled:opacity-60
            read-only:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] read-only:cursor-default
            dark:bg-[var(--nf-surface-card,#0f172a)]
            dark:disabled:bg-slate-900
            ${sizeStyles[size] || sizeStyles.md}
            ${statusStyles[status] || statusStyles.default}
            ${prefixAdornment ? 'pl-9' : ''}
            ${suffixAdornment || loading ? 'pr-12' : ''}
            ${isVitalsMono ? 'font-vitals-mono font-feature-tnum font-bold tracking-tight text-base' : ''}
            ${className}
          `.trim()}
          {...props}
        />

        {/* Suffix Adornment or Loading Spinner */}
        <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none text-xs font-semibold text-[var(--nf-text-muted,#64748b)]">
          {loading ? (
            <svg
              className="animate-spin h-4 w-4 text-[var(--nf-brand-ocean,#015c80)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : suffixAdornment ? (
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300 font-mono select-none">
              {suffixAdornment}
            </span>
          ) : null}
        </div>
      </div>

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

export default ClinicalInput;
