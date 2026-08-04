import React from 'react';
import { useTranslation } from 'react-i18next';
import { validateClaimReadiness } from '../../../billing/services/claimEngine.service.js';

const PMH_CHIPS = ['Hipertensi', 'Diabetes Mellitus', 'Asma', 'Penyakit Jantung', 'Alergi Obat', 'Riwayat Operasi'];

// Mock ICD for search simulation (in a real HIS, this would be an API call)
const ICD_10_CODES = [
  { code: 'A09', description: 'Gastroenteritis and colitis of infectious origin' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'E11', description: 'Type 2 diabetes mellitus' },
  { code: 'K29.7', description: 'Gastritis, unspecified' },
];

export default function EmrCPPT({
  subjective,
  setSubjective,
  objective,
  setObjective,
  assessment,
  setAssessment,
  planInstructions,
  setPlanInstructions,
  selectedIcd,
  setSelectedIcd
}) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-0 xl:pr-4 scrollbar-hidden">
      <div className="flex flex-col gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
         <label className="text-[10px] font-black uppercase text-primary">{t('emr_v2.soap.subjective', { defaultValue: 'Subjective (Anamnesis)' })}</label>
         <div className="flex flex-row flex-wrap gap-2 mb-2">
            {PMH_CHIPS.map(chip => (
               <button
                 key={chip}
                 onClick={() => setSubjective(prev => prev.includes(chip) ? prev.replace(new RegExp(`(?:, )?${chip}`), '') : prev ? `${prev}, ${chip}` : chip)}
                 className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${subjective.includes(chip) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
               >
                  + {chip}
               </button>
            ))}
         </div>
         <textarea className="w-full bg-surface border-2 border-outline p-3 font-body font-bold text-sm text-on-surface focus:border-primary focus:outline-none min-h-[100px] leading-relaxed" 
            placeholder="Keluhan Utama & Riwayat Penyakit Sekarang..." 
            value={subjective} 
            onChange={e => setSubjective(e.target.value)} />
      </div>
      
      <div className="flex flex-col gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
         <div className="flex flex-row justify-between items-center">
            <label className="text-[10px] font-black uppercase text-secondary">{t('emr_v2.soap.objective', { defaultValue: 'Objective (Pemeriksaan Fisik)' })}</label>
            <span className="text-[8px] font-black uppercase opacity-60 bg-surface-container px-2 py-1 rounded">Vitals Auto-Synced</span>
         </div>
         <textarea className="w-full bg-surface border-2 border-outline p-3 font-body font-bold text-sm text-on-surface focus:border-primary focus:outline-none min-h-[80px] leading-relaxed" 
            placeholder="Hasil Pemeriksaan Fisik (Kepala, Thorax, Abdomen, Ekstremitas)..." 
            value={objective} 
            onChange={e => setObjective(e.target.value)} />
      </div>

      <div className="flex flex-col gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant relative">
          <div className="flex flex-row justify-between items-center">
             <label className="text-[10px] font-black uppercase text-error">{t('emr_v2.soap.assessment', { defaultValue: 'Assessment (Diagnosis)' })}</label>
             {assessment.length > 0 && (
                <div className={`flex flex-row items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                   ${validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? 'bg-success/10 text-success' : 'bg-error-container text-error animate-pulse'}`}>
                   <span className="material-symbols-outlined text-[10px]">shield_with_heart</span>
                   {validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? t('emr_v2.soap.claim_ready', { defaultValue: 'Claim Ready' }) : t('emr_v2.soap.claim_risk', { defaultValue: 'Claim Risk' })}
                </div>
             )}
          </div>
          
          <div className="flex flex-row flex-wrap gap-2 mb-2">
             {ICD_10_CODES.map(icd => (
                <button
                  key={icd.code}
                  onClick={() => {
                     setSelectedIcd(icd.code);
                     if (!assessment.includes(icd.description)) {
                        setAssessment(prev => prev ? `${prev}\n${icd.description}` : icd.description);
                     }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black flex flex-row items-center gap-2 border transition-all ${selectedIcd === icd.code ? 'bg-error text-white border-error shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-error/50'}`}
                >
                   <span className="opacity-60">{icd.code}</span>
                   <span className="truncate max-w-[120px]">{icd.description}</span>
                </button>
             ))}
          </div>

          <textarea className="w-full bg-surface border-2 border-outline p-3 font-body font-bold text-sm text-on-surface focus:border-primary focus:outline-none min-h-[100px] leading-relaxed font-bold" 
            placeholder="Diagnosis Klinis / ICD-10..." 
            value={assessment} 
            onChange={e => setAssessment(e.target.value)} />
       </div>

       <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr_v2.soap.plan', { defaultValue: 'Plan (Instruksi Medis / Tindakan)' })}</label>
          <textarea className="w-full bg-surface border-2 border-outline p-3 font-body font-bold text-sm text-on-surface focus:border-primary focus:outline-none h-[120px] font-medium" 
            placeholder={t('emr_v2.placeholders.instructions', { defaultValue: 'Tuliskan rencana penatalaksanaan, diet, dan observasi lanjutan...' })} 
            value={planInstructions} 
            onChange={e => setPlanInstructions(e.target.value)} />
       </div>
    </div>
  );
}
