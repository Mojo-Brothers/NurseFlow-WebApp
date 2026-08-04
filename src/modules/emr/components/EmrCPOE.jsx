import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getInventoryLevels } from '../../../inventory/services/inventory.service.js';
import { checkAllergyConflict } from '../../../../utils/clinicalEngine.js';

const LAB_ORDERS = [
  { id: 'l1', test_name: 'Darah Lengkap (CBC)' },
  { id: 'l2', test_name: 'Gula Darah Sewaktu (GDS)' },
  { id: 'l3', test_name: 'Fungsi Ginjal (Ureum/Creatinin)' },
  { id: 'l4', test_name: 'Elektrolit (Na, K, Cl)' },
];

const RAD_ORDERS = [
  { id: 'r1', test_name: 'X-Ray Thorax (PA)' },
  { id: 'r2', test_name: 'USG Abdomen' },
  { id: 'r3', test_name: 'CT Scan Kepala Non-Kontras' },
];

export default function EmrCPOE({
  activePatient,
  selectedMeds,
  setSelectedMeds,
  selectedLabs,
  setSelectedLabs,
  selectedRads,
  setSelectedRads
}) {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState([]);
  const [medSearch, setMedSearch] = useState('');

  useEffect(() => {
    getInventoryLevels().then(data => {
       // Filter out non-medications if necessary, or assume all are meds for this demo
       setInventory(data);
    }).catch(console.error);
  }, []);

  const toggleMed = (med) => {
    const exists = selectedMeds.find(m => m.id === med.id);
    if (exists) {
      setSelectedMeds(selectedMeds.filter(m => m.id !== med.id));
    } else {
      setSelectedMeds([...selectedMeds, { ...med, dosage: '1 tablet', route: 'PO' }]); // Default dosage for demo
    }
  };

  const toggleLab = (lab) => {
    const exists = selectedLabs.find(l => l.id === lab.id);
    if (exists) setSelectedLabs(selectedLabs.filter(l => l.id !== lab.id));
    else setSelectedLabs([...selectedLabs, lab]);
  };

  const toggleRad = (rad) => {
    const exists = selectedRads.find(r => r.id === rad.id);
    if (exists) setSelectedRads(selectedRads.filter(r => r.id !== rad.id));
    else setSelectedRads([...selectedRads, rad]);
  };

  const filteredMeds = inventory.filter(i => (i.item_name || i.medication_name || '').toLowerCase().includes(medSearch.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-y-auto w-full xl:max-w-[420px]">
       {/* ─── ORDER ENTRY: PHARMACY ─── */}
       <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
         <div className="flex flex-row items-center justify-between gap-2 mb-2">
            <div className="flex flex-row items-center gap-2">
               <span className="material-symbols-outlined text-primary text-sm">prescriptions</span>
               <label className="text-[10px] font-black uppercase text-primary">{t('emr_v2.soap.pharmacy', { defaultValue: 'CPOE: Pharmacy' })}</label>
            </div>
            <input 
              type="text" 
              placeholder="Cari obat..." 
              value={medSearch}
              onChange={e => setMedSearch(e.target.value)}
              className="px-2 py-1 text-[10px] border border-outline rounded focus:outline-none focus:border-primary"
            />
         </div>
         
         <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
            {filteredMeds.length === 0 ? (
               <p className="text-[10px] text-center italic opacity-50 py-4">Obat tidak ditemukan di inventory.</p>
            ) : filteredMeds.map(med => {
               const medName = med.item_name || med.medication_name;
               const isSelected = selectedMeds.find(m => m.id === med.id);
               const hasConflict = checkAllergyConflict(medName, activePatient?.allergies);
               const isOutOfStock = med.current_stock <= 0; 
               return (
                  <button 
                    key={med.id} 
                    disabled={hasConflict || isOutOfStock}
                    onClick={() => toggleMed(med)} 
                    className={`flex flex-row items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${hasConflict ? 'border-error bg-error-container text-on-error-container' : 
                        isOutOfStock ? 'bg-surface-container opacity-50 grayscale border-transparent' :
                        isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface border-outline-variant hover:border-primary/30'}`}
                  >
                     <span className="material-symbols-outlined text-sm">
                       {hasConflict ? 'warning' : isOutOfStock ? 'inventory_2' : 'pill'}
                     </span>
                     <div className="flex-1 min-w-0">
                        <div className="flex flex-row justify-between items-center">
                           <div className="text-[10px] font-black truncate">{medName}</div>
                           {!hasConflict && (
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOutOfStock ? 'bg-error animate-pulse' : 'bg-success'}`} />
                           )}
                        </div>
                        <div className="text-[8px] font-bold opacity-70 uppercase tracking-wider mt-0.5">
                          {hasConflict ? `⚠️ ${t('emr_v2.alerts.allergy_conflict', { defaultValue: 'Allergy Conflict' })}` : isOutOfStock ? t('emr_v2.pharmacy.out_of_stock', { defaultValue: 'Out of Stock' }) : `Stok: ${med.current_stock || 0}`}
                        </div>
                     </div>
                     {isSelected && <span className="material-symbols-outlined text-sm">verified</span>}
                  </button>
               );
            })}
         </div>
       </div>

       {/* ─── ORDER ENTRY: DIAGNOSTICS ─── */}
       <div className="flex flex-col gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
          <div className="flex flex-row items-center gap-2">
             <span className="material-symbols-outlined text-secondary text-sm">biotech</span>
             <label className="text-[10px] font-black uppercase text-secondary">Instruksi Medis (CPOE)</label>
          </div>
          
          <div className="flex flex-col gap-2">
             <span className="text-[8px] font-black uppercase opacity-50">Laboratorium</span>
             <div className="flex flex-row flex-wrap gap-2">
                {LAB_ORDERS.map(lab => (
                   <button
                     key={lab.id}
                     onClick={() => toggleLab(lab)}
                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all flex flex-row items-center gap-2
                        ${selectedLabs.find(l => l.id === lab.id) ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-secondary/50'}`}
                   >
                      <span className="material-symbols-outlined text-[10px]">science</span>
                      {lab.test_name}
                   </button>
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
             <span className="text-[8px] font-black uppercase opacity-50">Radiologi</span>
             <div className="flex flex-row flex-wrap gap-2">
                {RAD_ORDERS.map(rad => (
                   <button
                     key={rad.id}
                     onClick={() => toggleRad(rad)}
                     className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all flex flex-row items-center gap-2
                        ${selectedRads.find(r => r.id === rad.id) ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-secondary/50'}`}
                   >
                      <span className="material-symbols-outlined text-[10px]">radiology</span>
                      {rad.test_name}
                   </button>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}
