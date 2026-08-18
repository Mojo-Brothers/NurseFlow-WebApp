import React, { useState } from 'react';
import { emarEngineService, EMAR_STATUS } from '../../../../server/services/eMarEngine.service.js';
import toast from 'react-hot-toast';
import { BedsideFiveRightsScannerModal } from '../../../components/clinical/BedsideFiveRightsScannerModal.jsx';

export default function EmarAdministrationStudio({ activePatient }) {
  const defaultSamplePatient = {
    id: 'PAT-SAMPLE-01',
    name: 'Subagyo Wiryono',
    mrn: 'MRN-2026-001928',
    ward: 'Bangsal Melati',
    bed: 'Bed 04',
    allergies: ['Penisilin (Ringan)'],
    medications: [
      {
        id: 'MED-ORD-01',
        code: 'MED-CEFTRIAXONE-1G',
        name: 'Ceftriaxone 1g Vial',
        dose: '1 g',
        route: 'IV',
        frequency: '1x Sehari (QD)',
        scheduleTime: '08:00',
        prescribedBy: 'dr. Surya Johnson, Sp.PD',
        isHighAlert: false,
        status: 'SCHEDULED'
      },
      {
        id: 'MED-ORD-02',
        code: 'MED-INS-NOVORAPID',
        name: 'Novorapid Flexpen 100 IU/mL',
        dose: '6 IU',
        route: 'Subcutaneous',
        frequency: '3x Sehari (TID)',
        scheduleTime: '12:00',
        prescribedBy: 'dr. Endokrin, Sp.PD-KEMD',
        isHighAlert: true,
        status: 'SCHEDULED'
      },
      {
        id: 'MED-ORD-03',
        code: 'MED-PARACETAMOL-500',
        name: 'Paracetamol Infus 1000 mg / 100 mL',
        dose: '1000 mg',
        route: 'IV',
        frequency: '3x Sehari (TID)',
        scheduleTime: '14:00',
        prescribedBy: 'dr. Surya Johnson, Sp.PD',
        isHighAlert: false,
        status: 'SCHEDULED'
      }
    ]
  };

  const patient = activePatient || defaultSamplePatient;
  const [medications, setMedications] = useState(patient.medications || []);

  // Modal State for Administration & High-Alert Check
  const [selectedMed, setSelectedMed] = useState(null);
  const [primaryNurseName, setPrimaryNurseName] = useState('Ns. Ratna Sari, S.Kep');
  const [witnessNurseName, setWitnessNurseName] = useState('');
  const [witnessPin, setWitnessPin] = useState('');
  const [administerNotes, setAdministerNotes] = useState('Diberikan tepat waktu, tidak ada tanda efek samping');
  const [heldReason, setHeldReason] = useState('');
  const [actionType, setActionType] = useState('GIVE'); // 'GIVE' | 'HOLD' | 'REFUSE'

  // Bedside 5-Rights Barcode Scanner Modal State (Sprint 3C)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerOrder, setScannerOrder] = useState(null);
  const [scannerSlot, setScannerSlot] = useState(null);

  const handleOpenScanner = async (med) => {
    const canonicalSlot = {
      slotId: `SLOT-${med.id || '01'}-0800`,
      scheduledTime: med.scheduleTime || '08:00',
      targetTimestamp: new Date().toISOString(),
      status: 'SCHEDULED',
      version: 1
    };

    const canonicalOrder = {
      id: med.id || `ORD-${med.code || 'MED-01'}`,
      orderNumber: `RX-2026-${med.id || '01'}`,
      encounterId: patient.id,
      patientId: patient.id,
      patientName: patient.name,
      mrn: patient.mrn,
      medicationCode: med.code || 'MED-AMOX-500',
      medicationName: med.name,
      dose: med.dose?.replace(/[^0-9.]/g, '') || 500,
      doseUnit: med.dose?.replace(/[0-9.]/g, '').trim() || 'mg',
      route: med.route || 'Oral',
      frequency: med.frequency || 'TID',
      isHighAlert: !!med.isHighAlert,
      highAlertCategory: med.isHighAlert ? 'HIGH_ALERT_MEDICATION' : null,
      status: 'ORDERED',
      version: 1,
      scheduleSlots: [canonicalSlot]
    };

    const { persistenceAdapter } = await import('../../../core/services/persistenceAdapter.service.js');
    await persistenceAdapter.save('encounters', patient.id, {
      id: patient.id,
      patientId: patient.id,
      patientName: patient.name,
      mrn: patient.mrn,
      primaryState: 'INPATIENT_ACTIVE',
      currentLocation: `${patient.ward || 'Bangsal Melati'} ${patient.bed || 'Bed 04'}`
    });

    await persistenceAdapter.save('medication_orders', canonicalOrder.id, canonicalOrder);

    setScannerOrder(canonicalOrder);
    setScannerSlot(canonicalSlot);
    setIsScannerOpen(true);
  };

  const handleScannerSuccess = (result) => {
    if (scannerOrder) {
      setMedications(prev => prev.map(m => m.id === scannerOrder.id || m.name === scannerOrder.medicationName ? {
        ...m,
        status: 'GIVEN',
        administeredBy: 'Ners Pelaksana (Point-of-Care Verified)',
        administeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      } : m));
    }
    toast.success('Point-of-Care 5-Benar Berhasil Diverifikasi & Diadministrasikan!');
  };

  const handleOpenAdministerModal = (med, type = 'GIVE') => {
    setSelectedMed(med);
    setActionType(type);
    setWitnessNurseName('');
    setWitnessPin('');
    setHeldReason('');
  };

  const handleConfirmAdministration = () => {
    if (!selectedMed) return;

    try {
      if (actionType === 'GIVE') {
        // High-Alert Check
        if (selectedMed.isHighAlert && (!witnessNurseName || !witnessPin)) {
          toast.error('❌ OBAT HIGH-ALERT: Nama & PIN Perawat Saksi ke-2 WAJIB diisi!');
          return;
        }

        const result = emarEngineService.administerMedication({
          orderId: selectedMed.id,
          patientId: patient.id,
          patientMrn: patient.mrn,
          medicationCode: selectedMed.code,
          medicationName: selectedMed.name,
          dosage: selectedMed.dose,
          route: selectedMed.route,
          isHighAlert: selectedMed.isHighAlert,
          primaryNurseName,
          secondaryNurseWitnessName: selectedMed.isHighAlert ? witnessNurseName : null,
          notes: administerNotes
        });

        setMedications(prev => prev.map(m => m.id === selectedMed.id ? {
          ...m,
          status: 'GIVEN',
          administeredBy: primaryNurseName,
          witnessNurse: selectedMed.isHighAlert ? witnessNurseName : null,
          administeredAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        } : m));

        toast.success(result.message);
      } else if (actionType === 'HOLD') {
        if (!heldReason) {
          toast.error('Wajib mengisi alasan klinis penundaan obat (Held)');
          return;
        }
        setMedications(prev => prev.map(m => m.id === selectedMed.id ? {
          ...m,
          status: 'HELD',
          administeredBy: primaryNurseName,
          notes: `Ditunda: ${heldReason}`
        } : m));
        toast.warning(`Obat ${selectedMed.name} DITUNDA (HELD) dengan alasan: ${heldReason}`);
      }

      setSelectedMed(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Banner: Patient Info & 5-Benar JCI IPSG 3 Safety Badge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black">
            <span className="material-symbols-outlined text-[28px]">medication</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black">{patient.name}</h2>
              <span className="text-xs font-mono text-cyan-300">({patient.mrn})</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold">
                {patient.ward} • {patient.bed}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              DPJP: <span className="text-slate-200 font-semibold">dr. Surya Johnson, Sp.PD</span> • Alergi: <span className="text-rose-400 font-bold">{patient.allergies?.join(', ') || 'Tidak Ada'}</span>
            </p>
          </div>
        </div>

        {/* 5-Rights Verification Guide */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-700 text-blue-300 flex items-center gap-1">
            ✓ 1. Pasien
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-700 text-blue-300 flex items-center gap-1">
            ✓ 2. Obat
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-700 text-blue-300 flex items-center gap-1">
            ✓ 3. Dosis
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-700 text-blue-300 flex items-center gap-1">
            ✓ 4. Rute
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-700 text-blue-300 flex items-center gap-1">
            ✓ 5. Waktu
          </span>
        </div>
      </div>

      {/* Medication Schedule Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">schedule</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Daftar Jadwal Pemberian Obat Pasien (eMAR 24 Jam)</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Shift Dinas: 07:00 - 14:00 WIB</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="p-3.5">Jadwal</th>
                <th className="p-3.5">Nama Obat & Dosis</th>
                <th className="p-3.5">Rute</th>
                <th className="p-3.5">Frekuensi</th>
                <th className="p-3.5">Tipe Keamanan</th>
                <th className="p-3.5">Status Pemberian</th>
                <th className="p-3.5 text-right">Aksi Klinis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {medications.map(med => (
                <tr key={med.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-cyan-400">
                    {med.scheduleTime} WIB
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{med.name}</div>
                    <div className="text-[10px] text-slate-400">Instruksi: {med.prescribedBy}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {med.route}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{med.frequency}</td>
                  <td className="p-3.5">
                    {med.isHighAlert ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 border border-rose-400 text-rose-600 dark:text-rose-300 font-black text-[10px] flex items-center gap-1 w-fit animate-pulse">
                        <span className="material-symbols-outlined text-[12px]">security</span>
                        HIGH-ALERT (Dual Check)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-[10px]">
                        Standar
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {med.status === 'GIVEN' && (
                      <div className="flex flex-col">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] w-fit">
                          ✓ Diberikan ({med.administeredAt})
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Oleh: {med.administeredBy} {med.witnessNurse && `• Saksi: ${med.witnessNurse}`}
                        </span>
                      </div>
                    )}
                    {med.status === 'HELD' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px] w-fit">
                        ⏸️ Ditunda (Held)
                      </span>
                    )}
                    {med.status === 'SCHEDULED' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-400 text-blue-600 dark:text-cyan-300 font-bold text-[10px] w-fit">
                        🕒 Menunggu Jadwal
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right space-x-1.5">
                    {med.status === 'SCHEDULED' && (
                      <>
                        <button
                          onClick={() => handleOpenScanner(med)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                          title="Verifikasi Barcode Gelang Pasien & Obat (JCI 5-Rights Point-of-Care)"
                        >
                          <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
                          Scan 5-Benar
                        </button>
                        <button
                          onClick={() => handleOpenAdministerModal(med, 'HOLD')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                          title="Tunda Pemberian (Hold)"
                        >
                          Tunda
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medication Administration & High-Alert Modal */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-[24px]">vaccines</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {actionType === 'GIVE' ? 'Verifikasi Pemberian Obat (eMAR)' : 'Penundaan Pemberian Obat'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Pasien: {patient.name} ({patient.mrn})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMed(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Selected Drug Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-black text-sm text-blue-600 dark:text-cyan-400">{selectedMed.name}</div>
              <div className="text-slate-600 dark:text-slate-300">Dosis: <span className="font-bold">{selectedMed.dose}</span> • Rute: <span className="font-bold">{selectedMed.route}</span></div>
              <div className="text-slate-500">Jadwal: {selectedMed.scheduleTime} WIB ({selectedMed.frequency})</div>
            </div>

            {actionType === 'GIVE' ? (
              <div className="space-y-3 text-xs">
                {/* 5-Rights Check Confirmation */}
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold space-y-1">
                  <div>✓ 5-Benar Diverifikasi: Benar Pasien, Obat, Dosis, Rute, dan Waktu.</div>
                </div>

                {/* High-Alert Dual Check (JCI IPSG 3) */}
                {selectedMed.isHighAlert && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-400 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-black">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span>VERIFIKASI GANDA OBAT HIGH-ALERT (MANDATORY DUAL SIGN)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Sesuai standar JCI IPSG 3, obat berkonsentrasi tinggi / risiko tinggi wajib diverifikasi secara independen oleh perawat kedua.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Nama Perawat Saksi ke-2</label>
                        <input
                          type="text"
                          value={witnessNurseName}
                          onChange={(e) => setWitnessNurseName(e.target.value)}
                          placeholder="Contoh: Ns. Maya Dewi, S.Kep"
                          className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">PIN / Digital Sign Saksi</label>
                        <input
                          type="password"
                          value={witnessPin}
                          onChange={(e) => setWitnessPin(e.target.value)}
                          placeholder="••••"
                          maxLength={6}
                          className="w-full mt-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 font-mono text-center font-bold text-xs tracking-widest"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Catatan Observasi Pemberian</label>
                  <input
                    type="text"
                    value={administerNotes}
                    onChange={(e) => setAdministerNotes(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-slate-700 dark:text-slate-300">Alasan Penundaan (Held Reason)</label>
                <textarea
                  value={heldReason}
                  onChange={(e) => setHeldReason(e.target.value)}
                  placeholder="Contoh: Pasien mual muntah berat / TD 80/50 mmHg menunda obat antihipertensi"
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedMed(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAdministration}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-transform active:scale-95 cursor-pointer"
              >
                {actionType === 'GIVE' ? 'Konfirmasi Berikan Obat' : 'Simpan Penundaan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bedside 5-Rights Point-of-Care Barcode Scanner Modal */}
      {isScannerOpen && scannerOrder && scannerSlot && (
        <BedsideFiveRightsScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          order={scannerOrder}
          slot={scannerSlot}
          onAdministrationSuccess={handleScannerSuccess}
        />
      )}
    </div>
  );
}
