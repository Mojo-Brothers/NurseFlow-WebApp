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
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
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

  const handleFinalize = async () => {
    // In a real app, we would use a proper Modal for confirmation
    if (!window.confirm(t('billing.confirm_finalize'))) return;
    try {
      await finalizeBill(selectedBill.id, currentUser.email);
      await loadData();
      setSelectedBill(null);
      toast.success(t('billing.success.finalized'));
    } catch (e) { 
      toast.error(e.message); 
    }
  };


  const getPatientName = (pid) => {
    const p = patients.find(p => p.id === pid);
    return p ? `${p.mrn} — ${p.name} (${calculateAge(p.demographics?.dob)} ${t('common.years')})` : pid;
  };

  return (
    <div className="p-8 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="min-w-0">
          <p className="subtitle uppercase tracking-[0.2em] opacity-60">{t('billing.subtitle')}</p>
          <h2 className="title text-3xl font-black tracking-tight leading-none mt-1">{t('billing.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-2 font-bold opacity-80 truncate">
            {t('billing.summary', { 
              draft: bills.filter(b => b.status === 'DRAFT').length, 
              finalized: bills.filter(b => b.status === 'FINALIZED').length 
            })}
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${selectedBill ? 'lg:grid-cols-12' : ''} gap-6`}>
        <div className={selectedBill ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <ClinicalCard className="padding-0 overflow-hidden" style={{ height: 'fit-content' }}>
          <div className="px-5 py-4 flex-row items-center gap-2"
            style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <h3 className="font-bold text-base">{t('billing.list_title')}</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><span className="material-symbols-outlined anim-spin text-primary">progress_activity</span></div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">{t('billing.no_active_bills')}</div>
          ) : bills.map((bill) => {
            const badge = STATUS_BADGE[bill.status] || STATUS_BADGE.DRAFT;
            return (
              <div key={bill.id}
                onClick={() => bill.status === 'DRAFT' ? openBill(bill) : null}
                style={{
                  padding: '1rem 1.25rem', borderBottom: '1px solid var(--outline-variant)',
                  cursor: bill.status === 'DRAFT' ? 'pointer' : 'default',
                  backgroundColor: selectedBill?.id === bill.id ? 'var(--primary-container)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                <div className="flex-row items-center justify-between mb-1 gap-4 min-w-0">
                  <p className="truncate min-w-0" style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--primary)', margin: 0 }}>{getPatientName(bill.patient_id)}</p>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: '800', backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                </div>
                <p className="tabular-nums" style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--on-surface)', fontFamily: 'var(--font-headline)' }}>{fmt(bill.total || 0)}</p>
                <div className="flex-row items-center justify-between mt-2">
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                    {t('billing.item_count', { count: bill.line_items?.length || 0 })}
                  </p>
                  {bill.status === 'FINALIZED' && (isAdmin || isDoctor) && (
                    <button onClick={(e) => { e.stopPropagation(); setActivePaymentEncounter(bill.encounter_id); }}
                      style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                      {t('billing.authorize_btn')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </ClinicalCard>
        </div>

        {selectedBill && (
          <div className="lg:col-span-7">
            <ClinicalCard className="p-8">
              <div className="flex-row items-center justify-between mb-5 gap-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate" style={{ margin: 0 }}>{getPatientName(selectedBill.patient_id)}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{t('billing.edit_title')}</p>
                </div>
              <button onClick={() => setSelectedBill(null)} className="btn-ghost" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-row gap-2 mb-4">
              <select className="form-input flex-1" value={addServiceIdx} onChange={e => setAddServiceIdx(e.target.value)}>
                <option value="">{t('billing.select_service')}</option>
                {catalog.map((s, i) => <option key={i} value={i}>{s.description} — {fmt(s.unit_price)}</option>)}
              </select>
              <button onClick={addLineItem} className="btn-primary" style={{ flexShrink: 0 }}>{t('billing.btn_add')}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-container)' }}>
                    <th className="py-2 px-3 text-left text-xs font-bold uppercase text-on-surface-variant">{t('billing.table.item')}</th>
                    <th className="py-2 px-3 text-center text-xs font-bold uppercase text-on-surface-variant">{t('billing.table.qty')}</th>
                    <th className="py-2 px-3 text-right text-xs font-bold uppercase text-on-surface-variant">{t('billing.table.price')}</th>
                    <th className="py-2 px-3 text-right text-xs font-bold uppercase text-on-surface-variant">{t('billing.table.total')}</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length === 0 ? (
                    <tr><td colSpan="5" className="py-4 text-center text-on-surface-variant text-sm">{t('billing.no_items')}</td></tr>
                  ) : lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td className="py-3 px-3">{item.description}</td>
                      <td className="py-3 px-3 text-center">
                        <input type="number" min="1" value={item.qty}
                          onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                          style={{ width: '60px', textAlign: 'center', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontSize: '0.875rem' }} />
                      </td>
                      <td className="py-3 px-3 text-right text-on-surface-variant tabular-nums">{fmt(item.unit_price)}</td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums">{fmt(item.total)}</td>
                      <td className="py-3 px-3 text-right">
                        <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ClinicalCard style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--primary)', 
              color: 'var(--on-primary)', 
              marginBottom: '1.5rem',
              border: 'none',
              boxShadow: 'var(--shadow-presentation)'
            }}>
              <div className="flex-row items-center justify-between">
                <p style={{ margin: 0, fontWeight: '800', fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.9 }}>{t('billing.total_label')}</p>
                <p className="tabular-nums" style={{ margin: 0, fontFamily: 'var(--font-headline)', fontWeight: '950', fontSize: '2.5rem', letterSpacing: '-0.04em' }}>{fmt(subtotal)}</p>
              </div>
            </ClinicalCard>

            <div className="flex-row gap-3 justify-end">
              <button onClick={handleSave} disabled={isSaving} className="btn-ghost">
                {isSaving ? t('billing.saving') : t('billing.save_draft')}
              </button>
              {(isAdmin || isDoctor) && (
                <button onClick={handleFinalize} className="btn-primary"
                  style={{ backgroundColor: 'var(--secondary)' }}>
                  {t('billing.finalize_btn')}
                </button>
              )}
            </div>
            </ClinicalCard>
          </div>
        )}
      </div>

      {activePaymentEncounter && (
        <PaymentModal 
          encounterId={activePaymentEncounter} 
          onClose={() => setActivePaymentEncounter(null)} 
          onSettled={() => {
            setActivePaymentEncounter(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
