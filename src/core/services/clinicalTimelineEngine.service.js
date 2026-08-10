/**
 * NurseFlow Enterprise HIS — Clinical Timeline Engine Service
 * Authoritative Chronological Clinical Event Aggregator
 * Aggregates: Registration, Triage, Doctor SOAP, Diagnoses, Orders, Lab Results, Pharmacy Dispensing, eMAR, ADT Bed Assignments.
 */

class ClinicalTimelineEngine {
  constructor() {
    this.timelineEvents = [];
    this.initializeSampleTimeline();
  }

  initializeSampleTimeline() {
    const sampleEvents = [
      { id: 'EVT-01', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'REGISTRATION', title: 'Pendaftaran Patient Walk-In Poli Dahulu', actor: 'Petugas Admisi', timestamp: '2026-08-10T08:00:00Z', icon: 'how_to_reg' },
      { id: 'EVT-02', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'TRIAGE', title: 'Pemeriksaan Tanda Vital & Triase IGD (NEWS2: 2)', actor: 'Ns. Ratna Sari', timestamp: '2026-08-10T08:15:00Z', icon: 'vital_signs' },
      { id: 'EVT-03', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ASSESSMENT', title: 'Asesmen Dokter SOAP & Diagnosis I21.9 Acute MI', actor: 'dr. Surya Johnson', timestamp: '2026-08-10T08:35:00Z', icon: 'medical_information' },
      { id: 'EVT-04', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ORDER', title: 'Penerbitan Order Lab Darah Lengkap & GDS (STAT)', actor: 'dr. Surya Johnson', timestamp: '2026-08-10T08:45:00Z', icon: 'science' },
      { id: 'EVT-05', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'RESULT', title: 'Hasil Analitikal Lab Terverifikasi (LOINC-2345-7 GDS: 145 mg/dL)', actor: 'Analis Lab Supriadi', timestamp: '2026-08-10T09:10:00Z', icon: 'verified' },
      { id: 'EVT-06', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'MEDICATION', title: 'Dispensing Obat Farmasi (Amlodipine 10mg & Insulin Glargine)', actor: 'apt. Budi Santoso', timestamp: '2026-08-10T09:30:00Z', icon: 'medication' },
      { id: 'EVT-07', patientId: 'P-1001', encounterId: 'ENC-2026-0810-001', type: 'ADT_ADMISSION', title: 'Admisi Rawat Inap & Alokasi Bed AZALEA 204-A (Kelas 1)', actor: 'Admission Staff', timestamp: '2026-08-10T10:00:00Z', icon: 'hotel' }
    ];

    this.timelineEvents = sampleEvents;
  }

  recordEvent({ patientId, encounterId, episodeId = null, type, title, actor, payload = {}, icon = 'analytics' }) {
    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      patientId,
      encounterId,
      episodeId,
      type,
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
