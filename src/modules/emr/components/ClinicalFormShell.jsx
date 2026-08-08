/**
 * ClinicalFormShell.jsx
 * ─────────────────────────────────────────────────────────────
 * Reusable shell wrapper untuk semua form klinis EMR NurseFlow.
 * Menyediakan: sticky action bar, form state, auto-save indicator.
 *
 * Usage:
 *   import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow }
 *   from '../components/ClinicalFormShell';
 */

import React from 'react';
import {
  Save, PenTool, Printer, X, AlertTriangle, CheckCircle2,
  Clock, FileEdit, Info, Loader2, ChevronRight
} from 'lucide-react';

// ─── Form State Config ───────────────────────────────────────
const FORM_STATE_CONFIG = {
  empty: { label: 'KOSONG', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', icon: Info },
  draft: { label: 'DRAF', color: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400', icon: FileEdit },
  in_progress: { label: 'DALAM PENGISIAN', color: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500 animate-pulse', icon: FileEdit },
  saved: { label: 'TERSIMPAN', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  pending_signature: { label: 'MENUNGGU TTD', color: 'bg-violet-50 text-violet-600 border-violet-200', dot: 'bg-violet-500 animate-pulse', icon: PenTool },
  signed: { label: 'DITANDATANGANI', color: 'bg-teal-50 text-teal-600 border-teal-200', dot: 'bg-teal-500', icon: CheckCircle2 },
  amended: { label: 'DIAMANDEMEN', color: 'bg-orange-50 text-orange-600 border-orange-200', dot: 'bg-orange-500', icon: AlertTriangle },
  cancelled: { label: 'DIBATALKAN', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500', icon: X },
};

// ─── Auto-save Indicator ─────────────────────────────────────
function AutoSaveIndicator({ isSaving, lastSavedAt, isDirty }) {
  if (isSaving) return (
    <div className="flex items-center gap-1.5 text-[var(--on-surface-variant)]/70">
      <Loader2 size={12} className="animate-spin text-[var(--primary)]" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Menyimpan...</span>
    </div>
  );
  if (isDirty) return (
    <div className="flex items-center gap-1.5 text-amber-600">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Perubahan Belum Disimpan</span>
    </div>
  );
  if (lastSavedAt) return (
    <div className="flex items-center gap-1.5 text-emerald-600">
      <CheckCircle2 size={11} />
      <span className="text-[10px] font-bold uppercase tracking-widest">Tersimpan {lastSavedAt}</span>
    </div>
  );
  return null;
}

// ─── Form State Badge ─────────────────────────────────────────
function FormStateBadge({ state }) {
  const config = FORM_STATE_CONFIG[state] || FORM_STATE_CONFIG.empty;
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${config.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon size={10} />
      {config.label}
    </div>
  );
}

// ─── Clinical Section ─────────────────────────────────────────
export function ClinicalSection({ title, subtitle, icon: Icon, children, className = '', collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={`bg-[var(--surface-container-lowest)] rounded-2xl border border-[var(--outline-variant)]/30 overflow-hidden shadow-sm ${className}`}>
      <div
        className={`flex items-center justify-between px-5 py-3.5 bg-[var(--surface-container-high)] border-b border-[var(--outline-variant)]/20 ${collapsible ? 'cursor-pointer select-none hover:bg-[var(--outline-variant)]/20 transition-colors' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={15} className="text-[var(--primary)] shrink-0" />}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[var(--on-surface)]">{title}</h3>
            {subtitle && <p className="text-[9px] font-bold text-[var(--on-surface-variant)]/60 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {collapsible && (
          <ChevronRight size={14} className={`text-[var(--on-surface-variant)] transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        )}
      </div>
      {(!collapsible || open) && <div className="p-5">{children}</div>}
    </div>
  );
}

// ─── Clinical Sub-Section ─────────────────────────────────────
export function ClinicalSubSection({ title, children, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-[var(--primary)] opacity-60" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)]">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ─── Field Row (label + input, 2-col on desktop) ──────────────
export function ClinicalFieldRow({ label, required, hint, children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start py-2.5 border-b border-[var(--outline-variant)]/10 last:border-0 ${className}`}>
      <div className="md:col-span-1 pt-1">
        <label className="text-[11px] font-bold text-[var(--on-surface-variant)] flex items-start gap-1">
          {label}
          {required && <span className="text-red-500 font-black leading-none">*</span>}
        </label>
        {hint && <p className="text-[9px] text-[var(--on-surface-variant)]/50 mt-0.5 font-medium">{hint}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

// ─── MAIN SHELL COMPONENT ─────────────────────────────────────
export default function ClinicalFormShell({
  title,
  subtitle,
  icon: Icon,
  formState = 'empty',
  lastSavedAt,
  isSaving = false,
  isDirty = false,
  onSaveDraft,
  onSign,
  onPrint,
  onCancel,
  onAmend,
  canSign = true,
  canAmend = false,
  children,
  className = '',
  hideActionBar = false,
}) {
  const isSigned = formState === 'signed';
  const isCancelled = formState === 'cancelled';

  return (
    <div className={`flex flex-col h-full min-h-0 overflow-hidden relative bg-[var(--surface-container-lowest)] ${className}`}>
      {/* ── Form Header ── */}
      <div className="shrink-0 flex items-start justify-between px-6 py-4 border-b border-[var(--outline-variant)]/20 bg-[var(--surface-container-lowest)] z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-[var(--primary)]" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-black text-[var(--on-surface)] uppercase tracking-tight">{title}</h2>
            {subtitle && <p className="text-[10px] font-bold text-[var(--on-surface-variant)]/60 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} isDirty={isDirty} />
          <FormStateBadge state={formState} />
        </div>
      </div>

      {/* ── Form Body (Scrollable) ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 min-h-0">
        {children}
      </div>

      {/* ── Bottom Action Bar (Fixed at bottom) ── */}
      {!hideActionBar && (
        <div className="shrink-0 bg-[var(--surface-container-lowest)] border-t border-[var(--outline-variant)]/30 px-6 py-3 flex items-center justify-between gap-3 z-20 shadow-lg">
          <div className="flex items-center gap-2">
            {onCancel && !isSigned && (
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] rounded-xl transition-colors border border-[var(--outline-variant)]/30"
              >
                <X size={13} /> Batal
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onPrint && (isSigned || formState === 'saved') && (
              <button onClick={onPrint} className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] rounded-xl transition-all border border-[var(--outline-variant)]/30">
                <Printer size={13} /> Cetak
              </button>
            )}
            {onAmend && canAmend && isSigned && (
              <button onClick={onAmend} className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-orange-200">
                <FileEdit size={13} /> Amandemen
              </button>
            )}
            {onSaveDraft && !isSigned && !isCancelled && (
              <button onClick={onSaveDraft} disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] rounded-xl transition-all border border-[var(--outline-variant)]/50 disabled:opacity-50">
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Simpan Draf
              </button>
            )}
            {onSign && !isSigned && !isCancelled && canSign && (
              <button onClick={onSign} disabled={isSaving} className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white bg-[var(--primary)] hover:opacity-90 rounded-xl transition-all shadow-md hover:shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50">
                <PenTool size={13} /> Tandatangani &amp; Finalkan
              </button>
            )}
            {isSigned && (
              <div className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 rounded-xl">
                <CheckCircle2 size={13} /> Dokumen Telah Ditandatangani
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
