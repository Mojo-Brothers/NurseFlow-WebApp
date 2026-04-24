import React, { useState, useEffect } from 'react';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { getGovernanceSettings } from '../services/moi.service.js';
import { useAuth } from '../../../contexts/useAuth.js';

/**
 * InformationGovernanceHub — Management of Information (MOI).
 * Monitoring data integrity, standard terminology, and security.
 */
export default function InformationGovernanceHub() {
  const { currentUser, role } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getGovernanceSettings();
        setSettings(data);
      } catch (err) {
        console.error('[MOIHub] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center opacity-30">Auditing Governance...</div>;

  return (
    <div className="p-12 animate-fade-in">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
          Management of Information
        </span>
        <h1 className="text-5xl font-black tracking-tight">Information <span className="text-primary">Governance</span></h1>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Compliance Scorecards */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-3 gap-6 mb-8">
             <ClinicalCard padding="1.5rem">
                <span className="text-[10px] font-black uppercase opacity-40">Data Integrity</span>
                <div className="flex-row items-baseline gap-2 mt-2">
                   <span className="text-3xl font-black">99.8%</span>
                   <span className="text-[10px] font-black text-success">↑ 0.2</span>
                </div>
             </ClinicalCard>
             <ClinicalCard padding="1.5rem">
                <span className="text-[10px] font-black uppercase opacity-40">Terminology Score</span>
                <div className="flex-row items-baseline gap-2 mt-2">
                   <span className="text-3xl font-black">94.2%</span>
                   <span className="text-[10px] font-black text-warning">↓ 1.4</span>
                </div>
             </ClinicalCard>
             <ClinicalCard padding="1.5rem">
                <span className="text-[10px] font-black uppercase opacity-40">Security Audit</span>
                <div className="flex-row items-baseline gap-2 mt-2">
                   <span className="text-3xl font-black text-success">CLEAN</span>
                </div>
             </ClinicalCard>
          </div>

          <PresentationCard padding="2rem">
             <div className="flex-row justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase tracking-widest">Forbidden Abbreviations Monitoring</h2>
                <button className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">View Full Log</button>
             </div>

             <div className="space-y-4">
                {[
                  { term: 'U', count: 12, risk: 'HIGH', trend: 'UP' },
                  { term: 'QD', count: 4, risk: 'MEDIUM', trend: 'DOWN' },
                  { term: 'MS', count: 2, risk: 'HIGH', trend: 'STABLE' },
                  { term: 'IU', count: 1, risk: 'MEDIUM', trend: 'DOWN' }
                ].map(item => (
                  <div key={item.term} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex-row justify-between items-center">
                     <div className="flex-row items-center gap-6">
                        <div className="w-12 h-12 bg-error-container text-error rounded-xl flex items-center justify-center font-black text-xl">
                           {item.term}
                        </div>
                        <div className="flex-column">
                           <span className="text-sm font-black">Violation Detected: "{item.term}"</span>
                           <span className="text-[10px] opacity-50 font-bold">Standard: Use full word per MOI.2 list</span>
                        </div>
                     </div>
                     <div className="flex-row gap-8 items-center">
                        <div className="text-right">
                           <p className="text-lg font-black leading-none">{item.count}</p>
                           <p className="text-[9px] font-bold opacity-40 uppercase">Instances</p>
                        </div>
                        <span className={`chip ${item.risk === 'HIGH' ? 'bg-error text-white' : 'bg-warning text-on-warning'} font-black`}>
                           {item.risk} RISK
                        </span>
                     </div>
                  </div>
                ))}
             </div>
          </PresentationCard>
        </div>

        {/* Security & Lifecycle Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <PresentationCard padding="2rem" className="mb-8">
             <h2 className="text-lg font-black uppercase tracking-widest mb-6">Security Analytics</h2>
             <div className="flex-column gap-6">
                <div className="flex-row gap-4">
                   <div className="w-2 h-2 rounded-full bg-success mt-1" />
                   <div className="flex-column">
                      <span className="text-xs font-black uppercase">Encryption Active</span>
                      <span className="text-[10px] opacity-50 font-bold">{settings?.dataEncryption} End-to-End</span>
                   </div>
                </div>
                <div className="flex-row gap-4">
                   <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                   <div className="flex-column">
                      <span className="text-xs font-black uppercase">Multi-Tenant Isolation</span>
                      <span className="text-[10px] opacity-50 font-bold">Facility-Level Sharding Enabled</span>
                   </div>
                </div>
                <div className="flex-row gap-4">
                   <div className="w-2 h-2 rounded-full bg-warning mt-1" />
                   <div className="flex-column">
                      <span className="text-xs font-black uppercase">Audit Retention</span>
                      <span className="text-[10px] opacity-50 font-bold">Logs secured for 10 years (JCI)</span>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-8 border-t border-outline-variant">
                <button className="w-full py-4 rounded-2xl bg-surface-container-highest border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined text-sm">shield_person</span>
                   Run Threat Scan
                </button>
             </div>
          </PresentationCard>

          <ClinicalCard padding="2rem" className="border-l-4 border-secondary">
             <h3 className="text-lg font-black tracking-tight mb-2">Record Lifecycle</h3>
             <p className="text-xs opacity-50 mb-6">Automated tracking of medical record retention periods to comply with legal destruction protocols.</p>
             <div className="p-4 rounded-xl bg-secondary-container text-secondary flex-row justify-between items-center mb-6">
                <div className="flex-column">
                   <span className="text-[10px] font-black uppercase">Pending Destruction</span>
                   <span className="text-xl font-black">124 Records</span>
                </div>
                <span className="material-symbols-outlined text-2xl">auto_delete</span>
             </div>
             <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Review Retention Policy</button>
          </ClinicalCard>
        </div>
      </div>
    </div>
  );
}
