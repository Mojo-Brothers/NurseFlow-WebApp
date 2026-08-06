import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth/auth.store.js';
import { useAppointmentStore } from '../appointment.store.js';
import toast from 'react-hot-toast';

const DUMMY_CLINICS = ['POLI JANTUNG DAN PEMBULUH DARAH', 'POLI UMUM', 'POLI KANDUNGAN', 'POLI ANAK'];
const CHANNELS = ['PRIMAYAAPP', 'Walk-in', 'Mobile App', 'WhatsApp', 'KiosK'];

export default function BookingModal({ isOpen, onClose, slotData }) {
  const { currentUser } = useAuthStore();
  const { addAppointment, isLoading } = useAppointmentStore();

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientType: 'NEW',
    clinic: DUMMY_CLINICS[0],
    doctor: '',
    date: '',
    time: '',
    serviceType: 'REGULAR',
    channel: 'PRIMAYAAPP',
    isReferral: false,
    referralSource: '',
    useInsurance: false,
    insuranceProvider: 'BPJS',
    notes: '',
    emailResult: false,
    verified: false
  });

  useEffect(() => {
    if (slotData && isOpen) {
      setFormData(prev => ({
        ...prev,
        date: slotData.date || '2026-08-07',
        time: slotData.time || '16:10',
        doctor: slotData.doctor || 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA',
        verified: false
      }));
    }
  }, [slotData, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const estimatedDuration = formData.patientType === 'NEW' ? 20 : 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.verified) {
      toast.error('Checklist apabila sudah Verifikasi');
      return;
    }

    try {
      await addAppointment({
        patient_name: formData.patientName,
        patient_phone: formData.patientPhone,
        patient_type: formData.patientType,
        clinic: formData.clinic,
        doctor: formData.doctor,
        schedule: {
          date: formData.date,
          start_time: formData.time,
          estimated_duration: estimatedDuration
        },
        service_type: formData.serviceType,
        channel: formData.channel,
        notes: formData.notes,
        email_result: formData.emailResult,
        referral: {
          is_referral: formData.isReferral,
          source_name: formData.isReferral ? formData.referralSource : null
        },
        insurance: {
          use_insurance: formData.useInsurance,
          provider: formData.useInsurance ? formData.insuranceProvider : null
        }
      }, currentUser?.email || 'system');
      
      toast.success('Pendaftaran Slot Waktu Berhasil Disimpan!');
      onClose();
    } catch (error) {
      toast.error('Gagal menyimpan slot: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-2xl">edit_calendar</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pilih Slot Waktu (Pendaftaran Pasien)
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Header info matching Legacy Screenshot 2 */}
            <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500">Dokter:</label>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{formData.doctor}</div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500">Poli / Dept:</label>
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{formData.clinic}</div>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Tanggal: </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formData.date}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">Estimasi waktu: </span>
                  <span className="font-extrabold text-teal-600 text-sm">{formData.time}</span>
                </div>
              </div>
              <div>
                <span className="inline-block px-3 py-1 bg-amber-500 text-white font-extrabold text-xs rounded uppercase tracking-wider">
                  {formData.serviceType === 'EKSEKUTIF' ? 'SLOT EKSEKUTIF' : 'SLOT REGULER'}
                </span>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Channel Pendaftaran:</label>
                <select name="channel" value={formData.channel} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold text-xs">
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lama / Baru:</label>
                <select name="patientType" value={formData.patientType} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-semibold text-xs">
                  <option value="NEW">Pasien Baru ({estimatedDuration} mnt)</option>
                  <option value="RETURNING">Pasien Lama ({estimatedDuration} mnt)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pasien *</label>
                <input required type="text" name="patientName" value={formData.patientName} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-xs" placeholder="Ketik Nama Pasien" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">No. HP / Ponsel *</label>
                <input required type="tel" name="patientPhone" value={formData.patientPhone} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-xs" placeholder="contoh: 081xxxxxxxx" />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dokter / RS Perujuk:</label>
                <div className="flex gap-2">
                  <input type="text" name="referralSource" value={formData.referralSource} onChange={handleChange} className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs" placeholder="Nama Perujuk" />
                  <button type="button" className="px-3 py-1 bg-slate-200 dark:bg-slate-700 font-bold rounded text-xs">Master Perujuk</button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Layanan:</label>
                <select name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-bold text-xs">
                  <option value="REGULAR">Reguler</option>
                  <option value="EKSEKUTIF">SLOT EKSEKUTIF</option>
                  <option value="TELEMEDICINE">Telemedicine</option>
                </select>
              </div>
            </div>

            {/* Email & Dispenser Buttons */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                <input type="checkbox" name="emailResult" checked={formData.emailResult} onChange={handleChange} className="rounded text-teal-600" />
                <span>Email Result (Kirim Default)</span>
              </label>
              <div className="flex gap-2">
                <button type="button" className="px-3 py-1 bg-cyan-600 text-white font-bold rounded text-xs">+ Dispenser Paket</button>
                <button type="button" className="px-3 py-1 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded text-xs">Reset Paket</button>
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Keterangan:</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs" placeholder="Catatan opsional..." />
            </div>

            {/* Verifikasi Checkbox (Mandatory) */}
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg flex items-center gap-3">
              <input required type="checkbox" name="verified" id="verified_check" checked={formData.verified} onChange={handleChange} className="w-4 h-4 rounded border-red-400 text-red-600 cursor-pointer" />
              <label htmlFor="verified_check" className="font-extrabold text-red-700 dark:text-red-300 cursor-pointer">
                Checklist apabila sudah Verifikasi
              </label>
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 sticky bottom-0 z-10">
          <button type="button" onClick={onClose} className="px-5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded cursor-pointer">
            Tutup
          </button>
          <button 
            type="submit" form="booking-form" 
            disabled={isLoading || !formData.verified}
            className="px-6 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1"
          >
            {isLoading ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">save</span>}
            Simpan
          </button>
        </div>

      </div>
    </div>
  );
}
