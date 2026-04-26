import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBillingBreakdown, processSimulatedPayment } from '../services/payment.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { toast } from 'react-hot-toast';

export default function PaymentModal({ encounterId, onClose, onSettled }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [method, setMethod] = useState('E-WALLET');

  const methodMap = {
    'E-WALLET': t('billing.payment_modal.methods.e_wallet'),
    'VIRTUAL ACCOUNT': t('billing.payment_modal.methods.va'),
    'CREDIT CARD': t('billing.payment_modal.methods.cc'),
    'CASH': t('billing.payment_modal.methods.cash')
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await getBillingBreakdown(encounterId);
        setData(result);
      } catch (err) {
        toast.error(err.message);
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
      toast.success(t('billing.payment_modal.success_alert'));
      onSettled();
    } catch (err) {
      toast.error(t('billing.payment_modal.fail_alert') + ': ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-8">
       <ClinicalCard maxWidth="550px" padding="0" className="bg-surface shadow-2xl border-t-8 border-primary overflow-hidden animate-scale-in">
          {/* HEADER */}
          <div className="bg-surface-container p-6 border-b border-outline-variant flex-row justify-between items-center min-w-0">
             <div className="min-w-0">
                <h2 className="text-xl font-black tracking-tight truncate">{t('billing.payment_modal.title')}</h2>
                <p className="text-[10px] font-black uppercase opacity-40 truncate">Invoice #{data?.billingId?.slice(-8) || '---'}</p>
             </div>
             <button onClick={onClose} className="material-symbols-outlined text-slate-400 hover:text-error transition-all shrink-0">close</button>
          </div>

          <div className="p-8">
             {/* COST BREAKDOWN */}
             <div className="space-y-3 mb-8">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">{t('billing.payment_modal.consolidated_charges')}</p>
                {data.items.map((item, i) => (
                   <div key={i} className="flex-row justify-between text-xs font-bold text-slate-600 min-w-0">
                      <span className="truncate mr-2">{item.name}</span>
                      <span className="tabular-nums shrink-0">Rp {item.total.toLocaleString()}</span>
                   </div>
                ))}
                <div className="pt-4 mt-4 border-t-2 border-dashed border-outline-variant flex-row justify-between items-baseline min-w-0">
                   <span className="text-sm font-black uppercase shrink-0">{t('billing.payment_modal.grand_total')}</span>
                   <span className="text-2xl font-black text-primary tracking-tighter truncate">Rp {data.grandTotal.toLocaleString()}</span>
                </div>
             </div>

             {/* PAYMENT METHOD */}
             <div className="mb-8">
                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mb-4">{t('billing.payment_modal.select_method')}</p>
                <div className="grid grid-cols-2 gap-3">
                   {Object.keys(methodMap).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setMethod(m)}
                        className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                          ${method === m ? 'border-primary bg-primary/5 text-primary shadow-md' : 'border-outline-variant text-slate-400 opacity-60'}`}
                      >
                         {methodMap[m]}
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
                        {t('billing.payment_modal.processing')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        {t('billing.payment_modal.authorize')}
                      </>
                    )}
                 </button>
                 <p className="text-center text-[9px] font-bold text-slate-400 italic">{t('billing.payment_modal.secure_note')}</p>
             </div>
          </div>
       </ClinicalCard>
    </div>
  );
}
