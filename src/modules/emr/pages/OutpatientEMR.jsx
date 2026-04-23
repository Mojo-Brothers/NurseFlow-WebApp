import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { calculateAge } from '../../../utils/clinicalCalculators.js';

export default function OutpatientEMR() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters } = useEncounterStore();
  
  const [activeTab, setActiveTab] = useState('Modul e-MR');

  const tabs = [
    'Modul e-MR', 'List Pemeriksaan', 'Laboratorium', 'Radiologi', 
    'Diagnosa', 'Resep Online', 'Rujukan', 'Histori Pemeriksaan', 
    'Hasil Scan Dokumen', 'Surat Keterangan'
  ];

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientActiveEncounter(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  const activePatient = patients.find(p => p.id === selectedPatientId) || {};
  const activeEncounter = activeEncounters?.find(e => e.id === selectedEncounterId) || {};

  // Mock specific RJ data
  const noReg = activeEncounter?.id ? activeEncounter.id.slice(-8).toUpperCase() : '00030822';
  const noRM = activePatient?.mrn || 'P260416371';
  const dob = activePatient?.demographics?.dob || '1983-01-16';
  const age = activePatient?.id ? calculateAge(dob) : '43 thn 3 bln';
  const religion = 'Islam'; // Mock
  const guarantor = 'Jaminan Asuransi (ASURANSI BRI LIFE)'; // Mock
  const poli = activeEncounter?.department || 'UGD'; // In real life RJ has multiple Poli
  const doctor = activeEncounter?.doctor_email || 'dr. Hanifa Hanum';

  return (
    <div className="p-8 h-full flex-column gap-6" style={{ overflowY: 'auto' }}>
      <div className="flex-row justify-between items-center mb-4">
         <h1 className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Daftar Pemeriksaan Pasien RJ</h1>
         <div className="flex-row gap-3 items-center">
            <select className="form-input" style={{ width: '250px', padding: '8px 12px', fontSize: '12px' }} value={selectedPatientId || ''} onChange={(e) => selectPatient(e.target.value)}>
               <option value="">-- Switch Context --</option>
               {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
            </select>
            <button className="btn-primary" style={{ padding: '8px 24px' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '8px' }}>search</span>Cari Histori
            </button>
            <button className="btn-primary" style={{ padding: '8px 24px' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '8px' }}>refresh</span>Refresh
            </button>
         </div>
      </div>

      <ClinicalCard padding="0" style={{ borderTop: '4px solid var(--primary)', backgroundColor: 'var(--surface)' }}>
        {/* HEADER SECTION - BENTO GRID */}
        <div className="grid-2" style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', gap: '2rem' }}>
           <div className="flex-column gap-4">
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>No.Reg / No.Rek.Med</span>
                 <div className="flex-row gap-6" style={{ flex: 1 }}>
                    <span style={{ fontSize: '14px', fontWeight: 900 }}>{noRM}</span>
                    <span className="text-error" style={{ fontSize: '14px', fontWeight: 900 }}>{noReg}</span>
                 </div>
              </div>
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Tgl Lahir / Usia</span>
                 <div className="flex-row gap-6 items-center" style={{ flex: 1 }}>
                    <span className="text-error" style={{ fontSize: '14px', fontWeight: 900 }}>{dob}</span>
                    <span className="tabular-nums" style={{ fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>{age}</span>
                 </div>
              </div>
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Agama</span>
                 <span style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>{religion}</span>
              </div>
              <div className="flex-row items-baseline justify-between">
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Penjamin</span>
                 <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>{guarantor}</span>
              </div>
           </div>
           
           <div className="flex-column gap-4">
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Nama Pasien</span>
                 <span style={{ flex: 1, fontSize: '14px', fontWeight: 900 }}>{activePatient?.name || 'LINDA HARTINI'}</span>
              </div>
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Jenis Kelamin</span>
                 <span className="text-error" style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>{activePatient?.demographics?.gender === 'M' ? 'Laki-Laki' : 'Perempuan'}</span>
              </div>
              <div className="flex-row items-baseline justify-between" style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Dept / Poli</span>
                 <span style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>{poli}</span>
              </div>
              <div className="flex-row items-baseline justify-between">
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Nama Dokter</span>
                 <span style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>{doctor}</span>
              </div>
           </div>
        </div>

        {/* ALERGI & VAKSIN SECTION */}
        <div className="grid-2" style={{ gap: 0 }}>
           <div className="flex-column gap-4" style={{ padding: '24px', borderRight: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '10px', backgroundColor: 'var(--status-info)' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>add</span> Alergi
              </button>
              <div className="flex-row items-baseline justify-between" style={{ marginTop: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Riwayat Alergi</span>
                 <span style={{ flex: 1, fontSize: '12px', fontWeight: 700 }}>Tidak Ada Alergi</span>
              </div>
           </div>
           <div className="flex-column gap-4" style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '10px', backgroundColor: 'var(--status-info)' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>add</span> Vaksin
              </button>
              <div className="flex-row justify-between" style={{ marginTop: '8px', alignItems: 'flex-start' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Vaksin</span>
                 <div className="flex-column gap-2" style={{ flex: 1 }}>
                    <span className="text-error" style={{ fontSize: '10px', fontWeight: 900 }}>Ada Data (1)</span>
                    <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '12px', border: '1px solid var(--outline-variant)', fontSize: '11px', fontWeight: 700, borderRadius: 'var(--radius-sm)' }}>
                       Vaksin : Belum Vaksin
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* DIAGNOSA & PENANDA SECTION */}
        <div className="grid-2" style={{ gap: 0 }}>
           <div className="flex-column gap-6 justify-center" style={{ padding: '24px', borderRight: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)' }}>
              <div className="flex-row items-center justify-between gap-4">
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Diagnosa Kerja</span>
                 <input type="text" className="form-input" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} />
              </div>
              <div className="flex-row items-center justify-between gap-4">
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Diagnosa Utama (ICD-10)</span>
                 <input type="text" className="form-input" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} />
              </div>
           </div>
           <div className="flex-column gap-4" style={{ padding: '24px', backgroundColor: 'var(--surface-container-lowest)' }}>
              <button className="btn-primary" style={{ alignSelf: 'flex-start', padding: '6px 16px', fontSize: '10px', backgroundColor: 'var(--status-info)' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>add</span> Penanda
              </button>
              <div className="flex-row items-baseline justify-between" style={{ marginTop: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Penanda</span>
                 <span style={{ flex: 1, fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>Tidak ada data</span>
              </div>
              <div className="flex-row items-center justify-between" style={{ marginTop: '8px' }}>
                 <span className="text-on-surface-variant" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', width: '160px' }}>Pasien Kompleks</span>
                 <div className="flex-row items-center gap-6" style={{ flex: 1 }}>
                    <button className="btn-primary" style={{ padding: '4px 12px', fontSize: '9px', backgroundColor: 'var(--status-info)' }}>
                       <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>sync</span>Sync
                    </button>
                    <label className="flex-row items-center gap-2 cursor-pointer" style={{ fontSize: '11px', fontWeight: 900 }}>
                       <input type="radio" name="kompleks" /> Ya
                    </label>
                    <label className="flex-row items-center gap-2 cursor-pointer" style={{ fontSize: '11px', fontWeight: 900 }}>
                       <input type="radio" name="kompleks" defaultChecked /> Tidak
                    </label>
                 </div>
              </div>
           </div>
        </div>
      </ClinicalCard>

      {/* TABS NAVIGATION */}
      <ClinicalCard padding="0" style={{ marginTop: '16px' }}>
         <div className="flex-row" style={{ backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)', overflowX: 'auto' }}>
            {tabs.map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 style={{
                   padding: '16px 20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase',
                   letterSpacing: '0.05em', whiteSpace: 'nowrap', borderRight: '1px solid var(--outline-variant)',
                   transition: 'all 0.2s', backgroundColor: activeTab === tab ? 'var(--primary)' : 'transparent',
                   color: activeTab === tab ? 'white' : 'var(--on-surface-variant)',
                   borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                   cursor: 'pointer'
                 }}
               >
                  {tab}
               </button>
            ))}
         </div>
         <div style={{ padding: '32px', minHeight: '300px', backgroundColor: 'var(--surface-container-lowest)' }}>
            {activeTab === 'Modul e-MR' && (
               <div className="text-on-surface-variant" style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', opacity: 0.6, marginTop: '16px' }}>Tidak Ada Rujukan</div>
            )}
            {activeTab !== 'Modul e-MR' && (
               <div className="text-on-surface-variant" style={{ fontSize: '14px', fontWeight: 900, fontStyle: 'italic', opacity: 0.6, marginTop: '16px' }}>Modul {activeTab} siap untuk digunakan.</div>
            )}
         </div>
      </ClinicalCard>
    </div>
  );
}
