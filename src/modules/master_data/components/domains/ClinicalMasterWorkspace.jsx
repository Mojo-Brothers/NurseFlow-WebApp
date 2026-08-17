import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';
import { medicationSafetyService } from '../../services/medicationSafety.service.js';
import { pharmacyInventoryService } from '../../services/pharmacyInventory.service.js';
import { businessRuleEngineService } from '../../services/businessRuleEngine.service.js';
import { notificationEngineService } from '../../services/notificationEngine.service.js';

export default function ClinicalMasterWorkspace() {
  const { entitiesData, openCreateModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const tariffs = entitiesData['tariffs'] || [];
  const tariffRules = entitiesData['tariff_price_rules'] || [];
  const medicines = entitiesData['medicines'] || [];
  const lasaList = entitiesData['medication_lasa'] || [];
  const unitConversions = entitiesData['inventory_unit_conversions'] || [];
  const devices = entitiesData['medical_devices'] || [];
  const diagnoses = entitiesData['diagnoses'] || [];
  const procedures = entitiesData['procedures'] || [];
  const businessRules = entitiesData['business_rules'] || businessRuleEngineService.getRules();
  const notificationTemplates = entitiesData['notification_templates'] || [];

  const [activeSubTab, setActiveSubTab] = useState('TARIFFS'); // 'TARIFFS' | 'PRICE_RULES' | 'MEDICINES' | 'LASA' | 'CONVERSIONS' | 'RULES' | 'NOTIFICATIONS' | 'DEVICES' | 'ICD10'
  const [tariffTypeFilter, setTariffTypeFilter] = useState('ALL');
  const [medicineSearch, setMedicineSearch] = useState('');

  // Drug Interaction Checker Tool state
  const [selectedDrug1, setSelectedDrug1] = useState('MED-AML-10');
  const [selectedDrug2, setSelectedDrug2] = useState('MED-MOR-10');

  // Unit Conversion Calculator state
  const [calcQty, setCalcQty] = useState(2);
  const [calcFromUnit, setCalcFromUnit] = useState('BOX');
  const [calcToUnit, setCalcToUnit] = useState('TABLET');

  // Business Rule Tester state
  const [testPatientAge, setTestPatientAge] = useState(8);
  const [testIsWeekend, setTestIsWeekend] = useState(false);
  const [testIsEmergency, setTestIsEmergency] = useState(false);
  const [testInsurance, setTestInsurance] = useState('BPJS');
  const [evaluatedResults, setEvaluatedResults] = useState(null);

  // Notification Broadcast state
  const [broadcastRecipient, setBroadcastRecipient] = useState('IGD_DUTY_TEAM');
  const [broadcastTitle, setBroadcastTitle] = useState('🚨 Peringatan Siaga Medis');
  const [broadcastMessage, setBroadcastMessage] = useState('Lonjakan kedatangan pasien triase P1/P2 di IGD. Seluruh perawat siaga.');
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const filteredTariffs = tariffs.filter(t => !t.is_deleted).filter(t => {
    if (tariffTypeFilter === 'PACKAGE') return t.is_package;
    if (tariffTypeFilter === 'INDIVIDUAL') return !t.is_package;
    return true;
  });

  const filteredMedicines = medicines.filter(m => !m.is_deleted).filter(m => {
    if (!medicineSearch.trim()) return true;
    const q = medicineSearch.toLowerCase();
    return (
      m.trade_name?.toLowerCase().includes(q) ||
      m.generic_name?.toLowerCase().includes(q) ||
      m.kfa_code?.includes(q) ||
      m.medicine_code?.toLowerCase().includes(q)
    );
  });

  const detectedInteractions = medicationSafetyService.checkMedicationInteractions([selectedDrug1, selectedDrug2]);
  const convertedResult = pharmacyInventoryService.convertInventoryUnits(calcQty, calcFromUnit, calcToUnit);

  const handleEvaluateRules = () => {
    const outcome = businessRuleEngineService.evaluateRules({
      patientAge: Number(testPatientAge),
      isWeekend: testIsWeekend,
      isEmergency: testIsEmergency,
      insuranceType: testInsurance
    });
    setEvaluatedResults(outcome);
  };

  const handleSendBroadcast = async () => {
    const res = await notificationEngineService.sendInAppNotification({
      recipientId: broadcastRecipient,
      title: broadcastTitle,
      message: broadcastMessage,
      level: 'CRITICAL'
    });
    setBroadcastStatus(`Notifikasi berhasil disiarkan ke ${broadcastRecipient} (ID: ${res.id})`);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Sub-Tab Navigation ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveSubTab('TARIFFS');
            setActiveEntity('tariffs');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'TARIFFS' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Tarif ({tariffs.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('RULES');
            setActiveEntity('business_rules');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'RULES' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">rule</span>
          <span>Rule Engine ({businessRules.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('NOTIFICATIONS');
            setActiveEntity('notification_templates');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'NOTIFICATIONS' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          <span>Notifikasi & SLA ({notificationTemplates.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('MEDICINES');
            setActiveEntity('medicines');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'MEDICINES' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">pill</span>
          <span>Formularium ({medicines.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('LASA');
            setActiveEntity('medication_lasa');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'LASA' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          <span>LASA & Interaksi ({lasaList.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('CONVERSIONS');
            setActiveEntity('inventory_unit_conversions');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'CONVERSIONS' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">transform</span>
          <span>Konversi ({unitConversions.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('DEVICES');
            setActiveEntity('medical_devices');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'DEVICES' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">medical_information</span>
          <span>Alkes ({devices.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('ICD10');
            setActiveEntity('diagnoses');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'ICD10' ? 'bg-amber-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
          <span>ICD-10 / 9 ({diagnoses.length + procedures.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: Multi-Component Tariffs ─── */}
      {activeSubTab === 'TARIFFS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-headline font-black text-on-surface">Katalog Tarif Multi-Komponen</h3>
              <p className="text-xs text-on-surface-variant">Breakdown Jasa Dokter, RS, Perawat, BHP & Admin.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveEntity('tariffs');
                  openCreateModal();
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Tambah Tarif</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTariffs.map(tariff => (
              <div key={tariff.id} onClick={() => openDetailDrawer(tariff)} className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-amber-500/40 cursor-pointer space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">{tariff.tariff_code}</span>
                    <h4 className="text-base font-headline font-black text-on-surface mt-1">{tariff.tariff_name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-headline font-black text-amber-600 font-mono">Rp {Number(tariff.total_amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Business Rules Engine ─── */}
      {activeSubTab === 'RULES' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">Evaluator Aturan Bisnis Dinamis (Live Rule Tester)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Usia Pasien (Tahun)</label>
                <input type="number" value={testPatientAge} onChange={(e) => setTestPatientAge(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Penjamin</label>
                <select value={testInsurance} onChange={(e) => setTestInsurance(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  <option value="BPJS">BPJS Kesehatan</option>
                  <option value="MANDIRI_INHEALTH">Asuransi Swasta</option>
                  <option value="PRIBADI">Umum / Pribadi</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-bold text-on-surface cursor-pointer">
                  <input type="checkbox" checked={testIsWeekend} onChange={(e) => setTestIsWeekend(e.target.checked)} />
                  <span>Weekend/Libur</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-bold text-on-surface cursor-pointer">
                  <input type="checkbox" checked={testIsEmergency} onChange={(e) => setTestIsEmergency(e.target.checked)} />
                  <span>Cito/Emergensi</span>
                </label>
              </div>
              <button onClick={handleEvaluateRules} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md cursor-pointer">
                Uji Aturan
              </button>
            </div>

            {evaluatedResults && (
              <div className="p-4 rounded-xl bg-surface-container border border-primary/30 space-y-2">
                <p className="text-xs font-bold text-primary">Hasil Evaluasi ({evaluatedResults.triggeredCount} aturan terpicu):</p>
                {evaluatedResults.results.map((res, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-surface-container-high text-xs border border-outline-variant/20">
                    <strong className="text-amber-600">[{res.ruleCode}]</strong> {res.ruleName}
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{JSON.stringify(res.action)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businessRules.map(rule => (
              <div key={rule.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="font-mono text-xs font-bold text-primary">{rule.rule_code}</span>
                <h4 className="text-sm font-black text-on-surface">{rule.rule_name}</h4>
                <p className="text-xs text-on-surface-variant">{rule.description || 'Aturan bisnis aktif.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Notifications & SLA ─── */}
      {activeSubTab === 'NOTIFICATIONS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">Pusat Siaran Notifikasi Medis & Peringatan Darurat</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Target Penerima / Tim Tugas:</label>
                <input type="text" value={broadcastRecipient} onChange={(e) => setBroadcastRecipient(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Judul Peringatan:</label>
                <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Isi Pesan Siaran:</label>
                <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <button onClick={handleSendBroadcast} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-extrabold shadow-md cursor-pointer">
                Kirim Siaran Darurat
              </button>
              {broadcastStatus && <p className="text-xs font-bold text-emerald-600">{broadcastStatus}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notificationTemplates.map(tmpl => (
              <div key={tmpl.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
                <span className="font-mono text-xs font-bold text-primary">{tmpl.template_code}</span>
                <h4 className="text-sm font-black text-on-surface">{tmpl.title}</h4>
                <p className="text-xs text-on-surface-variant">{tmpl.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Formularium Obat ─── */}
      {activeSubTab === 'MEDICINES' && (
        <div className="space-y-4">
          <input
            type="text"
            value={medicineSearch}
            onChange={(e) => setMedicineSearch(e.target.value)}
            placeholder="Cari obat (Nama dagang, generik, kode KFA)..."
            className="px-4 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs w-80 text-on-surface"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMedicines.map(med => (
              <div key={med.id} onClick={() => openDetailDrawer(med)} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{med.medicine_code}</span>
                  {med.is_high_alert && <span className="px-1.5 py-0.2 rounded-md bg-rose-600 text-white font-black text-[9px]">HIGH-ALERT</span>}
                </div>
                <h4 className="text-sm font-black text-on-surface">{med.trade_name}</h4>
                <p className="text-xs text-on-surface-variant">{med.generic_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: LASA & Interaksi Obat ─── */}
      {activeSubTab === 'LASA' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-rose-700 dark:text-rose-400 uppercase">
              Uji Deteksi Interaksi Obat Klinis (Drug-Drug Interaction Checker)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Obat A:</label>
                <select value={selectedDrug1} onChange={(e) => setSelectedDrug1(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.trade_name} ({m.generic_name})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Obat B:</label>
                <select value={selectedDrug2} onChange={(e) => setSelectedDrug2(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.trade_name} ({m.generic_name})</option>)}
                </select>
              </div>
            </div>

            {detectedInteractions.length > 0 ? (
              <div className="p-4 rounded-xl bg-rose-600 text-white space-y-1">
                <p className="font-bold text-xs">⚠️ PERINGATAN INTERAKSI {detectedInteractions[0].severity} DITEMUKAN:</p>
                <p className="text-xs">{detectedInteractions[0].effect}</p>
                <p className="text-[11px] opacity-90">Rekomendasi: {detectedInteractions[0].recommendation}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                ✓ Tidak ditemukan interaksi mayor antara kedua obat yang dipilih.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 6: Konversi Satuan Farmasi ─── */}
      {activeSubTab === 'CONVERSIONS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">Kalkulator Konversi Satuan Multi-Level</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Jumlah</label>
                <input type="number" value={calcQty} onChange={(e) => setCalcQty(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Dari Satuan</label>
                <select value={calcFromUnit} onChange={(e) => setCalcFromUnit(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  <option value="BOX">BOX</option>
                  <option value="STRIP">STRIP</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Ke Satuan</label>
                <select value={calcToUnit} onChange={(e) => setCalcToUnit(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  <option value="TABLET">TABLET</option>
                  <option value="STRIP">STRIP</option>
                </select>
              </div>
              <div className="p-2 rounded-xl bg-primary/10 text-primary font-bold text-sm text-center">
                = {convertedResult} {calcToUnit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7 & 8: Devices & ICD10 ─── */}
      {activeSubTab === 'DEVICES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {devices.map(dev => (
            <div key={dev.id} onClick={() => openDetailDrawer(dev)} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1 cursor-pointer">
              <span className="font-mono text-xs font-bold text-primary">{dev.device_code}</span>
              <h4 className="text-sm font-black text-on-surface">{dev.device_name}</h4>
            </div>
          ))}
        </div>
      )}

      {activeSubTab === 'ICD10' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {diagnoses.map(diag => (
            <div key={diag.id} onClick={() => openDetailDrawer(diag)} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-1 cursor-pointer">
              <span className="font-mono text-xs font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">{diag.icd10_code}</span>
              <h4 className="text-sm font-black text-on-surface">{diag.name_id}</h4>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
