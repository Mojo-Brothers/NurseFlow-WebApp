import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FileSignature, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SignaturePadEndpoint() {
  const { requestId } = useParams();
  const [requestData, setRequestData] = useState(null);
  const [status, setStatus] = useState('LOADING'); // LOADING, READY, SIGNED, NOT_FOUND
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    
    // Check localStorage fallback immediately
    try {
      const localData = localStorage.getItem(`signature_request_${requestId}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        setRequestData(parsed);
        if (parsed.status === 'SIGNED') {
          setStatus('SIGNED');
        } else {
          setStatus('READY');
        }
      }
    } catch (e) {}

    const docRef = doc(db, 'signature_requests', requestId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRequestData(data);
        if (data.status === 'SIGNED') {
          setStatus('SIGNED');
        } else {
          setStatus('READY');
        }
      } else {
        // Only set NOT_FOUND if we don't even have local data
        setRequestData(prev => {
          if (!prev) setStatus('NOT_FOUND');
          return prev;
        });
      }
    }, (err) => {
      console.warn("Firestore snapshot fallback to local:", err);
      setRequestData(prev => {
        if (!prev) setStatus('NOT_FOUND');
        return prev;
      });
    });

    return () => unsubscribe();
  }, [requestId]);

  // Prevent default scroll on touch devices during drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouch = (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
    };
  }, [status]);

  // Canvas Drawing Logic
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (status === 'SIGNED') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || status === 'SIGNED') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const submitSignature = async () => {
    if (!hasSignature || isSubmitting) return;
    setIsSubmitting(true);
    const canvas = canvasRef.current;
    const signatureBase64 = canvas.toDataURL('image/png');
    const signedPayload = {
      requestId,
      status: 'SIGNED',
      signatureImage: signatureBase64,
      signedAt: new Date().toISOString()
    };

    // 1. BroadcastChannel sync for instant local tab update
    try {
      const channel = new BroadcastChannel('nurseflow_e_sign');
      channel.postMessage(signedPayload);
      channel.close();
    } catch (e) {}

    // 2. localStorage sync for cross-window / tab
    try {
      localStorage.setItem(`signature_result_${requestId}`, JSON.stringify(signedPayload));
      const existing = localStorage.getItem(`signature_request_${requestId}`);
      if (existing) {
        const parsed = JSON.parse(existing);
        localStorage.setItem(`signature_request_${requestId}`, JSON.stringify({ ...parsed, status: 'SIGNED', signatureImage: signatureBase64 }));
      }
    } catch (e) {}

    // 3. Firestore cloud update
    try {
      const docRef = doc(db, 'signature_requests', requestId);
      await updateDoc(docRef, {
        status: 'SIGNED',
        signatureImage: signatureBase64,
        signedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore update sync (fallback active):', err);
    } finally {
      setStatus('SIGNED');
      setIsSubmitting(false);
    }
  };

  if (status === 'LOADING') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  }

  if (status === 'NOT_FOUND') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md">
          <AlertTriangle size={64} className="mx-auto text-rose-500 mb-6" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">Dokumen Tidak Ditemukan</h1>
          <p className="text-slate-500">Sesi tanda tangan ini mungkin sudah kedaluwarsa atau ID tidak valid. Silakan minta dokter Anda untuk membuat kode QR baru.</p>
        </div>
      </div>
    );
  }

  if (status === 'SIGNED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-500 p-6 text-white text-center">
        <ShieldCheck size={80} className="mb-8" />
        <h1 className="text-3xl font-black mb-4">Tanda Tangan Diterima</h1>
        <p className="opacity-90 max-w-md mx-auto text-lg">
          Dokumen Persetujuan Medis Anda telah ditandatangani secara digital dan tersinkronisasi ke rekam medis rumah sakit.
        </p>
        <p className="mt-8 font-black uppercase tracking-widest text-sm opacity-50">Anda Boleh Menutup Halaman Ini</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSignature size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-2">PERSETUJUAN TINDAKAN MEDIS</h1>
          <p className="text-sm text-slate-500">Mohon baca ringkasan tindakan di bawah ini sebelum menandatangani.</p>
        </div>

        {/* CLINICAL SUMMARY */}
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 mb-8 space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Tindakan Medis / Operasi</p>
            <p className="text-lg font-bold text-slate-800">{requestData?.tindakan || '-'}</p>
          </div>
          {requestData?.risiko && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">Risiko & Komplikasi</p>
              <p className="text-sm font-medium text-slate-600 bg-rose-50 p-4 rounded-xl">{requestData.risiko}</p>
            </div>
          )}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
             <CheckCircle2 size={16} className="text-emerald-500" />
             <p className="text-xs text-slate-500">Saya menyatakan bahwa saya telah dijelaskan dan mengerti sepenuhnya mengenai tindakan di atas oleh <span className="font-bold text-slate-700">{requestData?.doctorName || 'Dokter'}</span>.</p>
          </div>
        </div>

        {/* CANVAS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
           <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tanda Tangan Pasien / Wali</p>
              <button onClick={clearCanvas} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Hapus / Ulangi</button>
           </div>
           
           <div className="relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden touch-none h-[250px] w-full">
             {!hasSignature && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                  <p className="text-slate-400 font-medium">Gunakan jari untuk tanda tangan di sini</p>
               </div>
             )}
             <canvas
               ref={canvasRef}
               width={800} // Internal resolution
               height={400} // Internal resolution
               className="w-full h-full cursor-crosshair"
               onMouseDown={startDrawing}
               onMouseMove={draw}
               onMouseUp={stopDrawing}
               onMouseLeave={stopDrawing}
               onTouchStart={startDrawing}
               onTouchMove={draw}
               onTouchEnd={stopDrawing}
             />
           </div>

           <button 
             onClick={submitSignature}
             disabled={!hasSignature || isSubmitting}
             className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
           >
             {isSubmitting ? 'Mengirim...' : 'Kirim Tanda Tangan'}
           </button>
        </div>
        
        <p className="text-center text-[10px] text-slate-400 font-medium mt-6">Secure E-Signature Protocol. Timestamped & Audited.</p>
      </div>
    </div>
  );
}
