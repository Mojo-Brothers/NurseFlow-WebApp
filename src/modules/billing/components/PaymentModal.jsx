import React, { useState, useEffect } from 'react';
import { getBillingBreakdown, processSimulatedPayment } from '../services/payment.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';

export default function PaymentModal({ encounterId, onClose, onSettled }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState('E-WALLET');

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getBillingBreakdown(encounterId);
        setData(result);
      } catch (err) {
        alert(err.message);
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [encounterId, onClose]);

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await processSimulatedPayment(data.billingId, method);
      alert("Payment Successful! Account Settle.");
      onSettled();
    } catch (err) {
      alert("Payment Failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-8">
       <ClinicalCard maxWidth="550px" padding="0" className="bg-white shadow-2xl border-t-8 border-primary overflow-hidden animate-scale-in">
          {/* HEADER */}
          <div className="bg-surface-container p-6 border-b border-outline-variant flex-row justify-between items-center">
             <div>
                <h2 className="text-xl font-black tracking-tight">Checkout Station</h2>
                <p className="text-[10px] font-black uppercase opacity-40">Invoice #{data.billingId.slice(-8)}</p>
             </div>
             <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-error transition-all">close</button>
          </div>

          <div className="p-8">
             {/* COST BREAKDOWN */}
             <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Consolidated Charges</p>
                {data.items.map((item, i) => (
                   <div key={i} className="flex-row justify-between text-xs font-bold text-slate-600">
                      <span>{item.name}</span>
                      <span className="tabular-nums">Rp {item.total.toLocaleString()}</span>
                   </div>
                ))}
                <div className="pt-4 mt-4 border-t-2 border-dashed border-outline-variant flex-row justify-between items-baseline">
                   <span className="text-sm font-black uppercase">Grand Total</span>
                   <span className="text-2xl font-black text-primary tracking-tighter">Rp {data.grandTotal.toLocaleString()}</span>
                </div>
             </div>

             {/* PAYMENT METHOD */}
             <div className="mb-8">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                   {['E-WALLET', 'VIRTUAL ACCOUNT', 'CREDIT CARD', 'CASH'].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setMethod(m)}
                        className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                          ${method === m ? 'border-primary bg-primary/5 text-primary shadow-md' : 'border-outline-variant text-slate-400 opacity-60'}`}
                      >
                         {m}
                      </button>
                   ))}
                </div>
             </div>

             {/* ACTION */}
             <div className="flex-column gap-3">
                <button 
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl flex-row items-center justify-center gap-3"
                >
                   {isProcessing ? (
                     <>
                       <span className="material-symbols-outlined text-sm anim-spin">sync</span>
                       Processing Transaction...
                     </>
                   ) : (
                     <>
                       <span className="material-symbols-outlined text-sm">lock_open</span>
                       Authorize Payment
                     </>
                   )}
                </button>
                <p className="text-center text-[9px] font-bold text-slate-400 italic">"Secure 256-bit Encrypted Transaction Module"</p>
             </div>
          </div>
       </ClinicalCard>
    </div>
  );
}
