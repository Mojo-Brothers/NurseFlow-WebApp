/**
 * NurseFlow Enterprise HIS 2026 — ClinicalIconButton Component
 * 
 * Medical-Grade Icon Button Primitive
 * Standards: WCAG 2.5.5 Touch Target Compliance (Minimum 44x44px), ARIA Accessibility, Screen-Reader Support.
 */

import React, { useState } from 'react';

export const ClinicalIconButton = React.forwardRef(function ClinicalIconButton(
  {
    icon,
    ariaLabel,
    tooltip = null,
    variant = 'ghost',
    size = 'md', // sm: 36px (padded to 44px), md: 44px, lg: 48px
    loading = false,
    disabled = false,
    onClick,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isActionBlocked = disabled || loading;

  const handleClick = (e) => {
    if (isActionBlocked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  // Base styles guaranteeing minimum 44px touch target (WCAG 2.5.5)
  const baseStyles =
    'relative inline-flex items-center justify-center select-none rounded-lg transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.96] min-w-[44px] min-h-[44px]';

  const sizeStyles = {
    sm: 'w-11 h-11 p-2 text-sm',
    md: 'w-11 h-11 p-2.5 text-base',
    lg: 'w-12 h-12 p-3 text-lg'
  };

  const variantStyles = {
    primary:
      'bg-[var(--nf-brand-ocean,#015c80)] hover:bg-[var(--nf-brand-ocean-dark,#014460)] text-[var(--nf-text-inverse,#ffffff)] shadow-sm focus-visible:ring-[var(--nf-brand-ocean-light,#02759f)]',
    secondary:
      'bg-[var(--nf-surface-card,#ffffff)] hover:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] text-[var(--nf-text-primary,#0f172a)] border border-[var(--nf-border-default,#cbd5e1)] shadow-sm focus-visible:ring-[var(--nf-border-focus,#0284c7)] dark:bg-[var(--nf-surface-card,#0f172a)] dark:hover:bg-[var(--nf-surface-muted,#1e293b)] dark:text-[var(--nf-text-primary,#f8fafc)] dark:border-[var(--nf-border-default,#334155)]',
    ghost:
      'bg-transparent hover:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] text-[var(--nf-text-secondary,#334155)] focus-visible:ring-[var(--nf-border-focus,#0284c7)] dark:hover:bg-[var(--nf-surface-muted,#1e293b)] dark:text-[var(--nf-text-secondary,#cbd5e1)]',
    destructive:
      'bg-transparent hover:bg-red-50 text-[var(--nf-clinical-panic,#dc2626)] hover:text-red-700 focus-visible:ring-red-500 dark:hover:bg-red-950/40',
    highAlert:
      'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 focus-visible:ring-amber-500 dark:bg-amber-950/50 dark:text-amber-200'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isActionBlocked}
        disabled={isActionBlocked}
        onClick={handleClick}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => tooltip && setShowTooltip(false)}
        onFocus={() => tooltip && setShowTooltip(true)}
        onBlur={() => tooltip && setShowTooltip(false)}
        className={`
          ${baseStyles}
          ${sizeStyles[size] || sizeStyles.md}
          ${variantStyles[variant] || variantStyles.ghost}
          ${className}
        `.trim()}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </button>

      {/* Accessible Tooltip */}
      {tooltip && showTooltip && !isActionBlocked && (
        <div
          role="tooltip"
          className="absolute bottom-full mb-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded shadow-lg pointer-events-none whitespace-nowrap z-[100] animate-fadeIn"
        >
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
});

export default ClinicalIconButton;
