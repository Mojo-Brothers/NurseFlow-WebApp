/**
 * DischargeSummaryForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Resume Medis Pasien Pulang (Inpatient Discharge Summary)
 * Standar: JCI ACC.4.2, SNARS Ed.2, PMK 269/2008
 */

import React, { useState } from 'react';
import {
  FileText, CheckCircle2, Calendar, Pill, AlertTriangle,
  Stethoscope, Activity, UserCheck, Building2, Heart
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function DischargeSummaryForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    dischargeDate: new Date().toISOString().slice(0, 10),
    dischargeTime: new Date().toTimeString().slice(0, 5),
    lengthOfStay: '4 Hari',
    dischargeStatus: 'PERSETUJUAN_DPJP', // PERSETUJUAN_DPJP | PAPS | RUJUK_KELUAR | MENINGGAL

    primaryDiagnosis: 'Dengue Hemorrhagic Fever (DHF) Grade I',
    primaryIcd10: 'A91',
    secondaryDiagnosis: 'Gastritis Akut, Dehidrasi Ringan-Sedang',
    secondaryIcd10: 'K29.1, E86',
    proceduresPerformed: 'Pemasangan IVFD, Pemantauan Seri DPL, Terapi Cairan Resusitasi',
    icd9Procedures: '99.18, 89.52',

    hospitalCourse: 'Pasien masuk tanggal 06/08/2026 dengan febris h-3, mual, dan nyeri epigastrium. Hasil DPL awal Trombosit 105.000. Selama perawatan diberikan terapi resusitasi cairan RL dan simtomatik. Pada hari perawatan ke-4 demam sudah turun (afebrik 24 jam), nafsu makan membaik, trombosit meningkat menjadi 165.000, hematokrit stabil 40%.',

    dischargeVitals: 'TD: 115/75 mmHg | HR: 78 x/mnt | S: 36.6 °C | SpO2: 99% | GCS: 15',
    dischargeCondition: 'MEMBAIK', // MEMBAIK | SEMBUH | BELUM_SEMBUH | MENINGGAL

    dischargeMedications: '1. Paracetamol 500 mg tab 3x1 p.r.n demam/nyeri (5 hari)\n2. Sucralfate syrup 3x1 cth (5 hari)\n3. Multivitamin B Complex 1x1 tab (10 hari)',
    followUpDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    followUpClinic: 'Poliklinik Penyakit Dalam',
    homeInstructions: 'Banyak minum air putih (minimal 2.5 Liter/hari), istirahat cukup di rumah, hindari makanan pedas/asam.',
    emergencyWarningSigns: 'Segera kembali ke IGD apabila: Demam naik kembali > 38.5°C, muntah terus menerus, nyeri perut hebat, atau timbul perdarahan (gusi/mimisan/BAB hitam).',
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
          author: encounter?.doctor_name || 'DPJP Utama',
          moduleName: 'RESUME MEDIS RAWAT INAP',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Resume Medis disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (!formData.primaryDiagnosis) {
      toast.error('Diagnosis Utama Pulang wajib diisi!');
      return;
    }
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: encounter?.doctor_name || 'DPJP Utama',
          moduleName: 'RESUME MEDIS RAWAT INAP',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Resume Medis Rawat Inap berhasil ditandatangani oleh DPJP!');
    } catch (err) {
      toast.error('Gagal memproses tanda tangan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Resume Medis Pasien Pulang (Discharge Summary)"
      subtitle="JCI ACC.4.2 | Official Medical Discharge Record"
      icon={FileText}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Diagnosis Akhir & Prosedur Medis" subtitle="Final Diagnoses (ICD-10) & Procedures (ICD-9-CM)" icon={Stethoscope}>
        <ClinicalFieldRow label="Diagnosis Utama (Primary Diagnosis)" required hint="Diagnosis penyebab utama rawat inap">
          <input type="text" value={formData.primaryDiagnosis} onChange={e => updateField('primaryDiagnosis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Kode ICD-10 Utama">
          <input type="text" value={formData.primaryIcd10} onChange={e => updateField('primaryIcd10', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Diagnosis Sekunder / Komorbiditas">
          <textarea rows={2} value={formData.secondaryDiagnosis} onChange={e => updateField('secondaryDiagnosis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Kode ICD-10 Sekunder">
          <input type="text" value={formData.secondaryIcd10} onChange={e => updateField('secondaryIcd10', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Prosedur / Operasi yang Dilakukan (ICD-9-CM)">
          <textarea rows={2} value={formData.proceduresPerformed} onChange={e => updateField('proceduresPerformed', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="2. Ringkasan Perjalanan Penyakit (Hospital Course)" subtitle="Clinical Course & Diagnostic Findings Summary" icon={Activity}>
        <ClinicalFieldRow label="Ringkasan Perjalanan Penyakit & Terapi">
          <textarea rows={4} value={formData.hospitalCourse} onChange={e => updateField('hospitalCourse', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Tanda Vital & Kondisi Saat Pulang">
          <input type="text" value={formData.dischargeVitals} onChange={e => updateField('dischargeVitals', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="3. Instruksi Pulang & Obat Dibawa Pulang" subtitle="Discharge Medications & Follow-up Plan" icon={Pill}>
        <ClinicalFieldRow label="Obat-obatan Dibawa Pulang">
          <textarea rows={3} value={formData.dischargeMedications} onChange={e => updateField('dischargeMedications', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tanggal Kontrol Ulang</label>
            <input type="date" value={formData.followUpDate} onChange={e => updateField('followUpDate', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Klinik Kontrol Ulang</label>
            <input type="text" value={formData.followUpClinic} onChange={e => updateField('followUpClinic', e.target.value)} className={fieldClass} />
          </div>
        </div>

        <ClinicalFieldRow label="Petunjuk Diet & Aktivitas di Rumah">
          <textarea rows={2} value={formData.homeInstructions} onChange={e => updateField('homeInstructions', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Tanda Bahaya (Kapan Harus Segera ke IGD)">
          <textarea rows={2} value={formData.emergencyWarningSigns} onChange={e => updateField('emergencyWarningSigns', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
