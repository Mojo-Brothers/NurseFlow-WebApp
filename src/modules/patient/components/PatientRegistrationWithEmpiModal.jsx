import React, { useState } from 'react';
import { usePatientStore } from '../patient.store.js';
import { mpiEngine } from '../../../core/services/mpiEngine.service.js';
import toast from 'react-hot-toast';

export default function PatientRegistrationWithEmpiModal({ isOpen, onClose, onRegistered }) {
  const { addPatient } = usePatientStore();

  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [gender, setGender] = useState('M');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [payer, setPayer] = useState('BPJS Kesehatan');
  const [bpjsNumber, setBpjsNumber] = useState('');
  const [allergies, setAllergies] = useState('');

  // Duplicate Check States
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');

  if (!isOpen) return null;

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama pasien wajib diisi!');
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      // 1. Run EMPI Duplicate Check
      const matches = await mpiEngine.findPotentialDuplicates({ nik, name, dob });

      if (matches.length > 0) {
        setDuplicateCandidates(matches);
        setShowDuplicateWarning(true);
        setIsCheckingDuplicates(false);
        return;
      }

      // If no duplicate -> proceed directly
      await executeRegistration();
    } catch (err) {
      toast.error(`Pengecekan gagal: ${err.message}`);
      setIsCheckingDuplicates(false);
    }
  };

  const executeRegistration = async (justificationNote = null) => {
    try {
      const allergyList = allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      const newPatient = await addPatient({
        name,
        nik,
        dob,
        gender,
        phone,
        email,
        address,
        payer,
        bpjsCardNumber: bpjsNumber || null,
        allergies: allergyList,
        auditJustification: justificationNote
      }, 'Petugas Admisi');

      toast.success(`Pasien ${newPatient.name} berhasil didaftarkan (No. RM: ${newPatient.mrn})!`);
      if (onRegistered) onRegistered(newPatient);
      handleReset();
      onClose();
    } catch (err) {
      toast.error(`Pendaftaran gagal: ${err.message}`);
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleReset = () => {
    setName('');
    setNik('');
    setDob('1990-01-01');
    setGender('M');
    setPhone('');
    setEmail('');
    setAddress('');
    setPayer('BPJS Kesehatan');
    setBpjsNumber('');
    setAllergies('');
    setDuplicateCandidates([]);
    setShowDuplicateWarning(false);
    setOverrideJustification('');
  };

  const handleUseExistingPatient = (existingPatient) => {
    toast.success(`Menggunakan identitas eksisting: ${existingPatient.name} (${existingPatient.mrn})`);
    if (onRegistered) onRegistered(existingPatient);
    handleReset();
    onClose();
  };

  const handleOverrideAndCreateNew = async () => {
    if (!overrideJustification.trim()) {
      toast.error('Justifikasi klinis / verifikasi supervisor wajib diisi sebelum membuat pasien baru!');
      return;
    }

    await executeRegistration(overrideJustification);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col p-6 gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">person_add</span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Pendaftaran Pasien Baru (EMPI Gateway)</h2>
              <p className="text-[11px] text-slate-500">Standar Permenkes No. 24/2022 & SATUSEHAT Master Patient Index</p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Duplicate Warning Dialog (EMPI Safety Gate) */}
        {showDuplicateWarning ? (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-sm">
              <span className="material-symbols-outlined text-[24px] text-amber-600">warning</span>
              <span>PERINGATAN EMPI: Kemungkinan Duplikasi Identitas Pasien Terdeteksi!</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-200">
              Sistem menemukan {duplicateCandidates.length} pasien terdaftar dengan kesamaan NIK, Nama, atau Tanggal Lahir. Untuk mencegah rekam medis ganda (*duplicate medical chart*), silakan tinjau data berikut:
            </p>

            <div className="space-y-2">
              {duplicateCandidates.map((c, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{c.patient.name}</span>
                    <span className="text-[11px] font-mono text-blue-600 block">No. RM: {c.patient.mrn}</span>
                    <span className="text-[10px] text-slate-500">DOB: {c.patient.dob} • NIK: {c.patient.nik || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-black">
                      Match: {c.confidenceScore}% ({c.reason})
                    </span>
                    <button
                      onClick={() => handleUseExistingPatient(c.patient)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-sm"
                    >
                      Gunakan Pasien Ini
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Override Option */}
            <div className="mt-2 pt-3 border-t border-amber-300 dark:border-amber-700 flex flex-col gap-2">
              <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Jika Anda yakin ini adalah individu yang BERBEDA, masukkan alasan justifikasi audit:
              </label>
              <input
                type="text"
                placeholder="Contoh: Nama sama persis namun beda orang tua / NIK diverifikasi via KTP asli"
                value={overrideJustification}
                onChange={e => setOverrideJustification(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />

              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowDuplicateWarning(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Kembali ke Form
                </button>
                <button
                  type="button"
                  onClick={handleOverrideAndCreateNew}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-600/30"
                >
                  Tetap Buat Pasien Baru (Audit Logged)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Registration Form */
          <form onSubmit={handleInitialSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nama Lengkap Pasien *</label>
                <input
                  type="text"
                  placeholder="Nama sesuai e-KTP / Paspor"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nomor Induk Kependudukan (NIK)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 Digit NIK e-KTP"
                  value={nik}
                  onChange={e => setNik(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tanggal Lahir *</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Jenis Kelamin *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="M">Laki-Laki</option>
                  <option value="F">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Penjamin Biaya *</label>
                <select
                  value={payer}
                  onChange={e => setPayer(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                  <option value="Umum / Mandiri">Umum / Mandiri</option>
                  <option value="Asuransi Swasta">Asuransi Swasta</option>
                  <option value="Jaminan Perusahaan">Jaminan Perusahaan</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nomor Kartu BPJS / Asuransi</label>
                <input
                  type="text"
                  placeholder="Contoh: 0001234567890"
                  value={bpjsNumber}
                  onChange={e => setBpjsNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Riwayat Alergi Obat / Makanan (Pisahkan koma)</label>
              <input
                type="text"
                placeholder="Contoh: Penicillin, Aspirin, Seafood"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { handleReset(); onClose(); }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isCheckingDuplicates}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isCheckingDuplicates ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memeriksa EMPI...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    <span>Daftarkan Pasien Master</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
