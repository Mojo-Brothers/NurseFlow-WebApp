import React, { useState } from 'react';
import DesignVariantClassic from '../components/DesignVariantClassic.jsx';
import DesignVariantCyber from '../components/DesignVariantCyber.jsx';
import DesignVariantMinimal from '../components/DesignVariantMinimal.jsx';

import ModalVariantClassic from '../components/ModalVariantClassic.jsx';
import ModalVariantPassport from '../components/ModalVariantPassport.jsx';
import ModalVariantDrawer from '../components/ModalVariantDrawer.jsx';

import DischargeModalClassic from '../components/DischargeModalClassic.jsx';
import DischargeModalKanban from '../components/DischargeModalKanban.jsx';
import DischargeModalList from '../components/DischargeModalList.jsx';

import BmiModalClassic from '../components/BmiModalClassic.jsx';
import BmiModalSlider from '../components/BmiModalSlider.jsx';
import BmiModalTouch from '../components/BmiModalTouch.jsx';

import SearchModalVariantHUD from '../components/SearchModalVariantHUD.jsx';
import SearchModalVariantSplit from '../components/SearchModalVariantSplit.jsx';
import SearchModalVariantDock from '../components/SearchModalVariantDock.jsx';

import LoginVariant1_EnterpriseGlass from '../components/LoginVariant1_EnterpriseGlass.jsx';
import LoginVariant2_MinimalistKiosk from '../components/LoginVariant2_MinimalistKiosk.jsx';
import LoginVariant3_CommandCenterCyber from '../components/LoginVariant3_CommandCenterCyber.jsx';
import LoginVariant4_BiometricSplitPortal from '../components/LoginVariant4_BiometricSplitPortal.jsx';
import LoginVariant5_NeumorphicMinimalCare from '../components/LoginVariant5_NeumorphicMinimalCare.jsx';
import LoginVariant6_HolodockEnterprise from '../components/LoginVariant6_HolodockEnterprise.jsx';
import LoginVariantHybridV5V2 from '../components/LoginVariantHybridV5V2.jsx';

import StaffRbacVariant1_ClassicGrid from '../components/StaffRbacVariant1_ClassicGrid.jsx';
import StaffRbacVariant2_PassportKanban from '../components/StaffRbacVariant2_PassportKanban.jsx';
import StaffRbacVariant3_TacticalMatrixHUD from '../components/StaffRbacVariant3_TacticalMatrixHUD.jsx';
import StaffPortfolioDetailModal from '../../admin/components/StaffPortfolioDetailModal.jsx';
import OceanicTealLoadingSpinner from '../../../components/ui/OceanicTealLoadingSpinner.jsx';

/**
 * UiDesignReviewPage - Hub Peninjauan & Comparative Testing UI Design NurseFlow HIS
 */
export default function UiDesignReviewPage() {
  const [activeTab, setActiveTab] = useState('variant3');
  const [activeLoginVariant, setActiveLoginVariant] = useState('hybrid_v5_v2');
  const [activeStaffVariant, setActiveStaffVariant] = useState('staff_v2');
  const [selectedPortfolioStaff, setSelectedPortfolioStaff] = useState(null);

  const demoStaffSample = {
    id: 'STF-DEMO-001',
    nip: 'NIP-19860512-2026-0559',
    nik: '3273811829891732',
    fullName: 'Rina Rahayu, S.Gz, RD (Registered Dietitian)',
    degree: 'S.Gz, RD',
    email: 'rina.rahayu559@nurseflow.id',
    phone: '+6281244467421',
    gender: 'Perempuan',
    birthPlace: 'Bandung',
    birthDate: '1986-05-12',
    age: 39,
    bloodType: 'O',
    religion: 'Islam',
    maritalStatus: 'Menikah',
    citizenship: 'WNI',
    role: 'LAB_RADIOLOGY_TECH',
    professionTitle: 'Ahli Gizi (Dietitian)',
    professionCategory: 'GIZI',
    departmentName: 'Asuhan Dietetik Pasien Inpatient',
    strNumber: 'STR-19940512-2026-0559',
    strExpiry: '2029-12-31',
    sipNumber: 'SIP-440/3212/DISKES',
    sipExpiry: '2028-06-30'
  };

  // Modal test states
  const [activeModal, setActiveModal] = useState(null); // 'classic' | 'passport' | 'drawer' | null
  const [activeDischargeModal, setActiveDischargeModal] = useState(null); // 'd_classic' | 'd_kanban' | 'd_list' | null
  const [activeBmiModal, setActiveBmiModal] = useState(null); // 'bmi_classic' | 'bmi_slider' | 'bmi_touch' | null
  const [activeSearchModal, setActiveSearchModal] = useState(null); // 'search_hud' | 'search_split' | 'search_dock' | null
  const [activeLoadingModal, setActiveLoadingModal] = useState(null); // 'v1' | 'v2' | 'v3' | null

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#007399] dark:text-cyan-400 text-3xl">palette</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Review Design UI Modul!
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Peninjauan & pengujian komparatif varian antarmuka Halaman Login (6 Varian), Modul Appointment, Detail Pasien, Pasien Pulang, & Modal Edit BB/TB.
          </p>
        </div>

        {/* Tab Switcher for Main Module Design */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 gap-1">
          <button 
            onClick={() => setActiveTab('variant1')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'variant1' 
                ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 1: Classic HIS
          </button>
          
          <button 
            onClick={() => setActiveTab('variant2')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'variant2' 
                ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 2: Cyber Glass
          </button>

          <button 
            onClick={() => setActiveTab('variant3')}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'variant3' 
                ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/25' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 3: Minimal Timeline ⭐
          </button>
        </div>
      </div>

      {/* Modal Renderer for Portfolio Variations */}
      {selectedPortfolioStaff && (
        <StaffPortfolioDetailModal
          staff={selectedPortfolioStaff}
          onClose={() => setSelectedPortfolioStaff(null)}
        />
      )}

      {/* SECTION 0.0: REVIEW 3 VARIAN DESAIN UI (SERBA OCEANIC TEAL #007399) ⭐ */}
      <div className="bg-gradient-to-r from-slate-950 via-[#00384b] to-slate-950 p-6 rounded-2xl border border-[#007399]/40 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#007399]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-3xl">fingerprint</span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Review 3 Varian Desain UI Modal Portfolio (Serba Theme Oceanic Teal #007399) ⭐
              </h2>
            </div>
            <p className="text-xs text-cyan-200 font-medium mt-1">
              Pilih dan bandingkan 3 Tata Letak & Arsitektur UI Berbeda — Seluruhnya Menggunakan Warna Utama Oceanic Teal (#007399).
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-xl border border-[#007399]/40 gap-1.5">
            <button
              onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v1' })}
              className="px-4 py-2 text-xs font-black rounded-lg bg-[#007399] text-white shadow-lg cursor-pointer flex items-center gap-1.5 border border-cyan-400/40"
            >
              <span>⭐ Varian 1: Oceanic Glass (TERPILIH RESMI)</span>
            </button>
            <button
              onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v2' })}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-white/10 text-slate-300 hover:text-white shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <span>Varian 2: Oceanic Minimalist</span>
            </button>
            <button
              onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v3' })}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-white/10 text-slate-300 hover:text-white shadow-lg cursor-pointer font-mono flex items-center gap-1.5"
            >
              <span>Varian 3: Oceanic HUD</span>
            </button>
          </div>
        </div>

        {/* Live Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v1' })}
            className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#003d52] to-slate-900 border-2 border-cyan-400 shadow-xl cursor-pointer transition-all hover:scale-[1.02] space-y-3 relative"
          >
            <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-md flex items-center gap-1">
              ⭐ TERPILIH RESMI
            </span>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#007399] text-white font-black text-[10px] uppercase border border-cyan-400">Varian 1</span>
              <span className="text-[10px] text-cyan-300 font-bold">Executive Glass</span>
            </div>
            <h4 className="text-sm font-black text-white">Oceanic Executive Glass</h4>
            <p className="text-xs text-slate-200">Gradient slate & oceanic teal (#007399), glassmorphism accent, kartu rounded-2xl formal dengan kontras tinggi untuk akreditasi JCI.</p>
            <div className="pt-2 flex justify-end">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1 bg-[#007399]/40 px-3 py-1 rounded-xl border border-cyan-400/30">Pratinjau Live ➔</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v2' })}
            className="p-5 rounded-2xl bg-slate-900 border border-teal-500/40 hover:border-white cursor-pointer transition-all hover:scale-[1.02] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[#007399] font-bold text-[10px] uppercase border border-[#007399]">Varian 2 (BARU)</span>
              <span className="text-[10px] text-slate-400 font-bold">Clean Floating Pills</span>
            </div>
            <h4 className="text-sm font-black text-white">Oceanic Minimalist Card-Grid</h4>
            <p className="text-xs text-slate-300">Header putih bersih ber-border teal #007399, capsule floating pills navigation, dan kartu rounded-3xl yang sangat ringan & cepat dibaca.</p>
            <div className="pt-2 flex justify-end">
              <span className="text-xs font-bold text-[#007399] dark:text-cyan-300 flex items-center gap-1">Uji Coba Live ➔</span>
            </div>
          </div>

          <div 
            onClick={() => setSelectedPortfolioStaff({ ...demoStaffSample, _uiVariant: 'v3' })}
            className="p-5 rounded-2xl bg-[#02131b] border border-[#007399]/60 hover:border-cyan-300 cursor-pointer transition-all hover:scale-[1.02] space-y-3 font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#007399]/30 text-cyan-300 font-bold text-[10px] uppercase border border-cyan-400/40">Varian 3 (BARU)</span>
              <span className="text-[10px] text-cyan-400 font-bold">Command HUD 2026</span>
            </div>
            <h4 className="text-sm font-black text-cyan-300">Oceanic Command HUD ⚡</h4>
            <p className="text-xs text-slate-300">Header obsidian oceanic black #02131b ber-border glowing teal, monospace HUD tabs with live pulse dot ala ICU Command Center.</p>
            <div className="pt-2 flex justify-end">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">Uji Coba Live ➔</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Loading Test Overlay */}
      {activeLoadingModal && (
        <div className="fixed inset-0 z-[99999]">
          <OceanicTealLoadingSpinner 
            variant={activeLoadingModal} 
            size="full" 
            label={`Pratinjau Live Animasi Loading ${activeLoadingModal.toUpperCase()} (Oceanic Teal #007399)...`} 
            progress={78}
          />
          <button
            onClick={() => setActiveLoadingModal(null)}
            className="fixed top-6 right-6 z-[100000] px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-full shadow-2xl cursor-pointer flex items-center gap-1.5"
          >
            ✕ Tutup Pratinjau Loading
          </button>
        </div>
      )}

      {/* SECTION 0.1: REVIEW 3 VARIAN DESAIN ANIMASI PROSES LOADING (THEME OCEANIC TEAL #007399) ⭐ */}
      <div className="bg-gradient-to-r from-slate-950 via-[#002b3a] to-slate-950 p-6 rounded-2xl border border-[#007399]/40 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#007399]/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-3xl">hourglass_top</span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Review 3 Varian Desain Animasi Proses Loading (Theme Oceanic Teal #007399) ⭐
              </h2>
            </div>
            <p className="text-xs text-cyan-200 font-medium mt-1">
              Pratinjau langsung 3 gaya animasi proses loading medis 2026 berbasis identitas warna resmi Oceanic Teal (#007399).
            </p>
          </div>

          <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-xl border border-[#007399]/40 gap-1.5">
            <button
              onClick={() => setActiveLoadingModal('v1')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#007399] hover:bg-[#005e7e] text-white shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <span>⚡ Fullscreen V1: Vital ECG Pulse</span>
            </button>
            <button
              onClick={() => setActiveLoadingModal('v2')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <span>🧬 Fullscreen V2: Biometric DNA</span>
            </button>
            <button
              onClick={() => setActiveLoadingModal('v3')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 shadow-lg cursor-pointer font-mono flex items-center gap-1.5 border border-cyan-400/40"
            >
              <span>📡 Fullscreen V3: Command HUD</span>
            </button>
          </div>
        </div>

        {/* Live Side-by-Side Inline Cards for 3 Loading Animation Variations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card V1: Vital ECG Pulse (TERPILIH RESMI) */}
          <div className="bg-gradient-to-br from-slate-900 via-[#003848] to-slate-900 rounded-2xl border-2 border-cyan-400 p-4 shadow-xl flex flex-col justify-between space-y-4 relative">
            <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-md flex items-center gap-1">
              ⭐ TERPILIH RESMI
            </span>
            <div className="flex items-center justify-between border-b border-[#007399]/40 pb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#007399] text-white font-black text-[10px] uppercase border border-cyan-400">
                Varian 1
              </span>
              <span className="text-[10px] font-black text-cyan-300">Clinical ECG Pulse</span>
            </div>
            
            {/* Inline Preview Component V1 */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-cyan-400/40">
              <OceanicTealLoadingSpinner 
                variant="v1" 
                label="Sinkronisasi Rekam Medis EMR..." 
                progress={84}
              />
            </div>

            <button
              onClick={() => setActiveLoadingModal('v1')}
              className="w-full py-2 bg-[#007399] hover:bg-[#005e7e] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1 border border-cyan-400/30"
            >
              <span>Uji Coba Layar Penuh (Fullscreen V1) ➔</span>
            </button>
          </div>

          {/* Card V2: Biometric DNA Helix */}
          <div className="bg-slate-900/90 rounded-2xl border border-[#007399]/40 p-4 shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-[#007399]/30 pb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-200 font-bold text-[10px] uppercase border border-cyan-400/30">
                Varian 2
              </span>
              <span className="text-[10px] font-bold text-slate-300">Biometric DNA Helix</span>
            </div>
            
            {/* Inline Preview Component V2 */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-[#007399]/30">
              <OceanicTealLoadingSpinner 
                variant="v2" 
                label="Mengonkstruksi Struktur Profesi SDM..." 
                progress={62}
              />
            </div>

            <button
              onClick={() => setActiveLoadingModal('v2')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1 border border-[#007399]/40"
            >
              <span>Uji Coba Layar Penuh (Fullscreen V2) ➔</span>
            </button>
          </div>

          {/* Card V3: Command HUD 2026 */}
          <div className="bg-[#02131b] rounded-2xl border border-cyan-500/40 p-4 shadow-lg flex flex-col justify-between space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#007399]/30 pb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] uppercase border border-cyan-400/40">
                Varian 3
              </span>
              <span className="text-[10px] font-bold text-cyan-400">Command HUD Scanner</span>
            </div>
            
            {/* Inline Preview Component V3 */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/30">
              <OceanicTealLoadingSpinner 
                variant="v3" 
                label="VERIFYING_JCI_SECURITY_VAULT..." 
                progress={95}
              />
            </div>

            <button
              onClick={() => setActiveLoadingModal('v3')}
              className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1 border border-cyan-400/40"
            >
              <span>Uji Coba Layar Penuh (Fullscreen V3) ➔</span>
            </button>
          </div>

        </div>
      </div>

      {/* SECTION -1: REVIEW 6 VARIAN DESAIN HALAMAN LOGIN / AUTHENTICATION GATEWAY */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/40 text-white shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-500/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-3xl">login</span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Review 6 Varian Desain UI Halaman Login & Akses Medis Terpusat ⭐
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Pilih dan uji coba 6 varian antarmuka Login Gateway terpusat (Termasuk 3 Varian Baru V4, V5, V6 dengan Biometrik Split, Neumorphic, & HoloDock).
            </p>
          </div>

          {/* Grid of Tabs */}
          <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-xl border border-indigo-500/30 gap-1.5">
            {[
              { id: 'hybrid_v5_v2', label: '⭐ Varian Hybrid (V5 Design + V2 Form)' },
              { id: 'login1', label: 'V1: Enterprise Glass' },
              { id: 'login2', label: 'V2: Minimal Kiosk' },
              { id: 'login3', label: 'V3: Cyber Command' },
              { id: 'login4', label: 'V4: Split Biometric' },
              { id: 'login5', label: 'V5: Neumorphic Care' },
              { id: 'login6', label: 'V6: HoloDock Hub' },
            ].map((lv) => (
              <button
                key={lv.id}
                onClick={() => setActiveLoginVariant(lv.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeLoginVariant === lv.id
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {lv.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Container for Active Login Variant */}
        <div className="rounded-2xl overflow-hidden border border-indigo-500/20 shadow-2xl">
          {activeLoginVariant === 'hybrid_v5_v2' && <LoginVariantHybridV5V2 />}
          {activeLoginVariant === 'login1' && <LoginVariant1_EnterpriseGlass />}
          {activeLoginVariant === 'login2' && <LoginVariant2_MinimalistKiosk />}
          {activeLoginVariant === 'login3' && <LoginVariant3_CommandCenterCyber />}
          {activeLoginVariant === 'login4' && <LoginVariant4_BiometricSplitPortal />}
          {activeLoginVariant === 'login5' && <LoginVariant5_NeumorphicMinimalCare />}
          {activeLoginVariant === 'login6' && <LoginVariant6_HolodockEnterprise />}
        </div>
      </div>

      {/* SECTION 0: REVIEW 3 VARIAN DESAIN MODUL "Manajemen Data Karyawan & Kontrol Hak Akses (HR & RBAC Matrix)" ⭐ */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-teal-500/40 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-500/30 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-3xl">badge</span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                Review 3 Varian Desain UI Modul "Manajemen Data Karyawan & RBAC Matrix" ⭐
              </h2>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Pilih dan uji coba 3 varian antarmuka Manajemen Staf Medis, Legal Credentialing STR/SIP, & Matriks Izin RBAC.
            </p>
          </div>

          <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-teal-500/30 gap-1.5">
            <button
              onClick={() => setActiveStaffVariant('staff_v1')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeStaffVariant === 'staff_v1'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Varian 1: Classic Grid
            </button>

            <button
              onClick={() => setActiveStaffVariant('staff_v2')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeStaffVariant === 'staff_v2'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Varian 2: Passport Cards
            </button>

            <button
              onClick={() => setActiveStaffVariant('staff_v3')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeStaffVariant === 'staff_v3'
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Varian 3: Tactical Matrix
            </button>
          </div>
        </div>

        {/* Live Preview Container for Active Staff RBAC Variant */}
        <div className="rounded-2xl overflow-hidden border border-teal-500/20 shadow-2xl">
          {activeStaffVariant === 'staff_v1' && <StaffRbacVariant1_ClassicGrid />}
          {activeStaffVariant === 'staff_v2' && <StaffRbacVariant2_PassportKanban />}
          {activeStaffVariant === 'staff_v3' && <StaffRbacVariant3_TacticalMatrixHUD />}
        </div>
      </div>

      {/* SECTION 0.5: NEW MODAL SHOWCASE FOR "CARI PASIEN AKTIF / COMMAND CENTER" */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-cyan-500/40 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-2xl">search_hands_free</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Modal Resmi "Cari Pasien Aktif - Command Center Outpatient" ⭐
              </h2>
            </div>
            <p className="text-xs text-cyan-200 font-medium mt-0.5">
              Satu-satunya modal pencarian pasien resmi & standar di seluruh aplikasi NurseFlow HIS.
            </p>
          </div>
          <span className="px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/40 shadow-inner">
            ⭐ TERPILIH RESMI
          </span>
        </div>

        {/* Action Buttons to Open Search Modals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveSearchModal('search_hud')}
            className="p-4 bg-[#007399]/20 hover:bg-[#007399]/40 border-2 border-[#007399] rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-lg"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-xs text-cyan-300">Varian 1 ⭐ TERPILIH</span>
              <span className="material-symbols-outlined text-sm text-cyan-300 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Command Center Outpatient Grid</span>
            </div>
            <p className="text-[11px] text-cyan-100 mt-1 font-medium">
              Filter Bar 6 Atribut (No Reg, No RM, Nama, Dept, Penjamin, Tanggal), Data Grid Matriks 6 Kolom & Pagination.
            </p>
          </button>

          <button 
            onClick={() => setActiveSearchModal('search_split')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-md opacity-60"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-slate-400">Varian 2 (Opsional)</span>
              <span className="material-symbols-outlined text-sm text-slate-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-slate-300 flex items-center gap-1.5">
              <span>Dual-Pane Passport Inspector</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Split Layout 2 Pane: Daftar Kiri + Card Passport Medis & Tanda Vital Pasien di Kanan.
            </p>
          </button>

          <button 
            onClick={() => setActiveSearchModal('search_dock')}
            className="p-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-md opacity-50"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-rose-400">Varian 3 (Non-Aktif / Ditolak X)</span>
              <span className="material-symbols-outlined text-sm text-slate-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-slate-400 flex items-center gap-1.5">
              <span>Floating Dock & Timeline (Ditolak)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-through">
              Modal list sederhana drawer samping (Telah digantikan penuh oleh Command Center Grid).
            </p>
          </button>
        </div>
      </div>

      {/* SECTION 1: MODAL SHOWCASE FOR "EDIT BB/TB (BMI)" */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-6 rounded-2xl border border-emerald-500/30 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400 text-xl">scale</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Review 3 IDE DESIGN BARU Modal "Edit BB/TB (IMT / BMI)"
              </h2>
            </div>
            <p className="text-xs text-emerald-200 font-medium mt-0.5">
              3 Konsep desain terbaru yang serba canggih untuk pengisi Observasi Fisiologi BB/TB.
            </p>
          </div>
        </div>

        {/* Action Buttons to Open BMI Modals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveBmiModal('bmi_classic')}
            className="p-4 bg-slate-800/80 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-emerald-300">Ide Baru 1</span>
              <span className="material-symbols-outlined text-sm text-emerald-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Biometric Body Silhouette</div>
            <p className="text-[11px] text-slate-300 mt-1">Siluet biometrik tubuh & ring gauge berat ideal (52-64kg).</p>
          </button>

          <button 
            onClick={() => setActiveBmiModal('bmi_slider')}
            className="p-4 bg-slate-800/80 hover:bg-purple-900/60 border border-purple-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-purple-300">Ide Baru 2</span>
              <span className="material-symbols-outlined text-sm text-purple-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Quick Stepper & Visit Trend</div>
            <p className="text-[11px] text-slate-300 mt-1">Komparasi tren kunjungan lalu (-2kg) & tombol (+/-1kg & 5kg).</p>
          </button>

          <button 
            onClick={() => setActiveBmiModal('bmi_touch')}
            className="p-4 bg-slate-800/80 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-cyan-300">Ide Baru 3</span>
              <span className="material-symbols-outlined text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Floating Island Quick Drawer</div>
            <p className="text-[11px] text-slate-300 mt-1">Pulau mengambang & chip pemilih angka cepat satu-sentuhan.</p>
          </button>
        </div>
      </div>

      {/* SECTION 2: MODAL SHOWCASE FOR "PASIEN PROSES PULANG" */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-orange-950 p-6 rounded-2xl border border-amber-500/30 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-xl">output</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Review 3 Desain Modal "Daftar Pasien Proses Pulang"
              </h2>
            </div>
            <p className="text-xs text-amber-200 font-medium mt-0.5">
              Uji coba 3 konsep tampilan modal saat tombol <strong>Pasien Proses Pulang</strong> diklik.
            </p>
          </div>
        </div>

        {/* Action Buttons to Open Discharge Modals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveDischargeModal('d_classic')}
            className="p-4 bg-slate-800/80 hover:bg-amber-900/60 border border-amber-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-amber-300">Varian 1 ⭐</span>
              <span className="material-symbols-outlined text-sm text-amber-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Classic HIS Data Grid</div>
            <p className="text-[11px] text-slate-300 mt-1">Tabel padat dengan filter Bangsal (CHRYSANT), RegID, & Status.</p>
          </button>

          <button 
            onClick={() => setActiveDischargeModal('d_kanban')}
            className="p-4 bg-slate-800/80 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-indigo-300">Varian 2</span>
              <span className="material-symbols-outlined text-sm text-indigo-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Discharge Kanban Pipeline</div>
            <p className="text-[11px] text-slate-300 mt-1">Kanban board 3-tahap (Resume Medis → Kasir → Checkout).</p>
          </button>

          <button 
            onClick={() => setActiveDischargeModal('d_list')}
            className="p-4 bg-slate-800/80 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-cyan-300">Varian 3</span>
              <span className="material-symbols-outlined text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Progress Tracker List</div>
            <p className="text-[11px] text-slate-300 mt-1">Kartu pasien dengan progress bar pemulangan (0% - 100%).</p>
          </button>
        </div>
      </div>

      {/* SECTION 3: MODAL SHOWCASE FOR "DETAIL INFO PASIEN" */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 p-6 rounded-2xl border border-teal-500/30 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-teal-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-400 text-xl">open_in_new</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Review 3 Desain Modal "Detail Info Pasien"
              </h2>
            </div>
            <p className="text-xs text-teal-200 font-medium mt-0.5">
              Uji coba 3 konsep tampilan pop-up / modal saat tombol <strong>Detail Info ↗</strong> diklik pada Pelayanan Pasien.
            </p>
          </div>
        </div>

        {/* Action Buttons to Open Modals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveModal('classic')}
            className="p-4 bg-slate-800/80 hover:bg-teal-800/60 border border-teal-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-teal-300">Modal Varian 1</span>
              <span className="material-symbols-outlined text-sm text-teal-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Classic Medical Grid</div>
            <p className="text-[11px] text-slate-300 mt-1">Grid 2-kolom padat dengan *medical section dividers* rapi.</p>
          </button>

          <button 
            onClick={() => setActiveModal('passport')}
            className="p-4 bg-slate-800/80 hover:bg-emerald-800/60 border border-emerald-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-emerald-300">Modal Varian 2</span>
              <span className="material-symbols-outlined text-sm text-emerald-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Digital Patient Passport</div>
            <p className="text-[11px] text-slate-300 mt-1">Kartu identitas digital dengan avatar hero banner & badge resmi.</p>
          </button>

          <button 
            onClick={() => setActiveModal('drawer')}
            className="p-4 bg-slate-800/80 hover:bg-cyan-800/60 border border-cyan-500/40 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs text-cyan-300">Modal Varian 3 ⭐</span>
              <span className="material-symbols-outlined text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white">Right Slide-Over Drawer</div>
            <p className="text-[11px] text-slate-300 mt-1">Panel meluncur dari kanan (*Side Inspector*) dengan tombol Copy.</p>
          </button>
        </div>
      </div>

      {/* Render Main Module Variant */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'variant1' && <DesignVariantClassic />}
        {activeTab === 'variant2' && <DesignVariantCyber />}
        {activeTab === 'variant3' && <DesignVariantMinimal />}
      </div>

      {/* PATIENT DETAIL MODAL POPUPS */}
      <ModalVariantClassic isOpen={activeModal === 'classic'} onClose={() => setActiveModal(null)} />
      <ModalVariantPassport isOpen={activeModal === 'passport'} onClose={() => setActiveModal(null)} />
      <ModalVariantDrawer isOpen={activeModal === 'drawer'} onClose={() => setActiveModal(null)} />

      {/* DISCHARGE PATIENT MODAL POPUPS */}
      <DischargeModalClassic isOpen={activeDischargeModal === 'd_classic'} onClose={() => setActiveDischargeModal(null)} />
      <DischargeModalKanban isOpen={activeDischargeModal === 'd_kanban'} onClose={() => setActiveDischargeModal(null)} />
      <DischargeModalList isOpen={activeDischargeModal === 'd_list'} onClose={() => setActiveDischargeModal(null)} />

      {/* BMI BB/TB MODAL POPUPS (NEW CONCEPTS) */}
      <BmiModalClassic isOpen={activeBmiModal === 'bmi_classic'} onClose={() => setActiveBmiModal(null)} />
      <BmiModalSlider isOpen={activeBmiModal === 'bmi_slider'} onClose={() => setActiveBmiModal(null)} />
      <BmiModalTouch isOpen={activeBmiModal === 'bmi_touch'} onClose={() => setActiveBmiModal(null)} />

      {/* CARI PASIEN AKTIF / COMMAND CENTER MODAL POPUPS (3 IDE DESAIN BARU) */}
      <SearchModalVariantHUD isOpen={activeSearchModal === 'search_hud'} onClose={() => setActiveSearchModal(null)} />
      <SearchModalVariantSplit isOpen={activeSearchModal === 'search_split'} onClose={() => setActiveSearchModal(null)} />
      <SearchModalVariantDock isOpen={activeSearchModal === 'search_dock'} onClose={() => setActiveSearchModal(null)} />

    </div>
  );
}
