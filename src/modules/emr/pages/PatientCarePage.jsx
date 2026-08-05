import React, { useEffect } from 'react';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import PatientCarePanel from '../components/PatientCarePanel.jsx';
import { RefreshCw, Activity } from 'lucide-react';

import AdvancedPatientSearchBar from '../components/AdvancedPatientSearchBar.jsx';

export default function PatientCarePage() {
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters, isLoading } = useEncounterStore();

  useEffect(() => {
    fetchPatients();
    fetchActiveEncounters();
  }, [fetchPatients, fetchActiveEncounters]);

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0] || null;
  const activeEncounter = activeEncounters.find(e => e.patient_id === activePatient?.id || e.patientId === activePatient?.id) || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2.5 text-primary">
            <Activity size={24} />
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Pelayanan Pasien Terpadu</h1>
          </div>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Modul Layanan Klinis, Observasi Fisiologi, Order Penunjang Terpadu, & RCM Billing Ledger
          </p>
        </div>
      </div>

      {/* Advanced Patient Search Bar */}
      <AdvancedPatientSearchBar 
        currentPatientId={activePatient?.id}
        onSelectPatient={(p) => selectPatient(p.id)}
      />

      {/* Main Patient Care Panel */}
      <PatientCarePanel 
        patient={activePatient}
        encounter={activeEncounter}
        onDischargeSuccess={() => {
          fetchPatients();
          fetchActiveEncounters();
        }}
      />
    </div>
  );
}
