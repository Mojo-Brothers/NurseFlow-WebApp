/**
 * ConsultationRequestForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Permintaan Konsultasi Interdisiplin DPJP (Interdisciplinary Consultation Request)
 * Standar: JCI COP.2.1, SNARS Ed.2
 */

import React, { useState } from 'react';
import {
  UserCheck, Stethoscope, Clock, FileText, Activity,
  AlertCircle, ShieldAlert, CheckCircle2
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function ConsultationRequestForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    requestDate: new Date().toISOString().slice(0, 10),
    requestTime: new Date().toTimeString().slice(0, 5),
    referringDoctor: encounter?.doctor_name || 'dr. Alexander, Sp.PD',
    consultantDoctor: '',
    targetSpecialty: 'Spesialis Paru (Sp.P)',
    consultationType: 'ROUTINE', // CITO | ROUTINE | CO_MANAGEMENT | TRANSFER_OF_CARE
    currentDiagnosis: encounter?.chief_complaint || 'Dengue Hemorrhagic Fever Grade I, Suspek Efusi Pleura Kanan',
    clinicalSummary: 'Pasien rawat inap hari ke-3 dengan DHF. Hari ini mengeluhkan sesak nafas ringan (RR 24x/mnt, SpO2 96% room air). Auskultasi pulmo: suara napas menurun di basal paru kanan.',
    consultationQuestion: 'Mohon evaluasi kemungkinan efusi pleura dextra ec plasma leakage dan saran tata laksana respirasi.',
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
          author: formData.referringDoctor,
          moduleName: 'PERMINTAAN KONSULTASI SPESIALIS',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Lembar Konsultasi disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (!formData.targetSpecialty || !formData.consultationQuestion) {
      toast.error('Spesialisasi tujuan dan pertanyaan konsul wajib diisi!');
      return;
    }
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: formData.referringDoctor,
          moduleName: 'PERMINTAAN KONSULTASI SPESIALIS',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Permintaan Konsultasi dikirim ke Dokter Konsulen!');
    } catch (err) {
      toast.error('Gagal mengirim konsultasi: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Permintaan Konsultasi Interdisiplin (Consultation Request)"
      subtitle="JCI COP.2.1 | Inter-Specialty Consultation"
      icon={UserCheck}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Dokter Pemohon & Spesialis Tujuan" subtitle="Consultation Parties Identification" icon={Stethoscope}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Dokter Pemohon (DPJP Utama)</label>
            <input type="text" value={formData.referringDoctor} onChange={e => updateField('referringDoctor', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Spesialisasi Tujuan Konsul <span className="text-red-500">*</span></label>
            <select value={formData.targetSpecialty} onChange={e => updateField('targetSpecialty', e.target.value)} className={fieldClass}>
              <option value="Spesialis Paru (Sp.P)">Spesialis Paru (Sp.P)</option>
              <option value="Spesialis Jantung (Sp.JP)">Spesialis Jantung &amp; Pembuluh Darah (Sp.JP)</option>
              <option value="Spesialis Anestesiologi (Sp.An)">Spesialis Anestesiologi (Sp.An)</option>
              <option value="Spesialis Bedah (Sp.B)">Spesialis Bedah (Sp.B)</option>
              <option value="Spesialis Saraf (Sp.N)">Spesialis Saraf (Sp.N)</option>
              <option value="Spesialis Gizi Klinik (Sp.GK)">Spesialis Gizi Klinik (Sp.GK)</option>
            </select>
          </div>
        </div>

        <ClinicalFieldRow label="Sifat Konsultasi">
          <select value={formData.consultationType} onChange={e => updateField('consultationType', e.target.value)} className={fieldClass}>
            <option value="ROUTINE">Rutin (Evaluasi dalam 24 jam)</option>
            <option value="CITO">CITO / EMERGENCY (Harap evaluasi segera &lt; 2 jam)</option>
            <option value="CO_MANAGEMENT">Rawat Bersama (Co-Management)</option>
            <option value="TRANSFER_OF_CARE">Alih Rawat Total (Transfer of Care)</option>
          </select>
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="2. Ikhtisar Klinis & Pertanyaan Konsultasi" subtitle="Clinical Summary & Specific Questions" icon={FileText}>
        <ClinicalFieldRow label="Diagnosis Kerja Saat Ini">
          <input type="text" value={formData.currentDiagnosis} onChange={e => updateField('currentDiagnosis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Ikhtisar Klinik Pasien">
          <textarea rows={3} value={formData.clinicalSummary} onChange={e => updateField('clinicalSummary', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Pertanyaan / Harapan Konsultasi" required hint="Pertanyaan spesifik yang ingin dijawab oleh dokter konsulen">
          <textarea rows={3} value={formData.consultationQuestion} onChange={e => updateField('consultationQuestion', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
