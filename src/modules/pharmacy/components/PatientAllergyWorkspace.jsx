import React, { useState, useEffect } from 'react';
import { patientAllergyService } from '../../../../server/services/patientAllergy.service.js';

export default function PatientAllergyWorkspace({ patientId = 'P-101' }) {
  const [allergies, setAllergies] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    allergenType: 'MEDICATION',
    allergenCode: 'PENICILLIN_DERIVATIVE',
    allergenName: 'Penicillin & Derivat',
    reactionDescription: 'Syok Anafilaktik, Urtikaria Akut',
    severity: 'SEVERE_ANAPHYLAXIS',
    verificationStatus: 'CONFIRMED'
  });

  const loadAllergies = async () => {
    try {
      const list = await patientAllergyService.getPatientAllergies(patientId);
      setAllergies(list || []);
    } catch (e) {
      console.error('Failed to load allergies:', e);
    }
  };

  useEffect(() => {
    loadAllergies();
  }, [patientId]);

  const handleSaveAllergy = async (e) => {
    e.preventDefault();
    try {
      await patientAllergyService.recordAllergy({
        ...formData,
        patientId,
        recordedByPractitionerId: 'PRAC-DOC-01'
      });
      setIsAddModalOpen(false);
      loadAllergies();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVoidAllergy = async (allergyId) => {
    const reason = prompt('Masukkan alasan klinis pembatalan alergi (JCI MCI Requirement):');
    if (!reason) return;

    try {
      await patientAllergyService.voidAllergy(allergyId, 'PRAC-DOC-01', reason);
      loadAllergies();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/30">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Patient Allergy & Adverse Reaction Record (SCD Type-2)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Riwayat Alergi Terverifikasi Pasien • Standar JCI IPSG 3 & FHIR AllergyIntolerance
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_alert</span>
          <span>+ Catat Alergi Baru</span>
        </button>
      </div>

      {/* Allergies List */}
      <div className="flex flex-col gap-3">
        {allergies.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
            Tidak ada riwayat alergi yang terdokumentasi untuk pasien ini.
          </div>
        ) : (
          allergies.map((a) => (
            <div
              key={a.id}
              className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-rose-600 text-[24px] mt-0.5 animate-pulse">
                  error
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-rose-950 dark:text-rose-200">{a.allergenName}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 text-[10px] font-black uppercase">
                      {a.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                      {a.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/80 dark:text-rose-300/80 font-medium mt-1">
                    Reaksi Klinis: {a.reactionDescription}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleVoidAllergy(a.id)}
                className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-[11px] font-bold transition-all"
                title="Batalkan rekam alergi ini dengan justifikasi klinis"
              >
                Void (Batalkan)
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Catat Alergi Pasien Baru</h3>
            <form onSubmit={handleSaveAllergy} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Nama Alergen</label>
                <input
                  type="text"
                  required
                  value={formData.allergenName}
                  onChange={(e) => setFormData({ ...formData, allergenName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Reaksi Klinis</label>
                <input
                  type="text"
                  required
                  value={formData.reactionDescription}
                  onChange={(e) => setFormData({ ...formData, reactionDescription: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tingkat Keparahan</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  >
                    <option value="MILD">Ringan (Mild)</option>
                    <option value="MODERATE">Sedang (Moderate)</option>
                    <option value="SEVERE_ANAPHYLAXIS">🔴 Berat (Severe Anaphylaxis)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Status Verifikasi</label>
                  <select
                    value={formData.verificationStatus}
                    onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold"
                  >
                    <option value="CONFIRMED">Terkonfirmasi (Confirmed)</option>
                    <option value="SUSPECTED">Dicurigai (Suspected)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700"
                >
                  Simpan Alergi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
