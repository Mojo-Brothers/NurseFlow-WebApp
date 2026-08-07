import React from 'react';

/**
 * StatusBadge - Komponen Lencana Status Semantik Terstandar NurseFlow HIS 2026
 * Variant: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral'
 */
export default function StatusBadge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon: Icon,
  className = '' 
}) {
  const variantStyles = {
    primary: 'bg-[#007399]/10 text-[#007399] dark:text-cyan-300 border-[#007399]/25',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]',
    lg: 'px-3 py-1 text-xs'
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 font-extrabold uppercase tracking-wider rounded-full border shadow-2xs ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
    >
      {Icon && <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />}
      <span>{children}</span>
    </span>
  );
}
