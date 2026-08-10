/**
 * NurseFlow Enterprise HIS — Clinical Timeline Engine Service
 * Authoritative Chronological Clinical Event Read Model / Projection
 * Enforces mandatory source entity pointers (sourceEntityType & sourceEntityId) for 100% traceability to domain transactions.
 */

class ClinicalTimelineEngine {
  constructor() {
    this.timelineEvents = [];
    this.initializeSampleTimeline();
  }

  initializeSampleTimeline() {
    const sampleEvents = [
      { id: 'EVT-01', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'REGISTRATION', sourceEntityType: 'Patient', sourceEntityId: 'P-1001', title: 'Pendaftaran Patient Walk-In Poli Dahulu', actor: 'Petugas Admisi', timestamp: '2026-08-10T08:00:00Z', icon: 'how_to_reg' },
      { id: 'EVT-02', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'TRIAGE', sourceEntityType: 'Encounter', sourceEntityId: 'ENC-2026-0810-001', title: 'Pemeriksaan Tanda Vital & Triase IGD (NEWS2: 2)', actor: 'Ns. Ratna Sari', timestamp: '2026-08-10T08:15:00Z', icon: 'vital_signs' },
      { id: 'EVT-03', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ASSESSMENT', sourceEntityType: 'ClinicalDocument', sourceEntityId: 'DOC-SOAP-001', title: 'Asesmen Dokter SOAP & Diagnosis I21.9 Acute MI', actor: 'dr. Surya Johnson', timestamp: '2026-08-10T08:35:00Z', icon: 'medical_information' },
      { id: 'EVT-04', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ORDER', sourceEntityType: 'Order', sourceEntityId: 'ORD-LAB-20260810-001', title: 'Penerbitan Order Lab Darah Lengkap & GDS (STAT)', actor: 'dr. Surya Johnson', timestamp: '2026-08-10T08:45:00Z', icon: 'science' },
      { id: 'EVT-05', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'RESULT', sourceEntityType: 'Result', sourceEntityId: 'RES-LAB-001', title: 'Hasil Analitikal Lab Terverifikasi (LOINC-2345-7 GDS: 145 mg/dL)', actor: 'Analis Lab Supriadi', timestamp: '2026-08-10T09:10:00Z', icon: 'verified' },
      { id: 'EVT-06', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'MEDICATION', sourceEntityType: 'MedicationAdministration', sourceEntityId: 'MED-ADM-001', title: 'Dispensing Obat Farmasi (Amlodipine 10mg & Insulin Glargine)', actor: 'apt. Budi Santoso', timestamp: '2026-08-10T09:30:00Z', icon: 'medication' },
      { id: 'EVT-07', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ADT_ADMISSION', sourceEntityType: 'BedAssignment', sourceEntityId: 'BED-AZA-204-1', title: 'Admisi Rawat Inap & Alokasi Bed AZALEA 204-A (Kelas 1)', actor: 'Admission Staff', timestamp: '2026-08-10T10:00:00Z', icon: 'hotel' }
    ];

    this.timelineEvents = sampleEvents;
  }

  // Record Projected Timeline Event from Domain Transaction Event
  recordEvent({ patientId, encounterId, episodeId = null, type, sourceEntityType, sourceEntityId, title, actor, payload = {}, icon = 'analytics' }) {
    if (!sourceEntityType || !sourceEntityId) {
      throw new Error(`[ClinicalTimelineEngine] TRACEABILITY_ERROR: Timeline projection events must specify sourceEntityType and sourceEntityId.`);
    }

    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      encounterId,
      episodeId,
      type,
      sourceEntityType,
      sourceEntityId,
      title,
      actor,
      payload,
      icon,
      timestamp: new Date().toISOString()
    };

    this.timelineEvents.push(event);
    return event;
  }

  getPatientTimeline(patientId) {
    return this.timelineEvents
      .filter(e => e.patientId === patientId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export const clinicalTimelineEngine = new ClinicalTimelineEngine();
export default clinicalTimelineEngine;
