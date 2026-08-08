/**
 * DPJPAssignmentForm.jsx
 * ─────────────────────────────────────────────────────────────
 * DPJP sebagai ENTITAS KLINIS — bukan hanya teks "dr. X"
 * Standar: JCI COP.2, PMK 269/2008, SNARS Ed.2
 *
 * Menampilkan:
 *  - DPJP aktif saat ini (current assignment)
 *  - Form penunjukan / pergantian DPJP
 *  - Riwayat DPJP (DPJP History)
 *  - Tim DPJP (Utama / Pengganti / Tambahan / Konsulen)
 */

import React, { useState, useCallback } from 'react';
import {
  UserCheck, Plus, Clock, CheckCircle2, AlertCircle,
  Stethoscope, Building2, Calendar, ChevronDown, ChevronUp,
  History, User, Edit2, X, Save, Award
} from 'lucide-react';
import ClinicalFormShell, { ClinicalSection, ClinicalSubSection, ClinicalFieldRow } from './ClinicalFormShell';
import toast from 'react-hot-toast';

// ─── Role Colors ─────────────────────────────────────────────
const DPJP_ROLE_CONFIG = {
  'DPJP_UTAMA':    { label: 'DPJP UTAMA',    color: 'bg-teal-500/10 text-teal-700 border-teal-500/25' },
  'DPJP_PENGGANTI':{ label: 'DPJP PENGGANTI',color: 'bg-blue-500/10 text-blue-700 border-blue-500/25' },
  'DPJP_TAMBAHAN': { label: 'DPJP TAMBAHAN', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25' },
  'KONSULEN':      { label: 'DOKTER KONSULEN',color: 'bg-violet-500/10 text-violet-700 border-violet-500/25' },
};

// ─── Status Config ────────────────────────────────────────────
const DPJP_SPECIALTIES = [
  'Spesialis Penyakit Dalam (Sp.PD)',
  'Spesialis Bedah (Sp.B)',
  'Spesialis Anak (Sp.A)',
  'Spesialis Kebidanan & Kandungan (Sp.OG)',
  'Spesialis Jantung & Pembuluh Darah (Sp.JP)',
  'Spesialis Saraf (Sp.N)',
  'Spesialis Anestesiologi (Sp.An)',
  'Spesialis Radiologi (Sp.Rad)',
  'Spesialis Patologi Klinik (Sp.PK)',
  'Spesialis Ortopedi & Traumatologi (Sp.OT)',
  'Spesialis Paru (Sp.P)',
  'Spesialis Kulit & Kelamin (Sp.KK)',
  'Spesialis Mata (Sp.M)',
  'Spesialis THT-KL (Sp.THT-KL)',
  'Spesialis Urologi (Sp.U)',
  'Spesialis Onkologi',
  'Spesialis Gizi Klinik (Sp.GK)',
  'Spesialis Kedokteran Fisik & Rehabilitasi (Sp.KFR)',
  'Spesialis Psikiatri (Sp.KJ)',
  'Dokter Umum',
];

// ─── DPJP History Item ────────────────────────────────────────
function DPJPHistoryItem({ item, isActive }) {
  const roleConfig = DPJP_ROLE_CONFIG[item.role] || { label: item.role, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${isActive ? 'bg-teal-500/5 border-teal-500/25' : 'bg-[var(--surface-container)] border-[var(--outline-variant)]/20'}`}>
      {/* Timeline dot */}
      <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
        <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-teal-500 border-teal-500' : 'bg-[var(--surface-container-high)] border-[var(--outline-variant)]'}`} />
        {!isActive && <div className="w-0.5 h-8 bg-[var(--outline-variant)]/30" />}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-[var(--on-surface)] truncate">{item.doctorName}</span>
              {isActive && <span className="text-[9px] font-black uppercase tracking-widest bg-teal-500 text-white px-2 py-0.5 rounded-full">AKTIF</span>}
            </div>
            <div className="text-[10px] font-bold text-[var(--on-surface-variant)]/70 mt-0.5">{item.specialty}</div>
          </div>
          <div className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0 ${roleConfig.color}`}>
            {roleConfig.label}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/70">
            <Calendar size={10} />
            <span>Mulai: {item.startDate}</span>
          </div>
          {item.endDate && (
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/70">
              <Clock size={10} />
              <span>Selesai: {item.endDate}</span>
            </div>
          )}
          {item.department && (
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/70">
              <Building2 size={10} />
              <span>{item.department}</span>
            </div>
          )}
          {item.assignedBy && (
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/70">
              <User size={10} />
              <span>Oleh: {item.assignedBy}</span>
            </div>
          )}
        </div>
        {item.reason && (
          <div className="mt-2 text-[10px] font-medium text-[var(--on-surface-variant)]/80 bg-[var(--surface-container-high)] px-3 py-1.5 rounded-xl">
            <span className="font-black uppercase tracking-widest text-[var(--primary)]">Alasan: </span>
            {item.reason}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Assignment Form ──────────────────────────────────────
function NewAssignmentForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    doctorName: '',
    practitionerId: '',
    specialty: '',
    subspecialty: '',
    department: '',
    role: 'DPJP_UTAMA',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    reason: '',
    replacingDpjp: '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const fieldClass = "w-full px-3 py-2 text-sm font-semibold bg-[var(--surface-container)] border border-[var(--outline-variant)]/50 rounded-xl text-[var(--on-surface)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all placeholder:text-[var(--on-surface-variant)]/40";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] mb-1.5";

  return (
    <div className="bg-[var(--surface-container)] rounded-2xl border border-[var(--primary)]/20 p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
          <UserCheck size={14} className="text-[var(--primary)]" />
        </div>
        <h4 className="text-[11px] font-black uppercase tracking-widest text-[var(--on-surface)]">Form Penunjukan DPJP Baru</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nama Dokter <span className="text-red-500">*</span></label>
          <input type="text" placeholder="dr. Nama Dokter, Sp.XX" value={form.doctorName} onChange={set('doctorName')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>ID Dokter / NIK Dokter</label>
          <input type="text" placeholder="EMP-0001 / 123456789" value={form.practitionerId} onChange={set('practitionerId')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Spesialisasi <span className="text-red-500">*</span></label>
          <select value={form.specialty} onChange={set('specialty')} className={fieldClass}>
            <option value="">Pilih Spesialisasi...</option>
            {DPJP_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Subspesialisasi</label>
          <input type="text" placeholder="Konsultan Onkologi, dll." value={form.subspecialty} onChange={set('subspecialty')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Departemen / Unit</label>
          <input type="text" placeholder="Poli Penyakit Dalam, ICU, dll." value={form.department} onChange={set('department')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Peran DPJP <span className="text-red-500">*</span></label>
          <select value={form.role} onChange={set('role')} className={fieldClass}>
            {Object.entries(DPJP_ROLE_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tanggal Mulai <span className="text-red-500">*</span></label>
          <input type="date" value={form.startDate} onChange={set('startDate')} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass}>Jam Mulai</label>
          <input type="time" value={form.startTime} onChange={set('startTime')} className={fieldClass} />
        </div>
        {(form.role === 'DPJP_PENGGANTI') && (
          <div className="md:col-span-2">
            <label className={labelClass}>Menggantikan DPJP</label>
            <input type="text" placeholder="Nama DPJP yang digantikan" value={form.replacingDpjp} onChange={set('replacingDpjp')} className={fieldClass} />
          </div>
        )}
        <div className="md:col-span-2">
          <label className={labelClass}>Alasan Penunjukan <span className="text-red-500">*</span></label>
          <textarea rows={2} placeholder="Alasan penunjukan / pergantian DPJP..." value={form.reason} onChange={set('reason')} className={fieldClass} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-[var(--outline-variant)]/20">
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] rounded-xl transition-colors border border-[var(--outline-variant)]/30">
          <X size={13} /> Batal
        </button>
        <button
          onClick={() => {
            if (!form.doctorName || !form.specialty || !form.reason) {
              toast.error('Nama dokter, spesialisasi, dan alasan wajib diisi.');
              return;
            }
            onSubmit({ ...form, id: `dpjp-${Date.now()}`, assignedAt: new Date().toISOString() });
          }}
          className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white bg-[var(--primary)] hover:opacity-90 rounded-xl transition-all shadow-md"
        >
          <Save size={13} /> Simpan Penunjukan
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function DPJPAssignmentForm({ patient, encounter, onClose }) {
  const [dpjpList, setDpjpList] = useState([
    // Demo data — akan diganti dari Firestore
    {
      id: 'dpjp-demo-1',
      doctorName: encounter?.doctor_name || encounter?.doctor || 'dr. Demo, Sp.PD',
      practitionerId: 'EMP-001',
      specialty: 'Spesialis Penyakit Dalam (Sp.PD)',
      subspecialty: 'Konsultan Tropik Infeksi',
      department: encounter?.department || 'Poli Penyakit Dalam',
      role: 'DPJP_UTAMA',
      startDate: new Date().toLocaleDateString('id-ID'),
      endDate: null,
      reason: 'Penunjukan awal rawat jalan',
      assignedBy: 'dr. Adminuser',
      isActive: true,
    }
  ]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const activeDPJPs = dpjpList.filter(d => d.isActive);
  const historyDPJPs = dpjpList.filter(d => !d.isActive);

  const handleAddDpjp = useCallback((newDpjp) => {
    setDpjpList(prev => [...prev, { ...newDpjp, isActive: true }]);
    setShowNewForm(false);
    toast.success(`DPJP ${newDpjp.doctorName} berhasil ditambahkan.`);
  }, []);

  return (
    <ClinicalFormShell
      title="DPJP — Dokter Penanggung Jawab Pelayanan"
      subtitle="JCI COP.2 | SNARS Ed.2"
      icon={UserCheck}
      formState={dpjpList.length > 0 ? 'saved' : 'empty'}
      onCancel={onClose}
      hideActionBar={false}
      onSaveDraft={() => toast.success('Penugasan DPJP disimpan.')}
    >
      {/* Current DPJP Summary */}
      <ClinicalSection title="DPJP Aktif Saat Ini" subtitle="Current Active DPJP" icon={UserCheck}>
        {activeDPJPs.length > 0 ? (
          <div className="space-y-3">
            {activeDPJPs.map((dpjp) => {
              const roleConfig = DPJP_ROLE_CONFIG[dpjp.role] || { label: dpjp.role, color: 'bg-slate-100 text-slate-600 border-slate-200' };
              return (
                <div key={dpjp.id} className="flex items-center gap-4 p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/15 flex items-center justify-center shrink-0">
                    <Stethoscope size={22} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-[var(--on-surface)]">{dpjp.doctorName}</span>
                      <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${roleConfig.color}`}>
                        {roleConfig.label}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-full">AKTIF</span>
                    </div>
                    <div className="text-[11px] font-bold text-[var(--on-surface-variant)]/70 mt-0.5">{dpjp.specialty}</div>
                    {dpjp.subspecialty && <div className="text-[10px] text-[var(--on-surface-variant)]/50 mt-0.5">{dpjp.subspecialty}</div>}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/60">
                        <Building2 size={10} />{dpjp.department}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--on-surface-variant)]/60">
                        <Calendar size={10} />Mulai: {dpjp.startDate}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewForm(true)}
                    className="p-2 hover:bg-[var(--surface-container-high)] rounded-xl text-[var(--on-surface-variant)] transition-colors"
                    title="Ganti / Tambah DPJP"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <AlertCircle size={32} className="text-amber-500 opacity-50" />
            <p className="text-sm font-bold text-[var(--on-surface-variant)]">Belum ada DPJP yang ditunjuk</p>
            <p className="text-[11px] text-[var(--on-surface-variant)]/60">DPJP wajib ditunjuk sebelum finalisasi asesmen rawat inap.</p>
          </div>
        )}

        {/* Add Button */}
        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl transition-colors border-2 border-dashed border-[var(--primary)]/30 hover:border-[var(--primary)]/50"
          >
            <Plus size={14} /> Tambah / Ganti DPJP
          </button>
        )}

        {/* New Assignment Form */}
        {showNewForm && (
          <div className="mt-4">
            <NewAssignmentForm
              onSubmit={handleAddDpjp}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        )}
      </ClinicalSection>

      {/* DPJP History */}
      <ClinicalSection
        title="Riwayat DPJP"
        subtitle="DPJP History — Audit Trail"
        icon={History}
        collapsible
        defaultOpen
      >
        {dpjpList.length > 0 ? (
          <div className="space-y-3">
            {[...dpjpList].reverse().map((item) => (
              <DPJPHistoryItem key={item.id} item={item} isActive={item.isActive} />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--on-surface-variant)]/60 text-center py-4">Belum ada riwayat DPJP.</p>
        )}
      </ClinicalSection>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
        <Award size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-1">Standar JCI COP.2</p>
          <p className="text-[11px] text-[var(--on-surface-variant)]/80 leading-relaxed">
            Setiap pasien rawat inap harus memiliki satu DPJP Utama yang bertanggung jawab atas keseluruhan asuhan.
            Pergantian DPJP harus terdokumentasi dengan alasan yang jelas dan tercatat dalam rekam medis.
          </p>
        </div>
      </div>
    </ClinicalFormShell>
  );
}
