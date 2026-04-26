import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { getInventoryLevels, getPredictiveForecast } from '../services/inventory.service.js';

/**
 * InventoryDashboard — The logistical command center.
 */
export default function InventoryDashboard() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInventoryLevels().then(data => {
      // If empty, use simulated data for demonstration
      const demoData = data.length > 0 ? data : [
        { id: '1', medication_name: 'Paracetamol 500mg', current_stock: 45, unit: 'Tabs', avg_daily_usage: 12, location: 'MAIN_PHARMACY' },
        { id: '2', medication_name: 'Ceftriaxone 1g (IV)', current_stock: 8, unit: 'Vials', avg_daily_usage: 4, location: 'ER_DEPT' },
        { id: '3', medication_name: 'Normal Saline 500ml', current_stock: 120, unit: 'Bags', avg_daily_usage: 15, location: 'MAIN_PHARMACY' },
      ];
      setItems(demoData);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in w-full overflow-y-auto">
       <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="min-w-0">
             <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-2 truncate">{t('inventory_v2.title')}</h1>
             <p className="text-on-surface-variant font-medium opacity-60">{t('inventory_v2.subtitle')}</p>
          </div>
          <div className="flex-row flex-wrap gap-3 shrink-0">
             <button className="btn-ghost text-[10px] font-black uppercase px-6 py-3 border border-outline-variant">{t('inventory_v2.actions.audit_log')}</button>
             <button className="btn-primary text-[10px] font-black uppercase px-8 py-3 shadow-lg">{t('inventory_v2.actions.new_order')}</button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(item => {
             const forecast = getPredictiveForecast(item);
             return (
                <ClinicalCard key={item.id} padding="1.5rem" className="bg-surface border-none shadow-sm relative overflow-hidden group">
                   {forecast.status === 'CRITICAL' && (
                      <div className="absolute top-0 right-0 p-2 bg-error text-white rounded-bl-xl animate-pulse">
                         <span className="material-symbols-outlined text-sm">warning</span>
                      </div>
                   )}
                   
                   <p className="text-[10px] font-black uppercase opacity-40 mb-1">{item.location}</p>
                   <h3 className="text-lg font-black mb-4 leading-tight">{item.medication_name}</h3>

                   <div className="flex-row items-baseline gap-2 mb-6">
                      <span className="text-4xl font-black tabular-nums">{item.current_stock}</span>
                      <span className="text-xs font-bold opacity-40 uppercase">{item.unit}</span>
                   </div>

                   <div className={`p-4 rounded-2xl flex-column gap-1 
                      ${forecast.status === 'CRITICAL' ? 'bg-error/10 border border-error/20' : 
                        forecast.status === 'WARNING' ? 'bg-warning/10 border border-warning/20' : 'bg-surface-container'}`}>
                      <div className="flex-row justify-between items-center">
                         <span className="text-[9px] font-black uppercase opacity-60">{t('inventory_v2.sections.continuity')}</span>
                         <span className={`text-[10px] font-black ${forecast.status === 'CRITICAL' ? 'text-error' : 'text-primary'}`}>
                            {forecast.daysRemaining} {t('inventory_v2.metrics.days_left')}
                         </span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full mt-1 overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-1000 ${forecast.status === 'CRITICAL' ? 'bg-error' : 'bg-primary'}`} 
                           style={{ width: `${Math.min(100, (forecast.daysRemaining / 14) * 100)}%` }} 
                         />
                      </div>
                   </div>

                   {forecast.reorderSuggested && (
                      <button className="w-full mt-4 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">
                         {t('inventory_v2.actions.reorder_now')}
                      </button>
                   )}
                </ClinicalCard>
             );
          })}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ClinicalCard padding="2rem" className="bg-surface-container border-none">
             <h3 className="text-sm font-black uppercase mb-6">{t('inventory_v2.sections.trends')}</h3>
             <div className="h-[200px] w-full flex-row items-end gap-3 px-4">
                {[45, 52, 38, 65, 48, 72, 58].map((val, i) => (
                   <div key={i} className="flex-1 bg-primary/20 rounded-t-lg group relative h-full flex flex-col justify-end">
                      <div 
                        className="w-full bg-primary rounded-t-lg group-hover:bg-primary/80 transition-all cursor-pointer" 
                        style={{ height: `${(val / 80) * 100}%` }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-on-surface text-surface text-[8px] font-black px-2 py-1 rounded">
                         {val} units
                      </div>
                   </div>
                ))}
             </div>
             <div className="flex-row justify-between mt-4 px-2 opacity-40 text-[8px] font-black uppercase tracking-widest">
                <span>{t('common.days.mon', { defaultValue: 'Mon' })}</span>
                <span>{t('common.days.tue', { defaultValue: 'Tue' })}</span>
                <span>{t('common.days.wed', { defaultValue: 'Wed' })}</span>
                <span>{t('common.days.thu', { defaultValue: 'Thu' })}</span>
                <span>{t('common.days.fri', { defaultValue: 'Fri' })}</span>
                <span>{t('common.days.sat', { defaultValue: 'Sat' })}</span>
                <span>{t('common.days.sun', { defaultValue: 'Sun' })}</span>
             </div>
          </ClinicalCard>

          <ClinicalCard padding="2rem" className="bg-primary/5 border border-primary/20">
             <h3 className="text-sm font-black uppercase text-primary mb-6">{t('inventory_v2.sections.ai_procurement')}</h3>
             <div className="space-y-4">
                {[
                  { item: 'Ceftriaxone 1g', reason: 'High velocity in ER + 2 Days supply left', qty: '50 Vials' },
                  { item: 'Paracetamol 500mg', reason: 'Historical weekend surge predicted', qty: '1000 Tabs' }
                ].map((task, i) => (
                   <div key={i} className="p-4 bg-surface rounded-2xl border border-primary/10 flex-row justify-between items-center shadow-sm gap-4 min-w-0">
                      <div className="flex-column min-w-0">
                         <span className="text-xs font-black truncate">{task.item}</span>
                         <span className="text-[10px] font-medium opacity-60 truncate">{task.reason}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-xs font-black text-primary">+{task.qty}</span>
                         <p className="text-[8px] font-bold opacity-40 uppercase">Add to Cart</p>
                      </div>
                   </div>
                ))}
             </div>
          </ClinicalCard>
       </div>
    </div>
  );
}
