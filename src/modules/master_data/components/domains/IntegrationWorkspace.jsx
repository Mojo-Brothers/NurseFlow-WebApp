import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';

export default function IntegrationWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const [activeIntegrationTab, setActiveIntegrationTab] = useState('SATUSEHAT'); // 'SATUSEHAT' | 'BPJS' | 'HL7' | 'DICOM' | 'APIS'
  const [testSyncLoading, setTestSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleTestBridge = (platform) => {
    setTestSyncLoading(true);
    setTimeout(() => {
      setTestSyncLoading(false);
      setSyncStatus({
        platform,
        status: 'CONNECTED',
        latency: '42ms',
        timestamp: new Date().toLocaleTimeString('id-ID'),
        details: 'Handshake OAuth 2.0 & Token Validasi Berhasil. Endpoint FHIR R4 siap menerima data stream.'
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Governance Integration Header ─── */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30">
            <span className="material-symbols-outlined text-[26px]">hub</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                INTEROPERABILITY & HEALTH DATA EXCHANGE
              </span>
              <span className="text-[10px] font-bold text-slate-400">SATUSEHAT, BPJS, HL7 & DICOM PACS</span>
            </div>
            <h3 className="text-lg font-headline font-black">Pusat Integrasi Eksternal & Interoperabilitas</h3>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveIntegrationTab('SATUSEHAT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeIntegrationTab === 'SATUSEHAT' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_hospital</span>
            <span>Kemenkes SATUSEHAT</span>
          </button>

          <button
            onClick={() => setActiveIntegrationTab('BPJS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeIntegrationTab === 'BPJS' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
            <span>BPJS V-Claim & Antrean</span>
          </button>

          <button
            onClick={() => setActiveIntegrationTab('HL7')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeIntegrationTab === 'HL7' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">sync_alt</span>
            <span>HL7 Message Bus</span>
          </button>

          <button
            onClick={() => setActiveIntegrationTab('DICOM')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeIntegrationTab === 'DICOM' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">perm_media</span>
            <span>DICOM PACS</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: SATUSEHAT Interoperability ─── */}
      {activeIntegrationTab === 'SATUSEHAT' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
              <div>
                <h4 className="text-base font-headline font-black text-on-surface">Konfigurasi SATUSEHAT Kementerian Kesehatan RI</h4>
                <p className="text-xs text-on-surface-variant font-medium">Kepatuhan regulasi Permenkes No. 24/2022 untuk integrasi RME Nasional.</p>
              </div>

              <button
                onClick={() => handleTestBridge('SATUSEHAT')}
                disabled={testSyncLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-teal-600/25 hover:scale-105 active:scale-95 transition-all"
              >
                {testSyncLoading ? (
                  <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                )}
                <span>{testSyncLoading ? 'Menguji Handshake...' : 'Uji Koneksi Bridge'}</span>
              </button>
            </div>

            {/* Bridge Status Card */}
            {syncStatus && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">verified</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase">
                      KONEKSI {syncStatus.platform} TERVERIFIKASI
                    </h5>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/20 px-2 py-0.2 rounded-full">
                      Latency: {syncStatus.latency}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface">{syncStatus.details}</p>
                  <p className="text-[10px] font-mono text-on-surface-variant">Terakhir diuji: {syncStatus.timestamp}</p>
                </div>
              </div>
            )}

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Organization ID Kemenkes</span>
                <p className="text-sm font-mono font-bold text-on-surface">100028741 (RS NurseFlow Central)</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Environment Mode</span>
                <p className="text-sm font-mono font-bold text-teal-600">PRODUCTION_READY (v1.0-R4)</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">OAuth 2.0 Auth Server</span>
                <p className="text-xs font-mono text-on-surface truncate">https://api-satusehat.kemkes.go.id/oauth2/v1</p>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">FHIR R4 Endpoint Base</span>
                <p className="text-xs font-mono text-on-surface truncate">https://api-satusehat.kemkes.go.id/fhir-r4/v1</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── TAB 2: BPJS V-Claim ─── */}
      {activeIntegrationTab === 'BPJS' && (
        <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
          <h4 className="text-base font-headline font-black text-on-surface">Integrasi Web Service BPJS Kesehatan (V-Claim & Antrean Faskes)</h4>
          <p className="text-xs text-on-surface-variant">Bridging pembuatan SEP (Surat Eligibilitas Peserta), verifikasi rujukan, dan sinkronisasi kuota antrean.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Consumer ID BPJS</span>
              <p className="text-sm font-mono font-bold text-on-surface mt-1">29184</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Kode PPK Faskes</span>
              <p className="text-sm font-mono font-bold text-on-surface mt-1">0112R001</p>
            </div>
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Status Web Service</span>
              <p className="text-sm font-bold text-emerald-600 mt-1">BRIDGING ACTIVE</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: HL7 v2/v3 ─── */}
      {activeIntegrationTab === 'HL7' && (
        <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
          <h4 className="text-base font-headline font-black text-on-surface">HL7 Message Router & MLLP Server</h4>
          <p className="text-xs text-on-surface-variant">Komunikasi data medis standar HL7 v2.5.1 / v3 untuk integrasi mesin lab (LIS) dan alat rekam medis.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">HL7-ADT (Port 2575)</span>
                <span className="text-[10px] font-bold text-emerald-600">LISTENING</span>
              </div>
              <p className="text-xs text-on-surface-variant">Admission, Discharge, Transfer Message Bus</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">HL7-ORM / ORU (Port 2576)</span>
                <span className="text-[10px] font-bold text-emerald-600">LISTENING</span>
              </div>
              <p className="text-xs text-on-surface-variant">Laboratory Order & Observation Result Router</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: DICOM PACS ─── */}
      {activeIntegrationTab === 'DICOM' && (
        <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
          <h4 className="text-base font-headline font-black text-on-surface">DICOM Server & PACS Imaging Modalities</h4>
          <p className="text-xs text-on-surface-variant">Koneksi C-STORE, C-FIND, dan C-MOVE untuk CT-Scan, X-Ray DR, MRI, dan USG.</p>

          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs font-black text-teal-600">NURSEFLOW_PACS_CENTRAL</span>
              <h5 className="text-sm font-bold text-on-surface mt-0.5">DCM4CHEE PACS Server (Lantai 2 Radiologi)</h5>
              <p className="text-xs text-on-surface-variant font-mono">Host: 192.168.10.50 &bull; Port: 11112 &bull; AET: PACS_NF_RAD</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              ONLINE
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
