import React from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import PresentationCard from '../../../components/ui/PresentationCard';

const LabPage = () => {
  return (
    <div className="p-8">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary">Architectural Sandbox (LAB)</h1>
          <p className="text-on-surface-variant font-medium">Experimental UI zone — DESIGN LAW is relaxed to warnings here.</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Experiment 1: Illegal Style in Lab */}
        <div className="flex-column gap-4">
          <h3 className="font-bold text-sm uppercase tracking-widest opacity-60">Test: Illegal Style (Warning Only)</h3>
          <ClinicalCard 
            style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 94, 184, 0.1)' }}
          >
            <p className="font-bold text-primary">This ClinicalCard has a blur!</p>
            <p className="text-xs">In a normal module, this would CRASH the app. Here it only triggers a console warning.</p>
          </ClinicalCard>
        </div>

        {/* Experiment 2: Mixed Zones */}
        <div className="flex-column gap-4">
          <h3 className="font-bold text-sm uppercase tracking-widest opacity-60">Test: Zone Mixing</h3>
          <PresentationCard height="200px">
            <h4 className="font-black text-white">Ambient Presentation</h4>
            <div className="mt-4">
               <ClinicalCard padding="0.75rem">
                  <span className="text-xs font-bold">Inner Clinical Card</span>
               </ClinicalCard>
            </div>
          </PresentationCard>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant text-center">
        <p className="text-sm font-bold text-on-surface-variant">
          "The Lab is where we find the next evolution of clinical speed. Once proven here, it becomes Law there."
        </p>
      </div>
    </div>
  );
};

export default LabPage;
