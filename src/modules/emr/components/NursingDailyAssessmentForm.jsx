/**
 * NursingDailyAssessmentForm.jsx
 * ─────────────────────────────────────────────────────────────
 * Asesmen Keperawatan Harian Rawat Inap (Shift Nursing Assessment)
 * Standar: JCI COP.3, SNARS Ed.2
 */

import React, { useState } from 'react';
import {
  ClipboardList, Activity, Heart, ShieldAlert, Thermometer,
  Clock, User, CheckSquare, Pill, Zap
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';
import { saveClinicalRecord } from '../services/emr.service';

export default function NursingDailyAssessmentForm({ patient, encounter, onClose }) {
  const [formState, setFormState] = useState('empty');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState({
    shift: 'PAGI', // PAGI | SIANG | MALAM
    nurseName: 'Ns. Sarah, S.Kep',
    dependencyLevel: 'PARTIAL_CARE', // TOTAL_CARE | PARTIAL_CARE | MINIMAL_CARE
    respiratoryStatus: 'NORMAL',
    oxygenSupport: 'ROOM_AIR', // ROOM_AIR | NASAL_CANULA | NRM
    oxygenFlow: '',
    ivAccessSite: 'Tangan Kiri (Vena Cefalika)',
    ivAccessDate: new Date().toISOString().slice(0, 10),
    phlebitisScore: '0', // VIP Score 0-5
    phlebitisSigns: false,
    bowelHabit: 'NORMAL',
    urineOutput: 'Cukup (± 1500 cc/24j)',
    catheterInserted: false,
    painScore: '2', // 0-10
    painLocation: 'Abdomen kanan bawah',
    nursingInterventions: '1. Reposisi miring kanan/kiri tiap 2 jam\n2. Rawat lokasi IV catheter dengan alkohol 70% & dressing steril\n3. Observasi TTV dan skor EWS tiap 4 jam\n4. Edukasi teknik relaksasi napas dalam untuk manajemen nyeri',
    evaluasiRespon: 'Pasien tampak tenang, nyeri berkurang setelah pemberian analgetik. Tidak ada tanda flebitis pada lokasi IV line.',
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
          author: formData.nurseName,
          moduleName: 'ASESMEN KEPERAWATAN HARIAN',
          data: formData,
          status: 'DRAFT',
        });
      }
      setFormState('draft');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Draf Asesmen Keperawatan disimpan.');
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
          author: formData.nurseName,
          moduleName: 'ASESMEN KEPERAWATAN HARIAN',
          data: formData,
          status: 'SIGNED',
        });
      }
      setFormState('signed');
      setIsDirty(false);
      setLastSavedAt(new Date().toLocaleTimeString('id-ID'));
      toast.success('Asesmen Keperawatan Harian berhasil ditandatangani!');
    } catch (err) {
      toast.error('Gagal memproses tanda tangan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = "w-full px-3 py-2 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";

  return (
    <ClinicalFormShell
      title="Asesmen Keperawatan Harian Rawat Inap"
      subtitle="Shift Nursing Assessment | JCI COP.3"
      icon={ClipboardList}
      formState={formState}
      lastSavedAt={lastSavedAt}
      isSaving={isSaving}
      isDirty={isDirty}
      onSaveDraft={handleSaveDraft}
      onSign={handleSign}
      onCancel={onClose}
    >
      <ClinicalSection title="1. Shift & Tingkat Ketergantungan Pasien" subtitle="Shift & Dependency Classification" icon={Clock}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Shift Dinas</label>
            <select value={formData.shift} onChange={e => updateField('shift', e.target.value)} className={fieldClass}>
              <option value="PAGI">Shift Pagi (07.00 - 14.00)</option>
              <option value="SIANG">Shift Siang (14.00 - 21.00)</option>
              <option value="MALAM">Shift Malam (21.00 - 07.00)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Perawat Penanggung Jawab (PPJA)</label>
            <input type="text" value={formData.nurseName} onChange={e => updateField('nurseName', e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-[var(--on-surface-variant)] mb-1">Tingkat Ketergantungan (Care Level)</label>
            <select value={formData.dependencyLevel} onChange={e => updateField('dependencyLevel', e.target.value)} className={fieldClass}>
              <option value="MINIMAL_CARE">Minimal Care (Ketergantungan Ringan)</option>
              <option value="PARTIAL_CARE">Partial Care (Ketergantungan Sedang)</option>
              <option value="TOTAL_CARE">Total Care (Ketergantungan Total)</option>
            </select>
          </div>
        </div>
      </ClinicalSection>

      <ClinicalSection title="2. Pemantauan Akses Infus & Flebitis (VIP Score)" subtitle="Vascular Access & Phlebitis Surveillance" icon={Zap}>
        <ClinicalFieldRow label="Lokasi Akses IV (Infus)">
          <input type="text" value={formData.ivAccessSite} onChange={e => updateField('ivAccessSite', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Tanggal Pemasangan Infus">
          <input type="date" value={formData.ivAccessDate} onChange={e => updateField('ivAccessDate', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
        <ClinicalFieldRow label="Skor Flebitis (Visual Infusion Phlebitis Score)" hint="0: Tidak ada flebitis, 1: Nyeri ringan, 2: Nyeridan kemerahan">
          <select value={formData.phlebitisScore} onChange={e => updateField('phlebitisScore', e.target.value)} className={fieldClass}>
            <option value="0">Skor 0 — Tidak ada tanda flebitis (Akses baik)</option>
            <option value="1">Skor 1 — Nyeri ringan dekat lokasi infus</option>
            <option value="2">Skor 2 — Nyeri dengan kemerahan / bengkak (Ganti IV catheter)</option>
            <option value="3">Skor 3 — Nyeri, kemerahan, vena teraba keras</option>
          </select>
        </ClinicalFieldRow>
      </ClinicalSection>

      <ClinicalSection title="3. Implementasi & Evaluasi Keperawatan" subtitle="Nursing Care Plan Implementation" icon={CheckSquare}>
        <ClinicalFieldRow label="Tindakan Keperawatan Shift Ini">
          <textarea rows={3} value={formData.nursingInterventions} onChange={e => updateField('nursingInterventions', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>

        <ClinicalFieldRow label="Evaluasi Respon Pasien (SOAP Keperawatan)">
          <textarea rows={2} value={formData.evaluasiRespon} onChange={e => updateField('evaluasiRespon', e.target.value)} className={fieldClass} />
        </ClinicalFieldRow>
      </ClinicalSection>
    </ClinicalFormShell>
  );
}
