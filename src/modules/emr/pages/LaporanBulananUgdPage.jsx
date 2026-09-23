import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Calendar, Download, Printer, ArrowLeft, ShieldAlert,
  Activity, Users, HeartPulse, Clock, FileText, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';
import toast from 'react-hot-toast';

export default function LaporanBulananUgdPage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const reportData = useMemo(() => {
    return emrSupportingDocsService.getMonthlyUgdReport(selectedMonth);
  }, [selectedMonth]);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Peringkat,Kode ICD-10,Diagnosis Penyakit,Jumlah Kasus\n"
      + reportData.top10Diagnoses.map(d => `${d.rank},${d.icd10},"${d.name}",${d.count}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Bulanan_UGD_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan bulanan UGD berhasil diekspor ke CSV!');
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
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Laporan Bulanan UGD (Instalasi Gawat Darurat)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-black uppercase">
                Kemenkes RL 5.1 & Akreditasi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Statistik Kunjungan, Waktu Tanggap Triase, Distribusi Kasus, dan Disposisi Pasien IGD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="2026-08">Agustus 2026</option>
              <option value="2026-07">Juli 2026</option>
              <option value="2026-06">Juni 2026</option>
              <option value="2026-05">Mei 2026</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-black bg-[#015C80] hover:bg-[#014c6a] text-white flex items-center gap-1.5 shadow-md shadow-[#015C80]/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase">Total Kunjungan IGD</span>
            <Users className="w-4 h-4 text-[#015C80]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {reportData.totalVisits.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500 font-bold">Pasien</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
            ↑ 4.2% dibanding bulan lalu
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase">Rata-rata Waktu Tanggap</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {reportData.averageResponseTimeMinutes}
            </span>
            <span className="text-xs text-slate-500 font-bold">Menit</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Standar Standar Triase: &lt; 5 Menit (Tercapai)
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase">CPR & Resusitasi Sukses</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {reportData.cprSuccessRate}
            </span>
            <span className="text-xs text-slate-500 font-bold">ROSC</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            44 dari 48 kasus henti jantung tertangani
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase">Admisi ke Rawat Inap</span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              27.8%
            </span>
            <span className="text-xs text-slate-500 font-bold">412 Pasien</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Tingkat konversi admisi IGD standar
          </span>
        </div>
      </div>

      {/* Grid 2 Kolom: Triase & Disposisi Pasien */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribusi Triase */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Distribusi Kategori Triase (ATS / ESI)
              </h3>
              <p className="text-[11px] text-slate-400">Tingkat kegawatan pasien saat masuk IGD</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px]">
              100% TERTRIASE
            </span>
          </div>

          <div className="space-y-3">
            {reportData.triageBreakdown.map((t) => (
              <div key={t.level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.level}</span>
                  <span className="font-mono text-slate-500 font-bold">{t.count} Pasien ({t.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full ${t.color} rounded-full transition-all duration-500`}
                    style={{ width: `${t.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disposisi Kepulangan Pasien */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Hasil Akhir & Disposisi Pasien IGD
              </h3>
              <p className="text-[11px] text-slate-400">Status keluar pasien setelah penanganan gawat darurat</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px]">
              TOTAL: {reportData.totalVisits}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {reportData.dispositionBreakdown.map((d) => (
              <div key={d.label} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{d.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{d.count} Pasien</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500">
                    {d.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10 Besar Diagnosis ICD-10 IGD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              10 Besar Diagnosis Morbiditas Pasien UGD (Top 10 ICD-10)
            </h3>
            <p className="text-[11px] text-slate-400">Penyakit terbanyak yang ditangani instalasi gawat darurat periode ini</p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black">
            Kemenkes SIRS Online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="p-3 text-center">Peringkat</th>
                <th className="p-3">Kode ICD-10</th>
                <th className="p-3">Nama Diagnosis Medis</th>
                <th className="p-3 text-right">Jumlah Kasus</th>
                <th className="p-3 text-right">Persentase (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {reportData.top10Diagnoses.map((diag) => {
                const pct = ((diag.count / reportData.totalVisits) * 100).toFixed(1);
                return (
                  <tr key={diag.rank} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-center">
                      <span className={`inline-block w-6 h-6 rounded-full font-black text-xs leading-6 ${
                        diag.rank === 1 ? 'bg-amber-400 text-slate-900' :
                        diag.rank === 2 ? 'bg-slate-300 text-slate-900' :
                        diag.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {diag.rank}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {diag.icd10}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {diag.name}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {diag.count} Kasus
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
