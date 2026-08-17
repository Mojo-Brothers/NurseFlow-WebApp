/**
 * NurseFlow Enterprise HIS 2026 — Enterprise SATUSEHAT HL7 FHIR R4 Interoperability Mapper (Revision 5)
 * Standardized schema converters for 16+ core healthcare resources:
 * Patient, EpisodeOfCare, Encounter, Practitioner, Organization, HealthcareService, Location,
 * Condition, Procedure, Medication, Coverage, Task, Appointment, Communication, AuditEvent, Provenance.
 */

export const SATUSEHAT_ORGANIZATION_ID = '100028741'; // Standard Kemenkes Hospital Org ID

export const enterpriseFhirMapper = {
  // 1. Patient → FHIR R4 Patient
  toFhirPatient: (p) => ({
    resourceType: 'Patient',
    id: p.id || p.mrn,
    identifier: [
      { use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: p.nik || '3171010101010001' },
      { use: 'secondary', system: `https://fhir.kemkes.go.id/id/pasien/${SATUSEHAT_ORGANIZATION_ID}`, value: p.mrn },
      ...(p.bpjs_number ? [{ use: 'secondary', system: 'https://fhir.kemkes.go.id/id/bpjs-kartu', value: p.bpjs_number }] : []),
      ...(p.satusehat_ihs_number ? [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/ihs-number', value: p.satusehat_ihs_number }] : [])
    ],
    active: !p.is_deleted && p.status === 'ACTIVE',
    name: [{ use: 'official', text: p.full_name || p.nama_lengkap }],
    gender: p.gender_id === 'REF-GEN-02' || p.jenis_kelamin === 'P' || p.gender_label === 'Perempuan' ? 'female' : 'male',
    birthDate: p.birth_date || p.tanggal_lahir || '1985-05-20',
    address: [{ use: 'home', line: [p.address_street || p.alamat || 'Jl. Sudirman No. 45'], city: p.city_label || p.kota || 'Jakarta Selatan', postalCode: p.postal_code || p.kode_pos || '12920', country: 'ID' }],
    telecom: [{ system: 'phone', value: p.phone || p.nomor_telepon || '081234567890', use: 'mobile' }]
  }),

  // 2. Episode of Care → FHIR R4 EpisodeOfCare
  toFhirEpisodeOfCare: (ep) => ({
    resourceType: 'EpisodeOfCare',
    id: ep.id || ep.episode_number,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/episode-of-care/${SATUSEHAT_ORGANIZATION_ID}`, value: ep.episode_number }],
    status: ep.status === 'ACTIVE' ? 'active' : ep.status === 'FINISHED' ? 'finished' : 'cancelled',
    type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/episodeofcare-type', code: ep.episode_type || 'hacc', display: ep.episode_type || 'Inpatient / Hospital Care' }] }],
    patient: { reference: `Patient/${ep.patient_id}`, display: ep.patient_name || 'Pasien Rekam Medis' },
    managingOrganization: { reference: `Organization/${SATUSEHAT_ORGANIZATION_ID}` },
    period: { start: ep.admission_date || new Date().toISOString(), end: ep.discharge_date || undefined }
  }),

  // 3. Encounter → FHIR R4 Encounter
  toFhirEncounter: (enc) => {
    const statusMap = {
      PLANNED: 'planned',
      ARRIVED: 'arrived',
      TRIAGED: 'triaged',
      WAITING: 'in-progress',
      IN_PROGRESS: 'in-progress',
      ON_HOLD: 'onleave',
      COMPLETED: 'finished',
      CANCELLED: 'cancelled',
      NO_SHOW: 'cancelled'
    };

    const classCode = enc.class_code || (enc.type === 'EMERGENCY' ? 'EMER' : enc.type === 'INPATIENT' ? 'IMP' : 'AMB');

    return {
      resourceType: 'Encounter',
      id: enc.id || `ENC-${Date.now()}`,
      identifier: [{ system: `https://fhir.kemkes.go.id/id/encounter/${SATUSEHAT_ORGANIZATION_ID}`, value: enc.encounter_number || enc.id }],
      status: statusMap[enc.encounter_status] || 'in-progress',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: classCode, display: classCode === 'EMER' ? 'Emergency' : classCode === 'IMP' ? 'Inpatient encounter' : 'Ambulatory' },
      subject: { reference: `Patient/${enc.patient_id || enc.mrn}`, display: enc.patient_name || 'Pasien Rekam Medis' },
      period: { start: enc.started_at || new Date().toISOString(), end: enc.ended_at || undefined },
      serviceProvider: { reference: `Organization/${SATUSEHAT_ORGANIZATION_ID}` }
    };
  },

  // 4. Practitioner → FHIR R4 Practitioner
  toFhirPractitioner: (staff) => ({
    resourceType: 'Practitioner',
    id: staff.id,
    identifier: [
      { use: 'official', system: 'https://fhir.kemkes.go.id/id/nik', value: staff.nik || '3171000000000000' },
      { use: 'official', system: 'https://fhir.kemkes.go.id/id/str', value: staff.str_number || staff.str || 'STR-2026-000' }
    ],
    active: !staff.is_deleted && staff.status === 'ACTIVE',
    name: [{ use: 'official', text: staff.doctor_name || staff.nurse_name || staff.full_name }]
  }),

  // 5. Organization → FHIR R4 Organization
  toFhirOrganization: (org) => ({
    resourceType: 'Organization',
    id: org.id,
    identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/organisasi', value: org.satusehat_org_id || SATUSEHAT_ORGANIZATION_ID }],
    active: !org.is_deleted && org.status === 'ACTIVE',
    name: org.name || org.building_name || 'NurseFlow Healthcare',
    telecom: [{ system: 'phone', value: org.phone || '021-55667788' }]
  }),

  // 6. Clinic → FHIR R4 HealthcareService
  toFhirHealthcareService: (clinic) => ({
    resourceType: 'HealthcareService',
    id: clinic.id,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/healthcare-service/${SATUSEHAT_ORGANIZATION_ID}`, value: clinic.clinic_code || clinic.id }],
    active: !clinic.is_deleted && clinic.status === 'ACTIVE',
    name: clinic.clinic_name || clinic.name
  }),

  // 7. Location Hierarchy
  toFhirLocationHierarchy: (bed, room = {}) => ({
    resourceType: 'Location',
    id: bed.id,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/lokasi/${SATUSEHAT_ORGANIZATION_ID}`, value: bed.bed_code || bed.id }],
    status: bed.bed_status === 'AVAILABLE' ? 'active' : 'suspended',
    name: bed.bed_number || 'Bed Perawatan',
    mode: 'instance',
    physicalType: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: 'bd', display: 'Bed' }] },
    partOf: { reference: `Location/${room.id || bed.room_id || 'ROOM-301'}`, display: room.room_name || bed.room_name || 'Kamar Rawat' }
  }),

  toFhirLocation: (item) => ({
    resourceType: 'Location',
    id: item.id,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/lokasi/${SATUSEHAT_ORGANIZATION_ID}`, value: item.bed_code || item.room_code || item.id }],
    status: item.bed_status === 'AVAILABLE' ? 'active' : 'suspended',
    name: item.bed_number || item.room_name || item.building_name || item.name,
    mode: 'instance'
  }),

  // 8. Diagnosis → FHIR R4 Condition
  toFhirCondition: (diag) => ({
    resourceType: 'Condition',
    id: diag.id,
    code: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: diag.icd10_code || diag.kode_icd10, display: diag.name_en || diag.nama_diagnosa }],
      text: diag.name_id || diag.nama_diagnosa
    },
    clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] }
  }),

  // 9. Procedure → FHIR R4 Procedure
  toFhirProcedure: (proc) => ({
    resourceType: 'Procedure',
    id: proc.id,
    code: {
      coding: [{ system: 'http://hl7.org/fhir/sid/icd-9-cm', code: proc.icd9_code || proc.kode_icd9, display: proc.procedure_name || proc.nama_tindakan }]
    },
    status: 'completed'
  }),

  // 10. Medicine → FHIR R4 Medication
  toFhirMedication: (med) => ({
    resourceType: 'Medication',
    id: med.id,
    code: {
      coding: [{ system: 'http://sys-ids.kemkes.go.id/kfa', code: med.kfa_code || '93000100', display: med.trade_name }],
      text: `${med.trade_name} (${med.generic_name})`
    },
    status: 'active',
    form: { coding: [{ system: 'http://terminology.kemkes.go.id/CodeSystem/medication-form', code: med.dosage_form || 'Tablet' }] },
    extension: med.is_high_alert ? [{ url: 'https://nurseflow.id/fhir/high-alert-warning', valueBoolean: true }] : []
  }),

  // 11. Insurance → FHIR R4 Coverage
  toFhirCoverage: (ins) => ({
    resourceType: 'Coverage',
    id: ins.id,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/coverage/${SATUSEHAT_ORGANIZATION_ID}`, value: ins.contract_number || ins.code || ins.id }],
    status: 'active',
    type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-type', code: ins.is_pbi ? 'PBI' : 'NON_PBI', display: ins.name || 'Jaminan Kesehatan Nasional' }] }
  }),

  // ─── 12. Task (Antrean & Tugas Klinis) ───
  toFhirTask: (ticket) => ({
    resourceType: 'Task',
    id: ticket.id,
    identifier: [{ system: `https://fhir.kemkes.go.id/id/queue-ticket/${SATUSEHAT_ORGANIZATION_ID}`, value: ticket.queue_number }],
    status: ticket.queue_status === 'COMPLETED' ? 'completed' : ticket.queue_status === 'CALLED' ? 'in-progress' : 'requested',
    intent: 'order',
    description: `Antrean Faskes: ${ticket.queue_number} (${ticket.department_name})`,
    for: { display: ticket.patient_name },
    authoredOn: ticket.created_at || new Date().toISOString()
  }),

  // ─── 13. Appointment (Jadwal & Reservasi) ───
  toFhirAppointment: (appt) => ({
    resourceType: 'Appointment',
    id: appt.id,
    status: 'booked',
    serviceCategory: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/service-category', code: 'clinic', display: 'Pelayanan Poliklinik' }] }],
    description: appt.clinic_name || 'Konsultasi Rawat Jalan',
    start: appt.start_time || new Date().toISOString(),
    participant: [
      { actor: { display: appt.patient_name || 'Pasien' }, status: 'accepted' },
      { actor: { display: appt.doctor_name || 'Dokter DPJP' }, status: 'accepted' }
    ]
  }),

  // ─── 14. Communication (Notifikasi & Broadcast) ───
  toFhirCommunication: (notif) => ({
    resourceType: 'Communication',
    id: notif.id,
    status: 'completed',
    sent: notif.sent_at || new Date().toISOString(),
    recipient: [{ display: notif.recipient_id || 'Staff' }],
    payload: [{ contentString: `${notif.title}: ${notif.message}` }]
  }),

  // ─── 15. AuditEvent (Universal Audit Log) ───
  toFhirAuditEvent: (audit) => ({
    resourceType: 'AuditEvent',
    id: audit.id,
    type: { system: 'http://terminology.hl7.org/CodeSystem/audit-event-type', code: 'rest', display: 'RESTful Operation' },
    action: audit.event_type === 'CREATE' ? 'C' : audit.event_type === 'UPDATE' ? 'U' : 'E',
    recorded: audit.timestamp || new Date().toISOString(),
    agent: [{ who: { display: audit.actor || 'admin@nurseflow.id' }, requestor: true }],
    entity: [{ what: { reference: `${audit.entity_type}/${audit.entity_id}` }, description: audit.reason }]
  }),

  // ─── 16. Provenance (Asal-Usul Data & Integrasi) ───
  toFhirProvenance: (event) => ({
    resourceType: 'Provenance',
    id: event.id,
    target: [{ reference: `${event.aggregate_type}/${event.aggregate_id}` }],
    recorded: event.created_at || new Date().toISOString(),
    activity: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation', code: event.event_type }] },
    agent: [{ who: { display: event.created_by || 'system' } }]
  }),

  // 17. Generic Fallback
  toGenericFhir: (entityKey, data) => ({
    resourceType: 'Basic',
    id: data.id,
    code: { coding: [{ system: 'https://nurseflow.id/fhir/structure', code: entityKey, display: data.name || data.title || entityKey }] }
  })
};
