import React, { useState } from 'react';
import { REACTION_TYPES } from '../constants/bloodBank.constants.js';
import { apiClient } from '../../../core/apiClient.js';
import toast from 'react-hot-toast';

export default function BedsideTransfusionVerificationStudio() {
  const [patientMrn, setPatientMrn] = useState('MRX-2026-A1');
  const [patientName] = useState('Tn. Hendra (Mr. X)');
  const [patientBloodGroup, setPatientBloodGroup] = useState('A Rh+');
  const [unitNumber, setUnitNumber] = useState('UTD-998241');
  const [donorGroup, setDonorGroup] = useState('A Rh+');

  const [primaryNurse, setPrimaryNurse] = useState('Ns. Ratna, S.Kep (SIPA: 2024/NRS/01)');
  const [secondaryNurse, setSecondaryNurse] = useState('Ns. Joko, S.Kep (SIPA: 2023/NRS/09)');

  const [transfusionActive, setTransfusionActive] = useState(false);
  const [verifRecord, setVerifRecord] = useState(null);
  const [reactionTriggered, setReactionTriggered] = useState(false);

  // MTP States
  const [shockIndex, setShockIndex] = useState(1.25);
  const [mtpActive, setMtpActive] = useState(false);

  const handleStartTransfusion = (e) => {
    e.preventDefault();
    try {
      const record = bloodBankEnterpriseEngineService.verifyBedsideTransfusion({
        unitNumber,
        encounterId: 'ENC-2026-003',
        patientMrn,
        patientBloodGroup,
        donorUnitBloodGroup: donorGroup,
        preVitals: { bp: '110/70', hr: 88, tempCelsius: 36.8, spo2: 99 },
        primaryNurse: { id: 'NRS-01', name: primaryNurse },
        secondaryNurse: { id: 'NRS-02', name: secondaryNurse }
      });

      setVerifRecord(record);
      setTransfusionActive(true);
      toast.success(`Verifikasi 2 Perawat Berhasil! Transfusi Kantong ${unitNumber} Dimulai.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEmergencyStop = () => {
    if (!verifRecord) return;
    try {
      const incident = bloodBankEnterpriseEngineService.reportTransfusionReaction({
        verificationId: verifRecord.id,
        patientMrn,
        unitNumber,
        reactionType: REACTION_TYPES.ACUTE_HEMOLYTIC,
        symptoms: 'Demam menggigil tinggi 39.1C, dispneu, hipotensi, nyeri lumbal',
        reportedBy: primaryNurse
      });

      setReactionTriggered(true);
      setTransfusionActive(false);
      toast.error('🚨 TRANSFUSI DIHENTIKAN SEGERA! Flush NaCl 0.9% aktif & Sampel investigasi dikirim ke BDRS.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleActivateMtp = () => {
    try {
      const session = bloodBankEnterpriseEngineService.activateMtp({
        encounterId: 'ENC-2026-003',
        patientMrn,
        patientName,
        indication: 'HEMORRHAGIC_SHOCK',
        shockIndex,
        estimatedBloodLossMl: 2500
      });

      setMtpActive(true);
      toast.success(`PROTOKOL TRANSFUSI MASIF (MTP) DIAKTIFKAN! Rilis Cepat 1:1:1 (4 PRC : 4 FFP : 4 TC).`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Bedside Transfusion Dual Nurse Verification (JCI IPSG 1)</h3>
            <p className="text-xs text-slate-400">
              Verifikasi Samping Tempat Tidur 2 Perawat, Pemantauan 15 Menit & Protokol Transfusi Masif (MTP)
            </p>
          </div>
        </div>

        {/* MTP Trigger Pill */}
        <button
          type="button"
          onClick={handleActivateMtp}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            mtpActive
              ? 'bg-rose-600 text-white shadow-lg animate-pulse'
              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">emergency_share</span>
          <span>{mtpActive ? 'MTP AKTIF: 1:1:1 PAKET DIRILIS' : 'Aktivasi Massive Transfusion (MTP)'}</span>
        </button>
      </div>

      {/* Grid: 1. Bedside Verification Form vs 2. Live Transfusion Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Form */}
        <form onSubmit={handleStartTransfusion} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
          <span className="font-black text-slate-900 dark:text-white">Verifikasi Identitas & Kantong Darah:</span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Pasien:</label>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                {patientName} ({patientMrn})
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Golongan Darah Pasien:</label>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black font-mono">
                {patientBloodGroup}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">No. Barcode Kantong Darah:</label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Golongan Darah Kantong Donor:</label>
              <input
                type="text"
                value={donorGroup}
                onChange={(e) => setDonorGroup(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Perawat 1 (Pemberi Transfusi):</label>
            <input
              type="text"
              value={primaryNurse}
              onChange={(e) => setPrimaryNurse(e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Perawat 2 (Saksi / Verifikator Independen):</label>
            <input
              type="text"
              value={secondaryNurse}
              onChange={(e) => setSecondaryNurse(e.target.value)}
              className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
            />
          </div>

          <button
            type="submit"
            disabled={transfusionActive}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">play_circle</span>
            Sahkan Dual Sign-Off & Mulai Transfusi
          </button>
        </form>

        {/* Live Observation Monitor & Emergency STOP */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-800 pb-2">
              <span className="font-black text-rose-900 dark:text-rose-300">Status & Monitoring Observasi 15 Menit</span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                transfusionActive ? 'bg-emerald-600 text-white animate-pulse' : reactionTriggered ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {transfusionActive ? 'SEDANG TRANSFUSI' : reactionTriggered ? 'STOPPED (REAKSI TRANSFUSI)' : 'STANDBY'}
              </span>
            </div>

            {verifRecord ? (
              <div className="space-y-2 mt-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">Tanda Vital Pra-Transfusi:</div>
                  <div className="grid grid-cols-4 gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <div>TD: {verifRecord.preVitals.bp}</div>
                    <div>HR: {verifRecord.preVitals.hr} x/m</div>
                    <div>Suhu: {verifRecord.preVitals.tempCelsius}°C</div>
                    <div>SpO2: {verifRecord.preVitals.spo2}%</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500">
                  Signature SHA-256: <span className="font-bold text-emerald-600">{verifRecord.dualSignatureHash}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                Lakukan verifikasi dua perawat di sebelah kiri untuk mengaktifkan pemantauan real-time transfusi darah.
              </div>
            )}
          </div>

          {transfusionActive && (
            <button
              type="button"
              onClick={handleEmergencyStop}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-lg shadow-rose-900/50 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              🚨 STOP TRANSFUSI SEGERA (Reaksi Hemolitik / Alergi Akut)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
