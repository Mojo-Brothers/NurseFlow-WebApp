import React, { useState, useMemo } from 'react';
import { 
  X, Search, User, ShieldCheck, Stethoscope, Activity, Heart, Eye, 
  ChevronRight, ArrowRight, Sparkles, AlertCircle, PhoneCall, Printer, 
  CheckCircle2, Building2, Calendar, FileBadge, Scale, Award
} from 'lucide-react';
import { DEMO_PATIENTS, DEMO_ENCOUNTERS } from '../../../core/demoData.js';

export default function SearchModalVariantSplit({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | UGD | BPJS | RI
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const mockData = useMemo(() => {
    return DEMO_ENCOUNTERS.map((enc, idx) => {
      const pat = DEMO_PATIENTS.find(p => p.id === enc.patient_id) || DEMO_PATIENTS[idx % DEMO_PATIENTS.length];
      return {
        id: enc.id,
        patientId: pat.id,
        mrn: pat.mrn,
        name: pat.name,
        gender: pat.gender === 'M' ? 'Laki-laki' : 'Perempuan',
        age: pat.age,
        dob: pat.dob || '1995-04-12',
        department: enc.department,
        doctor: enc.doctor_name,
        doctorEmail: enc.doctor_email || 'dpjp@hospital.com',
        guarantor: enc.guarantor || (pat.insurance?.type || 'BPJS KESEHATAN').toUpperCase(),
        admittedAt: '2026-08-06 08:30 WIB',
        triageLevel: enc.triage_level || (idx % 6 === 0 ? 'RED' : idx % 3 === 0 ? 'YELLOW' : 'GREEN'),
        nik: pat.nik || '327301' + String(100000 + idx),
        cardNo: pat.insurance?.no || '00019200' + String(100 + idx),
        vitals: enc.vitals || { bp: '120/80', hr: 78, temp: 36.6, spo2: 98 },
        allergy: idx % 3 === 0 ? 'Alergi Penisilin & Sulfa' : 'Tidak Ada Riwayat Alergi',
        queueNo: 'A-' + String(idx + 1).padStart(3, '0')
      };
    });
  }, []);

  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      if (activeFilter === 'UGD' && !item.department.toLowerCase().includes('ugd')) return false;
      if (activeFilter === 'BPJS' && !item.guarantor.includes('BPJS')) return false;
      if (activeFilter === 'RI' && !item.department.toLowerCase().includes('ruang')) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || 
             item.mrn.toLowerCase().includes(q) || 
             item.nik.includes(q);
    });
  }, [mockData, activeFilter, searchQuery]);

  const activePatient = mockData.find(d => d.id === selectedPatientId) || filteredData[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl max-h-[92vh] bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/40 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ─── MODAL HEADER ─── */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-2xl border border-purple-500/40 text-purple-300">
              <FileBadge size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-purple-500/30 text-purple-200 rounded-full border border-purple-500/40">
                  DUAL-PANE INSPECTOR VARIAN 2
                </span>
                <span className="text-xs text-slate-400 font-mono">COMMAND CENTER SPLIT VIEW</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                Pencarian Pasien & Live Deep Passport Inspector
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-rose-500 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ─── DUAL PANE BODY ─── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: LIST & SEARCH (7 COLS) */}
          <div className="lg:col-span-7 border-r border-slate-800 flex flex-col bg-slate-900/60 overflow-hidden">
            
            {/* Search Header */}
            <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950/40">
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik Nama Pasien, No. RM, NIK atau No. BPJS..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-purple-500/40 focus:border-purple-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all font-medium"
                />
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-2">
                {[
                  { id: 'ALL', label: 'Semua Pasien' },
                  { id: 'UGD', label: 'UGD Cito' },
                  { id: 'BPJS', label: 'BPJS Only' },
                  { id: 'RI', label: 'Rawat Inap' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeFilter === f.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Patient List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredData.map((item) => {
                const isSelected = item.id === activePatient?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPatientId(item.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-950/60 border-purple-500/80 shadow-lg shadow-purple-950/50 scale-[1.01]'
                        : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-inner ${
                        item.gender === 'Laki-laki' 
                          ? 'bg-gradient-to-br from-indigo-500/30 to-purple-600/20 text-indigo-300 border border-indigo-500/40' 
                          : 'bg-gradient-to-br from-pink-500/30 to-purple-600/20 text-pink-300 border border-pink-500/40'
                      }`}>
                        {item.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm hover:text-purple-300">
                            {item.name}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-purple-300 rounded-md border border-purple-500/30">
                            RM: {item.mrn}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                          <span>{item.gender} ({item.age} thn)</span>
                          <span>•</span>
                          <span className="text-slate-300 font-medium">{item.department}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-950 border border-purple-500/40 text-purple-300">
                        {item.guarantor}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Antrean: <strong className="text-white">{item.queueNo}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: DEEP PASSPORT INSPECTOR (5 COLS) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/40 p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            {activePatient ? (
              <div className="space-y-5">
                
                {/* Passport Card Header */}
                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
                      <Award size={14} /> PASSPORT MEDIS PASIEN
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      STATUS ACTIVE
                    </span>
                  </div>

                  <div className="flex items-start gap-4 pt-1">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-purple-500/30 border border-white/20">
                      {activePatient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-white leading-tight">
                        {activePatient.name}
                      </h3>
                      <div className="text-xs text-purple-300 font-mono mt-0.5">
                        NO. RM: {activePatient.mrn}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {activePatient.gender} • {activePatient.age} Tahun (Tgl Lahir: {activePatient.dob})
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">NIK KTP:</span>
                      <span className="font-mono text-slate-200 font-bold">{activePatient.nik}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">No. Kartu BPJS:</span>
                      <span className="font-mono text-purple-300 font-bold">{activePatient.cardNo}</span>
                    </div>
                  </div>
                </div>

                {/* Vitals & Triage Summary */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity size={16} className="text-purple-400" />
                    <span>Observasi Tanda Vital Terakhir</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="text-[9px] uppercase font-bold text-slate-500">TD (mmHg)</div>
                      <div className="text-xs font-black text-white mt-0.5">{activePatient.vitals.bp}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="text-[9px] uppercase font-bold text-slate-500">Nadi (bpm)</div>
                      <div className="text-xs font-black text-emerald-400 mt-0.5">{activePatient.vitals.hr}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="text-[9px] uppercase font-bold text-slate-500">Suhu (°C)</div>
                      <div className="text-xs font-black text-amber-400 mt-0.5">{activePatient.vitals.temp}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <div className="text-[9px] uppercase font-bold text-slate-500">SpO2 (%)</div>
                      <div className="text-xs font-black text-cyan-400 mt-0.5">{activePatient.vitals.spo2}%</div>
                    </div>
                  </div>
                </div>

                {/* Allergy & Safety Alert */}
                <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-3.5 flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-black uppercase text-rose-300 tracking-wider">
                      Flag Keselamatan & Riwayat Alergi:
                    </div>
                    <div className="text-xs font-bold text-rose-100 mt-0.5">
                      {activePatient.allergy}
                    </div>
                  </div>
                </div>

                {/* DPJP Physician */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">DPJP Penanggung Jawab</div>
                      <div className="text-xs font-black text-white">{activePatient.doctor}</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}

            {/* Bottom Actions */}
            {activePatient && (
              <div className="pt-4 border-t border-slate-800 flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    if (onSelect) onSelect(activePatient);
                    onClose();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <span>Buka Layanan Pasien Ini</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
