import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';

export default function StockAdjustmentModal({ item, onClose, onSubmit }) {
  const { t } = useTranslation();
  
  // Clone existing batches to edit
  const [batches, setBatches] = useState(item.batches ? [...item.batches] : []);
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');

  const REASONS = [
    { code: 'RESTOCK', label: 'New Stock Received (Restock)' },
    { code: 'CORRECTION', label: 'Cycle Count Correction' },
    { code: 'EXPIRED', label: 'Removed due to Expiry' },
    { code: 'DAMAGED', label: 'Removed due to Damage' },
  ];

  const handleBatchChange = (index, field, value) => {
    const newBatches = [...batches];
    newBatches[index][field] = field === 'quantity' ? parseInt(value) || 0 : value;
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches([...batches, { batch_number: `B-${Math.floor(Math.random()*10000)}`, expiry_date: new Date().toISOString().split('T')[0], quantity: 0 }]);
  };

  const removeBatch = (index) => {
    setBatches(batches.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reasonCode) return alert('Reason code is required for auditing.');
    onSubmit(reasonCode, batches, notes);
  };

  const totalNewStock = batches.reduce((sum, b) => sum + parseInt(b.quantity || 0), 0);

  return (
    <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-50 flex flex-row items-center justify-center p-4 lg:p-8">
      <ClinicalCard maxWidth="800px" padding="0" className="shadow-2xl border-t-8 border-primary animate-scale-in flex flex-col h-full max-h-full">
         <header className="p-6 border-b border-outline-variant flex flex-row justify-between items-start bg-surface-container shrink-0">
            <div className="flex flex-row gap-4 items-center min-w-0">
               <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-primary text-2xl">edit_document</span>
               </div>
               <div className="min-w-0">
                  <h2 className="text-xl font-black text-on-surface truncate">{item.medication_name}</h2>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{t('pharmacy_v2.inventory.adj_title', { defaultValue: 'Stock Adjustment & FEFO' })}</p>
               </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-outline-variant/30 text-on-surface-variant transition-colors shrink-0">
               <span className="material-symbols-outlined text-sm">close</span>
            </button>
         </header>

         <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8 bg-surface-lowest">
            {/* AUDIT META */}
            <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">{t('pharmacy_v2.inventory.adj_reason', { defaultValue: 'Reason for Adjustment (Audit Log)' })} <span className="text-error">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {REASONS.map(r => (
                        <button
                          key={r.code}
                          onClick={() => setReasonCode(r.code)}
                          className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest text-left transition-all flex flex-row items-center justify-between
                            ${reasonCode === r.code ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary/50'}`}
                        >
                           {r.label}
                           {reasonCode === r.code && <span className="material-symbols-outlined text-sm">verified</span>}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Notes</label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-surface-container p-3 rounded-xl border border-outline-variant focus:border-primary outline-none font-medium text-sm text-on-surface" placeholder="E.g., PO #12345 or Broken during transit" />
               </div>
            </div>

            {/* BATCHES */}
            <div className="flex flex-col gap-4">
               <div className="flex flex-row justify-between items-end border-b border-outline-variant pb-2">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest">Batch Tracking (FEFO)</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase mt-1">Manage physical lots & expiry dates</p>
                  </div>
                  <button onClick={addBatch} className="text-[10px] font-black uppercase tracking-widest text-primary flex flex-row items-center gap-1 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">
                     <span className="material-symbols-outlined text-[10px]">add</span> Add Batch
                  </button>
               </div>

               <div className="flex flex-col gap-3">
                  {batches.map((b, i) => (
                     <div key={i} className="flex flex-row flex-wrap sm:flex-nowrap gap-3 items-end bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                        <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                           <label className="text-[9px] font-black uppercase opacity-60">Batch Number</label>
                           <input type="text" value={b.batch_number} onChange={e => handleBatchChange(i, 'batch_number', e.target.value)} className="bg-surface p-2 rounded-md border border-outline text-xs font-bold w-full" />
                        </div>
                        <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
                           <label className="text-[9px] font-black uppercase opacity-60 text-error">Expiry Date</label>
                           <input type="date" value={b.expiry_date} onChange={e => handleBatchChange(i, 'expiry_date', e.target.value)} className="bg-surface p-2 rounded-md border border-outline text-xs font-bold w-full text-error" />
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:w-[120px]">
                           <label className="text-[9px] font-black uppercase opacity-60">Quantity</label>
                           <input type="number" min="0" value={b.quantity} onChange={e => handleBatchChange(i, 'quantity', e.target.value)} className="bg-surface p-2 rounded-md border border-outline text-xs font-black tabular-nums text-primary w-full" />
                        </div>
                        <button onClick={() => removeBatch(i)} className="w-9 h-9 bg-error-container text-on-error-container rounded-md flex items-center justify-center shrink-0 hover:bg-error hover:text-white transition-colors">
                           <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                     </div>
                  ))}
                  {batches.length === 0 && (
                     <div className="p-8 text-center border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant">
                        <p className="text-xs font-black uppercase opacity-40">No batches recorded</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <footer className="p-6 border-t border-outline-variant bg-surface-container shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col min-w-0 text-center sm:text-left">
               <span className="text-[10px] font-black uppercase opacity-50 tracking-widest">Calculated Total Stock</span>
               <div className="flex flex-row items-center justify-center sm:justify-start gap-3 mt-1">
                  <span className={`text-2xl font-black tabular-nums ${totalNewStock !== item.stock_quantity ? 'text-warning animate-pulse' : 'text-success'}`}>{totalNewStock}</span>
                  {totalNewStock !== item.stock_quantity && (
                     <span className="text-[10px] font-black bg-warning/20 text-warning px-2 py-1 rounded uppercase">Delta: {totalNewStock - item.stock_quantity}</span>
                  )}
               </div>
            </div>
            <div className="flex flex-row gap-3 w-full sm:w-auto">
               <button onClick={onClose} className="flex-1 sm:flex-none px-6 py-3 border border-outline-variant rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all text-on-surface">Cancel</button>
               <button onClick={handleSubmit} disabled={!reasonCode} className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 hover:bg-primary-container transition-all">
                  Commit Audit
               </button>
            </div>
         </footer>
      </ClinicalCard>
    </div>
  );
}
