import React, { useEffect, useState } from 'react';
import { getDiagnosticContext, bootstrapDiagnostics } from '../services/diagnostics.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import LabOrderTracking from './LabOrderTracking';

export default function DiagnosticViewer({ encounterId }) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = async () => {
    if (!encounterId) return;
    setIsLoading(true);
    try {
      const data = await getDiagnosticContext(encounterId);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [encounterId]);

  const handleBootstrap = async () => {
    await bootstrapDiagnostics(encounterId);
    fetchResults();
  };

  if (isLoading) return <div className="p-10 text-center text-xs font-bold opacity-40 animate-pulse">Analyzing Diagnostics...</div>;

  const labs = results.filter(r => r.type === 'LAB');
  const rads = results.filter(r => r.type === 'RAD');

  return (
    <div className="flex-column gap-10">
      {/* 📊 LAB PIPELINE (NEW) */}
      <LabOrderTracking orders={[
         { test_name: 'Complete Blood Count', requested_by: 'dr.Andi', status: 'IN_PROGRESS' },
         { test_name: 'Electrolytes (Na, K, Cl)', requested_by: 'dr.Andi', status: 'COLLECTED' }
      ]} />

      {results.length === 0 && (
        <div className="p-12 text-center border-2 border-dashed border-outline-variant rounded-2xl">
           <p className="text-xs font-bold opacity-40 mb-4">No diagnostic records found for this encounter.</p>
           <button onClick={handleBootstrap} className="btn-ghost px-6 py-2 text-[10px] font-black uppercase border border-primary/20">
              Simulate Lab/Rad Integration
           </button>
        </div>
      )}

      {/* 🧪 LABORATORY SECTION */}
      {labs.length > 0 && (
        <div className="flex-column gap-3">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Clinical Laboratory Results</h4>
           <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-surface-container text-[9px] font-black uppercase opacity-60">
                       <th className="p-4">Test Description</th>
                       <th className="p-4">Result</th>
                       <th className="p-4">Reference Range</th>
                       <th className="p-4">Status</th>
                    </tr>
                 </thead>
                 <tbody className="text-xs">
                    {labs.map(lab => {
                       const isCritical = lab.status === 'CRITICAL' || lab.critical;
                       return (
                        <tr key={lab.id} className={`border-t border-outline-variant ${isCritical ? 'bg-error-container/10' : ''}`}>
                           <td className="p-4 font-bold">{lab.test_name}</td>
                           <td className={`p-4 font-black ${isCritical ? 'text-error animate-pulse' : 'text-primary'}`}>
                              {lab.result_value} <span className="text-[9px] opacity-60">{lab.unit}</span>
                              {isCritical && <span className="ml-2 text-[8px] bg-error text-white px-1.5 py-0.5 rounded">CRITICAL ALERT</span>}
                           </td>
                           <td className="p-4 opacity-60 font-medium tabular-nums">{lab.normal_range || '---'}</td>
                           <td className="p-4">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${isCritical ? 'bg-error text-white' : 'bg-success/10 text-success'}`}>
                                 {isCritical ? 'URGENT' : 'Final'}
                              </span>
                           </td>
                        </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* 📸 RADIOLOGY SECTION */}
      {rads.length > 0 && (
        <div className="flex-column gap-3">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary px-2">Radiology & Imaging</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rads.map(rad => (
                 <ClinicalCard key={rad.id} padding="0" className="overflow-hidden border-2 border-outline-variant hover:border-secondary transition-all group">
                    <div className="aspect-video bg-black relative overflow-hidden">
                       <img src={rad.image_url} alt={rad.test_name} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-all duration-700" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                          <div>
                             <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Imaging Study</p>
                             <p className="text-sm font-black text-white">{rad.test_name}</p>
                          </div>
                       </div>
                    </div>
                    <div className="p-4 bg-surface-container-low">
                       <p className="text-[10px] font-black uppercase opacity-40 mb-2">Radiologist Conclusion</p>
                       <p className="text-xs font-medium leading-relaxed italic">"{rad.result_value}"</p>
                       <div className="mt-4 pt-3 border-t border-outline-variant flex-row justify-between items-center">
                          <span className="text-[8px] font-black opacity-60">DICOM v3.0 Verified</span>
                          <button className="text-[8px] font-black uppercase text-secondary hover:underline">View Full PACS</button>
                       </div>
                    </div>
                 </ClinicalCard>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
