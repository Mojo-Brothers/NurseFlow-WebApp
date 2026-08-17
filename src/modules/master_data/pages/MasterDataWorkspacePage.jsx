import React, { useEffect, useState } from 'react';
import { useEnterpriseMasterStore } from '../masterData.store.js';
import { ENTERPRISE_DOMAINS, ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';
import MasterDataStatsBar from '../components/MasterDataStatsBar.jsx';
import MasterDataFilterBar from '../components/MasterDataFilterBar.jsx';
import MasterDataTable from '../components/MasterDataTable.jsx';
import MasterDataFormModal from '../components/MasterDataFormModal.jsx';
import MasterDataDetailDrawer from '../components/MasterDataDetailDrawer.jsx';
import MasterDataImportModal from '../components/MasterDataImportModal.jsx';
import RbacMatrixModal from '../components/submodules/RbacMatrixModal.jsx';

// 9 Dedicated Domain Workspaces
import ReferenceDataWorkspace from '../components/domains/ReferenceDataWorkspace.jsx';
import OrganizationWorkspace from '../components/domains/OrganizationWorkspace.jsx';
import HumanResourceWorkspace from '../components/domains/HumanResourceWorkspace.jsx';
import FacilityHierarchyWorkspace from '../components/domains/FacilityHierarchyWorkspace.jsx';
import PatientMasterWorkspace from '../components/domains/PatientMasterWorkspace.jsx';
import ClinicalMasterWorkspace from '../components/domains/ClinicalMasterWorkspace.jsx';
import SecurityRbacWorkspace from '../components/domains/SecurityRbacWorkspace.jsx';
import AuditTrailWorkspace from '../components/domains/AuditTrailWorkspace.jsx';
import IntegrationWorkspace from '../components/domains/IntegrationWorkspace.jsx';

export default function MasterDataWorkspacePage() {
  const {
    activeDomain,
    setActiveDomain,
    activeEntity,
    setActiveEntity,
    fetchAllEnterpriseData,
    entitiesData,
    resetEntireEnterpriseData
  } = useEnterpriseMasterStore();

  const [viewMode, setViewMode] = useState('WORKSPACE'); // 'WORKSPACE' | 'TABLE'
  const [isRbacModalOpen, setIsRbacModalOpen] = useState(false);

  useEffect(() => {
    fetchAllEnterpriseData();
  }, []);

  const currentDomainConfig = ENTERPRISE_DOMAINS.find(d => d.id === activeDomain) || ENTERPRISE_DOMAINS[0];
  const activeEntityConfig = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || {};

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 relative isolate">
      
      {/* ─── Top Branding & Governance Header ─── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-outline-variant/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              NurseFlow Enterprise HIS 2026
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              JCI & SATUSEHAT FHIR R4 READY
            </span>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              9 CORE DOMAINS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-headline font-black tracking-tight text-on-surface">
            Pusat Pengelolaan Master Data Enterprise
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-0.5">
            Single Source of Truth SIMRS / RME: Reference Data, Organisasi, SDM Medis, Fasilitas 6-Tingkat, Patient 360, Tarif, Security, Audit & Integrasi.
          </p>
        </div>

        {/* Global Utilities */}
        <div className="flex items-center gap-2 self-stretch lg:self-auto">
          <div className="flex items-center rounded-xl bg-surface-container-high border border-outline-variant/30 p-1">
            <button
              onClick={() => setViewMode('WORKSPACE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'WORKSPACE' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
              <span>Workspace Khusus</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Mode Tabel Raw</span>
            </button>
          </div>

          <button
            onClick={() => setIsRbacModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            <span>Matriks RBAC</span>
          </button>
        </div>
      </div>

      {/* ─── 9 Enterprise Domain Navigation Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-6">
        {ENTERPRISE_DOMAINS.map(domain => {
          const isActive = domain.id === activeDomain;
          const totalInDomain = domain.entities.reduce((acc, entKey) => {
            const list = entitiesData[entKey] || [];
            return acc + list.filter(i => !i.is_deleted).length;
          }, 0);

          return (
            <button
              key={domain.id}
              onClick={() => setActiveDomain(domain.id)}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between group relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-surface-container-highest border-primary/40 shadow-md shadow-primary/10 ring-2 ring-primary/20'
                  : 'bg-surface-container-high border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-highest/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  isActive ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[17px]">{domain.icon}</span>
                </div>
                <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-primary/15 text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  {totalInDomain}
                </span>
              </div>

              <div>
                <p className={`text-[10px] font-extrabold leading-tight truncate ${isActive ? 'text-primary font-black' : 'text-on-surface'}`}>
                  {domain.title}
                </p>
                <p className="text-[8px] text-on-surface-variant font-medium truncate mt-0.5">
                  {domain.entities.length} Entitas
                </p>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-b-2xl"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Sub-Entity Navigation Pills in Current Domain ─── */}
      <div className="p-2 rounded-2xl bg-surface-container-high border border-outline-variant/30 mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-xs">
        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-2.5 shrink-0">
          Entitas:
        </span>
        {currentDomainConfig.entities.map(entKey => {
          const schema = ENTERPRISE_ENTITY_SCHEMAS[entKey];
          if (!schema) return null;
          const isCurrent = entKey === activeEntity;
          const count = (entitiesData[entKey] || []).filter(i => !i.is_deleted).length;

          return (
            <button
              key={entKey}
              onClick={() => setActiveEntity(entKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/30 scale-[1.02]'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {schema.icon || 'folder'}
              </span>
              <span>{schema.title || entKey}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isCurrent ? 'bg-white/20 text-white font-black' : 'bg-surface-container-highest text-on-surface-variant font-bold'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Dynamic 9 Domain Workspace Renderers vs Raw Table Mode ─── */}
      {viewMode === 'WORKSPACE' && activeDomain === 'REFERENCE' ? (
        <ReferenceDataWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'ORGANIZATION' ? (
        <OrganizationWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'HUMAN_RESOURCE' ? (
        <HumanResourceWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'FACILITY' ? (
        <FacilityHierarchyWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'PATIENT' ? (
        <PatientMasterWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'CLINICAL' ? (
        <ClinicalMasterWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'SECURITY' ? (
        <SecurityRbacWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'AUDIT' ? (
        <AuditTrailWorkspace />
      ) : viewMode === 'WORKSPACE' && activeDomain === 'INTEGRATION' ? (
        <IntegrationWorkspace />
      ) : (
        <div className="space-y-6">
          {/* Active Entity Info Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">{activeEntityConfig.icon || 'dataset'}</span>
              </div>
              <div>
                <h2 className="text-lg font-headline font-black text-on-surface">
                  {activeEntityConfig.title || activeEntity}
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Domain: <strong className="text-primary">{currentDomainConfig.title}</strong> &bull; FHIR: <span className="font-bold text-teal-600">{activeEntityConfig.fhirResource || 'Basic'}</span>
                </p>
              </div>
            </div>
          </div>

          <MasterDataStatsBar />
          <MasterDataFilterBar />
          <MasterDataTable />
        </div>
      )}

      {/* ─── Global Overlays ─── */}
      <MasterDataFormModal />
      <MasterDataDetailDrawer />
      <MasterDataImportModal />
      <RbacMatrixModal isOpen={isRbacModalOpen} onClose={() => setIsRbacModalOpen(false)} />

    </div>
  );
}
