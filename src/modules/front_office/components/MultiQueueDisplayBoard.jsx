import React from 'react';
import { useFrontOfficeStore } from '../store/frontOffice.store.js';

export default function MultiQueueDisplayBoard() {
  const { queueTickets, queuePools, callTicket } = useFrontOfficeStore();

  const activeCallingTicket = queueTickets.find(t => t.queue_status === 'CALLED' || t.queue_status === 'SERVING') || queueTickets[0];

  return (
    <div className="space-y-6">
      {/* ─── Big Audio-Visual Screen Monitor Simulation ─── */}
      <div className="p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <h3 className="text-base font-headline font-black text-white uppercase tracking-wider">
              Papan Display Antrean Terpadu (Live Voice Synthesizer)
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-400">RS NurseFlow Enterprise</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 p-8 rounded-3xl bg-slate-900 border-2 border-teal-500/50 shadow-inner text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">NOMOR ANTREAN DIPANGGIL</span>
            <div className="text-6xl font-headline font-black text-teal-400 font-mono tracking-tight animate-pulse">
              {activeCallingTicket?.ticket_number || 'A-001'}
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
              Menuju: <strong className="text-amber-400">{activeCallingTicket?.counter_name || 'Loket Pendaftaran 1'}</strong>
            </div>
            <p className="text-xs text-slate-400 font-mono">Pasien: {activeCallingTicket?.patient_name || '-'}</p>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 gap-3">
            {queuePools.map(pool => {
              const currentInPool = queueTickets.filter(t => t.pool_code === pool.code && t.queue_status === 'WAITING').length;
              return (
                <div key={pool.code} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="font-mono text-[10px] font-bold text-teal-400 uppercase">{pool.prefix}-SERIES</span>
                  <h4 className="text-xs font-black text-white line-clamp-1">{pool.name}</h4>
                  <p className="text-xs font-bold text-slate-400">{currentInPool} Pasien Menunggu</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Operator Call Desk Controller ─── */}
      <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <h4 className="text-sm font-headline font-black text-on-surface uppercase">Meja Operator Pemanggil Antrean Pasien</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {queueTickets.filter(t => t.queue_status === 'WAITING' || t.queue_status === 'CALLED').map(ticket => (
            <div key={ticket.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="font-mono text-base font-black text-teal-600">{ticket.ticket_number}</span>
                <h5 className="text-xs font-black text-on-surface mt-0.5">{ticket.patient_name}</h5>
                <p className="text-[10px] text-on-surface-variant font-bold">{ticket.pool_name}</p>
              </div>
              <button
                onClick={() => callTicket(ticket.id, 'Loket 1')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">volume_up</span>
                <span>Panggil</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
