import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';

export default function AllergyWorkspace() {
  const { allergies, recordAllergy, selectedPatientId } = useEmrStore();

  const [allergyType, setAllergyType] = useState('DRUG');
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState('MODERATE');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allergen) return;

    try {
      await recordAllergy({
        patientId: selectedPatientId,
        allergyType,
        allergen,
        reaction,
        severity
      });
      alert('Alergi pasien berhasil didaftarkan dan diintegrasikan ke sistem proteksi CDSS.');
      setAllergen('');
      setReaction('');
    } catch (err) {
      alert(`Gagal Mendaftarkan Alergi: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Pendaftaran Alergi ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-rose-600">warning</span>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Pendaftaran Alergi Pasien (JCI IPSG 3)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tipe Alergi</label>
            <select
              value={allergyType}
              onChange={(e) => setAllergyType(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              <option value="DRUG">Obat-obatan (Drug / Medication)</option>
              <option value="FOOD">Makanan (Food Allergen)</option>
              <option value="ENVIRONMENTAL">Lingkungan (Debu / Dingin / Serbuk)</option>
              <option value="LATEX">Lateks Medis (Medical Latex)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Alergen (Zat Penyebab) *</label>
            <input
              type="text"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="Contoh: Amoxicillin, Cefadroxil, Seafood"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Manifestasi Reaksi Alergi</label>
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="Contoh: Gatal biduran, bengkak bibir, sesak nafas"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tingkat Keparahan Reaksi</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              <option value="MILD">Ringan (Mild - Gatal lokal)</option>
              <option value="MODERATE">Sedang (Moderate - Urtikaria luas)</option>
              <option value="SEVERE">Berat (Severe - Angioedema / Bronkospasme)</option>
              <option value="ANAPHYLAXIS_LIFE_THREATENING">Mengancam Jiwa (Anafilaksis Syok)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-rose-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Simpan Alergi & Aktifkan Safeguard CDSS</span>
          </button>
        </form>
      </div>

      {/* ─── Daftar Alergi Terdaftar ─── */}
      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Daftar Riwayat Alergi Pasien Aktif ({allergies.length})
        </h4>

        <div className="space-y-3">
          {allergies.map(alg => {
            const isSevere = alg.severity === 'SEVERE' || alg.severity === 'ANAPHYLAXIS_LIFE_THREATENING';

            return (
              <div
                key={alg.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSevere
                    ? 'bg-rose-500/10 border-rose-500 shadow-md ring-1 ring-rose-500/30'
                    : 'bg-surface-container-high border-outline-variant/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSevere ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>
                      {alg.allergy_type} &bull; {alg.severity}
                    </span>
                    <h4 className="text-sm font-black text-on-surface mt-1.5">{alg.allergen}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5"><strong>Reaksi:</strong> {alg.reaction}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {alg.verification_status}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-on-surface-variant font-mono">
                  <span>Dicatat oleh: {alg.recorded_by}</span>
                  <span>{new Date(alg.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
