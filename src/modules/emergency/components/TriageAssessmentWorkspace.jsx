import React, { useState } from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';

export default function TriageAssessmentWorkspace({ onTriageSaved }) {
  const { recordTriageAssessment } = useEmergencyStore();

  const [patientName, setPatientName] = useState('Tn. Bambang Hermanto');
  const [mrn, setMrn] = useState('MRN-2026-009988');
  const [chiefComplaint, setChiefComplaint] = useState('Nyeri dada retrosternal menjalar ke rahang & keringat dingin');
  const [airway, setAirway] = useState('PATENT');
  const [breathing, setBreathing] = useState('DYSPNEA');
  const [circulation, setCirculation] = useState('NORMAL');
  const [disability, setDisability] = useState('ALERT');
  const [sbp, setSbp] = useState(135);
  const [dbp, setDbp] = useState(85);
  const [hr, setHr] = useState(112);
  const [rr, setRr] = useState(24);
  const [temp, setTemp] = useState(36.7);
  const [spo2, setSpo2] = useState(94);
  const [gcsE, setGcsE] = useState(4);
  const [gcsV, setGcsV] = useState(5);
  const [gcsM, setGcsM] = useState(6);
  const [pain, setPain] = useState(8);
  const [isTrauma, setIsTrauma] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const assessment = await recordTriageAssessment({
        episodeId: `EOC-EMER-${Date.now()}`,
        encounterId: `ENC-IGD-${Date.now().toString().slice(-4)}`,
        patientId: `P-${Date.now()}`,
        patientName,
        mrn,
        triageMethod: 'ATS',
        chiefComplaint,
        airwayStatus: airway,
        breathingStatus: breathing,
        circulationStatus: circulation,
        disabilityStatus: disability,
        bloodPressureSystolic: sbp,
        bloodPressureDiastolic: dbp,
        heartRate: hr,
        respiratoryRate: rr,
        temperature: temp,
        spo2,
        gcsEye: gcsE,
        gcsVerbal: gcsV,
        gcsMotor: gcsM,
        painScale: pain,
        isTrauma
      });

      alert(`TRIASE BERHASIL DISIMPAN!\nKategori: ${assessment.triage_level}\nTarget Respon Dokter: ${assessment.target_response_minutes} Menit`);
      if (onTriageSaved) onTriageSaved(assessment);
    } catch (err) {
      alert(`Gagal Menyimpan Triase: ${err.message}`);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
        <div>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase tracking-wider">
            Pengkajian Triase Gawat Darurat (ATS / ESI Rapid Assessment)
          </h3>
          <p className="text-xs text-on-surface-variant">Klasifikasi keparahan klinis instan & aktivasi stopwatch SLA respon dokter.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Pasien</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface" required />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">No. Rekam Medis (MRN)</label>
            <input type="text" value={mrn} onChange={(e) => setMrn(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface" required />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Keluhan Utama / Alasan Masuk IGD *</label>
          <input type="text" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" required />
        </div>

        {/* ─── ABCDE Rapid Assessment ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/20">
          <div>
            <label className="block text-[10px] font-bold text-primary mb-1">Airway (Jalan Nafas)</label>
            <select value={airway} onChange={(e) => setAirway(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface">
              <option value="PATENT">Paten / Bebas</option>
              <option value="THREATENED">Terancam</option>
              <option value="OBSTRUCTED">Obstruksi Total</option>
              <option value="INTUBATED">Terpasang ETT</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-primary mb-1">Breathing (Pernafasan)</label>
            <select value={breathing} onChange={(e) => setBreathing(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface">
              <option value="NORMAL">Normal / Adekuat</option>
              <option value="DYSPNEA">Sesak Berat / Takipnea</option>
              <option value="APNEA">Apnea / Henti Nafas</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-primary mb-1">Circulation (Sirkulasi)</label>
            <select value={circulation} onChange={(e) => setCirculation(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface">
              <option value="NORMAL">Nadi Kuat / Stabil</option>
              <option value="WEAK_PULSE">Nadi Lemah / Takikardia</option>
              <option value="HEMORRHAGE">Perdarahan Masif</option>
              <option value="SHOCK">Syok Akut</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-primary mb-1">Disability (Kesadaran AVPU)</label>
            <select value={disability} onChange={(e) => setDisability(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface">
              <option value="ALERT">Alert (Sadar Penuh)</option>
              <option value="VOICE_RESPONSIVE">Voice (Respon Suara)</option>
              <option value="PAIN_RESPONSIVE">Pain (Respon Nyeri)</option>
              <option value="UNRESPONSIVE">Unresponsive (Koma)</option>
            </select>
          </div>
        </div>

        {/* ─── Vital Signs ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">Tekanan Darah</label>
            <input type="text" value={`${sbp}/${dbp}`} onChange={(e) => {
              const parts = e.target.value.split('/');
              setSbp(Number(parts[0]) || 120);
              setDbp(Number(parts[1]) || 80);
            }} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" placeholder="120/80" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">Nadi (bpm)</label>
            <input type="number" value={hr} onChange={(e) => setHr(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">RR (x/mnt)</label>
            <input type="number" value={rr} onChange={(e) => setRr(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">Suhu (°C)</label>
            <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">SpO2 (%)</label>
            <input type="number" value={spo2} onChange={(e) => setSpo2(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-on-surface-variant mb-0.5">Skala Nyeri (0-10)</label>
            <input type="number" min="0" max="10" value={pain} onChange={(e) => setPain(Number(e.target.value))} className="w-full px-2 py-1.5 rounded-lg bg-surface-container border text-xs font-mono text-on-surface" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="traumaCheck" checked={isTrauma} onChange={(e) => setIsTrauma(e.target.checked)} className="rounded text-rose-600 cursor-pointer" />
          <label htmlFor="traumaCheck" className="text-xs font-bold text-on-surface cursor-pointer">Kasus Trauma / Kecelakaan Lalu Lintas (ATLS Required)</label>
        </div>

        <button type="submit" className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Simpan Penilaian Triase & Mulai Stopwatch SLA</span>
        </button>
      </form>
    </div>
  );
}
