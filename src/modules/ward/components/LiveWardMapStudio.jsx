import React, { useState } from 'react';
import { bedManagementFsmEngine, BED_STATES } from '../../../../server/services/bedManagementFsmEngine.service.js';
import toast from 'react-hot-toast';

export default function LiveWardMapStudio() {
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedState, setSelectedState] = useState('ALL');
  const [beds, setBeds] = useState(bedManagementFsmEngine.getAllBeds());
  const [activeBedModal, setActiveBedModal] = useState(null);

  const refreshBeds = () => {
    setBeds(bedManagementFsmEngine.getAllBeds({ wardCode: selectedWard, state: selectedState }));
  };

  const handleStateTransition = (bedCode, targetState) => {
    try {
      bedManagementFsmEngine.transitionBedState(bedCode, targetState, {
        performedBy: 'Perawat Penanggung Jawab',
        reason: `Aksi FSM Cepat via Live Ward Map (${targetState})`
      });
      refreshBeds();
      setActiveBedModal(null);
      toast.success(`Bed ${bedCode} berhasil beralih ke status ${targetState}!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDischarge = (bedCode) => {
    try {
      bedManagementFsmEngine.dischargePatientFromBed(bedCode, {
        performedBy: 'Perawat Primer',
        dischargeSummary: 'Pemulangan pasien rawat inap selesai.'
      });
      refreshBeds();
      setActiveBedModal(null);
      toast.success(`Pasien di Bed ${bedCode} telah dipulangkan. Bed ditandai DIRTY.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStateColorClass = (state) => {
    switch (state) {
      case BED_STATES.AVAILABLE:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
      case BED_STATES.OCCUPIED:
        return 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300';
      case BED_STATES.RESERVED:
        return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300';
      case BED_STATES.DIRTY:
        return 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300';
      case BED_STATES.CLEANING:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300';
    }
  };

  const filteredBeds = bedManagementFsmEngine.getAllBeds({ wardCode: selectedWard, state: selectedState });

  return (
    <div className="space-y-6">
      {/* Filter & Stats Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Bangsal Rawat Inap</option>
            <option value="WRD-CHRY">Bangsal Chrysant (Kelas 1 & 2)</option>
            <option value="WRD-ORCH">Bangsal Orchid (VIP & VVIP)</option>
            <option value="WRD-ICU">Intensive Care Unit (ICU)</option>
            <option value="WRD-ISO">Isolasi Tekanan Negatif</option>
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Status FSM</option>
            <option value={BED_STATES.AVAILABLE}>🟢 AVAILABLE (Kosong/Siap)</option>
            <option value={BED_STATES.OCCUPIED}>🔴 OCCUPIED (Terisi)</option>
            <option value={BED_STATES.RESERVED}>🟡 RESERVED (Dipesan)</option>
            <option value={BED_STATES.DIRTY}>🟣 DIRTY (Kotor/Perlu Dibersihkan)</option>
            <option value={BED_STATES.CLEANING}>🔵 CLEANING (Sedang Dibersihkan)</option>
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <span>Total Bed Terlihat: <strong className="text-slate-900 dark:text-white font-mono">{filteredBeds.length}</strong></span>
        </div>
      </div>

      {/* 2D Ward Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeds.map((bed) => (
          <div
            key={bed.id}
            className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${getStateColorClass(bed.state)} bg-white dark:bg-slate-900`}
          >
            {/* Top Row: Bed Code & Indicators */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{bed.bed_code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {bed.room_type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{bed.ward_name}</p>
              </div>

              {/* State Badge */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStateColorClass(bed.state)}`}>
                {bed.state}
              </span>
            </div>

            {/* Middle Section: Occupancy Details or Equipment Icons */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              {bed.current_occupancy ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-rose-500">person</span>
                      {bed.current_occupancy.patient_name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-400">MRN: {bed.current_occupancy.mrn}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    Dx: <strong className="text-slate-700 dark:text-slate-300">{bed.current_occupancy.diagnosis_name}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">DPJP: {bed.current_occupancy.dpjp_name}</p>
                </div>
              ) : bed.reservation ? (
                <div className="text-amber-700 dark:text-amber-300">
                  <p className="font-bold">Dipesan untuk: {bed.reservation.patient_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {bed.reservation.reserved_by}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>{bed.state === BED_STATES.AVAILABLE ? 'Siap Menerima Pasien' : 'Tidak Ada Pasien'}</span>
                  <div className="flex items-center gap-1.5">
                    {bed.has_ventilator && <span className="material-symbols-outlined text-sm text-teal-500" title="Ventilator Ready">air</span>}
                    {bed.has_central_oxygen && <span className="material-symbols-outlined text-sm text-blue-500" title="Central O2">water_drop</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-2 pt-1">
              {bed.state === BED_STATES.OCCUPIED ? (
                <button
                  onClick={() => handleDischarge(bed.bed_code)}
                  className="flex-1 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                >
                  Pulangkan Pasien
                </button>
              ) : bed.state === BED_STATES.DIRTY ? (
                <button
                  onClick={() => handleStateTransition(bed.bed_code, BED_STATES.CLEANING)}
                  className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                >
                  Mulai Bersihkan
                </button>
              ) : bed.state === BED_STATES.CLEANING ? (
                <button
                  onClick={() => handleStateTransition(bed.bed_code, BED_STATES.AVAILABLE)}
                  className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  Selesai Bersih (Siap)
                </button>
              ) : (
                <button
                  onClick={() => handleStateTransition(bed.bed_code, BED_STATES.RESERVED)}
                  className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Reservasi Bed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
