import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../../data/enterpriseMasterSchemas.js';

const REFERENCE_CATEGORIES = [
  { key: 'triage_scales', name: 'Skala Triase ATS', icon: 'emergency' },
  { key: 'encounter_types', name: 'Tipe Kunjungan', icon: 'sensor_occupied' },
  { key: 'medication_routes', name: 'Rute Obat KFA', icon: 'medication' },
  { key: 'dose_units', name: 'Satuan Dosis', icon: 'straighten' },
  { key: 'discharge_dispositions', name: 'Cara Keluar/Pulang', icon: 'logout' },
  { key: 'religions', name: 'Agama', icon: 'self_improvement' },
  { key: 'educations', name: 'Pendidikan', icon: 'school' },
  { key: 'occupations', name: 'Pekerjaan', icon: 'work' },
  { key: 'marital_statuses', name: 'Status Nikah', icon: 'family_restroom' },
  { key: 'genders', name: 'Jenis Kelamin', icon: 'wc' },
  { key: 'blood_types', name: 'Golongan Darah', icon: 'bloodtype' },
  { key: 'room_classes', name: 'Kelas Ruangan', icon: 'hotel' },
  { key: 'shifts', name: 'Shift Kerja', icon: 'schedule' },
  { key: 'examination_categories', name: 'Kategori Uji', icon: 'category' },
  { key: 'guarantor_types', name: 'Jenis Penjamin', icon: 'account_balance' },
  { key: 'provinces', name: 'Provinsi', icon: 'map' },
  { key: 'cities', name: 'Kota / Kab', icon: 'location_city' },
  { key: 'districts', name: 'Kecamatan', icon: 'holiday_village' },
  { key: 'villages', name: 'Kelurahan / Desa', icon: 'signpost' }
];

export default function ReferenceDataWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity, softDeleteRecord, restoreRecord } = useEnterpriseMasterStore();

  const [activeCategory, setActiveCategory] = useState('triage_scales');
  const [regionTab, setRegionTab] = useState('PROVINCE'); // 'PROVINCE' | 'CITY' | 'DISTRICT' | 'VILLAGE'
  const [selectedProvinceId, setSelectedProvinceId] = useState('REF-PRV-31');
  const [selectedCityId, setSelectedCityId] = useState('REF-CTY-3171');
  const [searchQuery, setSearchQuery] = useState('');

  const isWilayahCategory = ['provinces', 'cities', 'districts', 'villages'].includes(activeCategory);

  const currentRecords = entitiesData[activeCategory] || [];
  const currentSchema = ENTERPRISE_ENTITY_SCHEMAS[activeCategory] || {};

  const provinces = entitiesData['provinces'] || [];
  const cities = entitiesData['cities'] || [];
  const districts = entitiesData['districts'] || [];
  const villages = entitiesData['villages'] || [];

  // Cascading filtered lists
  const filteredCities = cities.filter(c => !selectedProvinceId || c.province_id === selectedProvinceId);
  const filteredDistricts = districts.filter(d => !selectedCityId || d.city_id === selectedCityId);

  const filteredRecords = currentRecords.filter(item => {
    if (item.is_deleted) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.code?.toLowerCase().includes(q) ||
      item.province_name?.toLowerCase().includes(q) ||
      item.city_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* ─── Header & Category Pills ─── */}
      <div className="p-4 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-headline font-black text-on-surface">Kamus Referensi Data & Kodifikasi Wilayah</h3>
            <p className="text-xs text-on-surface-variant font-medium">Standardisasi nilai acuan nasional (UUID Relasional) untuk rekam medis & formulir.</p>
          </div>

          <button
            onClick={() => {
              setActiveEntity(activeCategory);
              openCreateModal();
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/25 hover:scale-105 active:scale-95 transition-all ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tambah {currentSchema.singular || 'Data'}</span>
          </button>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {REFERENCE_CATEGORIES.map(cat => {
            const isActive = cat.key === activeCategory;
            const count = (entitiesData[cat.key] || []).filter(i => !i.is_deleted).length;

            return (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setActiveEntity(cat.key);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Special Kemendagri Wilayah Cascader (If Wilayah selected) ─── */}
      {isWilayahCategory && (
        <div className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-sky-600 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Wilayah Cascader:</span>
          </div>

          <select
            value={selectedProvinceId}
            onChange={(e) => {
              setSelectedProvinceId(e.target.value);
              setSelectedCityId('');
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
          >
            <option value="">-- Semua Provinsi --</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>

          <span className="text-on-surface-variant/40">&rarr;</span>

          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
          >
            <option value="">-- Semua Kota / Kab --</option>
            {filteredCities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ─── Search & Grid View ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari dalam ${currentSchema.title}...`}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant/30 text-xs font-medium text-on-surface focus:ring-primary"
            />
          </div>

          <p className="text-xs text-on-surface-variant font-medium">
            Menampilkan <strong>{filteredRecords.length}</strong> record terdata
          </p>
        </div>

        {/* Reference Data Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredRecords.map(item => (
            <div
              key={item.id}
              onClick={() => openDetailDrawer(item)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-sky-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-md">
                  {item.code || item.id}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {item.status || 'ACTIVE'}
                </span>
              </div>

              <h4 className="text-sm font-headline font-black text-on-surface group-hover:text-sky-600 transition-colors">
                {item.name}
              </h4>

              {item.province_name && (
                <p className="text-xs text-on-surface-variant">Provinsi: <strong>{item.province_name}</strong></p>
              )}
              {item.city_name && (
                <p className="text-xs text-on-surface-variant">Kota: <strong>{item.city_name}</strong></p>
              )}
              {item.postal_code && (
                <p className="text-xs font-mono font-bold text-on-surface-variant">Kode Pos: {item.postal_code}</p>
              )}
              {item.start_time && (
                <p className="text-xs font-mono font-bold text-on-surface-variant">{item.start_time} - {item.end_time}</p>
              )}

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span className="font-mono">{item.id}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(item);
                  }}
                  className="p-1 rounded-lg hover:text-amber-600 hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
