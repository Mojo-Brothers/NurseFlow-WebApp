import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';
import { ICD10_CATALOG } from '../services/diagnosisEngine.service.js';

export default function SoapWorkspace() {
  const { soapNotes, recordSoapNote, selectedPatientId } = useEmrStore();

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [selectedIcd, setSelectedIcd] = useState(ICD10_CATALOG[2]); // Dengue fever
  const [physicianName, setPhysicianName] = useState('dr. Siti Wijaya, Sp.PD-KGEH');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subjective || !objective || !assessment || !plan) {
      alert('Seluruh kolom S, O, A, P wajib diisi lengkap.');
      return;
    }

    try {
      await recordSoapNote({
        episodeId: 'EOC-2026-001',
        encounterId: 'ENC-2026-001',
        patientId: selectedPatientId,
        patientName: 'Ny. Siti Nurhaliza, S.Pd',
        mrn: 'MRN-2026-001001',
        subjective,
        objective,
        assessment,
        plan,
        primaryIcd10: selectedIcd.code,
        primaryIcd10Name: selectedIcd.name,
        physicianName
      });
      alert(`Catatan SOAP Dokter Berhasil Disimpan & Diberi Tanda Tangan Elektronik!`);
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
    } catch (err) {
      alert(`Gagal Menyimpan SOAP: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Input SOAP DPJP ─── */}
      <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">stethoscope</span>
            <h3 className="text-sm font-headline font-black text-on-surface uppercase">
              Dokumentasi Klinis Terstruktur (SOAP Engine)
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
            FHIR Composition Ready
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-teal-600 uppercase mb-1">
              [S] Subjective (Anamnesis, Keluhan Utama, Riwayat Penyakit) *
            </label>
            <textarea
              rows={3}
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="Keluhan utama, riwayat penyakit sekarang (RPS), riwayat alergi, riwayat pengobatan terdahulu..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-teal-600 uppercase mb-1">
              [O] Objective (Tanda Vital & Pemeriksaan Fisik Terstruktur) *
            </label>
            <textarea
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Keadaan umum, GCS, TTV (TD, Nadi, Suhu, RR, SpO2), Hasil pemeriksaan fisik per organ..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-teal-600 uppercase mb-1">
              [A] Assessment & Diagnosis Primer (ICD-10) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <select
                value={selectedIcd.code}
                onChange={(e) => {
                  const found = ICD10_CATALOG.find(d => d.code === e.target.value);
                  if (found) setSelectedIcd(found);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
              >
                {ICD10_CATALOG.map(d => (
                  <option key={d.code} value={d.code}>[{d.code}] {d.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={selectedIcd.name}
                readOnly
                className="w-full px-3 py-1.5 rounded-xl bg-surface-container-highest border text-xs font-mono text-on-surface"
              />
            </div>
            <textarea
              rows={2}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Analisa diferensial diagnosis klinis, stadium penyakit..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-teal-600 uppercase mb-1">
              [P] Plan (Instruksi Terapi, E-Resep, Order Penunjang & Edukasi) *
            </label>
            <textarea
              rows={3}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Rencana medikasi farmakoterapi, order laboratorium/radiologi, jadwal kontrol poliklinik..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">draw</span>
            <span>Tanda Tangani & Simpan Rekam Medis (SOAP)</span>
          </button>
        </form>
      </div>

      {/* ─── Riwayat SOAP DPJP ─── */}
      <div className="lg:col-span-5 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Riwayat SOAP Terdahulu Pasien ({soapNotes.length})
        </h4>

        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar">
          {soapNotes.map(soap => (
            <div key={soap.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded">
                  ICD-10: {soap.primary_icd10}
                </span>
                <span className="text-[10px] font-mono text-emerald-600">✓ Signed E-Signature</span>
              </div>

              <h4 className="text-sm font-black text-on-surface">{soap.primary_icd10_name}</h4>
              <p className="text-[11px] text-on-surface-variant font-mono">DPJP: {soap.physician_name}</p>

              <div className="space-y-1 text-[11px] text-on-surface bg-surface-container p-2.5 rounded-xl border border-outline-variant/20">
                <p><strong>[S]:</strong> {soap.subjective}</p>
                <p><strong>[O]:</strong> {soap.objective}</p>
                <p><strong>[A]:</strong> {soap.assessment}</p>
                <p><strong>[P]:</strong> {soap.plan}</p>
              </div>

              <span className="text-[10px] font-mono text-on-surface-variant block text-right">
                {new Date(soap.created_at).toLocaleDateString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
