import React, { useState } from 'react';
import { lisPacsEngineService, VACUTAINER_TUBES } from '../../../../server/services/lisPacsEngine.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function SpecimenAccessioningStudio({ onSpecimenSelected }) {
  const { selectedPatient, patients } = usePatientStore();
  const activePatient = selectedPatient || patients[0] || null;

  const [selectedTube, setSelectedTube] = useState('PURPLE_EDTA');
  const [patientId, setPatientId] = useState(activePatient?.id || '');
  const [patientMrn, setPatientMrn] = useState(activePatient?.mrn || '');
  const [patientName, setPatientName] = useState(activePatient?.name || '');
  const [phlebotomistName, setPhlebotomistName] = useState('Analis Rina, A.Md.AK');
  const [collectionSite, setCollectionSite] = useState('Vena Fossa Cubiti Dextra');

  const [activeSpecimens, setActiveSpecimens] = useState([]);

  const handleCreateSpecimen = (e) => {
    e.preventDefault();
    const newSpecimen = lisPacsEngineService.collectSpecimen({
      orderId: `ORD-${Date.now()}`,
      encounterId: 'ENC-2026-001',
      patientId,
      patientMrn,
      specimenType: VACUTAINER_TUBES[selectedTube].additive,
      vacutainerTubeColor: selectedTube,
      phlebotomistName,
      collectionSite
    });

    const newDisplay = {
      barcode: newSpecimen.specimenBarcode,
      patientName,
      mrn: patientMrn,
      tube: selectedTube,
      tubeName: VACUTAINER_TUBES[selectedTube].target,
      testName: VACUTAINER_TUBES[selectedTube].target,
      status: 'COLLECTED',
      collectedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      temperature: '4.0°C'
    };

    setActiveSpecimens(prev => [newDisplay, ...prev]);
    toast.success(`Spesimen ${newSpecimen.specimenBarcode} Berhasil Diambil & Diberi Barcode!`);
  };

  const handleReceiveInLab = (specimen) => {
    try {
      lisPacsEngineService.receiveSpecimenInLab({
        specimenBarcode: specimen.barcode,
        receivingAnalystName: 'Analis Budi, S.Tr.Kes',
        transportTemperatureCelsius: 4.0
      });

      setActiveSpecimens(prev => prev.map(s => s.barcode === specimen.barcode ? { ...s, status: 'RECEIVED_IN_LAB' } : s));
      toast.success(`Spesimen ${specimen.barcode} Diterima di Lab Sentral (Accessioned)!`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* SECTION 1: PHLEBOTOMY & VACUTAINER COLOR PICKER */}
      <form onSubmit={handleCreateSpecimen} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[24px]">colorize</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Pengambilan Spesimen & Pelabelan Barcode (Phlebotomy Station)
              </h3>
              <p className="text-xs text-slate-400">Verifikasi tabung vacutainer & pencetakan label barcode tahan dingin</p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-500/30 text-teal-600 dark:text-teal-300 font-bold">
            ISO 15189 Standard
          </span>
        </div>

        {/* Vacutainer Tube Selector */}
        <div>
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 block">Pilih Tabung Vacutainer Sesuai Parameter Uji:</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {Object.entries(VACUTAINER_TUBES).map(([key, tube]) => (
              <div
                key={key}
                onClick={() => setSelectedTube(key)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  selectedTube === key
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-4 h-4 rounded-full ${
                    tube.color === 'PURPLE' ? 'bg-purple-600' :
                    tube.color === 'YELLOW' ? 'bg-amber-400' :
                    tube.color === 'BLUE' ? 'bg-blue-500' :
                    tube.color === 'GREEN' ? 'bg-emerald-500' : 'bg-rose-600'
                  }`} />
                  <span className="text-[9px] font-mono text-slate-400 font-bold">{tube.department}</span>
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white leading-tight">{tube.target}</div>
                <div className="text-[10px] text-slate-500">{tube.additive}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Phlebotomy Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Identitas Pasien</label>
            <input
              type="text"
              value={`${patientName} (${patientMrn})`}
              readOnly
              className="w-full mt-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Lokasi Pengambilan (Site)</label>
            <input
              type="text"
              value={collectionSite}
              onChange={(e) => setCollectionSite(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Petugas Flebotomis</label>
            <input
              type="text"
              value={phlebotomistName}
              onChange={(e) => setPhlebotomistName(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            Ambil Spesimen & Cetak Label Barcode
          </button>
        </div>
      </form>

      {/* SECTION 2: ACCESSIONING TABLE & SPECIMEN TRACKING */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">inventory</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Daftar Lacak Spesimen & Penerimaan Lab (Accessioning)</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{activeSpecimens.length} Spesimen Aktif</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {activeSpecimens.map(spec => (
            <div key={spec.barcode} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-black text-teal-600 dark:text-teal-400 text-xs">
                  {spec.barcode.slice(-4)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 dark:text-white">{spec.barcode}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{spec.patientName}</span>
                    <span className="text-slate-400 font-mono">({spec.mrn})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {spec.testName} • Pengambilan: {spec.collectedAt} • Suhu: <span className="font-mono font-bold text-teal-600">{spec.temperature}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                  spec.status === 'RECEIVED_IN_LAB' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                  'bg-blue-50 dark:bg-blue-950 border border-blue-400 text-blue-600 dark:text-cyan-300'
                }`}>
                  {spec.status === 'RECEIVED_IN_LAB' ? '✓ Diterima di Lab' : '🕒 Terambil (In-Transit)'}
                </span>

                {spec.status === 'COLLECTED' ? (
                  <button
                    onClick={() => handleReceiveInLab(spec)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Terima di Lab
                  </button>
                ) : (
                  <button
                    onClick={() => onSpecimenSelected && onSpecimenSelected(spec)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <span>Input Hasil</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
