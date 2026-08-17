import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';

export default function OrganizationWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const hospitals = entitiesData['hospitals'] || [];
  const branches = entitiesData['branches'] || [];
  const departments = entitiesData['departments'] || [];
  const units = entitiesData['units'] || [];
  const positions = entitiesData['positions'] || [];
  const costCenters = entitiesData['cost_centers'] || [];

  const [activeOrgTab, setActiveOrgTab] = useState('TREE'); // 'TREE' | 'HOSPITALS' | 'BRANCHES' | 'DEPARTMENTS' | 'UNITS' | 'POSITIONS' | 'COST_CENTERS'

  return (
    <div className="space-y-6">
      
      {/* ─── Top Sub-Nav Ribbon ─── */}
      <div className="p-4 rounded-3xl bg-surface-container-high border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              CORPORATE GOVERNANCE
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">Multi-Branch & Cost Centers</span>
          </div>
          <h3 className="text-base font-headline font-black text-on-surface">Struktur Organisasi & Tata Kelola Rumah Sakit</h3>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveOrgTab('TREE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeOrgTab === 'TREE' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>Bagan Hierarki Pohon</span>
          </button>

          <button
            onClick={() => {
              setActiveOrgTab('DEPARTMENTS');
              setActiveEntity('departments');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeOrgTab === 'DEPARTMENTS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
            <span>Departemen ({departments.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveOrgTab('UNITS');
              setActiveEntity('units');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeOrgTab === 'UNITS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">domain</span>
            <span>Unit Kerja ({units.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveOrgTab('COST_CENTERS');
              setActiveEntity('cost_centers');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeOrgTab === 'COST_CENTERS' ? 'bg-blue-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">monetization_on</span>
            <span>Cost Center ({costCenters.length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: Visual Interactive Organizational Tree ─── */}
      {activeOrgTab === 'TREE' && (
        <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <h4 className="text-base font-headline font-black text-on-surface">Peta Struktur Hierarki Multi-Cabang & Unit</h4>
              <p className="text-xs text-on-surface-variant font-medium">Visualisasi konektivitas Rumah Sakit Induk, Kantor Cabang, dan Instalasi Klinis.</p>
            </div>
            <button
              onClick={() => {
                setActiveEntity('departments');
                openCreateModal();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Tambah Departemen</span>
            </button>
          </div>

          {/* Level 1: RS Induk */}
          {hospitals.map(hosp => (
            <div key={hosp.id} className="space-y-4">
              <div className="p-5 rounded-2xl bg-blue-600/10 border-2 border-blue-500/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/30">
                    <span className="material-symbols-outlined text-[26px]">local_hospital</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      RUMAH SAKIT INDUK (TIER 1)
                    </span>
                    <h3 className="text-lg font-headline font-black text-on-surface mt-1">{hosp.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">
                      SATUSEHAT Org ID: <strong>{hosp.satusehat_org_id || '100028741'}</strong> &bull; {hosp.type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openDetailDrawer(hosp)}
                  className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold hover:text-blue-600 transition-colors"
                >
                  Detail & FHIR
                </button>
              </div>

              {/* Level 2: Cabang Regional */}
              <div className="pl-6 border-l-2 border-dashed border-blue-500/30 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">share_location</span>
                  <span>Cabang Regional RS:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {branches.map(brn => (
                    <div
                      key={brn.id}
                      onClick={() => openDetailDrawer(brn)}
                      className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-blue-500/40 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          {brn.code}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          {brn.status || 'ACTIVE'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-on-surface">{brn.name}</h4>
                      <p className="text-xs text-on-surface-variant font-mono">Telepon: {brn.phone || '-'}</p>
                    </div>
                  ))}
                </div>

                {/* Level 3: Departemen & Instalasi */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                    <span>Departemen & Instalasi Pelayanan:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {departments.map(dept => (
                      <div
                        key={dept.id}
                        onClick={() => openDetailDrawer(dept)}
                        className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 hover:border-blue-500/40 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-primary">{dept.code}</span>
                          <span className="text-[10px] font-semibold text-on-surface-variant">{dept.category}</span>
                        </div>
                        <h5 className="text-xs font-black text-on-surface">{dept.name}</h5>
                        <p className="text-[11px] text-on-surface-variant font-medium">Ka. Dept: {dept.head_name || '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 2: Departemen List ─── */}
      {activeOrgTab === 'DEPARTMENTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div
              key={dept.id}
              onClick={() => openDetailDrawer(dept)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-blue-500/40 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">{dept.code}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600">
                  {dept.category}
                </span>
              </div>
              <h4 className="text-sm font-black text-on-surface">{dept.name}</h4>
              <p className="text-xs text-on-surface-variant">Kepala Instalasi: <strong>{dept.head_name}</strong></p>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 3: Units List ─── */}
      {activeOrgTab === 'UNITS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {units.map(unit => (
            <div
              key={unit.id}
              onClick={() => openDetailDrawer(unit)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-blue-500/40 transition-all cursor-pointer space-y-2"
            >
              <span className="font-mono text-xs font-bold text-blue-600">{unit.code}</span>
              <h4 className="text-sm font-black text-on-surface">{unit.name}</h4>
              <p className="text-xs text-on-surface-variant">Induk: <strong>{unit.department_name}</strong></p>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 4: Cost Centers ─── */}
      {activeOrgTab === 'COST_CENTERS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {costCenters.map(cc => (
            <div
              key={cc.id}
              onClick={() => openDetailDrawer(cc)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-blue-500/40 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">{cc.code}</span>
                <span className="text-[10px] font-bold text-emerald-600">AKTIF</span>
              </div>
              <h4 className="text-sm font-black text-on-surface">{cc.name}</h4>
              <p className="text-xs text-on-surface-variant">Departemen: <strong>{cc.department_name}</strong></p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
