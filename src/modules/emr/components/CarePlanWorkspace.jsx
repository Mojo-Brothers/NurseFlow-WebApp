import React, { useState } from 'react';
import { useEmrStore } from '../store/emr.store.js';

export default function CarePlanWorkspace() {
  const { carePlans, createCarePlan, selectedPatientId } = useEmrStore();

  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('2026-08-25');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    try {
      await createCarePlan({
        episodeId: 'EOC-2026-001',
        patientId: selectedPatientId,
        title,
        clinicalGoals: [goal],
        interventions: [
          { discipline: 'DOKTER_DPJP', description: 'Monitoring evaluasi klinis harian', status: 'PENDING' },
          { discipline: 'PERAWAT', description: 'Observasi TTV & asuhan keperawatan berkala', status: 'PENDING' }
        ],
        targetDate
      });
      alert('Rencana asuhan terpadu (Care Plan) berhasil diterbitkan.');
      setTitle('');
      setGoal('');
    } catch (err) {
      alert(`Gagal Menerbitkan Care Plan: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* ─── Form Care Plan ─── */}
      <div className="lg:col-span-5 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-teal-600">assignment</span>
          <h3 className="text-sm font-headline font-black text-on-surface uppercase">
            Penyusunan Rencana Asuhan (Care Plan)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Judul Asuhan Terpadu *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rencana Perawatan Pasien Hipertensi Kronis"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Target Capaian Klinis (Goal)</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Contoh: Tekanan darah terkontrol < 130/80 mmHg dalam 7 hari"
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Target Tanggal Evaluasi</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Terbitkan Care Plan</span>
          </button>
        </form>
      </div>

      {/* ─── Daftar Care Plan Aktif ─── */}
      <div className="lg:col-span-7 space-y-4">
        <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
          Rencana Asuhan Multidisiplin Aktif ({carePlans.length})
        </h4>

        <div className="space-y-3">
          {carePlans.map(cp => (
            <div key={cp.id} className="p-5 rounded-3xl bg-surface-container-high border border-outline-variant/30 text-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                    {cp.status} &bull; Target: {cp.target_date}
                  </span>
                  <h4 className="text-sm font-black text-on-surface mt-1">{cp.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant">DPJP: {cp.created_by}</span>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container border border-outline-variant/20 space-y-1">
                <span className="text-[10px] font-bold text-primary block uppercase">Target Klinis:</span>
                <ul className="list-disc list-inside text-on-surface text-[11px] space-y-0.5">
                  {cp.clinical_goals?.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Intervensi PPA Terintegrasi:</span>
                {cp.interventions?.map((inv, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-on-surface">{inv.discipline}: {inv.description}</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
