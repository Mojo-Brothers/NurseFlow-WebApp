import React, { useState } from 'react';
import { X, User, MapPin, Phone, Mail, FileText, CheckCircle2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { DEMO_PATIENTS } from '../../../core/demoData.js';

export default function PatientDetailDrawerModal({ isOpen, onClose, patient }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen || !patient) return null;

  const patientName = patient?.name || patient?.nama || 'Pasien Tanpa Nama';
  const patientMrn = patient?.mrn || patient?.medical_record_no || '-';
  const patientNik = patient?.nik || patient?.identity_number || '-';
  const patientDob = patient?.dob || patient?.birth_date || '-';
  const patientGender = patient?.gender === 'F' || patient?.gender === 'Perempuan' ? 'Perempuan' : 'Laki-laki';
  const patientPhone = patient?.phone || patient?.mobile_phone || '-';
  const patientEmail = patient?.email || '-';
  const patientAddress = patient?.address || '-';
  const bloodType = patient?.blood_type || '-';
  const maritalStatus = patient?.marital_status || '-';
  const religion = patient?.religion || '-';

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} tersalin ke clipboard!`, {
      duration: 2000,
      icon: '📋',
      style: {
        borderRadius: '10px',
        background: '#0f172a',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Right Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-surface dark:bg-slate-900 shadow-2xl border-l border-outline-variant/30 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-outline-variant/20 bg-surface-container-low dark:bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-primary">
              <User size={20} />
              <div>
                <h3 className="font-black text-sm text-on-surface">Detail Info Pasien (Side Inspector)</h3>
                <p className="text-[10px] text-on-surface-variant font-medium">Informasi Rekam Medis Indikatif & Demografi</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-error/10 hover:text-error flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
            
            {/* Patient Header Hero Card */}
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-2 relative">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-primary text-xs">MRN: {patientMrn}</span>
                  <button 
                    onClick={() => handleCopy(patientMrn, 'MRN')} 
                    title="Copy MRN" 
                    className="p-1 text-primary hover:bg-primary/20 rounded transition-colors cursor-pointer"
                  >
                    {copiedField === 'MRN' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
                <span className="px-2.5 py-0.5 bg-primary text-on-primary font-extrabold text-[10px] rounded-full">
                  {patientGender}
                </span>
              </div>
              <h4 className="font-black text-lg text-on-surface tracking-tight">{patientName}</h4>
              <p className="text-xs text-on-surface-variant font-medium">
                Tgl Lahir: {patientDob} ({calculateAge(patientDob)} Thn) • Gol. Darah: <strong className="text-rose-600">{bloodType}</strong>
              </p>
            </div>

            {/* Section 1: Identitas Resmi */}
            <div className="space-y-2.5 border-b border-outline-variant/20 pb-4">
              <h5 className="font-extrabold text-[11px] uppercase text-primary tracking-wider flex items-center gap-1.5">
                <FileText size={14} /> Identitas Kependudukan
              </h5>
              
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2 font-medium">
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">NIK (KTP):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-on-surface">{patientNik}</span>
                    <button 
                      onClick={() => handleCopy(patientNik, 'NIK')} 
                      title="Copy NIK" 
                      className="p-1 hover:bg-surface-container-high rounded text-primary transition-colors cursor-pointer"
                    >
                      {copiedField === 'NIK' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Status Perkawinan:</span>
                  <span className="font-bold text-on-surface">{maritalStatus}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Agama:</span>
                  <span className="font-bold text-on-surface">{religion}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Alamat Domisili */}
            <div className="space-y-2.5 border-b border-outline-variant/20 pb-4">
              <h5 className="font-extrabold text-[11px] uppercase text-primary tracking-wider flex items-center gap-1.5">
                <MapPin size={14} /> Alamat & Tempat Tinggal
              </h5>
              
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2 font-medium">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant text-[10px] block mb-0.5">Alamat Lengkap:</span>
                    <button 
                      onClick={() => handleCopy(patientAddress, 'Alamat')} 
                      title="Copy Alamat" 
                      className="p-1 hover:bg-surface-container-high rounded text-primary transition-colors cursor-pointer"
                    >
                      {copiedField === 'Alamat' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <span className="font-bold text-on-surface leading-snug block">{patientAddress}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-outline-variant/10">
                  <span className="text-on-surface-variant">Kota / Kabupaten:</span>
                  <span className="font-bold text-on-surface">Jakarta Timur</span>
                </div>
                <div className="flex justify-between py-1 border-t border-outline-variant/10">
                  <span className="text-on-surface-variant">Provinsi & Negara:</span>
                  <span className="font-bold text-on-surface">DKI Jakarta, INDONESIA</span>
                </div>
              </div>
            </div>

            {/* Section 3: Kontak & Komunikasi */}
            <div className="space-y-2.5">
              <h5 className="font-extrabold text-[11px] uppercase text-primary tracking-wider flex items-center gap-1.5">
                <Phone size={14} /> Kontak Darurat & Komunikasi
              </h5>
              
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 space-y-2 font-medium">
                <div className="flex justify-between items-center py-1 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant">Ponsel / WhatsApp:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={13} /> {patientPhone}
                    </span>
                    <button 
                      onClick={() => handleCopy(patientPhone, 'Nomor HP')} 
                      title="Copy No. HP" 
                      className="p-1 hover:bg-surface-container-high rounded text-emerald-600 transition-colors cursor-pointer"
                    >
                      {copiedField === 'Nomor HP' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-on-surface-variant">Email Terdaftar:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-on-surface truncate max-w-[180px]">{patientEmail}</span>
                    <button 
                      onClick={() => handleCopy(patientEmail, 'Email')} 
                      title="Copy Email" 
                      className="p-1 hover:bg-surface-container-high rounded text-primary transition-colors cursor-pointer"
                    >
                      {copiedField === 'Email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low dark:bg-slate-800/80 flex justify-end">
            <button 
              onClick={onClose} 
              className="px-6 py-2 bg-primary hover:bg-primary-hover text-on-primary font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Tutup Panel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
