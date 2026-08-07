import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useLiveDashboard } from '../hooks/useLiveDashboard.js';
import { db } from '../../../core/firebase.js';
import { collection, setDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Shield, EyeOff, Activity, Wind, Bed, Filter } from 'lucide-react';

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
    <div className="p-4 lg:p-8 w-full max-w-full">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tighter text-on-surface leading-tight bg-gradient-to-r from-[#007399] to-cyan-500 bg-clip-text text-transparent">
            {t('dashboard_v2.title')}
          </h2>
          <p className="text-on-surface-variant text-sm mt-1 font-bold opacity-70 uppercase tracking-widest">
            {t('dashboard_v2.subtitle')}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-row items-center gap-4 relative z-20">
          <button 
            onClick={() => setIsPrivacyShieldOn(!isPrivacyShieldOn)}
            className={`flex flex-row items-center gap-2 font-black px-6 py-3 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-sm ${
              isPrivacyShieldOn 
                ? 'bg-error text-white shadow-glow-error border border-error/50' 
                : 'glass-panel text-on-surface hover:bg-outline-variant/30 border border-outline-variant/30'
            }`} 
            title="Toggle Privacy Shield for Ward Rounds"
          >
            {isPrivacyShieldOn ? <Shield size={16} /> : <EyeOff size={16} />}
            {t('dashboard_v2.privacy_shield')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 relative z-10">
        {/* ─── Left Column: Key Metrics & Triage Board ─── */}
        <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* Key Metrics - Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Triage Active */}
            <div className="clinical-card group overflow-hidden relative shadow-premium-soft flex flex-col p-6 border border-white/10 hover:border-[#007399]/30 transition-all hover:-translate-y-1">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#007399]/5 rounded-full blur-2xl group-hover:bg-[#007399]/20 transition-all"></div>
              <div className="flex-row justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] tracking-[0.2em] uppercase font-black text-on-surface-variant">{t('dashboard_v2.metrics.triage_active')}</span>
                <Activity size={18} className="text-[#007399]/70 group-hover:text-[#007399] transition-colors" />
              </div>
              <div className="flex-row items-baseline gap-2 mb-4 relative z-10">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.triageLevels?.active || 0}
                </h3>
              </div>
              <div className="mt-auto flex flex-row gap-2 relative z-10">
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] uppercase font-black px-2.5 py-1 rounded-md">{metrics?.triageLevels?.l1 || 0} L1</span>
                <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-[10px] uppercase font-black px-2.5 py-1 rounded-md">{metrics?.triageLevels?.l2 || 0} L2</span>
                <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant/30 text-[10px] uppercase font-black px-2.5 py-1 rounded-md">{metrics?.triageLevels?.l3 || 0} L3+</span>
              </div>
            </div>

            {/* Ventilators */}
            <div className="clinical-card group overflow-hidden relative shadow-premium-soft flex flex-col p-6 border border-white/10 hover:border-[#007399]/30 transition-all hover:-translate-y-1">
              <div className="flex-row justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] tracking-[0.2em] uppercase font-black text-on-surface-variant">{t('dashboard_v2.metrics.ventilators')}</span>
                <Wind size={18} className="text-[#007399]/70 group-hover:text-[#007399] transition-colors" />
              </div>
              <div className="flex-row items-baseline gap-2 mb-4 relative z-10">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '-' : metrics?.ventilators?.available || 0}
                </h3>
                <span className="font-body text-xs font-bold text-on-surface-variant uppercase">/ {metrics?.ventilators?.total || 24} {t('dashboard_v2.metrics.available')}</span>
              </div>
              <div className="mt-auto w-full bg-surface-container-lowest border border-outline-variant/30 h-1.5 rounded-full overflow-hidden relative z-10">
                <div className="bg-[#007399] h-full transition-all duration-1000 shadow-glow-primary" style={{ width: `${isLoading ? 0 : 100 - ((metrics?.ventilators?.available || 0) / (metrics?.ventilators?.total || 24) * 100)}%` }}></div>
              </div>
            </div>

            {/* BOR (Bed Occupancy Rate) */}
            <div className="clinical-card group overflow-hidden relative shadow-premium-soft flex flex-col p-6 border border-white/10 hover:border-error/30 transition-all hover:-translate-y-1">
               <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-error/5 rounded-full blur-3xl group-hover:bg-error/20 transition-all"></div>
              <div className="flex-row justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] tracking-[0.2em] uppercase font-black text-on-surface-variant">{t('dashboard_v2.metrics.bor')}</span>
                <Bed size={18} className="text-error/50 group-hover:text-error transition-colors" />
              </div>
              <div className="flex-row items-baseline gap-2 mb-4 relative z-10">
                <h3 className="font-headline font-black text-5xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.bedOccupancy?.rate || 0}<span className="text-2xl text-on-surface-variant">%</span>
                </h3>
              </div>
              <div className="mt-auto w-full bg-surface-container-lowest border border-outline-variant/30 h-1.5 rounded-full overflow-hidden relative z-10">
                <div className="bg-error h-full transition-all duration-1000 shadow-glow-error" style={{ width: `${isLoading ? 0 : metrics?.bedOccupancy?.rate || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* ─── Triage Activity Board (Glassmorphism Table) ─── */}
          <div className="glass-panel shadow-premium-soft rounded-3xl flex flex-col overflow-hidden min-h-[400px] border border-white/10">
            <div className="p-6 border-b border-outline-variant/30 flex flex-row justify-between items-center bg-surface-container-low/30 backdrop-blur-md">
              <h3 className="font-headline font-black text-lg text-on-surface uppercase tracking-wide">{t('dashboard_v2.triage_board.title')}</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-on-surface hover:text-primary transition-colors flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 shadow-sm hover:shadow-md">
                <Filter size={14} /> {t('dashboard_v2.triage_board.filter')}
              </button>
            </div>
            
            <div className="w-full overflow-x-auto custom-scrollbar flex-1 bg-surface-container-lowest/30">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/30">
                    <th className="p-4 font-black">{t('dashboard_v2.triage_board.identity')}</th>
                    <th className="p-4 font-black">{t('dashboard_v2.triage_board.timeline')}</th>
                    <th className="p-4 font-black text-center">NEWS2</th>
                    <th className="p-4 font-black">{t('dashboard_v2.triage_board.vitals')}</th>
                    <th className="p-4 font-black">Aksi Klinis</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm divide-y divide-outline-variant/20">
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-12 text-center text-on-surface font-bold animate-pulse">{t('dashboard_v2.triage_board.syncing')}</td></tr>
                  ) : activeTriage.length === 0 ? (
                    <tr><td colSpan="5" className="p-12 text-center text-on-surface-variant font-bold opacity-50">{t('dashboard_v2.triage_board.no_cases')}</td></tr>
                  ) : (
                    activeTriage.map((patient) => (
                      <tr key={patient.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-on-surface text-base group-hover:text-primary transition-colors">
                            {isPrivacyShieldOn ? `PT-****${patient.mrn.slice(-2)}` : patient.name}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono font-bold mt-1 opacity-70">MRN: {isPrivacyShieldOn ? `***${patient.mrn.slice(-3)}` : patient.mrn}</div>
                          <div className="text-[10px] text-on-surface-variant font-bold opacity-70">DOB: {isPrivacyShieldOn ? '**/**/****' : patient.dob}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`inline-flex flex-row items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${patient.level === 1 ? 'bg-red-500/10 text-red-600 border-red-500/20' : patient.level === 2 ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                              ESI {patient.level} - {patient.statusLabel}
                            </span>
                            <div className="flex-row items-center gap-1 text-[10px] text-on-surface-variant font-mono font-bold">
                              {(patient.timeline || []).join(' > ')}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 font-black text-xl rounded-xl border shadow-sm ${patient.news2_score >= 7 ? 'bg-error text-white border-error shadow-glow-error' : 'bg-surface-container-high text-on-surface border-outline-variant/30'}`}>
                            {patient.news2_score}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 inline-block shadow-inner">
                            <span className="text-on-surface font-mono text-[11px] font-bold leading-relaxed">
                              BP: <span className="text-primary">{patient.vitals?.bp || '--/--'}</span><br/>
                              SpO2: <span className="text-primary">{patient.vitals?.spo2 || '--'}%</span><br/>
                              HR: <span className="text-primary">{patient.vitals?.hr || '--'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-xs mb-2 text-on-surface-variant line-clamp-2">{patient.cdsAction}</div>
                          <button className="btn-primary py-1.5 px-3 text-[10px] w-full mt-2">
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

        {/* ─── Right Column: Audit Trail (Glassmorphism) ─── */}
        <div className="xl:col-span-4 flex-column">
          <div className="glass-panel shadow-premium-soft rounded-3xl flex flex-col h-full min-h-[400px] border border-white/10">
            <div className="p-6 border-b border-outline-variant/30 bg-surface-container-low/30 backdrop-blur-md">
              <h3 className="font-headline font-black text-lg text-on-surface uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-primary"></div>
                Audit Trail Live
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-surface-container-lowest/30">
              {isLoading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-20 bg-surface-container-high/50 rounded-2xl border border-outline-variant/30"></div>
                  <div className="h-20 bg-surface-container-high/50 rounded-2xl border border-outline-variant/30"></div>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                   <Activity size={48} className="mb-4 text-on-surface-variant" />
                   <p className="text-on-surface-variant font-bold text-center text-sm">Sistem Siaga.<br/>Belum ada log terekam.</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-surface-container-low/50 backdrop-blur-sm border border-outline-variant/30 p-4 rounded-2xl flex flex-col gap-2 hover:bg-surface-container-high/50 transition-colors">
                    <div className="flex flex-row justify-between items-start">
                      <span className={`font-label text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${log.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-600 border-red-500/20' : log.severity === 'URGENT' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {log.severity}
                      </span>
                      <span className="font-mono text-[9px] font-bold text-on-surface-variant/60">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'now'}
                      </span>
                    </div>
                    <div className="font-bold text-[10px] text-primary uppercase tracking-widest">{log.user}</div>
                    <p className="font-body text-xs font-semibold text-on-surface leading-snug">{log.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dev Utils */}
      <div className="mt-8 pt-4 border-t border-outline-variant/30 opacity-10 hover:opacity-100 transition-opacity flex justify-end">
        <button onClick={handleSeedData} className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest cursor-pointer hover:text-primary">
          [DEV] Seed Live Data
        </button>
      </div>
    </div>
  );
}
