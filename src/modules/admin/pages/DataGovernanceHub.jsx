import React, { useState, useEffect } from 'react';
import { getRecordCompletenessMetrics, FORBIDDEN_ABBREVIATIONS } from '../../enterprise/services/moi.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const DataGovernanceHub = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getRecordCompletenessMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) return <div className="p-12 text-center opacity-20">Analysing Information Integrity...</div>;

  return (
    <main className="p-8 bg-surface-container-lowest min-h-screen">
      <header className="mb-12">
        <p className="subtitle m-0">MOI - Information Management</p>
        <h2 className="title text-5xl font-black tracking-tight">Data Governance Hub</h2>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Record Completeness */}
        <PresentationCard style={{ gridColumn: 'span 4' }} className="bg-primary text-white">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Record Completeness (KLPCM)</span>
           <h3 className="text-7xl font-black mt-4">{metrics.completeness_rate}%</h3>
           <p className="text-[10px] font-bold uppercase mt-auto">JCI MOI.2 Compliance Achieved</p>
        </PresentationCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }} className="flex-column justify-between border-l-8 border-warning">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Missing Signatures</span>
           <h3 className="text-6xl font-black mt-4">{metrics.missing_signatures}</h3>
           <p className="text-[10px] font-bold text-warning uppercase mt-auto">Action: Automated alerts sent to clinicians</p>
        </ClinicalCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }} className="flex-column justify-between border-l-8 border-success">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Privacy Governance</span>
           <h3 className="text-4xl font-black mt-4">{metrics.governance_status}</h3>
           <p className="text-[10px] font-bold text-success uppercase mt-auto">Zero data breaches in last 365 days</p>
        </ClinicalCard>

        {/* Terminology Standardization */}
        <div style={{ gridColumn: 'span 12' }} className="mt-8">
           <h4 className="text-xl font-black uppercase tracking-tight mb-6">Standard Clinical Terminology</h4>
           <div className="bg-white rounded-3xl border border-outline-variant overflow-hidden">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-surface-container text-[10px] font-black uppercase tracking-widest">
                       <th className="p-4">Forbidden Abbreviation</th>
                       <th className="p-4">Standard Replacement</th>
                       <th className="p-4">Clinical Risk</th>
                    </tr>
                 </thead>
                 <tbody>
                    {FORBIDDEN_ABBREVIATIONS.map(rule => (
                       <tr key={rule.term} className="border-t border-outline-variant hover:bg-primary/5 transition-all">
                          <td className="p-4 text-sm font-black text-error">{rule.term}</td>
                          <td className="p-4 text-sm font-bold">{rule.replacement}</td>
                          <td className="p-4 text-xs opacity-60 font-medium">{rule.reason}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </main>
  );
};

export default DataGovernanceHub;
