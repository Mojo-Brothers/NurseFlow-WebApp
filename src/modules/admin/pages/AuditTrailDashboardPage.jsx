import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function AuditTrailDashboardPage() {
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'MEDICATION' | 'LAB_RESULT' | 'TRANSFUSION' | 'BREAK_GLASS'
  const [searchQuery, setSearchQuery] = useState('');

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'AUDIT-2026-0817-001',
      timestamp: '2026-08-17 14:15:22',
      actor: 'dr. Surya Johnson, Sp.PD',
      actorRole: 'DPJP Penyakit Dalam',
      workstationIp: '10.10.1.42 (Poli Rawat Jalan Room 3)',
      category: 'MEDICATION',
      action: 'UPDATE_DOSAGE',
      entity: 'MedicationOrder / Heparin',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      oldValue: 'Heparin 5000 IU/jam IV',
      newValue: 'Heparin 2500 IU/jam IV',
      clinicalJustification: 'APTT memanjang > 100 detik, risiko perdarahan spontan'
    },
    {
      id: 'AUDIT-2026-0817-002',
      timestamp: '2026-08-17 14:10:05',
      actor: 'Analis Budi, S.Tr.Kes',
      actorRole: 'Analis Laboratorium Sentral',
      workstationIp: '10.10.3.15 (Lab Analyzer Station 2)',
      category: 'LAB_RESULT',
      action: 'RECORD_PANIC_VALUE',
      entity: 'LaboratoryTestResult / Lactate',
      patientName: 'Tn. Hendra (Mr. X)',
      mrn: 'MRX-2026-A1',
      oldValue: '1.8 mmol/L (Baseline)',
      newValue: '5.2 mmol/L (Severe Shock)',
      clinicalJustification: 'Hasil nilai kritis divalidasi ulang secara duplo dan dilaporkan via telepon ke perawat jaga'
    },
    {
      id: 'AUDIT-2026-0817-003',
      timestamp: '2026-08-17 13:45:10',
      actor: 'Ns. Ratna Sari, S.Kep',
      actorRole: 'Perawat Primer Bangsal Melati',
      workstationIp: '10.10.2.11 (Nurses Station Melati Bed 01)',
      category: 'TRANSFUSION',
      action: 'DUAL_NURSE_CHECK',
      entity: 'BloodTransfusion / PRC B+',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      oldValue: 'RESERVED_IN_COLD_CHAIN',
      newValue: 'TRANSFUSING_BEDSIDE',
      clinicalJustification: 'Uji Crossmatch Kompatibel, verifikasi 2 perawat lolos, suhu unit 4.1°C'
    },
    {
      id: 'AUDIT-2026-0817-004',
      timestamp: '2026-08-17 12:30:00',
      actor: 'dr. Budi Santoso, Sp.B',
      actorRole: 'Dokter Bedah Konsultan',
      workstationIp: '10.10.4.88 (IGD Resuscitation Room)',
      category: 'BREAK_GLASS',
      action: 'EMERGENCY_OVERRIDE_ACCESS',
      entity: 'PatientRecord / EMR History',
      patientName: 'Tn. Hendra (Mr. X)',
      mrn: 'MRX-2026-A1',
      oldValue: 'ACCESS_RESTRICTED',
      newValue: 'FULL_EMERGENCY_ACCESS_GRANTED',
      clinicalJustification: 'Pasien gawat darurat trauma tumpul abdomen dengan syok hemoragik (Protokol Break-Glass)'
    }
  ]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesCategory = filterCategory === 'ALL' || log.category === filterCategory;
    const matchesSearch = log.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExportLedger = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `JCI_Audit_Trail_Ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Buku Besar Audit JCI Berhasil Diekspor (JSON Formatted)!');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[28px]">policy</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Jejak Audit Klinis Imutabel (JCI & Permenkes 24/2022)</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                JCI MOI / IPSG Audit Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan Rinci: Siapa, Kapan, Dari Workstation Mana, Nilai Lama &rarr; Nilai Baru, dan Justifikasi Klinis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLedger}
            className="px-4 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Ekspor Ledger Audit (JCI)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {['ALL', 'MEDICATION', 'LAB_RESULT', 'TRANSFUSION', 'BREAK_GLASS'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Cari ID Audit, Nama Pasien, atau Petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="space-y-3.5">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                  {log.id}
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{log.action}</span>
                <span className="text-slate-400">•</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">{log.entity}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{log.timestamp}</span>
            </div>

            {/* Clinician & Workstation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400">Petugas Pelaksana:</span>
                <div className="font-black text-slate-900 dark:text-white mt-0.5">{log.actor}</div>
                <div className="text-[11px] text-slate-500">{log.actorRole}</div>
              </div>
              <div>
                <span className="text-slate-400">Alamat IP / Lokasi Workstation:</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{log.workstationIp}</div>
                <div className="text-[11px] text-slate-500">Pasien: {log.patientName} ({log.mrn})</div>
              </div>
            </div>

            {/* Value Delta Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Nilai Sebelumnya (Old Value)</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{log.oldValue}</div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Nilai Baru / Aksi (New Value)</span>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{log.newValue}</div>
              </div>
            </div>

            {/* Justification */}
            <div className="text-xs p-3 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-blue-700 dark:text-cyan-400">Justifikasi Klinis / Alasan Perubahan: </span>
              {log.clinicalJustification}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
