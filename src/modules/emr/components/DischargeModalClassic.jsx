import React, { useState } from 'react';

const DISCHARGE_MOCK = [
  { no: 1, regId: 'P260800567', rm: '00490084', nama: 'SRI INDAH FILAELY', bangsal: 'CHRYSANT', status: 'Proses Billing' },
  { no: 2, regId: 'P260800167', rm: '00302274', nama: 'GIBRAN AMMAR HARYANTO', bangsal: 'CHRYSANT', status: 'Verifikasi Obat' },
  { no: 3, regId: 'P260801568', rm: '00472328', nama: 'SRI MULYANI', bangsal: 'CHRYSANT', status: 'Siap Pulang' },
  { no: 4, regId: 'P260802606', rm: '00474022', nama: 'WAHYU NUGRAHANINGSIH', bangsal: 'CHRYSANT', status: 'Proses Resume' },
  { no: 5, regId: 'P260801826', rm: '00491808', nama: 'MARYAM SAKINAH ALYAHYA', bangsal: 'CHRYSANT', status: 'Proses Billing' },
  { no: 6, regId: 'P260801751', rm: '00462629', nama: 'KEYSHA ALMIRA BAIHAQI', bangsal: 'CHRYSANT', status: 'Siap Pulang' },
  { no: 7, regId: 'P260802661', rm: '00495307', nama: 'SOIMAH', bangsal: 'CHRYSANT', status: 'Proses Billing' },
  { no: 8, regId: 'P260802690', rm: '00492034', nama: 'LASIPAH', bangsal: 'CHRYSANT', status: 'Verifikasi Medis' },
  { no: 9, regId: 'P260802339', rm: '00402909', nama: 'STEVANUS WILLIAM INDAP', bangsal: 'CHRYSANT', status: 'Siap Pulang' },
];

const BANGSAL_OPTIONS = [
  { value: 'CHRYSANT', label: 'CHRYSANT' },
  { value: 'ORCHID', label: 'ORCHID' },
  { value: 'VIP', label: 'RUANG VIP' },
  { value: 'Semua', label: 'Semua Bangsal' },
];

const STATUS_OPTIONS = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Proses Billing', label: 'Proses Billing' },
  { value: 'Verifikasi Obat', label: 'Verifikasi Obat' },
  { value: 'Proses Resume', label: 'Proses Resume' },
  { value: 'Verifikasi Medis', label: 'Verifikasi Medis' },
  { value: 'Siap Pulang', label: 'Siap Pulang' },
];

function CustomDropdown({ value, options, onChange, minWidth = '150px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-extrabold text-slate-800 dark:text-slate-100 shadow-xs hover:border-teal-500 focus:ring-2 focus:ring-teal-500/30 cursor-pointer transition-all text-xs"
        style={{ minWidth }}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
        <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-teal-600' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-1 z-40 w-full min-w-[170px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 animate-in fade-in duration-150 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between ${
                  value === opt.value 
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-black' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.label}</span>
                {value === opt.value && (
                  <span className="material-symbols-outlined text-xs text-teal-600">check</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DischargeModalClassic({ isOpen, onClose }) {
  const [filterBangsal, setFilterBangsal] = useState('CHRYSANT');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [searchRegId, setSearchRegId] = useState('');

  if (!isOpen) return null;

  const filteredData = DISCHARGE_MOCK.filter(r => {
    const matchBangsal = filterBangsal === 'Semua' || r.bangsal === filterBangsal;
    const matchStatus = filterStatus === 'Semua' || r.status === filterStatus;
    const matchSearch = !searchRegId || 
      r.regId.toLowerCase().includes(searchRegId.toLowerCase()) || 
      r.rm.includes(searchRegId) || 
      r.nama.toLowerCase().includes(searchRegId.toLowerCase());
    return matchBangsal && matchStatus && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-teal-700 dark:bg-teal-800 text-white px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl text-teal-200">output</span>
            <div>
              <h2 className="font-extrabold text-base tracking-tight text-white">Daftar Pasien Proses Pulang</h2>
              <p className="text-[11px] text-teal-100 font-medium">Pemantauan Antrean Outbound & Verifikasi Berkas Kepulangan</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Bangsal:</label>
              <CustomDropdown 
                value={filterBangsal} 
                options={BANGSAL_OPTIONS} 
                onChange={setFilterBangsal}
                minWidth="140px"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">RegID / RM:</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchRegId} 
                  onChange={(e) => setSearchRegId(e.target.value)} 
                  placeholder="Cari RegID atau RM..." 
                  className="bg-white dark:bg-slate-900 pl-3.5 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-100 w-52 shadow-xs focus:ring-2 focus:ring-teal-500 outline-none text-xs" 
                />
                {searchRegId && (
                  <button onClick={() => setSearchRegId('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Status:</label>
              <CustomDropdown 
                value={filterStatus} 
                options={STATUS_OPTIONS} 
                onChange={setFilterStatus}
                minWidth="160px"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {}}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 text-xs"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Cari
            </button>
            <button 
              onClick={() => {
                setFilterBangsal('CHRYSANT');
                setFilterStatus('Semua');
                setSearchRegId('');
              }} 
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <thead>
              <tr className="bg-slate-800 dark:bg-slate-950 text-white font-black uppercase text-[11px] tracking-wider divide-x divide-slate-700">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 w-32">RegID</th>
                <th className="p-3 w-28">MEDRECID</th>
                <th className="p-3">Nama Pasien</th>
                <th className="p-3 w-32">Bangsal</th>
                <th className="p-3 text-center w-40">Status Pulang</th>
                <th className="p-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredData.map((r, index) => (
                <tr key={r.regId} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/60 transition-colors divide-x divide-slate-100 dark:divide-slate-800">
                  <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                  <td className="p-3 font-mono font-extrabold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">
                    {r.regId}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">{r.rm}</td>
                  <td className="p-3 font-extrabold text-slate-900 dark:text-slate-100">{r.nama}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{r.bangsal}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide border shadow-xs inline-block ${
                      r.status === 'Siap Pulang' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' :
                      r.status === 'Verifikasi Obat' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' :
                      r.status === 'Verifikasi Medis' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' :
                      'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 mx-auto">
                      <span className="material-symbols-outlined text-xs">local_shipping</span>
                      Proses Outbound
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400">
            Total Antrean: <strong className="text-teal-600 dark:text-teal-400 font-mono text-sm">{filteredData.length} Pasien</strong> Dalam Proses Pulang
          </span>
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
