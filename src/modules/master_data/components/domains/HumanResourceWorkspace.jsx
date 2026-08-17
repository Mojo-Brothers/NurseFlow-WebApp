import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';

export default function HumanResourceWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity } = useEnterpriseMasterStore();

  const doctors = entitiesData['doctors'] || [];
  const nurses = entitiesData['nurses'] || [];
  const employees = entitiesData['employees'] || [];
  const schedules = entitiesData['schedules'] || [];

  const [activeHrTab, setActiveHrTab] = useState('DOCTORS'); // 'DOCTORS' | 'NURSES' | 'EMPLOYEES' | 'SCHEDULES'
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      
      {/* ─── Header & Sub-Tabs ─── */}
      <div className="p-4 rounded-3xl bg-surface-container-high border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              JCI MEDICAL CREDENTIALING
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant">SIP, STR, PK I-V & Clinical Privileges</span>
          </div>
          <h3 className="text-base font-headline font-black text-on-surface">Pusat Manajemen SDM Medis & Non-Medis</h3>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setActiveHrTab('DOCTORS');
              setActiveEntity('doctors');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeHrTab === 'DOCTORS' ? 'bg-teal-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">stethoscope</span>
            <span>Dokter DPJP ({doctors.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveHrTab('NURSES');
              setActiveEntity('nurses');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeHrTab === 'NURSES' ? 'bg-teal-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">medical_services</span>
            <span>Perawat PK I-V ({nurses.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveHrTab('EMPLOYEES');
              setActiveEntity('employees');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeHrTab === 'EMPLOYEES' ? 'bg-teal-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>Pegawai Organik ({employees.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveHrTab('SCHEDULES');
              setActiveEntity('schedules');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeHrTab === 'SCHEDULES' ? 'bg-teal-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Roster Jadwal ({schedules.length})</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: Master Dokter DPJP ─── */}
      {activeHrTab === 'DOCTORS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-headline font-black text-on-surface">Katalog Dokter Penanggung Jawab Pelayanan (DPJP)</h4>
            <button
              onClick={() => {
                setActiveEntity('doctors');
                openCreateModal();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/25"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tambah Master Dokter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <div
                key={doc.id}
                onClick={() => openDetailDrawer(doc)}
                className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-teal-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {doc.doctor_name?.charAt(4) || 'D'}
                    </div>
                    <div>
                      <span className="font-mono text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">
                        {doc.doctor_code}
                      </span>
                      <h5 className="text-sm font-headline font-black text-on-surface mt-0.5">{doc.doctor_name}</h5>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    AKTIF
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-container text-xs space-y-1">
                  <p className="font-bold text-primary">{doc.specialization}</p>
                  {doc.subspecialization && <p className="text-on-surface-variant text-[11px]">{doc.subspecialization}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-on-surface-variant">
                  <div>SIP: <strong>{doc.sip_number ? 'Terdaftar' : '-'}</strong></div>
                  <div>STR: <strong>{doc.str_number ? 'Terdaftar' : '-'}</strong></div>
                </div>

                {doc.clinical_privilege && (
                  <div className="p-2 rounded-lg bg-teal-500/5 border border-teal-500/20 text-[10px] text-teal-700 dark:text-teal-300">
                    <strong>Kewenangan Klinis:</strong> {doc.clinical_privilege}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Master Perawat PK I - V ─── */}
      {activeHrTab === 'NURSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-headline font-black text-on-surface">Katalog Jenjang Karir Perawat Klinis (PK I s/d PK V)</h4>
            <button
              onClick={() => {
                setActiveEntity('nurses');
                openCreateModal();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/25"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Tambah Master Perawat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nurses.map(nurse => (
              <div
                key={nurse.id}
                onClick={() => openDetailDrawer(nurse)}
                className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-teal-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
                      {nurse.clinical_level}
                    </span>
                    <h5 className="text-sm font-headline font-black text-on-surface mt-1.5">{nurse.nurse_name}</h5>
                    <p className="text-xs text-on-surface-variant font-medium">{nurse.unit_name}</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-600">{nurse.nurse_code}</span>
                </div>

                <div className="p-3 rounded-xl bg-surface-container text-xs space-y-1">
                  <p className="text-on-surface-variant">STR: <strong className="font-mono">{nurse.str_number}</strong></p>
                  <p className="text-on-surface-variant">Pendidikan: <strong>{nurse.education}</strong></p>
                </div>

                {nurse.competencies && (
                  <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 text-[10px] text-purple-700 dark:text-purple-300">
                    <strong>Kompetensi Kritis:</strong> {nurse.competencies}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Master Pegawai Organik ─── */}
      {activeHrTab === 'EMPLOYEES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => openDetailDrawer(emp)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-primary/40 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">{emp.nip}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">{emp.employment_type}</span>
              </div>
              <h4 className="text-sm font-black text-on-surface">{emp.full_name}</h4>
              <p className="text-xs text-on-surface-variant">{emp.position_name} &bull; {emp.department_name}</p>
              <p className="text-xs font-mono text-on-surface-variant pt-2 border-t border-outline-variant/20">{emp.email}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── TAB 4: Roster Jadwal Praktik ─── */}
      {activeHrTab === 'SCHEDULES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map(sch => (
            <div
              key={sch.id}
              onClick={() => openDetailDrawer(sch)}
              className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 font-mono">
                  {sch.schedule_code}
                </span>
                <h4 className="text-sm font-black text-on-surface mt-1">{sch.staff_name}</h4>
                <p className="text-xs text-on-surface-variant">{sch.clinic_name} &bull; Setiap <strong>{sch.day_of_week}</strong></p>
              </div>
              <div className="text-right font-mono">
                <p className="text-xs font-bold text-teal-600">{sch.start_time} - {sch.end_time}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Kuota: {sch.patient_quota} Pasien</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
