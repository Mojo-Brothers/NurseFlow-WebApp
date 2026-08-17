import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * InsuranceDashboard — The high-performance revenue lifecycle hub.
 */
export default function InsuranceDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('DRAFT');

  const stats = [
    { label: t('insurance.stats.draft'), value: '12', color: 'bg-primary' },
    { label: t('insurance.stats.pending'), value: '45', color: 'bg-secondary' },
    { label: t('insurance.stats.approved'), value: 'RP 240M', color: 'bg-success' },
    { label: t('insurance.stats.rejections'), value: '3', color: 'bg-error' },
  ];

  const claims = [];

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
       <header className="flex-row justify-between items-end">
          <div>
             <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">{t('insurance.title')}</h1>
             <p className="text-on-surface-variant font-medium opacity-60">{t('insurance.subtitle')}</p>
          </div>
          <div className="flex-row gap-3">
             <button className="btn-ghost text-[10px] font-black uppercase px-6 py-3 border border-outline-variant">{t('insurance.btn_batch')}</button>
             <button className="btn-primary text-[10px] font-black uppercase px-8 py-3 shadow-lg">{t('insurance.btn_new')}</button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
             <ClinicalCard key={i} padding="1.5rem" className="bg-surface border-none shadow-sm flex-column">
                <span className="text-[10px] font-black uppercase opacity-40 mb-1">{stat.label}</span>
                <span className="text-3xl font-black tabular-nums">{stat.value}</span>
                <div className={`h-1 w-12 mt-4 rounded-full ${stat.color}`} />
             </ClinicalCard>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
          {/* 📋 CLAIM WORKLIST */}
          <div className="lg:col-span-9 flex-column gap-6">
             <div className="flex-row gap-6 border-b border-outline-variant">
                {['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map(tab => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all
                       ${activeTab === tab ? 'border-b-4 border-primary text-primary' : 'opacity-40 hover:opacity-100'}`}>
                      {t(`insurance.tabs.${tab.toLowerCase()}`)}
                   </button>
                ))}
             </div>

             <div className="bg-surface rounded-[2.5rem] border border-outline-variant overflow-hidden shadow-sm flex-1">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-surface-container text-[10px] font-black uppercase opacity-60">
                         <th className="p-6">{t('insurance.table.entity')}</th>
                         <th className="p-6">{t('insurance.table.diagnosis')}</th>
                         <th className="p-6">{t('insurance.table.reimbursement')}</th>
                         <th className="p-6">{t('insurance.table.risk')}</th>
                         <th className="p-6">{t('insurance.table.actions')}</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs font-medium">
                      {claims.map((claim, i) => (
                         <tr key={i} className="border-t border-outline-variant hover:bg-surface-container-low transition-all">
                            <td className="p-6">
                               <p className="font-black text-sm">{claim.patient}</p>
                               <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">{claim.id}</p>
                            </td>
                            <td className="p-6 font-bold text-on-surface-variant italic">"{claim.diagnosis}"</td>
                            <td className="p-6 font-black tabular-nums text-primary">{claim.amount}</td>
                            <td className="p-6">
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                 ${claim.risk === 'LOW' ? 'bg-success/10 text-success' : 'bg-error text-white animate-pulse'}`}>
                                  {t('insurance.risk_label', { risk: claim.risk })}
                               </span>
                            </td>
                            <td className="p-6">
                               <button className="text-primary font-black uppercase text-[10px] hover:underline">{t('insurance.process_claim')}</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* 🧩 AUDIT INSIGHTS */}
          <div className="lg:col-span-3 flex-column gap-6">
             <ClinicalCard padding="2rem" className="bg-primary/5 border-none">
                <h3 className="text-sm font-black uppercase mb-6 flex-row items-center gap-2">
                   <span className="material-symbols-outlined text-primary">analytics</span>
                   {t('insurance.insights.title')}
                </h3>
                <div className="space-y-4">
                   <div>
                      <div className="flex-row justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase opacity-60">{t('insurance.insights.missing_icd')}</span>
                         <span className="text-[10px] font-black">62%</span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full overflow-hidden">
                         <div className="h-full bg-error w-[62%]" />
                      </div>
                   </div>
                   <div>
                      <div className="flex-row justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase opacity-60">{t('insurance.insights.no_signature')}</span>
                         <span className="text-[10px] font-black">24%</span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full overflow-hidden">
                         <div className="h-full bg-secondary w-[24%]" />
                      </div>
                   </div>
                </div>
                <p className="mt-8 text-[10px] opacity-60 leading-relaxed italic border-t border-primary/10 pt-4">
                   {t('insurance.insights.scrubbing_msg', { amount: 'RP 840M' })}
                </p>
             </ClinicalCard>
          </div>
       </div>
    </div>
  );
}
