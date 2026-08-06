import React from 'react';

const MOCK_ROWS = [
  { no: 1, slotBtn: 'Edit Slot', jam: '16:00', tipe: 'APPT ✔', rm: '00487358', nama: 'ACHMAD SAPUTRA', penjamin: 'PRIMAYAAPP', kirim: true, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: 'POLI JANTUNG DAN PEMBULUH DARAH', telp: '089613814964', ponsel: '089613814964', ket: 'Pendaftaran melalui PRIMAYAAPP', status: 'BOOKED' },
  { no: 2, slotBtn: 'Edit Slot', jam: '16:05', tipe: 'APPT ✔', rm: '00327636', nama: 'GINDO SIMANJUNTAK', penjamin: 'rahajeng', kirim: true, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: 'POLI JANTUNG DAN PEMBULUH DARAH', telp: '089637773930', ponsel: '089637773930', ket: '-', status: 'BOOKED' },
  { no: 3, slotBtn: 'Pilih Slot', jam: '16:10', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 4, slotBtn: 'Pilih Slot', jam: '16:15', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 5, slotBtn: 'Pilih Slot', jam: '16:20', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 6, slotBtn: 'Pilih Slot', jam: '16:25', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 7, slotBtn: 'Pilih Slot', jam: '16:30', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 8, slotBtn: 'Pilih Slot', jam: '16:35', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
  { no: 9, slotBtn: 'Pilih Slot', jam: '16:40', tipe: ['W','A','E'], rm: '', nama: '', penjamin: '', kirim: false, dokter: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA', poli: '', telp: '', ponsel: '', ket: '', status: 'EMPTY' },
];

export default function DesignVariantClassic() {
  return (
    <div className="space-y-4">
      {/* Variant Info Banner */}
      <div className="bg-cyan-900 text-cyan-100 p-4 rounded-xl shadow-sm border border-cyan-800 flex items-center justify-between">
        <div>
          <span className="font-extrabold text-sm uppercase tracking-wider text-cyan-300">Varian 1: Classic Enterprise HIS</span>
          <p className="text-xs text-cyan-200 mt-0.5">Struktur tabel operasional padat dengan garis batas tegas, tombol aksi langsung, dan kontras tinggi khas HIS tradisional RS.</p>
        </div>
        <span className="px-3 py-1 bg-cyan-700 text-cyan-100 rounded text-xs font-bold">Density: High</span>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center gap-3 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-800 dark:text-emerald-300 font-bold">Dokter:</span>
          <input readOnly value="dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA" className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 w-80 font-bold text-slate-800 dark:text-slate-100" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-800 dark:text-emerald-300 font-bold">Tanggal:</span>
          <input readOnly value="07-08-2026" className="bg-white dark:bg-slate-900 px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700 font-bold text-slate-800 dark:text-slate-100" />
        </div>
        <button className="px-3 py-1 bg-cyan-600 text-white font-bold rounded shadow-xs">Cari</button>
        <button className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 font-bold rounded">Reset</button>
        <button className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 font-bold rounded">Jadwal Dokter</button>
        <button className="px-3 py-1 bg-slate-200 dark:bg-slate-700 font-bold rounded">Laporan</button>
      </div>

      {/* Legacy Table Layout */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white font-bold uppercase text-[11px] tracking-wider divide-x divide-teal-600">
              <th className="p-2 text-center w-10">No</th>
              <th className="p-2 text-center w-24">Slot</th>
              <th className="p-2 text-center w-16">Jam</th>
              <th className="p-2 text-center w-24">Tipe</th>
              <th className="p-2">No.Rek.Med. / Nama</th>
              <th className="p-2">Penjamin / Operator</th>
              <th className="p-2">Dokter / Poli</th>
              <th className="p-2">Telp.</th>
              <th className="p-2">Ponsel</th>
              <th className="p-2">Keterangan</th>
              <th className="p-2 text-center w-8">x</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
            {MOCK_ROWS.map((r) => (
              <tr key={r.no} className={`hover:bg-slate-100 dark:hover:bg-slate-800/60 divide-x divide-slate-200 dark:divide-slate-800 ${r.status === 'BOOKED' ? 'bg-cyan-50/50 dark:bg-cyan-950/20' : ''}`}>
                <td className="p-2 text-center font-bold text-slate-600 dark:text-slate-400">{r.no}</td>
                <td className="p-2 text-center">
                  {r.status === 'BOOKED' ? (
                    <button className="px-2.5 py-0.5 bg-cyan-600 text-white text-[11px] font-bold rounded shadow-xs">Edit Slot</button>
                  ) : (
                    <button className="px-2.5 py-0.5 bg-lime-600 text-white text-[11px] font-bold rounded shadow-xs">Pilih Slot</button>
                  )}
                </td>
                <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-100">{r.jam}</td>
                <td className="p-2 text-center">
                  {r.status === 'BOOKED' ? (
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-[11px]">APPT ✔</span>
                  ) : (
                    <div className="flex justify-center gap-1">
                      <span className="px-1 bg-amber-400 text-slate-900 font-bold text-[10px] rounded">W</span>
                      <span className="px-1 bg-teal-500 text-white font-bold text-[10px] rounded">A</span>
                      <span className="px-1 bg-orange-500 text-white font-bold text-[10px] rounded">E</span>
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {r.status === 'BOOKED' ? (
                    <div>
                      <div className="font-mono text-[10px] text-slate-500">{r.rm}</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{r.nama}</div>
                    </div>
                  ) : (
                    <div className="h-0.5 bg-slate-300 dark:bg-slate-700 w-full my-2"></div>
                  )}
                </td>
                <td className="p-2">
                  {r.status === 'BOOKED' ? (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{r.penjamin}</span>
                      {r.kirim && <button className="px-1.5 py-0.5 bg-red-700 text-white text-[9px] font-bold rounded">Kirim</button>}
                    </div>
                  ) : (
                    <div className="h-0.5 bg-slate-300 dark:bg-slate-700 w-full my-2"></div>
                  )}
                </td>
                <td className="p-2 text-[11px]">
                  <div>{r.dokter}</div>
                  {r.poli && <div className="text-[10px] text-slate-500 font-semibold">{r.poli}</div>}
                </td>
                <td className="p-2 font-mono text-[11px]">{r.telp || '-'}</td>
                <td className="p-2 font-mono text-[11px]">{r.ponsel || '-'}</td>
                <td className="p-2 text-[11px]">{r.ket || '-'}</td>
                <td className="p-2 text-center">
                  {r.status === 'BOOKED' && <button className="text-red-600 font-bold hover:scale-125">⊗</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
