import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Calculator, Stethoscope, Building2, Tag, CreditCard, ShieldCheck, DollarSign, Activity, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceFormModal({ service, onClose, onSaveSuccess, currentUser }) {
  const isEditing = !!service;

  const [form, setForm] = useState({
    id: service?.id || '',
    code: service?.code || '',
    name: service?.name || '',
    icd9Code: service?.icd9Code || '',
    satusehatCode: service?.satusehatCode || '',
    category: service?.category || 'POLIKLINIK',
    department: service?.department || 'Poli Penyakit Dalam',
    status: service?.status || 'ACTIVE',
    breakdown: {
      doctorFee: service?.breakdown?.doctorFee || 100000,
      nurseFee: service?.breakdown?.nurseFee || 25000,
      equipmentFee: service?.breakdown?.equipmentFee || 20000,
      bmhpFee: service?.breakdown?.bmhpFee || 15000,
      hospitalShare: service?.breakdown?.hospitalShare || 40000
    },
    classTariffs: {
      vip: service?.classTariffs?.vip || 280000,
      kelas1: service?.classTariffs?.kelas1 || 240000,
      kelas2: service?.classTariffs?.kelas2 || 220000,
      kelas3: service?.classTariffs?.kelas3 || 200000,
      icu: service?.classTariffs?.icu || 320000
    },
    guarantors: service?.guarantors || ['UMUM', 'BPJS', 'ASURANSI_SWASTA']
  });

  // Calculate Subtotal breakdown fee automatically
  const totalBreakdownFee = useMemo(() => {
    const b = form.breakdown;
    return (Number(b.doctorFee) || 0) + 
           (Number(b.nurseFee) || 0) + 
           (Number(b.equipmentFee) || 0) + 
           (Number(b.bmhpFee) || 0) + 
           (Number(b.hospitalShare) || 0);
  }, [form.breakdown]);

  const handleBreakdownChange = (field, val) => {
    setForm(prev => ({
      ...prev,
      breakdown: {
        ...prev.breakdown,
        [field]: Number(val) || 0
      }
    }));
  };

  const handleClassTariffChange = (cls, val) => {
    setForm(prev => ({
      ...prev,
      classTariffs: {
        ...prev.classTariffs,
        [cls]: Number(val) || 0
      }
    }));
  };

  const handleGuarantorToggle = (g) => {
    setForm(prev => {
      const exists = prev.guarantors.includes(g);
      return {
        ...prev,
        guarantors: exists ? prev.guarantors.filter(x => x !== g) : [...prev.guarantors, g]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nama Layanan Medis wajib diisi!');
      return;
    }

    const payload = {
      ...form,
      totalTariff: form.classTariffs.kelas3 || totalBreakdownFee
    };

    onSaveSuccess(payload);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 relative shadow-2xl overflow-hidden border border-outline-variant/40 animate-scale-in max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-sm">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-on-surface">
                {isEditing ? 'Ubah Master Layanan Medis' : 'Tambah Layanan Medis Baru'}
              </h3>
              <p className="text-xs text-on-surface-variant/70 font-medium">
                Konfigurasi Katalog Layanan, ICD-9-CM, SATUSEHAT & Breakdown Tarif Multi-Kelas
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-1 text-xs font-bold flex-1">
          
          {/* SECTION 1: Identitas & Kode Layanan */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
              <Tag size={14} /> Identitas & Pengkodean Layanan
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 opacity-80">Kode Internal Layanan:</label>
                <input
                  type="text"
                  placeholder="Misal: SRV-POL-001"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-80">Kode Prosedur ICD-9-CM:</label>
                <input
                  type="text"
                  placeholder="Misal: 89.07"
                  value={form.icd9Code}
                  onChange={e => setForm(prev => ({ ...prev, icd9Code: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 opacity-80">Kode Kemenkes SATUSEHAT:</label>
                <input
                  type="text"
                  placeholder="Misal: 1000001"
                  value={form.satusehatCode}
                  onChange={e => setForm(prev => ({ ...prev, satusehatCode: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 opacity-80">Nama Layanan Medis / Prosedur:*</label>
              <input
                type="text"
                required
                placeholder="Misal: Konsultasi Spesialis, EKG 12 Lead, Radiologi Thorax..."
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl text-sm font-black"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 opacity-80">Kategori Layanan:</label>
                <select
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                >
                  <option value="POLIKLINIK">POLIKLINIK (Rawat Jalan)</option>
                  <option value="PERAWATAN">PERAWATAN (Rawat Inap)</option>
                  <option value="LABORATORIUM">LABORATORIUM</option>
                  <option value="RADIOLOGI">RADIOLOGI</option>
                  <option value="KAMAR_BEDAH">KAMAR BEDAH (OK)</option>
                  <option value="FARMASI">FARMASI & BMHP</option>
                  <option value="ADMINISTRASI">ADMINISTRASI & LAINNYA</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 opacity-80">Departemen Pengampu:</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Breakdown Komponen Tarif (Cost Center) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Calculator size={14} /> Breakdown Komponen Tarif (Cost Center)
              </h4>
              <span className="text-xs font-black text-on-surface">
                Total Rincian Biaya: <strong className="text-primary font-mono text-sm">Rp {totalBreakdownFee.toLocaleString('id-ID')}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Jasa Dokter (Jamed)</label>
                <input
                  type="number"
                  value={form.breakdown.doctorFee}
                  onChange={e => handleBreakdownChange('doctorFee', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Jasa Perawat</label>
                <input
                  type="number"
                  value={form.breakdown.nurseFee}
                  onChange={e => handleBreakdownChange('nurseFee', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Sewa Alat Medis</label>
                <input
                  type="number"
                  value={form.breakdown.equipmentFee}
                  onChange={e => handleBreakdownChange('equipmentFee', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Bahan / BMHP</label>
                <input
                  type="number"
                  value={form.breakdown.bmhpFee}
                  onChange={e => handleBreakdownChange('bmhpFee', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Jasa Sarana RS</label>
                <input
                  type="number"
                  value={form.breakdown.hospitalShare}
                  onChange={e => handleBreakdownChange('hospitalShare', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Tarif Berjenjang Per Kelas Perawatan */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
              <Building2 size={14} /> Tarif Berjenjang Per Kelas Perawatan
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Kelas VVIP / VIP</label>
                <input
                  type="number"
                  value={form.classTariffs.vip}
                  onChange={e => handleClassTariffChange('vip', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Kelas I</label>
                <input
                  type="number"
                  value={form.classTariffs.kelas1}
                  onChange={e => handleClassTariffChange('kelas1', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Kelas II</label>
                <input
                  type="number"
                  value={form.classTariffs.kelas2}
                  onChange={e => handleClassTariffChange('kelas2', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">Kelas III (Dasar)</label>
                <input
                  type="number"
                  value={form.classTariffs.kelas3}
                  onChange={e => handleClassTariffChange('kelas3', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block mb-1 opacity-70 text-[10px] uppercase font-black">ICU / HCU</label>
                <input
                  type="number"
                  value={form.classTariffs.icu}
                  onChange={e => handleClassTariffChange('icu', e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant p-2 rounded-xl font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Cakupan Penjamin */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
              <ShieldCheck size={14} /> Coverage Multi-Penjamin
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'UMUM', label: 'Pasien Umum / Pribadi' },
                { id: 'BPJS', label: 'BPJS Kesehatan (VClaim)' },
                { id: 'ASURANSI_SWASTA', label: 'Asuransi Swasta & TPA' }
              ].map(g => {
                const active = form.guarantors.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGuarantorToggle(g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase opacity-60">Status Layanan:</span>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="bg-surface-container-high border border-outline-variant px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                <option value="ACTIVE">AKTIF</option>
                <option value="INACTIVE">NON-AKTIF</option>
                <option value="OBSOLETE">OBSOLETE</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-surface-container rounded-xl font-bold hover:bg-surface-container-high"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all shadow-md flex items-center gap-1.5"
              >
                <Save size={16} />
                <span>Simpan Katalog Layanan</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
