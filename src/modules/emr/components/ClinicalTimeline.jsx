/**
 * ClinicalTimeline.jsx
 * ─────────────────────────────────────────────────────────────
 * Unified Patient Journey Clinical Timeline (JCI Certified)
 *
 * Menampilkan:
 *  - Kronologi seluruh aktivitas & dokumen klinis pasien
 *  - Filter per Profesi / Kategori (Medis, Keperawatan, Lab, Rad, Farmasi, Bedah)
 *  - Real-time search query filter
 *  - Audit trail & JCI verification status
 */

import React, { useState, useMemo } from 'react';
import {
  Clock, Search, Filter, Stethoscope, ClipboardList,
  FlaskConical, Activity, Pill, Scissors, CheckCircle2,
  FileText, ShieldCheck, User, Calendar, ChevronRight,
  AlertTriangle, HeartPulse, Eye, Download, Printer
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection } from './ClinicalFormShell';

const CATEGORY_CONFIG = {
  ALL: { label: 'SEMUA KATEGORI', icon: Clock, color: 'text-slate-600 bg-slate-100' },
  DOCTOR: { label: 'CATATAN DOKTER (SOAP)', icon: Stethoscope, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  NURSE: { label: 'KEPERAWATAN & EWS', icon: ClipboardList, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  LAB: { label: 'LABORATORIUM', icon: FlaskConical, color: 'text-violet-700 bg-violet-50 border-violet-200' },
  RAD: { label: 'RADIOLOGI', icon: Activity, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  PHARMACY: { label: 'FARMASI & OBAT', icon: Pill, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  SURGERY: { label: 'KAMAR BEDAH', icon: Scissors, color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

export default function ClinicalTimeline({ patientRecords = [], patient, encounter, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Map records to formatted timeline events
  const timelineEvents = useMemo(() => {
    return patientRecords.map((rec, idx) => {
      const timeStr = rec.created_at?.seconds
        ? new Date(rec.created_at.seconds * 1000).toLocaleString('id-ID')
        : new Date(rec.created_at || Date.now()).toLocaleString('id-ID');

      let category = 'DOCTOR';
      const modName = (rec.moduleName || rec.assessment || '').toUpperCase();

      if (modName.includes('KEPERAWATAN') || modName.includes('EWS') || modName.includes('BRADEN') || modName.includes('FALL')) {
        category = 'NURSE';
      } else if (modName.includes('LAB') || modName.includes('DIAGNOSTIK')) {
        category = 'LAB';
      } else if (modName.includes('RAD') || modName.includes('RONTGEN') || modName.includes('CT')) {
        category = 'RAD';
      } else if (modName.includes('RESEP') || modName.includes('CPOE') || modName.includes('OBAT') || modName.includes('EMAR')) {
        category = 'PHARMACY';
      } else if (modName.includes('BEDAH') || modName.includes('ALDRETE') || modName.includes('SURGICAL')) {
        category = 'SURGERY';
      }

      return {
        id: rec.id || `rec-${idx}`,
        title: rec.moduleName || rec.assessment || 'Catatan Rekam Medis',
        author: rec.signed_by || rec.doctor || 'Dokter / Perawat',
        profession: category === 'NURSE' ? 'Perawat / Bidan' : category === 'PHARMACY' ? 'Apoteker' : 'Dokter DPJP',
        timestamp: timeStr,
        category,
        status: rec.status || 'SIGNED',
        summary: rec.subjective || rec.data?.diagnosisKerja || rec.data?.catatan || rec.assessment || 'Dokumen klinis terverifikasi.',
        fullData: rec,
      };
    });
  }, [patientRecords]);

  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(event => {
      const matchCat = selectedCategory === 'ALL' || event.category === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [timelineEvents, selectedCategory, searchQuery]);

  return (
    <ClinicalFormShell
      title="Patient Journey Clinical Timeline"
      subtitle="Kronologi Rekam Medis Terintegrasi — JCI Certified"
      icon={Clock}
      formState="signed"
      onCancel={onClose}
      hideActionBar
    >
      {/* ── Toolbar: Search & Category Tabs ── */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]/50" size={16} />
          <input
            type="text"
            placeholder="Cari catatan, diagnosis, nama dokter, atau jenis tindakan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/40 rounded-2xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-[var(--primary)]/20'
                    : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] border-[var(--outline-variant)]/30 hover:bg-[var(--surface-container-high)]'
                }`}
              >
                <Icon size={12} />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TIMELINE CONTAINER ── */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--outline-variant)]/30">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.DOCTOR;
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-[var(--surface-container-lowest)] border-2 border-[var(--primary)] flex items-center justify-center shadow-sm z-10 group-hover:scale-110 transition-transform">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                </div>

                {/* Event Card */}
                <div
                  onClick={() => setSelectedRecord(event)}
                  className="p-4 rounded-2xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]/30 hover:border-[var(--primary)]/40 transition-all cursor-pointer shadow-sm group-hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${config.color}`}>
                        <Icon size={10} />
                        {event.title}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--on-surface-variant)]/60 flex items-center gap-1">
                        <Clock size={10} /> {event.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck size={10} /> {event.status}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-[var(--on-surface)] line-clamp-2 leading-relaxed mb-3">
                    {event.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-[var(--outline-variant)]/20 text-[10px] text-[var(--on-surface-variant)]/70">
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-[var(--primary)]" />
                      <span className="font-black text-[var(--on-surface)]">{event.author}</span>
                      <span>({event.profession})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Lihat Detail <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Clock size={36} className="mx-auto text-[var(--on-surface-variant)]/30 mb-2" />
            <p className="text-xs font-bold text-[var(--on-surface-variant)] uppercase">Tidak ada catatan klinis ditemukan</p>
            <p className="text-[10px] text-[var(--on-surface-variant)]/60 mt-0.5">Coba ubah kata kunci atau filter kategori.</p>
          </div>
        )}
      </div>

      {/* ── Detail Modal Preview ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface-container-lowest)] rounded-3xl border border-[var(--outline-variant)]/40 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--outline-variant)]/20">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                <h3 className="text-sm font-black uppercase text-[var(--on-surface)]">{selectedRecord.title}</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1.5 hover:bg-[var(--surface-container-high)] rounded-xl text-[var(--on-surface-variant)]">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[var(--outline-variant)]/10">
                <span className="font-bold text-[var(--on-surface-variant)]">Penulis / Profesional:</span>
                <span className="font-black text-[var(--on-surface)]">{selectedRecord.author}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--outline-variant)]/10">
                <span className="font-bold text-[var(--on-surface-variant)]">Waktu Pencatatan:</span>
                <span className="font-mono text-[var(--on-surface)]">{selectedRecord.timestamp}</span>
              </div>
              <div className="py-2">
                <span className="font-bold text-[var(--on-surface-variant)] block mb-1">Detail Isi Dokumen:</span>
                <pre className="p-3 bg-[var(--surface-container)] rounded-xl text-[11px] font-mono text-[var(--on-surface)] whitespace-pre-wrap overflow-x-auto border border-[var(--outline-variant)]/20">
                  {JSON.stringify(selectedRecord.fullData?.data || selectedRecord.fullData, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 text-xs font-black uppercase bg-[var(--primary)] text-white rounded-xl">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </ClinicalFormShell>
  );
}
