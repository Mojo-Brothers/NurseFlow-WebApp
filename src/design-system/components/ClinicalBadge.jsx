/**
 * NurseFlow Enterprise HIS 2026 — ClinicalBadge Component
 * 
 * Medical-Grade Domain Badge Primitive
 * Standards: Speaks Clinical Domain Language (ESI, NEWS2, HAM, Panic Labs), Tabular Numerals ("tnum" 1), High Contrast.
 */

import React from 'react';

export const ClinicalBadge = React.forwardRef(function ClinicalBadge(
  {
    children,
    severity = 'routine', // 'routine' | 'info' | 'warning' | 'critical' | 'panic'
    clinicalType = 'general', // 'general' | 'esi' | 'news2' | 'high-alert-medication' | 'lab-critical' | 'allergy' | 'fall-risk' | 'code-blue'
    size = 'md', // 'sm' | 'md' | 'lg'
    isVitalsMono = false,
    icon = null,
    pulse = false,
    className = '',
    ...props
  },
  ref
) {
  // Base badge styling
  const baseStyles =
    'inline-flex items-center justify-center font-semibold select-none rounded-full transition-all duration-150 ease-out border tracking-tight';

  // Size scales
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.2 gap-1 min-h-[18px]',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 min-h-[22px]',
    lg: 'text-sm px-3.5 py-1 gap-2 min-h-[28px]'
  };

  // Severity styles mapping to canonical tokens
  const severityStyles = {
    routine:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    info:
      'bg-sky-50 dark:bg-sky-950/60 text-[var(--nf-brand-ocean,#015c80)] dark:text-sky-300 border-sky-200 dark:border-sky-800',
    warning:
      'bg-amber-50 dark:bg-amber-950/60 text-[var(--nf-clinical-warning,#d97706)] dark:text-amber-300 border-amber-300 dark:border-amber-700',
    critical:
      'bg-red-50 dark:bg-red-950/60 text-[var(--nf-clinical-panic,#dc2626)] dark:text-red-300 border-red-300 dark:border-red-700',
    panic:
      'bg-[var(--nf-clinical-panic,#dc2626)] text-white border-red-700 shadow-sm animate-pulse font-bold'
  };

  // Specialized Clinical Type styles
  const clinicalTypeStyles = {
    'high-alert-medication':
      'bg-gradient-to-r from-red-700 to-amber-700 text-white font-extrabold border-amber-400 shadow-md uppercase tracking-wider',
    'lab-critical':
      'bg-red-600 text-white border-red-800 shadow-[0_0_8px_rgba(220,38,38,0.5)] font-bold',
    'allergy':
      'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-400 font-bold',
    'fall-risk':
      'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 border-amber-400 font-bold',
    'code-blue':
      'bg-blue-600 text-white border-blue-800 font-extrabold uppercase animate-pulse shadow-md',
    'news2':
      'bg-slate-900 text-amber-300 border-amber-500 font-mono font-bold',
    'esi':
      'bg-slate-900 text-sky-300 border-sky-500 font-mono font-bold',
    'general': ''
  };

  // Determine if tabular numerals font should be active
  const useMonoNumerals =
    isVitalsMono || clinicalType === 'news2' || clinicalType === 'esi';

  return (
    <span
      ref={ref}
      className={`
        ${baseStyles}
        ${sizeStyles[size] || sizeStyles.md}
        ${clinicalType !== 'general' && clinicalTypeStyles[clinicalType]
          ? clinicalTypeStyles[clinicalType]
          : severityStyles[severity] || severityStyles.routine
        }
        ${pulse ? 'animate-pulse' : ''}
        ${useMonoNumerals ? 'font-vitals-mono font-feature-tnum' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {icon && <span className="inline-flex items-center shrink-0" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
});

export default ClinicalBadge;
