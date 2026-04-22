import React, { useEffect, useState } from 'react';
import { getInventoryStatus, updateStockLevel } from '../services/inventory.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

const SEED_DATA = [
  { medication_name: 'Paracetamol', stock_quantity: 500, unit: 'Tablets', reorder_level: 100 },
  { medication_name: 'Amoxicillin', stock_quantity: 200, unit: 'Capsules', reorder_level: 50 },
  { medication_name: 'Ceftriaxone', stock_quantity: 50, unit: 'Vials', reorder_level: 20 },
  { medication_name: 'Normal Saline', stock_quantity: 100, unit: 'Bags (500ml)', reorder_level: 30 },
  { medication_name: 'Insulin', stock_quantity: 25, unit: 'Pens', reorder_level: 10 },
];

export default function InventoryPage() {
  const [items, setItems] = useState([]);
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
    if (!window.confirm("Initialize inventory with default stock?")) return;
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
       alert("Bootstrap failed: " + err.message);
    } finally {
       setIsBootstrapping(false);
    }
  };

  const handleAdjustStock = async (id, currentQty) => {
    const newQty = window.prompt("Enter new stock quantity:", currentQty);
    if (newQty === null || isNaN(newQty)) return;
    try {
      await updateStockLevel(id, parseInt(newQty));
      fetchInventory();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const getStatusColor = (item) => {
    if (item.stock_quantity <= 0) return 'border-error bg-error/5 text-error';
    if (item.stock_quantity <= item.reorder_level) return 'border-warning bg-warning/5 text-warning';
    return 'border-success bg-success/5 text-success';
  };

  return (
    <div className="p-8 h-full flex-column gap-8 overflow-hidden bg-surface-lowest">
      <header className="flex-row justify-between items-center bg-white p-6 rounded-3xl border border-outline-variant shadow-sm">
         <div className="flex-row items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-2xl">package_2</span>
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tight">Stock Command Center</h1>
               <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Real-Time Clinical Supply Chain</p>
            </div>
         </div>
         <div className="flex-row gap-3">
            <button onClick={fetchInventory} className="btn-ghost px-4 py-2 text-xs font-black uppercase flex-row items-center gap-2">
               <span className={`material-symbols-outlined text-sm ${isLoading ? 'anim-spin' : ''}`}>refresh</span>
               Sync Stock
            </button>
            <button 
              disabled={isBootstrapping || items.length > 0} 
              onClick={handleBootstrap} 
              className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-20"
            >
               Initialize Warehouse
            </button>
         </div>
      </header>

      {/* STOCK GRID */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hidden">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
               <ClinicalCard key={item.id} padding="2rem" className={`border-l-8 ${getStatusColor(item)} relative group`}>
                  <div className="flex-row justify-between items-start mb-6">
                     <div>
                        <h3 className="text-xl font-black leading-tight">{item.medication_name}</h3>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Ref: {item.id.slice(-6)}</p>
                     </div>
                     <span className="material-symbols-outlined opacity-20 text-4xl group-hover:opacity-40 transition-all">inventory_2</span>
                  </div>

                  <div className="flex-row items-baseline gap-2 mb-2">
                     <span className="text-4xl font-black tracking-tighter tabular-nums">{item.stock_quantity}</span>
                     <span className="text-xs font-bold opacity-60 uppercase tracking-tight">{item.unit}</span>
                  </div>

                  <div className="flex-column gap-3 pt-6 border-t border-current/10">
                     <div className="flex-row justify-between text-[10px] font-black uppercase">
                        <span className="opacity-60">Reorder Level</span>
                        <span>{item.reorder_level} {item.unit}</span>
                     </div>
                     <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-current transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (item.stock_quantity / (item.reorder_level * 3)) * 100)}%` }}
                        />
                     </div>
                     
                     <button 
                       onClick={() => handleAdjustStock(item.id, item.stock_quantity)}
                       className="mt-2 w-full py-3 bg-current text-white font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all rounded-xl shadow-lg"
                     >
                        Update Inventory Level
                     </button>
                  </div>
               </ClinicalCard>
            ))}

            {items.length === 0 && !isLoading && (
              <div className="col-span-full py-40 text-center flex-column items-center gap-6 opacity-20">
                 <span className="material-symbols-outlined text-9xl">inventory</span>
                 <p className="text-xl font-black uppercase tracking-widest">Warehouse is Empty</p>
                 <p className="text-sm font-medium -mt-4">Click "Initialize Warehouse" to seed clinical supply data.</p>
              </div>
            )}
         </div>
      </div>

      <footer className="bg-surface-container p-4 rounded-2xl border border-outline-variant flex-row justify-between items-center">
         <div className="flex-row gap-6">
            <div className="flex-row items-center gap-2">
               <div className="w-3 h-3 bg-error rounded-full" />
               <span className="text-[10px] font-black uppercase opacity-60">Critical Stock</span>
            </div>
            <div className="flex-row items-center gap-2">
               <div className="w-3 h-3 bg-warning rounded-full" />
               <span className="text-[10px] font-black uppercase opacity-60">Low Level</span>
            </div>
            <div className="flex-row items-center gap-2">
               <div className="w-3 h-3 bg-success rounded-full" />
               <span className="text-[10px] font-black uppercase opacity-60">Stocked</span>
            </div>
         </div>
         <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">NurseFlow Logistics Engine V1.0 • Verified Cloud Sync</p>
      </footer>
    </div>
  );
}
