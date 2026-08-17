import React, { useState } from 'react';
import { useEmergencyStore } from '../store/emergency.store.js';

export default function EmergencyProtocolModal({ patient, onClose }) {
  const { protocols, activateProtocol } = useEmergencyStore();
  const [selectedProtoCode, setSelectedProtoCode] = useState('STEMI_CODE');
  const [doctorName, setDoctorName] = useState('dr. Jaga Emergensi');
  const [loading, setLoading] = useState(false);

  const currentProto = protocols.find(p => p.protocol_code === selectedProtoCode) || protocols[0];

  const handleActivate = async () => {
    setLoading(true);
    try {
      await activateProtocol({
        encounterId: patient.encounter_id || 'ENC-2026-001',
        episodeId: patient.episode_id || 'EOC-2026-001',
        patientId: patient.patient_id || patient.id,
        patientName: patient.patient_name || patient.full_name,
        protocolCode: selectedProtoCode,
        doctorName
      });
      alert(`PROTOKOL ${currentProto.protocol_name} BERHASIL DIAKTIFKAN!\nSeluruh order Cito Lab, Radiologi, dan Obat telah diterbitkan.`);
      onClose();
    } catch (err) {
      alert(`Gagal Mengaktifkan Protokol: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-2xl border border-rose-500/40 space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 animate-pulse">emergency</span>
            <h3 className="text-sm font-headline font-black text-on-surface uppercase tracking-wider">
              Aktivasi 1-Klik Emergency Fast-Track Protocol
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[10px] text-on-surface-variant block font-bold">Pasien Target:</span>
            <strong className="text-on-surface text-sm font-bold">{patient?.patient_name || patient?.full_name}</strong>
          </div>
          <span className="font-bold text-teal-600">{patient?.mrn}</span>
        </div>

        {/* ─── Protocol Selector ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {protocols.map(proto => (
            <button
              key={proto.protocol_code}
              type="button"
              onClick={() => setSelectedProtoCode(proto.protocol_code)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                selectedProtoCode === proto.protocol_code
                  ? 'bg-rose-500/15 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-surface-container-high border-outline-variant/30 hover:border-outline-variant'
              }`}
            >
              <span className="text-[9px] font-black uppercase text-rose-600 block">{proto.protocol_code}</span>
              <h5 className="text-xs font-black text-on-surface mt-1 line-clamp-2">{proto.protocol_name}</h5>
              <span className="text-[10px] font-bold text-amber-600 mt-1 block">Golden: &le; {proto.target_golden_period_minutes}m</span>
            </button>
          ))}
        </div>

        {/* ─── Protocol Order Items Summary ─── */}
        {currentProto && (
          <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">Paket Order Otomatis (Auto-Order Bundle):</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Pemeriksaan Penunjang Cito:</span>
                {currentProto.diagnostics.map((d, i) => (
                  <div key={i} className="p-2 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between">
                    <span className="font-bold text-on-surface text-[11px]">{d.testName}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.2 bg-rose-600 text-white rounded">CITO</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Medikasi & Loading Dose:</span>
                {currentProto.medications.map((m, i) => (
                  <div key={i} className="p-2 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between">
                    <span className="font-bold text-on-surface text-[11px]">{m.medicineName}</span>
                    <span className="text-[10px] font-bold text-teal-600">{m.dose}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface cursor-pointer">
            Batal
          </button>
          <button
            onClick={handleActivate}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-extrabold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Aktifkan Protokol 1-Klik</span>
          </button>
        </div>
      </div>
    </div>
  );
}
