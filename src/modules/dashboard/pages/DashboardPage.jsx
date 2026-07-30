import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useLiveDashboard } from '../hooks/useLiveDashboard.js';
import { db } from '../../../core/firebase.js';
import { collection, setDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [isPrivacyShieldOn, setIsPrivacyShieldOn] = useState(false);
  const { metrics, activeTriage, auditLogs, isLoading } = useLiveDashboard();

  const handleSeedData = async () => {
    try {
      console.log("Seeding Hospital Dashboard Data...");
      try {
        const metricsRef = doc(db, 'system_metrics', 'main_facility');
        await setDoc(metricsRef, {
          triageLevels: { active: 14, l1: 3, l2: 5, l3: 6 },
          ventilators: { total: 24, available: 2 },
          bedOccupancy: { rate: 88 },
          lastUpdated: serverTimestamp()
        });
      } catch (metricErr) {
        console.warn("Could not seed system_metrics:", metricErr.message);
      }

      const batch = writeBatch(db);
      const triageRef1 = doc(collection(db, 'triage_logs'));
      batch.set(triageRef1, {
        assessed_by: currentUser.email,
        mrn: '8849201',
        name: 'Budi Santoso',
        dob: '12/05/1982',
        level: 1,
        statusLabel: 'Resuscitation',
        escalation_level: 'CRITICAL',
        overdueMs: 45000,
        timeline: ['Triage', 'ECG', 'Code Blue'],
        news2_score: 9,
        riskPercent: 84,
        vitals: { bp: '70/40', spo2: 88, hr: 130, temperature: 38.5 },
        cdsAction: 'Immediate Intubation',
        aclsRequired: true,
        viewedBy: currentUser.email
      });

      const triageRef2 = doc(collection(db, 'triage_logs'));
      batch.set(triageRef2, {
        assessed_by: currentUser.email,
        mrn: '4192083',
        name: 'Siti Aminah',
        dob: '08/22/1975',
        level: 2,
        statusLabel: 'Emergent',
        escalation_level: 'URGENT',
        overdueMs: 0,
        timeline: ['Triage', 'Imaging', 'Pending Labs'],
        news2_score: 6,
        riskPercent: 45,
        vitals: { bp: '160/95', spo2: 94, hr: 105, temperature: 37.2 },
        cdsAction: 'Stroke Protocol Review',
        aclsRequired: false,
        viewedBy: currentUser.email
      });

      const logRef1 = doc(collection(db, 'audit_logs'));
      batch.set(logRef1, {
        severity: 'CRITICAL',
        timestamp: serverTimestamp(),
        user: currentUser.email,
        action: 'Authorized emergency blood release for 8849201.'
      });

      const logRef2 = doc(collection(db, 'audit_logs'));
      batch.set(logRef2, {
        severity: 'URGENT',
        timestamp: serverTimestamp(),
        user: currentUser.email,
        action: 'Acknowledged critical lab results for 4192083.'
      });

      await batch.commit();
      alert('Seed Data Success!');
    } catch (e) {
      console.error(e);
      alert('Error seeding data: ' + e.message);
    }
  };

  return (
    <div className="p-6 lg:p-10 flex-column gap-8 w-full bg-surface">
      {/* Top Bar / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-outline pb-4">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface">
            {t('dashboard_v2.title')}
          </h2>
          <p className="font-body text-sm font-semibold text-on-surface-variant mt-1 uppercase tracking-widest">
            {t('dashboard_v2.subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-row items-center gap-4">
          <button 
            onClick={() => setIsPrivacyShieldOn(!isPrivacyShieldOn)}
            className={`flex flex-row items-center gap-2 font-bold px-4 py-2 rounded-sm border-2 transition-colors ${
              isPrivacyShieldOn 
                ? 'bg-primary text-white border-primary' 
                : 'text-on-surface bg-surface border-outline hover:bg-surface-container'
            }`} 
            title="Toggle Privacy Shield for Ward Rounds"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPrivacyShieldOn ? 'visibility' : 'visibility_off'}
            </span> 
            {t('dashboard_v2.privacy_shield')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Key Metrics & Triage Board */}
        <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Key Metrics - Flat Neo-Minimalist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Triage Active */}
            <div className="bg-surface rounded-sm p-5 border-2 border-outline flex flex-col">
              <div className="flex-row justify-between items-start mb-4">
                <span className="font-label text-xs tracking-widest uppercase font-extrabold text-on-surface">{t('dashboard_v2.metrics.triage_active')}</span>
                <span className="material-symbols-outlined text-outline">sort</span>
              </div>
              <div className="flex-row items-baseline gap-2 mb-4">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.triageLevels?.active || 0}
                </h3>
              </div>
              <div className="mt-auto flex flex-row gap-2">
                <span className="bg-red-600 border border-red-800 text-white text-[10px] uppercase font-black px-2 py-1 rounded-sm">{metrics?.triageLevels?.l1 || 0} L1</span>
                <span className="bg-orange-500 border border-orange-700 text-white text-[10px] uppercase font-black px-2 py-1 rounded-sm">{metrics?.triageLevels?.l2 || 0} L2</span>
                <span className="bg-surface-container-high border border-outline text-on-surface text-[10px] uppercase font-black px-2 py-1 rounded-sm">{metrics?.triageLevels?.l3 || 0} L3+</span>
              </div>
            </div>

            {/* Ventilators */}
            <div className="bg-surface rounded-sm p-5 border-2 border-outline flex flex-col">
              <div className="flex-row justify-between items-start mb-4">
                <span className="font-label text-xs tracking-widest uppercase font-extrabold text-on-surface">{t('dashboard_v2.metrics.ventilators')}</span>
                <span className="material-symbols-outlined text-outline">air</span>
              </div>
              <div className="flex-row items-baseline gap-2 mb-4">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '-' : metrics?.ventilators?.available || 0}
                </h3>
                <span className="font-body text-sm font-bold text-on-surface">/ {metrics?.ventilators?.total || 24} {t('dashboard_v2.metrics.available')}</span>
              </div>
              <div className="mt-auto w-full bg-surface-container-highest border border-outline h-3 rounded-sm overflow-hidden">
                <div className="bg-primary border-r border-outline h-full transition-all duration-150" style={{ width: `${isLoading ? 0 : 100 - ((metrics?.ventilators?.available || 0) / (metrics?.ventilators?.total || 24) * 100)}%` }}></div>
              </div>
            </div>

            {/* BOR (Bed Occupancy Rate) */}
            <div className="bg-surface rounded-sm p-5 border-2 border-outline flex flex-col">
              <div className="flex-row justify-between items-start mb-4">
                <span className="font-label text-xs tracking-widest uppercase font-extrabold text-on-surface">{t('dashboard_v2.metrics.bor')}</span>
                <span className="material-symbols-outlined text-outline">bed</span>
              </div>
              <div className="flex-row items-baseline gap-2 mb-4">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.bedOccupancy?.rate || 0}%
                </h3>
              </div>
              <div className="mt-auto w-full bg-surface-container-highest border border-outline h-3 rounded-sm overflow-hidden">
                <div className="bg-primary border-r border-outline h-full transition-all duration-150" style={{ width: `${isLoading ? 0 : metrics?.bedOccupancy?.rate || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Triage Activity Table (Data-Driven, Flat Design) */}
          <div className="bg-surface border-2 border-outline rounded-sm flex flex-col overflow-hidden min-h-[400px]">
            <div className="p-4 border-b-2 border-outline flex flex-row justify-between items-center bg-surface-container-low">
              <h3 className="font-headline font-extrabold text-lg text-on-surface uppercase tracking-wide">{t('dashboard_v2.triage_board.title')}</h3>
              <button className="text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded-sm font-label text-xs font-black uppercase tracking-widest transition-colors flex flex-row items-center justify-center gap-2 border-2 border-outline bg-surface">
                <span className="material-symbols-outlined text-[16px]">filter_list</span> {t('dashboard_v2.triage_board.filter')}
              </button>
            </div>
            
            <div className="w-full overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface font-label text-[10px] uppercase tracking-widest text-on-surface border-b-2 border-outline">
                    <th className="p-3 font-black">{t('dashboard_v2.triage_board.identity')}</th>
                    <th className="p-3 font-black">{t('dashboard_v2.triage_board.timeline')}</th>
                    <th className="p-3 font-black">NEWS2</th>
                    <th className="p-3 font-black">{t('dashboard_v2.triage_board.vitals')}</th>
                    <th className="p-3 font-black">Aksi Klinis</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm divide-y-2 divide-outline">
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-on-surface font-bold animate-pulse">{t('dashboard_v2.triage_board.syncing')}</td></tr>
                  ) : activeTriage.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-on-surface font-bold">{t('dashboard_v2.triage_board.no_cases')}</td></tr>
                  ) : (
                    activeTriage.map((patient) => (
                      <tr key={patient.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="p-3 border-r-2 border-outline">
                          <div className="font-bold text-on-surface text-base">
                            {isPrivacyShieldOn ? `PT-****${patient.mrn.slice(-2)}` : patient.name}
                          </div>
                          <div className="text-[11px] text-on-surface-variant font-mono font-bold mt-1">MRN: {isPrivacyShieldOn ? `***${patient.mrn.slice(-3)}` : patient.mrn}</div>
                          <div className="text-[11px] text-on-surface-variant font-bold">DOB: {isPrivacyShieldOn ? '**/**/****' : patient.dob}</div>
                        </td>
                        <td className="p-3 border-r-2 border-outline">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`inline-flex flex-row items-center gap-1 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm border-2 ${patient.level === 1 ? 'bg-red-600 border-red-800' : patient.level === 2 ? 'bg-orange-500 border-orange-700' : 'bg-primary border-primary-container'}`}>
                              ESI {patient.level} - {patient.statusLabel}
                            </span>
                            <div className="flex-row items-center gap-1 text-[10px] text-on-surface font-mono font-bold">
                              {(patient.timeline || []).join(' > ')}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-r-2 border-outline text-center">
                          <div className={`inline-block font-black text-xl px-3 py-1 rounded-sm border-2 ${patient.news2_score >= 7 ? 'bg-red-600 border-red-800 text-white' : 'bg-surface border-outline text-on-surface'}`}>
                            {patient.news2_score}
                          </div>
                        </td>
                        <td className="p-3 border-r-2 border-outline">
                          <span className="text-on-surface font-mono text-xs font-bold">
                            BP: {patient.vitals?.bp || '--/--'}<br/>
                            SpO2: {patient.vitals?.spo2 || '--'}%<br/>
                            HR: {patient.vitals?.hr || '--'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-sm mb-2">{patient.cdsAction}</div>
                          <button className="bg-primary hover:bg-primary-container text-white border-2 border-primary-container px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors w-full">
                            Buka EMR
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail */}
        <div className="xl:col-span-4 flex-column">
          <div className="bg-surface border-2 border-outline rounded-sm flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b-2 border-outline bg-surface-container-low">
              <h3 className="font-headline font-extrabold text-lg text-on-surface uppercase tracking-wide">
                Riwayat Aktivitas
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {isLoading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-16 bg-surface-container-high rounded-sm border-2 border-outline"></div>
                  <div className="h-16 bg-surface-container-high rounded-sm border-2 border-outline"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-on-surface-variant font-bold text-center mt-4">Belum ada aktivitas.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-surface border-2 border-outline p-3 rounded-sm flex flex-col gap-1">
                    <div className="flex flex-row justify-between items-start mb-1">
                      <span className={`font-label text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${log.severity === 'CRITICAL' ? 'bg-red-600 text-white border-red-800' : log.severity === 'URGENT' ? 'bg-orange-500 text-white border-orange-700' : 'bg-surface-container-high text-on-surface border-outline'}`}>
                        {log.severity}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-on-surface-variant">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'now'}
                      </span>
                    </div>
                    <div className="font-bold text-[11px] text-on-surface uppercase">{log.user}</div>
                    <p className="font-body text-xs font-semibold text-on-surface-variant leading-snug">{log.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dev Utils (Hidden in normal view) */}
      <div className="mt-8 pt-4 border-t-2 border-outline opacity-20 hover:opacity-100 transition-opacity">
        <button onClick={handleSeedData} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-primary">
          [DEV] Seed Data
        </button>
      </div>
    </div>
  );
}
