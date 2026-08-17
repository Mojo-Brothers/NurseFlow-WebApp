import React, { useState, useEffect } from 'react';
import { useMasterDataStore } from '../masterData.store.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';
import { useAuth } from '../../../contexts/useAuth.js';

export default function MasterDataFormModal() {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || 'admin@nurseflow.id';

  const {
    activeEntity,
    isFormModalOpen,
    closeFormModal,
    selectedItemForEdit,
    saveRecord,
    entitiesData,
    isLoading
  } = useMasterDataStore();

  const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || MASTER_DATA_ENTITIES[activeEntity] || {};
  const isEditing = !!selectedItemForEdit;

  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing && selectedItemForEdit) {
      setFormData({ ...selectedItemForEdit });
    } else {
      // Auto-generate fresh ID/Code
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const initial = {
        status: 'ACTIVE'
      };

      if (config.codeField && config.codePrefix) {
        initial[config.codeField] = `${config.codePrefix}${randomSuffix}`;
      }

      // Default values for common fields
      if (activeEntity === 'PATIENT') {
        initial.jenis_kelamin = 'P';
        initial.golongan_darah = 'O+';
        initial.tanggal_lahir = '1990-01-01';
      } else if (activeEntity === 'DOCTOR') {
        initial.spesialisasi = 'Penyakit Dalam';
      } else if (activeEntity === 'NURSE') {
        initial.jenjang_klinis = 'Perawat Klinik II (PK II)';
      } else if (activeEntity === 'BED') {
        initial.status_bed = 'AVAILABLE';
        initial.kelas = 'Kelas 1';
      } else if (activeEntity === 'MEDICINE') {
        initial.bentuk_sediaan = 'Tablet';
        initial.satuan = 'Tablet';
        initial.stok_minimum = 100;
        initial.harga = 5000;
      }

      setFormData(initial);
    }
    setErrors({});
  }, [isEditing, selectedItemForEdit, activeEntity]);

  if (!isFormModalOpen) return null;

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (config.codeField && !formData[config.codeField]) {
      newErrors[config.codeField] = 'Kode wajib diisi';
    }
    if (config.nameField && !formData[config.nameField]) {
      newErrors[config.nameField] = 'Nama entitas wajib diisi';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await saveRecord(formData, userEmail);
    } catch (err) {
      alert(`Gagal menyimpan data: ${err.message}`);
    }
  };

  // Render Specialized Input Fields per Entity
  const renderFields = () => {
    const rooms = entitiesData['ROOM'] || [];
    const clinics = entitiesData['CLINIC'] || [];
    const doctors = entitiesData['DOCTOR'] || [];

    switch (activeEntity) {
      case 'PATIENT':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nomor Rekam Medis (MRN) *</label>
              <input
                type="text"
                value={formData.mrn || ''}
                onChange={(e) => handleInputChange('mrn', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
                placeholder="MRN-2026-XXXXXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nama Lengkap Pasien *</label>
              <input
                type="text"
                value={formData.nama_lengkap || ''}
                onChange={(e) => handleInputChange('nama_lengkap', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                placeholder="Tn./Ny. Nama Lengkap"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">NIK (16 Digit KTP) *</label>
              <input
                type="text"
                maxLength={16}
                value={formData.nik || ''}
                onChange={(e) => handleInputChange('nik', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono"
                placeholder="317101XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nomor Kartu BPJS</label>
              <input
                type="text"
                value={formData.no_bpjs || ''}
                onChange={(e) => handleInputChange('no_bpjs', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono"
                placeholder="000XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.tanggal_lahir || ''}
                onChange={(e) => handleInputChange('tanggal_lahir', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Jenis Kelamin</label>
              <select
                value={formData.jenis_kelamin || 'P'}
                onChange={(e) => handleInputChange('jenis_kelamin', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.nomor_telepon || ''}
                onChange={(e) => handleInputChange('nomor_telepon', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
                placeholder="0812XXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Riwayat Alergi (JCI Safety)</label>
              <input
                type="text"
                value={formData.alergi || ''}
                onChange={(e) => handleInputChange('alergi', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-rose-600 font-bold"
                placeholder="Contoh: Amoxicillin, Seafood, Debu"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">Alamat Domisili Lengkap</label>
              <textarea
                rows={2}
                value={formData.alamat || ''}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
              />
            </div>
          </div>
        );

      case 'DOCTOR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kode Dokter *</label>
              <input
                type="text"
                value={formData.kode_dokter || ''}
                onChange={(e) => handleInputChange('kode_dokter', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nama Lengkap & Gelar *</label>
              <input
                type="text"
                value={formData.nama_dokter || ''}
                onChange={(e) => handleInputChange('nama_dokter', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                placeholder="dr. Nama Lengkap, Sp.XX"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nomor SIP</label>
              <input
                type="text"
                value={formData.sip || ''}
                onChange={(e) => handleInputChange('sip', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono"
                placeholder="SIP-503/XXXX/2026"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nomor STR</label>
              <input
                type="text"
                value={formData.str || ''}
                onChange={(e) => handleInputChange('str', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono"
                placeholder="STR-DOC-XXXX-XXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Spesialisasi</label>
              <input
                type="text"
                value={formData.spesialisasi || ''}
                onChange={(e) => handleInputChange('spesialisasi', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                placeholder="Penyakit Dalam / Bedah / Anak / dll"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Sub-Spesialisasi</label>
              <input
                type="text"
                value={formData.sub_spesialisasi || ''}
                onChange={(e) => handleInputChange('sub_spesialisasi', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
                placeholder="Konsultan..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Email Rumah Sakit</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">No. Kontak Handphone</label>
              <input
                type="text"
                value={formData.nomor_telepon || ''}
                onChange={(e) => handleInputChange('nomor_telepon', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
              />
            </div>
          </div>
        );

      case 'BED':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kode Bed *</label>
              <input
                type="text"
                value={formData.kode_bed || ''}
                onChange={(e) => handleInputChange('kode_bed', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nomor / Label Bed *</label>
              <input
                type="text"
                value={formData.nomor_bed || ''}
                onChange={(e) => handleInputChange('nomor_bed', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                placeholder="Bed 101-A"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Pilih Ruangan / Bangsal</label>
              <select
                value={formData.ruangan_id || ''}
                onChange={(e) => {
                  const selRoom = rooms.find(r => r.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    ruangan_id: e.target.value,
                    ruangan_nama: selRoom?.nama_ruangan || ''
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="">-- Pilih Ruangan --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.nama_ruangan} ({r.jenis_ruangan})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kelas Perawatan</label>
              <select
                value={formData.kelas || 'Kelas 1'}
                onChange={(e) => handleInputChange('kelas', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="VVIP">VVIP Presidential</option>
                <option value="VIP">VIP</option>
                <option value="Kelas 1">Kelas 1</option>
                <option value="Kelas 2">Kelas 2</option>
                <option value="Kelas 3">Kelas 3</option>
                <option value="ICU">ICU / HCU</option>
                <option value="Isolasi">Ruang Isolasi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Status Ketersediaan Bed</label>
              <select
                value={formData.status_bed || 'AVAILABLE'}
                onChange={(e) => handleInputChange('status_bed', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="AVAILABLE">Tersedia (Available)</option>
                <option value="OCCUPIED">Terisi Pasien (Occupied)</option>
                <option value="RESERVED">Dipesan (Reserved)</option>
                <option value="CLEANING">Sedang Sterilisasi (Cleaning)</option>
                <option value="MAINTENANCE">Perbaikan (Maintenance)</option>
              </select>
            </div>
          </div>
        );

      case 'MEDICINE':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kode Obat *</label>
              <input
                type="text"
                value={formData.kode_obat || ''}
                onChange={(e) => handleInputChange('kode_obat', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nama Obat Dagang *</label>
              <input
                type="text"
                value={formData.nama_obat || ''}
                onChange={(e) => handleInputChange('nama_obat', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                placeholder="Nama Dagang / Merek"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Nama Generik (Zat Aktif)</label>
              <input
                type="text"
                value={formData.nama_generik || ''}
                onChange={(e) => handleInputChange('nama_generik', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
                placeholder="Nama Komposisi Generik"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Bentuk Sediaan</label>
              <select
                value={formData.bentuk_sediaan || 'Tablet'}
                onChange={(e) => handleInputChange('bentuk_sediaan', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="Tablet">Tablet</option>
                <option value="Kapsul">Kapsul</option>
                <option value="Sirup">Sirup / Suspensi</option>
                <option value="Injeksi Vial">Injeksi Vial</option>
                <option value="Ampul Injeksi">Ampul Injeksi</option>
                <option value="Salep / Krim">Salep / Krim</option>
                <option value="Infus">Cairan Infus</option>
                <option value="Inhaler / Nebulizer">Inhaler / Nebulizer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Satuan Kemasan</label>
              <input
                type="text"
                value={formData.satuan || 'Tablet'}
                onChange={(e) => handleInputChange('satuan', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Harga Satuan (IDR)</label>
              <input
                type="number"
                value={formData.harga || 0}
                onChange={(e) => handleInputChange('harga', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Minimum Stok Safety</label>
              <input
                type="number"
                value={formData.stok_minimum || 50}
                onChange={(e) => handleInputChange('stok_minimum', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-600">
                <input
                  type="checkbox"
                  checked={!!formData.is_high_alert}
                  onChange={(e) => handleInputChange('is_high_alert', e.target.checked)}
                  className="rounded border-rose-400 text-rose-600 focus:ring-rose-400"
                />
                High-Alert Medication (JCI Mandatory)
              </label>
            </div>
          </div>
        );

      case 'SCHEDULE':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kode Jadwal *</label>
              <input
                type="text"
                value={formData.kode_jadwal || ''}
                onChange={(e) => handleInputChange('kode_jadwal', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Pilih Dokter *</label>
              <select
                value={formData.doctor_id || ''}
                onChange={(e) => {
                  const selDoc = doctors.find(d => d.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    doctor_id: e.target.value,
                    doctor_name: selDoc?.nama_dokter || ''
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                required
              >
                <option value="">-- Pilih Dokter --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.nama_dokter} ({d.spesialisasi})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Pilih Poliklinik *</label>
              <select
                value={formData.clinic_id || ''}
                onChange={(e) => {
                  const selClinic = clinics.find(c => c.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    clinic_id: e.target.value,
                    clinic_name: selClinic?.nama_poli || ''
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
                required
              >
                <option value="">-- Pilih Poli --</option>
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.nama_poli}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Hari Praktik</label>
              <select
                value={formData.hari || 'Senin'}
                onChange={(e) => handleInputChange('hari', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Jam Mulai</label>
              <input
                type="time"
                value={formData.jam_mulai || '08:00'}
                onChange={(e) => handleInputChange('jam_mulai', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Jam Selesai</label>
              <input
                type="time"
                value={formData.jam_selesai || '13:00'}
                onChange={(e) => handleInputChange('jam_selesai', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Kuota Maksimal Pasien</label>
              <input
                type="number"
                value={formData.kuota || 25}
                onChange={(e) => handleInputChange('kuota', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono font-bold"
              />
            </div>
          </div>
        );

      default:
        // Generic fallback form matching entity columns
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.columns?.map(col => {
              if (col.format === 'status_badge') return null;
              return (
                <div key={col.key} className={col.format === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    {col.label} {col.primary ? '*' : ''}
                  </label>
                  <input
                    type={col.format === 'number' || col.format === 'currency' ? 'number' : col.format === 'date' ? 'date' : 'text'}
                    value={formData[col.key] !== undefined ? formData[col.key] : ''}
                    onChange={(e) => handleInputChange(col.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium"
                    placeholder={`Masukkan ${col.label.toLowerCase()}`}
                    required={col.primary}
                  />
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-high w-full max-w-2xl rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">{config.icon || 'edit_note'}</span>
            </div>
            <div>
              <h3 className="text-lg font-headline font-black text-on-surface">
                {isEditing ? `Ubah Data ${config.singular || 'Master'}` : `Tambah ${config.singular || 'Master'} Baru`}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {config.title} &bull; Standard JCI & SATUSEHAT
              </p>
            </div>
          </div>

          <button
            onClick={closeFormModal}
            className="p-2 rounded-xl text-on-surface-variant hover:text-rose-600 hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          
          {/* Render inputs */}
          {renderFields()}

          {/* Operational Status Switch */}
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-on-surface">Status Operasional Data</p>
              <p className="text-[11px] text-on-surface-variant">Data non-aktif tidak akan muncul di form pendaftaran / resep baru.</p>
            </div>
            <select
              value={formData.status || 'ACTIVE'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs font-bold text-on-surface focus:ring-primary"
            >
              <option value="ACTIVE">AKTIF</option>
              <option value="INACTIVE">NON-AKTIF</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={closeFormModal}
              className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-extrabold text-xs shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Buat Record Baru')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
