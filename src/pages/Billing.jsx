/**
 * Billing & Discharge — Full Billing Workflow
 * Admin / Dokter: finalize tagihan dan proses discharge resmi.
 */
import React, { useEffect, useState } from 'react';
import { getPendingBills, updateBillItems, finalizeBill, markAsPaid } from '../modules/billing/billing.service.js';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const SERVICE_CATALOG = [
  { description: 'Konsultasi Dokter Umum',  unit_price: 150000 },
  { description: 'Konsultasi Dokter Spesialis', unit_price: 350000 },
  { description: 'Asesmen Triage IGD',       unit_price: 75000  },
  { description: 'Tindakan Infus (per hari)', unit_price: 200000 },
  { description: 'Rawat Inap (per hari)',     unit_price: 500000 },
  { description: 'Pemeriksaan Lab Darah',     unit_price: 120000 },
  { description: 'Pemeriksaan Rontgen',       unit_price: 250000 },
  { description: 'ECG',                       unit_price: 150000 },
  { description: 'Obat-obatan (resep)',        unit_price: 0      }, // Custom price
];

const STATUS_BADGE = {
  DRAFT:     { label: 'Draft',      bg: '#fef9c3', text: '#92400e' },
  FINALIZED: { label: 'Finalized',  bg: '#dbeafe', text: '#1e40af' },
  PAID:      { label: 'Lunas ✓',    bg: '#dcfce7', text: '#166534' },
  WAIVED:    { label: 'Diwaiver',   bg: '#f3f4f6', text: '#6b7280' },
};

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function Billing() {
  const { currentUser, isAdmin, isDoctor } = useAuth();
  const { patients, fetchPatients }         = usePatientStore();
  const [bills, setBills]                   = useState([]);
  const [selectedBill, setSelectedBill]     = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [lineItems, setLineItems]           = useState([]);
  const [addServiceIdx, setAddServiceIdx]   = useState('');

  useEffect(() => {
    loadBills();
    fetchPatients();
  }, [fetchPatients]);

  const loadBills = async () => {
    setIsLoading(true);
    try { setBills(await getPendingBills()); }
    catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const openBill = (bill) => {
    setSelectedBill(bill);
    setLineItems(bill.line_items || []);
  };

  const addLineItem = () => {
    if (addServiceIdx === '') return;
    const svc = SERVICE_CATALOG[parseInt(addServiceIdx)];
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
      await loadBills();
      setSelectedBill(prev => ({ ...prev, line_items: lineItems, total: subtotal }));
    } catch (e) { alert(e.message); }
    setIsSaving(false);
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize tagihan? Tidak bisa diedit setelah ini.')) return;
    try {
      await finalizeBill(selectedBill.id, currentUser.email);
      await loadBills();
      setSelectedBill(null);
    } catch (e) { alert(e.message); }
  };

  const handlePaid = async (billId) => {
    if (!window.confirm('Tandai tagihan sebagai LUNAS?')) return;
    try {
      await markAsPaid(billId, currentUser.email);
      await loadBills();
    } catch (e) { alert(e.message); }
  };

  const getPatientName = (pid) => {
    const p = patients.find(p => p.id === pid);
    return p ? `${p.mrn} — ${p.name}` : pid;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex-row items-start justify-between mb-8">
        <div>
          <p className="subtitle">Keuangan</p>
          <h2 className="title">Billing & Discharge</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Tagihan pasien · {bills.filter(b => b.status === 'DRAFT').length} draft · {bills.filter(b => b.status === 'FINALIZED').length} menunggu pembayaran
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedBill ? '1fr 1.5fr' : '1fr', gap: '1.5rem' }}>
        {/* Bill List */}
        <div className="card padding-0 overflow-hidden" style={{ height: 'fit-content' }}>
          <div className="px-5 py-4 flex-row items-center gap-2"
            style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <h3 className="font-bold text-base">Daftar Tagihan</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><span className="material-symbols-outlined anim-spin text-primary">progress_activity</span></div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Tidak ada tagihan aktif.</div>
          ) : bills.map((bill, i) => {
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
                <div className="flex-row items-center justify-between mb-1">
                  <p style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--primary)', margin: 0 }}>{getPatientName(bill.patient_id)}</p>
                  <span style={{ padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: '800', backgroundColor: badge.bg, color: badge.text }}>{badge.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--on-surface)', fontFamily: 'var(--font-headline)' }}>{fmt(bill.total || 0)}</p>
                <div className="flex-row items-center justify-between mt-2">
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{bill.line_items?.length || 0} item</p>
                  {bill.status === 'FINALIZED' && (isAdmin || isDoctor) && (
                    <button onClick={(e) => { e.stopPropagation(); handlePaid(bill.id); }}
                      style={{ padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: 'var(--secondary)', color: 'white', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bill Editor */}
        {selectedBill && (
          <div className="card">
            <div className="flex-row items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg" style={{ margin: 0 }}>{getPatientName(selectedBill.patient_id)}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Edit Tagihan</p>
              </div>
              <button onClick={() => setSelectedBill(null)} className="btn-ghost" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Add Service */}
            <div className="flex-row gap-2 mb-4">
              <select className="form-input flex-1" value={addServiceIdx} onChange={e => setAddServiceIdx(e.target.value)}>
                <option value="">-- Tambah Layanan --</option>
                {SERVICE_CATALOG.map((s, i) => <option key={i} value={i}>{s.description} — {fmt(s.unit_price)}</option>)}
              </select>
              <button onClick={addLineItem} className="btn-primary" style={{ flexShrink: 0 }}>+ Tambah</button>
            </div>

            {/* Line Items */}
            <table className="w-full text-sm" style={{ marginBottom: '1rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-container)' }}>
                  <th className="py-2 px-3 text-left text-xs font-bold uppercase text-on-surface-variant">Layanan</th>
                  <th className="py-2 px-3 text-center text-xs font-bold uppercase text-on-surface-variant">Qty</th>
                  <th className="py-2 px-3 text-right text-xs font-bold uppercase text-on-surface-variant">Harga</th>
                  <th className="py-2 px-3 text-right text-xs font-bold uppercase text-on-surface-variant">Total</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr><td colSpan="5" className="py-4 text-center text-on-surface-variant text-sm">Belum ada item. Tambah layanan di atas.</td></tr>
                ) : lineItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <td className="py-3 px-3">{item.description}</td>
                    <td className="py-3 px-3 text-center">
                      <input type="number" min="1" value={item.qty}
                        onChange={e => updateQty(idx, parseInt(e.target.value) || 1)}
                        style={{ width: '60px', textAlign: 'center', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline-variant)', fontSize: '0.875rem' }} />
                    </td>
                    <td className="py-3 px-3 text-right text-on-surface-variant">{fmt(item.unit_price)}</td>
                    <td className="py-3 px-3 text-right font-bold">{fmt(item.total)}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-container)', marginBottom: '1.5rem' }}>
              <div className="flex-row items-center justify-between">
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--on-primary-container)' }}>TOTAL TAGIHAN</p>
                <p style={{ margin: 0, fontFamily: 'var(--font-headline)', fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary)' }}>{fmt(subtotal)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-row gap-3 justify-end">
              <button onClick={handleSave} disabled={isSaving} className="btn-ghost">
                {isSaving ? 'Menyimpan...' : '💾 Simpan Draft'}
              </button>
              {(isAdmin || isDoctor) && (
                <button onClick={handleFinalize} className="btn-primary"
                  style={{ backgroundColor: 'var(--secondary)' }}>
                  ✓ Finalize & Discharge
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
