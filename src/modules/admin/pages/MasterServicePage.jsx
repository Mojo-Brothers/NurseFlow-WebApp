import React, { useState, useEffect, useMemo } from 'react';
import { 
  Stethoscope, Plus, Search, Filter, SlidersHorizontal, Download, 
  Grid, Table as TableIcon, Edit2, Trash2, Tag, Building2, Calculator, 
  ShieldCheck, Activity, Package, CheckCircle2, FileCode, RefreshCw
} from 'lucide-react';
import { getAllMasterServices, saveMasterService, deleteMasterService } from '../services/masterService.service.js';
import ServiceFormModal from '../components/ServiceFormModal.jsx';
import ServiceBundleModal from '../components/ServiceBundleModal.jsx';
import toast from 'react-hot-toast';

export default function MasterServicePage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeGuarantor, setActiveGuarantor] = useState('ALL');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('nurseflow_service_view_mode') || 'table');

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllMasterServices();
      setServices(data);
    } catch (err) {
      toast.error(`Gagal memuat master layanan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('nurseflow_service_view_mode', mode);
  };

  // Filter Services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (s.status === 'OBSOLETE') return false;
      if (activeCategory !== 'ALL' && s.category !== activeCategory) return false;
      if (activeGuarantor !== 'ALL' && (!s.guarantors || !s.guarantors.includes(activeGuarantor))) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q) ||
        s.icd9Code?.toLowerCase().includes(q) ||
        s.satusehatCode?.includes(q) ||
        s.department?.toLowerCase().includes(q)
      );
    });
  }, [services, searchTerm, activeCategory, activeGuarantor]);

  // Save / Update Handler
  const handleSaveService = async (serviceData) => {
    try {
      await saveMasterService(serviceData);
      toast.success(`Katalog Layanan "${serviceData.name}" berhasil disimpan!`);
      setIsFormModalOpen(false);
      setSelectedService(null);
      loadData();
    } catch (err) {
      toast.error(`Gagal menyimpan layanan: ${err.message}`);
    }
  };

  // Delete Handler
  const handleDeleteService = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menonaktifkan layanan "${name}"?`)) return;
    try {
      await deleteMasterService(id);
      toast.success(`Layanan "${name}" berhasil dinonaktifkan.`);
      loadData();
    } catch (err) {
      toast.error(`Gagal menghapus layanan: ${err.message}`);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Kode Layanan', 'ICD-9-CM', 'SATUSEHAT', 'Nama Layanan', 'Kategori', 'Departemen', 'Tarif Dasar', 'Jasa Dokter', 'Sewa Alat'];
    const rows = filteredServices.map(s => [
      s.code,
      s.icd9Code || '-',
      s.satusehatCode || '-',
      `"${s.name}"`,
      s.category,
      `"${s.department}"`,
      s.totalTariff || 0,
      s.breakdown?.doctorFee || 0,
      s.breakdown?.equipmentFee || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Layanan_Pasien_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Master Layanan berhasil diunduh!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 font-sans">
      
      {/* PAGE HEADER & METRICS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner border border-primary/20">
              <Stethoscope size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-on-surface">Master Layanan Pasien</h1>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Katalog Prosedur Medis, Matriks Tarif Berjenjang, Pemetaan ICD-9-CM & SATUSEHAT Kemenkes
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download size={15} />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setIsBundleModalOpen(true)}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
          >
            <Package size={15} />
            <span>+ Buat Paket Bundling</span>
          </button>

          <button
            onClick={() => {
              setSelectedService(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>+ Tambah Layanan</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <Tag size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 block">Total Layanan Medis</span>
            <span className="text-xl font-black text-on-surface">{services.length} Prosedur</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 block">Cakupan BPJS VClaim</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">100% Covered</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
            <FileCode size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 block">Mapping SATUSEHAT</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">LOINC / ICD-9</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
            <Calculator size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 block">Struktur Cost Center</span>
            <span className="text-xl font-black text-on-surface">5 Komponen</span>
          </div>
        </div>
      </div>

      {/* COMMAND BAR & FILTERS */}
      <div className="glass-panel p-4 rounded-2xl border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="flex-1 min-w-[280px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60" />
          <input
            type="text"
            placeholder="Cari kode layanan, ICD-9-CM, SATUSEHAT, atau nama tindakan medis..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'POLIKLINIK', label: 'Poliklinik' },
            { id: 'PERAWATAN', label: 'Perawatan' },
            { id: 'LABORATORIUM', label: 'Laboratorium' },
            { id: 'RADIOLOGI', label: 'Radiologi' },
            { id: 'KAMAR_BEDAH', label: 'Bedah (OK)' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => handleViewModeChange('table')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
            }`}
            title="Tampilan Tabel"
          >
            <TableIcon size={15} />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            onClick={() => handleViewModeChange('grid')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant'
            }`}
            title="Tampilan Kartu"
          >
            <Grid size={15} />
            <span className="hidden sm:inline">Kartu</span>
          </button>
        </div>
      </div>

      {/* DATA DISPLAY TABLE / GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-on-surface-variant/70">Memuat Katalog Master Layanan Pasien...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-20 text-center space-y-3 glass-panel rounded-2xl border border-outline-variant/30 opacity-60">
          <Stethoscope size={48} className="mx-auto text-on-surface-variant" />
          <h3 className="text-base font-black">Tidak Ditemukan Katalog Layanan</h3>
          <p className="text-xs">Tidak ada layanan medis yang cocok dengan kata kunci "{searchTerm}".</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/30 shadow-premium-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3 px-4">Kode Layanan</th>
                  <th className="py-3 px-4">Nama Layanan & Departemen</th>
                  <th className="py-3 px-4">ICD-9 / SATUSEHAT</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Tarif Kelas III</th>
                  <th className="py-3 px-4">Tarif VIP</th>
                  <th className="py-3 px-4">Coverage Penjamin</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-medium">
                {filteredServices.map(item => (
                  <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-on-surface text-sm block group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant/70 block">
                          Dept: {item.department}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="space-y-0.5">
                        <span className="px-1.5 py-0.5 bg-surface-container rounded text-on-surface font-bold block w-fit">
                          ICD-9: {item.icd9Code || '-'}
                        </span>
                        <span className="text-[10px] opacity-70 block">SS: {item.satusehatCode || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-surface-container-high text-on-surface rounded-lg font-black text-[10px] uppercase border border-outline-variant/30">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-on-surface">
                      Rp {(item.classTariffs?.kelas3 || item.totalTariff || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      Rp {(item.classTariffs?.vip || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(item.guarantors || ['UMUM']).map(g => (
                          <span key={g} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-black uppercase">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedService(item);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit Layanan"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(item.id, item.name)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Nonaktifkan Layanan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map(item => (
            <div key={item.id} className="glass-panel p-5 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {item.code}
                  </span>
                  <span className="px-2.5 py-0.5 bg-surface-container rounded-full text-[10px] font-black uppercase">
                    {item.category}
                  </span>
                </div>

                <h3 className="text-base font-black text-on-surface group-hover:text-primary transition-colors leading-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium">Departemen: {item.department}</p>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-black opacity-60 block">Tarif Dasar (Kelas 3)</span>
                  <span className="font-mono font-black text-on-surface">Rp {(item.classTariffs?.kelas3 || item.totalTariff || 0).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-purple-600 block">Tarif VIP</span>
                  <span className="font-mono font-black text-purple-600 dark:text-purple-400">Rp {(item.classTariffs?.vip || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3 text-xs">
                <span className="text-[10px] font-mono text-on-surface-variant/70">
                  ICD-9: {item.icd9Code || '-'} • SS: {item.satusehatCode || '-'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedService(item);
                      setIsFormModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteService(item.id, item.name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {isFormModalOpen && (
        <ServiceFormModal
          service={selectedService}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedService(null);
          }}
          onSaveSuccess={handleSaveService}
        />
      )}

      {/* BUNDLE MODAL */}
      {isBundleModalOpen && (
        <ServiceBundleModal
          services={services}
          onClose={() => setIsBundleModalOpen(false)}
          onSaveSuccess={(bundle) => {
            setIsBundleModalOpen(false);
            loadData();
          }}
        />
      )}

    </div>
  );
}
