/**
 * NursingHandoverForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Serah Terima Shift Keperawatan (Handover SBAR)
 * Standar: JCI IPSG.2 (Effective Communication), SNARS Ed.2
 */

import React, { useState } from 'react';
import {
  LogOut, Clock, User, ShieldCheck, CheckCircle2,
  FileText, Activity, AlertTriangle, ArrowRight, CornerDownRight
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function NursingHandoverForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    outgoingShift: 'PAGI',
    incomingShift: 'SIANG',
    outgoingNurse: 'Ns. Sarah, S.Kep (Shift Pagi)',
    incomingNurse: 'Ns. Rini, S.Kep (Shift Siang)',
    handoverTime: new Date().toTimeString().slice(0, 5),

    // SBAR
    situation: `Pasien ${patient?.name || 'Tn. Patient'} (${patient?.mrn || '009944'}), Kamar ${encounter?.room || 'Mawar 302/B'}, DPJP: ${encounter?.doctor_name || 'dr. Alexander, Sp.PD'}. Diagnosis: ${encounter?.chief_complaint || 'Febris h-3 e.c Suspek Dengue Fever'}.`,
    background: 'Pasien masuk via IGD tanggal 06/08/2026. Keluhan awal demam tinggi dan mual. Riwayat alergi obat (-). Sudah terpasang IVFD RL 20 tpm pada tangan kiri sejak tanggal 06/08.',
    assessment: `TTV Terakhir: TD 110/70, HR 84x/m, Temp 37.4°C, SpO2 99%. EWS Skor: 0 (Hijau - Stabil). Skala Braden: 17 (Risiko Ringan). Nyeri: Skor 2 (Ringan). Akses IV baik, tidak ada flebitis.`,
    recommendation: '1. Lanjutkan observasi TTV & EWS tiap 4 jam.\n2. Cek DPL ulang pukul 16.00 (Trombosit & Hematokrit).\n3. Berikan Paracetamol 500mg PO jika suhu > 37.5°C.\n4. Pertahankan tirah baring dan asupan cairan oral 2 Liter/hari.',

    devicesAttached: 'IV Catheter 20G Tangan Kiri (Tgl 06/08)',
    criticalAlerts: 'Waspadai penurunan trombosit seri jam 16.00 dan tanda perdarahan spontan (petekie/epistaksis).',
    isVerifiedByIncoming: true,
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (formState === 'empty') setFormState('in_progress');
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: formData.outgoingNurse,
          moduleName: 'HANDOVER KEPERAWATAN (SBAR)',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Handover SBAR disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: formData.outgoingNurse,
          moduleName: 'HANDOVER KEPERAWATAN (SBAR)',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Handover SBAR berhasil disahkan oleh kedua perawat!');
    } catch (err) {
      toast.error('Gagal memproses pengesahan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Serah Terima Shift Keperawatan (Handover SBAR)"
      subtitle="JCI IPSG.2 | Communication Safety"
      icon={LogOut}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Informasi Shift & Perawat Serah Terima" subtitle="Shift Transfer Identification" icon={Clock}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Perawat Shift Serah (Outgoing Nurse)</label>
            <input type="text" value={formData.outgoingNurse} onChange={e => updateField('outgoingNurse', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Perawat Shift Terima (Incoming Nurse)</label>
            <input type="text" value={formData.incomingNurse} onChange={e => updateField('incomingNurse', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ClinicalSection>

      <ClinicalSection title="2. Komunikasi SBAR (Situation, Background, Assessment, Recommendation)" subtitle="Structured SBAR Communication Protocol" icon={FileText}>
        <ClinicalFieldRow label="S — Situation (Situasi Saat Ini)">
          <textarea rows={2} value={formData.situation} onChange={e => updateField('situation', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="B — Background (Latar Belakang Klinis)">
          <textarea rows={2} value={formData.background} onChange={e => updateField('background', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="A — Assessment (Asesmen Kondisi Terakhir)">
          <textarea rows={3} value={formData.assessment} onChange={e => updateField('assessment', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="R — Recommendation (Rekomendasi Shift Selanjutnya)">
          <textarea rows={3} value={formData.recommendation} onChange={e => updateField('recommendation', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="3. Peralatan Terpasang & Hal Kritis (Critical Alerts)" subtitle="Devices & High Risk Warnings" icon={AlertTriangle}>
        <ClinicalFieldRow label="Alat Terpasang pada Pasien">
          <input type="text" value={formData.devicesAttached} onChange={e => updateField('devicesAttached', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Peringatan Kritis (Critical Alerts / Warning Signs)">
          <textarea rows={2} value={formData.criticalAlerts} onChange={e => updateField('criticalAlerts', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
