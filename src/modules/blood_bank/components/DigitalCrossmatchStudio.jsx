import React, { useState } from 'react';
import { bloodBankService } from '../../../../server/services/bloodBank.service.js';
import { generateSha256Digest } from '../../radiology/services/pacsDicomEngine.service.js';
import toast from 'react-hot-toast';

export default function DigitalCrossmatchStudio() {
  const [patientMrn, setPatientMrn] = useState('MRX-2026-A1');
  const [patientAbo, setPatientAbo] = useState('A');
  const [patientRh, setPatientRh] = useState('POSITIVE');
  const [selectedUnit, setSelectedUnit] = useState('UTD-998241');
  const [donorAbo, setDonorAbo] = useState('A');
  const [donorRh, setDonorRh] = useState('POSITIVE');

  const [majorTest, setMajorTest] = useState('COMPATIBLE');
  const [minorTest, setMinorTest] = useState('COMPATIBLE');
  const [autocontrol, setAutocontrol] = useState('NEGATIVE');
  const [datCoombs, setDatCoombs] = useState('NEGATIVE');
  const [technicianName, setTechnicianName] = useState('Analis BDRS Hendro, A.Md.AK');

  const [isReleased, setIsReleased] = useState(false);
  const [certHash, setCertHash] = useState(null);

  const handlePerformCrossmatch = (e) => {
    e.preventDefault();
    try {
      const isCompatible = majorTest === 'COMPATIBLE' && minorTest === 'COMPATIBLE';
      const payload = JSON.stringify({
        patientMrn,
        patientAbo,
        selectedUnit,
        donorAbo,
        majorTest,
        minorTest,
        autocontrol,
        technicianName,
        timestamp: new Date().toISOString()
      });

      const hash = generateSha256Digest(payload);
      setCertHash(hash);
      setIsReleased(true);

      if (isCompatible) {
        toast.success(`Uji Silang Serasi Kantong ${selectedUnit} LENGKAP & KOMPATIBEL! Siap Rilis ke Ruangan.`);
      } else {
        toast.error(`HASIL INKOMPATIBEL! Kantong ${selectedUnit} DILARANG DITRANSFUSIKAN!`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handlePerformCrossmatch} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">biotech</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Digital Gel-Test Crossmatch Studio (Uji Silang Serasi)</h3>
            <p className="text-xs text-slate-400">
              Evaluasi Mayor, Minor, Autocontrol & Direct Antiglobulin Test (Coombs)
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 font-mono">
          Gel Test Column Agglutination
        </span>
      </div>

      {/* Grid: Patient vs Donor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Blood Group */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="font-black text-slate-900 dark:text-white">Data Pasien Penerima (Recipient):</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400">MRN Pasien:</label>
              <input type="text" value={patientMrn} onChange={(e) => setPatientMrn(e.target.value)} className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono" />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400">Golongan / Rhesus Pasien:</label>
              <div className="flex gap-1 mt-0.5">
                <select value={patientAbo} onChange={(e) => setPatientAbo(e.target.value)} className="w-1/2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
                <select value={patientRh} onChange={(e) => setPatientRh(e.target.value)} className="w-1/2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  <option value="POSITIVE">Rh +</option>
                  <option value="NEGATIVE">Rh -</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Donor Unit */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="font-black text-slate-900 dark:text-white">Data Kantong Darah Donor:</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400">No. Kantong:</label>
              <input type="text" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold" />
            </div>
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-400">Golongan Donor:</label>
              <div className="flex gap-1 mt-0.5">
                <select value={donorAbo} onChange={(e) => setDonorAbo(e.target.value)} className="w-1/2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
                <select value={donorRh} onChange={(e) => setDonorRh(e.target.value)} className="w-1/2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
                  <option value="POSITIVE">Rh +</option>
                  <option value="NEGATIVE">Rh -</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Phase Gel Test Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">1. Mayor Crossmatch:</label>
          <p className="text-[10px] text-slate-400">Eritrosit Donor + Serum Pasien</p>
          <select value={majorTest} onChange={(e) => setMajorTest(e.target.value)} className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
            <option value="COMPATIBLE">KOMPATIBEL (Negatif)</option>
            <option value="INCOMPATIBLE">INKOMPATIBEL (Aglutinasi +)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">2. Minor Crossmatch:</label>
          <p className="text-[10px] text-slate-400">Serum Donor + Eritrosit Pasien</p>
          <select value={minorTest} onChange={(e) => setMinorTest(e.target.value)} className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
            <option value="COMPATIBLE">KOMPATIBEL (Negatif)</option>
            <option value="INCOMPATIBLE">INKOMPATIBEL (Aglutinasi +)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">3. Autocontrol:</label>
          <p className="text-[10px] text-slate-400">Serum Pasien + Eritrosit Pasien</p>
          <select value={autocontrol} onChange={(e) => setAutocontrol(e.target.value)} className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
            <option value="NEGATIVE">NEGATIF</option>
            <option value="POSITIVE">POSITIF (Autoantibodi)</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">4. Direct Coombs (DAT):</label>
          <p className="text-[10px] text-slate-400">Skrining Antibodi Inkomplit</p>
          <select value={datCoombs} onChange={(e) => setDatCoombs(e.target.value)} className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold">
            <option value="NEGATIVE">NEGATIF</option>
            <option value="POSITIVE">POSITIF</option>
          </select>
        </div>
      </div>

      {/* Action & Certification */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label className="font-bold text-slate-700 dark:text-slate-300">Analis Lab BDRS:</label>
          <input type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]" />
          {isReleased && <span className="text-[10px] font-mono text-emerald-600 font-bold">✔ {certHash}</span>}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Finalisasi Crossmatch & Rilis Kantong Darah
        </button>
      </div>
    </form>
  );
}
