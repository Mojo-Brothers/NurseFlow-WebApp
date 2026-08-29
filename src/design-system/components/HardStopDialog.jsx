/**
 * NurseFlow Enterprise HIS 2026 — HardStopDialog Component
 * 
 * Safety-Class Clinical Intervention Primitive
 * Standards:
 * - Authoritative Z-Index 9999 (Highest Tier in HIS Stacking Order)
 * - Strict Anti-Accidental Dismissal (Backdrop Click & Escape Strictly Blocked)
 * - Patient Identity Context Snapshot Banner
 * - Mandatory Clinical Risk Acknowledgment Checkbox
 * - Mandatory Justification / Clinical Reason Entry for WORM E5-F Audit Trail
 * - Optional Typed Confirmation String for Catastrophic Overrides
 */

import React, { useState, useEffect, useId } from 'react';
import { ClinicalButton } from './ClinicalButton.jsx';
import { ClinicalCheckbox } from './ClinicalCheckbox.jsx';
import { ClinicalInput } from './ClinicalInput.jsx';
import { createSafetyDecision } from '../../core/safetyDecision.js';

export const HardStopDialog = React.forwardRef(function HardStopDialog(
  {
    isOpen = false,
    title = 'PERINGATAN KESELAMATAN KLINIS: HARD-STOP INTERVENTION',
    actionName = 'Tindakan Berisiko Tinggi',
    riskLevel = 'critical', // 'high' | 'critical' | 'catastrophic'
    warningDetails,
    patientContext = null, // { name, mrn, room, encounterId }
    acknowledgmentText = 'Saya menyatakan telah memverifikasi identitas pasien dan memahami risiko klinis tindakan ini.',
    requireJustification = true,
    justificationPlaceholder = 'Masukkan alasan klinis / justifikasi medis tertulis...',
    requiredTypedPhrase = null, // e.g. 'OVERRIDE' or 'BATALKAN'
    correlationId = null,
    targetPayload = null,
    onConfirm,
    onCancel,
    className = '',
    ...props
  },
  ref
) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [justification, setJustification] = useState('');
  const [typedPhrase, setTypedPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatedId = useId();
  const titleId = `${generatedId}-hardstop-title`;
  const descId = `${generatedId}-hardstop-desc`;

  // Reset internal state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setAcknowledged(false);
      setJustification('');
      setTypedPhrase('');
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Strict Safety Policy: Block Escape key from accidentally dismissing hard-stop
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  // Validation rules for unlocking confirmation
  const isAcknowledgmentValid = acknowledged;
  const isJustificationValid = !requireJustification || justification.trim().length >= 5;
  const isTypedPhraseValid = !requiredTypedPhrase || typedPhrase.trim() === requiredTypedPhrase.trim();

  const isConfirmReady = isAcknowledgmentValid && isJustificationValid && isTypedPhraseValid && !isSubmitting;

  const handleConfirmAction = async () => {
    if (!isConfirmReady) return;
    setIsSubmitting(true);
    try {
      if (onConfirm) {
        const decision = createSafetyDecision({
          patientId: patientContext?.mrn || patientContext?.id || patientContext?.patientId || 'PAT-DEMO',
          encounterId: patientContext?.encounterId || 'ENC-DEMO',
          actorId: patientContext?.actorId || 'CURRENT_USER',
          action: actionName || 'CLINICAL_ACTION',
          riskType: riskLevel === 'critical' ? 'CRITICAL_OVERRIDE' : 'DESTRUCTIVE_ACTION',
          justification: justification.trim() || 'Dikonfirmasi secara klinis oleh staf medis',
          acknowledgment: true,
          targetPayload,
          typedConfirmation: typedPhrase ? typedPhrase.trim() : null,
          correlationId: correlationId || `HARDSTOP-${Date.now()}`
        });

        await onConfirm({
          justification: justification.trim(),
          acknowledged: true,
          patientContext,
          safetyDecision: decision,
          correlationId: decision.correlationId,
          timestamp: decision.createdAt
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[var(--nf-z-safety-hard-stop-modal,9999)] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn select-none"
    >
      {/* Hard Stop Dialog Window */}
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`
          relative w-full max-w-xl
          bg-[var(--nf-surface-card,#ffffff)] dark:bg-slate-900
          border-2 border-[var(--nf-clinical-panic,#dc2626)]
          rounded-xl shadow-[0_25px_50px_-12px_rgba(220,38,38,0.35)]
          overflow-hidden flex flex-col
          ${className}
        `.trim()}
        {...props}
      >
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-700 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-white/20 rounded-md animate-pulse">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <h2 id={titleId} className="text-sm font-black tracking-wide uppercase">
                {title}
              </h2>
              <span className="text-[11px] font-medium text-red-100">
                Aksi: <strong className="text-white underline">{actionName}</strong>
              </span>
            </div>
          </div>

          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-black/30 border border-white/20 uppercase tracking-wider">
            LEVEL: {riskLevel}
          </span>
        </div>

        {/* Patient Identity Snapshot Banner */}
        {patientContext && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 px-5 py-2.5 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-3 font-semibold">
              <span>Pasien: <strong className="text-slate-900 dark:text-white">{patientContext.name}</strong></span>
              <span>No. RM: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono font-bold">{patientContext.mrn}</code></span>
            </div>
            {patientContext.room && (
              <span className="text-[11px] font-medium">Ruang: {patientContext.room}</span>
            )}
          </div>
        )}

        {/* Warning Body Content */}
        <div id={descId} className="p-5 flex flex-col gap-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
          {/* Clinical Hazard Notice */}
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-900 dark:text-red-200 font-medium">
            {warningDetails}
          </div>

          {/* Mandatory Written Justification */}
          {requireJustification && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`${generatedId}-justification`} className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Alasan Klinis / Justifikasi Medis Wajib:</span>
                <span className="text-[11px] font-normal text-slate-500">Min. 5 karakter</span>
              </label>
              <textarea
                id={`${generatedId}-justification`}
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={justificationPlaceholder}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
            </div>
          )}

          {/* Optional Typed Confirmation Phrase */}
          {requiredTypedPhrase && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg flex flex-col gap-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Ketik <code className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">{requiredTypedPhrase}</code> untuk membuka konfirmasi:
              </span>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                placeholder={`Ketik "${requiredTypedPhrase}" di sini`}
                className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {/* Mandatory Acknowledgment Checkbox */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <ClinicalCheckbox
              id={`${generatedId}-ack`}
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              label={acknowledgmentText}
              required
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <ClinicalButton
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batalkan Tindakan (Aman)
          </ClinicalButton>

          <ClinicalButton
            variant="destructive"
            onClick={handleConfirmAction}
            disabled={!isConfirmReady}
            loading={isSubmitting}
            loadingText="Memverifikasi & Menjalankan..."
          >
            Konfirmasi & Eksekusi Intervensi
          </ClinicalButton>
        </div>
      </div>
    </div>
  );
});

export default HardStopDialog;
