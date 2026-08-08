/**
 * ReferralLetterForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Surat Rujukan Keluar RS (External Medical Referral Letter)
 * Standar: JCI ACC.3.1, SNARS Ed.2, PMK 269/2008
 */

import React, { useState } from 'react';
import {
  LogOut, Building2, Stethoscope, FileText, Activity,
  AlertTriangle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function ReferralLetterForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    referralDate: new Date().toISOString().slice(0, 10),
    referralTime: new Date().toTimeString().slice(0, 5),
    targetHospital: 'RSUP Dr. Sardjito Yogyakarta',
    targetDepartment: 'Pusat Jantung Terpadu / ICU Kardiovaskular',
    referralReason: 'FACILITY_LIMITATION', // FACILITY_LIMITATION | SPECIALIST_REQUEST | PATIENT_REQUEST
    referralReasonDetails: 'Memerlukan tindakan Cathlab Cito dan perawatan Intensive Care Unit (ICU Kardiovaskular) yang tidak tersedia di RS ini.',

    primaryDiagnosis: 'Acute ST-Segment Elevation Myocardial Infarction (STEMI) Anteroseptal',
    icd10Code: 'I21.0',
    clinicalSummary: 'Pasien datang dengan nyeri dada khas angina pectoris sejak 3 jam SBRS. EKG menunjukkan ST Elevasi V1-V4. Sudah diberikan Loading Aspilet 320mg, Clopidogrel 300mg, Isosorbid Dinitrat 5mg SL, dan Injeksi Heparin 5000 IU.',
    currentVitals: 'TD: 100/65 mmHg | HR: 96 x/mnt | RR: 22 x/mnt | S: 36.5 °C | SpO2: 97% (Nasal Canula 3 Lpm)',

    transportRequirements: 'Ambulans Advanced Life Support (ALS) dengan pendampingan Dokter & Perawat. Terpasang Oksigen Nasal Canula 3 Lpm dan Infus RL 20 tpm.',
    referringDoctor: encounter?.doctor_name || 'dr. Alexander, Sp.PD',
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
          moduleName: 'SURAT RUJUKAN KELUAR',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Surat Rujukan disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (!formData.targetHospital || !formData.primaryDiagnosis) {
      toast.error('RS Tujuan dan Diagnosis Utama wajib diisi!');
      return;
    }
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: formData.referringDoctor,
          moduleName: 'SURAT RUJUKAN KELUAR',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Surat Rujukan Keluar berhasil ditandatangani & difinalkan!');
    } catch (err) {
      toast.error('Gagal memproses surat rujukan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Surat Rujukan Keluar RS (External Referral Letter)"
      subtitle="JCI ACC.3.1 | Transfer of Patient Care"
      icon={LogOut}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Rumah Sakit & Spesialis Tujuan" subtitle="Target Healthcare Facility" icon={Building2}>
        <ClinicalFieldRow label="Rumah Sakit / Faskes Tujuan" required>
          <input type="text" value={formData.targetHospital} onChange={e => updateField('targetHospital', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Poli / Unit Tujuan">
          <input type="text" value={formData.targetDepartment} onChange={e => updateField('targetDepartment', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Alasan Utama Rujukan">
          <select value={formData.referralReason} onChange={e => updateField('referralReason', e.target.value)} className={fieldClass}>
            <option value="FACILITY_LIMITATION">Keterbatasan Fasilitas / Alkes / Bed RS</option>
            <option value="SPECIALIST_REQUEST">Memerlukan Penanganan Subspesialis Khusus</option>
            <option value="PATIENT_REQUEST">Permintaan Pasien / Keluarga (PAPS)</option>
          </select>
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Rincian Alasan Rujukan">
          <textarea rows={2} value={formData.referralReasonDetails} onChange={e => updateField('referralReasonDetails', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="2. Ringkasan Kondisi Medis & Terapi yang Diberikan" subtitle="Medical Summary & Emergency Treatments Given" icon={FileText}>
        <ClinicalFieldRow label="Diagnosis Utama (ICD-10)" required>
          <input type="text" value={formData.primaryDiagnosis} onChange={e => updateField('primaryDiagnosis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Ringkasan Perjalanan Penyakit & Terapi">
          <textarea rows={3} value={formData.clinicalSummary} onChange={e => updateField('clinicalSummary', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Tanda-Tanda Vital Terakhir Saat Dirujuk">
          <input type="text" value={formData.currentVitals} onChange={e => updateField('currentVitals', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Instruksi & Kebutuhan Transportasi Ambulans">
          <textarea rows={2} value={formData.transportRequirements} onChange={e => updateField('transportRequirements', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
