/**
 * PhysicalExaminationForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Form Pemeriksaan Fisik Terstruktur Head-to-Toe (AOP.1.1 / PMK 269)
 *
 * Struktur:
 *  1. Keadaan Umum & Kesadaran (GCS)
 *  2. Vital Signs Sync / Overrides
 *  3. Kepala & Leher (Head & Neck)
 *  4. Thorax (Dada: Paru & Jantung)
 *  5. Abdomen (Perut)
 *  6. Ekstremitas & Neurologi
 *  7. Integumen & Status Lokalis
 */

import React, { useState } from 'react';
import {
  Stethoscope, Activity, Heart, Eye, Hand, ShieldAlert,
  Sliders, User, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function PhysicalExaminationForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    // 1. Keadaan Umum & GCS
    generalCondition: 'TAMPAK_SAKIT_SEDANG', // RINGAN | SEDANG | BERAT
    consciousness: 'COMPOS_MENTIS', // COMPOS_MENTIS | SOMNOLEN | DELIRIUM | SOPOR | COMA
    gcsEye: '4', // 1-4
    gcsVerbal: '5', // 1-5
    gcsMotor: '6', // 1-6
    gcsTotal: 15,

    // 2. Vital Signs (prefilled dari encounter jika ada)
    bpSystolic: encounter?.vitals?.bp?.split('/')?.[0] || '120',
    bpDiastolic: encounter?.vitals?.bp?.split('/')?.[1] || '80',
    heartRate: encounter?.vitals?.hr || '80',
    respiratoryRate: encounter?.vitals?.rr || '20',
    temperature: encounter?.vitals?.temp || '36.5',
    spo2: encounter?.vitals?.spo2 || '98',

    // 3. Kepala & Leher
    headEyeAnemic: false,
    headEyeIcteric: false,
    headPupilIsochor: true,
    headPupilReflex: true,
    headENTNormal: true,
    headENTDetails: '',
    neckJvpNormal: true,
    neckLymphEnlargement: false,
    neckNotes: '',

    // 4. Thorax
    chestInspekNormal: true,
    lungSoundVesicular: true,
    lungRhonchi: false,
    lungWheezing: false,
    lungNotes: '',
    heartS1S2Single: true,
    heartMurmur: false,
    heartGallop: false,
    heartNotes: '',

    // 5. Abdomen
    abdoDistension: false,
    abdoBowelSounds: 'NORMAL', // NORMAL | INCREASED | DECREASED | ABSENT
    abdoTenderness: false,
    abdoTendernessLocation: '',
    abdoHepatomegaly: false,
    abdoSplenomegaly: false,
    abdoNotes: '',

    // 6. Ekstremitas & Neurologi
    extremityWarm: true,
    extremityCrtLess2s: true,
    extremityEdema: false,
    extremityEdemaLocation: '',
    motorPowerRightUpper: '5',
    motorPowerLeftUpper: '5',
    motorPowerRightLower: '5',
    motorPowerLeftLower: '5',

    // 7. Integumen & Status Lokalis
    skinTurgorGood: true,
    skinRash: false,
    skinUlcer: false,
    statusLocalis: '',
    conclusion: 'Dalam batas normal secara umum, temuan khusus tercatat.',
  });

  const updateField = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (['gcsEye', 'gcsVerbal', 'gcsMotor'].includes(field)) {
        const e = parseInt(field === 'gcsEye' ? value : updated.gcsEye) || 0;
        const v = parseInt(field === 'gcsVerbal' ? value : updated.gcsVerbal) || 0;
        const m = parseInt(field === 'gcsMotor' ? value : updated.gcsMotor) || 0;
        updated.gcsTotal = e + v + m;
      }
      return updated;
    });
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
          author: encounter?.doctor_name || 'Dokter Pemeriksa',
          moduleName: 'PEMERIKSAAN FISIK LENGKAP',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Pemeriksaan Fisik disimpan.');
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
          author: encounter?.doctor_name || 'Dokter Pemeriksa',
          moduleName: 'PEMERIKSAAN FISIK LENGKAP',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Pemeriksaan Fisik ditandatangani & difinalkan!');
    } catch (err) {
      toast.error('Gagal memproses tanda tangan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";
  const checkLabelClass = "flex items-center gap-2 p-2 rounded-xl border border-[var(--outline-variant)]/20 bg-[var(--surface-container)] hover:bg-[var(--surface-container-high)] cursor-pointer text-xs font-bold text-[var(--on-surface-variant)] transition-colors select-none";

  return (
    <ClinicalFormShell
      title="Pemeriksaan Fisik Terstruktur"
      subtitle="JCI AOP.1.1 | Head-to-Toe Examination"
      icon={Stethoscope}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      {/* 1. Keadaan Umum & GCS */}
      <ClinicalSection title="1. Keadaan Umum & Tingkat Kesadaran (GCS)" subtitle="General Condition & Glasgow Coma Scale" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Keadaan Umum</label>
            <select value={formData.generalCondition} onChange={e => updateField('generalCondition', e.target.value)} className={fieldClass}>
              <option value="TAMPAK_SAKIT_RINGAN">Tampak Sakit Ringan</option>
              <option value="TAMPAK_SAKIT_SEDANG">Tampak Sakit Sedang</option>
              <option value="TAMPAK_SAKIT_BERAT">Tampak Sakit Berat</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tingkat Kesadaran</label>
            <select value={formData.consciousness} onChange={e => updateField('consciousness', e.target.value)} className={fieldClass}>
              <option value="COMPOS_MENTIS">Compos Mentis (Sadar Penuh)</option>
              <option value="SOMNOLEN">Somnolen (Mengantuk)</option>
              <option value="DELIRIUM">Delirium (Gelisah / Kacau)</option>
              <option value="SOPOR">Sopor (Koma Ringan)</option>
              <option value="COMA">Coma (Tidak Sadar)</option>
            </select>
          </div>
        </div>

        {/* GCS Calculator Row */}
        <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-black uppercase text-[var(--primary)]">Glasgow Coma Scale (GCS)</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase">TOTAL GCS:</span>
              <span className="text-base font-black text-teal-700 dark:text-teal-400 font-mono bg-teal-500/15 px-3 py-0.5 rounded-full">
                {formData.gcsTotal} / 15 (E{formData.gcsEye}V{formData.gcsVerbal}M{formData.gcsMotor})
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Eye (Mata 1-4)</label>
              <select value={formData.gcsEye} onChange={e => updateField('gcsEye', e.target.value)} className={fieldClass}>
                <option value="4">4 — Spontan membuka mata</option>
                <option value="3">3 — Membuka mata terhadap suara</option>
                <option value="2">2 — Membuka mata terhadap nyeri</option>
                <option value="1">1 — Tidak ada respon</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Verbal (Bicara 1-5)</label>
              <select value={formData.gcsVerbal} onChange={e => updateField('gcsVerbal', e.target.value)} className={fieldClass}>
                <option value="5">5 — Orientasi baik &amp; lancar</option>
                <option value="4">4 — Bingung / disorientasi</option>
                <option value="3">3 — Kata-kata tidak tepat</option>
                <option value="2">2 — Erangan / suara tidak jelas</option>
                <option value="1">1 — Tidak ada suara</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Motorik (Gerakan 1-6)</label>
              <select value={formData.gcsMotor} onChange={e => updateField('gcsMotor', e.target.value)} className={fieldClass}>
                <option value="6">6 — Menurut perintah</option>
                <option value="5">5 — Melokalisir nyeri</option>
                <option value="4">4 — Menarik dari rangsang nyeri</option>
                <option value="3">3 — Fleksi abnormal (dekortikasi)</option>
                <option value="2">2 — Ekstensi abnormal (deserebrasi)</option>
                <option value="1">1 — Tidak ada gerakan</option>
              </select>
            </div>
          </div>
        </div>
      </ClinicalSection>

      {/* 2. Vital Signs Grid */}
      <ClinicalSection title="2. Tanda-Tanda Vital (Vital Signs)" subtitle="Synced Clinical Vitals" icon={Activity}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tekanan Darah (mmHg)</label>
            <div className="flex items-center gap-1">
              <input type="text" value={formData.bpSystolic} onChange={e => updateField('bpSystolic', e.target.value)} className={fieldClass} placeholder="Sistol" />
              <span className="text-xs font-bold text-[var(--on-surface-variant)]">/</span>
              <input type="text" value={formData.bpDiastolic} onChange={e => updateField('bpDiastolic', e.target.value)} className={fieldClass} placeholder="Diastol" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Detak Jantung (bpm)</label>
            <input type="text" value={formData.heartRate} onChange={e => updateField('heartRate', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Pernapasan (x/mnt)</label>
            <input type="text" value={formData.respiratoryRate} onChange={e => updateField('respiratoryRate', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Suhu (°C)</label>
            <input type="text" value={formData.temperature} onChange={e => updateField('temperature', e.target.value)} className={fieldClass} />
          </div>
        </div>
      </ClinicalSection>

      {/* 3. Kepala & Leher */}
      <ClinicalSection title="3. Kepala & Leher (Head & Neck)" subtitle="HEENT & Neck Examination" icon={Eye}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.headEyeAnemic} onChange={e => updateField('headEyeAnemic', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Konjungtiva Anemis (+)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.headEyeIcteric} onChange={e => updateField('headEyeIcteric', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Sklera Ikterik (+)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.headPupilIsochor} onChange={e => updateField('headPupilIsochor', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Pupil Isokor (3mm/3mm)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.neckLymphEnlargement} onChange={e => updateField('neckLymphEnlargement', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Pembesaran KGB Leher (+)</span>
          </label>
        </div>
        <ClinicalFieldRow label="Catatan Kepala & Leher">
          <input type="text" placeholder="Temuan spesifik THT, leher, kaku kuduk..." value={formData.headENTDetails} onChange={e => updateField('headENTDetails', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 4. Thorax (Paru & Jantung) */}
      <ClinicalSection title="4. Thorax (Dada: Paru & Jantung)" subtitle="Pulmonary & Cardiovascular Exam" icon={Heart}>
        <ClinicalSubSection title="Paru-Paru (Pulmo)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.lungSoundVesicular} onChange={e => updateField('lungSoundVesicular', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>Suara Napas Vesikuler (+/+)</span>
            </label>
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.lungRhonchi} onChange={e => updateField('lungRhonchi', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>Rhonchi (+/+)</span>
            </label>
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.lungWheezing} onChange={e => updateField('lungWheezing', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>Wheezing (+/+)</span>
            </label>
          </div>
        </ClinicalSubSection>

        <ClinicalSubSection title="Jantung (Cor)">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.heartS1S2Single} onChange={e => updateField('heartS1S2Single', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>S1-S2 Tunggal, Reguler</span>
            </label>
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.heartMurmur} onChange={e => updateField('heartMurmur', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>Murmur (+)</span>
            </label>
            <label className={checkLabelClass}>
              <input type="checkbox" checked={formData.heartGallop} onChange={e => updateField('heartGallop', e.target.checked)} className="rounded accent-[var(--primary)]" />
              <span>Gallop (+)</span>
            </label>
          </div>
        </ClinicalSubSection>
      </ClinicalSection>

      {/* 5. Abdomen (Perut) */}
      <ClinicalSection title="5. Abdomen (Perut)" subtitle="Gastrointestinal Examination" icon={Hand}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.abdoDistension} onChange={e => updateField('abdoDistension', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Distensi Abdomen (+)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.abdoTenderness} onChange={e => updateField('abdoTenderness', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Nyeri Tekan Abdomen (+)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.abdoHepatomegaly} onChange={e => updateField('abdoHepatomegaly', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Hepatomegali (+)</span>
          </label>
        </div>
        <ClinicalFieldRow label="Bising Usus (Peristaltik)">
          <select value={formData.abdoBowelSounds} onChange={e => updateField('abdoBowelSounds', e.target.value)} className={fieldClass}>
            <option value="NORMAL">Normal (5-30x/menit)</option>
            <option value="INCREASED">Meningkat / Hiperaktif</option>
            <option value="DECREASED">Menurun / Hipodinamik</option>
            <option value="ABSENT">Hilang / Negatif</option>
          </select>
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Lokasi Nyeri Tekan & Catatan Abdomen">
          <input type="text" placeholder="misal: Epigastrium, RUQ, RLQ (McBurney)..." value={formData.abdoNotes} onChange={e => updateField('abdoNotes', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>

      {/* 6. Ekstremitas & Status Lokalis */}
      <ClinicalSection title="6. Ekstremitas, Integumen & Status Lokalis" subtitle="Extremities & Local Findings" icon={Sliders}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.extremityWarm} onChange={e => updateField('extremityWarm', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Akral Hangat (HKT)</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.extremityCrtLess2s} onChange={e => updateField('extremityCrtLess2s', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>CRT &lt; 2 Detik</span>
          </label>
          <label className={checkLabelClass}>
            <input type="checkbox" checked={formData.extremityEdema} onChange={e => updateField('extremityEdema', e.target.checked)} className="rounded accent-[var(--primary)]" />
            <span>Edema Ekstremitas (+)</span>
          </label>
        </div>

        <ClinicalFieldRow label="Status Lokalis / Temuan Khusus">
          <textarea rows={3} placeholder="Deskripsi lokasi luka, benjolan, deformitas, fraktur, atau kondisi spesifik organ..." value={formData.statusLocalis} onChange={e => updateField('statusLocalis', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Kesimpulan Pemeriksaan Fisik">
          <textarea rows={2} value={formData.conclusion} onChange={e => updateField('conclusion', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
