import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, X, AlertTriangle } from 'lucide-react';

/**
 * 🛡️ IPSG.1 PATIENT IDENTIFICATION VERIFICATION
 * Standard: The hospital develops and implements a process to improve accuracy of patient identifications.
 * Requirement: Use at least two patient identifiers (e.g., Name, Date of Birth, NIK).
 */
export default function PatientVerificationModal({ isOpen, onClose, onVerified, patientData }) {
  const [typedName, setTypedName] = useState('');
  const [typedDOB, setTypedDOB] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = () => {
    // JCI Requirement: Verification must match existing records
    const isNameMatch = typedName.toLowerCase().trim() === (patientData?.name || '').toLowerCase().trim();
    const isDOBMatch = typedDOB === (patientData?.dob || '');

    if (isNameMatch && isDOBMatch) {
      onVerified();
      setTypedName('');
      setTypedDOB('');
      setError('');
    } else {
      setError('IDENTIFIKASI GAGAL: Data tidak cocok dengan rekam medis. (IPSG.1 Violation Risk)');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0c10]/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#12141c] border border-emerald-500/30 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
            <ShieldCheck size={40} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Double ID Verification</h2>
            <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1">Standar Keselamatan Pasien Internasional (IPSG.1)</p>
          </div>

          <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-left">
             <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-emerald-100/70 leading-relaxed uppercase tracking-tight">
                   Wajib melakukan verifikasi identitas menggunakan minimal 2 identitas unik sebelum melanjutkan prosedur klinis.
                </p>
             </div>
          </div>

          <div className="w-full space-y-4">
             <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest ml-4">Konfirmasi Nama Lengkap</label>
                <input 
                  type="text" 
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Ketik Nama Pasien..."
                  className="w-full bg-[#0a0c10] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:opacity-20 focus:border-emerald-500/50 transition-all outline-none"
                />
             </div>
             <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest ml-4">Konfirmasi Tanggal Lahir</label>
                <input 
                  type="text" 
                  value={typedDOB}
                  onChange={(e) => setTypedDOB(e.target.value)}
                  placeholder="YYYY-MM-DD (e.g. 1990-01-01)"
                  className="w-full bg-[#0a0c10] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold placeholder:opacity-20 focus:border-emerald-500/50 transition-all outline-none"
                />
             </div>
          </div>

          {error && (
            <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              {error}
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-4 pt-4">
             <button 
               onClick={onClose}
               className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all"
             >
               Batal
             </button>
             <button 
               onClick={handleVerify}
               className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
             >
               <UserCheck size={16} /> Verifikasi
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
