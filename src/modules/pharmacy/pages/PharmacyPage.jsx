/**
 * Pharmacy Module — E-Prescription & Dispensing Queue
 * Role: PHARMACIST (dispensing), DOCTOR (prescribe), ADMIN (full)
 */
import React, { useEffect, useState } from 'react';
import { usePharmacyStore } from '../pharmacy.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';

const STATUS_CONFIG = {
  PENDING:      { label: 'Menunggu',    bg: '#fef9c3', text: '#92400e', icon: 'schedule'      },
  DISPENSED:    { label: 'Diberikan',   bg: '#dcfce7', text: '#166534', icon: 'check_circle'  },
  ADMINISTERED: { label: 'Diberikan ke Pasien', bg: '#dbeafe', text: '#1e40af', icon: 'medication' },
  CANCELLED:    { label: 'Dibatalkan',  bg: '#fee2e2', text: '#991b1b', icon: 'cancel'        },
};

const ROUTE_LABELS = {
  PO: 'Oral (PO)', IV: 'Infus (IV)', SC: 'Subkutan', IM: 'Intramuskular', TOP: 'Topikal'
};

export default function PharmacyPage() {
  const { currentUser, isPharmacist, isAdmin } = useAuth();
  const { pendingQueue, isLoading, error, fetchQueue, dispense, cancel } = usePharmacyStore();
  const { patients, fetchPatients } = usePatientStore();
  const [dispensingId, setDispensingId] = useState(null);

  useEffect(() => {
    fetchQueue();
    fetchPatients();
  }, [fetchQueue, fetchPatients]);

  const handleDispense = async (id) => {
    setDispensingId(id);
    try { await dispense(id, currentUser.email); }
    catch (e) { alert('Gagal: ' + e.message); }
    setDispensingId(null);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Batalkan resep ini?')) return;
    try { await cancel(id, currentUser.email); }
    catch (e) { alert('Gagal: ' + e.message); }
  };

  const getPatientName = (pid) => {
    const p = patients.find(p => p.id === pid);
    return p ? `${p.mrn} — ${p.name} (${calculateAge(p.demographics?.dob)} thn)` : pid;
  };

  const formatTime = (ts) => ts?.toDate?.().toLocaleString('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }) ?? '—';

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-start justify-between mb-8">
        <div>
          <p className="subtitle">Modul Farmasi</p>
          <h2 className="title">E-Prescription & Dispensing</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Antrian Resep · {pendingQueue.length} pesanan menunggu verifikasi
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '700',
          backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>medication</span>
          {isPharmacist ? 'APOTEKER' : isAdmin ? 'ADMIN' : 'READ-ONLY'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Antrian Pending', value: pendingQueue.length, color: 'var(--warning, #e65100)', icon: 'schedule'    },
          { label: 'Pasien Terdampak', value: new Set(pendingQueue.map(m => m.patient_id)).size, color: 'var(--primary)', icon: 'person'     },
          { label: 'Urgent (IV/SC)', value: pendingQueue.filter(m => ['IV','SC','IM'].includes(m.route)).length, color: 'var(--error)', icon: 'emergency' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex-row items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ color: s.color, fontSize: '1.1rem' }}>{s.icon}</span>
              <p className="metric-label">{s.label}</p>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: s.color, margin: 0, fontFamily: 'var(--font-headline)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="card mb-4 p-4" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}>⚠️ {error}</div>
      )}

      <div className="card padding-0 overflow-hidden">
        <div className="px-6 py-4 flex-row items-center gap-2"
          style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
          <span className="material-symbols-outlined text-secondary">local_pharmacy</span>
          <h3 className="font-bold text-base">Antrian Dispensing</h3>
          <button onClick={fetchQueue} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span> Refresh
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container)' }}>
              {['Pasien', 'Obat', 'Dosis', 'Frekuensi', 'Rute', 'Dokter', 'Waktu Resep', 'Aksi'].map(h => (
                <th key={h} className="py-3 px-5 font-bold text-xs uppercase text-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="8" className="py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined anim-spin">progress_activity</span>
              </td></tr>
            ) : pendingQueue.length === 0 ? (
              <tr><td colSpan="8" className="py-12 text-center" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', opacity: 0.4 }}>check_circle</span>
                Tidak ada resep pending. Antrian kosong.
              </td></tr>
            ) : pendingQueue.map((med, i) => (
              <tr key={med.id} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)', transition: 'background 0.15s' }}>
                <td className="py-4 px-5 font-bold text-sm" style={{ color: 'var(--primary)' }}>
                  {getPatientName(med.patient_id)}
                </td>
                <td className="py-4 px-5 font-bold text-sm">{med.medication_name}</td>
                <td className="py-4 px-5 text-sm text-on-surface-variant">{med.dosage || '—'}</td>
                <td className="py-4 px-5 text-sm text-on-surface-variant">{med.frequency || '—'}</td>
                <td className="py-4 px-5">
                  <span style={{
                    padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: '700',
                    backgroundColor: ['IV','SC','IM'].includes(med.route) ? '#fee2e2' : '#dbeafe',
                    color: ['IV','SC','IM'].includes(med.route) ? '#991b1b' : '#1e40af',
                  }}>{ROUTE_LABELS[med.route] || med.route || '—'}</span>
                </td>
                <td className="py-4 px-5 text-sm text-on-surface-variant">{med.prescribed_by?.split('@')[0]}</td>
                <td className="py-4 px-5 text-xs text-on-surface-variant">{formatTime(med.prescribed_at)}</td>
                <td className="py-4 px-5">
                  <div className="flex-row gap-2">
                    {(isPharmacist || isAdmin) && (
                      <button
                        disabled={dispensingId === med.id}
                        onClick={() => handleDispense(med.id)}
                        style={{
                          padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-md)', border: 'none',
                          backgroundColor: dispensingId === med.id ? 'var(--surface-container)' : 'var(--secondary)',
                          color: 'white', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer'
                        }}>
                        {dispensingId === med.id ? '...' : '✓ Dispense'}
                      </button>
                    )}
                    <button onClick={() => handleCancel(med.id)} style={{
                      padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--error)', backgroundColor: 'transparent',
                      color: 'var(--error)', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer'
                    }}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
