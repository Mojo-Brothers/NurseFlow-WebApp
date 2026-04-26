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
      // 1. Seed Metrics (Separate try-catch because rules might block it)
      try {
        const metricsRef = doc(db, 'system_metrics', 'main_facility');
        await setDoc(metricsRef, {
          triageLevels: { active: 14, l1: 3, l2: 5, l3: 6 },
          ventilators: { total: 24, available: 2 },
          bedOccupancy: { rate: 88 },
          lastUpdated: serverTimestamp()
        });
      } catch (metricErr) {
        console.warn("Could not seed system_metrics (expected if Cloud Functions strictly required):", metricErr.message);
      }

      // 2. Seed Triage Logs (JCI isValidTriage & verifyIdentity)
      const batch = writeBatch(db);
      const triageRef1 = doc(collection(db, 'triage_logs'));
      batch.set(triageRef1, {
        assessed_by: currentUser.email,
        mrn: '8849201',
        name: 'PT-9942',
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
        name: 'PT-1033',
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

      // 3. Seed Audit Logs (JCI verifyIdentity)
      const logRef1 = doc(collection(db, 'audit_logs'));
      batch.set(logRef1, {
        severity: 'CRITICAL',
        timestamp: serverTimestamp(),
        user: currentUser.email,
        action: 'Authorized emergency blood release for PT-9942.'
      });

      const logRef2 = doc(collection(db, 'audit_logs'));
      batch.set(logRef2, {
        severity: 'URGENT',
        timestamp: serverTimestamp(),
        user: currentUser.email,
        action: 'Acknowledged critical lab results for PT-1033.'
      });

      await batch.commit();
      alert('Seed Data Success!');
    } catch (e) {
      console.error(e);
      alert('Error seeding data: ' + e.message);
    }
  };

  return (
    <div className="p-6 lg:p-10 flex-column gap-8 w-full">
      {/* Top Bar with Emergency Toggle */}
      <div className="flex-row justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-surface-variant shadow-sm">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface flex-row items-center gap-2">
            {t('dashboard_v2.title')}
            <button 
              onClick={() => setIsPrivacyShieldOn(!isPrivacyShieldOn)}
              className={`flex-row items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${isPrivacyShieldOn ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800' : 'text-on-surface-variant bg-surface-container-low border border-outline-variant hover:bg-surface-container-high'}`} 
              title="Toggle Privacy Shield for Ward Rounds"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isPrivacyShieldOn ? 'visibility' : 'visibility_off'}
              </span> 
              {t('dashboard_v2.privacy_shield')}
            </button>
            <button onClick={handleSeedData} className="ml-4 text-[10px] font-bold px-2 py-1 bg-surface-container-high text-on-surface-variant border border-outline-variant rounded hover:bg-surface-container-highest transition-colors">
              {t('dashboard_v2.seed_data', { defaultValue: '[DEV] Seed Live Data' })}
            </button>
          </h2>
          <p className="font-body text-sm text-on-surface-variant">{t('dashboard_v2.subtitle')}</p>
        </div>
        <button className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md font-label font-bold tracking-wide uppercase text-sm shadow-md transition-colors flex-row items-center gap-2 animate-[pulse_3s_ease-in-out_infinite]">
          <span className="material-symbols-outlined text-xl">warning</span>
          <span className="hidden sm:inline">{t('dashboard_v2.emergency_toggle')}</span>
          <span className="sm:hidden">{t('dashboard_v2.emergency_toggle_short', { defaultValue: 'Emergency' })}</span>
        </button>
      </div>

      {/* JCI Critical Alert Banner - Simple & Robust */}
      <div className="bg-red-100 dark:bg-red-950/40 border-l-4 border-red-600 rounded-r-xl p-5 flex-row items-center justify-between gap-6 animate-[pulse_2s_ease-in-out_infinite] shadow-sm">
        {/* Left: Info Area */}
        <div className="flex-row items-center gap-4 min-w-[300px] flex-1">
          <div className="bg-red-600 text-white rounded-full p-3 flex-shrink-0 shadow-lg">
            <span className="material-symbols-outlined text-2xl">emergency</span>
          </div>
          <div>
            <h2 className="text-red-900 dark:text-red-200 font-headline font-black text-xl tracking-tight leading-tight">
              {t('dashboard_v2.critical_incident')}
            </h2>
            <p className="text-red-800 dark:text-red-300 font-body text-sm font-bold opacity-90 mt-1">
              {t('dashboard_v2.eta_trauma')}
            </p>
            <div className="flex-row items-center gap-3 mt-2">
              <span className="text-[10px] font-bold text-on-error-container bg-error-container/50 px-2 py-0.5 rounded border border-on-error-container/20 uppercase tracking-wider">
                {t('dashboard_v2.escalation_notice')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Acknowledgment Controls */}
        <div className="flex-row items-center gap-3 bg-surface/30 dark:bg-black/20 p-3 rounded-xl border border-red-200/50 max-w-full">
          <select className="text-xs rounded-lg border-red-300 py-2 pl-3 pr-8 text-red-900 dark:text-red-200 font-bold bg-surface-container-lowest dark:bg-surface-container-high w-full sm:w-48 shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer" defaultValue="">
            <option disabled value="">{t('dashboard_v2.ack_form.select_role')}</option>
            <option value="rn">{t('dashboard_v2.ack_form.rn')}</option>
            <option value="md">{t('dashboard_v2.ack_form.md')}</option>
          </select>
          <select className="text-xs rounded-lg border-red-300 py-2 pl-3 pr-8 text-red-900 dark:text-red-200 font-bold bg-surface-container-lowest dark:bg-surface-container-high w-full sm:w-56 shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer" defaultValue="">
            <option disabled value="">{t('dashboard_v2.ack_form.select_action')}</option>
            <option value="triage">{t('dashboard_v2.ack_form.triage')}</option>
            <option value="surge">{t('dashboard_v2.ack_form.surge')}</option>
          </select>
          <button className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg font-label font-bold uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all cursor-pointer border-none outline-none">
            {t('dashboard_v2.ack_form.confirm')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Key Metrics & Triage Board */}
        <div className="xl:col-span-8 flex flex-col gap-6 lg:gap-8">
          
          {/* High Contrast Resource Bottlenecks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest rounded-xl p-5 relative overflow-hidden group border border-surface-variant shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-row justify-between items-start mb-2">
                <span className="font-label text-xs tracking-wider uppercase text-on-surface-variant font-semibold">{t('dashboard_v2.metrics.triage_active')}</span>
                <span className="material-symbols-outlined text-outline">sort</span>
              </div>
              <div className="flex-row items-end gap-2">
                <h3 className="font-headline font-extrabold text-4xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.triageLevels?.active || 0}
                </h3>
                <span className="font-body text-sm text-on-surface-variant mb-1">{t('dashboard_v2.metrics.active')}</span>
              </div>
              <div className="mt-3 flex-row gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{metrics?.triageLevels?.l1 || 0} L1</span>
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">{metrics?.triageLevels?.l2 || 0} L2</span>
                <span className="bg-surface-variant text-on-surface text-xs font-bold px-2 py-0.5 rounded-full">{metrics?.triageLevels?.l3 || 0} L3+</span>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-5 relative overflow-hidden group border-2 border-red-600 shadow-sm animate-[pulse_1s_ease-in-out_infinite]">
              <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-row justify-between items-start mb-2">
                <span className="font-label text-xs tracking-wider uppercase text-red-700 dark:text-red-300 font-extrabold">{t('dashboard_v2.metrics.ventilators')}</span>
                <span className="material-symbols-outlined text-red-600 animate-bounce">air</span>
              </div>
              <div className="flex-row items-end gap-2">
                <h3 className="font-headline font-extrabold text-5xl text-red-600 dark:text-red-400 tracking-tighter">
                  {isLoading ? '-' : metrics?.ventilators?.available || 0}
                </h3>
                <span className="font-body text-sm text-red-700 dark:text-red-300 font-bold mb-1">/ {metrics?.ventilators?.total || 24} {t('dashboard_v2.metrics.available')}</span>
              </div>
              <div className="mt-3 w-full bg-red-200 dark:bg-red-900/50 rounded-full h-2 overflow-hidden">
                <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${isLoading ? 0 : 100 - ((metrics?.ventilators?.available || 0) / (metrics?.ventilators?.total || 24) * 100)}%` }}></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 relative overflow-hidden group border border-surface-variant shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-row justify-between items-start mb-2">
                <span className="font-label text-xs tracking-wider uppercase text-on-surface-variant font-semibold">{t('dashboard_v2.metrics.bor')}</span>
                <span className="material-symbols-outlined text-outline">bed</span>
              </div>
              <div className="flex-row items-end gap-2">
                <h3 className="font-headline font-extrabold text-4xl text-on-surface tracking-tighter">
                  {isLoading ? '--' : metrics?.bedOccupancy?.rate || 0}%
                </h3>
              </div>
              <div className="mt-3 w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${isLoading ? 0 : metrics?.bedOccupancy?.rate || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Triage Activity Table */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
            <div className="p-5 border-b border-surface-variant flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-surface-container-low">
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">{t('dashboard_v2.triage_board.title')}</h3>
                <div className="flex-row items-center gap-2 mt-0.5">
                  <p className="font-body text-xs text-on-surface-variant">{t('dashboard_v2.triage_board.subtitle')}</p>
                  <span className="font-mono text-[9px] text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded border border-green-200 dark:border-green-800 flex-row items-center gap-0.5" title="Source: HL7 / Monitor [Beds 1-4]">
                    <span className="material-symbols-outlined text-[10px]">sync</span> {t('dashboard_v2.triage_board.source_hl7')}
                  </span>
                </div>
              </div>
              <button className="text-primary hover:bg-surface-container-high px-3 py-1.5 rounded-md font-label text-sm font-semibold transition-colors flex-row items-center justify-center gap-1 border border-outline-variant bg-surface-container-low self-start sm:self-auto shadow-sm">
                <span className="material-symbols-outlined text-sm">filter_list</span> {t('dashboard_v2.triage_board.filter')}
              </button>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-low font-label text-xs uppercase tracking-wider text-on-surface-variant border-b border-surface-variant">
                    <th className="p-3 font-semibold">{t('dashboard_v2.triage_board.identity')}</th>
                    <th className="p-3 font-semibold">{t('dashboard_v2.triage_board.timeline')}</th>
                    <th className="p-3 font-semibold">NEWS2</th>
                    <th className="p-3 font-semibold">{t('dashboard_v2.triage_board.vitals')}</th>
                    <th className="p-3 font-semibold">{t('dashboard_v2.triage_board.cds_action')}</th>
                  </tr>
                </thead>
                <tbody className="font-body text-sm divide-y divide-surface-variant">
                  {isLoading ? (
                    <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant animate-pulse">{t('dashboard_v2.triage_board.syncing')}</td></tr>
                  ) : activeTriage.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">{t('dashboard_v2.triage_board.no_cases')}</td></tr>
                  ) : (
                    activeTriage.map((patient) => (
                    <tr key={patient.id} className={`${patient.level === 1 ? 'bg-red-100/80 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-l-8 border-l-red-600 shadow-[inset_0_0_10px_rgba(220,38,38,0.1)]' : 'hover:bg-surface-container-low border-l-4 border-l-orange-400'} transition-colors`}>
                        <td className="p-3">
                          <div className="flex-row items-start gap-2">
                            <span className="material-symbols-outlined text-green-700 dark:text-green-400 text-sm mt-0.5" title="Wristband Verified">verified</span>
                            <div>
                              <div className="font-bold text-on-surface flex-row items-center gap-2">
                                {isPrivacyShieldOn ? `PT-****${patient.mrn.slice(-2)}` : patient.name}
                                  {patient.viewedBy && (
                                  <div className="flex-row -space-x-1">
                                    <div className="w-6 h-6 rounded-full bg-primary-container flex-row items-center justify-center border-2 border-surface dark:border-black text-[10px] font-bold text-on-primary-container" title={`${patient.viewedBy} is viewing`}>{(patient.viewedBy?.split(' ') || []).map(n=>n[0]).join('')}</div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-on-surface-variant font-mono">MRN: {isPrivacyShieldOn ? `***${patient.mrn.slice(-3)}` : patient.mrn}</div>
                              <div className="text-xs text-on-surface-variant">DOB: {isPrivacyShieldOn ? '**/**/****' : patient.dob}</div>
                              <a href="#audit-panel" className="text-[10px] text-primary font-bold uppercase tracking-wide mt-1 flex-row items-center gap-0.5 hover:underline cursor-pointer">
                                <span className="material-symbols-outlined text-[12px]">history</span> {t('dashboard_v2.triage_board.full_timeline')}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex-column items-start gap-1">
                            <span className={`inline-flex flex-row items-center gap-1 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm ${patient.level === 1 ? 'bg-red-600' : 'bg-orange-500'}`}>
                              {patient.level} - {patient.statusLabel}
                            </span>
                            {patient.overdueMs > 0 && (
                              <div className="mt-1 flex-row items-center gap-1 text-on-error-container font-bold text-xs animate-pulse bg-error-container/30 px-2 py-0.5 rounded border border-error-container">
                                <span className="material-symbols-outlined text-[14px]">timer</span> {Math.floor(patient.overdueMs / 60000)}m {t('dashboard_v2.triage_board.overdue')}
                              </div>
                            )}
                            <div className="flex-row items-center gap-1 mt-1 text-[10px] text-on-surface-variant font-mono font-bold bg-surface-container dark:bg-black/20 px-2 py-0.5 rounded w-full">
                              {(patient.timeline || []).map((step, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <span className={idx === arr.length - 1 ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-blue-600 dark:text-blue-300'}>{step}</span>
                                  {idx < arr.length - 1 && <span className="material-symbols-outlined text-[10px]">chevron_right</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex-column items-center gap-1">
                            <div className={`text-white font-bold px-2 py-1 rounded text-center inline-block shadow-md text-lg relative ${patient.news2_score >= 7 ? 'bg-red-600 animate-pulse' : 'bg-orange-500'}`}>
                              {patient.news2_score}
                              <span className="absolute -top-1 -right-1 material-symbols-outlined text-[10px] bg-green-500 text-white rounded-full p-0.5" title="Verified Data">check</span>
                            </div>
                            <div className="text-[10px] font-bold text-on-error-container bg-error-container px-1 py-0.5 rounded">{t('dashboard_v2.triage_board.rising_risk')}: {patient.riskPercent}%</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex-row items-center gap-2">
                            <span className="relative flex h-2 w-2" title="Live IoT Stream">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <div className="flex flex-col">
                              <span className="text-on-surface font-mono text-sm font-bold flex-row items-center gap-1">
                                {patient.vitals?.bp || '--/--'} • {patient.vitals?.spo2 || '--'}% • {patient.vitals?.hr || '--'} 
                                <span className="material-symbols-outlined text-[12px] text-green-600 dark:text-green-400" title="Verified Data">verified</span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex-row items-center justify-between gap-2">
                            <div className="flex-column gap-1">
                              <span className="text-red-600 dark:text-red-400 font-bold flex-row items-center gap-1 whitespace-nowrap">
                                <span className="material-symbols-outlined text-sm">bolt</span> {patient.cdsAction}
                              </span>
                              {patient.aclsRequired && (
                                <span className="text-[9px] font-bold text-on-error-container bg-error-container px-1 py-0.5 rounded flex-row items-center w-max uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[10px] mr-0.5">lock</span> ACLS Protocol Req.
                                </span>
                              )}
                            </div>
                            <div className="flex-column gap-1 items-end">
                              <button className={`${patient.level === 1 ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-3 py-1.5 rounded shadow-md text-xs font-bold flex-row items-center gap-1 transition-colors`}>
                                <span className="material-symbols-outlined text-[14px]">warning</span> {t('dashboard_v2.triage_board.execute')}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Audit Trail & Actions */}
        <div className="xl:col-span-4 flex-column gap-6">
          <div className="bg-surface-container-lowest rounded-xl h-full flex-column border border-surface-variant shadow-sm relative min-h-[400px]">
            <div className="p-5 border-b border-surface-variant z-10 bg-surface-container-low rounded-t-xl">
              <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight flex-row items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                {t('dashboard_v2.audit.title')}
              </h3>
              <p className="font-body text-xs text-on-surface-variant mt-1">{t('dashboard_v2.audit.subtitle')}</p>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto z-10 flex-column gap-5">
              {isLoading ? (
                <div className="animate-pulse flex-row space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-surface-container-highest rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-surface-container-highest rounded"></div>
                      <div className="h-4 bg-surface-container-highest rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-on-surface-variant text-sm text-center">{t('dashboard_v2.audit.no_logs')}</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className={`flex-row gap-3 items-start p-2 -m-2 rounded-md border ${log.severity === 'CRITICAL' ? 'bg-error-container/20 border-error/20' : log.severity === 'URGENT' ? 'bg-warning-container/20 border-warning-container/20' : 'bg-surface-container-high border-outline-variant'}`}>
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${log.severity === 'CRITICAL' ? 'bg-error animate-pulse' : log.severity === 'URGENT' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <div className="flex-row items-center gap-2 mb-1">
                        <span className={`font-label text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${log.severity === 'CRITICAL' ? 'text-white bg-error' : log.severity === 'URGENT' ? 'text-on-warning-container bg-warning-container' : 'text-primary bg-surface-container-highest'}`}>
                          {log.severity}
                        </span>
                        <span className={`font-mono text-[10px] ${log.severity === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : log.severity === 'URGENT' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-300'}`}>
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'now'}
                        </span>
                      </div>
                      <div className="flex-row items-baseline gap-2 mb-0.5">
                        <span className="font-label text-xs font-bold text-on-surface">{log.user}</span>
                      </div>
                      <p className="font-body text-sm text-on-surface font-medium">{log.action}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-surface-variant z-10 bg-surface-container-low rounded-b-xl mt-auto">
              <button className="w-full text-center text-primary font-label text-xs font-semibold hover:underline">{t('dashboard_v2.audit.view_full')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Fail-Safe Indicators */}
      <footer className="mt-auto pt-4 border-t border-surface-variant flex-column md:flex-row justify-between items-start md:items-center gap-4 text-xs text-on-surface-variant">
        <div className="flex-row items-center gap-4">
          <span className="flex-row items-center gap-1 font-mono">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> {t('dashboard_v2.footer.primary_server')}
          </span>
          <span className="flex-row items-center gap-1 font-mono text-blue-600 dark:text-blue-300 font-bold bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            <span className="material-symbols-outlined text-[14px]">backup</span> {t('dashboard_v2.footer.backup_node')}
          </span>
          <span className="hidden lg:flex-row items-center gap-1 font-mono text-green-800 dark:text-green-300 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
            <span className="material-symbols-outlined text-[14px]">security</span> {t('dashboard_v2.footer.failover_ready')}
          </span>
        </div>
        <div className="flex-row items-center gap-4">
          <span className="flex-row items-center gap-1 font-mono">
            <span className="material-symbols-outlined text-[14px] text-green-600">dns</span> {t('dashboard_v2.footer.db_health')}
          </span>
          <span>{t('dashboard_v2.footer.version')}</span>
        </div>
      </footer>
    </div>
  );
}
