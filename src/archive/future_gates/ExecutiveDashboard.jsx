/**
 * ARCHIVED FOR FUTURE GATE 1F.4 (Hospital Central Command Center)
 * Original: src/modules/enterprise/pages/ExecutiveDashboard.jsx
 */

import React, { useState, useEffect } from 'react';
import { getHospitalKPIs, getJciComplianceOverview } from '../../modules/enterprise/services/gld.service.js';
import PresentationCard from '../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../components/ui/ClinicalCard.jsx';

const ExecutiveDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [compliance, setCompliance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kpiData = await getHospitalKPIs();
        setKpis(kpiData);
        setCompliance(getJciComplianceOverview());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="p-20 text-center font-black animate-pulse opacity-20">Aggregating Institutional Data...</div>;

  return (
    <main className="executive-war-room">
      <header className="flex-row justify-between items-end mb-12 min-w-0">
        <div className="min-w-0">
          <p className="subtitle m-0 truncate">GLD - Governance & Leadership</p>
          <h2 className="title text-6xl font-black tracking-tighter truncate">Executive Command</h2>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <PresentationCard style={{ gridColumn: 'span 4' }} className="bg-primary text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-on-surface/10 rounded-bl-full -mr-8 -mt-8" />
           <span className="text-[10px] font-black uppercase tracking-widest opacity-60">JCI Compliance Index</span>
           <h3 className="text-8xl font-black mt-4">{kpis.quality_index}<small className="text-2xl">%</small></h3>
        </PresentationCard>
      </div>
    </main>
  );
};

export default ExecutiveDashboard;
