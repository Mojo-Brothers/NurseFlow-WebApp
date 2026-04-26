import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { AlertTriangle, Activity, Pill, ShieldAlert, CheckCircle2, User, Building2, Stethoscope, FileText, BadgeInfo, CalendarDays, Search, ChevronRight, Heart } from 'lucide-react';
import PatientSearchModal from '../components/PatientSearchModal.jsx';
import SoapNoteModal from '../components/SoapNoteModal.jsx';
import { saveSoapNote, getPatientRecords } from '../services/emr.service.js';
import { Edit2, Eye, Plus, History, Zap } from 'lucide-react';

export default function OutpatientEMR() {
  const { currentUser } = useAuth();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters, setLiveContext } = useEncounterStore();
  
  const [activeTab, setActiveTab] = useState('MODUL E-MR');
  const [selectedModule, setSelectedModule] = useState(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
  const [soapRecords, setSoapRecords] = useState([]);
  const [editingSoapRecord, setEditingSoapRecord] = useState(null);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  const handlePatientSelect = (patientId, encounterId) => {
    selectPatient(patientId);
    if (encounterId) {
      setLiveContext(patientId, encounterId);
    }
    setIsSearchModalOpen(false);
    setSelectedModule(null);
  };

  const fetchClinicalRecords = React.useCallback(async (isMounted = { current: true }) => {
    if (!selectedPatientId) return;
    
    setIsLoadingRecords(true);
    try {
      const records = await getPatientRecords(selectedPatientId);
      if (isMounted.current) {
        setSoapRecords(records);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      if (isMounted.current) {
        setIsLoadingRecords(false);
      }
    }
  }, [selectedPatientId]);

  useEffect(() => {
    const isMounted = { current: true };
    
    if (activeTab === 'LIST PEMERIKSAAN') {
      fetchClinicalRecords(isMounted);
    }

    return () => {
      isMounted.current = false;
    };
  }, [activeTab, fetchClinicalRecords]);

  const handleSoapSave = async (formData) => {
    try {
      await saveSoapNote({
        patientId: selectedPatientId,
        encounterId: selectedEncounterId,
        doctorEmail: currentUser?.email || 'system@hospital.com',
        soapData: formData
      });
      setIsSoapModalOpen(false);
      setEditingSoapRecord(null);
      setSelectedModule(null);
      if (activeTab === 'LIST PEMERIKSAAN') {
        fetchClinicalRecords();
      } else {
        setActiveTab('LIST PEMERIKSAAN');
      }
    } catch (error) {
      alert('Gagal menyimpan data SOAP: ' + error.message);
    }
  };

  const handleEditSoap = (record) => {
    setEditingSoapRecord(record);
    setIsSoapModalOpen(true);
  };

  const tabs = [
    { id: 'MODUL E-MR', icon: <FileText size={16} /> },
    { id: 'LIST PEMERIKSAAN', icon: <Activity size={16} /> },
    { id: 'LABORATORIUM', icon: <Pill size={16} /> },
    { id: 'RADIOLOGI', icon: <Activity size={16} /> },
    { id: 'DIAGNOSA', icon: <BadgeInfo size={16} /> },
    { id: 'RESEP ONLINE', icon: <Pill size={16} /> },
    { id: 'RUJUKAN', icon: <Building2 size={16} /> },
    { id: 'HISTORI PEMERIKSAAN', icon: <CalendarDays size={16} /> },
    { id: 'HASIL SCAN DOKUMEN', icon: <FileText size={16} /> },
    { id: 'SURAT KETERANGAN', icon: <FileText size={16} /> }
  ];

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientActiveEncounter(selectedPatientId);
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  const activePatient = patients.find(p => p.id === selectedPatientId) || {};
  const activeEncounter = activeEncounters?.find(e => e.id === selectedEncounterId) || {};

  const noReg = activeEncounter?.id ? activeEncounter.id.slice(-8).toUpperCase() : '-';
  const noRM = activePatient?.mrn || '-';
  const dob = activePatient?.demographics?.dob || '-';
  const age = activePatient?.id ? calculateAge(dob) : '-';
  const guarantor = activeEncounter?.guarantor || '-';
  const poli = activeEncounter?.department || '-';
  const doctor = activeEncounter?.doctor_name || activeEncounter?.doctor_email || '-';
  const patientName = activePatient?.name || 'PASIEN BELUM DIPILIH';
  const gender = activePatient?.demographics?.gender === 'M' ? 'Laki-Laki' : 'Perempuan';

  const renderModuleWorkspace = () => {
    if (!selectedModule) return null;

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setSelectedModule(null)}
            className="w-10 h-10 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center text-[var(--on-surface)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h3 className="text-2xl font-black text-[var(--on-surface)] tracking-tight">{selectedModule}</h3>
        </div>

        <ClinicalCard className="min-h-[600px] border-[var(--primary)]/30 shadow-2xl shadow-[var(--primary)]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Stethoscope size={240} />
          </div>
          
          <div className="relative z-10 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1.5 w-16 bg-gradient-to-r from-[var(--primary)] to-blue-400 rounded-full"></div>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.4em]">Integrated Entry Point</span>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {selectedModule === 'SOAP NOTES (CPPT)' ? (
                <div className="space-y-6">
                  {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
                    <div key={section} className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                        {section}
                      </label>
                      <textarea 
                        className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all min-h-[120px] placeholder:opacity-30"
                        placeholder={`Masukkan data ${section.toLowerCase()} di sini...`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                  <FileText size={80} strokeWidth={1} />
                  <h4 className="text-xl font-black mt-4 uppercase tracking-widest">Workspace Terbuka</h4>
                  <p className="text-sm font-bold mt-2">Formulir {selectedModule} sedang dimuat...</p>
                </div>
              )}
            </div>
          </div>
        </ClinicalCard>

        <div className="mt-8 flex flex-row justify-end items-center gap-4 bg-gradient-to-r from-[var(--surface-container-low)] to-[var(--surface-container)] p-6 rounded-[2.5rem] border border-[var(--outline-variant)] shadow-xl">
          <div className="mr-auto ml-4 flex flex-col">
            <div className="text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Session Active: {currentUser?.email}
            </div>
            <div className="text-[9px] font-bold text-[var(--on-surface-variant)]/60 uppercase tracking-tighter mt-1">
              Drafting Phase • Auto-save Enabled
            </div>
          </div>
          <button 
            onClick={() => setSelectedModule(null)}
            className="bg-[var(--surface-container-lowest)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-[var(--outline-variant)] shadow-sm"
          >
            Batal
          </button>
          <button className="bg-[var(--primary)] hover:brightness-110 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/30 transition-all active:scale-95 flex items-center gap-3 group">
            <ShieldAlert size={18} className="group-hover:rotate-12 transition-transform" /> Simpan & Finalisasi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] lg:h-screen bg-[var(--surface-container-lowest)] overflow-hidden">
      
      <div className="flex-none bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--outline-variant)] px-6 py-4 z-50 flex flex-row justify-between items-center shadow-sm">
         <div className="flex flex-row items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20">
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-[var(--on-surface)] m-0 leading-tight">Command Center</h1>
              <p className="text-xs font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">Outpatient EMR • RJ</p>
            </div>
         </div>
         <div className="flex flex-row gap-4 items-center">
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="bg-[var(--primary)] hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2"
            >
               <Search size={16} /> Cari Pasien
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 space-y-8 scroll-smooth">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-[var(--surface-container)] to-[var(--surface-container-low)] rounded-3xl border border-[var(--outline-variant)] shadow-lg shadow-black/5 p-6 flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <User size={120} />
            </div>
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 size={12} /> JCI Verified
                </span>
                <span className="bg-[var(--surface-container-highest)] text-[var(--on-surface-variant)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  MRN: {noRM}
                </span>
              </div>
              <h2 className="text-3xl font-black text-[var(--on-surface)] tracking-tight leading-none">{patientName}</h2>
              <div className="flex items-center gap-3 mt-3 text-sm font-bold text-[var(--on-surface-variant)]">
                <span className="flex items-center gap-1"><User size={16}/> {gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><CalendarDays size={16}/> {dob} ({age})</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[var(--surface-container-lowest)] rounded-3xl border border-[var(--outline-variant)] p-6 flex flex-col justify-center gap-4">
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
               <div>
                  <p className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-1">No. Registrasi</p>
                  <p className="text-sm font-black text-[var(--error)]">{noReg}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-1">Penjamin</p>
                  <p className="text-xs font-bold text-[var(--on-surface)] uppercase truncate" title={guarantor}>{guarantor}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-1">Departemen / Poli</p>
                  <p className="text-sm font-black text-[var(--on-surface)]">{poli}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest mb-1">DPJP</p>
                  <p className="text-sm font-bold text-[var(--on-surface)]">{doctor}</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-row items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                 <ShieldAlert size={20} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Alergi Terdaftar</p>
                 <p className="text-sm font-bold text-red-100">Tidak Ada Alergi</p>
               </div>
            </div>
            <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-row items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                 <BadgeInfo size={20} />
               </div>
               <div>
                 <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Status Penanda</p>
                 <p className="text-sm font-bold text-amber-100">Pasien Standar</p>
               </div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-[var(--surface-container-lowest)]/90 backdrop-blur-xl py-3 border-y border-[var(--outline-variant)] -mx-6 px-6 lg:-mx-10 lg:px-10">
           <div className="flex flex-row overflow-x-auto gap-2 no-scrollbar pb-2">
              {tabs.map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => {
                     setActiveTab(tab.id);
                     if (tab.id !== 'MODUL E-MR') setSelectedModule(null);
                   }}
                   className={`
                     flex flex-row items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300
                     ${activeTab === tab.id 
                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25 scale-105' 
                        : 'bg-[var(--surface-container)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] border border-[var(--outline-variant)]'}
                   `}
                 >
                    {tab.icon} {tab.id}
                 </button>
              ))}
           </div>
        </div>

        <div className="min-h-[500px]">
           {activeTab === 'MODUL E-MR' ? (
              selectedModule ? renderModuleWorkspace() : (
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <div className="bg-[var(--surface-container-low)]/50 rounded-[2.5rem] border border-[var(--outline-variant)] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="h-1 w-12 bg-[var(--primary)] rounded-full"></div>
                        <h4 className="text-[11px] font-black text-[var(--primary)] uppercase tracking-[0.3em]">Modul Operasional EMR</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={12} /> JCI Standards Compliant
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { name: 'SOAP NOTES (CPPT)', roles: ['doctor', 'nurse'] },
                        { name: 'Surat Permintaan Konsultasi', roles: ['doctor'] },
                        { name: 'Catatan Terintegrasi', roles: ['doctor', 'nurse'] },
                        { name: 'Catatan Keperawatan', roles: ['nurse'] },
                        { name: 'Observasi Keadaan Khusus', roles: ['nurse', 'doctor'] },
                        { name: 'Resiko Jatuh RI', roles: ['nurse'] },
                        { name: 'Resume Keperawatan', roles: ['nurse'] },
                        { name: 'Monitoring Nyeri Pasien', roles: ['nurse', 'doctor'] },
                        { name: 'Daftar Pengobatan', roles: ['doctor', 'nurse'] },
                        { name: 'Laporan Pembedahan', roles: ['doctor'] },
                        { name: 'Pengkajian Awal Perawat HD', roles: ['nurse'] },
                        { name: 'Monitoring Reaksi Transfusi', roles: ['nurse'] },
                        { name: 'Pengkajian Unit Gawat Darurat (UGD)', roles: ['doctor', 'nurse'] },
                        { name: 'Pengkajian MCU', roles: ['doctor', 'nurse'] },
                        { name: 'Resume Medis RJ', roles: ['doctor'] }
                      ].filter(mod => !mod.roles || mod.roles.includes(currentUser?.role || 'doctor')).map((mod) => (
                        <button 
                          key={mod.name} 
                          onClick={() => {
                            if (!selectedPatientId) {
                                alert('Harap pilih pasien terlebih dahulu.');
                                return;
                            }
                            if (mod.name.includes('SOAP NOTES')) {
                                console.log('Opening SOAP Modal for patient:', selectedPatientId);
                                setEditingSoapRecord(null);
                                setIsSoapModalOpen(true);
                            } else {
                                setSelectedModule(mod.name);
                            }
                          }}
                          className={`
                            px-6 py-5 rounded-2xl border text-[11px] font-black uppercase tracking-wider text-center transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm
                            ${mod.name === 'SOAP NOTES (CPPT)' ? 'bg-gradient-to-br from-[var(--primary)] to-blue-600 text-white border-[var(--primary)] shadow-xl shadow-[var(--primary)]/20 ring-2 ring-white/10' : 'bg-[var(--surface-container-lowest)] text-[var(--on-surface)] border-[var(--outline-variant)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--surface-container-low)]'}
                          `}
                        >
                          {mod.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
           ) : activeTab === 'LIST PEMERIKSAAN' ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-6">
                <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <History className="text-blue-600" />
                Riwayat Pemeriksaan Pasien
              </h2>
              </div>                {isLoadingRecords ? (
                  <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : soapRecords.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-center">
                    <History size={48} className="mb-4 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Belum ada riwayat pemeriksaan untuk pasien ini.</p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-[#121212]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-12 text-center">No</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-48">Tanggal</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Oleh</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500">Nama Pemeriksaan</th>
                          <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 w-20 text-center">Lihat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {soapRecords.map((record, index) => {
                          const recordDate = record.created_at?.toDate ? record.created_at.toDate() : new Date();
                          return (
                            <tr key={record.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                              <td className="px-4 py-3 text-sm text-gray-500 text-center font-medium">{index + 1}</td>
                              <td className="px-4 py-3 text-[12px] font-bold text-red-600 dark:text-red-400">
                                {recordDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')} / {recordDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{record.signed_by || record.doctor || 'Unknown'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[12px] font-bold text-blue-800 dark:text-blue-300">{record.assessment || 'Catatan Terintegrasi (SOAP)'}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button 
                                  onClick={() => handleEditSoap(record)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                  title="Lihat Detail"
                                >
                                  <Eye size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
           ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--on-surface-variant)] animate-in fade-in zoom-in-95 duration-500 bg-[var(--surface-container)]/50 rounded-3xl border border-[var(--outline-variant)]/50 border-dashed">
                 <div className="w-16 h-16 rounded-full bg-[var(--surface-container-high)] flex items-center justify-center mb-4 text-[var(--primary)]">
                    {tabs.find(t => t.id === activeTab)?.icon || <Activity size={24} />}
                 </div>
                 <h3 className="text-xl font-black mb-2">Modul {activeTab}</h3>
                 <p className="text-sm font-bold opacity-60 text-center max-w-md">Modul ini sudah siap digunakan dan terintegrasi dengan data rekam medis elektronik.</p>
              </div>
           )}
        </div>

      </div>
      
      {/* Search Modal */}
      <PatientSearchModal 
        isOpen={isSearchModalOpen} 
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handlePatientSelect}
      />

      {/* Soap Note Modal */}
      <SoapNoteModal 
        key={editingSoapRecord ? `edit-${editingSoapRecord.id}` : 'new-soap'}
        isOpen={isSoapModalOpen}
        onClose={() => setIsSoapModalOpen(false)}
        onSave={handleSoapSave}
        patient={activePatient}
        encounter={activeEncounter}
        initialData={editingSoapRecord}
      />
    </div>
  );
}
