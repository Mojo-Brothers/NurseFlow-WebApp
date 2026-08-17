import React, { useState } from 'react';
import { useEncounterStore } from '../encounter.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function EncounterWorkspaceModal({ isOpen, onClose, patient, onCreated }) {
  const { openEncounter, setLiveContext } = useEncounterStore();
  const [encounterType, setEncounterType] = useState('emergency'); // 'emergency' | 'outpatient' | 'inpatient'
  const [department, setDepartment] = useState('IGD');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [attendingDoctor, setAttendingDoctor] = useState('dr. Surya Johnson, Sp.PD-KGEH');
  const [payer, setPayer] = useState(patient?.payer || 'BPJS Kesehatan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      toast.error('Keluhan utama / alasan kunjungan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const encounterId = await openEncounter({
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        encounterType,
        department,
        chiefComplaint,
        attendingDoctor,
        payer,
        status: encounterType === 'emergency' ? 'TRIAGE' : 'REGISTERED',
        triageStatus: 'PENDING'
      }, 'Petugas Admisi');

      setLiveContext(patient.id, encounterId);
      toast.success(`Kunjungan Baru (${encounterType.toUpperCase()} - ${department}) berhasil dibuka!`);

      if (onCreated) onCreated(encounterId);
      onClose();
    } catch (err) {
      toast.error(`Gagal membuka kunjungan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl flex flex-col p-6 gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">local_hospital</span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Buka Kunjungan / Encounter Baru</h2>
              <p className="text-[11px] text-slate-500">Pasien: <span className="font-bold text-slate-700 dark:text-slate-300">{patient.name}</span> ({patient.mrn})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Jenis Kunjungan (Encounter Class)</label>
              <select
                value={encounterType}
                onChange={e => {
                  setEncounterType(e.target.value);
                  if (e.target.value === 'emergency') setDepartment('IGD');
                  else if (e.target.value === 'outpatient') setDepartment('Poli Penyakit Dalam');
                  else setDepartment('Ruang Rawat Inap Melati');
                }}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="emergency">Instalasi Gawat Darurat (IGD)</option>
                <option value="outpatient">Rawat Jalan / Poliklinik</option>
                <option value="inpatient">Rawat Inap (Admisi Bangsal)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Unit Pelayanan / Lokasi</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Dokter Penanggung Jawab Pelayanan (DPJP)</label>
            <select
              value={attendingDoctor}
              onChange={e => setAttendingDoctor(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="dr. Surya Johnson, Sp.PD-KGEH">dr. Surya Johnson, Sp.PD-KGEH (Penyakit Dalam)</option>
              <option value="dr. Budi Santoso, Sp.B">dr. Budi Santoso, Sp.B (Bedah Umum/Digestif)</option>
              <option value="dr. Ratna Pertiwi, Sp.A">dr. Ratna Pertiwi, Sp.A (Anak)</option>
              <option value="dr. Ahmad, Sp.OG">dr. Ahmad, Sp.OG (Kebidanan & Kandungan)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Keluhan Utama / Alasan Masuk *</label>
            <textarea
              rows={2}
              placeholder="Contoh: Nyeri perut kanan bawah akut sejak 6 jam lalu, mual, demam 38°C"
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Penjamin Biaya Kunjungan</label>
            <select
              value={payer}
              onChange={e => setPayer(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="BPJS Kesehatan">BPJS Kesehatan (VClaim Terintegrasi)</option>
              <option value="Umum / Mandiri">Umum / Mandiri</option>
              <option value="Asuransi Swasta">Asuransi Swasta</option>
              <option value="Jasa Raharja">Jasa Raharja (Kecelakaan Lalu Lintas)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Membuka...' : 'Buka Kunjungan & Mulai Asesmen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
