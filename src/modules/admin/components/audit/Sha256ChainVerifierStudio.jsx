import React, { useState } from 'react';
import { forensicAuditEcosystemService } from '../../../../../server/services/forensicAuditEcosystem.service.js';
import toast from 'react-hot-toast';

export default function Sha256ChainVerifierStudio() {
  const [verificationResult, setVerificationResult] = useState(forensicAuditEcosystemService.verifyLedgerIntegrity());
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRunVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = forensicAuditEcosystemService.verifyLedgerIntegrity();
      setVerificationResult(res);
      setIsVerifying(false);
      if (res.isChainIntact) {
        toast.success('Integritas Kriptografi SHA-256 Valid 100%! Tidak ada manipulasi data.');
      } else {
        toast.error(`PERINGATAN: Terdeteksi ${res.tamperedCount} log yang mengalami manipulasi.`);
      }
    }, 400);
  };

  const handleSimulateTampering = () => {
    forensicAuditEcosystemService.injectTamperedLogForTest(0, 'MALICIOUS_UNAUTHORIZED_MUTATION');
    const res = forensicAuditEcosystemService.verifyLedgerIntegrity();
    setVerificationResult(res);
    toast.error('Simulasi Perubahan Data Disuntikkan! Verifier mendeteksi pelanggaran hash.');
  };

  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${verificationResult.isChainIntact ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            <span className="material-symbols-outlined text-3xl">
              {verificationResult.isChainIntact ? 'verified_user' : 'gpp_bad'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                verificationResult.isChainIntact
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300'
              }`}>
                {verificationResult.isChainIntact ? 'CHAIN INTEGRITY 100% VERIFIED' : 'TAMPERED BLOCKS DETECTED'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {verificationResult.totalBlocksVerified} Total Blocks
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              {verificationResult.isChainIntact
                ? 'Rantai Hash Kriptografis SHA-256 Tidak Pernah Diubah'
                : `Ditemukan ${verificationResult.tamperedCount} Blok Mengalami Modifikasi Tidak Sah`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap transaksi mereferensikan signature hash transaksi sebelumnya secara chained (Append-Only Anti-Tampering).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunVerification}
            disabled={isVerifying}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{isVerifying ? 'sync' : 'security_update_good'}</span>
            {isVerifying ? 'Memverifikasi...' : 'Verifikasi Rantai Kriptografi'}
          </button>

          <button
            onClick={handleSimulateTampering}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            title="Simulasikan modifikasi data langsung untuk menguji ketahanan verifier"
          >
            Simulasi Manipulasi
          </button>
        </div>
      </div>

      {/* Visual Blockchain Chain Blocks */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          Inspeksi Blok Kriptografi Berantai ({verificationResult.chain.length} Blok)
        </h4>

        <div className="space-y-3">
          {verificationResult.chain.map((block) => (
            <div
              key={block.logId}
              className={`p-4 rounded-2xl border transition-all ${
                block.isHashValid
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  : 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-400'
              } shadow-xs space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-xs font-black flex items-center justify-center">
                    #{block.index}
                  </span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{block.entityName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                    {block.action}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  block.isHashValid
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}>
                  {block.isHashValid ? 'HASH VALID ✅' : 'TAMPERED HASH ❌'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Previous Hash ($H_{'{n-1}'}$):</span>
                  <p className="text-slate-600 dark:text-slate-400 truncate">{block.previousHash}</p>
                </div>
                <div>
                  <span className="text-[10px] text-teal-500 block mb-0.5">Signature Hash ($H_n$):</span>
                  <p className="text-teal-600 dark:text-teal-400 font-bold truncate">{block.storedHash}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
