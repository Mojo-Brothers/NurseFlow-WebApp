import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';
import { bedManagementService } from '../../services/bedManagement.service.js';
import { kpiCalculationService } from '../../services/kpiCalculation.service.js';

export default function FacilityHierarchyWorkspace() {
  const { entitiesData, openCreateModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const buildings = entitiesData['buildings'] || [];
  const floors = entitiesData['floors'] || [];
  const wards = entitiesData['wards'] || [];
  const beds = entitiesData['beds'] || [];
  const kpiSnapshots = entitiesData['clinical_kpi_snapshots'] || kpiCalculationService.getKpiSnapshots();

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [oxygenFilter, setOxygenFilter] = useState('ALL');
  const [ventilatorFilter, setVentilatorFilter] = useState('ALL');

  // Filter pipeline
  let displayedBeds = beds.filter(b => !b.is_deleted);
  if (selectedWardId) {
    displayedBeds = displayedBeds.filter(b => b.ward_id === selectedWardId);
  }
  if (selectedStatusFilter !== 'ALL') {
    displayedBeds = displayedBeds.filter(b => b.bed_status === selectedStatusFilter);
  }
  if (oxygenFilter === 'YES') {
    displayedBeds = displayedBeds.filter(b => b.has_oxygen);
  } else if (oxygenFilter === 'NO') {
    displayedBeds = displayedBeds.filter(b => !b.has_oxygen);
  }
  if (ventilatorFilter === 'YES') {
    displayedBeds = displayedBeds.filter(b => b.has_ventilator);
  } else if (ventilatorFilter === 'NO') {
    displayedBeds = displayedBeds.filter(b => !b.has_ventilator);
  }

  // Hospital Indicators
  const totalBeds = beds.filter(b => !b.is_deleted).length;
  const occupiedBeds = beds.filter(b => !b.is_deleted && b.bed_status === 'OCCUPIED').length;

  const borRate = bedManagementService.calculateBOR(occupiedBeds * 30, totalBeds, 30);
  const alosValue = bedManagementService.calculateLOS(120, 25);
  const toiValue = bedManagementService.calculateTOI(totalBeds, 30, occupiedBeds * 30, 25);
  const btoValue = bedManagementService.calculateBTO(25, totalBeds);

  return (
    <div className="space-y-6">
      
      {/* ─── Real-Time KPI Dashboard & Trend Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl">
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-teal-400 uppercase">BOR (Occupancy)</span>
            <span className="text-[9px] font-mono text-slate-400">Standar: 60-85%</span>
          </div>
          <p className="text-2xl font-headline font-black text-white">{borRate}%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Persentase Tempat Tidur Terisi</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase">ALOS (Length of Stay)</span>
            <span className="text-[9px] font-mono text-slate-400">Standar: 3-6 Hari</span>
          </div>
          <p className="text-2xl font-headline font-black text-white">{alosValue} Hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rata-rata Lama Rawat</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase">TOI (Turnover Interval)</span>
            <span className="text-[9px] font-mono text-slate-400">Standar: 1-3 Hari</span>
          </div>
          <p className="text-2xl font-headline font-black text-white">{toiValue} Hari</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rata-rata Waktu Kosong Bed</p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase">BTO (Bed Turnover)</span>
            <span className="text-[9px] font-mono text-slate-400">Standar: 4-5 Kali/Bln</span>
          </div>
          <p className="text-2xl font-headline font-black text-white">{btoValue} Kali</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Frekuensi Pemakaian per Bed</p>
        </div>
      </div>

      {/* ─── Historical KPI Trend Visualizer ─── */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Tren Historis Indikator Rawat Inap (Snapshot 3 Hari Terakhir)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kpiSnapshots.map(snap => (
            <div key={snap.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs">
              <div className="flex items-center justify-between font-mono font-bold text-primary mb-1">
                <span>{snap.snapshot_date}</span>
                <span className="text-emerald-600">BOR: {snap.bor}%</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-on-surface-variant font-mono">
                <div>ALOS: {snap.alos}d</div>
                <div>TOI: {snap.toi}d</div>
                <div>IGD: {snap.emergency_waiting_time}m</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Hierarchical Cascader Filter Bar ─── */}
      <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant mr-1">
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            <span>Hierarki:</span>
          </div>

          <select
            value={selectedBuildingId}
            onChange={(e) => {
              setSelectedBuildingId(e.target.value);
              setSelectedWardId('');
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
          >
            <option value="">-- Semua Gedung RS --</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.building_name}</option>
            ))}
          </select>

          <span className="text-on-surface-variant/40">&rarr;</span>

          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
          >
            <option value="">-- Semua Bangsal --</option>
            {wards.map(w => (
              <option key={w.id} value={w.id}>{w.ward_name}</option>
            ))}
          </select>

          <span className="text-on-surface-variant/40">&rarr;</span>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
          >
            <option value="ALL">Semua Status Okupansi</option>
            <option value="AVAILABLE">Tersedia (Available)</option>
            <option value="OCCUPIED">Terisi (Occupied)</option>
            <option value="CLEANING">Cleaning Sanitasi</option>
            <option value="BED_DISINFECTING">Disinfeksi</option>
            <option value="BED_MAINTENANCE_LOCK">Maintenance Lock</option>
          </select>

          <button
            onClick={() => setOxygenFilter(oxygenFilter === 'YES' ? 'ALL' : 'YES')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              oxygenFilter === 'YES' ? 'bg-teal-600 text-white border-teal-600' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">air</span>
            <span>O₂</span>
          </button>

          <button
            onClick={() => setVentilatorFilter(ventilatorFilter === 'YES' ? 'ALL' : 'YES')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
              ventilatorFilter === 'YES' ? 'bg-purple-600 text-white border-purple-600' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">mode_fan</span>
            <span>Ventilator</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveEntity('beds');
              openCreateModal();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah Tempat Tidur</span>
          </button>
        </div>
      </div>

      {/* ─── Visual Bed Matrix Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedBeds.map(bed => {
          const isOccupied = bed.bed_status === 'OCCUPIED';
          const isAvailable = bed.bed_status === 'AVAILABLE';
          const isCleaning = bed.bed_status === 'CLEANING' || bed.bed_status === 'BED_DISINFECTING';
          const isMaintenance = bed.bed_status === 'BED_MAINTENANCE_LOCK';

          return (
            <div
              key={bed.id}
              onClick={() => openDetailDrawer(bed)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer group hover:scale-[1.02] ${
                isAvailable
                  ? 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500 shadow-xs'
                  : isOccupied
                    ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500 shadow-xs'
                    : isCleaning
                      ? 'bg-purple-500/5 border-purple-500/30 hover:border-purple-500'
                      : isMaintenance
                        ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500'
                        : 'bg-surface-container border-outline-variant/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                  isAvailable
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : isOccupied
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      : isCleaning
                        ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                        : isMaintenance
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {bed.bed_status}
                </span>

                <div className="flex items-center gap-1.5">
                  {bed.has_oxygen && <span className="material-symbols-outlined text-[16px] text-teal-600">air</span>}
                  {bed.has_ventilator && <span className="material-symbols-outlined text-[16px] text-purple-600">mode_fan</span>}
                </div>
              </div>

              <h4 className="text-base font-headline font-black text-on-surface group-hover:text-primary transition-colors">
                {bed.bed_number}
              </h4>
              <p className="text-xs text-on-surface-variant font-bold mt-0.5">
                {bed.room_name} &bull; <span className="text-primary">{bed.class_name}</span>
              </p>
              <p className="text-[11px] text-on-surface-variant font-medium mt-1">
                {bed.ward_name}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
