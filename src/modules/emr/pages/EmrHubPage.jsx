import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Files, FileUp, GitFork, ClipboardList, Users, BarChart3, 
  Building2, Scissors, Stethoscope, ArrowRight, ShieldCheck, 
  CheckCircle2, Clock, AlertTriangle, Pill, Activity, Eye
} from 'lucide-react';

import DokterDocumentAlertBanner from '../components/DokterDocumentAlertBanner.jsx';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';

export default function EmrHubPage() {
  const navigate = useNavigate();

  const pendingPrescriptions = emrSupportingDocsService.getPendingOnlinePrescriptionsCount();
  const currentShift = emrSupportingDocsService.getCurrentHospitalShift();

  const emrFeatureCards = [
    {
      title: 'Upload Dokumen Penunjang',
      subtitle: 'Laboratorium, Radiologi, EKG, Patologi, & Rujukan Luar Faskes',
      icon: <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      path: '/emr/upload-penunjang',
      badge: 'Permenkes 24/2022',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
      actionLabel: 'Buka Arsip Penunjang'
    },
    {
      title: 'Rujukan & Konsultasi Internal',
      subtitle: 'Koordinasi Klinis Antar-SMF / Spesialis / Poliklinik Rumah Sakit',
      icon: <GitFork className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      path: '/emr/rujukan-internal',
      badge: 'JCI COP.2.1',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
      actionLabel: 'Buka Hub Rujukan'
    },
    {
      title: 'Catatan Terintegrasi (CPPT)',
      subtitle: 'Lembar Perkembangan Pasien Multi-PPA (Dokter, Perawat, Farmasi, Gizi)',
      icon: <ClipboardList className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      path: '/emr/catatan-terintegrasi',
      badge: 'SNARS Ed.2',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
      actionLabel: 'Buka Lembar CPPT'
    },
    {
      title: 'Daftar Pemeriksaan RJ (Rawat Jalan)',
      subtitle: 'Antrean Poliklinik Real-Time, TTV Pasien, & 1-Klik Konsultasi SOAP',
      icon: <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
      path: '/emr-rj',
      badge: 'EMR Rawat Jalan',
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
      actionLabel: 'Buka Antrean RJ'
    },
    {
      title: 'Laporan Bulanan UGD',
      subtitle: 'Statistik Kunjungan, Waktu Tanggap Triase, ICD-10, & Disposisi Pasien',
      icon: <BarChart3 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      path: '/emr-rj/laporan-ugd',
      badge: 'Kemenkes RL 5.1',
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      actionLabel: 'Lihat Laporan UGD'
    },
    {
      title: 'Daftar Pemeriksaan RI (Rawat Inap)',
      subtitle: 'Monitoring Bangsal, Kamar & Bed, DPJP Utama, LOS, & Skor EWS',
      icon: <Building2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      path: '/emr-ri',
      badge: 'EMR Rawat Inap',
      badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
      actionLabel: 'Buka Bangsal RI'
    },
    {
      title: 'Catatan Anestesi & Sedasi',
      subtitle: 'Dokumentasi Pra-Anestesi (ASA), Intra-Operasi IBS, & Aldrete PACU',
      icon: <Scissors className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      path: '/emr-ri/catatan-anestesi',
      badge: 'JCI ASC.3 / 7.4',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
      actionLabel: 'Buka Rekam Anestesi'
    },
    {
      title: 'Unified Patient Chart (EMR Lengkap)',
      subtitle: 'Dossier Rekam Medis Pasien Longitudinal dengan 34 Formulir Klinis JCI',
      icon: <Files className="w-6 h-6 text-[#015C80] dark:text-cyan-400" />,
      path: '/patient-chart',
      badge: 'Longitudinal Record',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
      actionLabel: 'Buka Patient Chart'
    }
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* 1. Banner Alert Dokumen Dokter (SIP & STR) */}
      <DokterDocumentAlertBanner />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300 w-full">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-lg shadow-[#015C80]/30">
              <Files className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Pusat Kendali Rekam Medis Elektronik (EMR Hub)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                  ENTERPRISE HIS 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pintu Masuk Terpadu Pelayanan Rawat Jalan (RJ), Rawat Inap (RI), Penunjang, Rujukan & CPPT
              </p>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-700 dark:text-slate-200">{currentShift.label}</span>
            </div>

            <div 
              onClick={() => navigate('/pharmacy-enterprise')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-all shadow-2xs"
              title="Klik untuk membuka antrean resep farmasi"
            >
              <Pill className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Resep Online: <strong>{pendingPrescriptions} Pending</strong></span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {emrFeatureCards.map((card) => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#015C80] dark:hover:border-cyan-500 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-[#015C80] dark:group-hover:text-cyan-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {card.subtitle}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#015C80] dark:text-cyan-400">
                <span>{card.actionLabel}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Fast Action Guidance Box */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/60 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold">
              STANDAR AKREDITASI RUMAH SAKIT 2026
            </span>
            <h4 className="text-base font-black">
              Seluruh Rekam Medis Terhubung Secara Waktu-Nyata (Zero Redundant Entry)
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl">
              Catatan SOAP, hasil pemeriksaan penunjang lab/radiologi, rujukan konsultasi, dan visite bangsal langsung disinkronisasi ke Patient Chart terpadu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/patient-chart')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 whitespace-nowrap cursor-pointer transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Buka Berkas Longitudinal Pasien</span>
          </button>
        </div>
      </div>
    </div>
  );
}
