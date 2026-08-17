import React, { useState, useEffect } from 'react';
import { soapEngineService } from '../../emr/services/soapEngine.service.js';
import { diagnosisEngineService } from '../../emr/services/diagnosisEngine.service.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import PatientJourneyTimeline from '../../patient/components/PatientJourneyTimeline.jsx';
import ClinicalDecisionSupportCard from './ClinicalDecisionSupportCard.jsx';
import UniversalOrderModal from './UniversalOrderModal.jsx';
import toast from 'react-hot-toast';

export default function DoctorSoapWorkspace({ patient, encounter, onSaved }) {
  const { setLiveContext } = useEncounterStore();

  // SOAP Form Fields
  const [subjective, setSubjective] = useState('Pasien mengeluh demam tinggi sejak 3 hari lalu disertai menggigil, mual, dan badan lemas.');
  const [objectiveVitals, setObjectiveVitals] = useState({
    hr: 104,
    sbp: 100,
    dbp: 70,
    rr: 22,
    spo2: 96,
    temp: 38.6,
    gcs: 15
  });
  const [physicalExam, setPhysicalExam] = useState('Kepala: Konjungtiva anemis (-), Sklera ikterik (-)\nThoraks: Cor S1-S2 reguler murmur (-), Pulmo vesikuler (+/+)\nAbdomen: Supel, bising usus normal, nyeri tekan epigastrium (+)\nEkstremitas: Akral hangat, CRT < 2 detik');
  
  // Assessment
  const [primaryIcd10, setPrimaryIcd10] = useState('A90');
  const [primaryIcd10Name, setPrimaryIcd10Name] = useState('Dengue fever [classical dengue]');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState('R50.9 - Fever, unspecified');

  // Plan & Disposition
  const [plan, setPlan] = useState('1. Infus Ringer Lactate 2000 ml / 24 jam\n2. Cek Darah Lengkap per 12 jam serial\n3. Paracetamol 500 mg tab 3x1 p.r.n demam\n4. Edukasi istirahat tirah baring & minum air 2.5L/hari');
  const [disposition, setDisposition] = useState('INPATIENT_ADMISSION'); // 'OUTPATIENT_DISCHARGE' | 'INPATIENT_ADMISSION' | 'ICU_TRANSFER' | 'SURGERY_CITO' | 'REFERRAL'

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        Pilih pasien terlebih dahulu dari antrean untuk membuka Doctor Consultation Workspace.
      </div>
    );
  }

  const handleSaveSoap = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const record = await soapEngineService.recordSoapNote({
        episodeId: encounter?.episodeId || 'EOC-2026-001',
        encounterId: encounter?.id || 'ENC-2026-001',
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        subjective,
        objective: `TTV: TD ${objectiveVitals.sbp}/${objectiveVitals.dbp} mmHg, HR ${objectiveVitals.hr} bpm, RR ${objectiveVitals.rr} x/m, Temp ${objectiveVitals.temp}°C, SpO2 ${objectiveVitals.spo2}%, GCS ${objectiveVitals.gcs}.\n\nPemeriksaan Fisik:\n${physicalExam}`,
        assessment: `${primaryIcd10} - ${primaryIcd10Name}. ${secondaryDiagnoses}`,
        plan,
        primaryIcd10,
        primaryIcd10Name,
        secondaryIcd10: [{ code: 'R50.9', name: 'Fever, unspecified' }],
        physicianId: 'DOC-1001',
        physicianName: 'dr. Surya Johnson, Sp.PD-KGEH'
      });

      toast.success('✅ Rekam Medis Elektronik CPPT / SOAP berhasil disimpan & ditandatangani secara digital!');
      if (onSaved) onSaved(record);
    } catch (err) {
      toast.error(`Gagal menyimpan CPPT: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCdss = (orders) => {
    toast.success(`💡 ${orders.length} order protokol CDSS otomatis ditambahkan ke draf rencana terapi!`);
    setPlan(prev => `${prev}\n\n[CDSS Protokol Terapan]:\n- Diterbitkan paket order terstandar (${orders.join(', ')})`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      {/* Left 8 Cols: SOAP Workspace */}
      <div className="lg:col-span-8 flex flex-col gap-5">
        {/* Patient Identity Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[24px]">person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">{patient.name}</h2>
                <span className="text-xs font-mono text-cyan-300">({patient.mrn})</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-cyan-200 text-[10px] font-black uppercase">
                  {patient.gender === 'F' ? 'Perempuan' : 'Laki-Laki'}
                </span>
              </div>
              <p className="text-xs text-blue-200">DPJP: dr. Surya Johnson, Sp.PD-KGEH • Penjamin: {patient.payer || 'BPJS Kesehatan'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/30 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
              <span>+ Terbitkan Order Klinis</span>
            </button>
          </div>
        </div>

        {/* CDSS Assistant Banner */}
        <ClinicalDecisionSupportCard
          diagnosis={primaryIcd10Name}
          vitals={objectiveVitals}
          onApplyProtocol={handleApplyCdss}
        />

        {/* SOAP Form */}
        <form onSubmit={handleSaveSoap} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">clinical_notes</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Formulir Catatan Perkembangan Pasien Terintegrasi (CPPT / SOAP)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              STANDAR PERMENKES 24/2022
            </span>
          </div>

          {/* S - Subjective */}
          <div>
            <label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>S — SUBJECTIVE (Keluhan Utama, Anamnesis, Riwayat Penyakit)</span>
            </label>
            <textarea
              rows={3}
              value={subjective}
              onChange={e => setSubjective(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* O - Objective */}
          <div>
            <label className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <span>O — OBJECTIVE (Pemeriksaan Fisik & Tanda Vital Terverifikasi)</span>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 my-1.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 text-center font-mono text-[11px]">
              <div><span className="text-slate-400 block text-[9px]">TD</span><span className="font-bold">{objectiveVitals.sbp}/{objectiveVitals.dbp}</span></div>
              <div><span className="text-slate-400 block text-[9px]">NADI</span><span className="font-bold">{objectiveVitals.hr} bpm</span></div>
              <div><span className="text-slate-400 block text-[9px]">NAPAS</span><span className="font-bold">{objectiveVitals.rr} x/m</span></div>
              <div><span className="text-slate-400 block text-[9px]">SUHU</span><span className="font-bold text-rose-500">{objectiveVitals.temp}°C</span></div>
              <div><span className="text-slate-400 block text-[9px]">SPO2</span><span className="font-bold">{objectiveVitals.spo2}%</span></div>
              <div><span className="text-slate-400 block text-[9px]">GCS</span><span className="font-bold">{objectiveVitals.gcs}</span></div>
            </div>
            <textarea
              rows={3}
              value={physicalExam}
              onChange={e => setPhysicalExam(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>

          {/* A - Assessment */}
          <div>
            <label className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>A — ASSESSMENT (Diagnosis Kerja & ICD-10)</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <div>
                <select
                  value={primaryIcd10}
                  onChange={e => {
                    setPrimaryIcd10(e.target.value);
                    if (e.target.value === 'A90') setPrimaryIcd10Name('Dengue fever [classical dengue]');
                    else if (e.target.value === 'A41.9') setPrimaryIcd10Name('Sepsis, unspecified organism');
                    else if (e.target.value === 'I21.9') setPrimaryIcd10Name('Acute myocardial infarction, unspecified (STEMI)');
                    else if (e.target.value === 'K35.8') setPrimaryIcd10Name('Acute appendicitis');
                  }}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="A90">A90 - Dengue fever [classical dengue]</option>
                  <option value="A41.9">A41.9 - Sepsis, unspecified organism</option>
                  <option value="I21.9">I21.9 - Acute myocardial infarction (STEMI)</option>
                  <option value="K35.8">K35.8 - Acute appendicitis</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={secondaryDiagnoses}
                  onChange={e => setSecondaryDiagnoses(e.target.value)}
                  placeholder="Diagnosis Sekunder (Komorbiditas)"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* P - Plan */}
          <div>
            <label className="text-[11px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
              <span>P — PLAN (Instruksi Medis, Rencana Terapi & Edukasi)</span>
            </label>
            <textarea
              rows={4}
              value={plan}
              onChange={e => setPlan(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              required
            />
          </div>

          {/* Disposition Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">Disposisi Pasien (Clinical Outcome)</span>
              <p className="text-[10px] text-slate-500">Tentukan kelanjutan alur perawatan pasien pasca asesmen DPJP</p>
            </div>

            <select
              value={disposition}
              onChange={e => setDisposition(e.target.value)}
              className="px-3 py-2 text-xs font-black rounded-xl border border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="INPATIENT_ADMISSION">🏥 Admisi Rawat Inap (Bangsal Melati / Mawar)</option>
              <option value="OUTPATIENT_DISCHARGE">🏠 Rawat Jalan (Boleh Pulang / Kontrol Poli)</option>
              <option value="ICU_TRANSFER">🚨 Transfer ICU (Perawatan Kritis Intensif)</option>
              <option value="SURGERY_CITO">🔪 Operasi Cito Kamar Bedah (IBS)</option>
              <option value="REFERRAL">🚑 Rujuk ke RS Tingkat Lebih Tinggi</option>
            </select>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-400 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Tambah Order Laboratorium / Radiologi / Obat</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isSaving ? 'Menyimpan CPPT...' : 'Tandatangani & Simpan CPPT (SOAP)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right 4 Cols: Live Clinical Timeline */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <PatientJourneyTimeline
          patient={patient}
          encounter={encounter}
        />
      </div>

      {/* Universal Order Modal */}
      <UniversalOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        patient={patient}
        encounter={encounter}
        onOrderPlaced={(newOrder) => {
          setPlan(prev => `${prev}\n- ${newOrder.order_category}: ${newOrder.order_number} (${newOrder.clinical_indication})`);
        }}
      />
    </div>
  );
}
