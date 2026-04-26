import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, User, Clock, Info, AlertTriangle, Fingerprint } from 'lucide-react';

export default function HandHygieneAudit({ formData, setFormData }) {
  const [moments, setMoments] = useState([
    { id: 1, label: 'Sebelum Menyentuh Pasien', description: 'Melindungi pasien dari kuman di tangan perawat.', done: false },
    { id: 2, label: 'Sebelum Prosedur Aseptik', description: 'Melindungi pasien dari kuman masuk ke tubuh.', done: false },
    { id: 3, label: 'Setelah Terpapar Cairan Tubuh', description: 'Melindungi diri dan lingkungan.', done: false },
    { id: 4, label: 'Setelah Menyentuh Pasien', description: 'Melindungi diri dan lingkungan.', done: false },
    { id: 5, label: 'Setelah Menyentuh Lingkungan Pasien', description: 'Melindungi diri dan lingkungan.', done: false }
  ]);

  const toggleMoment = (id) => {
    const updated = moments.map(m => m.id === id ? { ...m, done: !m.done } : m);
    setMoments(updated);
    setFormData({ ...formData, compliance_moments: updated });
  };

  const [method, setMethod] = useState('Handrub');

  return (
    <div className="space-y-8">
      {/* JCI IPSG.5 BANNER */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[3rem] flex items-center gap-6">
        <div className="w-16 h-16 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
          <Fingerprint size={36} />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">Audit Kepatuhan Cuci Tangan (IPSG.5)</h3>
          <p className="text-sm font-bold opacity-70 leading-relaxed">Pengurangan risiko infeksi terkait pelayanan kesehatan melalui protokol 5 Moments Hand Hygiene WHO.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Method Selection */}
        <div className="md:col-span-4 space-y-6">
           <div className="bg-[var(--surface-container-low)] p-8 rounded-[2.5rem] border border-[var(--outline-variant)]">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-6">Metode Kebersihan Tangan</h4>
              <div className="space-y-3">
                 {['Handrub (Berbasis Alkohol)', 'Handwash (Sabun & Air)', 'Bedah (Aseptik)'].map(m => (
                    <button 
                       key={m}
                       onClick={() => {
                          setMethod(m);
                          setFormData({...formData, method: m});
                       }}
                       className={`w-full p-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${method === m ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg' : 'bg-white dark:bg-black/20 border-[var(--outline-variant)] text-[var(--on-surface-variant)]'}`}
                    >
                       {m}
                    </button>
                 ))}
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
              <Info size={20} className="text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold italic text-amber-700 dark:text-amber-400">Auditor wajib mengamati secara langsung (direct observation) tanpa mengganggu pelayanan.</p>
           </div>
        </div>

        {/* 5 Moments Checklist */}
        <div className="md:col-span-8 space-y-4">
           <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 px-2">WHO 5 Moments Check</h4>
           {moments.map((m) => (
              <button 
                key={m.id}
                onClick={() => toggleMoment(m.id)}
                className={`
                   w-full p-6 rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-500 text-left
                   ${m.done ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)] hover:border-[var(--primary)]/30'}
                `}
              >
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${m.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'}`}>
                      {m.done ? <CheckCircle2 size={24} /> : <span className="text-lg font-black">{m.id}</span>}
                   </div>
                   <div>
                      <p className="text-sm font-black uppercase tracking-tight">{m.label}</p>
                      <p className="text-[10px] font-bold opacity-50 uppercase tracking-tighter mt-0.5">{m.description}</p>
                   </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${m.done ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[var(--surface-container-highest)] border-[var(--outline-variant)] opacity-40'}`}>
                   {m.done ? 'COMPLIANT' : 'PENDING'}
                </div>
              </button>
           ))}
        </div>
      </div>

      {/* COMPLIANCE SCORE */}
      <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-2xl shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-8 border-white/20 flex items-center justify-center text-3xl font-black">
               {Math.round((moments.filter(m => m.done).length / moments.length) * 100)}%
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Compliance Score</h3>
               <p className="text-xs font-bold opacity-70">Sesuai standar PPI Rumah Sakit Berstandar Internasional.</p>
            </div>
         </div>
         <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
               <User size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Observer: Nurse Sarah</span>
            </div>
            <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
               <Clock size={16} />
               <span className="text-[10px] font-black uppercase tracking-widest">Waktu: {new Date().toLocaleTimeString()}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
