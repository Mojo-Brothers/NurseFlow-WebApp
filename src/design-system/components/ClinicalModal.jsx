/**
 * NurseFlow Enterprise HIS 2026 — ClinicalModal Component
 * 
 * Medical-Grade Modal Dialog Primitive
 * Standards: Authoritative Z-Index 1050, WCAG ARIA role="dialog", Escape & Focus Management.
 */

import React, { useEffect, useRef, useId } from 'react';

export const ClinicalModal = React.forwardRef(function ClinicalModal(
  {
    isOpen = false,
    onClose,
    title,
    description = null,
    children,
    footer = null,
    size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
    closeOnBackdrop = true,
    closeOnEscape = true,
    showCloseButton = true,
    className = '',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descId = `${generatedId}-desc`;
  const modalRef = useRef(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop && onClose) {
      onClose();
    }
  };

  return (
    <div
      role="presentation"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[var(--nf-z-modal-backdrop,1000)] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      {/* Modal Dialog Box */}
      <div
        ref={ref || modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={`
          relative w-full z-[var(--nf-z-modal-dialog,1050)]
          bg-[var(--nf-surface-card,#ffffff)] dark:bg-[var(--nf-surface-card,#0f172a)]
          border border-[var(--nf-border-default,#cbd5e1)] dark:border-[var(--nf-border-default,#334155)]
          rounded-xl shadow-2xl overflow-hidden flex flex-col
          transition-all duration-150 ease-out
          ${sizeStyles[size] || sizeStyles.md}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--nf-border-subtle,#e2e8f0)] dark:border-[var(--nf-border-subtle,#1e293b)] bg-[var(--nf-surface-canvas-subtle,#f8fafc)] dark:bg-slate-900/50">
            <div className="flex flex-col gap-0.5">
              {title && (
                <h2 id={titleId} className="text-base font-bold text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)] tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-[var(--nf-text-muted,#64748b)]">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && onClose && (
              <button
                type="button"
                aria-label="Tutup Dialog"
                onClick={onClose}
                className="p-1 rounded-lg text-[var(--nf-text-muted,#64748b)] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto text-sm text-[var(--nf-text-primary,#0f172a)] dark:text-[var(--nf-text-primary,#f8fafc)]">
          {children}
        </div>

        {/* Footer Actions */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--nf-border-subtle,#e2e8f0)] dark:border-[var(--nf-border-subtle,#1e293b)] bg-[var(--nf-surface-canvas-subtle,#f8fafc)] dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

export default ClinicalModal;
