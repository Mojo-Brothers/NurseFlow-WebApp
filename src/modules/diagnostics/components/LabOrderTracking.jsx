import React from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * LabOrderTracking — A real-time status board for the diagnostic lifecycle.
 */
export default function LabOrderTracking({ orders = [] }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'VALIDATED': return 'bg-success text-white';
      case 'IN_PROGRESS': return 'bg-secondary text-white animate-pulse';
      case 'COLLECTED': return 'bg-primary text-white';
      default: return 'bg-surface-container-high text-on-surface-variant opacity-40';
    }
  };

  return (
    <div className="flex-column gap-6">
       <div className="flex-row justify-between items-center px-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60">Diagnostic Pipeline</h3>
          <span className="text-[8px] font-bold opacity-40 italic">Last update: Just now</span>
       </div>

       <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-[10px] italic opacity-40 text-center py-4">No active lab orders.</p>
          ) : orders.map((order, i) => (
             <ClinicalCard key={i} padding="1rem" className="bg-surface border-none shadow-sm hover:shadow-md transition-all">
                <div className="flex-row justify-between items-center mb-4">
                   <div>
                      <p className="text-xs font-black">{order.test_name}</p>
                      <p className="text-[8px] font-bold opacity-40 uppercase">Requested by {order.requested_by}</p>
                   </div>
                   <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                   </span>
                </div>

                <div className="flex-row justify-between relative mt-6 px-2">
                   {/* Progress Line */}
                   <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant -translate-y-1/2 z-0" />
                   
                   {['ORDERED', 'COLLECTED', 'IN_PROGRESS', 'VALIDATED'].map((step, idx) => {
                      const isActive = order.status === step;
                      const isPast = ['ORDERED', 'COLLECTED', 'IN_PROGRESS', 'VALIDATED'].indexOf(order.status) >= idx;
                      return (
                         <div key={idx} className="z-10 flex-column items-center gap-1">
                            <div className={`w-3 h-3 rounded-full border-2 transition-all 
                               ${isActive ? 'bg-primary border-primary scale-150' : isPast ? 'bg-primary border-primary' : 'bg-surface border-outline-variant'}`} 
                            />
                            <span className={`text-[6px] font-black uppercase ${isPast ? 'text-primary' : 'opacity-20'}`}>{step}</span>
                         </div>
                      );
                   })}
                </div>
             </ClinicalCard>
          ))}
       </div>
    </div>
  );
}
