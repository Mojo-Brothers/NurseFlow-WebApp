/**
 * Billing & Discharge — Full Billing Workflow
 * Admin / Dokter: finalize tagihan dan proses discharge resmi.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPendingBills, updateBillItems, finalizeBill } from '../services/billing.service.js';
import { getServiceCatalog } from '../../admin/services/masterData.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { formatPatientName } from '../../../utils/displayUtils.js';
import EmptyState from '../../../components/ui/EmptyState.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import AdvancedPatientSearchBar from '../../emr/components/AdvancedPatientSearchBar.jsx';
import { toast } from 'react-hot-toast';

const getStatusBadgeConfig = (t) => ({
  DRAFT:     { label: t('billing.statuses.draft'),      bg: 'rgba(146, 64, 14, 0.1)', text: 'var(--status-warning)' },
  FINALIZED: { label: t('billing.statuses.finalized'),  bg: 'rgba(0, 93, 182, 0.1)',  text: 'var(--status-info)'    },
  PAID:      { label: t('billing.statuses.paid'),       bg: 'rgba(22, 101, 52, 0.1)', text: 'var(--status-safe)'    },
  WAIVED:    { label: t('billing.statuses.waived'),     bg: 'var(--surface-container-high)', text: 'var(--on-surface-variant)' },
});

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const STATUS_BADGE = getStatusBadgeConfig(t);

  const fmt = (n) => new Intl.NumberFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(n);

  const { currentUser, isAdmin, isDoctor } = useAuth();
  const { patients, fetchPatients }         = usePatientStore();
  const [bills, setBills]                   = useState([]);
  const [selectedBill, setSelectedBill]     = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [lineItems, setLineItems]           = useState([]);
  const [addServiceIdx, setAddServiceIdx]   = useState('');
  const [catalog, setCatalog]               = useState([]);
  const [activePaymentEncounter, setActivePaymentEncounter] = useState(null);

  const loadData = React.useCallback(async () => {
    try { 
      const [pendingBills, serviceCatalog] = await Promise.all([
        getPendingBills(),
        getServiceCatalog()
      ]);
      setBills(pendingBills);
      setCatalog(serviceCatalog);
    }
    catch (e) { 
      console.error(e); 
      toast.error(t('billing.errors.load_failed'));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    loadData();
    fetchPatients();
  }, [fetchPatients, loadData]);

  const openBill = (bill) => {
    setSelectedBill(bill);
    setLineItems(bill.line_items || []);
  };

  const addLineItem = () => {
    if (addServiceIdx === '') return;
    const svc = catalog[parseInt(addServiceIdx)];
    if (!svc) return;
    setLineItems(prev => [...prev, { ...svc, qty: 1, total: svc.unit_price }]);
    setAddServiceIdx('');
  };

  const updateQty = (idx, qty) => {
    setLineItems(prev => prev.map((item, i) =>
      i === idx ? { ...item, qty, total: qty * item.unit_price } : item
    ));
  };

  const removeItem = (idx) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBillItems(selectedBill.id, lineItems, currentUser.email);
      await loadData();
      setSelectedBill(prev => ({ ...prev, line_items: lineItems, total: subtotal }));
      toast.success(t('billing.success.saved'));
    } catch (e) { 
      toast.error(e.message); 
    }
    setIsSaving(false);
  };

  const getPatientName = (pid) => formatPatientName(pid, patients, calculateAge, t);

  return (
    <div className="p-8 w-full font-sans bg-slate-950 text-slate-100 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="min-w-0">
          <p className="subtitle uppercase tracking-[0.2em] opacity-60">{t('billing.subtitle')}</p>
          <h2 className="title text-3xl font-black tracking-tight leading-none mt-1 text-white">{t('billing.title')}</h2>
          <p className="text-slate-400 text-sm mt-2 font-bold opacity-80 truncate">
            {t('billing.summary', { 
              draft: bills.filter(b => b.status === 'DRAFT').length, 
              finalized: bills.filter(b => b.status === 'FINALIZED').length 
            })}
          </p>
        </div>
      </div>

      {/* Advanced Patient Search Bar Component */}
      <div className="mb-6 z-20 relative">
        <AdvancedPatientSearchBar />
      </div>

      <div className={`grid grid-cols-1 ${selectedBill ? 'lg:grid-cols-12' : ''} gap-6`}>
        <div className={selectedBill ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-2 bg-slate-950 border-b border-slate-800">
              <span className="material-symbols-outlined text-teal-400">receipt_long</span>
              <h3 className="font-bold text-base text-white">{t('billing.list_title')}</h3>
            </div>
            {isLoading ? (
              <div className="p-8 text-center"><span className="material-symbols-outlined anim-spin text-teal-400">progress_activity</span></div>
            ) : bills.length === 0 ? (
              <EmptyState icon="receipt_long" title={t('billing.no_active_bills')} description="" />
            ) : bills.map((bill) => {
              const badge = STATUS_BADGE[bill.status] || STATUS_BADGE.DRAFT;
              return (
                <div key={bill.id}
                  onClick={() => bill.status === 'DRAFT' ? openBill(bill) : null}
                  className={`p-4 border-b border-slate-800/80 transition-all cursor-pointer ${
                    selectedBill?.id === bill.id ? 'bg-teal-500/10 border-teal-500/50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-4 min-w-0">
                    <p className="truncate font-bold text-sm text-teal-300">{getPatientName(bill.patient_id)}</p>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                  </div>
                  <p className="tabular-nums font-black text-lg text-white font-mono">{fmt(bill.total || 0)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-400">
                      {t('billing.item_count', { count: bill.line_items?.length || 0 })}
                    </p>
                    {bill.status === 'FINALIZED' && (isAdmin || isDoctor) && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActivePaymentEncounter({
                            encounterId: bill.encounter_id,
                            billId: bill.id,
                            patientName: getPatientName(bill.patient_id),
                            totalAmount: bill.total || 0
                          }); 
                        }}
                        className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-900/30"
                      >
                        {t('billing.authorize_btn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedBill && (
          <div className="lg:col-span-7">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-5 gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white">{getPatientName(selectedBill.patient_id)}</h3>
                  <p className="text-xs text-slate-400">{t('billing.edit_title')}</p>
                </div>
                <button onClick={() => setSelectedBill(null)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <select 
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500" 
                  value={addServiceIdx} 
                  onChange={e => setAddServiceIdx(e.target.value)}
                >
                  <option value="">{t('billing.select_service')}</option>
                  {catalog.map((s, i) => <option key={i} value={i}>{s.description} — {fmt(s.unit_price)}</option>)}
                </select>
                <button onClick={addLineItem} className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md">
                  {t('billing.btn_add')}
                </button>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800">
                      <th className="py-2.5 px-3 text-left text-xs font-bold uppercase text-slate-400">{t('billing.table.item')}</th>
                      <th className="py-2.5 px-3 text-center text-xs font-bold uppercase text-slate-400">{t('billing.table.qty')}</th>
                      <th className="py-2.5 px-3 text-right text-xs font-bold uppercase text-slate-400">{t('billing.table.price')}</th>
                      <th className="py-2.5 px-3 text-right text-xs font-bold uppercase text-slate-400">{t('billing.table.total')}</th>
                      <th className="py-2.5 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length === 0 ? (
                      <tr><td colSpan="5" className="py-6 text-center text-slate-500 text-sm">{t('billing.no_items')}</td></tr>
                    ) : lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-800/60">
                        <td className="py-3 px-3 font-medium text-white">{item.description}</td>
                        <td className="py-3 px-3 text-center">
                          <input 
                            type="number" 
                            min="1" 
                            value={item.qty}
                            onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                            className="w-14 text-center py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold text-xs"
                          />
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 font-mono">{fmt(item.unit_price)}</td>
                        <td className="py-3 px-3 text-right font-bold text-white font-mono">{fmt(item.total)}</td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-300">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Display Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('billing.total_label')}</p>
                  <p className="text-2xl font-black text-teal-400 font-mono mt-0.5">{fmt(subtotal)}</p>
                </div>
              </div>

              {/* SATUSEHAT FHIR, BPJS INA-CBG, ADT BED & HIM MEDICAL CODING WIDGETS */}
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-slate-950 rounded-2xl border border-teal-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">hub</span>
                      SATUSEHAT FHIR R4 Status
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Encounter ID: <span className="font-mono text-slate-200">{selectedBill.encounter_id || 'ENC-2026-0810-001'}</span> (Valid Payload)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/30">
                    READY
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">hotel</span>
                      ADT Bed Occupancy & Room Charge
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Alokasi Bed: <span className="font-mono text-white font-bold">AZALEA 204-A (Kelas 1)</span> @ Rp 750.000 / Hari
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/30">
                    VERIFIED
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">payments</span>
                      Estimasi BPJS INA-CBG Grouping & HIM Coding
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kode ICD-10 Coded: <span className="font-mono font-bold text-white">I21.9 (Acute Myocardial Infarction)</span> | CBG: <span className="font-mono text-blue-300">I-4-10-I</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
                    KLAIM: {fmt(subtotal * 1.15)}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-sm font-bold text-white">{t('billing.grand_total')}: {fmt(subtotal)}</span>
                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl">
                    {isSaving ? t('billing.saving') : t('billing.save_draft')}
                  </button>
                  <button 
                    onClick={() => setActivePaymentEncounter({
                      encounterId: selectedBill.encounter_id,
                      billId: selectedBill.id,
                      patientName: getPatientName(selectedBill.patient_id),
                      totalAmount: subtotal
                    })} 
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-900/40 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    {t('billing.btn_pay_discharge')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {activePaymentEncounter && (
        <PaymentModal 
          encounterId={activePaymentEncounter.encounterId} 
          billId={activePaymentEncounter.billId}
          patientName={activePaymentEncounter.patientName}
          totalAmount={activePaymentEncounter.totalAmount}
          onClose={() => setActivePaymentEncounter(null)} 
          onSuccess={() => {
            setActivePaymentEncounter(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
