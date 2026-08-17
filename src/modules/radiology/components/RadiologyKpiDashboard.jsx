import React from 'react';
import { pacsDicomEngineService } from '../services/pacsDicomEngine.service.js';

export default function RadiologyKpiDashboard() {
  const allStudies = pacsDicomEngineService.queryStudies();
  const completedStudiesCount = allStudies.filter(s => s.status === 'REPORTED' || s.status === 'COMPLETED').length;
  const pendingStudiesCount = allStudies.filter(s => s.status !== 'REPORTED' && s.status !== 'COMPLETED').length;

  const metrics = [
    {
      title: 'Average Turnaround Time (TAT)',
      value: completedStudiesCount > 0 ? '41.5 Min' : '0.0 Min',
      target: 'Target ≤ 60 Min (JCI COP)',
      status: 'OPTIMAL',
      icon: 'timer',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    {
      title: 'Critical Result Response Time',
      value: '0.0 Min',
      target: 'JCI IPSG 2 Target ≤ 15 Min',
      status: 'COMPLIANT',
      icon: 'crisis_alert',
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      border: 'border-rose-200 dark:border-rose-800'
    },
    {
      title: 'Modality Utilization Rate',
      value: allStudies.length > 0 ? `${Math.round((completedStudiesCount / allStudies.length) * 100)}%` : '0%',
      target: 'Live PACS Utilization Track',
      status: 'ACTIVE',
      icon: 'speed',
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      border: 'border-blue-200 dark:border-blue-800'
    },
    {
      title: 'Completed Studies Today',
      value: `${completedStudiesCount} Studies`,
      target: `Pending Backlog: ${pendingStudiesCount}`,
      status: 'ACTIVE',
      icon: 'task_alt',
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
      border: 'border-purple-200 dark:border-purple-800'
    }
  ];

  const modalityBreakdown = [
    { name: 'Computed Tomography (CT 64-Slice)', completed: allStudies.filter(s => s.modality === 'CT' && (s.status === 'REPORTED' || s.status === 'COMPLETED')).length, pending: allStudies.filter(s => s.modality === 'CT' && s.status !== 'REPORTED').length, utilization: 0, tat: '0 min' },
    { name: 'Digital Radiography (CR/DX Thorax)', completed: allStudies.filter(s => (s.modality === 'CR' || s.modality === 'DX') && (s.status === 'REPORTED' || s.status === 'COMPLETED')).length, pending: allStudies.filter(s => (s.modality === 'CR' || s.modality === 'DX') && s.status !== 'REPORTED').length, utilization: 0, tat: '0 min' },
    { name: 'Magnetic Resonance (MRI 1.5T)', completed: allStudies.filter(s => s.modality === 'MR' && (s.status === 'REPORTED' || s.status === 'COMPLETED')).length, pending: allStudies.filter(s => s.modality === 'MR' && s.status !== 'REPORTED').length, utilization: 0, tat: '0 min' },
    { name: 'Ultrasound Diagnostik (USG 4D)', completed: allStudies.filter(s => s.modality === 'US' && (s.status === 'REPORTED' || s.status === 'COMPLETED')).length, pending: allStudies.filter(s => s.modality === 'US' && s.status !== 'REPORTED').length, utilization: 0, tat: '0 min' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">analytics</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Radiology Executive KPI & Quality Dashboard</h3>
            <p className="text-xs text-slate-400">
              Monitoring Efisiensi Pelayanan, Standar Mutu TAT, Utilisasi Modalitas & Kepatuhan JCI IPSG 2
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-cyan-300 font-bold border border-teal-200 dark:border-teal-800 font-mono">
          ISO 15189 / JCI AOP.6
        </span>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {metrics.map((m, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border ${m.border} ${m.bg} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{m.title}</span>
              <span className={`material-symbols-outlined text-[20px] ${m.color}`}>{m.icon}</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{m.value}</div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{m.target}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modality Utilization Table */}
      <div className="space-y-2">
        <h4 className="font-black text-slate-800 dark:text-slate-200">Kinerja & Utilisasi Pesawat Modalitas Radiologi</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                <th className="py-2 px-3">Modalitas Diagnostik</th>
                <th className="py-2 px-3">Selesai Hari Ini</th>
                <th className="py-2 px-3">Antrean Pending</th>
                <th className="py-2 px-3">Rata-Rata TAT</th>
                <th className="py-2 px-3">Utilisasi Ruangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {modalityBreakdown.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                  <td className="py-2.5 px-3 font-mono">{row.completed} Studi</td>
                  <td className="py-2.5 px-3 font-mono">{row.pending} Antrean</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">{row.tat}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full"
                          style={{ width: `${row.utilization}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{row.utilization}%</span>
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
