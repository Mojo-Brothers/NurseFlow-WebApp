/**
 * ConsultationResponseForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Jawaban Konsultasi Interdisiplin (Consultation Response)
 * Standar: JCI COP.2.1, SNARS Ed.2
 */

import React, { useState } from 'react';
import {
  Stethoscope, FileText, CheckCircle2, UserCheck, Activity, Pill
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function ConsultationResponseForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    responseDate: new Date().toISOString().slice(0, 10),
    responseTime: new Date().toTimeString().slice(0, 5),
    consultantDoctor: 'dr. Herman, Sp.P',
    specialty: 'Spesialis Paru (Sp.P)',
    findings: 'Pemeriksaan fisik pulmo: Gerak dada simetris, redup pada perkusi basal paru kanan. Auskultasi: suara napas vesikuler (+/-), rhonchi (-/-), wheezing (-/-). Foto Thorax: Efusi pleura dextra minimal di sudut kostofrenikus kanan.',
    impression: 'Minimal Right Pleural Effusion e.c Plasma Leakage (Dengue Hemorrhagic Fever)',
    recommendations: '1. Nebulisasi Pulmicort 1 resp / 12 jam jika ada sesak napas.\n2. Lanjutkan resusitasi cairan intravena sesuai protokol DHF DPJP Utama.\n3. Batasi asupan cairan oral berlebih, observasi tanda distress respirasi.\n4. Foto Thorax evaluasi 48 jam lagi atau jika sesak memberat.\n5. Tidak perlu punksi pleura saat ini (efusi minimal).',
    agreedCoManagement: true,
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
          author: formData.consultantDoctor,
          moduleName: 'JAWABAN KONSULTASI SPESIALIS',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Jawaban Konsultasi disimpan.');
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
          author: formData.consultantDoctor,
          moduleName: 'JAWABAN KONSULTASI SPESIALIS',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Jawaban Konsultasi berhasil ditandatangani oleh Dokter Konsulen!');
    } catch (err) {
      toast.error('Gagal memproses tanda tangan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Jawaban Konsultasi Interdisiplin (Consultation Response)"
      subtitle="JCI COP.2.1 | Specialist Consultation Answer"
      icon={Stethoscope}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Identitas Dokter Konsulen" subtitle="Consultant Identification" icon={UserCheck}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Dokter Konsulen</label>
            <input type="text" value={formData.consultantDoctor} onChange={e => updateField('consultantDoctor', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Spesialisasi</label>
            <input type="text" value={formData.specialty} onChange={e => updateField('specialty', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ClinicalSection>

      <ClinicalSection title="2. Hasil Evaluasi & Rekomendasi Konsulen" subtitle="Findings & Recommendations" icon={FileText}>
        <ClinicalFieldRow label="Temuan Pemeriksaan Konsulen">
          <textarea rows={3} value={formData.findings} onChange={e => updateField('findings', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Kesan / Diagnosis Konsulen">
          <input type="text" value={formData.impression} onChange={e => updateField('impression', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Saran & Tata Laksana Rekomendasi" required hint="Rekomendasi obat, tindakan, atau pemantauan khusus">
          <textarea rows={4} value={formData.recommendations} onChange={e => updateField('recommendations', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
