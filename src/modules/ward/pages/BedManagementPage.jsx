import React, { useEffect, useState, useMemo } from 'react';
import { getAllBeds, releaseBed, assignBed } from '../services/bed.service.js';
import { doc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { useAuth } from '../../../contexts/useAuth.js';

export default function BedManagementPage() {
  const { currentUser } = useAuth();
  const { activeEncounters, fetchActiveEncounters } = useEncounterStore();
  const { patients, fetchPatients } = usePatientStore();
  
  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchActiveEncounters(), fetchPatients()]);
      const bedsData = await getAllBeds();
      setBeds(bedsData);
      setIsLoading(false);
    };
    init();
  }, [fetchActiveEncounters, fetchPatients]);

  const bedMap = useMemo(() => {
    return beds.map(bed => {
      const encounter = activeEncounters.find(e => e.id === bed.encounter_id);
      const patient = patients.find(p => p.id === bed.patient_id);
      return {
        ...bed,
        patientName: patient?.name || 'Empty',
        news2: encounter?.last_news2 || 0,
        status: encounter?.status || 'N/A'
      };
    });
  }, [beds, activeEncounters, patients]);

  const handleRelease = async (bedId) => {
    if (!window.confirm("Release this bed? Patient data will remain in EMR but location will be cleared.")) return;
    try {
      await releaseBed(bedId, currentUser.email);
      const updated = await getAllBeds();
      setBeds(updated);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleBootstrap = async () => {
    if (!window.confirm("Initialize 20 beds for Ward A?")) return;
    setIsLoading(true);
    try {
      for (let i = 1; i <= 20; i++) {
        const bedRef = doc(collection(db, COLLECTIONS.BEDS));
        await setDoc(bedRef, {
          bed_name: `A-${100 + i}`,
          ward: 'Ward A',
          is_occupied: false,
          encounter_id: null,
          patient_id: null,
          type: i > 15 ? 'HD' : 'STANDARD',
          created_at: serverTimestamp()
        });
      }
      const updated = await getAllBeds();
      setBeds(updated);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center opacity-40 font-black uppercase">Loading Ward Map...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10 flex-row justify-between items-end">
         <div>
            <h2 className="title text-primary">Ward Spatial Management</h2>
            <p className="text-on-surface-variant text-sm mt-1">Real-time bed occupancy and clinical risk localization.</p>
         </div>
         <div className="flex-row gap-4 items-end">
            <button 
              onClick={handleBootstrap} 
              className="btn-ghost py-2 px-4 text-[10px] font-black uppercase border border-primary/20 hover:bg-primary/5 mb-1"
            >
              Bootstrap Ward A
            </button>
            <div className="flex-row gap-6 text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
               <div className="flex-row items-center gap-2"><div className="w-3 h-3 bg-primary/20 rounded"></div> Available</div>
               <div className="flex-row items-center gap-2"><div className="w-3 h-3 bg-success rounded"></div> Stable</div>
               <div className="flex-row items-center gap-2"><div className="w-3 h-3 bg-error animate-pulse rounded"></div> High Risk</div>
            </div>
         </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {bedMap.map(bed => {
          const isOccupied = bed.is_occupied;
          const isHighRisk = bed.news2 >= 7;
          
          return (
            <div 
              key={bed.id} 
              className={`p-4 rounded-3xl border-2 transition-all flex-column gap-3 relative
                ${!isOccupied ? 'bg-surface-container-low border-outline-variant opacity-60' : 
                  isHighRisk ? 'bg-error-container border-error shadow-lg animate-pulse' : 'bg-white border-success shadow-sm'}`}
            >
               <div className="flex-row justify-between items-center">
                  <span className="text-xs font-black opacity-40">{bed.bed_name}</span>
                  {isOccupied && (
                    <button onClick={() => handleRelease(bed.id)} className="material-symbols-outlined text-sm opacity-20 hover:opacity-100 hover:text-error">logout</button>
                  )}
               </div>

               <div className="flex-column items-center justify-center py-4">
                  <span className={`material-symbols-outlined text-4xl ${!isOccupied ? 'opacity-10' : isHighRisk ? 'text-error' : 'text-success'}`}>
                    {isOccupied ? 'person' : 'bed'}
                  </span>
                  <span className={`text-[10px] font-black uppercase mt-2 ${!isOccupied ? 'opacity-20' : ''}`}>
                    {bed.patientName}
                  </span>
               </div>

               {isOccupied && (
                 <div className="pt-2 border-t border-outline-variant border-dashed flex-row justify-between items-center">
                    <span className="text-[8px] font-black uppercase opacity-40">{bed.status}</span>
                    <span className={`text-[10px] font-black ${isHighRisk ? 'text-error' : 'text-success'}`}>
                       {bed.news2} NEWS2
                    </span>
                 </div>
               )}
            </div>
          );
        })}

        {/* MOCK ADD BED (For Demo) */}
        <button className="p-4 rounded-3xl border-2 border-dashed border-outline-variant flex items-center justify-center opacity-20 hover:opacity-100 transition-all">
           <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

      {bedMap.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-outline-variant rounded-3xl opacity-20 mt-10">
           <p className="text-sm font-black uppercase tracking-widest">No Beds Configured for this Ward</p>
        </div>
      )}
    </div>
  );
}
