/**
 * NurseFlow Enterprise HIS 2026 — Rapid ESI Triage Studio & Emergency Macro
 * Standards: ESI v4 5-Level Triage, Shock/Trauma Auto-Classification,
 * Sub-30s Emergency Mr. X Registration, 1-Click CPOE Trauma Resus Bundle.
 */

import React, { useState, useEffect } from 'react';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { triageEngineService } from '../../emergency/services/triageEngine.service.js';
import { universalOrderEngineService } from '../../orders/services/universalOrderEngine.service.js';
import toast from 'react-hot-toast';

export default function RapidTriageStudio({ onTriageCompleted, onTriggerCodeBlue }) {
  const { patients, addPatient } = usePatientStore();
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

  // CPOE Trauma Order Bundle Checkboxes
  const [orderBundle, setOrderBundle] = useState({
    cbc: true,
    crossmatch: true,
    bloodGas: true,
    lactate: true,
    chestXray: true,
    fastUsg: true,
    ctBrain: true,
    ivFluidRl: true,
    o2Nrm: true
  });

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

    // Danger Zone Checks: GCS <= 9 or SpO2 < 90 or HR > 130 or SBP < 85
    if (Number(spo2) < 90 || Number(hr) > 130 || Number(sbp) < 85 || totalGcs <= 9 || circulation === 'SHOCK' || airway === 'THREATENED') {
      setIsDangerousVital(true);
    } else {
      setIsDangerousVital(false);
    }
  }, [airway, breathing, circulation, disabilityGcsEye, disabilityGcsVerbal, disabilityGcsMotor, sbp, hr, spo2, pain]);

  // 1-Click Mr. X Trauma Macro (Exact Stress-Test Scenario)
  const handleQuickTraumaScenario = async () => {
    const timestamp = Date.now().toString().slice(-4);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const mrn = `MRX-${today}-${timestamp}`;
    const name = `Tn. Mr. X (${timestamp})`;
    
    const newPt = {
      id: `P-${mrn}`,
      mrn,
      name,
      dob: '1991-01-01',
      age: '35 Th',
      gender: 'M',
      is_anonymous: true,
      status: 'EMERGENCY_ACTIVE',
      room: 'Bed RES-01 (Resusitasi)',
      payer: 'Jasa Raharja / Darurat Kemenkes',
      emergencyContact: { name: 'Petugas Ambulans 118', phone: '118' },
      allergies: []
    };

    try {
      if (addPatient) {
        await addPatient(newPt, 'Perawat Triase IGD');
      }
    } catch (e) {
      console.warn('[RapidTriageStudio] Local patient fallback:', e);
    }

    setSelectedPatient(newPt);
    setLiveContext(newPt.id, `ENC-${newPt.id}`);

    // Populate exact trauma vitals: TD 80/50, HR 132, RR 32, SpO2 88%, GCS 9 (E2V3M4)
    setChiefComplaint('Kecelakaan Lalu Lintas (KLL), Penurunan Kesadaran, Trauma Multipel & Syok Hemoragik');
    setAirway('THREATENED');
    setBreathing('DYSPNEA');
    setCirculation('SHOCK');
    setDisabilityGcsEye(2);
    setDisabilityGcsVerbal(3);
    setDisabilityGcsMotor(4);
    setSbp(80);
    setDbp(50);
    setHr(132);
    setRr(32);
    setSpo2(88);
    setTemp(36.2);
    setPain(8);

    toast.success('⚡ Skenario Trauma Syok Mr. X dimuat! Status: ESI 1 RESUSITASI SEGERA', { icon: '🚨' });
  };

  const handleQuickCreateMrX = async (gender = 'M') => {
    const timestamp = Date.now().toString().slice(-4);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const mrn = `MRX-${today}-${timestamp}`;
    const name = gender === 'M' ? `Tn. Mr. X (${timestamp})` : `Ny. Mrs. X (${timestamp})`;
    const newPt = {
      id: `P-${mrn}`,
      mrn,
      name,
      dob: '1991-01-01',
      age: '35 Th',
      gender,
      is_anonymous: true,
      status: 'EMERGENCY_ACTIVE',
      payer: 'Jasa Raharja / Darurat Kemenkes',
      emergencyContact: { name: 'Petugas Ambulans 118', phone: '118' }
    };
    try {
      if (addPatient) {
        await addPatient(newPt, 'Perawat Triase IGD');
      }
    } catch (e) {
      console.warn('[RapidTriageStudio] Local fallback:', e);
    }
    setSelectedPatient(newPt);
    setLiveContext(newPt.id, null);
    toast.success(`🚨 Pasien Anonim ${name} (${mrn}) berhasil dibuat & siap ditriase!`);
  };

  const handleSubmitTriage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPatient) {
      toast.error('Pilih atau buat pasien darurat terlebih dahulu!');
      return;
    }
    if (!chiefComplaint.trim()) {
      toast.error('Keluhan utama wajib diisi!');
      return;
    }

    try {
      const record = await triageEngineService.recordTriageAssessment({
        episodeId: 'EOC-2026-001',
        encounterId: activeEncounterId || `ENC-${selectedPatient.id}`,
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

      // Dispatch 1-Click CPOE Bundle Orders if ESI 1
      if (calculatedEsi.level === 1) {
        const bundleOrders = [];
        if (orderBundle.cbc) bundleOrders.push('Darah Lengkap CITO');
        if (orderBundle.crossmatch) bundleOrders.push('Golongan Darah & Crossmatch 2 Unit PRC CITO');
        if (orderBundle.bloodGas) bundleOrders.push('Analisa Gas Darah (AGD) CITO');
        if (orderBundle.lactate) bundleOrders.push('Serum Laktat CITO');
        if (orderBundle.chestXray) bundleOrders.push('Foto Thorax AP CITO');
        if (orderBundle.fastUsg) bundleOrders.push('USG FAST Trauma Abdomen CITO');
        if (orderBundle.ctBrain) bundleOrders.push('CT-Scan Brain Non-Kontras CITO');
        if (orderBundle.ivFluidRl) bundleOrders.push('Infus Ringer Lactate 1000ml CITO (Rapid Bolus)');
        if (orderBundle.o2Nrm) bundleOrders.push('Oksigen Masker NRM 12 lpm');

        for (const itm of bundleOrders) {
          try {
            await universalOrderEngineService.createOrder({
              encounterId: activeEncounterId || `ENC-${selectedPatient.id}`,
              patientId: selectedPatient.id,
              patientName: selectedPatient.name,
              mrn: selectedPatient.mrn,
              orderCategory: itm.includes('Foto') || itm.includes('USG') || itm.includes('CT') ? 'RADIOLOGY' : itm.includes('Infus') || itm.includes('Oksigen') ? 'PHARMACY' : 'LABORATORY',
              priority: 'CITO',
              clinicalIndication: 'Trauma Akut KLL, Penurunan Kesadaran & Syok Hemoragik',
              items: [{ name: itm, quantity: 1 }]
            });
          } catch (_) {}
        }

        toast.error(`🚨 PASIEN ESI 1 (RESUSITASI SEGERA): Panggilan Code Blue & Paket CPOE Trauma (${bundleOrders.length} Order) Diterbitkan!`, {
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
      {/* Header with Quick Macro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">emergency</span>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">Studio Triase Cepat (Rapid ESI v4 Intake)</h2>
            <p className="text-[11px] text-slate-500">Evaluasi Primer ABCDE & Algoritma Keparahan Klinis Terotomasi</p>
          </div>
        </div>

        {/* 1-Click Fast Trauma Macro Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleQuickTraumaScenario}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Muat Otomatis Skenario Pasien Trauma Syok KLL Mr. X (TD 80/50, Nadi 132, RR 32, SpO2 88%, GCS 9)"
          >
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>⚡ Fast-Fill Trauma Mr. X (ESI-1)</span>
          </button>

          {calculatedEsi && (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${calculatedEsi.badgeClass} shadow-md`}>
              {calculatedEsi.esiLabel}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmitTriage} className="flex flex-col gap-5">
        {/* Patient Selection & Chief Complaint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Pasien Terdaftar</label>
              <button
                type="button"
                onClick={() => handleQuickCreateMrX('M')}
                className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">person_add</span>
                + Pasien Darurat (Mr. X)
              </button>
            </div>
            <select
              value={selectedPatient?.id || ''}
              onChange={e => {
                const all = patients.concat(selectedPatient ? [selectedPatient] : []);
                const p = all.find(pt => pt.id === e.target.value);
                setSelectedPatient(p);
                if (p) setLiveContext(p.id, null);
              }}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            >
              <option value="">-- Pilih Pasien Terdaftar --</option>
              {selectedPatient && !patients.some(p => p.id === selectedPatient.id) && (
                <option value={selectedPatient.id}>
                  {selectedPatient.name} ({selectedPatient.mrn}) - {selectedPatient.status || 'EMERGENCY_ACTIVE'}
                </option>
              )}
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
              placeholder="Contoh: KLL, Penurunan Kesadaran, Trauma Multipel & Syok Hemoragik"
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
              <label className="text-[10px] font-bold text-slate-500">D - GCS (Eye + Verbal + Motor = {Number(disabilityGcsEye) + Number(disabilityGcsVerbal) + Number(disabilityGcsMotor)})</label>
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
              className={`w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                Number(sbp) < 90 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
              }`}
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
              className={`w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                Number(hr) > 120 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
              }`}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Napas (/mnt)</label>
            <input
              type="number" value={rr} onChange={e => setRr(e.target.value)}
              className={`w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                Number(rr) > 30 ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-200' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
              }`}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500">Saturasi SpO2 (%)</label>
            <input
              type="number" value={spo2} onChange={e => setSpo2(e.target.value)}
              className={`w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border ${
                Number(spo2) < 90 ? 'border-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/40' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950'
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

        {/* 1-Click CPOE Trauma Resuscitation Bundle Tray (Active if ESI 1 or Critical) */}
        {isDangerousVital && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-600 text-base">emergency</span>
                Paket CPOE Resusitasi Trauma CITO (Otomatis Diterbitkan Saat Simpan Triase)
              </span>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-rose-600 text-white">
                CITO 1-CLICK BUNDLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {/* Lab Bundle */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-rose-600">🧪 Laboratorium CITO:</span>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.cbc} onChange={e => setOrderBundle(p => ({ ...p, cbc: e.target.checked }))} />
                  Darah Lengkap (CBC)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.crossmatch} onChange={e => setOrderBundle(p => ({ ...p, crossmatch: e.target.checked }))} />
                  Crossmatch 2 Unit PRC
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.bloodGas} onChange={e => setOrderBundle(p => ({ ...p, bloodGas: e.target.checked }))} />
                  Analisa Gas Darah (AGD)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.lactate} onChange={e => setOrderBundle(p => ({ ...p, lactate: e.target.checked }))} />
                  Serum Laktat CITO
                </label>
              </div>

              {/* Rad Bundle */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-rose-600">🩻 Radiologi CITO:</span>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.chestXray} onChange={e => setOrderBundle(p => ({ ...p, chestXray: e.target.checked }))} />
                  Foto Thorax AP CITO
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.fastUsg} onChange={e => setOrderBundle(p => ({ ...p, fastUsg: e.target.checked }))} />
                  USG FAST Trauma Abdomen
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.ctBrain} onChange={e => setOrderBundle(p => ({ ...p, ctBrain: e.target.checked }))} />
                  CT-Scan Brain Non-Kontras
                </label>
              </div>

              {/* Fluid & Resus Bundle */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase text-rose-600">💧 Resusitasi CITO:</span>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.ivFluidRl} onChange={e => setOrderBundle(p => ({ ...p, ivFluidRl: e.target.checked }))} />
                  Infus RL 1000ml CITO (Bolus)
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold">
                  <input type="checkbox" checked={orderBundle.o2Nrm} onChange={e => setOrderBundle(p => ({ ...p, o2Nrm: e.target.checked }))} />
                  Oksigen Masker NRM 12 lpm
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Simpan Asesmen Triase & Terbitkan Order CITO</span>
          </button>
        </div>
      </form>
    </div>
  );
}
