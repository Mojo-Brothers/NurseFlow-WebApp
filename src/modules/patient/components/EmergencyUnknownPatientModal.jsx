import React, { useState } from 'react';
import { usePatientStore } from '../patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { useTriageStore } from '../../triage/triage.store.js';
import { mpiEngine } from '../../../core/services/mpiEngine.service.js';
import toast from 'react-hot-toast';

export default function EmergencyUnknownPatientModal({ isOpen, onClose, onCreated, targetPatientToReconcile = null }) {
  const { addPatient, patients, fetchPatients } = usePatientStore();
  const { openEncounter, setLiveContext } = useEncounterStore();
  const { setOperationalMode } = useTriageStore();

  // Create Mode States
  const [estimatedGender, setEstimatedGender] = useState('M');
  const [approxAgeGroup, setApproxAgeGroup] = useState('ADULT'); // 'PEDIATRIC' | 'ADULT' | 'GERIATRIC'
  const [traumaNotes, setTraumaNotes] = useState('Pasien trauma tidak sadar dibawa ambulans 118');

  // Reconciliation Mode States
  const [selectedMasterPatientId, setSelectedMasterPatientId] = useState('');
  const [reconciliationReason, setReconciliationReason] = useState('Identitas asli ditemukan via KTP / Keluarga pasien tiba di RS');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isReconciliationMode = Boolean(targetPatientToReconcile);

  const handleCreateEmergencyPatient = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const uniqueCode = Math.random().toString(36).substring(2, 5).toUpperCase();
      const prefix = estimatedGender === 'F' ? 'Mrs. X' : 'Mr. X';

      const newPatient = await addPatient({
        name: `${prefix} (${dateStr}, ${timeStr}) - #${uniqueCode}`,
        demographics: {
          dob: approxAgeGroup === 'PEDIATRIC' ? '2015-01-01' : approxAgeGroup === 'GERIATRIC' ? '1955-01-01' : '1985-01-01',
          gender: estimatedGender
        },
        mrn: `MRX-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${uniqueCode}`,
        status: 'EMERGENCY',
        payer: 'Jasa Raharja / Darurat IGD',
        notes: traumaNotes
      }, 'Sistem IGD Rapid');

      const encounterId = await openEncounter({
        patientId: newPatient.id,
        encounterType: 'emergency',
        chiefComplaint: traumaNotes,
        status: 'TRIAGE',
        triageStatus: 'PENDING',
        department: 'IGD',
        priority: 'EMERGENCY_RED'
      }, 'Sistem IGD Rapid');

      setLiveContext(newPatient.id, encounterId);
      setOperationalMode('RAPID');

      toast.success(`🚨 Pasien Darurat Anonim ${newPatient.name} dibuat dan masuk Triase IGD!`, {
        icon: '🚨',
        duration: 4000
      });

      if (onCreated) onCreated(newPatient);
      onClose();
    } catch (err) {
      toast.error(`Gagal membuat pasien darurat: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReconcilePatient = async (e) => {
    e.preventDefault();
    if (!selectedMasterPatientId) {
      toast.error('Pilih master data pasien tujuan rekonsiliasi!');
      return;
    }

    setIsProcessing(true);
    try {
      // Execute EMPI Merge
      const result = await mpiEngine.mergePatients(
        selectedMasterPatientId,
        targetPatientToReconcile.id,
        'Petugas HIM & Admisi IGD'
      );

      await fetchPatients();
      setLiveContext(selectedMasterPatientId, null);

      toast.success(`✅ REKONSILIASI SUKSES: Data pasien anonim ${targetPatientToReconcile.name} telah digabungkan ke ${result.primary.name} (${result.primary.mrn}) tanpa menghapus riwayat encounter darurat!`, {
        duration: 6000
      });

      onClose();
    } catch (err) {
      toast.error(`Rekonsiliasi gagal: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl flex flex-col p-6 gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white ${
              isReconciliationMode ? 'bg-amber-600' : 'bg-rose-600 animate-pulse'
            }`}>
              <span className="material-symbols-outlined text-[22px]">
                {isReconciliationMode ? 'merge_type' : 'emergency'}
              </span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isReconciliationMode ? 'Rekonsiliasi Identitas Pasien Anonim' : 'Registrasi Pasien Darurat Anonim (Mr./Mrs. X)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isReconciliationMode ? 'Penggabungan rekam medis legal EMPI' : 'Bypass administrasi lengkap, langsung masuk Triase IGD'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        {isReconciliationMode ? (
          <form onSubmit={handleReconcilePatient} className="flex flex-col gap-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-black block mb-1">Pasien Anonim Sumber:</span>
              <span className="font-bold">{targetPatientToReconcile.name} ({targetPatientToReconcile.mrn})</span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Master Pasien yang Dikenal (Tujuan Merge)</label>
              <select
                value={selectedMasterPatientId}
                onChange={e => setSelectedMasterPatientId(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                required
              >
                <option value="">-- Pilih Master Pasien --</option>
                {patients.filter(p => p.id !== targetPatientToReconcile.id && p.status !== 'MERGED').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (No. RM: {p.mrn} • NIK: {p.nik || '-'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Alasan & Catatan Audit Rekonsiliasi</label>
              <input
                type="text"
                value={reconciliationReason}
                onChange={e => setReconciliationReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                required
              />
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
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Memproses Merge...' : '⚡ Rekonsiliasi & Gabungkan'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateEmergencyPatient} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Estimasi Jenis Kelamin</label>
                <select
                  value={estimatedGender}
                  onChange={e => setEstimatedGender(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="M">Laki-Laki (Mr. X)</option>
                  <option value="F">Perempuan (Mrs. X)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Estimasi Kelompok Usia</label>
                <select
                  value={approxAgeGroup}
                  onChange={e => setApproxAgeGroup(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="ADULT">Dewasa (approx. 20-50 thn)</option>
                  <option value="GERIATRIC">Geriatri / Lansia (&gt;60 thn)</option>
                  <option value="PEDIATRIC">Anak-Anak (&lt;15 thn)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Catatan Kondisi Klinis / Kejadian Awal</label>
              <textarea
                rows={2}
                value={traumaNotes}
                onChange={e => setTraumaNotes(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                required
              />
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
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Membuka Encounter...' : '🚨 Buka Encounter Darurat Cito'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
