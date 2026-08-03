import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { FileSignature, ShieldAlert, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Info, Smartphone, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';
import { db } from '../../../core/firebase.js';
import { collection, doc, setDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function DigitalInformedConsent({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [form, setForm] = useState({
    tindakan: isDewi ? 'Laparoscopic Appendectomy (Operasi Usus Buntu Minimal Invasif)' : '',
    risiko: isDewi ? 'Pendarahan intra/post-op, infeksi luka operasi (SSI), konversi ke laparatomi terbuka jika perlengketan berat, risiko efek anestesi umum.' : '',
    alternatif: isDewi ? 'Appendectomy Laparatomi Terbuka konvensional, Terapi Konservatif Antibiotik (Risiko perforasi appendix tinggi).' : '',
    saksi: isDewi ? 'Tn. Agus Pratama (Suami Pasien)' : ''
  });
  const [isSigning, setIsSigning] = useState(false);
  const [signatureRequestId, setSignatureRequestId] = useState(null);
  const [signatureStatus, setSignatureStatus] = useState(null); // 'PENDING', 'SIGNED'
  const [patientSignature, setPatientSignature] = useState(null);
  const [isSavedToEMR, setIsSavedToEMR] = useState(false);

  // Fallback direct sign
  const handleSignDirect = async () => {
    if (!form.tindakan || !form.saksi) return;
    setIsSigning(true);
    await finalizeRecord(form.saksi, null);
  };

  const finalizeRecord = async (witnessName, base64Signature) => {
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'PAT-DEMO',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'PERSETUJUAN TINDAKAN',
        data: {
            ...form,
            status: 'SIGNED_AND_VERIFIED',
            doctorSignature: currentUser?.email,
            witnessSignature: witnessName,
            patientSignatureBase64: base64Signature,
            signedAt: new Date().toISOString()
        }
      });
      setIsSavedToEMR(true);
      toast.success('Formulir Persetujuan Tindakan berhasil disimpan ke Rekam Medis (PFR.5)!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      toast.error('Gagal memproses Informed Consent: ' + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  const requestTabletSignature = async () => {
    if (!form.tindakan) {
      toast.error("Isi nama tindakan kedokteran terlebih dahulu!");
      return;
    }
    
    const newReqId = 'sig_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const payload = {
      id: newReqId,
      status: 'PENDING',
      tindakan: form.tindakan,
      risiko: form.risiko,
      doctorName: currentUser?.displayName || currentUser?.email || 'Dr. Robby Viory, Sp.B',
      patientName: patient?.name || 'Ny. Dewi Sartika, S.Pd',
      patientMrn: patient?.mrn || '009944',
      createdAt: new Date().toISOString()
    };

    // Store locally for cross-tab / local network immediately
    try {
      localStorage.setItem(`signature_request_${newReqId}`, JSON.stringify(payload));
    } catch (e) {}

    // Store in Firestore
    try {
      const reqRef = doc(db, 'signature_requests', newReqId);
      await setDoc(reqRef, payload);
    } catch (e) {
      console.warn("Firestore sign session initialized with local fallback:", e);
    }

    setSignatureRequestId(newReqId);
    setSignatureStatus('PENDING');
    toast.success('QR Code dibuat! Silakan pindai di tablet/ponsel pasien.');
  };

  // Process and link received patient signature
  const handleSignatureReceived = (sigImage) => {
    if (!sigImage) return;
    setSignatureStatus('SIGNED');
    setPatientSignature(sigImage);
    setIsSigning(false);
    
    // Automatically save into clinical record in Firestore
    saveClinicalRecord({
      patientId: patient?.id || 'PAT-DEMO',
      encounterId: encounter?.id || 'ENC-DEMO-MOCK',
      author: currentUser?.displayName || currentUser?.email || 'Dr. Robby Viory, Sp.B',
      moduleName: 'PERSETUJUAN TINDAKAN',
      data: {
          ...form,
          status: 'SIGNED_AND_VERIFIED',
          doctorSignature: currentUser?.email,
          witnessSignature: form.saksi || patient?.name || 'Ny. Dewi Sartika, S.Pd (Pasien / Saksi)',
          patientSignatureBase64: sigImage,
          signedAt: new Date().toISOString()
      }
    }).then(() => {
      setIsSavedToEMR(true);
      toast.success('🎉 Tanda tangan pasien berhasil diterima & disematkan ke formulir!');
    }).catch(console.error);
  };

  // Simulate instant signature for demo/testing
  const simulateTabletSignature = async () => {
    if (!signatureRequestId) return;
    try {
      // Create sample high quality SVG/PNG signature canvas
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(50, 100);
      ctx.bezierCurveTo(100, 30, 150, 150, 200, 80);
      ctx.bezierCurveTo(250, 40, 300, 130, 350, 90);
      ctx.stroke();
      const mockSig = canvas.toDataURL('image/png');

      // 1. Trigger local sync directly
      handleSignatureReceived(mockSig);

      // 2. BroadcastChannel
      try {
        const channel = new BroadcastChannel('nurseflow_e_sign');
        channel.postMessage({ requestId: signatureRequestId, signatureImage: mockSig, status: 'SIGNED' });
        channel.close();
      } catch (e) {}

      // 3. Firestore
      try {
        const reqRef = doc(db, 'signature_requests', signatureRequestId);
        await updateDoc(reqRef, {
          status: 'SIGNED',
          signatureImage: mockSig,
          signedAt: serverTimestamp()
        });
      } catch (e) {}
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!signatureRequestId) return;

    // 1. Firebase Firestore onSnapshot Listener
    const reqRef = doc(db, 'signature_requests', signatureRequestId);
    const unsubscribe = onSnapshot(reqRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status === 'SIGNED' && data.signatureImage) {
           handleSignatureReceived(data.signatureImage);
        }
      }
    }, (err) => console.warn("Firestore snapshot notice:", err));

    // 2. BroadcastChannel Listener (Instant local multi-tab sync)
    let channel;
    try {
      channel = new BroadcastChannel('nurseflow_e_sign');
      channel.onmessage = (event) => {
        if (event.data?.requestId === signatureRequestId && event.data?.signatureImage) {
          handleSignatureReceived(event.data.signatureImage);
        }
      };
    } catch (e) {}

    // 3. Storage Event Listener (Cross-window sync fallback)
    const handleStorage = (e) => {
      if (e.key === `signature_result_${signatureRequestId}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.signatureImage) {
            handleSignatureReceived(parsed.signatureImage);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [signatureRequestId, form, patient, encounter, currentUser]);

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const tabletSignUrl = signatureRequestId ? `${window.location.protocol}//${window.location.host}/e-sign/${signatureRequestId}` : '';

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 w-full flex flex-col pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[9px] font-black tracking-widest uppercase border border-rose-200 dark:border-rose-500/30">
                Standard PFR.5
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                Cross-Device Sync
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">PERSETUJUAN TINDAKAN (INFORMED CONSENT)</h3>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-500/20">
           <FileSignature size={20} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] w-full relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform -rotate-12">
          <FileSignature size={400} />
        </div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
             
             {/* Minimalist Header Guide */}
             <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                   <Info size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Kewajiban Mediko-Legal</h4>
                   <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                      Setiap tindakan kedokteran yang mengandung risiko tinggi wajib mendapat persetujuan tertulis / digital yang ditandatangani oleh DPJP dan saksi. Dokumen ini mengikat secara hukum.
                   </p>
                </div>
             </div>

             <section className="space-y-6">
                <div className="group">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-rose-500 transition-colors mb-2 block ml-2">Nama Tindakan Kedokteran / Operasi *</label>
                   <input 
                      type="text"
                      value={form.tindakan} 
                      onChange={e => setField('tindakan', e.target.value)} 
                      disabled={!!signatureRequestId}
                      placeholder="Contoh: Appendiktomi Laparoskopi, Endoskopi..."
                      className="w-full bg-slate-50 dark:bg-[var(--surface-container-lowest)] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-solid focus:border-rose-500 transition-all placeholder:text-slate-400 disabled:opacity-50" 
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-rose-500 transition-colors mb-2 block ml-2">Risiko & Komplikasi yang Mungkin Terjadi</label>
                      <textarea 
                         value={form.risiko} 
                         onChange={e => setField('risiko', e.target.value)} 
                         disabled={!!signatureRequestId}
                         placeholder="Pendarahan, infeksi, reaksi alergi..."
                         className="w-full bg-slate-50 dark:bg-[var(--surface-container-lowest)] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-solid focus:border-rose-500 min-h-[100px] resize-none transition-all placeholder:text-slate-400 disabled:opacity-50" 
                      />
                   </div>
                   <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-rose-500 transition-colors mb-2 block ml-2">Alternatif Tindakan (Jika Ada)</label>
                      <textarea 
                         value={form.alternatif} 
                         onChange={e => setField('alternatif', e.target.value)} 
                         disabled={!!signatureRequestId}
                         placeholder="Observasi, pengobatan konservatif..."
                         className="w-full bg-slate-50 dark:bg-[var(--surface-container-lowest)] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-solid focus:border-rose-500 min-h-[100px] resize-none transition-all placeholder:text-slate-400 disabled:opacity-50" 
                      />
                   </div>
                </div>
             </section>
             
             {/* SIGNATURE SECTION */}
             <section className="bg-slate-50/50 dark:bg-white/5 p-8 rounded-3xl border border-slate-100 dark:border-white/5 mt-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform -rotate-12">
                   <KeyRound size={120} />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center justify-center gap-3 mb-6">
                      <ShieldAlert size={16} className="text-amber-500" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300 text-center">Otentikasi Tanda Tangan Ganda (Dual-Sign)</h4>
                   </div>
                                    {patientSignature || signatureStatus === 'SIGNED' ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                        {/* DPJP SIGNATURE CARD */}
                        <div className="bg-white dark:bg-black/20 p-5 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 text-center flex flex-col justify-between">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tanda Tangan DPJP (Dokter)</p>
                              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                                 <CheckCircle2 size={14} className="text-emerald-500" />
                                 <span className="text-xs font-black text-slate-700 dark:text-slate-200">{currentUser?.email || 'Dr. Robby Viory, Sp.B'}</span>
                              </div>
                           </div>
                           <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1">
                                 <ShieldCheck size={12} /> DPJP Terotentikasi
                              </span>
                           </div>
                        </div>

                        {/* PATIENT / WITNESS LIVE SIGNATURE CARD */}
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-2xl border-2 border-emerald-500/30 text-center flex flex-col justify-between">
                           <div>
                              <div className="flex items-center justify-between mb-2">
                                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Tanda Tangan Pasien / Saksi</p>
                                 <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[8px] font-black uppercase">
                                    Live Received
                                 </span>
                              </div>

                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-500/30 shadow-inner flex items-center justify-center min-h-[110px]">
                                 <img 
                                    src={patientSignature} 
                                    alt="Tanda Tangan Pasien" 
                                    className="max-h-24 max-w-full object-contain filter dark:invert" 
                                 />
                              </div>

                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2">
                                 {form.saksi || patient?.name || 'Ny. Dewi Sartika, S.Pd'}
                              </p>
                           </div>

                           <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                 <CheckCircle2 size={12} /> Sah & Tersimpan di EMR
                              </span>
                              <button
                                 onClick={() => {
                                    setPatientSignature(null);
                                    setSignatureStatus(null);
                                    setSignatureRequestId(null);
                                 }}
                                 className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wider transition-colors"
                              >
                                 Ubah / Tanda Tangan Ulang
                              </button>
                           </div>
                        </div>
                     </div>
                   ) : !signatureRequestId ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-white dark:bg-black/20 p-5 rounded-2xl border-2 border-slate-100 dark:border-white/5 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tanda Tangan DPJP</p>
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                               <CheckCircle2 size={14} className="text-emerald-500" />
                               <span className="text-xs font-black text-slate-700 dark:text-slate-300">{currentUser?.email || 'Dr. Robby Viory, Sp.B'}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-3 italic">Otomatis terverifikasi via sesi login aktif.</p>
                         </div>
                         
                         <div className="bg-white dark:bg-black/20 p-5 rounded-2xl border-2 border-rose-100 dark:border-rose-500/20 text-center flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3">Tanda Tangan Pasien / Saksi</p>
                            
                            <button 
                              onClick={requestTabletSignature}
                              className="bg-slate-800 hover:bg-slate-900 text-white w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex flex-col items-center gap-2 transition-all active:scale-95 group"
                            >
                              <Smartphone size={20} className="group-hover:scale-110 transition-transform" />
                              Minta Pasien TTD di Tablet / HP
                            </button>
                            
                            <div className="w-full flex items-center gap-2 mt-4 opacity-50">
                              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                              <span className="text-[9px] uppercase font-bold">Atau Ketik Manual</span>
                              <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700"></div>
                            </div>

                            <input 
                               type="text"
                               value={form.saksi} 
                               onChange={e => setField('saksi', e.target.value)} 
                               placeholder="Ketik Nama Lengkap Saksi..."
                               className="w-full bg-slate-50 mt-4 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400" 
                            />
                         </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-500/30 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-sm">
                         <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-rose-200 dark:border-rose-500/20">
                            <Smartphone size={14} /> Sinkronisasi Real-time Aktif
                         </div>
                         <p className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-1">Pindai QR Code di Tablet atau HP Pasien</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-xs mx-auto">
                            Arahkan kamera ke QR ini untuk membuka layar tanda tangan digital terisolasi.
                         </p>
                         
                         <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 mb-6">
                            <img 
                               src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(tabletSignUrl)}`} 
                               alt="Sign QR Code"
                               className="w-48 h-48" 
                            />
                         </div>
                         
                         <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-3 rounded-full border border-emerald-200 dark:border-emerald-500/20 mb-4">
                            <RefreshCw size={16} className="animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Menunggu Tanda Tangan Pasien...</span>
                         </div>

                         {/* ACTION SHORTCUTS */}
                         <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                            <a 
                               href={tabletSignUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                               <ExternalLink size={12} /> Buka Lembar TTD di Tab Baru
                            </a>
                            <button 
                               onClick={simulateTabletSignature}
                               className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-purple-500/20"
                            >
                               <Sparkles size={12} /> ⚡ Coba Demo: Tanda Tangan Instan
                            </button>
                         </div>

                         <button onClick={() => setSignatureRequestId(null)} className="mt-6 text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">
                            Batalkan Sesi QR
                         </button>
                      </div>
                    )}
                 </div>
              </section>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-row justify-end items-center gap-4 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm shrink-0">
        <button 
          onClick={onClose}
          disabled={isSigning || (signatureRequestId && !patientSignature)}
          className="bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          {patientSignature ? 'Tutup Lembar' : 'Batal'}
        </button>
        <button 
          onClick={patientSignature ? () => onSaveSuccess && onSaveSuccess() : handleSignDirect}
          disabled={isSigning || !form.tindakan || (!patientSignature && !form.saksi) || (signatureRequestId && !patientSignature)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:active:scale-100 group"
        >
          {isSigning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />}
          {patientSignature ? 'Selesai & Kembali ke EMR' : 'Otentikasi & Simpan Persetujuan'}
        </button>
      </div>
    </div>
  );
}
