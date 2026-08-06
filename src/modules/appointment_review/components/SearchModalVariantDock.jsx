import React, { useState, useMemo } from 'react';
import { 
  X, Search, Sparkles, Filter, ChevronRight, CheckCircle2, User, 
  Clock, ShieldCheck, ArrowRight, Zap, RefreshCw, Flame, Sliders, Layers
} from 'lucide-react';
import { DEMO_PATIENTS, DEMO_ENCOUNTERS } from '../../../core/demoData.js';

export default function SearchModalVariantDock({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('ALL');
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
        department: enc.department,
        doctor: enc.doctor_name,
        guarantor: enc.guarantor || (pat.insurance?.type || 'BPJS KESEHATAN').toUpperCase(),
        timeAgo: String(5 + idx * 3) + ' menit lalu',
        isCito: idx % 7 === 0,
        isBpjs: (enc.guarantor || '').includes('BPJS') || (pat.insurance?.type || '').toLowerCase().includes('bpjs'),
        nik: pat.nik || '327301' + String(100000 + idx)
      };
    });
  }, []);

  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      if (activeChip === 'CITO' && !item.isCito) return false;
      if (activeChip === 'BPJS' && !item.isBpjs) return false;
      if (activeChip === 'RJ' && !item.department.toLowerCase().includes('poli')) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || 
             item.mrn.toLowerCase().includes(q) || 
             item.nik.includes(q);
    });
  }, [mockData, activeChip, searchQuery]);

  const selectedPatient = mockData.find(d => d.id === selectedPatientId) || filteredData[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-slate-900/90 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ─── TOP DOCK SEARCH HEADER ─── */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/80 border-b border-cyan-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-cyan-500/20 rounded-2xl text-cyan-300 border border-cyan-500/30">
                <Sparkles size={22} className="animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/40">
                    FLOATING DOCK VARIAN 3 ⭐
                  </span>
                  <span className="text-xs text-slate-400 font-mono">NEUMORPHIC TIMELINE DOCK</span>
                </div>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Floating Command Dock Pasien Aktif
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

          {/* Floating Neon Search Input */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cetak Pencarian Cepat AI: Nama, RM, NIK, BPJS..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950/80 border border-cyan-500/40 focus:border-cyan-400 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all font-semibold"
            />
          </div>

          {/* AI Smart Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <Zap size={14} className="text-amber-400" /> Smart Filter:
            </span>
            {[
              { id: 'ALL', label: 'Semua Antrean' },
              { id: 'CITO', label: '⚡ UGD Emergency Cito' },
              { id: 'BPJS', label: '🛡️ Terverifikasi BPJS' },
              { id: 'RJ', label: '🏥 Rawat Jalan Hari Ini' }
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                  activeChip === chip.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── TIMELINE CARDS CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {filteredData.map((item) => {
            const isSelected = item.id === selectedPatient?.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedPatientId(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/60 scale-[1.01]'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                    item.isCito 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' 
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {item.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-base hover:text-cyan-300">
                        {item.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 rounded-md border border-cyan-500/30">
                        RM: {item.mrn}
                      </span>
                      {item.isCito && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500/20 text-rose-300 rounded border border-rose-500/40">
                          CITO RED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                      <span>{item.gender} ({item.age} thn)</span>
                      <span>•</span>
                      <span className="text-slate-300">{item.department}</span>
                      <span>•</span>
                      <span className="text-slate-500">DPJP: {item.doctor}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 inline-block">
                      {item.guarantor}
                    </span>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-cyan-400" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelect) onSelect(item);
                      onClose();
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                  >
                    <span>Pilih</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── FLOATING DOCK FOOTER ─── */}
        {selectedPatient && (
          <div className="p-4 bg-slate-950 border-t border-cyan-500/30 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Terpilih: <strong>{selectedPatient.name}</strong> ({selectedPatient.mrn})</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  if (onSelect) onSelect(selectedPatient);
                  onClose();
                }}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan-500/30 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Buka Rekam Medis</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
