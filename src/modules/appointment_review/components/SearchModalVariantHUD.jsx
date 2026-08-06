import React, { useState, useMemo } from 'react';
import { 
  X, Search, RotateCcw, Fingerprint, Calendar, Building2, User, ChevronRight, 
  ShieldCheck, Stethoscope, Activity, Zap, CheckCircle2, AlertTriangle, 
  FileText, Sparkles, Filter, SlidersHorizontal, ArrowUpRight, Cpu, Layers
} from 'lucide-react';
import { DEMO_PATIENTS, DEMO_ENCOUNTERS } from '../../../core/demoData.js';

export default function SearchModalVariantHUD({ isOpen, onClose, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [careTab, setCareTab] = useState('ALL'); // ALL | RJ | RI | UGD | BPJS
  const [selectedDept, setSelectedDept] = useState('');
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
        admittedAt: '2026-08-06 08:' + String(10 + idx).padStart(2, '0'),
        triageLevel: enc.triage_level || (idx % 8 === 0 ? 'RED' : idx % 3 === 0 ? 'YELLOW' : 'GREEN'),
        status: enc.status || 'PROSES',
        nik: pat.nik || '327301' + String(100000 + idx),
        cardNo: pat.insurance?.no || '00019200' + String(100 + idx),
        vitals: enc.vitals
      };
    });
  }, []);

  const filteredData = useMemo(() => {
    return mockData.filter(item => {
      if (careTab === 'RJ' && !item.department.toLowerCase().includes('poli')) return false;
      if (careTab === 'RI' && !item.department.toLowerCase().includes('ruang')) return false;
      if (careTab === 'UGD' && !item.department.toLowerCase().includes('ugd')) return false;
      if (careTab === 'BPJS' && !item.guarantor.includes('BPJS')) return false;
      if (selectedDept && item.department !== selectedDept) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || 
             item.mrn.toLowerCase().includes(q) || 
             item.id.toLowerCase().includes(q) ||
             item.nik.includes(q);
    });
  }, [mockData, careTab, selectedDept, searchQuery]);

  const activeSelected = mockData.find(d => d.id === selectedPatientId) || filteredData[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl max-h-[92vh] bg-slate-900 border border-teal-500/30 rounded-3xl shadow-2xl shadow-teal-950/50 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ─── HUD TOP HEADER & METRIC BAR ─── */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950/60 to-slate-900 border-b border-teal-500/20 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-400 shadow-inner">
              <Cpu size={26} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 rounded-full border border-teal-500/40">
                  HUD VARIAN 1
                </span>
                <span className="text-xs text-slate-400 font-mono">COMMAND CENTER HIS 2026</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                Cari Pasien Aktif & Matriks Klinis Terpadu
              </h2>
            </div>
          </div>

          {/* Metric Live Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-center flex-1 md:flex-none min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Pasien</div>
              <div className="text-sm font-black text-white">{filteredData.length} Orang</div>
            </div>
            <div className="bg-emerald-950/50 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-center flex-1 md:flex-none min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Terverifikasi BPJS</div>
              <div className="text-sm font-black text-emerald-300">
                {filteredData.filter(d => d.guarantor.includes('BPJS')).length}
              </div>
            </div>
            <div className="bg-rose-950/50 border border-rose-500/40 px-3.5 py-1.5 rounded-xl text-center flex-1 md:flex-none min-w-[100px]">
              <div className="text-[10px] uppercase font-bold text-rose-400">UGD Red Flags</div>
              <div className="text-sm font-black text-rose-300">
                {filteredData.filter(d => d.triageLevel === 'RED').length} Cito
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-rose-500 cursor-pointer ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─── HUD FILTER TOOLBAR ─── */}
        <div className="bg-slate-900/90 p-4 border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Search Input with Neon Focus */}
            <div className="lg:col-span-6 relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama Pasien, No. RM, No. Registrasi, NIK, Kartu BPJS..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-teal-500/40 focus:border-teal-400 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Department Dropdown Filter */}
            <div className="lg:col-span-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl focus:border-teal-400 focus:outline-none"
              >
                <option value="">Semua Departemen / Poliklinik</option>
                <option value="Poli Penyakit Dalam (Lantai 2)">Poli Penyakit Dalam</option>
                <option value="Poli Bedah Umum & Digestif (Lantai 2)">Poli Bedah Umum</option>
                <option value="Poli Anak & Tumbuh Kembang (Lantai 3)">Poli Anak</option>
                <option value="UGD & Unit Gawat Darurat (Zona Merah)">UGD Emergency</option>
                <option value="Ruang Perawatan Chrysant (Kamar 302)">Rawat Inap Chrysant</option>
              </select>
            </div>

            {/* Scope Filter Chips */}
            <div className="lg:col-span-3 flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'RJ', label: 'Rawat Jalan' },
                { id: 'RI', label: 'Rawat Inap' },
                { id: 'UGD', label: 'UGD' },
                { id: 'BPJS', label: 'BPJS' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCareTab(tab.id)}
                  className={`flex-1 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                    careTab === tab.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ─── DATA MATRIX GRID CONTENT ─── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              Tidak ada data pasien yang cocok dengan pencarian HUD matrix.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/60 sticky top-0 backdrop-blur-md">
                    <th className="p-3">Identitas Pasien</th>
                    <th className="p-3">No. RM & RegID</th>
                    <th className="p-3">Triage & Tanda Vital</th>
                    <th className="p-3">Poliklinik & DPJP</th>
                    <th className="p-3">Penjamin & Kartu</th>
                    <th className="p-3 text-right">Aksi Quick HUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredData.map((item) => {
                    const isSelected = item.id === activeSelected?.id;
                    return (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedPatientId(item.id)}
                        className={`transition-all hover:bg-teal-950/30 cursor-pointer ${
                          isSelected ? 'bg-teal-950/50 border-l-4 border-teal-400' : ''
                        }`}
                      >
                        {/* Pasien */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                              item.gender === 'Laki-laki' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            }`}>
                              {item.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-white text-sm hover:text-teal-300 transition-colors">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{item.gender} • {item.age} thn</span>
                                <span className="font-mono text-[10px] text-slate-500">NIK: {item.nik}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* RM & RegID */}
                        <td className="p-3 font-mono">
                          <div className="font-bold text-teal-300 text-xs">{item.mrn}</div>
                          <div className="text-[10px] text-slate-400">{item.id}</div>
                        </td>

                        {/* Triage & Vitals */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded ${
                              item.triageLevel === 'RED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' :
                              item.triageLevel === 'YELLOW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {item.triageLevel === 'RED' ? 'CITO RED' : item.triageLevel === 'YELLOW' ? 'URGENT' : 'GREEN OPD'}
                            </span>
                            {item.vitals && (
                              <span className="text-[11px] text-slate-300 font-mono">
                                TD: {item.vitals.bp} | HR: {item.vitals.hr}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Dept & DPJP */}
                        <td className="p-3">
                          <div className="font-semibold text-slate-200">{item.department}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Stethoscope size={12} className="text-teal-400" />
                            {item.doctor}
                          </div>
                        </td>

                        {/* Penjamin */}
                        <td className="p-3">
                          <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-teal-950 border border-teal-500/40 text-teal-300 inline-block">
                            {item.guarantor}
                          </span>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            No. Card: {item.cardNo}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-3 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelect) onSelect(item);
                            }}
                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-lg text-xs transition-all hover:scale-105 cursor-pointer shadow-lg shadow-teal-500/20 inline-flex items-center gap-1"
                          >
                            <span>Pilih Pasien</span>
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── BOTTOM INSPECTOR PREVIEW FOOTER ─── */}
        {activeSelected && (
          <div className="bg-slate-950 border-t border-teal-500/30 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/30 text-teal-300">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Pasien Aktif Terpilih:</div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{activeSelected.name}</span>
                  <span className="text-teal-400 font-mono">({activeSelected.mrn})</span>
                  <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">
                    {activeSelected.department}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer border border-slate-700"
              >
                Tutup Window
              </button>
              <button 
                onClick={() => {
                  if (onSelect) onSelect(activeSelected);
                  onClose();
                }}
                className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-teal-500/30 flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Buka Layanan Pasien Ini</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
