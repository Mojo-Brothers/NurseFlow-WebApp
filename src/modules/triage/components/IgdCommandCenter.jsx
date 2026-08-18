import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { useTriageStore } from '../triage.store.js';
import toast from 'react-hot-toast';

export default function IgdCommandCenter({ onStartRapidTriage, onOpenResuscitation, onSelectPatient }) {
  const navigate = useNavigate();
  const { patients } = usePatientStore();
  const { setLiveContext, activePatientId } = useEncounterStore();
  const { activeQueue, fetchActiveQueue } = useTriageStore();

  const [selectedBedModal, setSelectedBedModal] = useState(null);

  // Active Patient Resolution from Live Context
  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || (patients.length > 0 ? patients[0] : null);

  // Interactive Bed Grid Matrix
  const [bedMatrix, setBedMatrix] = useState([
    { id: 'BED-RES-01', code: 'RES-01', zone: 'RESUSCITATION', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-RES-02', code: 'RES-02', zone: 'RESUSCITATION', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-AKUT-01', code: 'A-01', zone: 'ACUTE', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-AKUT-02', code: 'A-02', zone: 'ACUTE', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-AKUT-03', code: 'A-03', zone: 'ACUTE', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-AKUT-04', code: 'A-04', zone: 'ACUTE', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-OBS-01', code: 'OBS-01', zone: 'OBSERVATION', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-OBS-02', code: 'OBS-02', zone: 'OBSERVATION', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 },
    { id: 'BED-ISO-01', code: 'ISO-01', zone: 'ISOLATION', status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 }
  ]);

  // Live Timer increment
  useEffect(() => {
    const interval = setInterval(() => {
      setBedMatrix(prev => prev.map(b => {
        if (b.status === 'OCCUPIED') {
          return { ...b, timerSec: b.timerSec + 1 };
        }
        return b;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSlaStatus = (timerSec, slaMax) => {
    if (slaMax === 0) return { label: 'IMMEDIATE', class: 'text-rose-500 font-black animate-pulse' };
    if (timerSec > slaMax) return { label: '🔴 SLA OVERDUE', class: 'text-rose-600 font-black animate-pulse' };
    if (timerSec > slaMax * 0.7) return { label: '🟡 MENDEKATI SLA', class: 'text-amber-500 font-bold' };
    return { label: '🟢 NORMAL', class: 'text-emerald-500 font-bold' };
  };

  // Direct 1-Click Bed Allocation
  const handleAssignPatientToBed = (bed, targetPatient) => {
    const pt = targetPatient || activePatient;
    if (!pt) {
      toast.error('Tidak ada pasien yang aktif. Silakan pilih atau buat pasien triase terlebih dahulu.');
      return;
    }

    const esiVal = pt.status === 'EMERGENCY' ? 2 : (pt.esi || 2);
    const slaSeconds = esiVal === 1 ? 0 : esiVal === 2 ? 600 : 1800; // ESI 2: 10 mins, ESI 3: 30 mins

    setBedMatrix(prev => prev.map(b => {
      // Free old bed if patient was in another bed
      if (b.mrn === pt.mrn && b.id !== bed.id) {
        return { ...b, status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 };
      }
      if (b.id === bed.id) {
        return {
          ...b,
          status: 'OCCUPIED',
          patientName: pt.name,
          mrn: pt.mrn,
          esi: esiVal,
          timerSec: 0,
          slaMax: slaSeconds
        };
      }
      return b;
    }));

    setLiveContext(pt.id || pt.mrn, null);
    setSelectedBedModal(null);
    toast.success(`🚨 Pasien ${pt.name} (${pt.mrn}) berhasil dialokasikan ke Bed ${bed.code} (${bed.zone})! Stopwatch SLA dimulai.`);
  };

  const handleDischargeBed = (bedId) => {
    setBedMatrix(prev => prev.map(b => {
      if (b.id === bedId) {
        return { ...b, status: 'VACANT', patientName: null, mrn: null, esi: null, timerSec: 0, slaMax: 0 };
      }
      return b;
    }));
    setSelectedBedModal(null);
    toast.success('🛏️ Bed berhasil dikosongkan & siap untuk pasien baru.');
  };

  const handleBedClick = (bed) => {
    if (bed.status === 'VACANT') {
      if (activePatient) {
        handleAssignPatientToBed(bed, activePatient);
      } else {
        setSelectedBedModal({ bed, mode: 'ASSIGN' });
      }
    } else {
      setSelectedBedModal({ bed, mode: 'OCCUPIED_DETAILS' });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Pasien Kritis (ESI 1-2)</span>
            <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {bedMatrix.filter(b => b.status === 'OCCUPIED' && b.esi && b.esi <= 2).length} Pasien
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">emergency</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Menunggu Dokter (ESI 3-5)</span>
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {bedMatrix.filter(b => b.status === 'OCCUPIED' && b.esi && b.esi >= 3).length} Pasien
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Kapasitas Bed Terpakai</span>
            <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {bedMatrix.filter(b => b.status === 'OCCUPIED').length}/{bedMatrix.length} ({Math.round((bedMatrix.filter(b => b.status === 'OCCUPIED').length / (bedMatrix.length || 1)) * 100)}%)
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">bed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Rata-rata Waktu Tanggap</span>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {bedMatrix.filter(b => b.status === 'OCCUPIED').length === 0 ? '0.0 Menit (Siap)' : '3.8 Menit'}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">speed</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Bed Allocation Grid & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Visual Bed Map */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[22px]">grid_view</span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Peta Alokasi Bed & Zona Pelayanan IGD</h3>
                <p className="text-[11px] text-slate-500">Live monitoring keterisian tempat tidur & stopwatch SLA (Klik bed untuk alokasi instan)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kosong
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Terisi
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bedMatrix.map(bed => {
              const sla = getSlaStatus(bed.timerSec, bed.slaMax);

              return (
                <div
                  key={bed.id}
                  onClick={() => handleBedClick(bed)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs hover:scale-[1.01] ${
                    bed.status === 'OCCUPIED'
                      ? bed.esi === 1
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 hover:border-blue-500'
                      : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-500 hover:bg-emerald-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{bed.code}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                        {bed.zone}
                      </span>
                    </div>

                    <span className={`w-3 h-3 rounded-full ${
                      bed.status === 'OCCUPIED' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}></span>
                  </div>

                  {bed.status === 'OCCUPIED' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">{bed.patientName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          bed.esi === 1 ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          ESI {bed.esi}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-bold">{bed.mrn}</span>
                      <div className="flex items-center justify-between text-[10px] mt-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="font-mono font-bold text-slate-500">⏱️ {formatTimer(bed.timerSec)}</span>
                        <span className={`text-[10px] ${sla.class}`}>{sla.label}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-xs text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      <span>+ Tempatkan Pasien</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">bolt</span>
              Aksi Cepat Gawat Darurat
            </h3>

            <button
              onClick={onStartRapidTriage}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              <span>Input Triase Cepat (ESI 1-5)</span>
            </button>

            <button
              onClick={onOpenResuscitation}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
              <span>Buka Resuscitation Board (Code Blue)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">rule</span>
              Protokol Emergency Severity Index (ESI v4)
            </h3>
            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold">
                ESI 1 (Resusitasi): Respon 0 Menit (Henti jantung/nafas)
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold">
                ESI 2 (Emergent): Respon ≤ 10 Menit (Risiko tinggi/nyeri berat)
              </div>
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 font-bold">
                ESI 3 (Urgent): Respon ≤ 30 Menit (Membutuhkan 2+ sumber daya)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bed Details & Action Modal */}
      {selectedBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 dark:text-white">Bed {selectedBedModal.bed.code}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{selectedBedModal.bed.zone}</span>
              </div>
              <button
                onClick={() => setSelectedBedModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {selectedBedModal.mode === 'OCCUPIED_DETAILS' ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-bold uppercase">Pasien di Tempat Tidur Ini</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{selectedBedModal.bed.patientName}</div>
                  <div className="text-xs font-mono text-blue-600 font-bold">{selectedBedModal.bed.mrn}</div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      setLiveContext(selectedBedModal.bed.mrn, null);
                      navigate('/doctor-workspace');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                    <span>Buka Konsultasi Dokter (CPPT/SOAP)</span>
                  </button>

                  <button
                    onClick={() => {
                      setLiveContext(selectedBedModal.bed.mrn, null);
                      navigate('/nursing-workspace');
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/30"
                  >
                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                    <span>Buka Asesmen Keperawatan / eMAR</span>
                  </button>

                  <button
                    onClick={() => handleDischargeBed(selectedBedModal.bed.id)}
                    className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer mt-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Kosongkan Bed (Pasien Dipindahkan / Pulang)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500">Pilih pasien dari antrean triase untuk ditempatkan di tempat tidur ini:</p>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {patients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleAssignPatientToBed(selectedBedModal.bed, p)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-all"
                    >
                      <div>
                        <div className="font-black text-slate-900">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.mrn}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">PILIH</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
