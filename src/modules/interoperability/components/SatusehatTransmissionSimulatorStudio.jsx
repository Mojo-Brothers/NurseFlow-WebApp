import React, { useState } from 'react';
import { satusehatFhirStudioService, SATUSEHAT_CONFIG } from '../../../../server/services/satusehatFhirStudio.service.js';
import toast from 'react-hot-toast';

export default function SatusehatTransmissionSimulatorStudio() {
  const [environment, setEnvironment] = useState('SANDBOX'); // 'SANDBOX' | 'PRODUCTION'
  const [selectedResourceType, setSelectedResourceType] = useState('Bundle');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastTransmissionResult, setLastTransmissionResult] = useState(null);
  const [oauthToken, setOauthToken] = useState(satusehatFhirStudioService.getOAuthToken());
  const [logs, setLogs] = useState(satusehatFhirStudioService.getTransmissionLogs());

  const handleRefreshToken = () => {
    const refreshed = satusehatFhirStudioService.refreshOAuthToken();
    setOauthToken({ ...refreshed });
    toast.success('OAuth2 Bearer Token SATUSEHAT berhasil diperbarui!');
  };

  const getPayloadForTransmission = () => {
    switch (selectedResourceType) {
      case 'Bundle':
        return satusehatFhirStudioService.buildTransactionBundle([
          satusehatFhirStudioService.serializePatient(),
          satusehatFhirStudioService.serializeEncounter(),
          satusehatFhirStudioService.serializeCondition(),
          satusehatFhirStudioService.serializeObservation()
        ]);
      case 'Patient':
        return satusehatFhirStudioService.serializePatient();
      case 'Encounter':
        return satusehatFhirStudioService.serializeEncounter();
      case 'Condition':
        return satusehatFhirStudioService.serializeCondition();
      default:
        return satusehatFhirStudioService.serializePatient();
    }
  };

  const handleTransmit = () => {
    setIsTransmitting(true);
    const payload = getPayloadForTransmission();

    setTimeout(() => {
      const result = satusehatFhirStudioService.simulateTransmission(payload, {
        endpoint: `/${selectedResourceType}`,
        targetEnvironment: environment
      });
      setLastTransmissionResult(result);
      setLogs([...satusehatFhirStudioService.getTransmissionLogs()]);
      setIsTransmitting(false);

      if (result.status === 'SUCCESS') {
        toast.success(`Transmisi ${selectedResourceType} Sukses! (HTTP ${result.httpCode})`);
      } else {
        toast.error(`Transmisi Gagal (HTTP ${result.httpCode})`);
      }
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration & Control Bar */}
      <div className="lg:col-span-4 space-y-4">
        {/* OAuth2 Token Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">OAuth2 Gateway Auth</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              TOKEN ACTIVE
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="text-[11px] text-slate-500 font-medium">Bearer Token:</p>
            <p className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">{oauthToken.access_token}</p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span>TTL: 3600 detik</span>
              <button
                onClick={handleRefreshToken}
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                Refresh Token
              </button>
            </div>
          </div>
        </div>

        {/* Transmission Parameters */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Parameter Transmisi Gateway
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Environment:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnvironment('SANDBOX')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    environment === 'SANDBOX'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🧪 Sandbox Kemenkes
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment('PRODUCTION')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    environment === 'PRODUCTION'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🚀 Production Live
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pilih Payload Transmisi:</label>
              <select
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="Bundle">Bundle Transaksi Lengkap (Patient + Encounter + Diagnosis + Lab)</option>
                <option value="Patient">Patient Resource Tunggal</option>
                <option value="Encounter">Encounter Resource Tunggal</option>
                <option value="Condition">Condition (Diagnosis ICD-10)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleTransmit}
            disabled={isTransmitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined text-base">
              {isTransmitting ? 'sync' : 'cloud_upload'}
            </span>
            {isTransmitting ? 'Mengirim ke SATUSEHAT...' : `Kirim ${selectedResourceType} ke Gateway`}
          </button>
        </div>
      </div>

      {/* Response Inspector & Transmission Logs */}
      <div className="lg:col-span-8 space-y-4">
        {/* Live Response Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${lastTransmissionResult ? (lastTransmissionResult.status === 'SUCCESS' ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-slate-600'} animate-pulse`}></span>
              <span className="text-xs font-mono font-bold text-slate-200">HTTP Response Inspector</span>
            </div>
            {lastTransmissionResult && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                lastTransmissionResult.status === 'SUCCESS'
                  ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700'
                  : 'bg-rose-900/50 text-rose-300 border-rose-700'
              }`}>
                HTTP {lastTransmissionResult.httpCode} • {lastTransmissionResult.latencyMs}ms
              </span>
            )}
          </div>

          <div className="p-5 font-mono text-xs text-emerald-400 bg-slate-950/90 max-h-[300px] overflow-auto leading-relaxed">
            {lastTransmissionResult ? (
              <pre className="font-mono">{JSON.stringify(lastTransmissionResult.responseBody, null, 2)}</pre>
            ) : (
              <p className="text-slate-500 italic">Belum ada transmisi aktif. Klik tombol kirim untuk memulai.</p>
            )}
          </div>
        </div>

        {/* Transmission History Logs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Log Riwayat Transmisi Gateway ({logs.length})
          </h4>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold text-slate-400">{log.id}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.action} {log.endpoint}</span>
                  <span className="text-[10px] text-slate-400">({log.payloadSize})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{log.latencyMs}ms</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'
                  }`}>
                    HTTP {log.httpCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
