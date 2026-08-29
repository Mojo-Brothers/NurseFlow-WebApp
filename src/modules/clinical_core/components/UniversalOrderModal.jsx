import React, { useState } from 'react';
import { universalOrderEngineService } from '../../orders/services/universalOrderEngine.service.js';
import { allergyEngineService } from '../../emr/services/allergyEngine.service.js';
import { enforceActiveClinicalContext, mapBackendSafetyErrorToClinicalAction } from '../../../core/contracts/clinicalRuntimeSafetyContract.js';
import AllergyOverrideModal from '../../../components/ui/AllergyOverrideModal.jsx';
import toast from 'react-hot-toast';

export default function UniversalOrderModal({ isOpen, onClose, patient, encounter, onOrderPlaced }) {
  const [activeCategory, setActiveCategory] = useState('LABORATORY'); // 'LABORATORY' | 'RADIOLOGY' | 'PHARMACY' | 'BLOOD_BANK' | 'SURGERY' | 'ADMISSION'
  const [priority, setPriority] = useState('ROUTINE'); // 'ROUTINE' | 'CITO' | 'STAT'
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CDSS Allergy Hard-Stop Override State
  const [isAllergyOverrideOpen, setIsAllergyOverrideOpen] = useState(false);
  const [activeAllergyConflict, setActiveAllergyConflict] = useState(null);

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

  const executeOrderCreation = async (overrideOptions = null) => {
    const itemCatalog = CATALOG[activeCategory].find(c => c.code === selectedItem);
    setIsSubmitting(true);
    try {
      enforceActiveClinicalContext({ patientId: patient?.id, encounterId: encounter?.id }, 'Penerbitan Order CPOE');

      const resolvedPatientId = patient.id;
      const order = await universalOrderEngineService.createOrder({
        patientId: resolvedPatientId,
        patientName: patient.name || 'Pasien',
        mrn: patient.mrn || '-',
        episodeId: encounter?.episodeId || patient?.episodeId || `EOC-${resolvedPatientId}`,
        encounterId: encounter?.id || `ENC-${resolvedPatientId}`,
        orderedBy: overrideOptions?.dpjpName || 'dr. Surya Johnson, Sp.PD (DPJP)',
        orderCategory: activeCategory,
        priority,
        clinicalIndication: overrideOptions?.overrideReason
          ? `${clinicalIndication} [OVERRIDE ALERGI: ${overrideOptions.overrideReason}]`
          : clinicalIndication,
        isCito: priority === 'CITO' || priority === 'STAT',
        overrideAllergy: !!overrideOptions?.overrideReason,
        overrideReason: overrideOptions?.overrideReason || null,
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
      setIsAllergyOverrideOpen(false);
      onClose();
    } catch (err) {
      const safetyAction = mapBackendSafetyErrorToClinicalAction(err);
      if (safetyAction?.action === 'SHOW_ALLERGY_OVERRIDE_MODAL') {
        setActiveAllergyConflict({
          message: err.message,
          allergen: itemCatalog?.drugName || itemCatalog?.name
        });
        setIsAllergyOverrideOpen(true);
      } else {
        toast.error(`Gagal Menerbitkan Order: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
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
        setActiveAllergyConflict({
          allergen: allergyCheck.allergen,
          message: `Pasien memiliki riwayat alergi terdokumentasi terhadap ${allergyCheck.allergen}. Peresepan ${itemCatalog.drugName} terblokir CDSS Hard-Stop.`
        });
        setIsAllergyOverrideOpen(true);
        return;
      }
    }

    await executeOrderCreation();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">add_shopping_cart</span>
                Universal CPOE Order Entry Studio
              </h3>
              <p className="text-xs text-slate-500">Penerbitan Order Penunjang, Obat, Tindakan Bedah & Admisi Rawat Inap</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            {/* Category Selector Tabs */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kategori Layanan Klinis *</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1.5">
                {[
                  { id: 'LABORATORY', label: 'Laboratorium', icon: 'biotech' },
                  { id: 'RADIOLOGY', label: 'Radiologi', icon: 'radiology' },
                  { id: 'PHARMACY', label: 'Farmasi / Obat', icon: 'medication' },
                  { id: 'BLOOD_BANK', label: 'Bank Darah', icon: 'bloodtype' },
                  { id: 'SURGERY', label: 'Kamar Bedah', icon: 'surgical' },
                  { id: 'ADMISSION', label: 'Admisi Ranap', icon: 'hotel' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSelectedItem('');
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-center transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                    <span className="text-[10px] leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority & Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Prioritas Klinis *</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="ROUTINE">🟢 ROUTINE (Standar / Terjadwal)</option>
                  <option value="CITO">🔴 CITO (Gawat Darurat / Kurang dari 60 mnt)</option>
                  <option value="STAT">⚡ STAT (Resusitasi Segera / Kurang dari 15 mnt)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Item Permintaan ({activeCategory}) *</label>
                <select
                  value={selectedItem}
                  onChange={e => setSelectedItem(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Pilih Tindakan / Obat dari Katalog --</option>
                  {CATALOG[activeCategory]?.map(item => (
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
                <span>Perhatian Alergi Pasien: {patient.allergies.join(', ')} (Sistem memicu CDSS Hard-Stop dengan otorisasi justifikasi klinis).</span>
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

      {/* JCI MMU 4 / In-situ CDSS Allergy Hard-Stop Override Modal */}
      <AllergyOverrideModal
        isOpen={isAllergyOverrideOpen}
        allergyError={activeAllergyConflict}
        patientName={patient.name || 'Pasien Aktif'}
        prescribedItemName={CATALOG[activeCategory]?.find(c => c.code === selectedItem)?.name}
        onConfirmOverride={(overrideDetails) => {
          executeOrderCreation(overrideDetails);
        }}
        onCancel={() => {
          setIsAllergyOverrideOpen(false);
          setActiveAllergyConflict(null);
        }}
      />
    </>
  );
}
