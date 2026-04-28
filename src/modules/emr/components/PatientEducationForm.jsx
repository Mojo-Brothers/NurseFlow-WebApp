import React, { useState } from 'react';
import { EDUCATION_TOPICS, saveEducationSession } from '../services/pfe.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { BookOpen, CheckCircle2, ShieldCheck, Zap, Info, ArrowRight, UserCheck } from 'lucide-react';

const PatientEducationForm = ({ encounterId, patientId, userEmail }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [understanding, setUnderstanding] = useState('GOOD');
  const [isSaving, setIsSaving] = useState(false);

  const handleLog = async () => {
    if (!selectedTopic) return;
    setIsSaving(true);
    try {
      await saveEducationSession({
        encounterId,
        patientId,
        userEmail,
        topicId: selectedTopic,
        understandingLevel: understanding
      });
      setSelectedTopic('');
    } catch (err) {
      alert('Logging failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-12 rounded-[4rem] bg-white dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-16 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none rotate-12">
           <BookOpen size={240} />
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
          <div className="flex items-center gap-8">
             <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-6 transition-transform group-hover:rotate-0 duration-700">
                <BookOpen size={40} />
             </div>
             <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Pemberian Edukasi Pasien</h3>
                <p className="text-sm font-bold opacity-40 mt-3 max-w-md leading-relaxed">Standar JCI PFE: Verifikasi pemahaman pasien wajib dilakukan dan didokumentasikan.</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">PFE Compliance Engine</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 mb-12 relative z-10">
          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 ml-6">Topik Edukasi & Informasi</label>
             <div className="relative">
                <select 
                  className="w-full p-8 rounded-[2.5rem] bg-gray-50/50 dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-black focus:ring-12 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none appearance-none cursor-pointer shadow-xl"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  <option value="">-- Pilih Topik Edukasi --</option>
                  {EDUCATION_TOPICS.map(t => (
                    <option key={t.id} value={t.id}>{t.category}: {t.label}</option>
                  ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                   <ArrowRight size={24} className="rotate-90" />
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 ml-6">Verifikasi Pemahaman Pasien</label>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {['EXCELLENT', 'GOOD', 'REINFORCE'].map(level => (
                 <button
                   key={level}
                   onClick={() => setUnderstanding(level)}
                   className={`
                     p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col items-center gap-4 group/btn shadow-sm
                     ${understanding === level 
                       ? 'bg-indigo-500 border-indigo-500 text-white shadow-indigo-500/30' 
                       : 'bg-white dark:bg-black/20 border-gray-100 dark:border-white/5 opacity-60 hover:opacity-100 hover:border-indigo-500/30'}
                   `}
                 >
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500 shadow-inner
                     ${understanding === level ? 'bg-white/20 scale-110' : 'bg-gray-100 dark:bg-white/5'}
                   `}>
                      {level === 'EXCELLENT' ? <ShieldCheck size={24} /> : level === 'GOOD' ? <UserCheck size={24} /> : <Zap size={24} />}
                   </div>
                   <span className="text-sm font-black uppercase tracking-widest">{level}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>

        <div className="relative pt-4">
           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-100 dark:via-white/5 to-transparent"></div>
           <button 
             onClick={handleLog}
             disabled={!selectedTopic || isSaving}
             className={`
               w-full py-8 rounded-[2.5rem] text-sm font-black uppercase tracking-[0.3em] text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4
               ${isSaving || !selectedTopic
                 ? 'bg-gray-400 cursor-not-allowed opacity-40' 
                 : 'bg-gradient-to-br from-indigo-600 to-blue-700 hover:brightness-110 shadow-indigo-500/30 hover:shadow-indigo-500/50'}
             `}
           >
             {isSaving ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 Dokumentasi sedang diproses...
               </>
             ) : (
               <>
                 <CheckCircle2 size={24} /> Finalisasi & Simpan Edukasi
               </>
             )}
           </button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-10">
           <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">IPSG.1 Verified</span>
           </div>
           <div className="flex items-center gap-3">
              <UserCheck size={18} className="text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">PPA Accountable</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientEducationForm;
