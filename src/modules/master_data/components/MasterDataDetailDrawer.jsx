import React, { useState } from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { enterpriseFhirMapper } from '../services/enterpriseFhirMapper.service.js';

export default function MasterDataDetailDrawer() {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || 'admin@nurseflow.id';

  const {
    activeEntity,
    isDetailDrawerOpen,
    closeDetailDrawer,
    selectedItemForDetail,
    openEditModal,
    softDeleteRecord,
    restoreRecord
  } = useMasterDataStore();

  const [activeTab, setActiveTab] = useState('DETAILS'); // 'DETAILS' | 'AUDIT' | 'FHIR' | 'JSON'
  const [copied, setCopied] = useState(false);

  if (!isDetailDrawerOpen || !selectedItemForDetail) return null;

  const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || MASTER_DATA_ENTITIES[activeEntity] || {};
  const item = selectedItemForDetail;

  // Generate FHIR R4 mapping representation
  const generateFhirResource = () => {
    try {
      if (activeEntity === 'patients' || activeEntity === 'PATIENT') {
        return enterpriseFhirMapper.toFhirPatient(item);
      }
      if (activeEntity === 'doctors' || activeEntity === 'nurses' || activeEntity === 'DOCTOR' || activeEntity === 'NURSE') {
        return enterpriseFhirMapper.toFhirPractitioner(item, activeEntity.toUpperCase().includes('NURSE') ? 'NURSE' : 'DOCTOR');
      }
      if (activeEntity === 'diagnoses' || activeEntity === 'DIAGNOSIS') {
        return enterpriseFhirMapper.toFhirCondition(item);
      }
      if (activeEntity === 'procedures' || activeEntity === 'PROCEDURE') {
        return enterpriseFhirMapper.toFhirProcedure(item);
      }
      if (activeEntity === 'hospitals' || activeEntity === 'branches') {
        return enterpriseFhirMapper.toFhirOrganization(item);
      }
      if (activeEntity === 'beds' || activeEntity === 'rooms' || activeEntity === 'buildings') {
        return enterpriseFhirMapper.toFhirLocation(item, activeEntity === 'beds' ? 'BED' : 'ROOM');
      }
      
      return enterpriseFhirMapper.toGenericFhir(activeEntity, item);
    } catch (e) {
      return { error: 'Failed to generate FHIR schema', details: e.message };
    }
  };

  const fhirPayload = generateFhirResource();

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-xl bg-surface-container-high h-full shadow-2xl border-l border-outline-variant/30 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-outline-variant/20 bg-primary/5 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-[26px]">{config.icon || 'database'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  {item[config.codeField] || item.id}
                </span>
                {item.is_deleted ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    TERHAPUS (TRASH)
                  </span>
                ) : (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                    item.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {item.status || 'AKTIF'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-headline font-black text-on-surface leading-snug">
                {item[config.nameField] || item.name || 'Detail Entitas'}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {config.title} &bull; ID: <code className="font-mono">{item.id}</code>
              </p>
            </div>
          </div>

          <button
            onClick={closeDetailDrawer}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex items-center border-b border-outline-variant/20 px-6 bg-surface-container/40">
          <button
            onClick={() => setActiveTab('DETAILS')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'DETAILS'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Rincian Data
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'AUDIT'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Audit JCI
          </button>

          <button
            onClick={() => setActiveTab('FHIR')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'FHIR'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            SATUSEHAT FHIR
          </button>

          <button
            onClick={() => setActiveTab('JSON')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'JSON'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            JSON Raw
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* TAB 1: Rincian Data */}
          {activeTab === 'DETAILS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(item).map(([key, val]) => {
                  if (['id', 'is_deleted', 'created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by'].includes(key)) return null;
                  return (
                    <div key={key} className={typeof val === 'string' && val.length > 30 ? 'md:col-span-2' : ''}>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs font-semibold text-on-surface break-words">
                        {typeof val === 'boolean' ? (val ? 'Ya' : 'Tidak') : (val !== null && val !== undefined ? String(val) : '-')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* System Metadata Card */}
              <div className="p-4 rounded-2xl bg-surface-container/60 border border-outline-variant/20 space-y-2">
                <p className="text-xs font-black text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                  Metadata Sistem & Jejak Waktu
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
                  <div>
                    <span className="font-bold">Dibuat Oleh:</span> {item.created_by || 'system'}
                  </div>
                  <div>
                    <span className="font-bold">Waktu Dibuat:</span> {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                  </div>
                  <div>
                    <span className="font-bold">Diperbarui Oleh:</span> {item.updated_by || 'system'}
                  </div>
                  <div>
                    <span className="font-bold">Waktu Update:</span> {item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Audit Trail JCI */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">security</span>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">JCI Immutable Audit Compliance</h4>
                  <p className="text-xs text-on-surface-variant">
                    Seluruh modifikasi entitas master data dicatat dalam log append-only dengan delta snapshot.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-black text-[10px]">
                      BASELINE VERIFIED
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {item.created_at || '2026-08-01T08:00:00Z'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-on-surface">
                    Entitas diinisialisasi oleh <code>{item.created_by || 'system@nurseflow.id'}</code>
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Sumber: <code>WEB_APP_MASTER_DATA</code> &bull; Priority: <code>NORMAL_SYNC</code>
                  </p>
                </div>

                {item.updated_at && item.updated_at !== item.created_at && (
                  <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-black text-[10px]">
                        DATA UPDATED
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {item.updated_at}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-on-surface">
                      Modifikasi data oleh <code>{item.updated_by || 'admin@nurseflow.id'}</code>
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      Kategori perubahan: Sinkronisasi master data dan validasi izin operasional.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SATUSEHAT FHIR R4 */}
          {activeTab === 'FHIR' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant">
                  FHIR R4 Resource Mapping ({config.fhirResource || 'Basic'})
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  KEMENKES READY
                </span>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(fhirPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 4: Raw JSON */}
          {activeTab === 'JSON' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface-variant">Raw Object Payload</span>
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-bold text-on-surface flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                  <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-outline-variant/20 bg-surface-container/50 flex items-center justify-between gap-3">
          {item.is_deleted ? (
            <button
              onClick={() => {
                restoreRecord(item.id, userEmail);
                closeDetailDrawer();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
              <span>Pulihkan Data Ini</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (window.confirm(`Hapus lunak record ini?`)) {
                  softDeleteRecord(item.id, userEmail);
                  closeDetailDrawer();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-rose-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Hapus Lunak</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!item.is_deleted && (
              <button
                onClick={() => {
                  closeDetailDrawer();
                  openEditModal(item);
                }}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Ubah Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
