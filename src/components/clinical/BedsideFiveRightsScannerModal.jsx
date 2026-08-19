import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  QrCode, 
  UserCheck, 
  Pill, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck, 
  X, 
  Lock, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { pointOfCareFiveRightsValidator, FIVE_RIGHTS_STATUS } from '../../core/services/pointOfCareFiveRightsValidator.service.js';

export function BedsideFiveRightsScannerModal({
  isOpen,
  onClose,
  order,
  slot,
  onAdministrationSuccess
}) {
  if (!isOpen || !order || !slot) return null;

  const [step, setStep] = useState(1); // 1: Scan Patient, 2: Scan Medication, 3: Review & Dual-Sign, 4: Success
  const [patientBarcodeInput, setPatientBarcodeInput] = useState('');
  const [medicationBarcodeInput, setMedicationBarcodeInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Manual Fallback Override Mode (Gap 4: Hardware / Scanner Failure)
  const [isManualFallback, setIsManualFallback] = useState(false);
  const [manualFallbackReason, setManualFallbackReason] = useState('GELANG_PASIEN_RUSAK');
  const [manualFallbackNotes, setManualFallbackNotes] = useState('');

  // Dual-Signature inputs for High-Alert
  const [coSignatureNurseId, setCoSignatureNurseId] = useState('');
  const [coSignatureNurseName, setCoSignatureNurseName] = useState('');
  const [coSignaturePassword, setCoSignaturePassword] = useState('');
  const [notes, setNotes] = useState('');

  // Reset modal state on open
  useEffect(() => {
    setStep(1);
    setPatientBarcodeInput('');
    setMedicationBarcodeInput('');
    setVerificationResult(null);
    setErrorMsg(null);
  }, [isOpen, order?.id, slot?.slotId]);

  // Quick simulation helper buttons for testing bedside scanner
  const handleSimulateScanPatient = () => {
    setPatientBarcodeInput(order.mrn);
  };

  const handleSimulateScanMedication = () => {
    setMedicationBarcodeInput(order.medicationCode);
  };

  // Step 1: Confirm Patient Scan
  const handleProceedToMedication = () => {
    if (!patientBarcodeInput.trim()) {
      setErrorMsg('Silakan scan barcode gelang identitas pasien terlebih dahulu.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  // Step 2: Run 5-Rights Verification
  const handleRunVerification = async () => {
    if (!medicationBarcodeInput.trim()) {
      setErrorMsg('Silakan scan barcode unit obat terlebih dahulu.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await pointOfCareFiveRightsValidator.validateFiveRights({
        rawPatientBarcode: patientBarcodeInput,
        rawMedicationBarcode: medicationBarcodeInput,
        orderId: order.id,
        slotId: slot.slotId,
        currentTimestamp: slot.targetTimestamp
      });

      setVerificationResult(result);
      setStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Verifikasi 5-Benar gagal dievaluasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Execute Administration
  const handleExecuteAdminister = async () => {
    if (order.isHighAlert && (!coSignatureNurseName || !coSignaturePassword)) {
      setErrorMsg('Obat High-Alert mewajibkan verifikasi dan tanda tangan saksi perawat kedua!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await pointOfCareFiveRightsValidator.executeBedsideAdministration({
        rawPatientBarcode: patientBarcodeInput,
        rawMedicationBarcode: medicationBarcodeInput,
        orderId: order.id,
        slotId: slot.slotId,
        nurseId: 'NURSE-ACTIVE',
        nurseName: 'Ners Pelaksana (Aktif)',
        coSignatureNurseId: order.isHighAlert ? (coSignatureNurseId || 'NURSE-COSIGN') : null,
        coSignatureNurseName: order.isHighAlert ? coSignatureNurseName : null,
        notes,
        currentTimestamp: slot.targetTimestamp
      });

      setStep(4);
      if (onAdministrationSuccess) {
        onAdministrationSuccess(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mencatat administrasi obat di bedside.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                Point-of-Care 5-Benar Barcode Verification
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Slot {slot.scheduledTime}
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Closed-Loop eMAR Bedside Verification Engine • JCI MMU Standards
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            Scan Pasien
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            Scan Obat
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            Evaluasi 5-Benar
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className={`flex items-center gap-2 ${step >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
            Selesai
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SCAN PATIENT */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Langkah 1: Identifikasi Pasien (Right Patient)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Arahkan pemindai barcode pada gelang pasien atau masukkan MRN/NIK pasien.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Input Barcode Gelang Pasien
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Scan gelang (contoh: MRN-2026-...)" 
                      value={patientBarcodeInput}
                      onChange={(e) => setPatientBarcodeInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSimulateScanPatient}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Simulasikan
                  </button>
                </div>
              </div>

              {/* Hardware Failure Fallback Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualFallback(prev => !prev)}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{isManualFallback ? 'Tutup Opsi Input Manual' : 'Gelang Rusak / Scanner Offline? Gunakan Verifikasi Manual'}</span>
                </button>

                {isManualFallback && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-200">Justifikasi Verifikasi Manual (JCI IPSG 1):</span>
                    <select
                      value={manualFallbackReason}
                      onChange={e => setManualFallbackReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="GELANG_PASIEN_RUSAK">Gelang Pasien Rusak / Terlepas</option>
                      <option value="SCANNER_BLUETOOTH_OFFLINE">Scanner Barcode / Bluetooth Offline</option>
                      <option value="PASIEN_ISOLASI_DARURAT">Pasien Isolasi / Darurat Bedah</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Catatan verifikasi identitas fisik bedside..."
                      value={manualFallbackNotes}
                      onChange={e => setManualFallbackNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPatientBarcodeInput(order.mrn);
                        toast.success('Identitas pasien diverifikasi manual.');
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                    >
                      Konfirmasi Identitas Pasien Manual
                    </button>
                  </div>
                )}
              </div>

              {/* Target Patient Card */}
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs space-y-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-300">Pasien Terjadwal:</div>
                <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{order.patientName}</div>
                <div className="text-slate-600 dark:text-slate-400 font-mono">MRN: {order.mrn}</div>
              </div>
            </div>
          )}

          {/* STEP 2: SCAN MEDICATION */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-950/60 rounded-xl text-teal-600">
                  <Pill className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Langkah 2: Identifikasi Obat (Right Drug)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Arahkan pemindai pada kemasan blister/vial atau barcode GS1 unit dose.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Input Barcode Kemasan Obat
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Scan obat (contoh: MED-AMOX-500 atau GS1 DataMatrix)" 
                      value={medicationBarcodeInput}
                      onChange={(e) => setMedicationBarcodeInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSimulateScanMedication}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Simulasikan
                  </button>
                </div>
              </div>

              {/* Target Medication Card */}
              <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/40 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-teal-900 dark:text-teal-300">Obat yang Diresepkan:</span>
                  {order.isHighAlert && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded-full text-[10px]">
                      HIGH-ALERT
                    </span>
                  )}
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{order.medicationName}</div>
                <div className="text-slate-600 dark:text-slate-400">
                  Dosis: {order.dose} {order.doseUnit} • Rute: {order.route} • Jadwal: {slot.scheduledTime}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 5-RIGHTS EVALUATION & DUAL SIGN */}
          {step === 3 && verificationResult && (
            <div className="space-y-4">
              
              {/* Overall Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                verificationResult.status === FIVE_RIGHTS_STATUS.PASS 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  {verificationResult.status === FIVE_RIGHTS_STATUS.PASS ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {verificationResult.status === FIVE_RIGHTS_STATUS.PASS 
                        ? '5-Benar Lolos Verifikasi Sensor (PASS)' 
                        : 'Verifikasi Sensor GAGAL (HARD STOP)'}
                    </div>
                    <div className="text-xs opacity-90 font-mono">
                      ID: {verificationResult.verificationId}
                    </div>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  verificationResult.status === FIVE_RIGHTS_STATUS.PASS ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {verificationResult.status}
                </span>
              </div>

              {/* 5-Rights Individual Breakdown Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {Object.entries(verificationResult.rights).map(([key, val]) => (
                  <div key={key} className="p-2.5 px-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      {val.status === FIVE_RIGHTS_STATUS.PASS ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {key.replace('right', 'Right ')}:
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">{val.details}</span>
                    </div>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      val.status === FIVE_RIGHTS_STATUS.PASS ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {val.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* High-Alert Dual Signature Section (Mandatory if isHighAlert) */}
              {order.isHighAlert && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Verifikasi Ganda Saksi Perawat Kedua (JCI IPSG 3 - High Alert)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nama Saksi RN Kedua
                      </label>
                      <input 
                        type="text" 
                        placeholder="Contoh: Ners Maya, S.Kep" 
                        value={coSignatureNurseName}
                        onChange={(e) => setCoSignatureNurseName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        PIN / Password Saksi
                      </label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={coSignaturePassword}
                        onChange={(e) => setCoSignaturePassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Administration Clinical Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Klinis Tambahan (Opsional)
                </label>
                <input 
                  type="text" 
                  placeholder="Catatan respon pasien, toleransi oral, dsb." 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 4 && (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                Administrasi Obat Berhasil Dicatat!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Dosis telah diberikan di samping tempat tidur pasien. Seluruh sensor evidence dan event log immutable telah disinkronkan ke buku besar rekam medis.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          {step === 1 && (
            <>
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Batal
              </button>
              <button 
                onClick={handleProceedToMedication}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                Lanjut Scan Obat →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Kembali
              </button>
              <button 
                onClick={handleRunVerification}
                disabled={isVerifying}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {isVerifying ? 'Mengevaluasi 5-Benar...' : 'Jalankan Verifikasi 5-Benar'}
              </button>
            </>
          )}

          {step === 3 && verificationResult && (
            <>
              <button 
                onClick={() => setStep(2)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                ← Scan Ulang
              </button>
              <button 
                onClick={handleExecuteAdminister}
                disabled={!verificationResult.canAdminister || isSubmitting}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                  verificationResult.canAdminister 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                {isSubmitting ? 'Mencatat Administrasi...' : 'Berikan Obat (Administer Dose)'}
              </button>
            </>
          )}

          {step === 4 && (
            <button 
              onClick={onClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
            >
              Tutup & Kembali ke eMAR
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default BedsideFiveRightsScannerModal;
