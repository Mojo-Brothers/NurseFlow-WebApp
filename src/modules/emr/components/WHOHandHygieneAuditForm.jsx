import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Droplets, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, UserCheck, Eye, CheckSquare, Square
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function WHOHandHygieneAuditForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // Data Observasi Tenaga Medis (Audit PPI)
  const [observedRole, setObservedRole] = useState('NURSE'); // 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'ALLIED_HEALTH'
  const [departmentUnit, setDepartmentUnit] = useState('Ruang Rawat Inap & ICU');
  const [handHygieneMethod, setHandHygieneMethod] = useState('ALCOHOL_RUB'); // 'ALCOHOL_RUB' | 'SOAP_WATER' | 'MISSED'

  // WHO 5 Moments for Hand Hygiene Compliance Checklist
  const [momentsCompliance, setMomentsCompliance] = useState({
    moment1_beforePatient: true,      // 1. Sebelum Menyentuh Pasien
    moment2_beforeAseptic: true,      // 2. Sebelum Melakukan Prosedur Bersih / Aseptik
    moment3_afterBodyFluid: true,     // 3. Setelah Terkena Cairan Tubuh Pasien
    moment4_afterPatient: true,       // 4. Setelah Menyentuh Pasien
    moment5_afterSurroundings: true   // 5. Setelah Menyentuh Lingkungan Sekitar Pasien
  });

  const [auditorNotes, setAuditorNotes] = useState(
    'Tenaga medis melakukan hand hygiene menggunakan handrub 6 langkah WHO secara runtut dan sempurna sebelum dan sesudah tindakan infus.'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Kalkulasi Skor Kepatuhan 5 Momen (%)
  const compliancePercentage = useMemo(() => {
    const totalMoments = Object.keys(momentsCompliance).length;
    const performedMoments = Object.values(momentsCompliance).filter(Boolean).length;
    return Math.round((performedMoments / totalMoments) * 100);
  }, [momentsCompliance]);

  const toggleMoment = (key) => {
    setMomentsCompliance(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'AUDITOR_PPI_IPC',
        moduleName: 'AUDIT KEPATUHAN KEBERSIHAN TANGAN (5 MOMEN WHO-PPI)',
        data: {
          observedRole,
          departmentUnit,
          handHygieneMethod,
          momentsCompliance,
          compliancePercentage,
          auditorNotes,
          auditedAt: new Date().toISOString(),
          auditedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Audit Kepatuhan Hand Hygiene WHO [Kepatuhan: ${compliancePercentage}%] Berhasil Disimpan ke Log Komite PPI Rumah Sakit.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan audit PPI: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-black tracking-widest uppercase border border-cyan-200 dark:border-cyan-500/30 flex items-center gap-1">
                <Droplets size={12} /> Standard WHO IPC & JCI PCI.9
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-black tracking-widest uppercase border border-sky-200 dark:border-sky-500/30">
                Audit Kepatuhan 5 Momen Cuci Tangan (Komite PPI)
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              FORMULIR AUDIT KEBERSIHAN TANGAN (WHO 5 MOMENTS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Unit Terpantau</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{departmentUnit}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 shadow-sm">
            <Droplets size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Compliance Result Banner */}
        <div className="p-6 rounded-[2rem] border-2 border-cyan-500 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
              <span className="text-2xl font-black">{compliancePercentage}%</span>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Audit Kepatuhan Kebersihan Tangan</span>
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {compliancePercentage === 100 ? 'KEPATUHAN SEMPURNA (100% COMPLIANT)' : compliancePercentage >= 80 ? 'KEPATUHAN BAIK (≥ 80% TARGET JCI)' : 'PERLU RE-EDUKASI PPI (< 80%)'}
              </h4>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Target kepatuhan nasional Kemenkes RI & JCI PCI.9 adalah minimal 85% kepatuhan pada seluruh 5 momen.
              </p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-xl border text-xs font-black tracking-wider uppercase text-center ${compliancePercentage >= 80 ? 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30' : 'bg-rose-500/10 text-rose-700 border-rose-500/30'}`}>
            STATUS: {compliancePercentage >= 80 ? 'PASSED IPC BENCHMARK' : 'BELOW BENCHMARK'}
          </div>
        </div>

        {/* 1. Target Tenaga Medis & Metode */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserCheck size={16} className="text-cyan-500" /> 1. Sasaran Observasi & Metode Cuci Tangan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Profesi Tenaga Medis</span>
              <select 
                value={observedRole} 
                onChange={e => setObservedRole(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="NURSE">Perawat (Nurse)</option>
                <option value="DOCTOR">Dokter (DPJP / Residen)</option>
                <option value="PHARMACIST">Apoteker / Farmasis</option>
                <option value="ALLIED_HEALTH">Nakes Lainnya (Analis/Radiografer)</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit / Ruangan Pelayanan</span>
              <input 
                type="text" 
                value={departmentUnit} 
                onChange={e => setDepartmentUnit(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Metode yang Digunakan</span>
              <select 
                value={handHygieneMethod} 
                onChange={e => setHandHygieneMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="ALCOHOL_RUB">Handrub Berbasis Alkohol (20-30 detik)</option>
                <option value="SOAP_WATER">Cuci Tangan Air Mengalir + Sabun (40-60 detik)</option>
                <option value="MISSED">Terlewat / Tidak Melakukan Cuci Tangan</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Formulir Observasi 5 Momen WHO */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Eye size={16} className="text-sky-500" /> 2. Checklist Observasi WHO 5 Moments for Hand Hygiene
          </h4>

          <div className="space-y-2.5">
            {[
              { key: 'moment1_beforePatient', num: '1', title: 'Sebelum Menyentuh Pasien', desc: 'Mencegah transmisi kuman dari tangan nakes ke tubuh pasien sebelum kontak langsung.' },
              { key: 'moment2_beforeAseptic', num: '2', title: 'Sebelum Melakukan Tindakan Bersih / Aseptik', desc: 'Mencegah masuknya mikroorganisme patogen ke area steril pasien (injeksi, pasang infus, kateter, rawat luka).' },
              { key: 'moment3_afterBodyFluid', num: '3', title: 'Setelah Terpapar Cairan Tubuh Pasien', desc: 'Melindungi nakes dan lingkungan RS dari kontaminasi cairan darah, urin, sekret, atau pus.' },
              { key: 'moment4_afterPatient', num: '4', title: 'Setelah Menyentuh Pasien', desc: 'Melindungi diri sendiri dan pasien berikutnya setelah kontak dengan kulit/tubuh pasien.' },
              { key: 'moment5_afterSurroundings', num: '5', title: 'Setelah Menyentuh Lingkungan Sekitar Pasien', desc: 'Melindungi nakes dari mikroba pada furnitur, bed rails, sprei, atau monitor di sekitar tempat tidur pasien.' }
            ].map(m => (
              <div 
                key={m.key}
                onClick={() => toggleMoment(m.key)}
                className="flex items-start gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-cyan-600">
                  {momentsCompliance[m.key] ? <CheckSquare size={20} /> : <Square size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 text-[10px] font-black">
                      MOMEN {m.num}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-cyan-600" /> 3. Catatan Auditor Komite PPI / IPC Link Nurse
          </h4>
          <textarea 
            rows="2"
            value={auditorNotes}
            onChange={e => setAuditorNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Auditor PPI / IPC Observer: <strong>{currentUser?.displayName || currentUser?.email || 'AUDITOR PPI'}</strong></span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Batal
              </button>
              <button 
                type="button" 
                disabled={isSaving}
                onClick={handleSave}
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Simpan Audit Hand Hygiene (WHO IPC)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
