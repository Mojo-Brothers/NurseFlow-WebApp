/**
 * AnamnesisForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Form Anamnesis Medis Lengkap (AOP.1.1 / PMK 269)
 *
 * Struktur:
 *  1. Keluhan Utama & Riwayat Penyakit Sekarang (HPI)
 *  2. Riwayat Penyakit Dahulu (PMH) & Pengobatan
 *  3. Riwayat Operasi & Rawat Inap
 *  4. Riwayat Penyakit Keluarga
 *  5. Riwayat Sosial & Kebiasaan
 *  6. Review of Systems (ROS - Anamnesis Sistem)
 */

import React, { useState } from 'react';
import {
  FileText, Activity, AlertCircle, Heart, ShieldAlert,
  Clock, Pill, Scissors, Users, Coffee, CheckSquare, Save
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function AnamnesisForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty'); // 'empty' | 'draft' | 'saved' | 'signed'
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    // 1. Keluhan Utama & HPI
    chiefComplaint: '',
    hpiOnset: '',
    hpiDuration: '',
    hpiLocation: '',
    hpiSeverity: '5', // 1-10
    hpiCharacter: '',
    hpiAggravating: '',
    hpiRelieving: '',
    hpiAssociatedSymptoms: '',
    hpiDetails: '',

    // 2. Riwayat Penyakit Dahulu
    pmhHypertension: false,
    pmhDiabetes: false,
    pmhHeartDisease: false,
    pmhAsthma: false,
    pmhKidneyDisease: false,
    pmhStroke: false,
    pmhCancer: false,
    pmhTuberculosis: false,
    pmhHepatitis: false,
    pmhOther: '',

    // 3. Riwayat Pengobatan & Alergi
    currentMedications: '',
    allergies: '',

    // 4. Operasi & Rawat Inap
    pastSurgeries: '',
    pastHospitalizations: '',

    // 5. Riwayat Keluarga
    familyHistory: '',

    // 6. Riwayat Sosial
    smokingStatus: 'NON_SMOKER', // NON_SMOKER | FORMER | ACTIVE
    smokingPacksPerDay: '',
    alcoholUse: 'NONE', // NONE | OCCASIONAL | REGULAR
    exerciseHabit: 'SEDENTARY',
    occupation: '',

    // 7. Review of Systems (ROS)
    rosGeneral: [],
    rosRespiratory: [],
    rosCardiovascular: [],
    rosGastrointestinal: [],
    rosNeurological: [],
    rosMusculoskeletal: [],
    rosDermatology: [],
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (formState === 'empty') setFormState('in_progress');
  };

  const handleCheckboxGroup = (category, value) => {
    setFormData(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setIsDirty(true);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: encounter?.doctor_name || 'Dokter Pemeriksa',
          moduleName: 'ANAMNESIS MEDIS LENGKAP',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Anamnesis disimpan.');
    } catch (err) {
      toast.error('Gagal menyimpan draf: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSign = async () => {
    if (!formData.chiefComplaint) {
      toast.error('Keluhan utama wajib diisi!');
      return;
    }
    setIsSaving(true);
    try {
      if (encounter?.id) {
        await saveClinicalRecord({
          patientId: patient?.id || encounter?.patient_id,
          encounterId: encounter.id,
          author: encounter?.doctor_name || 'Dokter Pemeriksa',
          moduleName: 'ANAMNESIS MEDIS LENGKAP',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Anamnesis berhasil ditandatangani & difinalkan!');
    } catch (err) {
      toast.error('Gagal menandatangani anamnesis: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";
  const checkLabelClass = "flex items-center gap-2 p-2 rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] cursor-pointer text-xs font-bold text-[var(--on-surface-variant)] transition-colors select-none";

  return (
    <ClinicalFormShell
      title="Anamnesis Medis Lengkap"
      subtitle="JCI AOP.1.1 | PMK 269/2008"
      icon={FileText}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      {/* 1. Keluhan Utama & HPI */}
      <ClinicalSection title="1. Keluhan Utama & Riwayat Penyakit Sekarang (HPI)" subtitle="Chief Complaint & History of Present Illness" icon={Activity}>
        <ClinicalFieldRow label="Keluhan Utama" required hint="Alasan utama pasien berobat / masuk RS">
          <textarea
            rows={2}
            placeholder="Contoh: Nyeri dada sebelah kiri tembus ke belakang sejak 2 jam SBRS..."
            value={formData.chiefComplaint}
            onChange={e => updateField('chiefComplaint', e.target.value)}
            className={fieldClass}
          />
        </ClinicalFieldRow>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Onset / Awitan</label>
            <input type="text" placeholder="misal: 2 jam yang lalu, mendadak" value={formData.hpiOnset} onChange={e => updateField('hpiOnset', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Durasi</label>
            <input type="text" placeholder="misal: Hilang timbul, terus menerus" value={formData.hpiDuration} onChange={e => updateField('hpiDuration', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Skala Nyeri (NRS 1-10): {formData.hpiSeverity}</label>
            <input type="range" min="0" max="10" value={formData.hpiSeverity} onChange={e => updateField('hpiSeverity', e.target.value)} className="w-full accent-[var(--primary)]" />
          </div>
        </div>

        <ClinicalFieldRow label="Karakteristik & Lokasi" hint="Sifat nyeri / keluhan (seperti ditindih, ditusuk, terbakar)">
          <input type="text" placeholder="Karakteristik dan jangkauan penjalaran..." value={formData.hpiCharacter} onChange={e => updateField('hpiCharacter', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Faktor Memperberat & Memperringan">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input type="text" placeholder="Memperberat: aktivitas, nafas dalam..." value={formData.hpiAggravating} onChange={e => updateField('hpiAggravating', e.target.value)} className={fieldClass} />
            <input type="text" placeholder="Memperringan: istirahat, minum obat..." value={formData.hpiRelieving} onChange={e => updateField('hpiRelieving', e.target.value)} className={fieldClass} />
          </div>
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Uraian Kronologis Lengkap">
          <textarea rows={3} placeholder="Narasi kronologis jalannya penyakit dari awal hingga saat ini..." value={formData.hpiDetails} onChange={e => updateField('hpiDetails', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 2. Riwayat Penyakit Dahulu (PMH) */}
      <ClinicalSection title="2. Riwayat Penyakit Dahulu (PMH) & Alergi" subtitle="Past Medical History & Medication" icon={Heart}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {[
            ['pmhHypertension', 'Hipertensi'],
            ['pmhDiabetes', 'Diabetes Melitus'],
            ['pmhHeartDisease', 'Penyakit Jantung'],
            ['pmhAsthma', 'Asma / PPOK'],
            ['pmhKidneyDisease', 'Gagal Ginjal'],
            ['pmhStroke', 'Stroke'],
            ['pmhCancer', 'Kanker / Keganasan'],
            ['pmhTuberculosis', 'TB Paru'],
            ['pmhHepatitis', 'Hepatitis B/C'],
          ].map(([key, label]) => (
            <label key={key} className={checkLabelClass}>
              <input
                type="checkbox"
                checked={formData[key]}
                onChange={e => updateField(key, e.target.checked)}
                className="rounded accent-[var(--primary)]"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <ClinicalFieldRow label="Penyakit Lainnya">
          <input type="text" placeholder="Riwayat penyakit kronis lainnya..." value={formData.pmhOther} onChange={e => updateField('pmhOther', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Riwayat Pengobatan Rutin">
          <textarea rows={2} placeholder="Daftar obat yang sedang dikonsumsi rutin sebelum masuk RS..." value={formData.currentMedications} onChange={e => updateField('currentMedications', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Riwayat Alergi (Obat/Makanan)">
          <input type="text" placeholder="misal: Amoxicillin (gatal/bentol), Udang (sesak)..." value={formData.allergies} onChange={e => updateField('allergies', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 3. Operasi & Rawat Inap */}
      <ClinicalSection title="3. Riwayat Operasi & Rawat Inap" subtitle="Past Surgeries & Hospitalizations" icon={Scissors}>
        <ClinicalFieldRow label="Riwayat Operasi">
          <textarea rows={2} placeholder="Tahun, jenis operasi, dan komplikasi (jika ada)..." value={formData.pastSurgeries} onChange={e => updateField('pastSurgeries', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Riwayat Rawat Inap Sebelumnya">
          <textarea rows={2} placeholder="Tahun, alasan dirawat, dan Rumah Sakit..." value={formData.pastHospitalizations} onChange={e => updateField('pastHospitalizations', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 4. Riwayat Keluarga & Sosial */}
      <ClinicalSection title="4. Riwayat Keluarga & Sosial Kebiasaan" subtitle="Family & Personal Social History" icon={Users}>
        <ClinicalFieldRow label="Riwayat Penyakit Keluarga">
          <input type="text" placeholder="Penyakit keturunan dalam keluarga (DM, Hipertensi, Kanker, Jantung)..." value={formData.familyHistory} onChange={e => updateField('familyHistory', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Status Merokok</label>
            <select value={formData.smokingStatus} onChange={e => updateField('smokingStatus', e.target.value)} className={fieldClass}>
              <option value="NON_SMOKER">Tidak Merokok</option>
              <option value="FORMER">Mantan Perokok</option>
              <option value="ACTIVE">Perokok Aktif</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Konsumsi Alkohol</label>
            <select value={formData.alcoholUse} onChange={e => updateField('alcoholUse', e.target.value)} className={fieldClass}>
              <option value="NONE">Tidak Pernah</option>
              <option value="OCCASIONAL">Kadang-kadang</option>
              <option value="REGULAR">Rutin</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Pekerjaan / Aktivitas</label>
            <input type="text" placeholder="Jenis pekerjaan..." value={formData.occupation} onChange={e => updateField('occupation', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ClinicalSection>

      {/* 5. Review of Systems (ROS) */}
      <ClinicalSection title="5. Review of Systems (ROS)" subtitle="Anamnesis Sistem Head-to-Toe Checklist" icon={CheckSquare} collapsible defaultOpen={false}>
        <div className="space-y-4">
          {[
            { cat: 'rosGeneral', title: 'Umum / Konstitusional', items: ['Demam', 'Mati Rasa', 'Penurunan BB', 'Kelelahan Kronis', 'Keringat Malam'] },
            { cat: 'rosRespiratory', title: 'Respirasi (Pernafasan)', items: ['Batuk', 'Dahak', 'Batuk Darah', 'Sesak Nafas', 'Nyeri Dada Saat Bernafas'] },
            { cat: 'rosCardiovascular', title: 'Kardiovaskular', items: ['Nyeri Dada Substernal', 'Palpitasi / Berdebar', 'Kaki Bengkak (Edema)', 'Ortopnea'] },
            { cat: 'rosGastrointestinal', title: 'Gastrointestinal (Pencernaan)', items: ['Mual / Muntah', 'Nyeri Ulu Hati', 'Diare', 'Konstipasi', 'BAB Berdarah / Hitam'] },
            { cat: 'rosNeurological', title: 'Neurologi (Saraf)', items: ['Sakit Kepala', 'Pusing / Vertigo', 'Kelemahan Anggota Gerak', 'Kram / Kesemutan', 'Kejang'] },
          ].map(({ cat, title, items }) => (
            <div key={cat} className="p-3 bg-[var(--surface-container)] rounded-xl border border-[var(--outline-variant)]/20">
              <span className="text-[11px] font-black uppercase text-[var(--primary)] block mb-2">{title}</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map(item => (
                  <label key={item} className={checkLabelClass}>
                    <input
                      type="checkbox"
                      checked={(formData[cat] || []).includes(item)}
                      onChange={() => handleCheckboxGroup(cat, item)}
                      className="rounded accent-[var(--primary)]"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
