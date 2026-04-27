import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, AlertTriangle, UserCheck, ShieldAlert, Zap, Clock, ShieldCheck } from 'lucide-react';

const HIGH_ALERT_MEDS = [
  'Insulin', 'Heparin', 'Warfarin', 'Digoxin', 'Potassium Chloride', 'Morphine', 'Fentanyl'
];

export default function EMARForm({ formData, setFormData, patient }) {
  // Simulating prescribed medications from CPOE/Pharmacy
  const [prescribedMeds, setPrescribedMeds] = useState([
    { id: 1, name: 'Amlodipine 5mg', dose: '1 Tablet', route: 'Oral', frequency: '1x1', instruction: 'Sesudah Makan', isHighAlert: false },
    { id: 2, name: 'Insulin Novorapid', dose: '10 Unit', route: 'Subkutan', frequency: '3x1 (AC)', instruction: '15 Menit Sebelum Makan', isHighAlert: true },
    { id: 3, name: 'Paracetamol 500mg', dose: '1 Tablet', route: 'Oral', frequency: 'PRN (Jika Demam)', instruction: 'Sesudah Makan', isHighAlert: false }
  ]);

  const [adminLogs, setAdminLogs] = useState(formData.administration_logs || {});
  const [witnesses, setWitnesses] = useState(formData.witnesses || {});

  const toggleAdmin = (medId) => {
    const isCurrentlyAdministered = !!adminLogs[medId];
    const newLogs = { ...adminLogs };
    
    if (isCurrentlyAdministered) {
      delete newLogs[medId];
    } else {
      newLogs[medId] = {
        timestamp: new Date().toISOString(),
        administered_by: 'Nurse Sarah', // In real app, from auth
        status: 'GIVEN'
      };
    }
    
    setAdminLogs(newLogs);
    setFormData({ ...formData, administration_logs: newLogs });
  };

  const setWitness = (medId, witnessName) => {
    const newWitnesses = { ...witnesses, [medId]: witnessName };
    setWitnesses(newWitnesses);
    setFormData({ ...formData, witnesses: newWitnesses });
  };

  return (
    <div className="space-y-8">
      {/* JCI SAFETY HEADER */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tighter">Protokol Pemberian Obat (7 BENAR)</h3>
          <p className="text-xs font-bold opacity-70">Benar Pasien, Benar Obat, Benar Dosis, Benar Rute, Benar Waktu, Benar Dokumentasi, Benar Indikasi.</p>
        </div>
      </div>

      {/* PATIENT VERIFICATION (IPSG.1) */}
      <div className="bg-[var(--surface-container-low)] p-6 rounded-3xl border border-[var(--outline-variant)]">
        <label className="flex items-center gap-4 cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.id_verified || false}
            onChange={(e) => setFormData({...formData, id_verified: e.target.checked})}
            className="w-6 h-6 rounded-lg accent-emerald-500"
          />
          <div>
            <span className="text-sm font-black uppercase tracking-widest text-[var(--on-surface)]">Konfirmasi Identitas Pasien (Double ID)</span>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Wajib: Cocokkan Gelang Pasien dengan MRN: {patient?.mrn || 'N/A'}</p>
          </div>
        </label>
      </div>

      {/* MEDICATION LIST */}
      <div className="grid grid-cols-1 gap-4">
        {prescribedMeds.map((med) => {
          const isAdministered = !!adminLogs[med.id];
          const isHighAlert = med.isHighAlert;
          const hasWitness = !!witnesses[med.id];

          return (
            <div 
              key={med.id} 
              className={`
                relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all duration-500
                ${isAdministered 
                  ? 'bg-emerald-500/5 border-emerald-500/30' 
                  : isHighAlert ? 'bg-red-500/5 border-red-500/20' : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)]'}
              `}
            >
              {isHighAlert && (
                <div className="absolute top-0 right-12 px-4 py-1.5 bg-red-600 text-[9px] font-black uppercase tracking-widest text-white rounded-b-xl shadow-lg">
                  HIGH ALERT
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAdministered ? 'bg-emerald-500 text-white' : isHighAlert ? 'bg-red-500/20 text-red-500' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                    <Pill size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[var(--on-surface)] tracking-tight">{med.name}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest opacity-50">
                      <span className="flex items-center gap-1"><Zap size={12}/> {med.dose}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><ShieldCheck size={12}/> {med.route}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {med.frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                  {isHighAlert && !isAdministered && (
                    <div className="w-full sm:w-auto">
                      <input 
                        type="text" 
                        placeholder="ID Perawat Saksi (Double Check)"
                        className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:border-red-500 outline-none"
                        value={witnesses[med.id] || ''}
                        onChange={(e) => setWitness(med.id, e.target.value)}
                      />
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (isHighAlert && !witnesses[med.id] && !isAdministered) {
                        alert("Peringatan: Obat High Alert wajib didampingi saksi (Double-Check) sesuai standar JCI MMU.6.");
                        return;
                      }
                      toggleAdmin(med.id);
                    }}
                    className={`
                      w-full sm:w-auto px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3
                      ${isAdministered 
                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                        : 'bg-[var(--surface-container-high)] text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-white border border-[var(--outline-variant)] shadow-sm'}
                    `}
                  >
                    {isAdministered ? <><CheckCircle2 size={16}/> Terberikan</> : <><UserCheck size={16}/> Berikan Obat</>}
                  </button>
                </div>
              </div>

              {isAdministered && (
                <div className="mt-4 pt-4 border-t border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Dokumentasi:</span>
                    <span className="text-[10px] font-bold opacity-60 italic">Diberikan oleh Nurse Sarah pada {new Date(adminLogs[med.id].timestamp).toLocaleTimeString()}</span>
                  </div>
                  {isHighAlert && witnesses[med.id] && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <ShieldCheck size={14} />
                      <span className="text-[9px] font-black uppercase">Verified by {witnesses[med.id]}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SUMMARY */}
      <div className="p-8 bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-[3rem] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest opacity-40">Progress Pemberian</span>
          <span className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">
            {Object.keys(adminLogs).length} dari {prescribedMeds.length} Obat
          </span>
        </div>
        <div className="w-full h-3 bg-[var(--surface-container-high)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 shadow-lg"
            style={{ width: `${(Object.keys(adminLogs).length / prescribedMeds.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
