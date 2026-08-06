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

export default function AppointmentReviewPage() {
  const [activeTab, setActiveTab] = useState('variant3');

  // Modal test states
  const [activeModal, setActiveModal] = useState(null); // 'classic' | 'passport' | 'drawer' | null
  const [activeDischargeModal, setActiveDischargeModal] = useState(null); // 'd_classic' | 'd_kanban' | 'd_list' | null
  const [activeBmiModal, setActiveBmiModal] = useState(null); // 'bmi_classic' | 'bmi_slider' | 'bmi_touch' | null
  const [activeSearchModal, setActiveSearchModal] = useState(null); // 'search_hud' | 'search_split' | 'search_dock' | null

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-6 space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-3xl">palette</span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Review Design UI Modul!
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Peninjauan & pengujian komparatif varian antarmuka Modul Appointment, Detail Pasien, Pasien Pulang, & Modal Edit BB/TB.
          </p>
        </div>

        {/* Tab Switcher for Main Module Design */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
          <button 
            onClick={() => setActiveTab('variant1')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'variant1' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 1: Classic HIS
          </button>
          
          <button 
            onClick={() => setActiveTab('variant2')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'variant2' 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 2: Cyber Glass
          </button>

          <button 
            onClick={() => setActiveTab('variant3')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'variant3' 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Varian 3: Minimal Timeline ⭐
          </button>
        </div>
      </div>

      {/* SECTION 0: NEW MODAL SHOWCASE FOR "CARI PASIEN AKTIF / COMMAND CENTER" */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-cyan-500/40 text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-2xl">search_hands_free</span>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Review 3 IDE DESAIN BARU Modal "Cari Pasien Aktif / Command Center" ⭐
              </h2>
            </div>
            <p className="text-xs text-cyan-200 font-medium mt-0.5">
              3 Varian antarmuka modal pencarian pasien super canggih untuk menggantikan modal pencarian lama.
            </p>
          </div>
          <span className="px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/40 shadow-inner">
            READY TO REVIEW
          </span>
        </div>

        {/* Action Buttons to Open Search Modals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveSearchModal('search_hud')}
            className="p-4 bg-slate-900/90 hover:bg-teal-950/80 border border-teal-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-md"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-teal-300">Varian Ide 1</span>
              <span className="material-symbols-outlined text-sm text-teal-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Command Center HUD Matrix</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Top Live Metric Bar (Total Pasien, BPJS, UGD Cito) & Matriks Data Serba Padat.
            </p>
          </button>

          <button 
            onClick={() => setActiveSearchModal('search_split')}
            className="p-4 bg-slate-900/90 hover:bg-purple-950/80 border border-purple-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-md"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-purple-300">Varian Ide 2</span>
              <span className="material-symbols-outlined text-sm text-purple-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Dual-Pane Passport Inspector</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Split Layout 2 Pane: Daftar Kiri + Card Passport Medis & Tanda Vital Pasien di Kanan.
            </p>
          </button>

          <button 
            onClick={() => setActiveSearchModal('search_dock')}
            className="p-4 bg-slate-900/90 hover:bg-cyan-950/80 border border-cyan-500/40 rounded-2xl text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-md"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-cyan-300">Varian Ide 3 ⭐</span>
              <span className="material-symbols-outlined text-sm text-cyan-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
            <div className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Floating Dock & Timeline</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Floating Search Bar, AI Chip Filter Cepat (UGD, BPJS, RJ), & Timeline Antrean 1-Sentuh.
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

