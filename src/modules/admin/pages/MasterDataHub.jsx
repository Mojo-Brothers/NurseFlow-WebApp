import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMasterDataStore } from '../masterData.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { fetchAuditLogs } from '../services/admin.service.js';

export default function MasterDataHub({ isEmbedded = false }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { 
    categories, serviceCatalog, medicationSafety,
    isLoading, error, fetchMasterData, performSeed,
    addItem, updateItem, deleteItem, setError 
  } = useMasterDataStore();
  
  const [activeTab, setActiveTab] = useState('GENERAL'); // GENERAL, CATALOG, SAFETY
  const [recentLogs, setRecentLogs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [newItemValue, setNewItemValue] = useState('');

  useEffect(() => {
    fetchMasterData();
    const loadLogs = async () => {
      try {
        const logs = await fetchAuditLogs(10);
        setRecentLogs(logs.filter(l => l.resource_type === 'master_data'));
      } catch (e) {
        console.error('Failed to load audit logs:', e);
      }
    };
    loadLogs();
  }, [fetchMasterData]);

  const handleInitialize = async (e) => {
    e.preventDefault();
    if (!window.confirm(t('admin_hub.confirm_seed'))) return;
    const result = await performSeed();
    if (result === true) {
      alert(t('admin_hub.seed_success'));
    }
  };


  const onAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;
    try {
      await addItem(selectedCat.id, newItemValue.trim(), currentUser?.email || 'admin@nurseflow.id');
      setNewItemValue('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Add item failed:', err);
    }
  };

  return (
    <div className={`admin-hub-container ${isEmbedded ? 'p-0' : 'p-6 lg:p-10'} w-full bg-surface text-on-surface relative isolate`}>
      
      {/* 🟢 MODERN ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-high w-full max-w-md rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-outline-variant/20 flex-row flex-wrap items-center justify-between bg-primary/5 min-w-0 gap-4">
              <h3 className="text-xl font-headline font-black tracking-tighter text-on-surface truncate flex-1 min-w-0">{t('admin_hub.modal.add_title')}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-error shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={onAddItemSubmit} className="p-8">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{t('common.category')}: {selectedCat?.title}</p>
              <div className="relative mb-6">
                <input 
                  autoFocus
                  type="text"
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  placeholder={t('admin_hub.modal.placeholder')}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl bg-surface-container-low text-on-surface-variant font-bold text-sm hover:bg-surface-container-highest transition-all"
                >
                  {t('admin_hub.modal.btn_cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={!newItemValue.trim()}
                  className="flex-[2] py-4 rounded-2xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {t('admin_hub.modal.btn_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      {!isEmbedded && (
        <div className="flex-row flex-wrap items-center justify-between mb-10 gap-6 min-w-0">
          <div className="min-w-0">
            <div className="flex-row items-center gap-2 mb-1 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] truncate">{t('admin_hub.module_meta')}</p>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-on-surface truncate">{t('admin_hub.title')}</h2>
            <p className="text-on-surface-variant text-sm mt-1 font-medium truncate">{t('admin_hub.governance')}</p>
          </div>
          
          <div className="flex-row items-center gap-3 shrink-0 ml-auto lg:ml-0">
            <button 
              onClick={() => fetchMasterData()}
              className="p-2.5 rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors shrink-0"
              title={t('common.refresh')}
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
            </button>
            <button 
              type="button"
              onClick={handleInitialize}
              className="btn-primary-small px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              {t('admin_hub.btn_test')}
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/30 shadow-sm overflow-hidden relative group">
          <div className="flex-row justify-between items-start mb-4 min-w-0">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{t('admin_hub.metrics.local_persistence')}</p>
              <h3 className="text-xl font-headline font-bold text-on-surface">{t('admin_hub.metrics.sync_queue')}</h3>
            </div>
            <span className="material-symbols-outlined text-primary/40 group-hover:rotate-180 transition-transform duration-700">sync_saved_locally</span>
          </div>
          <div className="flex-row items-end gap-3 mb-4 min-w-0">
            <span className="text-4xl font-headline font-black text-primary">0</span>
            <span className="text-xs font-bold text-on-surface-variant mb-1.5 uppercase">{t('admin_hub.metrics.pending_actions')}</span>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-outline-variant/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[100%] rounded-full"></div>
            </div>
            <p className="text-[10px] font-medium text-on-surface-variant flex-row items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {t('admin_hub.metrics.sync_ok')}
            </p>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
          <div className="flex-row justify-between items-start mb-4 min-w-0">
            <div>
              <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-1">{t('admin_hub.metrics.traceability')}</p>
              <h3 className="text-xl font-headline font-bold text-on-surface">{t('admin_hub.metrics.audit_score')}</h3>
            </div>
            <span className="material-symbols-outlined text-tertiary/40">verified_user</span>
          </div>
          <div className="flex-row items-center gap-4 min-w-0">
            <div className="relative w-16 h-16 flex-row items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-outline-variant/20" />
                <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="175.9" strokeDashoffset="17.59" className="text-tertiary" />
              </svg>
              <span className="absolute text-sm font-black text-on-surface">90%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">{t('common.status.excellent')}</p>
              <p className="text-[10px] text-on-surface-variant leading-tight">{t('admin_hub.metrics.audit_score_desc')}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/30 shadow-sm">
          <div className="flex-row justify-between items-start mb-4 min-w-0">
            <div>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-1">{t('admin_hub.metrics.deployment')}</p>
              <h3 className="text-xl font-headline font-bold text-on-surface">{t('admin_hub.metrics.his_readiness')}</h3>
            </div>
            <span className="material-symbols-outlined text-secondary/40">account_tree</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { label: t('nav.patients'), ok: true },
              { label: t('nav.triage'), ok: true },
              { label: t('nav.emr'), ok: true },
              { label: t('nav.billing'), ok: true },
              { label: t('nav.pharmacy'), ok: true },
              { label: t('inventory_v2.title'), ok: false }
            ].map(m => (
              <div key={m.label} className="flex-row items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/10 min-w-0">
                <span className={`w-2 h-2 rounded-full ${m.ok ? 'bg-green-500' : 'bg-outline-variant'}`}></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-8 p-4 bg-error-container/20 border border-error/30 rounded-2xl flex-row items-start gap-4 animate-in slide-in-from-top-4 duration-500 min-w-0">
          <span className="material-symbols-outlined text-error mt-0.5">error</span>
          <div className="flex-1">
            <h4 className="font-headline font-bold text-error mb-1">{t('admin_hub.error.op_failed')}</h4>
            <p className="text-sm text-on-error-container/80 leading-relaxed">
              {error}. {t('admin_hub.error.admin_required')}
            </p>
          </div>
          <button onClick={() => setError(null)} className="text-error/60 hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {/* 📑 MASTER DATA TABS */}
      <div className="flex-row flex-nowrap gap-2 mb-8 p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/20 w-fit overflow-x-auto max-w-full custom-scrollbar">
        {[
          { id: 'GENERAL', label: t('admin_hub.tabs.general'), icon: 'settings_input_component' },
          { id: 'CATALOG', label: t('admin_hub.tabs.catalog'), icon: 'receipt_long' },
          { id: 'SAFETY', label: t('admin_hub.tabs.safety'), icon: 'medical_services' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-row items-center gap-2 px-6 py-2.5 rounded-xl font-label text-sm font-bold transition-all shrink-0 whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined text-lg shrink-0">{tab.icon}</span>
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 animate-pulse">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="font-headline text-lg font-bold text-primary">{t('admin_hub.loading')}</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'GENERAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-surface-container-high rounded-3xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all group">
                  <div className="flex-row justify-between items-start mb-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex-row items-center justify-center shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-2xl">{cat.icon || 'settings'}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedCat(cat);
                        setNewItemValue('');
                        setShowAddModal(true);
                      }}
                      className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                    </button>
                  </div>
                  <h3 className="text-lg font-headline font-bold text-on-surface mb-1">{cat.title}</h3>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-6 opacity-70">{cat.description}</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {cat.items?.map((item, idx) => (
                      <div key={idx} className="flex-row justify-between items-center p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/10 group/item min-w-0">
                        <span className="text-xs font-bold text-on-surface-variant truncate pr-2">{item}</span>
                        <div className="flex-row items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                          <button 
                            onClick={() => {
                              const newVal = window.prompt(t('admin_hub.prompt_edit'), item);
                              if (newVal && newVal !== item) updateItem(cat.id, item, newVal, currentUser?.email);
                            }} 
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(t('admin_hub.confirm_delete_item', { item }))) deleteItem(cat.id, item, currentUser?.email);
                            }} 
                            className="p-1.5 rounded-lg hover:bg-error/10 text-error"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'CATALOG' && (
            <div className="bg-surface-container-high rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest border-b border-outline-variant/20">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('admin_hub.table.id')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('admin_hub.table.item')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">{t('admin_hub.table.price')}</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">{t('admin_hub.table.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {serviceCatalog.map((item) => (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 text-xs font-mono font-bold text-primary/60">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">{item.description}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-on-surface">
                        {new Intl.NumberFormat('id-ID').format(item.unit_price)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded border border-green-200">{t('admin_hub.table.active')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'SAFETY' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-error-container/10 rounded-3xl border border-error/20 p-8 shadow-sm">
                <div className="flex-row items-center gap-3 mb-6 min-w-0">
                  <span className="material-symbols-outlined text-error text-3xl">warning</span>
                  <h3 className="text-xl font-headline font-black text-error">{t('admin_hub.safety.high_alert')}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {medicationSafety?.high_alert?.list?.map(drug => (
                    <span key={drug} className="px-4 py-2 bg-error text-on-primary rounded-full text-xs font-black tracking-wide shadow-sm uppercase">
                      {drug}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-high rounded-3xl border border-outline-variant/30 p-8 shadow-sm">
                <div className="flex-row items-center gap-3 mb-6 min-w-0">
                  <span className="material-symbols-outlined text-primary text-3xl">swap_horiz</span>
                  <h3 className="text-xl font-headline font-black text-on-surface">{t('admin_hub.safety.lasa')}</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {medicationSafety?.lasa?.pairs?.map((pair, idx) => (
                    <div key={idx} className="flex-row items-center justify-between p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/30 transition-all min-w-0">
                      <span className="text-sm font-black text-primary truncate flex-1 text-left">{pair.d1 || pair[0]}</span>
                      <span className="material-symbols-outlined opacity-20 shrink-0 mx-4">compare_arrows</span>
                      <span className="text-sm font-black text-primary truncate flex-1 text-right">{pair.d2 || pair[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Log (Footer) */}
      <div className="mt-12 pt-8 border-t border-outline-variant/30">
        <div className="flex-row items-center gap-2 mb-4 min-w-0">
          <span className="material-symbols-outlined text-on-surface-variant text-xl">history_edu</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">{t('admin_hub.log.title')}</h3>
        </div>
        <div className="space-y-3">
          {recentLogs.map((log, idx) => (
            <div key={idx} className="text-[11px] font-medium text-on-surface-variant flex-row items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors min-w-0">
              <span className="text-primary font-black w-24 shrink-0 uppercase tracking-tighter truncate">[{log.action}]</span>
              <span className="opacity-60 shrink-0">{log.timestamp?.toDate()?.toLocaleString() || t('common.just_now')}</span>
              <span className="font-bold text-on-surface truncate max-w-[150px]">{t('common.user')}: {log.user}</span>
              <span className="flex-1 truncate min-w-0">ID: {log.resource_id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
