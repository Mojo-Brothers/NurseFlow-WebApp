/**
 * ARCHIVED FOR FUTURE GATE 1F.5 (Infection Prevention & Control / PPI)
 * Original: src/modules/admin/pages/InfectionSurveillance.jsx
 */

import React, { useState, useEffect } from 'react';
import { getInfectionMetrics } from '../../modules/core/services/pci.service.js';
import PresentationCard from '../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../components/ui/ClinicalCard.jsx';

const InfectionSurveillance = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getInfectionMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (isLoading) return <div className="p-12 text-center font-black uppercase opacity-20">Analysing Biothreats...</div>;

  return (
    <main className="surveillance-page">
      <header className="editorial-header mb-12">
        <p className="subtitle m-0">PCI - Infection Prevention & Control</p>
        <h2 className="title">Biosecurity Command Hub</h2>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Key Metrics */}
        <PresentationCard style={{ gridColumn: 'span 4' }} className="bg-error text-white">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Isolations</span>
          <h3 className="text-7xl font-black mt-4">{metrics.active_isolations}</h3>
          <p className="text-[10px] font-bold uppercase mt-auto">Cross-department protocol active</p>
        </PresentationCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }}>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Hand Hygiene Compliance</span>
          <h3 className="text-6xl font-black text-success mt-4">{metrics.hand_hygiene_compliance}%</h3>
          <div className="w-full bg-surface-container h-2 mt-auto rounded-full overflow-hidden">
            <div className="bg-success h-full" style={{ width: `${metrics.hand_hygiene_compliance}%` }} />
          </div>
        </ClinicalCard>

        <ClinicalCard style={{ gridColumn: 'span 4' }} borderLeft="8px solid var(--warning)">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">HAI Risks Detected (24h)</span>
          <h3 className="text-6xl font-black text-on-surface mt-4">{metrics.hai_alerts_24h}</h3>
          <p className="text-[10px] font-bold text-warning uppercase mt-auto">Action required by PCI Nurses</p>
        </ClinicalCard>

        {/* Ward Hotspots */}
        <div style={{ gridColumn: 'span 12' }} className="mt-8">
           <h4 className="text-xl font-black uppercase tracking-tight mb-6">Ward Risk Heatmap</h4>
           <div className="grid grid-cols-3 gap-6">
              {metrics.ward_hotspots.map(ward => (
                 <ClinicalCard key={ward.ward} className="p-6 flex-row items-center justify-between border-2 border-outline-variant hover:border-primary transition-all">
                    <div>
                       <h5 className="text-lg font-black">{ward.ward}</h5>
                       <p className="text-[10px] font-bold opacity-40 uppercase">{ward.count} Active Cases</p>
                    </div>
                    <span className={`chip chip-${ward.status.toLowerCase()} font-black text-[10px] uppercase`}>
                       {ward.status}
                    </span>
                 </ClinicalCard>
              ))}
           </div>
        </div>
      </div>
    </main>
  );
};

export default InfectionSurveillance;
