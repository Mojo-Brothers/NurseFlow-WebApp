import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, QrCode, Fingerprint, Filter, ShieldCheck, User, 
  Sparkles, X, ChevronDown, Activity, AlertTriangle, Building2, 
  Clock, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import PatientSearchModal from './PatientSearchModal.jsx';
import toast from 'react-hot-toast';
import usePatientClipboardShortcuts from '../../../hooks/usePatientClipboardShortcuts.js';

import PillSearchBar from '../../../components/ui/PillSearchBar.jsx';

export default function AdvancedPatientSearchBar({ onSelectPatient, currentPatientId, compact = false }) {
  const { patients, fetchPatients, selectPatient } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters } = useEncounterStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('ALL'); // ALL | BPJS | IPD | EMERGENCY | ALERGI
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isFullModalOpen, setIsFullModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef(null);

  useEffect(() => {
    fetchPatients();
    fetchActiveEncounters();
  }, [fetchPatients, fetchActiveEncounters]);

  // Global Ctrl+C and Ctrl+V Shortcut Handler
  const handlePasteShortcut = useCallback((text) => {
    const val = text || '';
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setIsOpenDropdown(true);
    } else {
      setIsOpenDropdown(false);
    }
    setSelectedIndex(0);
  }, []);

  usePatientClipboardShortcuts({ onPasteMrn: handlePasteShortcut });

  // Click outside listener to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = useMemo(() => {
    const list = patients || [];
    
    return list.filter(p => {
      // Exclude merged
      if (p.status === 'MERGED') return false;

      // Filter by active chip
      if (activeChip === 'BPJS' && p.insurance?.type?.toLowerCase() !== 'bpjs') return false;
      if (activeChip === 'EMERGENCY' && p.status !== 'EMERGENCY') return false;
      if (activeChip === 'ALERGI' && !p.safety_flags?.allergy_risk) return false;

      if (!searchQuery.trim()) return true;

      const raw = searchQuery.trim().toLowerCase();
      // Clean potential prefixes from pasted NRM text (e.g. "MRN: 100001", "RM-100001", "No. RM: 100001", "#100001")
      const cleanQ = raw.replace(/^(mrn[:\s-]*|rm[:\s-]*|no\.?\s*rm[:\s-]*|#\s*)/i, '').trim();
      const digitsOnly = cleanQ.replace(/\D/g, '');

      const pName = (p.name || '').toLowerCase();
      const pMrn = String(p.mrn || '').toLowerCase();
      const pNik = String(p.nik || '');
      const pCard = String(p.insurance?.no || p.insurance?.card_number || '');

      const nameMatch = pName.includes(raw) || pName.includes(cleanQ);
      const mrnMatch = pMrn.includes(raw) || pMrn.includes(cleanQ) || (digitsOnly.length >= 3 && pMrn.includes(digitsOnly));
      const nikMatch = pNik.includes(raw) || (digitsOnly.length >= 4 && pNik.includes(digitsOnly));
      const cardMatch = pCard.includes(raw) || (digitsOnly.length >= 4 && pCard.includes(digitsOnly));

      return nameMatch || mrnMatch || nikMatch || cardMatch;
    });
  }, [patients, searchQuery, activeChip]);

  const handleSelect = (patient) => {
    selectPatient(patient.id);
    if (onSelectPatient) onSelectPatient(patient);
    setSearchQuery('');
    setIsOpenDropdown(false);
    toast.success(`Konteks pasien diganti ke: ${patient.name}`, { icon: '🧑‍⚕️' });
  };

  const handleSimulateScan = () => {
    setIsScanModalOpen(true);
    setTimeout(() => {
      const list = patients || [];
      const target = list.find(p => p.status !== 'MERGED') || list[0];
      if (target) {
        setIsScanModalOpen(false);
        handleSelect(target);
        toast.success(`[Scan Berhasil] Rekam Medis: ${target.name} (${target.mrn})`, { icon: '📟' });
      }
    }, 1500);
  };

  const renderSearchInputAndDropdown = () => (
    <div className="relative w-full">
      <PillSearchBar
        value={searchQuery}
        onChange={(val) => {
          setSearchQuery(val);
          if (val && val.trim().length > 0) {
            setIsOpenDropdown(true);
          } else {
            setIsOpenDropdown(false);
          }
        }}
        onFocus={() => {
          if (searchQuery && searchQuery.trim().length > 0) {
            setIsOpenDropdown(true);
          }
        }}
        onClick={() => {
          if (searchQuery && searchQuery.trim().length > 0) {
            setIsOpenDropdown(true);
          }
        }}
        onSearch={() => {
          if (searchQuery && searchQuery.trim().length > 0) {
            setIsOpenDropdown(true);
          }
        }}
        onAdvancedClick={() => {
          setIsOpenDropdown(false);
          setIsFullModalOpen(true);
        }}
        placeholder="Cari pasien canggih (Nama, No. RM, NIK, No. Kartu BPJS)..."
        advancedLabel="ADVANCED"
        variant="primary"
      />

      {/* AUTO-COMPLETE DROPDOWN RESULTS (Only shown when searchQuery is non-empty) */}
      {isOpenDropdown && !isFullModalOpen && searchQuery.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-[999] max-h-[360px] overflow-y-auto animate-scale-in">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <span>Daftar Antrean & Hasil Pencarian Pasien ({filteredPatients.length})</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpenDropdown(false); }}
              className="hover:text-rose-500 font-bold text-xs"
            >
              Tutup ✕
            </button>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400">
              Tidak ditemukan pasien dengan kueri "{searchQuery}".
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPatients.slice(0, 8).map(patient => (
                <div
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={`p-3.5 hover:bg-primary/10 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    patient.id === currentPatientId ? 'bg-primary/5 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center font-black text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                      {patient.demographics?.gender === 'F' ? 'P' : 'L'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white truncate">{patient.name}</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-bold rounded text-slate-700 dark:text-slate-300">
                          MRN: {patient.mrn || 'PENDING'}
                        </span>
                        {patient.status === 'EMERGENCY' && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase">IGD</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">
                        NIK: {patient.nik || '-'} • {patient.demographics?.dob ? `${calculateAge(patient.demographics.dob)} Thn` : '--'} • Penjamin: <strong className="text-slate-700 dark:text-slate-200 font-bold">{(patient.insurance?.type || 'UMUM').toUpperCase()}</strong>
                      </span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-dark transition-all shadow-sm shrink-0">
                    Pilih Pasien
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div ref={containerRef} className="w-full relative">
        {renderSearchInputAndDropdown()}

        {/* FULL SEARCH MODAL LAUNCHER */}
        <PatientSearchModal
          isOpen={isFullModalOpen}
          onClose={() => setIsFullModalOpen(false)}
          onSelect={(selectedObj) => {
            setIsFullModalOpen(false);
            const targetId = typeof selectedObj === 'object' ? (selectedObj.patientId || selectedObj.id) : selectedObj;
            const target = patients.find(p => p.id === targetId) || { id: targetId, name: selectedObj.nama || selectedObj.name || 'Pasien', mrn: selectedObj.noRM || selectedObj.mrn || '-' };
            handleSelect(target);
          }}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full space-y-3 relative z-30">
      
      {/* SEARCH BAR CONTAINER WITH GLASSMORPHISM */}
      <div className="glass-panel p-3 sm:p-4 rounded-3xl border border-outline-variant/40 shadow-premium-soft flex flex-wrap items-center justify-between gap-3">
        {renderSearchInputAndDropdown()}

        {/* QUICK FILTER CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Semua Pasien' },
            { id: 'BPJS', label: 'BPJS Kesehatan' },
            { id: 'EMERGENCY', label: 'UGD (P1/P2)' },
            { id: 'ALERGI', label: 'Alert Alergi' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                activeChip === chip.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-high/60 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* BIOMETRIC & SCAN SIMULATOR BUTTONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateScan}
            className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Scan Barcode / QR Code Gelang Pasien"
          >
            <QrCode size={15} />
            <span className="hidden md:inline">Scan Gelang</span>
          </button>

          <button
            onClick={handleSimulateScan}
            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Verifikasi Biometrik Sidik Jari Pasien"
          >
            <Fingerprint size={15} />
            <span className="hidden md:inline">Biometrik</span>
          </button>
        </div>
      </div>

      {/* FULL SEARCH MODAL LAUNCHER */}
      <PatientSearchModal
        isOpen={isFullModalOpen}
        onClose={() => setIsFullModalOpen(false)}
        onSelect={(selectedObj) => {
          setIsFullModalOpen(false);
          const targetId = typeof selectedObj === 'object' ? (selectedObj.patientId || selectedObj.id) : selectedObj;
          const target = patients.find(p => p.id === targetId) || { id: targetId, name: selectedObj.nama || selectedObj.name || 'Pasien', mrn: selectedObj.noRM || selectedObj.mrn || '-' };
          handleSelect(target);
        }}
      />

      {/* SCANNING SIMULATION MODAL */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-surface-container-lowest p-6 rounded-3xl text-center space-y-4 max-w-sm w-full border border-outline-variant/40 shadow-2xl animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto animate-bounce">
              <QrCode size={32} />
            </div>
            <h3 className="text-base font-black text-on-surface">Mendeteksi Barcode / Biometrik...</h3>
            <p className="text-xs text-on-surface-variant font-medium">Arahkan scanner ke gelang atau sensor biometrik sidik jari pasien.</p>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="w-full h-full bg-primary animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
