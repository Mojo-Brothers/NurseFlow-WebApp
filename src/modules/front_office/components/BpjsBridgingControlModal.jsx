import React, { useState } from 'react';
import { useFrontOfficeStore } from '../store/frontOffice.store.js';
import { frontOfficeApiService } from '../services/frontOfficeApi.service.js';

export default function BpjsBridgingControlModal({ registration, onClose }) {
  const { generateSep, syncTask } = useFrontOfficeStore();

  const [bpjsCard, setBpjsCard] = useState(registration?.insurance_card_number || '0001234567891');
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [referralNumber, setReferralNumber] = useState('0115B0010826P000088');
  const [diagnoseIcd10, setDiagnoseIcd10] = useState('A90');
  const [issuedSep, setIssuedSep] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckEligibility = async () => {
    setLoading(true);
    try {
      const res = await frontOfficeApiService.checkBpjsEligibility(bpjsCard);
      setEligibilityResult(res.response.peserta);
    } catch (err) {
      alert(`Gagal Cek BPJS: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSep = async () => {
    setLoading(true);
    try {
      const sep = await generateSep({
        registrationId: registration.id,
        patientId: registration.patient_id,
        patientName: registration.patient_name,
        bpjsCardNumber: bpjsCard,
        nik: registration.nik,
        referralNumber,
        treatmentType: registration.registration_type === 'RAWAT_INAP' ? '1' : '2',
        destinationPoliCode: 'INT',
        destinationPoliName: registration.department_name,
        dpjpBpjsCode: '12884',
        dpjpName: registration.doctor_name,
        primaryDiagnoseIcd10: diagnoseIcd10,
        primaryDiagnoseName: 'Dengue fever'
      });
      setIssuedSep(sep);

      // Auto sync Task 2 (Selesai Pelayanan Admisi)
      await syncTask({
        bookingCode: `APT-${registration.mrn}`,
        taskId: 2,
        taskTimeEpochMs: Date.now()
      });

      alert(`SEP berhasil diterbitkan: ${sep.sep_number}`);
    } catch (err) {
      alert(`Gagal Terbitkan SEP: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-2xl border border-outline-variant/30 space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">verified_user</span>
            <h3 className="text-sm font-headline font-black text-on-surface uppercase tracking-wider">
              Pusat Bridging BPJS V-Claim 2.0 & Cetak SEP
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={bpjsCard}
              onChange={(e) => setBpjsCard(e.target.value)}
              placeholder="Masukkan 13 Digit No. Kartu BPJS..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
            />
            <button
              onClick={handleCheckEligibility}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
            >
              Cek Eligibilitas
            </button>
          </div>

          {eligibilityResult && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Status: {eligibilityResult.statusPeserta.keterangan}</span>
                <span className="font-mono font-bold text-on-surface">{eligibilityResult.hakKelas.keterangan}</span>
              </div>
              <p className="text-on-surface">Nama: <strong>{eligibilityResult.nama}</strong> &bull; NIK: {eligibilityResult.nik}</p>
              <p className="text-on-surface-variant">Faskes Perujuk: {eligibilityResult.provUmum.nmProvider}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nomor Rujukan Faskes 1</label>
              <input
                type="text"
                value={referralNumber}
                onChange={(e) => setReferralNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Diagnosa Awal (ICD-10)</label>
              <input
                type="text"
                value={diagnoseIcd10}
                onChange={(e) => setDiagnoseIcd10(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
              />
            </div>
          </div>

          {issuedSep && (
            <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/30 font-mono text-xs space-y-1">
              <p className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-300">SEP BERHASIL DITERBITKAN:</p>
              <p className="text-base font-black text-teal-600">{issuedSep.sep_number}</p>
              <p className="text-on-surface text-[11px]">Poli: {issuedSep.destination_poli_name} &bull; DPJP: {issuedSep.dpjp_name}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface cursor-pointer">
            Tutup
          </button>
          <button
            onClick={handleGenerateSep}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Terbitkan SEP Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
