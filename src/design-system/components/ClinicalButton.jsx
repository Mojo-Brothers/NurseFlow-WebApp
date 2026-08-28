/**
 * NurseFlow Enterprise HIS 2026 — ClinicalButton Component
 * 
 * Medical-Grade Interactive Button Primitive
 * Standards: WCAG 2.1 AAA Contrast, JCI Double-Submit Prevention, Clinical Tactile Feedback.
 */

import React from 'react';

export const ClinicalButton = React.forwardRef(function ClinicalButton(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Memproses...',
    disabled = false,
    icon = null,
    iconTrailing = null,
    type = 'button',
    onClick,
    className = '',
    fullWidth = false,
    ariaLabel,
    ...props
  },
  ref
) {
  // Prevent any clicks when disabled or in loading state (Double-Submit Safety Shield)
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

  // Base styling incorporating canonical CSS variables
  const baseStyles =
    'inline-flex items-center justify-center font-medium select-none transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

  // Size scales (dense clinical grid)
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-9 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-11 px-5 text-base gap-2.5 rounded-lg'
  };

  // Variant color definitions
  const variantStyles = {
    primary:
      'bg-[var(--nf-brand-ocean,#015c80)] hover:bg-[var(--nf-brand-ocean-dark,#014460)] text-[var(--nf-text-inverse,#ffffff)] shadow-sm focus-visible:ring-[var(--nf-brand-ocean-light,#02759f)] border border-transparent',
    secondary:
      'bg-[var(--nf-surface-card,#ffffff)] hover:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] text-[var(--nf-text-primary,#0f172a)] border border-[var(--nf-border-default,#cbd5e1)] shadow-sm focus-visible:ring-[var(--nf-border-focus,#0284c7)] dark:bg-[var(--nf-surface-card,#0f172a)] dark:hover:bg-[var(--nf-surface-muted,#1e293b)] dark:text-[var(--nf-text-primary,#f8fafc)] dark:border-[var(--nf-border-default,#334155)]',
    ghost:
      'bg-transparent hover:bg-[var(--nf-surface-canvas-subtle,#f1f5f9)] text-[var(--nf-text-secondary,#334155)] focus-visible:ring-[var(--nf-border-focus,#0284c7)] dark:hover:bg-[var(--nf-surface-muted,#1e293b)] dark:text-[var(--nf-text-secondary,#cbd5e1)]',
    destructive:
      'bg-[var(--nf-clinical-panic,#dc2626)] hover:bg-red-700 active:bg-red-800 text-[var(--nf-text-inverse,#ffffff)] shadow-sm focus-visible:ring-red-500 border border-transparent',
    highAlert:
      'bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-800 hover:to-amber-800 text-white font-bold tracking-wide shadow-md border border-amber-400 focus-visible:ring-amber-500'
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={isActionBlocked}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={isActionBlocked}
      aria-label={ariaLabel}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.primary}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current"
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
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex items-center shrink-0" aria-hidden="true">{icon}</span>}
          <span>{children}</span>
          {iconTrailing && <span className="inline-flex items-center shrink-0" aria-hidden="true">{iconTrailing}</span>}
        </>
      )}
    </button>
  );
});

export default ClinicalButton;
