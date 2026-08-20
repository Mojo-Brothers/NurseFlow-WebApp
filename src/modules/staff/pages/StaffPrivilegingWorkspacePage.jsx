import React, { useState, useEffect } from 'react';
import { STAFF_CATEGORIES, PRIVILEGE_LEVELS } from '../constants/staff.constants.js';
import { apiClient } from '../../../core/apiClient.js';
import toast from 'react-hot-toast';

export default function StaffPrivilegingWorkspacePage() {
  const [staffList, setStaffList] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [activeTab, setActiveTab] = useState('DIRECTORY'); // 'DIRECTORY' | 'CREDENTIALS' | 'PRIVILEGES' | 'ROSTER' | 'AUTHORIZER'

  useEffect(() => {
    async function loadData() {
      const res = await apiClient.staffPrivileges.getStaff();
      if (res.ok && res.data?.data) {
        setStaffList(res.data.data);
      }
    }
    loadData();
  }, []);

  // Evaluation Form State
  const [evalStaffId, setEvalStaffId] = useState('');
  const [evalProcedureCode, setEvalProcedureCode] = useState('PROC-LAP-APP');
  const [evalTargetUnit, setEvalTargetUnit] = useState('DEPT-IBS-BEDAH');
  const [evalResult, setEvalResult] = useState(null);

  // New Clinician Form
  const [staffName, setStaffName] = useState('');
  const [staffCategory, setStaffCategory] = useState(STAFF_CATEGORIES.SPECIALIST_DOCTOR);
  const [specialty, setSpecialty] = useState('Bedah Digestif');
  const [departmentId, setDepartmentId] = useState('DEPT-IBS-BEDAH');

  const handleRegisterStaff = (e) => {
    e.preventDefault();
    try {
      const profile = staffSchedulingService.registerStaffProfile({
        fullName: staffName,
        staffCategory,
        primarySpecialty: specialty,
        primaryDepartmentId: departmentId,
        employmentStatus: 'PERMANENT',
        isActive: true
      });

      // Default active STR & SIP for demo ease
      staffSchedulingService.registerCredential({
        staffId: profile.id,
        credentialType: 'STR',
        credentialNumber: `STR-KKI-${Math.floor(Math.random() * 9000000 + 1000000)}`,
        issuingAuthority: 'Konsil Kedokteran Indonesia (KKI)',
        issuedAt: '2024-01-01',
        validFrom: '2024-01-01',
        validUntil: '2029-01-01',
        verificationStatus: 'ACTIVE_VERIFIED'
      });

      staffSchedulingService.registerCredential({
        staffId: profile.id,
        credentialType: 'SIP',
        credentialNumber: `SIP-DINKES-JKT-${Math.floor(Math.random() * 9000 + 1000)}`,
        issuingAuthority: 'Dinas Kesehatan DKI Jakarta',
        issuedAt: '2024-01-01',
        validFrom: '2024-01-01',
        validUntil: '2028-01-01',
        verificationStatus: 'ACTIVE_VERIFIED'
      });

      setStaffList(Array.from(staffSchedulingService.staffProfiles.values()));
      setCredentials(Array.from(staffSchedulingService.credentials.values()));
      toast.success(`Klinisi ${profile.fullName} berhasil didaftarkan dengan STR & SIP aktif!`);
      setStaffName('');
    } catch (err) {
      toast.error(`Registrasi staf gagal: ${err.message}`);
    }
  };

  const handleEvaluateAuthorization = (e) => {
    e.preventDefault();
    if (!evalStaffId) {
      toast.error('Pilih klinisi terlebih dahulu!');
      return;
    }

    try {
      const decision = staffSchedulingService.evaluateClinicalAuthorization({
        staffId: evalStaffId,
        procedureCode: evalProcedureCode,
        targetUnitId: evalTargetUnit,
        evaluationTimestamp: new Date()
      });

      setEvalResult(decision);

      if (decision.isAuthorized) {
        toast.success(`✅ OTORISASI DIIZINKAN: Klinisi berwenang penuh melaksanakan ${evalProcedureCode}`);
      } else {
        toast.error(`❌ OTORISASI DITOLAK: ${decision.denialReason}`, { duration: 5000 });
      }
    } catch (err) {
      toast.error(`Evaluasi gagal: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
              <span className="material-symbols-outlined text-[24px]">badge</span>
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Workforce, Credentialing & Clinical Privileging
              </h1>
              <p className="text-xs text-slate-500">
                Standar KARS KPS & Permenkes No. 755/2011 (Komite Medik & SPK/RKK)
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'DIRECTORY', label: 'Direktori Staf', icon: 'groups' },
            { id: 'CREDENTIALS', label: 'STR & SIP Lisensi', icon: 'verified' },
            { id: 'AUTHORIZER', label: 'Mesin Otorisasi Klinis', icon: 'security' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'DIRECTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">person_add</span>
              Registrasi Klinisi Baru
            </h2>

            <form onSubmit={handleRegisterStaff} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: dr. Ahmad, Sp.OG"
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Kategori Profesi</label>
                <select
                  value={staffCategory}
                  onChange={e => setStaffCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="SPECIALIST_DOCTOR">Dokter Spesialis / Subspesialis</option>
                  <option value="GENERAL_PRACTITIONER">Dokter Umum (GP)</option>
                  <option value="REGISTERED_NURSE">Perawat Teregistrasi (Ners)</option>
                  <option value="CLINICAL_PHARMACIST">Apoteker Klinis</option>
                  <option value="LAB_TECHNICIAN">Pranata Lab Kesehatan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Spesialisasi</label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Departemen Induk</label>
                  <input
                    type="text"
                    value={departmentId}
                    onChange={e => setDepartmentId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                + Simpan Profil Klinisi
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">list_alt</span>
              Direktori Tenaga Medis ({staffList.length})
            </h2>

            <div className="space-y-2">
              {staffList.map(s => (
                <div key={s.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {s.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{s.fullName}</span>
                      <span className="text-[11px] text-slate-500">{s.staffCategory} • {s.primarySpecialty} ({s.primaryDepartmentId})</span>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                    ACTIVE PERMANENT
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 5-Factor Clinical Authorization Engine Simulator */}
      {activeTab === 'AUTHORIZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">gavel</span>
              Evaluator Kewenangan Tindakan Klinis (Point-in-Time)
            </h2>

            <form onSubmit={handleEvaluateAuthorization} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Klinisi / Pelaksana Tindakan</label>
                <select
                  value={evalStaffId}
                  onChange={e => setEvalStaffId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Pilih Klinisi --</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.primarySpecialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Kode Tindakan / Prosedur Klinis</label>
                <select
                  value={evalProcedureCode}
                  onChange={e => setEvalProcedureCode(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="PROC-LAP-APP">PROC-LAP-APP: Laparoscopic Appendectomy</option>
                  <option value="PROC-SECTIO-CAESAREA">PROC-SECTIO-CAESAREA: Sectio Caesarea</option>
                  <option value="PROC-BLOOD-TRANSFUSION">PROC-BLOOD-TRANSFUSION: Pemberian Transfusi Darah</option>
                  <option value="PROC-CABG-OPEN-HEART">PROC-CABG-OPEN-HEART: Coronary Artery Bypass Graft</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Lokasi / Unit Tindakan</label>
                <select
                  value={evalTargetUnit}
                  onChange={e => setEvalTargetUnit(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                >
                  <option value="DEPT-IBS-BEDAH">DEPT-IBS-BEDAH: Instalasi Bedah Sentral (OK)</option>
                  <option value="DEPT-ICU-SENTRAL">DEPT-ICU-SENTRAL: Intensive Care Unit</option>
                  <option value="DEPT-IGD-EMERGENCY">DEPT-IGD-EMERGENCY: Instalasi Gawat Darurat</option>
                  <option value="DEPT-RADIOLOGY-CATHLAB">DEPT-RADIOLOGY-CATHLAB: Cath Lab Jantung</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                🔍 Evaluasi 5-Faktor Otorisasi Klinis
              </button>
            </form>
          </div>

          {/* Decision Outcome Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">policy</span>
              Hasil Keputusan Otorisasi Real-Time
            </h2>

            {evalResult ? (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                evalResult.isAuthorized
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Keputusan:</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                    evalResult.isAuthorized ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}>
                    {evalResult.authorizationDecision}
                  </span>
                </div>

                {!evalResult.isAuthorized && (
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold">
                    Alasan Penolakan: {evalResult.denialReason}
                  </div>
                )}

                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                  <div>Waktu Evaluasi: {evalResult.evaluatedAt}</div>
                  <div>Prosedur: {evalResult.procedureCode}</div>
                  <div>Unit Target: {evalResult.targetUnitId}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Pilih klinisi dan tindakan di sebelah kiri, lalu klik tombol Evaluasi.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
