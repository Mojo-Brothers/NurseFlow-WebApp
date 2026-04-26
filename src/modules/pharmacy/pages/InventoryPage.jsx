import React, { useEffect, useState } from 'react';
import { getInventoryStatus, updateStockLevel } from '../services/inventory.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';
import { useTranslation } from 'react-i18next';

const SEED_DATA = [
  { medication_name: 'Paracetamol', stock_quantity: 500, unit: 'Tablets', reorder_level: 100 },
  { medication_name: 'Amoxicillin', stock_quantity: 200, unit: 'Capsules', reorder_level: 50 },
  { medication_name: 'Ceftriaxone', stock_quantity: 50, unit: 'Vials', reorder_level: 20 },
  { medication_name: 'Normal Saline', stock_quantity: 100, unit: 'Bags (500ml)', reorder_level: 30 },
  { medication_name: 'Insulin', stock_quantity: 25, unit: 'Pens', reorder_level: 10 },
];

export default function InventoryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const data = await getInventoryStatus();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleBootstrap = async () => {
    if (!window.confirm(t('pharmacy_v2.inventory.alerts.confirm_init') || 'Initialize inventory?')) return;
    setIsBootstrapping(true);
    try {
       for (const item of SEED_DATA) {
         await addDoc(collection(db, COLLECTIONS.INVENTORY), {
            ...item,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
         });
       }
       fetchInventory();
    } catch (err) {
       alert(t('pharmacy_v2.inventory.alerts.init_failed') + err.message);
    } finally {
       setIsBootstrapping(false);
    }
  };

  const handleAdjustStock = async (id, currentQty) => {
    const newQty = window.prompt(t('pharmacy_v2.inventory.alerts.prompt_qty') || 'New Quantity:', currentQty);
    if (newQty === null || isNaN(newQty)) return;
    try {
      await updateStockLevel(id, parseInt(newQty));
      fetchInventory();
    } catch (err) {
      alert(t('pharmacy_v2.inventory.alerts.update_failed') + err.message);
    }
  };

  const getStatusInfo = (item) => {
    if (item.stock_quantity <= 0) return { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: t('pharmacy_v2.alerts.out_of_stock') };
    if (item.stock_quantity <= item.reorder_level) return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: t('pharmacy_v2.inventory.legend.low') };
    return { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: t('pharmacy_v2.inventory.legend.stocked') };
  };

  const filteredItems = items.filter(item => 
    item.medication_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: items.length,
    low: items.filter(i => i.stock_quantity > 0 && i.stock_quantity <= i.reorder_level).length,
    critical: items.filter(i => i.stock_quantity <= 0).length
  };

  return (
    <div className="p-8 h-full flex-column gap-6 overflow-hidden bg-surface-lowest">
      {/* HEADER COMMAND CENTER */}
      <header className="flex-row justify-between items-center bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant shadow-lg backdrop-blur-3xl bg-white/40 dark:bg-black/20">
         <div className="flex-row items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
               <span className="material-symbols-outlined text-primary text-4xl">inventory_2</span>
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tight leading-none mb-1">{t('pharmacy_v2.inventory.title')}</h1>
               <div className="flex-row items-center gap-3">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-md border border-primary/20 uppercase tracking-widest">
                    Live Surveillance
                  </span>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t('pharmacy_v2.inventory.subtitle')}</p>
               </div>
            </div>
         </div>

         <div className="flex-row gap-4 items-center">
            {/* QUICK STATS */}
            <div className="flex-row gap-4 px-6 border-r border-outline-variant mr-4">
               <div className="text-center">
                  <p className="text-[10px] font-black opacity-40 uppercase mb-1">Items</p>
                  <p className="text-xl font-black tracking-tighter">{stats.total}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-warning uppercase mb-1">Low</p>
                  <p className="text-xl font-black tracking-tighter text-warning">{stats.low}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-error uppercase mb-1">Critical</p>
                  <p className="text-xl font-black tracking-tighter text-error">{stats.critical}</p>
               </div>
            </div>

            <button onClick={fetchInventory} className="btn-ghost w-12 h-12 rounded-xl flex items-center justify-center">
               <span className={`material-symbols-outlined ${isLoading ? 'anim-spin' : ''}`}>sync</span>
            </button>
            <button 
              disabled={isBootstrapping || items.length > 0} 
              onClick={handleBootstrap} 
              className="btn-primary px-8 py-4 text-xs font-black uppercase tracking-widest shadow-xl disabled:opacity-20 rounded-2xl"
            >
               {t('pharmacy_v2.inventory.init_btn')}
            </button>
         </div>
      </header>

      {/* SEARCH & FILTER BAR */}
      <div className="flex-row gap-4 items-center">
        <div className="flex-1 relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">search</span>
          <input 
            type="text"
            placeholder="Search clinical supplies or medication inventory..."
            className="w-full bg-surface-container p-4 pl-12 rounded-2xl border border-outline-variant focus:border-primary outline-none transition-all font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-row gap-2">
           <button className="px-4 py-2 bg-surface-container rounded-xl border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors">
              Filter: All
           </button>
           <button className="px-4 py-2 bg-surface-container rounded-xl border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-high transition-colors">
              Sort: Name
           </button>
        </div>
      </div>

      {/* INVENTORY GRID */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map(item => {
               const status = getStatusInfo(item);
               const progress = Math.min(100, (item.stock_quantity / (item.reorder_level * 3)) * 100);
               
               return (
                  <div key={item.id} className="glass-panel rounded-[2rem] border border-outline-variant p-6 flex-column gap-6 relative group hover:border-primary/40 transition-all hover:shadow-2xl">
                     <div className="flex-row justify-between items-start">
                        <div className="flex-column gap-1">
                           <div className={`px-2 py-0.5 ${status.bg} ${status.color} ${status.border} border text-[8px] font-black rounded-md w-fit uppercase tracking-tighter mb-1`}>
                              {status.label}
                           </div>
                           <h3 className="text-xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors">{item.medication_name}</h3>
                           <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">REF: {item.id.slice(-6)}</p>
                        </div>
                        <div className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                           <span className="material-symbols-outlined text-sm">inventory</span>
                        </div>
                     </div>

                     <div className="flex-column gap-2">
                        <div className="flex-row items-baseline gap-2">
                           <span className={`text-4xl font-black tracking-tighter tabular-nums ${status.color}`}>{item.stock_quantity}</span>
                           <span className="text-xs font-bold opacity-40 uppercase tracking-widest">{item.unit}</span>
                        </div>
                        
                        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden border border-outline-variant/10">
                           <div 
                             className={`h-full ${status.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`} 
                             style={{ width: `${progress}%` }}
                           />
                        </div>
                        <div className="flex-row justify-between items-center text-[10px] font-bold uppercase tracking-tighter opacity-60 mt-1">
                           <span>Safety: {item.reorder_level} {item.unit}</span>
                           <span>{Math.round(progress)}% Health</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button 
                           onClick={() => handleAdjustStock(item.id, item.stock_quantity)}
                           className="py-3 bg-surface-container rounded-xl text-[10px] font-black uppercase tracking-widest border border-outline-variant hover:bg-primary hover:text-white hover:border-primary transition-all"
                        >
                           Adjust
                        </button>
                        <button className="py-3 bg-surface-container rounded-xl text-[10px] font-black uppercase tracking-widest border border-outline-variant hover:bg-surface-container-high transition-all">
                           History
                        </button>
                     </div>
                  </div>
               );
            })}

            {filteredItems.length === 0 && !isLoading && (
              <div className="col-span-full py-40 text-center flex-column items-center gap-6 opacity-20">
                 <span className="material-symbols-outlined text-9xl">search_off</span>
                 <p className="text-xl font-black uppercase tracking-widest">No medications found</p>
                 <p className="text-sm font-medium -mt-4">Try adjusting your search or filters.</p>
              </div>
            )}
         </div>
      </div>

      {/* FOOTER STATUS LEGEND */}
      <footer className="bg-surface-container-low p-5 rounded-[1.5rem] border border-outline-variant flex-row justify-between items-center shadow-inner">
         <div className="flex-row gap-8">
            <div className="flex-row items-center gap-3">
               <div className="w-4 h-4 bg-error rounded-md shadow-sm" />
               <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('pharmacy_v2.inventory.legend.critical')}</span>
            </div>
            <div className="flex-row items-center gap-3">
               <div className="w-4 h-4 bg-warning rounded-md shadow-sm" />
               <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('pharmacy_v2.inventory.legend.low')}</span>
            </div>
            <div className="flex-row items-center gap-3">
               <div className="w-4 h-4 bg-success rounded-md shadow-sm" />
               <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('pharmacy_v2.inventory.legend.stocked')}</span>
            </div>
         </div>
         <div className="flex-row items-center gap-4">
            <div className="h-4 w-[1px] bg-outline-variant" />
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">
               Total Asset Value Secured · {new Date().toLocaleDateString()}
            </p>
         </div>
      </footer>
    </div>
  );
}
