import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldAlert, X, ChevronRight, FileCheck2 } from 'lucide-react';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';

export default function DokterDocumentAlertBanner({ doctorProfile }) {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState(null);

  useEffect(() => {
    const status = emrSupportingDocsService.checkDoctorCredentials(doctorProfile);
    setCredentialStatus(status);
  }, [doctorProfile]);

  if (isDismissed || !credentialStatus || !credentialStatus.hasAlert) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs z-30 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-300 animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-black/30 font-mono font-black text-[10px] tracking-wider text-amber-300 uppercase">
              PERINGATAN DOKUMEN DOKTER (SIP/STR)
            </span>
            <span className="font-bold text-white truncate">
              {credentialStatus.doctorName}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[11px] text-rose-100 mt-0.5">
            {credentialStatus.alerts.map((alert, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="hidden sm:inline text-rose-300">•</span>}
                <strong className="text-white font-bold">{alert.type} #{alert.number}</strong>
                <span>
                  {alert.isExpired 
                    ? 'telah kadaluarsa!' 
                    : `akan berakhir dalam ${alert.monthsRemaining} bulan kedepan (${alert.expiryDate}).`}
                </span>
              </span>
            ))}
            <span className="text-amber-200 font-bold hidden md:inline">
              Mohon melakukan pengurusan segera ke Komite Medis / Sub-Komite Kredensial.
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/staff-privileges')}
          className="px-3 py-1.5 rounded-lg bg-white text-rose-800 hover:bg-rose-50 font-black text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
          title="Buka Halaman Kredensial & Hak Klinis"
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Perbarui Berkas</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 text-rose-100 hover:text-white transition-colors cursor-pointer"
          title="Tutup Sementara Peringatan Ini"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
