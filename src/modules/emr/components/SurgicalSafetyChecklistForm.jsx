import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Scissors, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Clock, CheckSquare, Square, FileSignature, Stethoscope, UserCheck, Sparkles
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function SurgicalSafetyChecklistForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [activeTab, setActiveTab] = useState('sign-in'); // 'sign-in' | 'time-out' | 'sign-out'

  // Fase 1: Sign In (Sebelum Induksi Anestesi)
  const [signInChecks, setSignInChecks] = useState({
    identityConfirmed: true,
    siteMarked: true,
    consentVerified: true,
    pulseOxPlaced: true,
    allergyKnown: true,
    airwayRiskAssessed: true,
    bloodLossAssessed: true
  });

  // Fase 2: Time Out (Sebelum Insisi Kulit)
  const [timeOutChecks, setTimeOutChecks] = useState({
    teamIntroduced: true,
    confirmPatientProcedureSite: true,
    antibioticProphylaxisGiven: true, // < 60 min
    surgeonAnticipatedSteps: true,
    anesthesiaConcernsReviewed: true,
    nursingSterilityVerified: true,
    imagingDisplayed: true
  });

  // Fase 3: Sign Out (Sebelum Pasien Keluar Kamar Operasi)
  const [signOutChecks, setSignOutChecks] = useState({
    procedureNameRecorded: true,
    instrumentNeedleSpongeCountCorrect: true,
    specimenLabeledCorrectly: isDewi ? true : false,
    equipmentProblemsAddressed: true,
    keyConcernsRecoveryReviewed: true
  });

  const [notes, setNotes] = useState(
    isDewi 
      ? 'Tindakan Cito Laparoscopic Appendectomy berjalan lancar. Perdarahan minimal (< 50 cc). Jaringan appendix dikirim untuk pemeriksaan Patologi Anatomi (PA).'
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleCheck = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'SURGICAL_SAFETY_OFFICER',
        moduleName: 'CHECKLIST KESELAMATAN BEDAH (IPSG.4)',
        data: {
          signInChecks,
          timeOutChecks,
          signOutChecks,
          notes,
          completedAt: new Date().toISOString(),
          verifiedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert('WHO Surgical Safety Checklist (Sign-In, Time-Out, Sign-Out) Berhasil Disimpan & Diverifikasi.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan Surgical Safety Checklist: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-black tracking-widest uppercase border border-teal-200 dark:border-teal-500/30 flex items-center gap-1">
                <Scissors size={12} /> Standard JCI IPSG.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                WHO Surgical Safety Checklist
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              CHECKLIST KESELAMATAN BEDAH & ANESTESI
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Operasi</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Operasi'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 shadow-sm">
            <Scissors size={24} />
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-3 mb-6">
        {[
          { id: 'sign-in', name: '1. SIGN IN (Sebelum Induksi)', desc: 'Nurse & Anesthesiologist' },
          { id: 'time-out', name: '2. TIME OUT (Sebelum Insisi)', desc: 'Seluruh Tim Bedah & Operator' },
          { id: 'sign-out', name: '3. SIGN OUT (Sebelum Penutupan)', desc: 'Nurse, Anesthesiologist, Surgeon' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-4 rounded-2xl border text-left transition-all ${activeTab === tab.id ? 'bg-white dark:bg-[var(--surface-container-low)] border-teal-500 shadow-md ring-2 ring-teal-500/20' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/5 opacity-70 hover:opacity-100'}`}
          >
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">{tab.name}</span>
            <span className="text-[10px] font-medium text-slate-500 block mt-0.5">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Main Checklist Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Sign In View */}
        {activeTab === 'sign-in' && (
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <Clock size={16} /> FASE 1: SIGN IN (Dilakukan Bersama Pasien Sebelum Anestesi Dimulai)
            </h4>
            <div className="space-y-3">
              {[
                { key: 'identityConfirmed', label: 'Pasien telah mengonfirmasi identitas, lokasi operasi, prosedur, dan surat persetujuan (Informed Consent)' },
                { key: 'siteMarked', label: 'Lokasi operasi telah diberi tanda penandaan anatomis yang jelas (Site Marking)' },
                { key: 'pulseOxPlaced', label: 'Mesin anestesi dan pulse oximeter terpasang serta berfungsi dengan baik' },
                { key: 'allergyKnown', label: 'Riwayat alergi telah dikonfirmasi (Khususnya antibiotik/latex/obat anestesi)' },
                { key: 'airwayRiskAssessed', label: 'Risiko jalan napas sulit / aspirasi telah dievaluasi dan peralatan cadangan siap' },
                { key: 'bloodLossAssessed', label: 'Risiko kehilangan darah > 500ml (7ml/kg pada anak) telah diantisipasi dengan akses IV memadai' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setSignInChecks, item.key)}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-teal-600">
                    {signInChecks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Out View */}
        {activeTab === 'time-out' && (
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <Clock size={16} /> FASE 2: TIME OUT (Jeda Singkat Seluruh Tim Sebelum Insisi Kulit)
            </h4>
            <div className="space-y-3">
              {[
                { key: 'teamIntroduced', label: 'Seluruh anggota tim bedah memperkenalkan nama dan peran masing-masing' },
                { key: 'confirmPatientProcedureSite', label: 'Konfirmasi verbal bersama: Nama Pasien, Jenis Tindakan, dan Posisi/Lokasi Insisi' },
                { key: 'antibioticProphylaxisGiven', label: 'Profilaksis antibiotik telah diberikan dalam 60 menit terakhir (atau N/A)' },
                { key: 'surgeonAnticipatedSteps', label: 'Dokter Bedah: Uraian langkah kritis, durasi operasi terduga, dan antisipasi perdarahan' },
                { key: 'anesthesiaConcernsReviewed', label: 'Dokter Anestesi: Uraian perhatian khusus pasien (stabilitas TTV, akses darah)' },
                { key: 'nursingSterilityVerified', label: 'Tim Keperawatan: Konfirmasi sterilitas instrumen dan kesiapan alat implan/khusus' },
                { key: 'imagingDisplayed', label: 'Hasil radiologi / penunjang kritis (USG/CT/Rontgen) telah ditampilkan di ruang operasi' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setTimeOutChecks, item.key)}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-teal-600">
                    {timeOutChecks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign Out View */}
        {activeTab === 'sign-out' && (
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 flex items-center gap-2">
              <Clock size={16} /> FASE 3: SIGN OUT (Sebelum Pasien Meninggalkan Meja Operasi)
            </h4>
            <div className="space-y-3">
              {[
                { key: 'procedureNameRecorded', label: 'Nama tindakan bedah definitif telah dicatat dan dikonfirmasi' },
                { key: 'instrumentNeedleSpongeCountCorrect', label: 'Hitungan instrumen, kassa, jarum, dan tampon dinyatakan LENGKAP & COCOK' },
                { key: 'specimenLabeledCorrectly', label: 'Pelabelan spesimen jaringan/cairan terbaca jelas (Nama Pasien, No RM, Asal Jaringan)' },
                { key: 'equipmentProblemsAddressed', label: 'Tidak ada masalah/malfungsi alat bedah atau telah dicatat untuk ditangani' },
                { key: 'keyConcernsRecoveryReviewed', label: 'Dokter Bedah & Anestesi meninjau instruksi pemulihan pasca operasi (Target TTV, Drain, Nyeri)' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setSignOutChecks, item.key)}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-teal-600">
                    {signOutChecks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Verification Footer */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-teal-600" /> Catatan Tambahan & Verifikasi Tim Bedah
          </h4>
          <textarea 
            rows="3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan khusus intraoperatif, komplikasi, atau instruksi serah terima ke PACU..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Verifikator Keselamatan Bedah: <strong>{currentUser?.displayName || currentUser?.email || 'SURGICAL SAFETY OFFICER'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Checklist Bedah (JCI IPSG.4)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
