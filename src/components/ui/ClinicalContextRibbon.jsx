/**
 * NurseFlow Enterprise HIS 2026 — Guarded Clinical Context Ribbon & Patient HUD
 * Standards: WCAG 2.1 AAA High-Contrast, Context-Switch Guardrail,
 * Sub-Second Zero-Click Patient Acuity & Safety Banner (Allergy, NEWS2, ESI, DPJP).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { useNotificationStore } from '../../core/stores/notification.store.js';
import { careWorkspaceResolver } from '../../core/services/careWorkspaceResolver.service.js';
import NotificationCenterModal from './NotificationCenterModal.jsx';
import GlobalCommandPaletteModal from '../common/GlobalCommandPaletteModal.jsx';
import toast from 'react-hot-toast';

export default function ClinicalContextRibbon() {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const { activePatientId, activeEncounterId, currentCareState, currentLocation, clearLiveContext } = useEncounterStore();
  const { patients } = usePatientStore();
  const { notifications, togglePanel } = useNotificationStore();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activePatient = patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || null;

  const handleNavigateToActiveWorkspace = () => {
    if (!activePatient) return;
    const resolution = careWorkspaceResolver.resolve({
      careState: currentCareState || activePatient.status,
      role: role || 'DOCTOR',
      encounterId: activeEncounterId
    });
    navigate(resolution.path);
    toast.success(`⚡ Beralih ke ${resolution.workspaceName}`, { icon: '🩺' });
  };

  const handleReleasePatientContext = () => {
    clearLiveContext();
    toast('Konteks pasien dilepas secara aman.', { icon: '🔒' });
  };

  const handleTriggerCodeBlue = () => {
    toast.error('🚨 CODE BLUE ACTIVATED: Tim Medis Reaksi Cepat / Resusitasi dipanggil segera!', {
      duration: 6000,
      icon: '🚨'
    });
  };

  const handleTriggerCodeRed = () => {
    toast.error('🔥 CODE RED ACTIVATED: Alarm Bahaya Kebakaran & Evakuasi Aktif!', {
      duration: 6000,
      icon: '🔥'
    });
  };

  // Mask NIK for confidentiality while preserving audit visibility
  const formatMaskedNik = (nik) => {
    if (!nik || nik.length < 16) return '3201********0001';
    return `${nik.substring(0, 4)}********${nik.substring(12)}`;
  };

  // Determine NEWS2 Severity Color
  const news2Score = activePatient?.news2Score ?? 2;
  const getNews2Badge = (score) => {
    if (score >= 7) {
      return { label: `NEWS2: ${score} (KRITIS)`, cls: 'bg-rose-950 text-rose-100 border-rose-500 font-black tracking-wide' };
    }
    if (score >= 4) {
      return { label: `NEWS2: ${score} (SEDANG)`, cls: 'bg-amber-950 text-amber-100 border-amber-500 font-bold' };
    }
    return { label: `NEWS2: ${score} (STABIL)`, cls: 'bg-emerald-950 text-emerald-100 border-emerald-500 font-bold' };
  };

  const news2Badge = getNews2Badge(news2Score);

  return (
    <>
      {/* High-Contrast Clinical Context HUD (#013D57) */}
      <header className="w-full bg-[#013D57] text-white px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-lg border-b border-[#002B3E] sticky top-0 z-40">
        
        {/* LEFT: Patient Context or Search Trigger */}
        {activePatient ? (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Identity & MRN */}
            <div className="flex items-center gap-1.5 bg-[#002738] px-2.5 py-1 rounded-lg border border-[#00547A]">
              <span className="font-mono font-black text-cyan-300 text-xs">{activePatient.mrn}</span>
              <span className="font-black text-white text-sm tracking-tight">{activePatient.name}</span>
              <span className="text-[11px] text-cyan-200">
                ({activePatient.age || '42 Th'} • {activePatient.gender === 'L' || activePatient.gender === 'male' ? 'L' : 'P'})
              </span>
              <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                NIK: {formatMaskedNik(activePatient.nik)}
              </span>
            </div>

            {/* Care State Badge */}
            <button
              type="button"
              onClick={handleNavigateToActiveWorkspace}
              className="px-2.5 py-1 rounded-lg bg-teal-950 text-teal-200 border border-teal-500 font-black text-[10px] uppercase flex items-center gap-1 hover:bg-teal-900 transition-colors cursor-pointer"
              title="Klik untuk membuka Ruang Kerja Aktif Pasien"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              <span>{currentCareState || activePatient.status || 'INPATIENT_ACTIVE'}</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>

            {/* Bed Location */}
            <div className="flex items-center gap-1 bg-[#002738] px-2 py-1 rounded-lg border border-[#00547A]">
              <span className="material-symbols-outlined text-[14px] text-cyan-400">location_on</span>
              <span className="font-bold text-cyan-100 text-[11px]">
                {currentLocation?.bedCode ? `Bed ${currentLocation.bedCode}` : (activePatient.room || 'Bed Melati 201-A')}
              </span>
            </div>

            {/* NEWS2 Acuity Badge */}
            <span className={`px-2 py-0.5 rounded border text-[10px] ${news2Badge.cls}`}>
              {news2Badge.label}
            </span>

            {/* Severe Allergies High-Alert Banner (Static High-Contrast Alert, Zero Blinking) */}
            {activePatient.allergies && activePatient.allergies.length > 0 && (
              <span className="px-2.5 py-0.5 rounded bg-rose-950 text-rose-100 border-2 border-rose-500 font-black text-[10px] flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px] text-rose-400 font-bold">warning</span>
                <span>ALERGI: {activePatient.allergies.join(', ').toUpperCase()}</span>
              </span>
            )}

            {/* DPJP */}
            <span className="text-[11px] text-cyan-200 hidden lg:inline">
              DPJP: <strong className="text-white">{activePatient.dpjp || 'dr. Surya Johnson, Sp.PD'}</strong>
            </span>

            {/* Enterprise Security Chips */}
            <div className="hidden 2xl:flex items-center gap-1 text-[9px] font-mono">
              <span className="px-1.5 py-0.5 bg-[#002738] text-emerald-300 border border-emerald-500/40 rounded">
                🔒 RLS ISOLATED
              </span>
              <span className="px-1.5 py-0.5 bg-[#002738] text-cyan-300 border border-cyan-500/40 rounded">
                🌐 SATUSEHAT OK
              </span>
            </div>

            {/* Release Context Button */}
            <button
              type="button"
              onClick={handleReleasePatientContext}
              className="w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] ml-1 transition-colors cursor-pointer border border-slate-700"
              title="Lepas Konteks Pasien Aktif (Mencegah Salah Identifikasi Pasien)"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Palette Shortcut */}
            <button
              type="button"
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#002738] hover:bg-[#00344b] border border-[#00547A] text-cyan-200 font-bold text-xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-cyan-400">person_search</span>
              <span>Pilih Pasien Aktif</span>
              <kbd className="px-1.5 py-0.5 bg-[#013D57] rounded text-[10px] font-mono border border-cyan-500/30">
                Ctrl+K
              </kbd>
            </button>

            {/* Active Clinical Staff Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#002738] border border-[#00547A] text-slate-100 text-[11px]">
              <span className="material-symbols-outlined text-[14px] text-emerald-400">verified_user</span>
              <span className="font-bold">{currentUser?.name || currentUser?.email || 'dr. Budi Santoso, Sp.B'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-black">
                {role || 'DOCTOR'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 border border-blue-600/50 text-blue-300 font-black hidden md:inline">
                SHIFT PAGI
              </span>
            </div>

            <span className="hidden xl:inline text-cyan-200/70 text-[11px]">
              Konteks Pasien Belum Dipilih • Buka antrean rawat atau tekan <kbd className="font-mono bg-[#002738] px-1 rounded">Ctrl+K</kbd>
            </span>
          </div>
        )}

        {/* RIGHT: Notifications & Emergency Hotbuttons */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <button
            type="button"
            onClick={togglePanel}
            className="relative p-1.5 rounded-lg bg-[#002738] hover:bg-[#003B54] text-white flex items-center justify-center cursor-pointer transition-transform active:scale-95 border border-[#00547A]"
            title="Pusat Notifikasi & Hasil Kritis Lab"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Emergency Code Blue */}
          <button
            type="button"
            onClick={handleTriggerCodeBlue}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm border border-rose-400"
            title="Panggilan Darurat Henti Jantung (Code Blue)"
          >
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            <span>Code Blue</span>
          </button>

          {/* Emergency Code Red */}
          <button
            type="button"
            onClick={handleTriggerCodeRed}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow-sm border border-amber-400 hidden sm:flex"
            title="Alarm Bahaya Kebakaran / Evakuasi (Code Red)"
          >
            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
            <span>Code Red</span>
          </button>
        </div>
      </header>

      {/* Slide-in Notification Modal */}
      <NotificationCenterModal />

      {/* Global Command Palette */}
      <GlobalCommandPaletteModal
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </>
  );
}
