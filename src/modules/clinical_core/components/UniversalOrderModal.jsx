import React, { useState } from 'react';
import { universalOrderEngineService } from '../../orders/services/universalOrderEngine.service.js';
import { allergyEngineService } from '../../emr/services/allergyEngine.service.js';
import toast from 'react-hot-toast';

export default function UniversalOrderModal({ isOpen, onClose, patient, encounter, onOrderPlaced }) {
  const [activeCategory, setActiveCategory] = useState('LABORATORY'); // 'LABORATORY' | 'RADIOLOGY' | 'PHARMACY' | 'BLOOD_BANK' | 'SURGERY' | 'ADMISSION'
  const [priority, setPriority] = useState('ROUTINE'); // 'ROUTINE' | 'CITO' | 'STAT'
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !patient) return null;

  const CATALOG = {
    LABORATORY: [
      { code: 'LAB-DL', name: 'Darah Lengkap 5-Diff (CBC)', price: 110000 },
      { code: 'LAB-ELEK', name: 'Elektrolit Serum (Na, K, Cl)', price: 145000 },
      { code: 'LAB-LAKTAT', name: 'Laktat Darah Kuantitatif (Sepsis Marker)', price: 175000 },
      { code: 'LAB-KULTUR', name: 'Kultur Darah & Sensitivitas Antibiotik', price: 380000 },
      { code: 'LAB-TROP', name: 'Troponin I Kuantitatif Cito (Cardiac Marker)', price: 290000 },
      { code: 'LAB-AGD', name: 'Analisa Gas Darah (Blood Gas Analysis)', price: 160000 }
    ],
    RADIOLOGY: [
      { code: 'RAD-THORAX', name: 'Foto Rontgen Thorax AP / PA', price: 150000 },
      { code: 'RAD-CT-HEAD', name: 'CT-Scan Kepala Non-Kontras', price: 1100000 },
      { code: 'RAD-USG-FAST', name: 'USG Abdomen FAST (Trauma Protocol)', price: 350000 },
      { code: 'RAD-MRI-BRAIN', name: 'MRI Brain 1.5 Tesla', price: 2400000 }
    ],
    PHARMACY: [
      { code: 'RX-RL', name: 'Ringer Lactate 500 ml Infus IV', drugName: 'Ringer Lactate', price: 22000 },
      { code: 'RX-CEFT', name: 'Ceftriaxone 1 gram Vial Injeksi IV', drugName: 'Ceftriaxone', price: 45000 },
      { code: 'RX-AMOX', name: 'Amoxicillin 500 mg Tablet (Penicillin Group)', drugName: 'Amoxicillin', price: 12000 },
      { code: 'RX-PCT', name: 'Paracetamol 500 mg Tablet', drugName: 'Paracetamol', price: 8000 },
      { code: 'RX-KETOROLAC', name: 'Ketorolac 30 mg Injeksi IV', drugName: 'Ketorolac', price: 30000 }
    ],
    BLOOD_BANK: [
      { code: 'BB-PRC', name: 'Packed Red Cells (PRC) - Kantong Darah', price: 360000 },
      { code: 'BB-FFP', name: 'Fresh Frozen Plasma (FFP)', price: 380000 },
      { code: 'BB-TC', name: 'Thrombocyte Concentrate (TC)', price: 420000 }
    ],
    SURGERY: [
      { code: 'OK-LAPAROTOMI', name: 'Laparotomi Eksplorasi Akut (Cito)', price: 8500000 },
      { code: 'OK-APENDEKTOMI', name: 'Apendektomi Cito / Laparoskopi', price: 6200000 },
      { code: 'OK-ORIF', name: 'ORIF Fraktur Tertutup / Terbuka', price: 9800000 }
    ],
    ADMISSION: [
      { code: 'ADM-MELATI', name: 'Admisi Rawat Inap Bangsal Melati (Kelas 1)', price: 450000 },
      { code: 'ADM-MAWAR', name: 'Admisi Rawat Inap Bangsal Mawar (BPJS / Standar)', price: 250000 },
      { code: 'ADM-ICU', name: 'Transfer & Admisi Ruang Perawatan Intensif (ICU Bed 1)', price: 1500000 }
    ]
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error('Pilih item order terlebih dahulu!');
      return;
    }
    if (!clinicalIndication.trim()) {
      toast.error('Indikasi klinis wajib diisi!');
      return;
    }

    const itemCatalog = CATALOG[activeCategory].find(c => c.code === selectedItem);

    // ─── CLINICAL SAFETY BARRIER 1: DRUG ALLERGY CHECK (JCI IPSG 3) ───
    if (activeCategory === 'PHARMACY' && itemCatalog?.drugName) {
      const allergyCheck = allergyEngineService.checkDrugAllergyConflict(patient.id, itemCatalog.drugName);
      if (allergyCheck.hasConflict) {
        toast.error(`❌ ORDER OBAT DITOLAK (SAFETY BARRIER): Pasien memiliki alergi terdokumentasi terhadap ${allergyCheck.allergen}! Risiko syok anafilaksis berat!`, {
          duration: 7000,
          icon: '🛑'
        });
        return;
      }
    }

    // ─── CLINICAL SAFETY BARRIER 2: BLOOD TRANSFUSION CROSSMATCH CHECK ───
    if (activeCategory === 'BLOOD_BANK') {
      // Simulating crossmatch check barrier
      toast('🩸 Order Bank Darah diterima: Wajib lolos verifikasi Crossmatch BDRS sebelum unit dikeluarkan.', {
        icon: '🩸'
      });
    }

    setIsSubmitting(true);
    try {
      const order = await universalOrderEngineService.createOrder({
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        episodeId: encounter?.episodeId || 'EOC-2026-001',
        encounterId: encounter?.id || 'ENC-2026-001',
        orderedBy: 'dr. Surya Johnson, Sp.PD (DPJP)',
        orderCategory: activeCategory,
        priority,
        clinicalIndication,
        isCito: priority === 'CITO' || priority === 'STAT',
        items: [
          {
            code: itemCatalog.code,
            name: itemCatalog.name,
            quantity: itemQuantity,
            unitPrice: itemCatalog.price,
            totalPrice: itemCatalog.price * itemQuantity
          }
        ]
      });

      toast.success(`✅ Order ${activeCategory} (${itemCatalog.name}) berhasil diterbitkan (${order.order_number})!`);
      if (onOrderPlaced) onOrderPlaced(order);
      onClose();
    } catch (err) {
      toast.error(`Gagal menerbitkan order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl flex flex-col p-6 gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">add_shopping_cart</span>
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Panel Penerbitan Order Klinis Terpadu</h2>
              <p className="text-[11px] text-slate-500">Pasien: <span className="font-bold text-slate-700 dark:text-slate-300">{patient.name}</span> ({patient.mrn})</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer">
            ✕
          </button>
        </div>

        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          {[
            { id: 'LABORATORY', label: 'Laboratorium', icon: 'biotech' },
            { id: 'RADIOLOGY', label: 'Radiologi', icon: 'radiology' },
            { id: 'PHARMACY', label: 'Farmasi / Obat', icon: 'medication' },
            { id: 'BLOOD_BANK', label: 'Bank Darah', icon: 'bloodtype' },
            { id: 'SURGERY', label: 'Operasi (IBS)', icon: 'fluid_med' },
            { id: 'ADMISSION', label: 'Rawat Inap', icon: 'bed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveCategory(tab.id); setSelectedItem(''); }}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span className="text-[10px] text-center leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
          {/* Priority & Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Tingkat Prioritas Permintaan</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="ROUTINE">Rutin (Standar Pelayanan)</option>
                <option value="CITO">⚡ CITO (Segera &lt; 60 Menit)</option>
                <option value="STAT">🚨 STAT (Gawat Darurat &lt; 15 Menit)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Item {activeCategory}</label>
              <select
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                required
              >
                <option value="">-- Pilih Item dari Katalog --</option>
                {CATALOG[activeCategory].map(item => (
                  <option key={item.code} value={item.code}>
                    {item.name} — Rp {item.price.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indication */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Indikasi Klinis / Catatan Dokter *</label>
            <input
              type="text"
              placeholder="Contoh: Evaluasi sepsis & trombositopenia, dugaan perdarahan saluran cerna"
              value={clinicalIndication}
              onChange={e => setClinicalIndication(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Patient Allergy Reminder */}
          {patient.allergies?.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>Perhatian Alergi Pasien: {patient.allergies.join(', ')} (Sistem memblokir resep obat kontraindikasi secara otomatis).</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isSubmitting ? 'Menerbitkan...' : 'Terbitkan Order Klinis Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
