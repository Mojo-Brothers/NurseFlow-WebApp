import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFullEncounterContext } from '../services/reporting.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';

export default function EncounterSummaryPage() {
  const { encounterId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const result = await getFullEncounterContext(encounterId);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [encounterId]);

  if (isLoading) return <div className="p-20 text-center opacity-40 font-black uppercase">Compiling Medical Summary...</div>;
  if (!data) return <div className="p-20 text-center text-error font-black uppercase">Summary not found.</div>;

  const { encounter, patient, triageLogs, soapRecords, billing } = data;

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-12 font-serif print:p-0">
      {/* 🛡️ CONTROL BAR (Hidden on Print) */}
      <div className="flex-row justify-between items-center mb-12 pb-6 border-b border-gray-100 print:hidden">
         <button onClick={() => navigate(-1)} className="flex-row items-center gap-2 text-xs font-bold uppercase opacity-60 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Clinical Workspace
         </button>
         <button onClick={() => window.print()} className="btn-primary py-3 px-8 flex-row items-center gap-2 font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">print</span>
            Execute Official Print
         </button>
      </div>

      {/* 🏛️ OFFICIAL MEDICAL REPORT HEADER */}
      <header className="flex-row justify-between items-start mb-12 border-b-4 border-black pb-8">
         <div className="flex-column gap-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">NurseFlow HIS</h1>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Clinical Intelligence & Medical Summary</p>
            <p className="text-[10px] font-medium opacity-40 mt-4 leading-tight">
               Verified Professional Facility • JCI Accredited V5 <br/>
               Trace ID: {encounter.id.toUpperCase()} <br/>
               Generated: {new Date().toLocaleString()}
            </p>
         </div>
         <div className="text-right flex-column items-end gap-2">
            <div className="p-3 border-2 border-black font-black text-xl tracking-tight">OFFICIAL SUMMARY</div>
            <span className="text-[10px] font-bold uppercase mt-2">ENCOUNTER STATUS: {encounter.status}</span>
         </div>
      </header>

      {/* 📋 PATIENT DEMOGRAPHICS */}
      <section className="mb-12 grid grid-cols-2 gap-12 p-8 bg-gray-50 border border-gray-200">
         <div className="flex-column gap-4">
            <span className="text-[10px] font-black uppercase opacity-40 border-b border-gray-300 pb-1">Patient Identity</span>
            <div>
               <p className="text-2xl font-black">{patient?.name?.toUpperCase()}</p>
               <p className="text-sm font-bold opacity-60 mt-1">MRN: {patient?.mrn} • Gender: {patient?.demographics?.gender}</p>
            </div>
            <p className="text-xs font-medium">Date of Birth: {patient?.demographics?.dob} • ID: {patient?.demographics?.id_number}</p>
         </div>
         <div className="flex-column gap-4">
            <span className="text-[10px] font-black uppercase opacity-40 border-b border-gray-300 pb-1">Encounter Log</span>
            <div className="grid grid-cols-2 gap-4 text-xs font-bold">
               <div>
                  <p className="opacity-40 uppercase text-[8px]">Admitted</p>
                  <p>{encounter.created_at?.toDate().toLocaleString() || 'N/A'}</p>
               </div>
               <div>
                  <p className="opacity-40 uppercase text-[8px]">Discharged</p>
                  <p>{encounter.updated_at?.toDate().toLocaleString() || 'N/A'}</p>
               </div>
               <div>
                  <p className="opacity-40 uppercase text-[8px]">Attending User</p>
                  <p className="truncate">{encounter.updated_by || encounter.created_by}</p>
               </div>
               <div>
                  <p className="opacity-40 uppercase text-[8px]">Ward Location</p>
                  <p>Bed ID: {encounter.bed_id || 'N/A'}</p>
               </div>
            </div>
         </div>
      </section>

      {/* 🌡️ CLINICAL VITAL SIGNS (TRIAGE) */}
      <section className="mb-12">
         <h3 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b-2 border-black">Initial Triage Assessment</h3>
         {triageLogs.length > 0 ? (
           <table className="w-full text-left text-xs">
              <thead>
                 <tr className="border-b border-gray-200 opacity-40 uppercase font-black">
                    <th className="py-2">Time</th>
                    <th>HR (bpm)</th>
                    <th>BP (mmHg)</th>
                    <th>SpO2 (%)</th>
                    <th>Temp (°C)</th>
                    <th>NEWS2</th>
                    <th>Assessed By</th>
                 </tr>
              </thead>
              <tbody className="font-bold">
                 {triageLogs.map(log => (
                    <tr key={log.id} className="border-b border-gray-100">
                       <td className="py-4 font-normal tabular-nums">{log.timestamp?.toDate().toLocaleTimeString()}</td>
                       <td>{log.vitals.heartRate}</td>
                       <td>{log.vitals.systolicBP}</td>
                       <td>{log.vitals.spo2}</td>
                       <td>{log.vitals.temperature}</td>
                       <td>{log.news2Score}</td>
                       <td className="font-normal opacity-60 italic">{log.assessedBy?.split('@')[0]}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
         ) : (
           <p className="text-xs italic opacity-40">No triage logs found for this encounter.</p>
         )}
      </section>

      {/* 📝 MEDICAL PROGRESS NOTES (SOAP) */}
      <section className="mb-12 page-break-before">
         <h3 className="text-xs font-black uppercase tracking-widest mb-6 pb-2 border-b-2 border-black">Clinical Progress Notes (SOAP)</h3>
         <div className="space-y-12">
            {soapRecords.map((rec, idx) => (
              <div key={rec.id} className="relative pl-8 border-l border-gray-200">
                 <div className="absolute -left-1 top-0 w-2 h-2 bg-black rounded-full"></div>
                 <header className="flex-row justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-tight">Record Entry #{idx + 1} — {rec.created_at?.toDate().toLocaleString()}</span>
                    <span className="text-[10px] font-bold italic opacity-40">Doc: {rec.doctor}</span>
                 </header>
                 <div className="grid grid-cols-2 gap-8 text-xs leading-relaxed">
                    <div className="flex-column gap-3">
                       <div>
                          <p className="font-black uppercase text-[8px] opacity-40 mb-1">Subjective</p>
                          <p>{rec.subjective}</p>
                       </div>
                       <div>
                          <p className="font-black uppercase text-[8px] opacity-40 mb-1">Objective</p>
                          <p>{rec.objective || 'Deferred'}</p>
                       </div>
                    </div>
                    <div className="flex-column gap-3">
                       <div>
                          <p className="font-black uppercase text-[8px] opacity-40 mb-1">Clinical Assessment</p>
                          <p className="font-bold">{rec.assessment}</p>
                       </div>
                       <div>
                          <p className="font-black uppercase text-[8px] opacity-40 mb-1">Medication Plan</p>
                          {rec.plan_medications?.length > 0 ? (
                            <ul className="list-disc pl-4">
                               {rec.plan_medications.map((m, i) => <li key={i}>{m.medication_name} ({m.dosage} {m.route})</li>)}
                            </ul>
                          ) : <p className="italic opacity-40">No medications prescribed in this entry.</p>}
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            {soapRecords.length === 0 && <p className="text-xs italic opacity-40">No medical records found.</p>}
         </div>
      </section>

      {/* 🖋️ SIGNATURE & FOOTER */}
      <footer className="mt-24 pt-12 border-t border-gray-100 flex-row justify-between items-end">
         <div className="flex-column gap-1 opacity-40 text-[10px] font-bold uppercase tracking-widest">
            <p>Certified Digital Record</p>
            <p>NurseFlow HIS V5.2 Compliance</p>
            <p>© 2026 Clinical Intelligence Engine</p>
         </div>
         <div className="flex-column items-center gap-2">
            <div className="w-48 h-12 border-b-2 border-black border-dashed mb-1 flex items-center justify-center italic text-xs opacity-20">Doctor Signature / Stamp</div>
            <p className="text-[10px] font-black uppercase tracking-tight">{encounter.updated_by || 'Unauthorized'}</p>
         </div>
      </footer>
    </div>
  );
}
