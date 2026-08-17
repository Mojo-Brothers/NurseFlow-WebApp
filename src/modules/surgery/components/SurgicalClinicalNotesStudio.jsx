import React, { useState } from 'react';
import { generateSha256Digest } from '../../radiology/services/pacsDicomEngine.service.js';
import toast from 'react-hot-toast';

export default function SurgicalClinicalNotesStudio({ activeCase }) {
  const currentCase = activeCase || {
    id: 'CASE-SURG-001',
    bookingNumber: 'SURG-2026-0817-001',
    patientName: 'Tn. Hendra (Mr. X)',
    patientMrn: 'MRX-2026-A1',
    procedureName: 'Laparotomi Eksplorasi & Apendektomi Cito',
    primarySurgeonName: 'dr. Budi Santoso, Sp.B',
    anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI'
  };

  const [activeStage, setActiveStage] = useState('OPERATIVE_REPORT');
  const [surgeonName] = useState(currentCase.primarySurgeonName);

  // Note Contents
  const [preOpNote, setPreOpNote] = useState('Pasien rujukan IGD dengan akut abdomen suspek perforasi apendiks. Informed consent tindakan laparotomi cito telah disetujui keluarga. Puasa 6 jam terpenuhi.');
  const [operativeReport, setOperativeReport] = useState(
    '1. Pasien posisi supine dalam GA endotrakeal.\n' +
    '2. Dilakukan a & antiseptis dinding abdomen dengan Povidone Iodine 10% dan Chlorhexidine.\n' +
    '3. Insisi mediana inferior menembus kutis, subkutis, fasia, dan peritoneum.\n' +
    '4. Temuan intraoperasi: Tampak pus dan cairan bebas keruh di cavum Douglas ~150 cc, apendiks letak retrosekal gangrenosa dengan perforasi di 1/3 distal.\n' +
    '5. Dilakukan ligasi ganda mesoapendiks, apendektomi, dan invaginasi puntung apendiks (z-stitch).\n' +
    '6. Cuci cavum abdomen dengan NaCl 0.9% hangat ~2000 cc hingga jernih. Pasang drain silikon No. 24 di cavum Douglas.\n' +
    '7. Hitung kassa, jarum, dan instrumen: LENGKAP & COCOK.\n' +
    '8. Dinding abdomen dijahit lapis demi lapis, luka operasi ditutup kasa steril.'
  );
  const [postOpPlan, setPostOpPlan] = useState('1. Rawat inap bangsal bedah / observasi PACU.\n2. Infus Ringer Lactate 20 tpm.\n3. Inj. Ceftriaxone 1g/12j IV, Inj. Metronidazole 500mg/8j IV, Inj. Ketorolac 30mg/8j IV.\n4. Monitoring drainase cairan dan tanda vital berkala.');

  const [isSigned, setIsSigned] = useState(false);
  const [sigHash, setSigHash] = useState(null);

  const handleSignNote = (e) => {
    e.preventDefault();
    const payload = JSON.stringify({
      caseId: currentCase.id,
      stage: activeStage,
      surgeon: surgeonName,
      content: activeStage === 'PRE_OP' ? preOpNote : activeStage === 'OPERATIVE_REPORT' ? operativeReport : postOpPlan,
      signedAt: new Date().toISOString()
    });
    const hash = generateSha256Digest(payload);
    setSigHash(hash);
    setIsSigned(true);
    toast.success(`Laporan Klinis Bedah (${activeStage}) Berhasil Ditandatangani Secara Digital!`);
  };

  return (
    <form onSubmit={handleSignNote} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">5-Stage Surgical Clinical Records & Operative Report</h3>
            <p className="text-xs text-slate-400">
              Dokumentasi Lengkap Tindakan Bedah: <strong className="text-slate-700 dark:text-slate-200">{currentCase.procedureName}</strong>
            </p>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex-wrap font-bold">
          <button
            type="button"
            onClick={() => setActiveStage('PRE_OP')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStage === 'PRE_OP' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            1. Asesmen Pra-Bedah
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('OPERATIVE_REPORT')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStage === 'OPERATIVE_REPORT' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            2. Laporan Operasi
          </button>
          <button
            type="button"
            onClick={() => setActiveStage('POST_OP_PLAN')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStage === 'POST_OP_PLAN' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-500'
            }`}
          >
            3. Rencana Pasca-Bedah
          </button>
        </div>
      </div>

      {/* Dynamic Stage Text Area */}
      {activeStage === 'PRE_OP' && (
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Catatan Asesmen Pra-Bedah (Pre-operative Note)</label>
          <textarea
            rows={6}
            value={preOpNote}
            onChange={(e) => setPreOpNote(e.target.value)}
            className="w-full mt-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans leading-relaxed text-xs"
          />
        </div>
      )}

      {activeStage === 'OPERATIVE_REPORT' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">Laporan Operasi Lengkap (Operative Report)</label>
            <span className="text-[11px] font-mono text-indigo-600 font-bold">JCI MOI Compliant</span>
          </div>
          <textarea
            rows={10}
            value={operativeReport}
            onChange={(e) => setOperativeReport(e.target.value)}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed"
          />
        </div>
      )}

      {activeStage === 'POST_OP_PLAN' && (
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300">Instruksi & Rencana Perawatan Pasca-Bedah (Post-op Care Plan)</label>
          <textarea
            rows={6}
            value={postOpPlan}
            onChange={(e) => setPostOpPlan(e.target.value)}
            className="w-full mt-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs leading-relaxed"
          />
        </div>
      )}

      {/* Signature & Release */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600 dark:text-slate-400">Dokter Operator:</span>
          <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
            {surgeonName}
          </span>
          {isSigned && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ✔ {sigHash}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Sahkan Laporan Klinis Bedah ke EMR
        </button>
      </div>
    </form>
  );
}
