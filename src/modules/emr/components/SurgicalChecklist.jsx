import React, { useState } from 'react';
import { saveSurgicalChecklist } from '../services/surgery.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, UserCheck, Scissors, Search, ClipboardCheck, Activity } from 'lucide-react';

const SurgicalChecklist = ({ encounterId, patientId, userEmail, onComplete }) => {
  const [phase, setPhase] = useState('SIGN_IN'); // SIGN_IN | TIME_OUT | SIGN_OUT
  const [data, setData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const PHASES = {
    SIGN_IN: {
      label: 'Sign-In (Before Anesthesia)',
      description: 'Identifikasi pasien, penandaan area operasi, dan pengecekan mesin anestesi.',
      icon: <UserCheck size={32} />,
      color: 'blue',
      items: [
        { id: 'id_confirmed', text: 'Konfirmasi identitas pasien, lokasi, prosedur, dan persetujuan tindakan (Informed Consent)?' },
        { id: 'site_marked', text: 'Apakah lokasi operasi sudah ditandai (Site Marking)?' },
        { id: 'anesthesia_safety', text: 'Pemeriksaan keamanan mesin & obat anestesi lengkap?' },
        { id: 'pulse_ox', text: 'Pulse oximeter terpasang dan berfungsi dengan baik?' }
      ]
    },
    TIME_OUT: {
      label: 'Time-Out (Before Skin Incision)',
      description: 'Verifikasi tim, prosedur, dan pencegahan infeksi sebelum sayatan pertama.',
      icon: <Scissors size={32} />,
      color: 'amber',
      items: [
        { id: 'team_intro', text: 'Konfirmasi seluruh anggota tim memperkenalkan diri dengan nama dan peran?' },
        { id: 'verbal_confirm', text: 'Dokter Bedah, Dokter Anestesi, dan Perawat konfirmasi verbal: Pasien, Lokasi, Prosedur?' },
        { id: 'abx_prophylaxis', text: 'Antibiotik profilaksis diberikan dalam 60 menit terakhir?' },
        { id: 'imaging_displayed', text: 'Hasil pencitraan (Radiologi/CT) yang relevan sudah ditampilkan?' }
      ]
    },
    SIGN_OUT: {
      label: 'Sign-Out (Before Patient Leaves OR)',
      description: 'Pengecekan akhir alat, spesimen, dan catatan pasca-operasi.',
      icon: <ClipboardCheck size={32} />,
      color: 'emerald',
      items: [
        { id: 'procedure_recorded', text: 'Perawat melakukan konfirmasi verbal nama prosedur yang telah dilakukan?' },
        { id: 'count_correct', text: 'Penghitungan instrumen, kasa, dan jarum sudah lengkap & benar?' },
        { id: 'specimen_labeled', text: 'Spesimen operasi telah diberi label (termasuk nama pasien & MRN)?' },
        { id: 'equipment_issues', text: 'Adakah masalah peralatan yang harus ditindaklanjuti?' }
      ]
    }
  };

  const handleToggle = (id) => {
    setData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    const missing = PHASES[phase].items.filter(item => !data[item.id]);
    if (missing.length > 0) {
      alert(`JCI REQUIREMENT: Silahkan lengkapi seluruh item ${phase} sebelum melanjutkan.`);
      return;
    }

    setIsSaving(true);
    try {
      await saveSurgicalChecklist({
        encounterId,
        patientId,
        userEmail,
        phase,
        checklistData: data
      });
      
      if (onComplete) onComplete(phase);
      
      // Move to next phase if possible
      if (phase === 'SIGN_IN') setPhase('TIME_OUT');
      else if (phase === 'TIME_OUT') setPhase('SIGN_OUT');
      else setPhase('DONE');
      
      setData({}); // Reset for next phase
    } catch (err) {
      alert("Verification Failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (phase === 'DONE') {
    return (
      <div className="p-16 text-center bg-emerald-500/5 rounded-[4rem] border-4 border-dashed border-emerald-500/20 animate-in zoom-in duration-700">
        <div className="w-32 h-32 rounded-[3rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 mx-auto mb-10 transform rotate-6">
          <ShieldCheck size={64} />
        </div>
        <h3 className="text-4xl font-black text-emerald-600 uppercase tracking-tighter">Surgical Cycle Complete</h3>
        <p className="text-lg font-bold opacity-40 mt-4 max-w-md mx-auto leading-relaxed">
          Seluruh protokol keselamatan bedah (WHO/JCI) telah diverifikasi dan dicatat dalam Audit Trail sistem.
        </p>
        <div className="mt-12 flex justify-center gap-4">
           <div className="px-6 py-2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">JCI Compliant</div>
           <div className="px-6 py-2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">Audited</div>
        </div>
      </div>
    );
  }

  const current = PHASES[phase];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ─── PHASE STEPPER ─── */}
      <div className="flex items-center gap-4 px-4 overflow-x-auto pb-4 custom-scrollbar">
         {Object.keys(PHASES).map((key, idx) => {
            const isActive = phase === key;
            const p = PHASES[key];
            return (
               <React.Fragment key={key}>
                  <div className={`flex items-center gap-4 transition-all duration-500 shrink-0 ${isActive ? 'opacity-100 scale-105' : 'opacity-30'}`}>
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${isActive ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 dark:bg-white/5'}`}>
                        {idx + 1}
                     </div>
                     <div className="hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Phase 0{idx+1}</p>
                        <p className="text-xs font-black uppercase tracking-tight">{key.replace('_', ' ')}</p>
                     </div>
                  </div>
                  {idx < 2 && <div className="w-10 h-0.5 bg-gray-100 dark:bg-white/5 shrink-0"></div>}
               </React.Fragment>
            );
         })}
      </div>

      <div className="p-12 rounded-[4rem] bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
        <div className={`absolute right-0 top-0 p-16 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none`}>
           {current.icon}
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
          <div className="flex items-center gap-8">
             <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-6 transition-transform group-hover:rotate-0 duration-700
               ${phase === 'SIGN_IN' ? 'bg-blue-500 shadow-blue-500/20' : phase === 'TIME_OUT' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}
             `}>
               {current.icon}
             </div>
             <div>
               <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{current.label}</h3>
               <p className="text-sm font-bold opacity-40 mt-3 max-w-md leading-relaxed">{current.description}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Security Check</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 mb-12 relative z-10">
          {current.items.map(item => (
            <div 
              key={item.id} 
              onClick={() => handleToggle(item.id)}
              className={`group p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-500 flex items-center gap-8 shadow-sm hover:shadow-xl
                ${data[item.id] 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-gray-50/50 dark:bg-black/10 border-gray-100 dark:border-white/5 hover:border-[var(--primary)]/30'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner
                ${data[item.id] ? 'bg-emerald-500 text-white rotate-0' : 'bg-white dark:bg-black/20 text-transparent -rotate-12 border border-gray-100 dark:border-white/10'}
              `}>
                <CheckCircle2 size={24} />
              </div>
              <p className={`text-lg font-bold flex-1 transition-colors ${data[item.id] ? 'text-emerald-700' : 'opacity-60 group-hover:opacity-100'}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="relative pt-4">
           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-100 dark:via-white/5 to-transparent"></div>
           <button 
             disabled={isSaving}
             onClick={handleSubmit}
             className={`
               w-full py-8 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4
               ${isSaving 
                 ? 'bg-gray-400 cursor-not-allowed' 
                 : 'bg-gradient-to-br from-[var(--primary)] to-blue-700 hover:brightness-110 shadow-[var(--primary)]/30 hover:shadow-[var(--primary)]/50'}
             `}
           >
             {isSaving ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Finalizing & Auditing...
               </>
             ) : (
               <>
                 <ShieldCheck size={24} /> Verify {phase.replace('_', ' ')} & Proceed
               </>
             )}
           </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Audit Log Active</span>
           </div>
           <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10"></div>
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">JCI Requirement</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SurgicalChecklist;
