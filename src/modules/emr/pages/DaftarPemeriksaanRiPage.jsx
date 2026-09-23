import React, { useState, useMemo } from 'react';
import { 
  Building2, Stethoscope, Bed, AlertCircle, CheckCircle2, Clock, 
  Search, Filter, Calendar, Scissors, Eye, Plus, ArrowLeft, HeartPulse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function DaftarPemeriksaanRiPage() {
  const navigate = useNavigate();
  const { selectPatient } = usePatientStore();
  const { setLiveContext } = useEncounterStore();

  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [inpatientList, setInpatientList] = useState(() => emrSupportingDocsService.getInpatientWorklist());

  const wards = [
    'Bangsal Melati',
    'Bangsal Bougenville',
    'Intensive Care Unit (ICU)',
    'Paviliun Garuda'
  ];

  const filteredList = useMemo(() => {
    return inpatientList.filter(item => {
      if (selectedWard !== 'ALL' && item.ward !== selectedWard) return false;
      if (selectedStatus !== 'ALL' && item.cpptStatusToday !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (item.patientName || '').toLowerCase().includes(q) ||
          (item.mrn || '').toLowerCase().includes(q) ||
          (item.room || '').toLowerCase().includes(q) ||
          (item.bed || '').toLowerCase().includes(q) ||
          (item.diagnosis || '').toLowerCase().includes(q) ||
          (item.dpjp || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [inpatientList, selectedWard, selectedStatus, searchQuery]);

  // Aggregates
  const totalInpatients = inpatientList.length;
  const unvisitedCount = inpatientList.filter(p => p.cpptStatusToday === 'BELUM_VISITE').length;
  const highAcuityCount = inpatientList.filter(p => p.acuityLevel === 'HIGH_RISK').length;
  const avgLos = (inpatientList.reduce((acc, p) => acc + p.los, 0) / inpatientList.length).toFixed(1);

  const handleStartVisite = (patientItem) => {
    selectPatient(patientItem.mrn);
    setLiveContext(patientItem.mrn, `ENC-RI-${patientItem.id}`);
    toast.success(`Membuka CPPT Visite Rawat Inap untuk ${patientItem.patientName}`);
    navigate('/emr/catatan-terintegrasi');
  };

  const handleOpenAnesthesia = (patientItem) => {
    selectPatient(patientItem.mrn);
    navigate('/emr-ri/catatan-anestesi');
  };

  const handleOpenChart = (patientItem) => {
    selectPatient(patientItem.mrn);
    navigate('/patient-chart');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emr')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Kembali ke EMR Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Daftar Pemeriksaan Rawat Inap (EMR RI)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-black uppercase">
                Monitoring Bangsal & Visite
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Worklist Pasien Rawat Inap, Status Visite DPJP, Skor EWS & Catatan Asuhan Bangsal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/emr-ri/catatan-anestesi')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-purple-600" />
            <span>Catatan Anestesi (IBS)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Pasien Dirawat</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalInpatients}</span>
            <span className="text-xs text-slate-500">Pasien Bangsal</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-amber-500 block mb-1">Belum Visite Hari Ini</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{unvisitedCount}</span>
            <span className="text-xs text-slate-500">Perlu Visite DPJP</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-rose-500 block mb-1">Acuity Tinggi / EWS Alert</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{highAcuityCount}</span>
            <span className="text-xs text-slate-500">Pengawasan Ketat</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-500 block mb-1">Rata-rata Length of Stay</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgLos}</span>
            <span className="text-xs text-slate-500">Hari Rawat</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Bangsal & Ruang</option>
            {wards.map(w => <option key={w} value={w}>{w}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Status Visite</option>
            <option value="BELUM_VISITE">Belum Visite Hari Ini</option>
            <option value="SUDAH_VISITE">Sudah Visite</option>
          </select>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pasien, kamar, bed, DPJP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#015C80]"
          />
        </div>
      </div>

      {/* Inpatient Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Kamar & Bed</th>
                <th className="p-4">Pasien & Rekam Medis</th>
                <th className="p-4">DPJP Utama</th>
                <th className="p-4">Admisi & LOS</th>
                <th className="p-4">Diagnosis Utama</th>
                <th className="p-4 text-center">Acuity / EWS</th>
                <th className="p-4">Status Visite Hari Ini</th>
                <th className="p-4 text-center">Aksi Asuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 whitespace-nowrap">
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">{item.room} • {item.bed}</p>
                    <span className="text-[10px] text-slate-400 font-bold block">{item.ward} ({item.classType})</span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{item.patientName}</p>
                    <span className="font-mono text-[10px] text-slate-400">{item.mrn}</span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{item.dpjp}</p>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.admissionDate}</p>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold">
                      LOS: {item.los} Hari
                    </span>
                  </td>

                  <td className="p-4 max-w-xs">
                    <p className="truncate text-slate-800 dark:text-slate-200 font-medium" title={item.diagnosis}>
                      {item.diagnosis}
                    </p>
                  </td>

                  <td className="p-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-xl font-mono font-black text-xs ${
                      item.acuityLevel === 'HIGH_RISK' ? 'bg-rose-600 text-white animate-pulse' :
                      item.acuityLevel === 'MEDIUM_RISK' ? 'bg-amber-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      EWS {item.acuityScore}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase flex items-center gap-1 w-fit ${
                      item.cpptStatusToday === 'SUDAH_VISITE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {item.cpptStatusToday === 'SUDAH_VISITE' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SUDAH VISITE</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>BELUM VISITE</span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartVisite(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#015C80] hover:bg-[#014c6a] text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Tulis Lembar Visite CPPT Rawat Inap"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Visite CPPT</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAnesthesia(item)}
                        className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 cursor-pointer"
                        title="Buka Catatan Anestesi & Bedah"
                      >
                        <Scissors className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenChart(item)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 cursor-pointer"
                        title="Buka Rekam Medis Longitudinal Pasien"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
