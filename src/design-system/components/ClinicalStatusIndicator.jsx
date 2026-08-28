/**
 * NurseFlow Enterprise HIS 2026 — ClinicalStatusIndicator Component
 * 
 * Medical-Grade Telemetry & System Status Primitive
 * Standards: WCAG 1.4.1 Non-Color Reliance (Shape + Icon + Text Signal), Live Telemetry Pulse.
 */

import React from 'react';

export const ClinicalStatusIndicator = React.forwardRef(function ClinicalStatusIndicator(
  {
    status = 'stable', // 'stable' | 'monitoring' | 'degraded' | 'warning' | 'critical' | 'offline' | 'unknown'
    label = null,
    showIcon = true,
    size = 'md', // 'sm' | 'md' | 'lg'
    pulse = false,
    className = '',
    ...props
  },
  ref
) {
  // Status definitions with distinct shape, color, and symbolic icon
  const statusConfigs = {
    stable: {
      color: 'bg-[var(--nf-clinical-normal,#059669)] text-white',
      border: 'border-emerald-600',
      text: 'text-emerald-700 dark:text-emerald-300',
      labelDefault: 'Stabil',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    monitoring: {
      color: 'bg-sky-500 text-white',
      border: 'border-sky-600',
      text: 'text-sky-700 dark:text-sky-300',
      labelDefault: 'Monitoring Aktif',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    degraded: {
      color: 'bg-orange-500 text-white',
      border: 'border-orange-600',
      text: 'text-orange-700 dark:text-orange-300',
      labelDefault: 'Degradasi',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )
    },
    warning: {
      color: 'bg-[var(--nf-clinical-warning,#d97706)] text-white',
      border: 'border-amber-600',
      text: 'text-amber-700 dark:text-amber-300',
      labelDefault: 'Peringatan',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01" />
        </svg>
      )
    },
    critical: {
      color: 'bg-[var(--nf-clinical-panic,#dc2626)] text-white',
      border: 'border-red-700',
      text: 'text-red-700 dark:text-red-300',
      labelDefault: 'Kritis / Bahaya',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    offline: {
      color: 'bg-slate-400 dark:bg-slate-600 text-white',
      border: 'border-slate-500',
      text: 'text-slate-600 dark:text-slate-400',
      labelDefault: 'Terputus (Offline)',
      icon: (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    unknown: {
      color: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-600',
      text: 'text-slate-500 dark:text-slate-400',
      labelDefault: 'Tidak Diketahui',
      icon: (
        <span className="text-[9px] font-bold">?</span>
      )
    }
  };

  const currentConfig = statusConfigs[status] || statusConfigs.unknown;
  const displayLabel = label !== null ? label : currentConfig.labelDefault;

  // Size scale
  const sizeStyles = {
    sm: 'text-xs gap-1.5',
    md: 'text-xs gap-2',
    lg: 'text-sm gap-2.5'
  };

  const badgeSizeStyles = {
    sm: 'w-4 h-4 text-[9px]',
    md: 'w-5 h-5 text-[10px]',
    lg: 'w-6 h-6 text-xs'
  };

  return (
    <div
      ref={ref}
      role="status"
      aria-label={`Status: ${displayLabel}`}
      className={`inline-flex items-center select-none font-medium ${sizeStyles[size] || sizeStyles.md} ${className}`.trim()}
      {...props}
    >
      {/* Symbolic Glyph Indicator (Shape + Icon) */}
      <span
        className={`
          inline-flex items-center justify-center rounded-full shrink-0 shadow-sm border
          ${badgeSizeStyles[size] || badgeSizeStyles.md}
          ${currentConfig.color}
          ${currentConfig.border}
          ${pulse || status === 'critical' ? 'animate-pulse' : ''}
        `.trim()}
        aria-hidden="true"
      >
        {showIcon && currentConfig.icon}
      </span>

      {/* Text Label */}
      {displayLabel && (
        <span className={`font-semibold tracking-tight ${currentConfig.text}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
});

export default ClinicalStatusIndicator;
