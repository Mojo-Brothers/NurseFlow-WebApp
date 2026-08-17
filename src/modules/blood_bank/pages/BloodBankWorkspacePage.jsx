import React, { useState } from 'react';
import { bloodBankService, BLOOD_PRODUCTS, PRODUCT_STORAGE_PROFILES, BLOOD_UNIT_STATES } from '../../../../server/services/bloodBank.service.js';
import toast from 'react-hot-toast';

export default function BloodBankWorkspacePage() {
  const [units, setUnits] = useState(() => Array.from(bloodBankService.units.values()));
  const [crossmatches, setCrossmatches] = useState(() => Array.from(bloodBankService.crossmatches.values()));
  const [activeTab, setActiveTab] = useState('INVENTORY'); // 'INVENTORY' | 'CROSSMATCH' | 'ISSUE' | 'BEDSIDE' | 'TRANSFUSION'

  // New Blood Unit Form
  const [newUnitNumber, setNewUnitNumber] = useState(`UTD-${Date.now().toString().slice(-6)}`);
  const [newProductType, setNewProductType] = useState('PACKED_RED_CELLS');
  const [newAbo, setNewAbo] = useState('A');
  const [newRhesus, setNewRhesus] = useState('POSITIVE');
  const [newTemp, setNewTemp] = useState(4.0);

  // Crossmatch Form
  const [cmPatientId, setCmPatientId] = useState('P-1001');
  const [cmPatientAbo, setCmPatientAbo] = useState('A');
  const [cmPatientRh, setCmPatientRh] = useState('POSITIVE');
  const [cmUnitId, setCmUnitId] = useState('');
  const [cmMajor, setCmMajor] = useState('COMPATIBLE');
  const [cmMinor, setCmMinor] = useState('COMPATIBLE');

  const handleRegisterUnit = (e) => {
    e.preventDefault();
    try {
      const unit = bloodBankService.registerBloodUnit({
        unitNumber: newUnitNumber,
        productType: newProductType,
        aboType: newAbo,
        rhesusType: newRhesus,
        storageTemperatureCelsius: parseFloat(newTemp),
        expiryDate: new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString()
      });

      // Log storage temperature
      bloodBankService.logStorageTemperature({
        unitId: unit.id,
        productType: newProductType,
        storageDeviceId: 'CHILLER-BDRS-01',
        temperatureCelsius: parseFloat(newTemp),
        recordedBy: 'Analis Lab BDRS'
      });

      setUnits(Array.from(bloodBankService.units.values()));
      toast.success(`Kantong Darah ${unit.unitNumber} (${newProductType}) berhasil didaftarkan!`);
      setNewUnitNumber(`UTD-${Date.now().toString().slice(-6)}`);
    } catch (err) {
      toast.error(`Gagal mendaftar kantong: ${err.message}`);
    }
  };

  const handlePerformCrossmatch = (e) => {
    e.preventDefault();
    if (!cmUnitId) {
      toast.error('Pilih kantong darah donor terlebih dahulu!');
      return;
    }

    try {
      const unit = bloodBankService.units.get(cmUnitId);
      const test = bloodBankService.performCrossmatchTest({
        patientId: cmPatientId,
        encounterId: 'ENC-001',
        bloodUnitId: cmUnitId,
        patientAbo: cmPatientAbo,
        patientRhesus: cmPatientRh,
        donorAbo: unit?.aboType || 'A',
        donorRhesus: unit?.rhesusType || 'POSITIVE',
        majorCrossmatch: cmMajor,
        minorCrossmatch: cmMinor,
        technicianId: 'TECH-01',
        technicianName: 'Analis BDRS Ahmad',
        verifiedByDoctorId: 'DOC-SPPK-01',
        verifiedByDoctorName: 'dr. Sp.PK Budi'
      });

      setUnits(Array.from(bloodBankService.units.values()));
      setCrossmatches(Array.from(bloodBankService.crossmatches.values()));

      if (test.overallCompatibility === 'COMPATIBLE') {
        toast.success(`Uji Silang Serasi KOMPATIBEL! Kantong siap dikeluarkan ke ruangan.`);
      } else {
        toast.error(`Uji Silang Serasi INKOMPATIBEL! Kantong otomatis dikarantina.`);
      }
    } catch (err) {
      toast.error(`Uji silang gagal: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold">
              <span className="material-symbols-outlined text-[24px]">bloodtype</span>
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Bank Darah Rumah Sakit (BDRS) & Hemovigilance
              </h1>
              <p className="text-xs text-slate-500">
                Standar Permenkes No. 91/2015, WHO Safe Blood & JCI Patient Safety Goals
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'INVENTORY', label: 'Stok Kantong Darah', icon: 'inventory_2' },
            { id: 'CROSSMATCH', label: 'Uji Silang (Crossmatch)', icon: 'biotech' },
            { id: 'ISSUE', label: 'Serah Terima Ruangan', icon: 'local_shipping' },
            { id: 'BEDSIDE', label: 'Bedside 7-Poin', icon: 'checklist' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Inventory & Cold-Chain */}
      {activeTab === 'INVENTORY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register New Blood Unit Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">add_circle</span>
              Registrasi Kantong Darah Baru
            </h2>

            <form onSubmit={handleRegisterUnit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Nomor Kantong Donor (Barcode)</label>
                <input
                  type="text"
                  value={newUnitNumber}
                  onChange={e => setNewUnitNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Komponen Darah</label>
                  <select
                    value={newProductType}
                    onChange={e => setNewProductType(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="PACKED_RED_CELLS">Packed Red Cells (PRC)</option>
                    <option value="FRESH_FROZEN_PLASMA">Fresh Frozen Plasma (FFP)</option>
                    <option value="THROMBOCYTE_CONCENTRATE">Trombosit (TC)</option>
                    <option value="WHOLE_BLOOD">Whole Blood (WB)</option>
                    <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Golongan Darah</label>
                  <div className="flex gap-1 mt-1">
                    <select
                      value={newAbo}
                      onChange={e => setNewAbo(e.target.value)}
                      className="w-1/2 px-2 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                    <select
                      value={newRhesus}
                      onChange={e => setNewRhesus(e.target.value)}
                      className="w-1/2 px-2 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="POSITIVE">Rh +</option>
                      <option value="NEGATIVE">Rh -</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Suhu Penyimpanan (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newTemp}
                  onChange={e => setNewTemp(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                + Daftarkan & Simpan ke Chiller BDRS
              </button>
            </form>
          </div>

          {/* Blood Unit Grid List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500">grid_view</span>
                Daftar Stok Kantong Darah Terverifikasi ({units.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">No. Kantong</th>
                    <th className="py-2.5 px-3">Komponen</th>
                    <th className="py-2.5 px-3">Golongan</th>
                    <th className="py-2.5 px-3">Suhu Chiller</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {units.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 font-bold">
                        Belum ada kantong darah terdaftar. Gunakan formulir di sebelah kiri.
                      </td>
                    </tr>
                  ) : (
                    units.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-black text-rose-600 dark:text-rose-400">{u.unitNumber}</td>
                        <td className="py-2.5 px-3 font-bold">{u.productType}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black">
                            {u.aboType} {u.rhesusType === 'POSITIVE' ? 'Rh+' : 'Rh-'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">{u.storageTemperatureCelsius}°C</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            u.status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            u.status === 'CROSSMATCHED' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                            u.status === 'QUARANTINED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Crossmatch Testing */}
      {activeTab === 'CROSSMATCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">biotech</span>
              Uji Silang Serasi (Cross-Matching)
            </h2>

            <form onSubmit={handlePerformCrossmatch} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Pilih Kantong Darah Donor</label>
                <select
                  value={cmUnitId}
                  onChange={e => setCmUnitId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Pilih Kantong Darah --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.unitNumber} ({u.aboType} {u.rhesusType === 'POSITIVE' ? 'Rh+' : 'Rh-'} - {u.productType}) - {u.status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Golongan Darah Pasien</label>
                  <div className="flex gap-1 mt-1">
                    <select
                      value={cmPatientAbo}
                      onChange={e => setCmPatientAbo(e.target.value)}
                      className="w-1/2 px-2 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                    <select
                      value={cmPatientRh}
                      onChange={e => setCmPatientRh(e.target.value)}
                      className="w-1/2 px-2 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    >
                      <option value="POSITIVE">Rh +</option>
                      <option value="NEGATIVE">Rh -</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Mayor Crossmatch</label>
                  <select
                    value={cmMajor}
                    onChange={e => setCmMajor(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="COMPATIBLE">KOMPATIBEL</option>
                    <option value="INCOMPATIBLE">INKOMPATIBEL</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                🔬 Uji & Finalisasi Hasil Crossmatch
              </button>
            </form>
          </div>

          {/* Results List */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">assignment_turned_in</span>
              Hasil Uji Silang Terfinalisasi ({crossmatches.length})
            </h2>

            <div className="flex flex-col gap-2">
              {crossmatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Belum ada uji silang dilakukan.</p>
              ) : (
                crossmatches.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900 dark:text-white">Pasien: {c.patientAbo} Rh+ ↔ Donor: {c.donorAbo} Rh+</span>
                      <span className="text-[10px] text-slate-500">Verifikator: {c.verifiedByDoctorName}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                      c.overallCompatibility === 'COMPATIBLE'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {c.overallCompatibility}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
