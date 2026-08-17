import React, { useState } from 'react';
import { useOrdersStore } from '../store/orders.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { PHARMACY_CATALOG, LABORATORY_CATALOG, RADIOLOGY_CATALOG } from '../services/orderCatalogEngine.service.js';

export default function OrderEntryWorkspace({ onOrderCreated }) {
  const { createPrescription, createLabOrder, createRadiologyOrder } = useOrdersStore();
  const { selectedPatient, patients } = usePatientStore();

  const activePatient = selectedPatient || patients[0] || null;

  const [orderCategory, setOrderCategory] = useState('PHARMACY'); // 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY'
  const [priority, setPriority] = useState('ROUTINE');
  const [indication, setIndication] = useState('');
  const [patientName, setPatientName] = useState(activePatient?.name || '');
  const [mrn, setMrn] = useState(activePatient?.mrn || '');

  // Selection
  const [selectedMed, setSelectedMed] = useState(PHARMACY_CATALOG[0]);
  const [dosage, setDosage] = useState('500 mg');
  const [frequency, setFrequency] = useState('3 x 1 tablet');
  const [quantity, setQuantity] = useState(10);

  const [selectedLab, setSelectedLab] = useState(LABORATORY_CATALOG[0]);
  const [selectedRad, setSelectedRad] = useState(RADIOLOGY_CATALOG[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const activePatientId = activePatient?.id || `P-${Date.now()}`;
      const activeEpisodeId = activePatient?.episodeId || null;
      const activeEncounterId = activePatient?.encounterId || null;

      if (orderCategory === 'PHARMACY') {
        await createPrescription({
          patientId: activePatientId,
          patientName,
          mrn,
          episodeId: activeEpisodeId,
          encounterId: activeEncounterId,
          priority,
          clinicalIndication: indication,
          items: [{
            code: selectedMed.code,
            name: selectedMed.name,
            dosage,
            frequency,
            quantity: Number(quantity),
            unitPrice: selectedMed.unitPrice,
            route: selectedMed.route
          }]
        });
        alert('E-Resep Farmasi berhasil dibuat & dikirim ke instalasi farmasi untuk telaah klinis!');
      } else if (orderCategory === 'LABORATORY') {
        await createLabOrder({
          patientId: activePatientId,
          patientName,
          mrn,
          episodeId: activeEpisodeId,
          encounterId: activeEncounterId,
          priority,
          clinicalIndication: indication,
          items: [{
            loinc: selectedLab.loinc,
            name: selectedLab.name,
            specimen: selectedLab.specimen,
            unitPrice: selectedLab.unitPrice,
            refRange: selectedLab.refRange
          }]
        });
        alert('Order Laboratorium berhasil dibuat & dikirim ke LIS untuk pengambilan spesimen!');
      } else if (orderCategory === 'RADIOLOGY') {
        await createRadiologyOrder({
          patientId: activePatientId,
          patientName,
          mrn,
          episodeId: activeEpisodeId,
          encounterId: activeEncounterId,
          priority,
          clinicalIndication: indication,
          items: [{
            modality: selectedRad.modality,
            name: selectedRad.name,
            unitPrice: selectedRad.unitPrice
          }]
        });
        alert('Order Radiologi & DICOM Study UID berhasil dibuat dan dikirim ke PACS!');
      }

      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      alert(`Gagal Membuat Order: ${err.message}`);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
        <div>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Computerized Physician Order Entry (CPOE / Universal Order Entry)
          </h3>
          <p className="text-xs text-on-surface-variant">Dokter menerbitkan order Farmasi, Laboratorium, dan Radiologi secara terpadu.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Category Selector */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setOrderCategory('PHARMACY')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              orderCategory === 'PHARMACY' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">prescriptions</span>
            <span>E-Resep Farmasi</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderCategory('LABORATORY')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              orderCategory === 'LABORATORY' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">science</span>
            <span>Laboratorium (LIS)</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderCategory('RADIOLOGY')}
            className={`p-3 rounded-2xl text-center border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              orderCategory === 'RADIOLOGY' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">radiology</span>
            <span>Radiologi (PACS)</span>
          </button>
        </div>

        {/* Priority & Indication */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Prioritas Pelayanan</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
            >
              <option value="ROUTINE">Rutin (Pelayanan Standar)</option>
              <option value="URGENT">Urgent (Prioritas Cepat)</option>
              <option value="CITO">CITO (Pelayanan Gawat Darurat Segera)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Indikasi Klinis / Alasan Permintaan</label>
            <input
              type="text"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
              required
            />
          </div>
        </div>

        {/* Item Selection based on Category */}
        {orderCategory === 'PHARMACY' && (
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3">
            <h5 className="text-xs font-bold text-teal-600 uppercase">Pilih Obat dari Formularium:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Obat</label>
                <select
                  value={selectedMed.code}
                  onChange={(e) => {
                    const found = PHARMACY_CATALOG.find(m => m.code === e.target.value);
                    if (found) setSelectedMed(found);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-container-high border text-xs text-on-surface font-bold"
                >
                  {PHARMACY_CATALOG.map(m => (
                    <option key={m.code} value={m.code}>{m.name} — Rp {m.unitPrice.toLocaleString('id-ID')}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Dosis</label>
                  <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Frekuensi</label>
                  <input type="text" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Jumlah</label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-surface-container-high border text-xs text-on-surface font-mono" />
                </div>
              </div>
            </div>
          </div>
        )}

        {orderCategory === 'LABORATORY' && (
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3">
            <h5 className="text-xs font-bold text-teal-600 uppercase">Pilih Pemeriksaan Laboratorium (LOINC Mapped):</h5>
            <select
              value={selectedLab.code}
              onChange={(e) => {
                const found = LABORATORY_CATALOG.find(l => l.code === e.target.value);
                if (found) setSelectedLab(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-high border text-xs text-on-surface font-bold"
            >
              {LABORATORY_CATALOG.map(l => (
                <option key={l.code} value={l.code}>[{l.loinc}] {l.name} — Rp {l.unitPrice.toLocaleString('id-ID')}</option>
              ))}
            </select>
            <p className="text-[11px] text-on-surface-variant font-mono">
              Spesimen Wajib: <strong>{selectedLab.specimen}</strong> &bull; Nilai Rujukan: {selectedLab.refRange}
            </p>
          </div>
        )}

        {orderCategory === 'RADIOLOGY' && (
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-3">
            <h5 className="text-xs font-bold text-teal-600 uppercase">Pilih Pemeriksaan Radiologi (DICOM Modality):</h5>
            <select
              value={selectedRad.code}
              onChange={(e) => {
                const found = RADIOLOGY_CATALOG.find(r => r.code === e.target.value);
                if (found) setSelectedRad(found);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-high border text-xs text-on-surface font-bold"
            >
              {RADIOLOGY_CATALOG.map(r => (
                <option key={r.code} value={r.code}>[{r.modality}] {r.name} — Rp {r.unitPrice.toLocaleString('id-ID')}</option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          <span>Kirim Order Klinis Universal (Terbitkan ServiceRequest)</span>
        </button>
      </form>
    </div>
  );
}
