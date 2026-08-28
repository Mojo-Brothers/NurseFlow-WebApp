/**
 * NurseFlow Enterprise HIS 2026 — ClinicalRadio & ClinicalRadioGroup Components
 * 
 * Medical-Grade Radio Selection Primitives
 * Standards: ARIA Radiogroup / Radio Semantics, Segmented Clinical Cards (ESI/Pain), Keyboard Traversal.
 */

import React, { useId, useState, useEffect } from 'react';

export const ClinicalRadio = React.forwardRef(function ClinicalRadio(
  {
    id,
    name,
    value,
    checked = false,
    defaultChecked,
    onChange,
    label,
    description = null,
    badge = null,
    disabled = false,
    variant = 'standard', // 'standard' | 'card'
    className = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const radioId = id || generatedId;

  const isControlled = checked !== undefined;
  const inputProps = isControlled
    ? { checked: Boolean(checked) }
    : defaultChecked !== undefined
    ? { defaultChecked: Boolean(defaultChecked) }
    : {};

  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e);
    }
  };

  if (variant === 'card') {
    return (
      <label
        htmlFor={radioId}
        className={`
          relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none min-h-[44px]
          ${checked
            ? 'bg-[var(--nf-surface-highlight,#f0f9ff)] border-[var(--nf-brand-ocean,#015c80)] shadow-sm dark:bg-slate-800 dark:border-sky-500'
            : 'bg-[var(--nf-surface-card,#ffffff)] border-[var(--nf-border-default,#cbd5e1)] hover:bg-[var(--nf-surface-canvas-subtle,#f8fafc)] dark:bg-[var(--nf-surface-card,#0f172a)] dark:border-[var(--nf-border-default,#334155)]'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${className}
        `.trim()}
      >
        <div className="flex items-center justify-center min-w-[20px] min-h-[20px] mt-0.5">
          <input
            ref={ref}
            id={radioId}
            name={name}
            type="radio"
            value={value}
            {...inputProps}
            onChange={handleChange}
            disabled={disabled}
            className="w-4 h-4 text-[var(--nf-brand-ocean,#015c80)] border-[var(--nf-border-default,#cbd5e1)] focus-visible:ring-[var(--nf-brand-ocean-light,#02759f)] cursor-pointer"
            {...props}
          />
        </div>

        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)]">
              {label}
            </span>
            {badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <span className="text-[11px] text-[var(--nf-text-muted,#64748b)] leading-snug">
              {description}
            </span>
          )}
        </div>
      </label>
    );
  }

  // Standard Radio format
  return (
    <label
      htmlFor={radioId}
      className={`
        inline-flex items-start gap-3 select-none cursor-pointer group min-h-[44px] py-1.5
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `.trim()}
    >
      <div className="relative flex items-center justify-center min-w-[24px] min-h-[24px] mt-0.5">
        <input
          ref={ref}
          id={radioId}
          name={name}
          type="radio"
          value={value}
          {...inputProps}
          onChange={handleChange}
          disabled={disabled}
          className="w-4 h-4 text-[var(--nf-brand-ocean,#015c80)] border-[var(--nf-border-default,#cbd5e1)] focus-visible:ring-[var(--nf-brand-ocean-light,#02759f)] cursor-pointer"
          {...props}
        />
      </div>

      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <span className="text-xs font-semibold text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)] leading-normal">
              {label}
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

export const ClinicalRadioGroup = React.forwardRef(function ClinicalRadioGroup(
  {
    name,
    label,
    value,
    defaultValue,
    onChange,
    options = [],
    orientation = 'vertical', // 'vertical' | 'horizontal'
    variant = 'standard', // 'standard' | 'card'
    required = false,
    disabled = false,
    helperText = '',
    validationMessage = '',
    className = '',
    ...props
  },
  ref
) {
  const generatedName = useId();
  const groupName = name || generatedName;
  const [currentValue, setCurrentValue] = useState(value !== undefined ? value : defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
    }
  }, [value]);

  const handleOptionChange = (optValue) => {
    setCurrentValue(optValue);
    if (onChange) {
      onChange(optValue);
    }
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-required={required}
      aria-label={label}
      className={`flex flex-col gap-1.5 ${className}`}
      {...props}
    >
      {/* Group Label */}
      {label && (
        <span className="text-xs font-semibold text-[var(--nf-text-secondary,#334155)] dark:text-[var(--nf-text-secondary,#cbd5e1)] select-none">
          {label}
          {required && (
            <span className="text-[var(--nf-clinical-panic,#dc2626)] ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}

      {/* Options Container */}
      <div
        className={`flex ${
          orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
        }`}
      >
        {options.map((opt) => {
          const isChecked = String(currentValue) === String(opt.value);
          const isOptDisabled = disabled || opt.disabled;

          return (
            <ClinicalRadio
              key={opt.value}
              name={groupName}
              value={opt.value}
              checked={isChecked}
              label={opt.label}
              description={opt.description}
              badge={opt.badge}
              disabled={isOptDisabled}
              variant={variant}
              onChange={() => handleOptionChange(opt.value)}
            />
          );
        })}
      </div>

      {/* Validation or Helper text */}
      {validationMessage ? (
        <p className="text-xs font-medium text-[var(--nf-clinical-panic,#dc2626)]" role="alert">
          {validationMessage}
        </p>
      ) : helperText ? (
        <p className="text-xs text-[var(--nf-text-muted,#64748b)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default ClinicalRadio;
