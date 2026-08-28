/**
 * NurseFlow Enterprise HIS 2026 — ClinicalCheckbox Component
 * 
 * Medical-Grade Checkbox Primitive
 * Standards: Indeterminate State Support, WCAG 2.5.5 Touch Target Compliance (44px), Accessible Label Association.
 */

import React, { useEffect, useRef, useId } from 'react';

export const ClinicalCheckbox = React.forwardRef(function ClinicalCheckbox(
  {
    id,
    name,
    label,
    description = null,
    checked,
    defaultChecked,
    indeterminate = false,
    onChange,
    disabled = false,
    required = false,
    status = 'default', // 'default' | 'error' | 'warning'
    className = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const internalRef = useRef(null);

  // Sync ref and handle DOM indeterminate property
  const resolvedRef = ref || internalRef;

  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate, resolvedRef]);

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e);
    }
  };

  const statusStyles = {
    default:
      'border-[var(--nf-border-default,#cbd5e1)] text-[var(--nf-brand-ocean,#015c80)] focus-visible:ring-[var(--nf-brand-ocean-light,#02759f)] dark:border-[var(--nf-border-default,#334155)]',
    error:
      'border-[var(--nf-clinical-panic,#dc2626)] text-[var(--nf-clinical-panic,#dc2626)] focus-visible:ring-[var(--nf-clinical-panic,#dc2626)]',
    warning:
      'border-[var(--nf-clinical-warning,#d97706)] text-[var(--nf-clinical-warning,#d97706)] focus-visible:ring-[var(--nf-clinical-warning,#d97706)]'
  };

  const isControlled = checked !== undefined;
  const inputProps = isControlled ? { checked: Boolean(checked) } : { defaultChecked: Boolean(defaultChecked) };

  return (
    <label
      htmlFor={checkboxId}
      className={`
        inline-flex items-start gap-3 select-none cursor-pointer group min-h-[44px] py-1.5
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `.trim()}
    >
      {/* Box Container centered within touch target */}
      <div className="relative flex items-center justify-center min-w-[24px] min-h-[24px] mt-0.5">
        <input
          ref={resolvedRef}
          id={checkboxId}
          name={name}
          type="checkbox"
          {...inputProps}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-checked={indeterminate ? 'mixed' : (isControlled ? checked : defaultChecked)}
          aria-invalid={status === 'error'}
          className={`
            w-4 h-4
            rounded
            border
            bg-[var(--nf-surface-card,#ffffff)]
            transition-all duration-150 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:bg-slate-100
            dark:bg-[var(--nf-surface-card,#0f172a)]
            cursor-pointer
            ${statusStyles[status] || statusStyles.default}
          `.trim()}
          {...props}
        />
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className="text-xs font-semibold text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)] leading-normal">
              {label}
              {required && (
                <span className="text-[var(--nf-clinical-panic,#dc2626)] ml-1 font-bold" aria-hidden="true">
                  *
                </span>
              )}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-[var(--nf-text-muted,#64748b)] leading-snug">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

export default ClinicalCheckbox;
