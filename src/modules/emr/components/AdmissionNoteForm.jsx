/**
 * AdmissionNoteForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Catatan Masuk Rawat Inap (Inpatient Admission Note)
 * Standar: JCI AOP.1.1, ACC.1, PMK 269/2008
 *
 * Mengakomodasi:
 *  1. Informasi Admisi & Asal Pasien
 *  2. Diagnosis Masuk & Alasan Dirawat
 *  3. Kondisi Klinis & Vital Signs Masuk
 *  4. Rencana Pengobatan Awal (Admitting Orders)
 *  5. Edukasi & Pengesahan DPJP
 */

import React, { useState } from 'react';
import {
  Building2, Activity, Stethoscope, Heart, Pill,
  AlertTriangle, CheckCircle2, UserCheck, Calendar, FileText
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function AdmissionNoteForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    // 1. Informas Admisi
    admissionDate: new Date().toISOString().slice(0, 10),
    admissionTime: new Date().toTimeString().slice(0, 5),
    admissionSource: 'EMERGENCY', // EMERGENCY | OUTPATIENT | DIRECT_TRANSFER | EXTERNAL_REFERRAL
    referralHospital: '',
    roomBedNumber: encounter?.room || 'Ruang Mawar 302 / Bed B',
    admittingPhysician: encounter?.doctor_name || 'dr. Alexander, Sp.PD',

    // 2. Diagnosis Masuk
    admittingDiagnosis: encounter?.chief_complaint || 'Febris Akut h-3 e.c Suspek Infeksi Virus / Dengue Fever',
    icd10Code: 'A90',
    reasonForAdmission: 'Memerlukan pemantauan ketat tanda vital, resusitasi cairan intravena, dan evaluasi hasil laboratorium berkala.',

    // 3. Vital Signs Admisi
    bpSystolic: encounter?.vitals?.bp?.split('/')?.[0] || '110',
    bpDiastolic: encounter?.vitals?.bp?.split('/')?.[1] || '70',
    heartRate: encounter?.vitals?.hr || '88',
    respiratoryRate: encounter?.vitals?.rr || '20',
    temperature: encounter?.vitals?.temp || '38.2',
    spo2: encounter?.vitals?.spo2 || '98',
    gcsTotal: '15 (E4V5M6)',

    // 4. Initial Admitting Orders
    dietOrder: 'DIET_LUNAK_NRS', // DIET_BIASA | DIET_LUNAK | DIET_CAIR | NPO
    activityOrder: 'BEDREST', // BEDREST | MOBILISASI_BERTAHAP | MANDIRI
    ivFluidOrder: 'IVFD Ringer Lactate 500 mL / 8 jam (20 TPM Makro)',
    initialMedications: '1. Paracetamol 1 gram IV p.r.n Suhu > 38°C\n2. Ondansetron 4 mg IV p.r.n Mual\n3. Omeprazole 40 mg IV / 12 jam',

    // 5. Special Orders & Safety
    isolationRequired: 'NONE', // NONE | AIRBORNE | DROPLET | CONTACT
    fallRiskLevel: 'MEDIUM',
    specialInstructions: 'Cek DPL ulang 12 jam lagi. Laporkan jika Trombosit < 100.000 atau timbul tanda perdarahan.',
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
          author: encounter?.doctor_name || 'Dokter Admisi',
          moduleName: 'CATATAN ADMISI RAWAT INAP',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Catatan Admisi disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (!formData.admittingDiagnosis) {
      toast.error('Diagnosis Masuk wajib diisi!');
      return;
    }
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: encounter?.doctor_name || 'Dokter Admisi',
          moduleName: 'CATATAN ADMISI RAWAT INAP',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Catatan Admisi Rawat Inap berhasil ditandatangani!');
    } catch (err) {
      toast.error('Gagal memproses tanda tangan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Catatan Admisi Rawat Inap (Admission Note)"
      subtitle="JCI AOP.1.1 | ACC.1 | PMK 269/2008"
      icon={Building2}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      {/* 1. Informasi Admisi */}
      <ClinicalSection title="1. Informasi Admisi & Unit Perawatan" subtitle="Admission Demographics & Room Assignment" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tanggal Masuk</label>
            <input type="date" value={formData.admissionDate} onChange={e => updateField('admissionDate', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Jam Masuk</label>
            <input type="time" value={formData.admissionTime} onChange={e => updateField('admissionTime', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Asal Masuk / Rujukan</label>
            <select value={formData.admissionSource} onChange={e => updateField('admissionSource', e.target.value)} className={fieldClass}>
              <option value="EMERGENCY">Instalasi Gawat Darurat (IGD)</option>
              <option value="OUTPATIENT">Poliklinik Rawat Jalan</option>
              <option value="DIRECT_TRANSFER">Transfer Langsung dari Ruangan Lain</option>
              <option value="EXTERNAL_REFERRAL">Rujukan RS / Klinik Luar</option>
            </select>
          </div>
        </div>

        <ClinicalFieldRow label="Kamar & Nomor Bed">
          <input type="text" value={formData.roomBedNumber} onChange={e => updateField('roomBedNumber', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="DPJP Utama Penanggung Jawab">
          <input type="text" value={formData.admittingPhysician} onChange={e => updateField('admittingPhysician', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 2. Diagnosis Masuk & Alasan Dirawat */}
      <ClinicalSection title="2. Diagnosis Masuk & Alasan Rawat Inap" subtitle="Admitting Diagnosis & Clinical Rationale" icon={Stethoscope}>
        <ClinicalFieldRow label="Diagnosis Masuk (Admitting Diagnosis)" required hint="Diagnosis klinis saat diputuskan rawat inap">
          <textarea rows={2} value={formData.admittingDiagnosis} onChange={e => updateField('admittingDiagnosis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Kode ICD-10">
          <input type="text" placeholder="misal: A90, K35.8..." value={formData.icd10Code} onChange={e => updateField('icd10Code', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Alasan Indikasi Rawat Inap" hint="Indikasi medis perlunya perawatan inap">
          <textarea rows={2} value={formData.reasonForAdmission} onChange={e => updateField('reasonForAdmission', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 3. Vital Signs Admisi */}
      <ClinicalSection title="3. Vital Signs Masuk Ruangan" subtitle="Admitting Vital Signs & GCS" icon={Activity}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tekanan Darah (mmHg)</label>
            <div className="flex items-center gap-1">
              <input type="text" value={formData.bpSystolic} onChange={e => updateField('bpSystolic', e.target.value)} className={fieldClass} />
              <span>/</span>
              <input type="text" value={formData.bpDiastolic} onChange={e => updateField('bpDiastolic', e.target.value)} className={fieldClass} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Detak Jantung (bpm)</label>
            <input type="text" value={formData.heartRate} onChange={e => updateField('heartRate', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Suhu (°C)</label>
            <input type="text" value={formData.temperature} onChange={e => updateField('temperature', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">SpO2 (%)</label>
            <input type="text" value={formData.spo2} onChange={e => updateField('spo2', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ClinicalSection>

      {/* 4. Instruksi Pengobatan Awal (Admitting Orders) */}
      <ClinicalSection title="4. Instruksi Pengobatan Awal (Admitting Orders)" subtitle="Initial Orders for Nursing & Pharmacy" icon={Pill}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Instruksi Diit / Nutrisi</label>
            <select value={formData.dietOrder} onChange={e => updateField('dietOrder', e.target.value)} className={fieldClass}>
              <option value="DIET_BIASA">Diit Biasa (Nasi)</option>
              <option value="DIET_LUNAK_NRS">Diit Lunak (Bubur Murni)</option>
              <option value="DIET_CAIR">Diit Cair / NGT</option>
              <option value="NPO">Puasakan (NPO - Nil Per Os)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tingkat Aktivitas</label>
            <select value={formData.activityOrder} onChange={e => updateField('activityOrder', e.target.value)} className={fieldClass}>
              <option value="BEDREST">Tirah Baring Total (Bedrest)</option>
              <option value="MOBILISASI_BERTAHAP">Mobilisasi Bertahap (Duduk/Jalan)</option>
              <option value="MANDIRI">Mobilisasi Mandiri</option>
            </select>
          </div>
        </div>

        <ClinicalFieldRow label="Cairan Infus (IVFD)">
          <input type="text" placeholder="misal: RL 500 mL / 8 jam..." value={formData.ivFluidOrder} onChange={e => updateField('ivFluidOrder', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Obat-obatan Awal Masuk">
          <textarea rows={3} placeholder="Daftar resep obat awal masukan..." value={formData.initialMedications} onChange={e => updateField('initialMedications', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Instruksi Pemantauan & Tanda Bahaya">
          <textarea rows={2} value={formData.specialInstructions} onChange={e => updateField('specialInstructions', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
