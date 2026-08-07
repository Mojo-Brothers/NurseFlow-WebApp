import React, { useEffect, useState } from 'react';
import BookingModal from '../components/BookingModal.jsx';
import AppointmentGrid from '../components/AppointmentGrid.jsx';
import { useAppointmentStore } from '../appointment.store.js';

const DUMMY_DOCTORS = [
  'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA',
  'dr. Andi Wijaya, Sp.PD',
  'dr. Budi Santoso, Sp.A',
  'drg. Citra Lestari'
];

export default function AppointmentPage() {
  const { appointments, fetchAppointments, isLoading } = useAppointmentStore();
  
  const [filterDoctor, setFilterDoctor] = useState(DUMMY_DOCTORS[0]);
  const [filterDate, setFilterDate] = useState('2026-08-07');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSelectSlot = (time) => {
    setSelectedSlot({
      time,
      date: filterDate,
      doctor: filterDoctor
    });
    setIsModalOpen(true);
  };

  const handleReset = () => {
    setFilterDoctor(DUMMY_DOCTORS[0]);
    setFilterDate('2026-08-07');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-30">
        <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#007399] text-white flex items-center justify-center shadow-md shadow-[#007399]/25">
              <span className="material-symbols-outlined text-2xl">calendar_month</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Manajemen Janji Temu (Appointment)
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Monitoring Slot Jadwal Dokter & Pendaftaran Poliklinik Rawat Jalan
              </p>
            </div>
          </div>

          {/* Filter Bar (Dokter & Tanggal) */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-800/60 p-2 rounded-full border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap ml-2">Dokter:</label>
              <select 
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-[#007399]/30 outline-none w-64 shadow-xs cursor-pointer"
              >
                {DUMMY_DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Tanggal:</label>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-[#007399]/30 outline-none shadow-xs cursor-pointer"
              />
            </div>

            <button 
              onClick={() => fetchAppointments()}
              className="px-4 py-1.5 bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold rounded-full shadow-sm transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">search</span> Cari
            </button>
            <button 
              onClick={handleReset}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Sub Header Navigation & View Toggle */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#007399] text-slate-700 dark:text-slate-300 font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm text-[#007399]">calendar_month</span> Jadwal Dokter
            </button>
            <button className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-[#007399] text-slate-700 dark:text-slate-300 font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm text-[#007399]">description</span> Laporan
            </button>
          </div>

          {/* VIEW MODE TOGGLE BUTTONS */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
            <button 
              onClick={() => setViewMode('card')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'card' 
                  ? 'bg-[#007399] text-white shadow-sm shadow-[#007399]/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-xs">grid_view</span> Kartu
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-[#007399] text-white shadow-sm shadow-[#007399]/25' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-xs">table_rows</span> Tabel
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <AppointmentGrid 
            appointments={appointments}
            doctor={filterDoctor}
            date={filterDate}
            onSelectSlot={handleSelectSlot}
            viewMode={viewMode}
          />
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slotData={selectedSlot}
      />
    </div>
  );
}
