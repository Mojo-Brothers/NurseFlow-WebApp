/**
 * NURSEFLOW ENTERPRISE HIS — GO-LIVE CONTROL CENTER & PRODUCTION OBSERVABILITY COCKPIT
 * Real-time operational dashboard for Clinical IT, Integration Operators, and System Auditors.
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Activity, RefreshCw, Database, Server,
  CheckCircle2, XCircle, Search, Layers, PlayCircle, Eye, Wrench, FileText
} from 'lucide-react';
import { integrationHealthMonitor } from '../../../core/interoperability/satusehat/observability/integrationHealthMonitor.service.js';
import { dlqOperatorWorkflow } from '../../../core/interoperability/satusehat/observability/dlqOperatorWorkflow.service.js';
import { goLiveReadinessGate } from '../../../core/interoperability/satusehat/observability/goLiveReadinessGate.service.js';
import { externalContractRecorder } from '../../../core/interoperability/satusehat/audit/externalContractRecorder.service.js';
import { disasterRecoveryEngine } from '../../../core/interoperability/satusehat/observability/disasterRecoveryEngine.service.js';

export default function GoLiveControlCenter() {
  const [snapshot, setSnapshot] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [dlqItems, setDlqItems] = useState([]);
  const [searchEntityId, setSearchEntityId] = useState('');
  const [searchedTraces, setSearchedTraces] = useState([]);
  const [selectedDlqItem, setSelectedDlqItem] = useState(null);
  const [activeTab, setActiveTab] = useState('GATES'); // GATES | DLQ | FORENSICS | DR
  const [actionMessage, setActionMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const snap = await integrationHealthMonitor.getOperationalSnapshot();
      const read = await goLiveReadinessGate.evaluateReadiness();
      const dlq = await dlqOperatorWorkflow.getDeadLetterRecords();

      setSnapshot(snap);
      setReadiness(read);
      setDlqItems(dlq);
    } catch (err) {
      console.error('Failed to load observability data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleForensicSearch = async () => {
    if (!searchEntityId.trim()) return;
    const results = await externalContractRecorder.getLineageByInternalEntity('Patient', searchEntityId.trim());
    const encResults = await externalContractRecorder.getLineageByInternalEntity('Encounter', searchEntityId.trim());
    setSearchedTraces([...results, ...encResults]);
  };

  const handleRequeueDlq = async (itemId) => {
    await dlqOperatorWorkflow.requeueItem(itemId, {
      operatorId: 'OPERATOR-DASHBOARD',
      reason: 'Operator manual retry from Go-Live Control Center'
    });
    setActionMessage(`Item ${itemId} requeued to PENDING`);
    loadData();
  };

  const handleTriggerCrashRecovery = async () => {
    const res = await disasterRecoveryEngine.executeCrashRecoveryProtocol();
    setActionMessage(`Disaster Recovery Complete: ${res.orphanedItemsRecovered} orphaned items recovered.`);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">NurseFlow Go-Live Control Center</h1>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {readiness?.readinessLevel || 'INITIALIZING'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time Production Observability, Conformance Gates, DLQ Remediation & Forensic Lineage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData} 
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 bg-blue-950/80 border border-blue-800 text-blue-200 rounded-lg text-sm flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs text-blue-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Gateway Status</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
            <Server className="w-5 h-5" />
            {snapshot?.gatewayStatus || 'ONLINE'}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">OAuth2 Token Health</div>
          <div className="text-xl font-bold text-blue-400 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {snapshot?.tokenHealth || 'VALID'}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Outbox Queue (Pending)</div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {snapshot?.counters?.pending || 0}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Dead Letter Queue</div>
          <div className={`text-xl font-bold mt-1 ${snapshot?.counters?.deadLetter > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {snapshot?.counters?.deadLetter || 0}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400">Success Rate / Latency</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {snapshot?.metrics?.successRatePercentage || 100}% <span className="text-xs text-slate-400 font-normal">({snapshot?.metrics?.averageLatencyMs || 0}ms)</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('GATES')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'GATES' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          12 Quality Gates ({readiness?.passedCount || 12}/{readiness?.totalGates || 12})
        </button>
        <button
          onClick={() => setActiveTab('DLQ')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'DLQ' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          DLQ Operator Cockpit ({dlqItems.length})
        </button>
        <button
          onClick={() => setActiveTab('FORENSICS')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'FORENSICS' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          1-Click Forensic Lineage Search
        </button>
        <button
          onClick={() => setActiveTab('DR')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'DR' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Disaster Recovery Controls
        </button>
      </div>

      {/* Tab 1: 12 Quality Gates */}
      {activeTab === 'GATES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readiness?.gates?.map((gate) => (
              <div 
                key={gate.id} 
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-start gap-3 hover:border-slate-700 transition"
              >
                {gate.status === 'PASSED' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-100">{gate.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full font-mono">
                      {gate.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{gate.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: DLQ Operator Cockpit */}
      {activeTab === 'DLQ' && (
        <div className="space-y-4 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Dead Letter Queue Human-in-the-Loop Management
            </h2>
            <span className="text-xs text-slate-400">Audited WORM Operator Actions</span>
          </div>

          {dlqItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-sm">Zero items in Dead Letter Queue. All systems healthy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dlqItems.map((item) => (
                <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-amber-400">{item.fhirResourceType}</span>
                      <span className="text-xs text-slate-400">ID: {item.entityId}</span>
                    </div>
                    <p className="text-xs text-rose-300 font-mono">{item.lastError || 'HTTP 400 Bad Request'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleRequeueDlq(item.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                    >
                      Requeue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 1-Click Forensic Lineage Search */}
      {activeTab === 'FORENSICS' && (
        <div className="space-y-4 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            1-Click Forensic Trace by Internal Entity ID
          </h2>

          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="e.g. PAT-SYNTH-999 or ENC-001"
              value={searchEntityId}
              onChange={(e) => setSearchEntityId(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={handleForensicSearch}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition"
            >
              Search Trace
            </button>
          </div>

          {searchedTraces.length > 0 && (
            <div className="space-y-3 mt-4">
              {searchedTraces.map((trace) => (
                <div key={trace.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between font-mono">
                    <span className="text-emerald-400">{trace.fhirResourceType} ➔ {trace.externalResourceId || 'UNASSIGNED'}</span>
                    <span className="text-slate-400">{trace.recordedAt}</span>
                  </div>
                  <div className="text-slate-300">Endpoint: {trace.request?.endpoint} ({trace.request?.method})</div>
                  <div className="text-slate-400">Correlation ID: {trace.correlationId}</div>
                  <div className="text-emerald-400">Status: HTTP {trace.response?.httpStatus} ({trace.status})</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Disaster Recovery Controls */}
      {activeTab === 'DR' && (
        <div className="space-y-4 bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Disaster Recovery & State Restoration Protocol
          </h2>
          <p className="text-xs text-slate-400">
            Simulate emergency cold restart, orphan recovery, and backup snapshot exports.
          </p>

          <div className="flex gap-3">
            <button 
              onClick={handleTriggerCrashRecovery}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Execute Crash Recovery Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
