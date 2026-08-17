import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';
import { usePatientStore } from '../../patient/patient.store.js';

export default function CpptWorkspace() {
  const { cpptNotes, recordCpptEntry, selectedPatientId } = useEmrStore();
  const { selectedPatient, patients } = usePatientStore();
  const activePatient = selectedPatient || patients.find(p => p.id === selectedPatientId) || patients[0] || null;

  const [proType, setProType] = useState('DOKTER_DPJP');
  const [authorName, setAuthorName] = useState('dr. Siti Wijaya, Sp.PD-KGEH');
  const [soapNotes, setSoapNotes] = useState('');
  const [instructionNotes, setInstructionNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!soapNotes) return;

    try {
      await recordCpptEntry({
        episodeId: 'EOC-2026-001',
        encounterId: 'ENC-2026-001',
        patientId: selectedPatientId || activePatient?.id || 'P-001',
        patientName: activePatient?.name || '-',
        professionalType: proType,
        authorName,
        soapNotes,
        instructionNotes
      });
      alert('Catatan Perkembangan Pasien Terintegrasi (CPPT) berhasil didokumentasikan.');
      setSoapNotes('');
      setInstructionNotes('');
    } catch (err) {
      alert(`Gagal Menyimpan CPPT: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Input CPPT ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-teal-600">edit_note</span>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Input CPPT Multidisiplin (PPA)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Profesi Tenaga Kesehatan (PPA)</label>
            <select
              value={proType}
              onChange={(e) => {
                setProType(e.target.value);
                if (e.target.value === 'PERAWAT') setAuthorName('Ns. Ratna Sari, S.Kep');
                else if (e.target.value === 'APOTEKER_KLINIS') setAuthorName('apt. Dimas Anggara, S.Farm');
                else if (e.target.value === 'DIETISIEN_GIZI') setAuthorName('Nurul Hidayah, S.Gz');
                else setAuthorName('dr. Siti Wijaya, Sp.PD-KGEH');
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              <option value="DOKTER_DPJP">Dokter Penanggung Jawab Pelayanan (DPJP)</option>
              <option value="DOKTER_JAGA">Dokter Jaga Ruangan / IGD</option>
              <option value="PERAWAT">Perawat Primer / Katim</option>
              <option value="APOTEKER_KLINIS">Apoteker Klinis (Farmasi)</option>
              <option value="DIETISIEN_GIZI">Dietisien / Nutrisionis Gizi</option>
              <option value="FISIOTERAPIS">Fisioterapis</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Petugas Penulis *</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Catatan Perkembangan Pasien (SOAP / SBAR) *</label>
            <textarea
              rows={4}
              value={soapNotes}
              onChange={(e) => setSoapNotes(e.target.value)}
              placeholder="S: ...&#10;O: ...&#10;A: ...&#10;P: ..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Instruksi Tenaga Kesehatan / PPA</label>
            <input
              type="text"
              value={instructionNotes}
              onChange={(e) => setInstructionNotes(e.target.value)}
              placeholder="Contoh: Pantau balans cairan ketat, infus 20 tpm"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Simpan Catatan CPPT</span>
          </button>
        </form>
      </div>

      {/* ─── Timeline CPPT Terintegrasi ─── */}
      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Timeline CPPT Terintegrasi Seluruh PPA ({cpptNotes.length})
        </h4>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
          {cpptNotes.map(note => (
            <div key={note.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600">
                  {note.professional_type}
                </span>
                <span className="text-[10px] font-mono text-on-surface-variant">
                  {new Date(note.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(note.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>

              <h4 className="text-xs font-black text-on-surface">Oleh: {note.author_name}</h4>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 font-mono text-[11px] whitespace-pre-line text-on-surface">
                {note.soap_notes || note.sbar_assessment}
              </div>

              {note.instruction_notes && (
                <p className="text-[11px] text-teal-600 dark:text-teal-400">
                  <strong>Instruksi PPA:</strong> {note.instruction_notes}
                </p>
              )}

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[10px]">
                <span className="font-mono text-emerald-600">
                  {note.dpjp_verified ? `✓ Terverifikasi DPJP (${note.dpjp_verifier_name})` : '⏳ Menunggu Verifikasi DPJP (Max 24 Jam)'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
