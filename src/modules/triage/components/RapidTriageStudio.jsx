import React, { useState, useEffect } from 'react';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { triageEngineService } from '../../emergency/services/triageEngine.service.js';
import toast from 'react-hot-toast';

export default function RapidTriageStudio({ onTriageCompleted, onTriggerCodeBlue }) {
  const { patients } = usePatientStore();
  const { activePatientId, activeEncounterId, setLiveContext } = useEncounterStore();
  const { executeSubmit, isSubmitting } = useTriageStore();

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [airway, setAirway] = useState('PATENT'); // 'PATENT' | 'THREATENED' | 'OBSTRUCTED'
  const [breathing, setBreathing] = useState('NORMAL'); // 'NORMAL' | 'DYSPNEA' | 'APNEA' | 'STRIDOR'
  const [circulation, setCirculation] = useState('NORMAL'); // 'NORMAL' | 'SHOCK' | 'HEMORRHAGE'
  const [disabilityGcsEye, setDisabilityGcsEye] = useState(4);
  const [disabilityGcsVerbal, setDisabilityGcsVerbal] = useState(5);
  const [disabilityGcsMotor, setDisabilityGcsMotor] = useState(6);

  // Vitals
  const [sbp, setSbp] = useState(120);
  const [dbp, setDbp] = useState(80);
  const [hr, setHr] = useState(80);
  const [rr, setRr] = useState(18);
  const [spo2, setSpo2] = useState(98);
  const [temp, setTemp] = useState(36.8);
  const [pain, setPain] = useState(0);

  // Auto-calculated ESI Specification
  const [calculatedEsi, setCalculatedEsi] = useState(null);
  const [isDangerousVital, setIsDangerousVital] = useState(false);

  useEffect(() => {
    if (activePatientId) {
      const p = patients.find(p => p.id === activePatientId || p.mrn === activePatientId);
      if (p) setSelectedPatient(p);
    }
  }, [activePatientId, patients]);

  // Real-time ESI & Red Flag Classification
  useEffect(() => {
    const totalGcs = Number(disabilityGcsEye) + Number(disabilityGcsVerbal) + Number(disabilityGcsMotor);
    const spec = triageEngineService.classifySeverity({
      airwayStatus: airway,
      breathingStatus: breathing,
      circulationStatus: circulation,
      spo2: Number(spo2),
      heartRate: Number(hr),
      gcsTotal: totalGcs,
      painScale: Number(pain)
    });

    setCalculatedEsi(spec);

    // Danger Zone Checks
    if (Number(spo2) < 90 || Number(hr) > 130 || Number(sbp) < 85 || totalGcs <= 8) {
      setIsDangerousVital(true);
    } else {
      setIsDangerousVital(false);
    }
  }, [airway, breathing, circulation, disabilityGcsEye, disabilityGcsVerbal, disabilityGcsMotor, sbp, hr, spo2, pain]);

  const handleSubmitTriage = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Pilih pasien terlebih dahulu!');
      return;
    }
    if (!chiefComplaint.trim()) {
      toast.error('Keluhan utama wajib diisi!');
      return;
    }

    try {
      const record = await triageEngineService.recordTriageAssessment({
        episodeId: 'EOC-2026-001',
        encounterId: activeEncounterId || 'ENC-2026-001',
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        mrn: selectedPatient.mrn,
        triageMethod: 'ESI_V4',
        chiefComplaint,
        airwayStatus: airway,
        breathingStatus: breathing,
        circulationStatus: circulation,
        disabilityStatus: calculatedEsi.level <= 2 ? 'UNRESPONSIVE' : 'ALERT',
        bloodPressureSystolic: sbp,
        bloodPressureDiastolic: dbp,
        heartRate: hr,
        respiratoryRate: rr,
        temperature: temp,
        spo2,
        gcsEye: disabilityGcsEye,
        gcsVerbal: disabilityGcsVerbal,
        gcsMotor: disabilityGcsMotor,
        painScale: pain,
        assessorName: 'Ns. Sarah, S.Kep (Perawat Triase IGD)'
      });

      if (calculatedEsi.level === 1) {
        toast.error(`🚨 PASIEN ESI 1 (RESUSITASI SEGERA): Panggilan Code Blue & Tim Resusitasi diaktifkan!`, {
          duration: 6000
        });
        if (onTriggerCodeBlue) onTriggerCodeBlue(selectedPatient);
      } else {
        toast.success(`✅ Triase Selesai: ${calculatedEsi.esiLabel} (Target Waktu: ≤ ${calculatedEsi.targetMinutes} Menit)!`);
      }

      if (onTriageCompleted) onTriageCompleted(record);
    } catch (err) {
      toast.error(`Gagal menyimpan triase: ${err.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">stethoscope</span>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Studio Triase Cepat (Rapid ESI v4 Intake)</h2>
            <p className="text-[11px] text-slate-500">Evaluasi Primer ABCDE & Algoritma Keparahan Klinis Terotomasi</p>
          </div>
        </div>

        {calculatedEsi && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Hasil Klasifikasi:</span>
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${calculatedEsi.badgeClass} shadow-md`}>
              {calculatedEsi.esiLabel}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitTriage} className="flex flex-col gap-5">
        {/* Patient Selection & Chief Complaint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Pasien Terdaftar</label>
            <select
              value={selectedPatient?.id || ''}
              onChange={e => {
                const p = patients.find(pt => pt.id === e.target.value);
                setSelectedPatient(p);
                if (p) setLiveContext(p.id, null);
              }}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            >
              <option value="">-- Pilih Pasien --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.mrn}) - {p.status || 'ACTIVE'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Keluhan Utama (Chief Complaint) *</label>
            <input
              type="text"
              placeholder="Contoh: Nyeri dada hebat kiri tembus ke punggung, keringat dingin, pusing"
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* ABCDE Primary Survey */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-blue-600">health_and_safety</span>
            Survei Primer ABCDE
          </span>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500">A - Jalan Nafas (Airway)</label>
              <select
                value={airway}
                onChange={e => setAirway(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="PATENT">Paten (Bebas)</option>
                <option value="THREATENED">Terancam (Stridor / Gurgling)</option>
                <option value="OBSTRUCTED">Tersumbat Total (ESI 1)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500">B - Pernafasan (Breathing)</label>
              <select
                value={breathing}
                onChange={e => setBreathing(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="NORMAL">Normal / Adekuat</option>
                <option value="DYSPNEA">Sesak Berat (Dyspnea)</option>
                <option value="APNEA">Henti Nafas (Apnea - ESI 1)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500">C - Sirkulasi (Circulation)</label>
              <select
                value={circulation}
                onChange={e => setCirculation(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="NORMAL">Kuat & Teratur</option>
                <option value="HEMORRHAGE">Perdarahan Aktif Berat</option>
                <option value="SHOCK">Syok Berat / Kolaps (ESI 1)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500">D - GCS (Eye + Verbal + Motor)</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="number" min="1" max="4" value={disabilityGcsEye}
                  onChange={e => setDisabilityGcsEye(e.target.value)}
                  className="w-1/3 px-2 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  title="Eye (1-4)"
                />
                <input
                  type="number" min="1" max="5" value={disabilityGcsVerbal}
                  onChange={e => setDisabilityGcsVerbal(e.target.value)}
                  className="w-1/3 px-2 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  title="Verbal (1-5)"
                />
                <input
                  type="number" min="1" max="6" value={disabilityGcsMotor}
                  onChange={e => setDisabilityGcsMotor(e.target.value)}
                  className="w-1/3 px-2 py-1.5 text-xs font-bold text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  title="Motor (1-6)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vital Signs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500">TD Sistolik (mmHg)</label>
            <input
              type="number" value={sbp} onChange={e => setSbp(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">TD Diastolik</label>
            <input
              type="number" value={dbp} onChange={e => setDbp(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Nadi (bpm)</label>
            <input
              type="number" value={hr} onChange={e => setHr(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Napas (/mnt)</label>
            <input
              type="number" value={rr} onChange={e => setRr(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Saturasi SpO2 (%)</label>
            <input
              type="number" value={spo2} onChange={e => setSpo2(e.target.value)}
              className={`w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                Number(spo2) < 92 ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
              }`}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Skala Nyeri (0-10)</label>
            <input
              type="number" min="0" max="10" value={pain} onChange={e => setPain(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Danger Warning Alert */}
        {isDangerousVital && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-400 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>PERINGATAN KRITIS: Nilai TTV berada pada zona bahaya (Danger Zone)! Pasien otomatis tereskalasi ke ESI 1 atau 2.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Simpan Asesmen Triase & Mulai Stopwatch SLA</span>
          </button>
        </div>
      </form>
    </div>
  );
}
