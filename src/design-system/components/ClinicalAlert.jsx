/**
 * NurseFlow Enterprise HIS 2026 — ClinicalAlert Component
 * 
 * Medical-Grade Alert Primitive with RFC 7807 Problem Details Support
 * Standards: WCAG ARIA Live Regions ("polite" vs "assertive"), Dismissible Safety, Correlation Lineage Display.
 */

import React, { useState } from 'react';

export const ClinicalAlert = React.forwardRef(function ClinicalAlert(
  {
    variant = 'info', // 'info' | 'success' | 'warning' | 'error' | 'critical' | 'panic'
    title = null,
    children = null,
    icon = null,
    dismissible = false,
    onDismiss = null,
    action = null,
    problemDetails = null, // RFC 7807 Problem Details Object
    ariaLive = null,
    className = '',
    ...props
  },
  ref
) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // RFC 7807 extraction
  const effectiveTitle = problemDetails?.title || title;
  const effectiveDetail = problemDetails?.detail || children;
  const correlationId = problemDetails?.correlationId || problemDetails?.instance;
  const statusCode = problemDetails?.status;

  // Resolve ARIA live strategy
  const isAssertive = variant === 'critical' || variant === 'panic' || variant === 'error';
  const resolvedAriaLive = ariaLive || (isAssertive ? 'assertive' : 'polite');

  // Variant styling
  const variantStyles = {
    info: {
      container: 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100',
      iconColor: 'text-[var(--nf-brand-ocean,#015c80)] dark:text-sky-400',
      iconDefault: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100',
      iconColor: 'text-[var(--nf-clinical-normal,#059669)] dark:text-emerald-400',
      iconDefault: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100',
      iconColor: 'text-[var(--nf-clinical-warning,#d97706)] dark:text-amber-400',
      iconDefault: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    error: {
      container: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-100',
      iconColor: 'text-[var(--nf-clinical-panic,#dc2626)] dark:text-red-400',
      iconDefault: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    critical: {
      container: 'bg-red-100 dark:bg-red-950/80 border-red-500 text-red-950 dark:text-red-50 shadow-md',
      iconColor: 'text-red-700 dark:text-red-300',
      iconDefault: (
        <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    panic: {
      container: 'bg-[var(--nf-clinical-panic,#dc2626)] text-white border-red-800 shadow-lg animate-pulse',
      iconColor: 'text-white',
      iconDefault: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  };

  const currentStyle = variantStyles[variant] || variantStyles.info;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      ref={ref}
      role={isAssertive ? 'alert' : 'region'}
      aria-live={resolvedAriaLive}
      className={`
        relative flex items-start gap-3 p-3.5 rounded-lg border text-xs leading-relaxed transition-all duration-150
        ${currentStyle.container}
        ${className}
      `.trim()}
      {...props}
    >
      {/* Alert Leading Icon */}
      <div className={`shrink-0 mt-0.5 ${currentStyle.iconColor}`} aria-hidden="true">
        {icon || currentStyle.iconDefault}
      </div>

      {/* Alert Content Body */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {effectiveTitle && (
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <span>{effectiveTitle}</span>
            {statusCode && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono">
                {`HTTP ${statusCode}`}
              </span>
            )}
          </div>
        )}

        {effectiveDetail && (
          <div className="text-xs opacity-95">
            {effectiveDetail}
          </div>
        )}

        {/* RFC 7807 Problem Instance & Correlation ID */}
        {correlationId && (
          <div className="mt-1 pt-1 border-t border-current/10 text-[11px] font-mono opacity-80 flex items-center gap-2">
            <span>Lineage ID:</span>
            <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded select-all">
              {correlationId}
            </code>
          </div>
        )}

        {/* Action Button Area */}
        {action && <div className="mt-2">{action}</div>}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          aria-label="Tutup Peringatan"
          onClick={handleDismiss}
          className="shrink-0 p-1 -mr-1 -mt-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default ClinicalAlert;
