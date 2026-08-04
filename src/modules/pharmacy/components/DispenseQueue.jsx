import React from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import EmptyState from '../../../components/ui/EmptyState.jsx';

const ROUTE_CONFIG = {
  PO:  { labelKey: 'pharmacy_v2.routes.oral', defaultLabel: 'Oral', icon: 'pill', bg: 'var(--surface-container-high)', text: 'var(--on-surface)' },
  IV:  { labelKey: 'pharmacy_v2.routes.iv', defaultLabel: 'Intravena', icon: 'colorize', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  SC:  { labelKey: 'pharmacy_v2.routes.sc', defaultLabel: 'Subkutan', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  IM:  { labelKey: 'pharmacy_v2.routes.im', defaultLabel: 'Intramuskular', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
};

export default function DispenseQueue({ pendingQueue, getPatient, onStartDispense, onRefresh }) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-20">
       <div className="flex flex-row items-center justify-between mb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('pharmacy_v2.queue_title', { defaultValue: 'Dispense Queue' })}</h3>
          <button onClick={onRefresh} className="btn-ghost text-[10px] font-bold text-primary flex flex-row items-center gap-1 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
             <span className="material-symbols-outlined text-[10px]">sync</span>
             {t('pharmacy_v2.refresh_queue', { defaultValue: 'Refresh' })}
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pendingQueue.length === 0 ? (
             <div className="col-span-full py-20">
               <EmptyState icon="inventory_2" title={t('pharmacy_v2.zero_pending', { defaultValue: 'Queue Empty' })} description="All prescriptions have been dispensed." colorClass="text-success" />
             </div>
          ) : pendingQueue.map(med => {
              const p = getPatient(med.patient_id);
              const routeInfo = ROUTE_CONFIG[med.route] || { labelKey: '', defaultLabel: med.route, icon: 'medication' };
              const lasaConflict = med.lasaWarning;
              const highAlert = med.isHighAlert || routeInfo.highAlert;

              return (
                 <ClinicalCard key={med.id} padding="1.5rem" className={`hover:shadow-premium-hover transition-all relative ${highAlert ? 'border-error/30' : 'border-outline-variant'}`}>
                    {highAlert && (
                       <div className="absolute top-0 right-0 px-3 py-1 bg-error text-white text-[9px] font-black uppercase rounded-bl-xl rounded-tr-[1.2rem] shadow-sm tracking-widest">
                          {t('admin_hub.safety.high_alert', { defaultValue: 'HIGH ALERT' })}
                       </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex flex-row gap-2">
                          <div className="flex flex-col gap-1 w-full min-w-0">
                             <span className="text-[9px] font-black text-primary uppercase tracking-widest">{t('pharmacy_v2.patient_id_label', { defaultValue: 'Patient' })}</span>
                             <div className="text-lg font-black truncate leading-tight">{p ? p.name : t('pharmacy_v2.labels.unknown', { defaultValue: 'Unknown' })}</div>
                             <div className="text-[10px] font-bold text-on-surface-variant truncate">
                                {t('patient_form.mrn')}: {p ? p.mrn : '---'} • {t('patient_form.dob')}: {p ? p.demographics?.dob : '---'}
                             </div>
                          </div>
                       </div>

                        <div className="p-4 rounded-xl border-2 flex flex-row items-center gap-4" style={{ backgroundColor: routeInfo.bg, borderColor: lasaConflict ? 'var(--error)' : 'transparent' }}>
                           <span className="material-symbols-outlined text-2xl" style={{ color: routeInfo.text }}>{routeInfo.icon}</span>
                           <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <div className="text-base font-black truncate leading-none mb-1" style={{ color: routeInfo.text }}>{med.medication_name}</div>
                              <div className="text-[10px] font-bold opacity-70 truncate uppercase tracking-widest" style={{ color: routeInfo.text }}>
                                 {med.dosage || t('pharmacy_v2.dosage_standard', { defaultValue: 'Standard Dosage' })} • {routeInfo.labelKey ? t(routeInfo.labelKey) : routeInfo.defaultLabel}
                              </div>
                              {lasaConflict && (
                                <div className="mt-2 flex flex-row items-center gap-1.5 text-error text-[9px] font-black uppercase bg-error/10 px-2 py-1 rounded w-fit">
                                   <span className="material-symbols-outlined text-[10px]">warning</span>
                                   <span>LASA: {lasaConflict}</span>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="flex flex-row justify-between items-center mt-2 border-t border-outline-variant pt-4">
                           <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">{t('pharmacy_v2.prescribed_by', { defaultValue: 'Prescribed by' })}</span>
                              <span className="text-xs font-bold uppercase truncate text-on-surface-variant">{med.prescribed_by?.split('@')[0]}</span>
                           </div>
                           <button 
                              onClick={() => onStartDispense(med)}
                              className="bg-primary text-white py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-primary-container hover:shadow-lg transition-all"
                           >
                              {t('pharmacy_v2.dispensing_btn', { defaultValue: 'Dispense' })}
                           </button>
                        </div>
                    </div>
                 </ClinicalCard>
              );
          })}
       </div>
    </div>
  );
}
