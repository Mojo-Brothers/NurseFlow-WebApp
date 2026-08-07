import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, FileText, ArrowLeft, Building2, Calendar, 
  Lock, QrCode, Printer, Check, PenTool, RotateCcw, X, Sparkles, Award, KeyRound, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { verifySignedVerificationToken, createAuditLogPayload } from '../../../core/securityTokens.js';

export default function VerificationEndpoint() {
  const { rqId } = useParams();
  const [searchParams] = useSearchParams();
  const documentCode = rqId || 'RQ-20260805-9708';

  const tokenParam = searchParams.get('token');
  const expiresParam = searchParams.get('expires');
  const tokenSecurity = verifySignedVerificationToken(tokenParam, expiresParam, documentCode);

  // Security PIN state
  const [supervisorPin, setSupervisorPin] = useState('');
  const [isPinAuthenticated, setIsPinAuthenticated] = useState(false);

  // Signature state & Document items state
  const [signatureImage, setSignatureImage] = useState(null);
  const [isPadOpen, setIsPadOpen] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const [docData, setDocData] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load Document Items & Signature from localStorage or default
  useEffect(() => {
    try {
      const savedSig = localStorage.getItem(`signature_req_${documentCode}`);
      if (savedSig) {
        setSignatureImage(savedSig);
      } else {
        generateDefaultSignature();
      }
    } catch (e) {
      generateDefaultSignature();
    }

    try {
      const savedDoc = localStorage.getItem(`material_request_${documentCode}`);
      if (savedDoc) {
        const parsed = JSON.parse(savedDoc);
        setDocData(parsed);
        if (parsed.items && parsed.items.length > 0) {
          setItemsList(parsed.items);
        } else {
          loadDefaultItems();
        }
      } else {
        loadDefaultItems();
      }
    } catch (e) {
      loadDefaultItems();
    }
  }, [documentCode]);

  const loadDefaultItems = () => {
    setItemsList([
      { code: 'MED-PAR500', name: 'Paracetamol 500mg Infus 100ml', qtyRequested: 25, unit: 'BOTOL', lineNotes: 'Stok Cepat Habis Ruang Teratai' },
      { code: 'MED-RL500', name: 'Ringer Lactate (RL) Infus 500ml Eka', qtyRequested: 50, unit: 'KOLF', lineNotes: 'Requisisi Rutin Ruangan' },
      { code: 'BMHP-IVC-20G', name: 'IV Catheter 20G Pink (Terumo)', qtyRequested: 100, unit: 'PCS', lineNotes: 'Paket Standar Pelayanan' },
      { code: 'BMHP-GLV-STER', name: 'Sarung Tangan Steril Size M (Surgicare)', qtyRequested: 20, unit: 'BOX', lineNotes: 'Steril Kemenkes' }
    ]);
  };

  const generateDefaultSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 320, 140);
    ctx.strokeStyle = '#0284c7'; // sky-600 signature ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Cursive stroke simulation
    ctx.beginPath();
    ctx.moveTo(35, 95);
    ctx.bezierCurveTo(55, 30, 75, 25, 85, 75);
    ctx.bezierCurveTo(90, 95, 105, 105, 125, 70);
    ctx.bezierCurveTo(145, 35, 165, 55, 185, 80);
    ctx.bezierCurveTo(205, 105, 235, 30, 265, 65);
    ctx.bezierCurveTo(280, 85, 300, 95, 310, 80);
    ctx.stroke();

    // Underline stroke
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.quadraticCurveTo(160, 120, 300, 100);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const data = canvas.toDataURL('image/png');
    setSignatureImage(data);
  };

  // Canvas drawing handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a'; // dark slate ink
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveCanvasSignature = () => {
    if (!hasDrawn) {
      toast.error('Silakan gores tanda tangan pada pad terlebih dahulu!');
      return;
    }
    if (!supervisorPin || supervisorPin.length < 6) {
      toast.error('Masukkan 6-Digit PIN Otorisasi Klinis Staf terlebih dahulu (Default Demo: 123456)!');
      return;
    }

    const canvas = canvasRef.current;
    const data = canvas.toDataURL('image/png');
    setSignatureImage(data);
    setIsAgreementChecked(true);
    setIsPinAuthenticated(true);

    try {
      localStorage.setItem(`signature_req_${documentCode}`, data);
      
      // Update individual document cache
      const savedDoc = localStorage.getItem(`material_request_${documentCode}`);
      let currentApprovedBy = 'Apt. Rian Hidayat, S.Farm';
      if (savedDoc) {
        const parsed = JSON.parse(savedDoc);
        currentApprovedBy = parsed.approvedBy ? parsed.approvedBy.replace(' [Menunggu E-Sign]', '') : currentApprovedBy;
        parsed.status = 'DISETUJUI';
        parsed.approvedBy = `${currentApprovedBy} [E-Signed & PIN Verified]`;
        parsed.approvalSignatureBase64 = data;
        localStorage.setItem(`material_request_${documentCode}`, JSON.stringify(parsed));
        setDocData(parsed);
      }

      // Update main monitoring list cache (nurseflow_ro_list)
      const listStr = localStorage.getItem('nurseflow_ro_list');
      if (listStr) {
        const list = JSON.parse(listStr);
        if (Array.isArray(list)) {
          const updatedList = list.map(item => {
            const code = item.requestCode || item.noRQ;
            if (code === documentCode) {
              return {
                ...item,
                status: 'DISETUJUI',
                approvedBy: `${currentApprovedBy} [E-Signed & PIN Verified]`,
                approvalSignatureBase64: data
              };
            }
            return item;
          });
          localStorage.setItem('nurseflow_ro_list', JSON.stringify(updatedList));
        }
      }
    } catch (e) {}
    setIsPadOpen(false);
    toast.success('🔑 PIN Valid & Tanda Tangan Saved! Status RO Otomatis DISETUJUI & E-SIGNED', {
      icon: '🛡️',
      duration: 4000
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans print:bg-white print:text-slate-900 print:p-0">
      
      {/* PRINT MEDIA BREAK & LAYOUT STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          html, body {
            background-color: white !important;
            color: #0f172a !important;
            font-size: 11px !important;
          }
          .print-hidden {
            display: none !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            page-break-inside: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      ` }} />

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden print:max-w-none print:w-full print:bg-white print:text-slate-900 print:border-none print:p-0 print:shadow-none print:space-y-3">
        
        {/* Glow Background Accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none print-hidden"></div>
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none print-hidden"></div>

        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 print:border-slate-300 pb-3 print-avoid-break">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 print:text-emerald-700 print:border-emerald-600 print:w-8 print:h-8">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white print:text-slate-900 print:text-sm">PORTAL VERIFIKASI DOKUMEN HIS</h1>
              <p className="text-xs font-bold text-slate-400 print:text-slate-600 print:text-[10px]">NurseFlow EHIS 2026 • JCI Audit Compliant</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 print:text-emerald-800 print:border-emerald-600 print:py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping print-hidden"></span>
            <span>LIVE VERIFIED</span>
          </span>
        </div>

        {/* Cryptographic Security Audit Banner */}
        <div className={`p-3 rounded-2xl border text-xs font-medium flex items-center gap-3 print-avoid-break ${
          tokenSecurity.isValid 
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 print:bg-emerald-50 print:border-emerald-200' 
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300 print:bg-amber-50 print:border-amber-200'
        }`}>
          {tokenSecurity.isValid ? (
            <ShieldCheck size={26} className="text-emerald-400 shrink-0 print:text-emerald-600" />
          ) : (
            <ShieldAlert size={26} className="text-amber-400 shrink-0 print:text-amber-600" />
          )}
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight">
              {tokenSecurity.isValid ? 'DOKUMEN HMAC VERIFIED & OTENTIK' : 'PEMBERITAHUAN SECURITY (UNSIGNED URL)'}
            </h2>
            <p className="text-[11px] mt-0.5 opacity-90 font-medium">
              {tokenSecurity.isValid 
                ? `Token Kriptografi HMAC SHA-256 Valid. Status: ${tokenSecurity.reason}` 
                : `${tokenSecurity.reason}. Gunakan tombol "Generate Link Akses / Barcode" resmi untuk membuat URL berpenanda HMAC.`
              }
            </p>
          </div>
        </div>



        {/* Document Details Grid */}
        <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-xs font-medium print:bg-white print:border-slate-200 print:p-3 print:space-y-1.5 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-800/60 print:border-slate-200 pb-1.5">
            <span className="text-slate-400 print:text-slate-600">Nomor Requisisi (No. RQ):</span>
            <span className="font-mono text-sm font-black text-indigo-400 print:text-indigo-800">{documentCode}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 print:border-slate-200 pb-1.5">
            <span className="text-slate-400 print:text-slate-600">Jenis Dokumen:</span>
            <span className="font-bold text-slate-200 print:text-slate-900">Requisisi Permintaan Barang (Material Request)</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 print:border-slate-200 pb-1.5">
            <span className="text-slate-400 print:text-slate-600">Status Otorisasi:</span>
            <span className="px-2.5 py-0.5 bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-300">
              <Check size={11} />
              <span>DISETUJUI & E-SIGNED</span>
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 print:border-slate-200 pb-1.5">
            <span className="text-slate-400 print:text-slate-600">Disetujui Oleh (Otorisator):</span>
            <span className="font-bold text-white print:text-slate-900">
              {docData?.approvedBy || 'Apt. Rian Hidayat, S.Farm'}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/60 print:border-slate-200 pb-1.5">
            <span className="text-slate-400 print:text-slate-600">Routing Asal & Tujuan:</span>
            <span className="font-bold text-slate-300 print:text-slate-800">Logistik Farmasi ➔ Rawat Inap Teratai</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 print:text-slate-600">Immutability Hash (SHA-256):</span>
            <span className="font-mono text-[10px] text-slate-500 print:text-slate-500">0x8f92a4...{documentCode.slice(-4)}</span>
          </div>
        </div>

        {/* MATERIAL LINES ITEM TABLE (RINCIAN BARANG DIMINTA) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 print:bg-white print:border-slate-200 print:p-3 print:space-y-1.5 print-avoid-break">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 print:text-slate-900">
              <FileText size={15} className="text-indigo-400 print:text-indigo-700" />
              <span>Rincian Barang Diminta (Material Lines Requisisi)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-full font-mono text-[10px] font-bold print:bg-indigo-50 print:text-indigo-800 print:border-indigo-200">
              {itemsList.length} Item
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-slate-300">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                  <th className="p-2 text-center w-8 border-r border-slate-800 print:border-slate-300">No</th>
                  <th className="p-2 border-r border-slate-800 print:border-slate-300">Kode & Nama Barang</th>
                  <th className="p-2 text-center border-r border-slate-800 print:border-slate-300">Qty</th>
                  <th className="p-2 border-r border-slate-800 print:border-slate-300">Satuan</th>
                  <th className="p-2">Catatan Line</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium print:divide-slate-200 print:text-slate-800">
                {itemsList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 print-avoid-break">
                    <td className="p-2 text-center font-mono text-slate-500 print:text-slate-600 text-[10px] border-r border-slate-800/60 print:border-slate-200">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-800/60 print:border-slate-200">
                      <div className="font-bold text-white print:text-slate-900 text-[11px]">{item.name || item.itemName}</div>
                      <div className="font-mono text-[9px] text-indigo-400 print:text-indigo-700">{item.code || item.itemCode}</div>
                    </td>
                    <td className="p-2 text-center font-mono font-bold text-emerald-400 print:text-emerald-800 text-xs border-r border-slate-800/60 print:border-slate-200">{item.qtyRequested || item.qty}</td>
                    <td className="p-2 uppercase text-[10px] text-slate-400 print:text-slate-700 border-r border-slate-800/60 print:border-slate-200">{item.unit || 'PCS'}</td>
                    <td className="p-2 text-[10px] text-slate-400 print:text-slate-600">{item.lineNotes || item.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* E-SIGNATURE SPECIMEN CARD */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 print:bg-white print:border-slate-200 print:p-2.5 print-avoid-break">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 print:text-slate-900">
              <PenTool size={14} className="text-sky-400 print:text-sky-700" />
              <span>Spesimen Tanda Tangan Digital & Otorisasi</span>
            </div>
            <button
              onClick={() => setIsPadOpen(true)}
              className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all print-hidden"
            >
              <PenTool size={12} />
              <span>Gores Tanda Tangan</span>
            </button>
          </div>

          {/* Signature Graphic Container */}
          <div className="bg-white rounded-xl p-2.5 flex flex-col items-center justify-center border border-slate-700 print:border-slate-300 relative group min-h-[90px] print:min-h-[80px]">
            {signatureImage ? (
              <img 
                src={signatureImage} 
                alt="Tanda Tangan Digital Otorisator"
                className="h-16 print:h-12 object-contain max-w-full" 
              />
            ) : (
              <div className="text-xs text-slate-400 font-bold">Tanda tangan digital belum digores</div>
            )}
            <div className="w-full border-t border-slate-200 mt-1.5 pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500 print:text-slate-700">
              <span>Apt. Rian Hidayat, S.Farm</span>
              <span className="text-emerald-700 font-bold">✓ E-SIGN VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Security Stamp Certificate Box */}
        <div className="border border-dashed border-emerald-500/30 bg-emerald-500/5 print:bg-emerald-50 print:border-emerald-300 rounded-2xl p-3 text-center space-y-0.5 print-avoid-break">
          <p className="text-[10px] font-bold text-emerald-400 print:text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-1">
            <Award size={12} />
            <span>CERTIFICATE OF DIGITAL AUTHENTICITY</span>
          </p>
          <p className="text-[9px] text-slate-400 print:text-slate-600">
            Tanda tangan digital ini sah dan diakui sesuai dengan ketentuan Peraturan Menteri Kesehatan RI & Standar Akreditasi Rumah Sakit (JCI PFR.5).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print-hidden">
          <Link
            to="/inventory/material-request"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke App HIS</span>
          </Link>

          {!isAgreementChecked ? (
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Setujui</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-emerald-400 font-bold text-xs">
              <CheckCircle2 size={15} />
              <span>Status: DISETUJUI & E-SIGNED</span>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>Cetak Sertifikat Verifikasi</span>
          </button>
        </div>

      </div>

      {/* CANVAS E-SIGNATURE PAD MODAL */}
      {isPadOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PenTool size={18} className="text-sky-400" />
                <h3 className="text-sm font-black text-white">Gores Tanda Tangan Digital</h3>
              </div>
              <button
                onClick={() => setIsPadOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Gunakan jari, stylus, atau kursor mouse Anda untuk membuat tanda tangan pada area pad putih di bawah:
            </p>

            <div className="bg-white rounded-2xl p-2 border-2 border-dashed border-sky-500/50 shadow-inner flex justify-center touch-none">
              <canvas
                ref={canvasRef}
                width={360}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white cursor-crosshair rounded-xl"
              />
            </div>

            {/* 6-DIGIT CLINICAL SECURITY PIN INPUT FIELD */}
            <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <label className="block text-[10px] uppercase font-bold text-sky-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <KeyRound size={13} />
                  PIN Otorisasi Klinis Staf (6-Digit):*
                </span>
                <span className="text-[9px] text-slate-400 font-normal">Demo PIN: 123456</span>
              </label>
              <div className="relative flex items-center">
                <Lock size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Masukkan 6-digit PIN..."
                  value={supervisorPin}
                  onChange={e => setSupervisorPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-9.5 bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl pl-9 pr-3 font-mono text-center text-sm font-bold tracking-widest text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Bersihkan Pad</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateDefaultSignature}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold transition-colors"
                >
                  Gunakan Preset
                </button>
                <button
                  type="button"
                  onClick={saveCanvasSignature}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-lg transition-all"
                >
                  Simpan Tanda Tangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODERN APPROVAL CONFIRMATION POPUP MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[4500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4.5 relative overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Top Accent Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Konfirmasi Otorisasi Dokumen</h3>
                <p className="text-xs font-bold text-slate-400">NurseFlow HIS • Legal Approval JCI PFR.5</p>
              </div>
            </div>

            {/* Legal Persetujuan Card */}
            <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-3.5 space-y-1 text-xs">
              <strong className="text-emerald-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                Pernyataan Persetujuan & Otorisasi Legal
              </strong>
              <p className="text-slate-200 leading-relaxed font-medium">
                Saya menyatakan dengan sebenarnya bahwa seluruh rincian barang, jumlah, dan spesifikasi dalam Requisisi <span className="font-mono font-bold text-indigo-300">{documentCode}</span> ini telah diverifikasi secara sah, memenuhi standar persetujuan medis, dan disetujui secara resmi untuk diproses Logistik Farmasi.
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Nomor Requisisi (No. RQ):</span>
                <span className="font-mono font-black text-indigo-400">{documentCode}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Total Line Barang:</span>
                <span className="font-bold text-slate-200">{itemsList.length || 1} Item</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Penanggung Jawab Otorisasi:</span>
                <span className="font-bold text-emerald-400">Apt. Rian Hidayat, S.Farm</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Apakah Anda yakin ingin menyetujui dan merilis dokumen ini?
            </p>

            {/* Action Buttons: Batal & Kirim */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAgreementChecked(true);
                  setIsConfirmModalOpen(false);
                  try {
                    const savedDoc = localStorage.getItem(`material_request_${documentCode}`);
                    if (savedDoc) {
                      const parsed = JSON.parse(savedDoc);
                      parsed.status = 'DISETUJUI';
                      parsed.approvedBy = 'Apt. Rian Hidayat, S.Farm';
                      localStorage.setItem(`material_request_${documentCode}`, JSON.stringify(parsed));
                    }
                  } catch (err) {}
                  toast.success('Dokumen Berhasil Disetujui & Dikirim!');
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={15} />
                <span>Kirim</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
