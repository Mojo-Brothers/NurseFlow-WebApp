/**
 * NurseFlow Enterprise HIS 2026 — Master Data 9-Domain Enterprise Schemas (Revision 5)
 * Comprehensive schema definitions across 9 core domains including:
 * - Reference: Skala Triase, Encounter Types, Episode Types, Encounter Statuses, Rute Obat KFA, Satuan Dosis
 * - Patient: Patients 360, Guarantors, Insurances, Episodes of Care, Encounters, Queue Tickets
 * - ADT & Facility: Buildings, Floors, Wards, Rooms, Classes, Beds, Admissions, Transfers, Discharges, Bed Cleaning Logs, KPI Snapshots
 * - Pharmacy & Clinical: Clinics, ICD-10, ICD-9, Lab Tests, Rad Exams, Tariffs, Tariff Price Rules, Medicines, Devices, LASA, Unit Conversions, Business Rules
 * - Security & Governance: Users, Roles, Permissions, Sessions, User Branch Assignments, Clinical Events, Universal Audit Logs, Data Retention Policies
 */

export const ENTERPRISE_DOMAINS = [
  {
    id: 'REFERENCE',
    title: 'Reference Data',
    icon: 'menu_book',
    description: 'Kamus standar acuan nasional, kodifikasi Kemendagri, skala triase ATS, episode types & encounter statuses.',
    entities: [
      'triage_scales', 'encounter_types', 'episode_types', 'encounter_statuses',
      'medication_routes', 'dose_units', 'discharge_dispositions',
      'religions', 'educations', 'occupations', 'marital_statuses', 'genders',
      'blood_types', 'provinces', 'cities', 'districts', 'villages',
      'room_classes', 'shifts', 'examination_categories', 'guarantor_types',
      'service_lines', 'specialties'
    ]
  },
  {
    id: 'ORGANIZATION',
    title: 'Organization',
    icon: 'corporate_fare',
    description: 'Struktur multi-rumah sakit, multi-cabang, departemen, unit, jabatan & cost center.',
    entities: ['hospitals', 'branches', 'departments', 'units', 'positions', 'cost_centers']
  },
  {
    id: 'HUMAN_RESOURCE',
    title: 'Human Resource',
    icon: 'badge',
    description: 'SDM terpadu medis & non-medis, kredensialing SIP/STR, jenjang perawat PK I-V, clinical privileges.',
    entities: [
      'employees', 'doctors', 'nurses', 'clinical_privileges',
      'schedules'
    ]
  },
  {
    id: 'FACILITY',
    title: 'Facility Hierarchy',
    icon: 'apartment',
    description: 'Hierarki spasial 6 tingkat, log sterilisasi tempat tidur & snapshot indikator efisiensi rawat inap (BOR/ALOS/TOI/BTO).',
    entities: ['buildings', 'floors', 'wards', 'rooms', 'facility_classes', 'beds', 'bed_cleaning_logs', 'clinical_kpi_snapshots']
  },
  {
    id: 'PATIENT',
    title: 'Patient 360',
    icon: 'person_search',
    description: 'One Patient One Identity, penjamin, episodes of care, encounters & tiket antrean pasien terpadu.',
    entities: ['patients', 'episodes_of_care', 'encounters', 'admissions', 'transfers', 'discharges', 'queue_tickets', 'guarantors', 'insurances']
  },
  {
    id: 'CLINICAL',
    title: 'Clinical & Tariffs',
    icon: 'medical_services',
    description: 'Poli, ICD-10, ICD-9, Lab, Rad, Formularium FEFO, LASA, Konversi Satuan, Alkes IPSRS, Aturan Bisnis & Notifikasi.',
    entities: [
      'clinics', 'diagnoses', 'procedures', 'laboratory_tests',
      'radiology_examinations', 'tariffs', 'tariff_price_rules',
      'medicines', 'medication_lasa', 'inventory_unit_conversions', 'medical_devices',
      'business_rules', 'notification_templates'
    ]
  },
  {
    id: 'SECURITY',
    title: 'Security (RBAC + ABAC)',
    icon: 'shield_lock',
    description: 'Kontrol akses peran 4-Tier, isolasi multi-cabang (RLS), manajemen sesi aktif, penugasan cabang & event sourcing.',
    entities: ['users', 'roles', 'permissions', 'sessions', 'user_branch_assignments', 'clinical_events']
  },
  {
    id: 'AUDIT',
    title: 'Audit Trail & Retention',
    icon: 'history_toggle_off',
    description: 'Jejak audit imutabel event-driven JCI & kebijakan retensi/arsip rekam medis (Permenkes 24/2022).',
    entities: ['audit_logs', 'data_retention_policies']
  },
  {
    id: 'INTEGRATION',
    title: 'Integration & Interoperability',
    icon: 'hub',
    description: 'Jembatan interoperabilitas SATUSEHAT FHIR R4, BPJS V-Claim/Antrean, HL7, DICOM PACS & Registry.',
    entities: ['satusehat_config', 'bpjs_vclaim_config', 'hl7_endpoints', 'dicom_servers']
  }
];

export const ENTERPRISE_ENTITY_SCHEMAS = {
  // ─── 1. REFERENCE DATA ───
  triage_scales: { domain: 'REFERENCE', table: 'ref_triage_scales', title: 'Kamus Skala Triase (ATS / ESI)', singular: 'Skala Triase', codePrefix: 'TRG', icon: 'emergency', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode Level', type: 'text', width: '150px' }, { key: 'name', label: 'Kategori Triase', type: 'text', width: '250px' }, { key: 'color_badge', label: 'Warna Standar', type: 'badge', width: '130px' }, { key: 'target_response_time', label: 'Target Respon', type: 'text', width: '180px' }] },
  encounter_types: { domain: 'REFERENCE', table: 'ref_encounter_types', title: 'Klasifikasi Jenis Kunjungan', singular: 'Tipe Kunjungan', codePrefix: 'ENC_TYP', icon: 'sensor_occupied', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Jenis Kunjungan', type: 'text', width: '250px' }] },
  episode_types: { domain: 'REFERENCE', table: 'ref_episode_types', title: 'Kamus Tipe Episode', singular: 'Tipe Episode', codePrefix: 'EOC_TYP', icon: 'timeline', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '150px' }, { key: 'name', label: 'Tipe Episode Rawat', type: 'text', width: '250px' }] },
  encounter_statuses: { domain: 'REFERENCE', table: 'ref_encounter_statuses', title: 'Kamus Status Encounter', singular: 'Status Encounter', codePrefix: 'ENC_STS', icon: 'alt_route', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Status Code', type: 'text', width: '140px' }, { key: 'name', label: 'Deskripsi', type: 'text', width: '250px' }, { key: 'is_terminal', label: 'Terminal', type: 'boolean', width: '120px' }] },
  medication_routes: { domain: 'REFERENCE', table: 'ref_medication_routes', title: 'Kamus Rute Obat KFA', singular: 'Rute Obat', codePrefix: 'RUT', icon: 'medication', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Rute Pemberian', type: 'text', width: '220px' }] },
  dose_units: { domain: 'REFERENCE', table: 'ref_dose_units', title: 'Satuan Dosis UCUM', singular: 'Satuan Dosis', codePrefix: 'UNT', icon: 'straighten', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Simbol', type: 'text', width: '120px' }, { key: 'name', label: 'Nama Satuan', type: 'text', width: '220px' }] },
  discharge_dispositions: { domain: 'REFERENCE', table: 'ref_discharge_dispositions', title: 'Cara Keluar Pasien', singular: 'Cara Keluar', codePrefix: 'DSC', icon: 'logout', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Kondisi Kepulangan', type: 'text', width: '280px' }] },

  religions: { domain: 'REFERENCE', table: 'ref_religions', title: 'Kamus Agama', singular: 'Agama', codePrefix: 'REL', icon: 'self_improvement', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Nama Agama', type: 'text', width: '250px' }] },
  educations: { domain: 'REFERENCE', table: 'ref_educations', title: 'Kamus Pendidikan', singular: 'Pendidikan', codePrefix: 'EDU', icon: 'school', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '100px' }, { key: 'name', label: 'Tingkat Pendidikan', type: 'text', width: '250px' }] },
  occupations: { domain: 'REFERENCE', table: 'ref_occupations', title: 'Kamus Pekerjaan', singular: 'Pekerjaan', codePrefix: 'OCC', icon: 'work', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Profesi', type: 'text', width: '250px' }] },
  marital_statuses: { domain: 'REFERENCE', table: 'ref_marital_statuses', title: 'Status Pernikahan', singular: 'Status Nikah', codePrefix: 'MAR', icon: 'family_restroom', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Status', type: 'text', width: '250px' }] },
  genders: { domain: 'REFERENCE', table: 'ref_genders', title: 'Jenis Kelamin', singular: 'Jenis Kelamin', codePrefix: 'GEN', icon: 'wc', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '100px' }, { key: 'name', label: 'Jenis Kelamin', type: 'text', width: '200px' }] },
  blood_types: { domain: 'REFERENCE', table: 'ref_blood_types', title: 'Golongan Darah', singular: 'Golongan Darah', codePrefix: 'BLD', icon: 'bloodtype', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Golongan Darah', type: 'text', width: '120px' }, { key: 'rhesus', label: 'Rhesus', type: 'text', width: '120px' }] },
  provinces: { domain: 'REFERENCE', table: 'ref_provinces', title: 'Provinsi Kemendagri', singular: 'Provinsi', codePrefix: 'PRV', icon: 'map', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '150px' }, { key: 'name', label: 'Provinsi', type: 'text', width: '300px' }] },
  cities: { domain: 'REFERENCE', table: 'ref_cities', title: 'Kota / Kab', singular: 'Kota/Kab', codePrefix: 'CTY', icon: 'location_city', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Kota / Kab', type: 'text', width: '250px' }] },
  districts: { domain: 'REFERENCE', table: 'ref_districts', title: 'Kecamatan', singular: 'Kecamatan', codePrefix: 'DIS', icon: 'holiday_village', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '150px' }, { key: 'name', label: 'Kecamatan', type: 'text', width: '250px' }] },
  villages: { domain: 'REFERENCE', table: 'ref_villages', title: 'Kelurahan', singular: 'Kelurahan', codePrefix: 'VIL', icon: 'signpost', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '150px' }, { key: 'name', label: 'Kelurahan', type: 'text', width: '250px' }] },
  room_classes: { domain: 'REFERENCE', table: 'ref_room_classes', title: 'Kelas Ruangan', singular: 'Kelas Ruangan', codePrefix: 'CLS', icon: 'hotel', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Kelas Ruangan', type: 'text', width: '250px' }] },
  shifts: { domain: 'REFERENCE', table: 'ref_shifts', title: 'Shift Kerja RS', singular: 'Shift Kerja', codePrefix: 'SHF', icon: 'schedule', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '120px' }, { key: 'name', label: 'Shift Kerja', type: 'text', width: '200px' }] },
  examination_categories: { domain: 'REFERENCE', table: 'ref_examination_categories', title: 'Kategori Uji', singular: 'Kategori Uji', codePrefix: 'EXM', icon: 'category', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Kategori', type: 'text', width: '250px' }] },
  guarantor_types: { domain: 'REFERENCE', table: 'ref_guarantor_types', title: 'Jenis Penjamin', singular: 'Jenis Penjamin', codePrefix: 'GRN_TYP', icon: 'account_balance', fhirResource: 'Coverage', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Jenis Penjamin', type: 'text', width: '250px' }] },
  service_lines: { domain: 'REFERENCE', table: 'ref_service_lines', title: 'Layanan Unggulan', singular: 'Service Line', codePrefix: 'SVL', icon: 'line_style', fhirResource: 'HealthcareService', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Service Line', type: 'text', width: '250px' }] },
  specialties: { domain: 'REFERENCE', table: 'ref_specialties', title: 'Spesialisasi Medis', singular: 'Spesialisasi', codePrefix: 'SPC', icon: 'workspace_premium', fhirResource: 'Practitioner', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Spesialisasi Medis', type: 'text', width: '250px' }] },

  // ─── 2. ORGANIZATION ───
  hospitals: { domain: 'ORGANIZATION', table: 'master_hospitals', title: 'Rumah Sakit Induk', singular: 'Rumah Sakit', codePrefix: 'RS', icon: 'local_hospital', fhirResource: 'Organization', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode RS', type: 'text', width: '140px' }, { key: 'name', label: 'Nama RS', type: 'text', width: '300px' }] },
  branches: { domain: 'ORGANIZATION', table: 'master_branches', title: 'Cabang Regional', singular: 'Cabang Regional', codePrefix: 'BRN', icon: 'share_location', fhirResource: 'Organization', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode Cabang', type: 'text', width: '140px' }, { key: 'name', label: 'Nama Cabang', type: 'text', width: '280px' }] },
  departments: { domain: 'ORGANIZATION', table: 'master_departments', title: 'Departemen RS', singular: 'Departemen', codePrefix: 'DEP', icon: 'hub', fhirResource: 'Organization', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode Dept', type: 'text', width: '120px' }, { key: 'name', label: 'Nama Departemen', type: 'text', width: '260px' }] },
  units: { domain: 'ORGANIZATION', table: 'master_units', title: 'Unit Kerja', singular: 'Unit Kerja', codePrefix: 'UNT', icon: 'domain', fhirResource: 'Organization', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode Unit', type: 'text', width: '120px' }, { key: 'name', label: 'Nama Unit', type: 'text', width: '250px' }] },
  positions: { domain: 'ORGANIZATION', table: 'master_positions', title: 'Master Jabatan', singular: 'Jabatan', codePrefix: 'POS', icon: 'military_tech', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Nama Jabatan', type: 'text', width: '250px' }] },
  cost_centers: { domain: 'ORGANIZATION', table: 'master_cost_centers', title: 'Cost Center', singular: 'Cost Center', codePrefix: 'CC', icon: 'monetization_on', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode CC', type: 'text', width: '140px' }, { key: 'name', label: 'Nama Pusat Biaya', type: 'text', width: '260px' }] },

  // ─── 3. HUMAN RESOURCE ───
  employees: { domain: 'HUMAN_RESOURCE', table: 'master_employees', title: 'Master Pegawai', singular: 'Pegawai', codePrefix: 'EMP', icon: 'badge', fhirResource: 'Practitioner', codeField: 'nip', nameField: 'full_name', columns: [{ key: 'nip', label: 'NIP', type: 'text', width: '180px' }, { key: 'full_name', label: 'Nama Pegawai', type: 'text', width: '260px' }] },
  doctors: { domain: 'HUMAN_RESOURCE', table: 'master_doctors', title: 'Master Dokter DPJP', singular: 'Dokter DPJP', codePrefix: 'DOC', icon: 'stethoscope', fhirResource: 'Practitioner', codeField: 'doctor_code', nameField: 'doctor_name', columns: [{ key: 'doctor_code', label: 'Kode Dokter', type: 'text', width: '140px' }, { key: 'doctor_name', label: 'Nama Dokter', type: 'text', width: '260px' }] },
  nurses: { domain: 'HUMAN_RESOURCE', table: 'master_nurses', title: 'Perawat Klinis PK I-V', singular: 'Perawat', codePrefix: 'NRS', icon: 'medical_services', fhirResource: 'Practitioner', codeField: 'nurse_code', nameField: 'nurse_name', columns: [{ key: 'nurse_code', label: 'Kode Perawat', type: 'text', width: '140px' }, { key: 'nurse_name', label: 'Nama Ners', type: 'text', width: '250px' }] },
  clinical_privileges: { domain: 'HUMAN_RESOURCE', table: 'master_clinical_privileges', title: 'Kewenangan Klinis (RKK)', singular: 'RKK', codePrefix: 'CPV', icon: 'assignment_turned_in', fhirResource: 'Basic', codeField: 'code', nameField: 'privilege_name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'staff_name', label: 'Tenaga Medis', type: 'text', width: '240px' }] },
  schedules: { domain: 'HUMAN_RESOURCE', table: 'master_schedules', title: 'Jadwal Praktik', singular: 'Jadwal Praktik', codePrefix: 'SCH', icon: 'calendar_month', fhirResource: 'HealthcareService', codeField: 'schedule_code', nameField: 'staff_name', columns: [{ key: 'schedule_code', label: 'Kode Jadwal', type: 'text', width: '140px' }, { key: 'staff_name', label: 'Dokter', type: 'text', width: '240px' }] },

  // ─── 4. FACILITY & KPI SNAPSHOTS ───
  buildings: { domain: 'FACILITY', table: 'master_buildings', title: 'Gedung RS', singular: 'Gedung', codePrefix: 'BLD', icon: 'apartment', fhirResource: 'Location', codeField: 'building_code', nameField: 'building_name', columns: [{ key: 'building_code', label: 'Kode Gedung', type: 'text', width: '140px' }, { key: 'building_name', label: 'Nama Gedung', type: 'text', width: '280px' }] },
  floors: { domain: 'FACILITY', table: 'master_floors', title: 'Lantai Gedung', singular: 'Lantai', codePrefix: 'FLR', icon: 'layers', fhirResource: 'Location', codeField: 'floor_code', nameField: 'floor_name', columns: [{ key: 'floor_code', label: 'Kode Lantai', type: 'text', width: '140px' }, { key: 'floor_name', label: 'Nama Lantai', type: 'text', width: '250px' }] },
  wards: { domain: 'FACILITY', table: 'master_wards', title: 'Bangsal Rawat Inap', singular: 'Bangsal', codePrefix: 'WRD', icon: 'domain', fhirResource: 'Location', codeField: 'ward_code', nameField: 'ward_name', columns: [{ key: 'ward_code', label: 'Kode Bangsal', type: 'text', width: '140px' }, { key: 'ward_name', label: 'Nama Bangsal', type: 'text', width: '280px' }] },
  rooms: { domain: 'FACILITY', table: 'master_rooms', title: 'Ruangan Rawat', singular: 'Ruangan', codePrefix: 'RM', icon: 'meeting_room', fhirResource: 'Location', codeField: 'room_code', nameField: 'room_name', columns: [{ key: 'room_code', label: 'Kode Ruangan', type: 'text', width: '140px' }, { key: 'room_name', label: 'Nama Ruangan', type: 'text', width: '250px' }] },
  facility_classes: { domain: 'FACILITY', table: 'master_facility_classes', title: 'Kelas Kamar', singular: 'Kelas Kamar', codePrefix: 'CLS', icon: 'hotel_class', fhirResource: 'Location', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Nama Kelas', type: 'text', width: '250px' }] },
  beds: { domain: 'FACILITY', table: 'master_beds', title: 'Tempat Tidur', singular: 'Tempat Tidur', codePrefix: 'BED', icon: 'bed', fhirResource: 'Location', codeField: 'bed_code', nameField: 'bed_number', columns: [{ key: 'bed_code', label: 'Kode Bed', type: 'text', width: '140px' }, { key: 'bed_number', label: 'Nomor Bed', type: 'text', width: '180px' }, { key: 'bed_status', label: 'Status BOR', type: 'badge', width: '160px' }] },
  bed_cleaning_logs: { domain: 'FACILITY', table: 'sys_bed_cleaning_logs', title: 'Log Sterilisasi Bed', singular: 'Log Sterilisasi', codePrefix: 'CLN', icon: 'cleaning_services', fhirResource: 'Basic', codeField: 'id', nameField: 'status', columns: [{ key: 'bed_id', label: 'Kode Bed', type: 'text', width: '140px' }, { key: 'cleaning_started_at', label: 'Waktu Mulai', type: 'datetime', width: '180px' }, { key: 'status', label: 'Status Sterilisasi', type: 'badge', width: '150px' }] },
  clinical_kpi_snapshots: {
    domain: 'FACILITY',
    table: 'clinical_kpi_snapshots',
    title: 'Snapshot Indikator Efisiensi Rawat Inap (KARS / Depkes)',
    singular: 'KPI Snapshot',
    codePrefix: 'KPI',
    icon: 'monitoring',
    fhirResource: 'Basic',
    codeField: 'snapshot_date',
    nameField: 'bor',
    columns: [
      { key: 'snapshot_date', label: 'Tanggal Snapshot', type: 'text', width: '140px' },
      { key: 'bor', label: 'BOR (%)', type: 'number', width: '110px' },
      { key: 'alos', label: 'ALOS (Hari)', type: 'number', width: '110px' },
      { key: 'toi', label: 'TOI (Hari)', type: 'number', width: '110px' },
      { key: 'bto', label: 'BTO (Kali)', type: 'number', width: '110px' },
      { key: 'emergency_waiting_time', label: 'Rata-rata Respon IGD (Menit)', type: 'number', width: '180px' }
    ]
  },

  // ─── 5. PATIENT 360, ADT & QUEUE ───
  patients: { domain: 'PATIENT', table: 'master_patients', title: 'Master Pasien 360', singular: 'Pasien', codePrefix: 'P', icon: 'personal_injury', fhirResource: 'Patient', codeField: 'mrn', nameField: 'full_name', columns: [{ key: 'mrn', label: 'MRN', type: 'text', width: '180px' }, { key: 'nik', label: 'NIK KTP', type: 'text', width: '180px' }, { key: 'full_name', label: 'Nama Pasien', type: 'text', width: '250px' }] },
  episodes_of_care: { domain: 'PATIENT', table: 'episodes_of_care', title: 'Episode Perawatan', singular: 'Episode', codePrefix: 'EOC', icon: 'timeline', fhirResource: 'EpisodeOfCare', codeField: 'episode_number', nameField: 'episode_type', columns: [{ key: 'episode_number', label: 'Nomor Episode', type: 'text', width: '160px' }, { key: 'patient_name', label: 'Pasien', type: 'text', width: '220px' }, { key: 'status', label: 'Status', type: 'badge', width: '120px' }] },
  encounters: { domain: 'PATIENT', table: 'encounters', title: 'Encounter Klinis', singular: 'Encounter', codePrefix: 'ENC', icon: 'meeting_room', fhirResource: 'Encounter', codeField: 'encounter_number', nameField: 'encounter_status', columns: [{ key: 'encounter_number', label: 'Nomor Encounter', type: 'text', width: '160px' }, { key: 'patient_name', label: 'Pasien', type: 'text', width: '220px' }, { key: 'encounter_status', label: 'Status State Machine', type: 'badge', width: '160px' }] },
  admissions: { domain: 'PATIENT', table: 'admissions', title: 'Admisi Rawat Inap', singular: 'Admisi', codePrefix: 'ADM', icon: 'login', fhirResource: 'Encounter', codeField: 'admission_number', nameField: 'admission_type', columns: [{ key: 'admission_number', label: 'Nomor Admisi', type: 'text', width: '160px' }, { key: 'patient_name', label: 'Pasien', type: 'text', width: '220px' }] },
  transfers: { domain: 'PATIENT', table: 'transfers', title: 'Mutasi Bangsal', singular: 'Transfer', codePrefix: 'TRF', icon: 'swap_horiz', fhirResource: 'Encounter', codeField: 'id', nameField: 'transfer_reason', columns: [{ key: 'from_bed_id', label: 'Dari Bed', type: 'text', width: '140px' }, { key: 'to_bed_id', label: 'Tujuan Bed', type: 'text', width: '140px' }] },
  discharges: { domain: 'PATIENT', table: 'discharges', title: 'Pemulangan Pasien', singular: 'Discharge', codePrefix: 'DSC', icon: 'logout', fhirResource: 'Encounter', codeField: 'id', nameField: 'notes', columns: [{ key: 'patient_name', label: 'Pasien Pulang', type: 'text', width: '220px' }, { key: 'discharged_at', label: 'Waktu Pulang', type: 'datetime', width: '180px' }] },
  queue_tickets: {
    domain: 'PATIENT',
    table: 'queue_tickets',
    title: 'Tiket Antrean Pasien Faskes (Queue)',
    singular: 'Tiket Antrean',
    codePrefix: 'QTK',
    icon: 'confirmation_number',
    fhirResource: 'Task',
    codeField: 'queue_number',
    nameField: 'patient_name',
    columns: [
      { key: 'queue_number', label: 'Nomor Antrean', type: 'text', width: '140px' },
      { key: 'patient_name', label: 'Nama Pasien', type: 'text', width: '220px' },
      { key: 'department_name', label: 'Tujuan Poliklinik', type: 'text', width: '220px' },
      { key: 'queue_status', label: 'Status Antrean', type: 'badge', width: '140px' },
      { key: 'created_at', label: 'Waktu Ambil Tiket', type: 'datetime', width: '180px' }
    ]
  },
  guarantors: { domain: 'PATIENT', table: 'master_guarantors', title: 'Master Penjamin', singular: 'Penjamin', codePrefix: 'GRN', icon: 'account_balance', fhirResource: 'Coverage', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Penjamin', type: 'text', width: '260px' }] },
  insurances: { domain: 'PATIENT', table: 'master_insurances', title: 'Master Asuransi', singular: 'Asuransi', codePrefix: 'ASR', icon: 'verified_user', fhirResource: 'Coverage', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Asuransi', type: 'text', width: '260px' }] },

  // ─── 6. CLINICAL, BUSINESS RULES & NOTIFICATION ───
  clinics: { domain: 'CLINICAL', table: 'master_clinics', title: 'Poliklinik', singular: 'Poli', codePrefix: 'POLI', icon: 'local_hospital', fhirResource: 'HealthcareService', codeField: 'clinic_code', nameField: 'clinic_name', columns: [{ key: 'clinic_code', label: 'Kode Poli', type: 'text', width: '140px' }, { key: 'clinic_name', label: 'Nama Poli', type: 'text', width: '260px' }] },
  diagnoses: { domain: 'CLINICAL', table: 'master_diagnoses', title: 'Diagnosa ICD-10', singular: 'ICD-10', codePrefix: 'ICD10', icon: 'format_list_bulleted', fhirResource: 'Condition', codeField: 'icd10_code', nameField: 'name_id', columns: [{ key: 'icd10_code', label: 'Kode ICD-10', type: 'text', width: '140px' }, { key: 'name_id', label: 'Diagnosa', type: 'text', width: '320px' }] },
  procedures: { domain: 'CLINICAL', table: 'master_procedures', title: 'Tindakan ICD-9-CM', singular: 'ICD-9', codePrefix: 'ICD9', icon: 'precision_manufacturing', fhirResource: 'Procedure', codeField: 'icd9_code', nameField: 'procedure_name', columns: [{ key: 'icd9_code', label: 'Kode ICD-9', type: 'text', width: '140px' }, { key: 'procedure_name', label: 'Tindakan', type: 'text', width: '320px' }] },
  laboratory_tests: { domain: 'CLINICAL', table: 'master_laboratory_tests', title: 'Pemeriksaan Lab', singular: 'Lab Test', codePrefix: 'LAB', icon: 'biotech', fhirResource: 'ObservationDefinition', codeField: 'test_code', nameField: 'test_name', columns: [{ key: 'test_code', label: 'Kode Tes', type: 'text', width: '140px' }, { key: 'test_name', label: 'Nama Uji Lab', type: 'text', width: '280px' }] },
  radiology_examinations: { domain: 'CLINICAL', table: 'master_radiology_examinations', title: 'Eksaminasi Radiologi', singular: 'Radiologi', codePrefix: 'RAD', icon: 'radiology', fhirResource: 'ImagingStudy', codeField: 'exam_code', nameField: 'exam_name', columns: [{ key: 'exam_code', label: 'Kode', type: 'text', width: '140px' }, { key: 'exam_name', label: 'Pemeriksaan', type: 'text', width: '280px' }] },
  tariffs: { domain: 'CLINICAL', table: 'master_tariffs', title: 'Tarif Multi-Komponen', singular: 'Tarif Layanan', codePrefix: 'TRF', icon: 'payments', fhirResource: 'Basic', codeField: 'tariff_code', nameField: 'tariff_name', columns: [{ key: 'tariff_code', label: 'Kode', type: 'text', width: '140px' }, { key: 'tariff_name', label: 'Tarif', type: 'text', width: '300px' }, { key: 'total_amount', label: 'Total', type: 'currency', width: '160px' }] },
  tariff_price_rules: { domain: 'CLINICAL', table: 'master_tariff_price_rules', title: 'Aturan Tarif Dinamis', singular: 'Price Rule', codePrefix: 'RUL', icon: 'tune', fhirResource: 'Basic', codeField: 'rule_code', nameField: 'rule_name', columns: [{ key: 'rule_code', label: 'Kode', type: 'text', width: '140px' }, { key: 'rule_name', label: 'Aturan Tarif', type: 'text', width: '260px' }] },
  medicines: { domain: 'CLINICAL', table: 'master_medicines', title: 'Formularium Obat RS', singular: 'Obat', codePrefix: 'MED', icon: 'pill', fhirResource: 'Medication', codeField: 'medicine_code', nameField: 'trade_name', columns: [{ key: 'medicine_code', label: 'Kode Obat', type: 'text', width: '140px' }, { key: 'trade_name', label: 'Nama Dagang', type: 'text', width: '240px' }] },
  medication_lasa: { domain: 'CLINICAL', table: 'master_medication_lasa', title: 'Katalog Obat LASA', singular: 'Obat LASA', codePrefix: 'LSA', icon: 'visibility', fhirResource: 'Basic', codeField: 'id', nameField: 'tall_man_lettering', columns: [{ key: 'tall_man_lettering', label: 'Tall Man Lettering', type: 'text', width: '280px' }, { key: 'risk_level', label: 'Tingkat Bahaya', type: 'badge', width: '140px' }] },
  inventory_unit_conversions: { domain: 'CLINICAL', table: 'master_inventory_unit_conversions', title: 'Konversi Satuan Farmasi', singular: 'Konversi Satuan', codePrefix: 'CNV', icon: 'transform', fhirResource: 'Basic', codeField: 'id', nameField: 'from_unit', columns: [{ key: 'from_unit', label: 'Satuan Asal', type: 'text', width: '160px' }, { key: 'to_unit', label: 'Satuan Dosis', type: 'text', width: '160px' }, { key: 'factor', label: 'Faktor Pengali', type: 'number', width: '160px' }] },
  medical_devices: { domain: 'CLINICAL', table: 'master_medical_devices', title: 'Alkes IPSRS', singular: 'Alkes', codePrefix: 'ALK', icon: 'medical_information', fhirResource: 'Device', codeField: 'device_code', nameField: 'device_name', columns: [{ key: 'device_code', label: 'Kode', type: 'text', width: '140px' }, { key: 'device_name', label: 'Nama Alkes', type: 'text', width: '260px' }] },
  business_rules: {
    domain: 'CLINICAL',
    table: 'business_rules',
    title: 'Aturan Bisnis & Kebijakan Dinamis (Rule Engine)',
    singular: 'Aturan Bisnis',
    codePrefix: 'BRUL',
    icon: 'rule',
    fhirResource: 'Basic',
    codeField: 'rule_code',
    nameField: 'rule_name',
    columns: [
      { key: 'rule_code', label: 'Kode Aturan', type: 'text', width: '180px' },
      { key: 'rule_name', label: 'Nama Kebijakan Bisnis', type: 'text', width: '280px' },
      { key: 'is_active', label: 'Status Aktif', type: 'boolean', width: '130px' }
    ]
  },
  notification_templates: {
    domain: 'CLINICAL',
    table: 'notification_templates',
    title: 'Template Notifikasi & Broadcast SLA',
    singular: 'Template Notifikasi',
    codePrefix: 'NTPL',
    icon: 'notifications_active',
    fhirResource: 'Communication',
    codeField: 'template_code',
    nameField: 'title',
    columns: [
      { key: 'template_code', label: 'Kode Template', type: 'text', width: '180px' },
      { key: 'title', label: 'Judul Pesan', type: 'text', width: '240px' },
      { key: 'channel', label: 'Kanal Broadcast', type: 'badge', width: '160px' }
    ]
  },

  // ─── 7. SECURITY & CLINICAL EVENT SOURCING ───
  users: { domain: 'SECURITY', table: 'sys_users', title: 'Akun Pengguna', singular: 'Pengguna', codePrefix: 'USR', icon: 'group', fhirResource: 'Basic', codeField: 'username', nameField: 'display_name', columns: [{ key: 'username', label: 'Email', type: 'text', width: '220px' }, { key: 'display_name', label: 'Nama', type: 'text', width: '220px' }] },
  roles: { domain: 'SECURITY', table: 'sys_roles', title: 'Hierarki Peran', singular: 'Peran', codePrefix: 'ROL', icon: 'admin_panel_settings', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode', type: 'text', width: '140px' }, { key: 'name', label: 'Nama Peran', type: 'text', width: '240px' }] },
  permissions: { domain: 'SECURITY', table: 'sys_permissions', title: 'Katalog Izin', singular: 'Izin', codePrefix: 'PRM', icon: 'key', fhirResource: 'Basic', codeField: 'code', nameField: 'name', columns: [{ key: 'code', label: 'Kode Izin', type: 'text', width: '180px' }, { key: 'name', label: 'Deskripsi', type: 'text', width: '260px' }] },
  sessions: { domain: 'SECURITY', table: 'sys_sessions', title: 'Sesi Aktif', singular: 'Sesi', codePrefix: 'SES', icon: 'devices', fhirResource: 'Basic', codeField: 'session_id', nameField: 'user_email', columns: [{ key: 'session_id', label: 'ID Sesi', type: 'text', width: '180px' }, { key: 'user_email', label: 'Email', type: 'text', width: '220px' }] },
  user_branch_assignments: { domain: 'SECURITY', table: 'sys_user_branch_assignments', title: 'Penugasan Cabang (RLS)', singular: 'Penugasan Cabang', codePrefix: 'UBA', icon: 'domain_verification', fhirResource: 'Basic', codeField: 'id', nameField: 'user_email', columns: [{ key: 'user_email', label: 'Pengguna', type: 'text', width: '220px' }, { key: 'branch_name', label: 'Cabang RLS', type: 'text', width: '240px' }] },
  clinical_events: {
    domain: 'SECURITY',
    table: 'clinical_events',
    title: 'Clinical Event Store (Immutable Event Stream)',
    singular: 'Event Klinis',
    codePrefix: 'EVT',
    icon: 'stream',
    fhirResource: 'AuditEvent',
    codeField: 'id',
    nameField: 'event_type',
    columns: [
      { key: 'event_type', label: 'Tipe Event Domain', type: 'badge', width: '220px' },
      { key: 'aggregate_type', label: 'Tipe Agregat', type: 'text', width: '160px' },
      { key: 'aggregate_id', label: 'ID Agregat', type: 'text', width: '160px' },
      { key: 'created_at', label: 'Stempel Waktu', type: 'datetime', width: '180px' }
    ]
  },

  // ─── 8. AUDIT & DATA RETENTION ───
  audit_logs: { domain: 'AUDIT', table: 'sys_audit_logs', title: 'Universal Audit Trail', singular: 'Audit Log', codePrefix: 'AUD', icon: 'history', fhirResource: 'AuditEvent', codeField: 'id', nameField: 'action_summary', columns: [{ key: 'action', label: 'Aksi', type: 'badge', width: '140px' }, { key: 'entity_name', label: 'Entitas', type: 'text', width: '200px' }, { key: 'timestamp', label: 'Waktu', type: 'datetime', width: '180px' }] },
  data_retention_policies: {
    domain: 'AUDIT',
    table: 'data_retention_policies',
    title: 'Kebijakan Retensi & Pengarsipan Data (Permenkes 24/2022)',
    singular: 'Kebijakan Retensi',
    codePrefix: 'POL',
    icon: 'archive',
    fhirResource: 'Basic',
    codeField: 'entity_name',
    nameField: 'title',
    columns: [
      { key: 'title', label: 'Kategori Berkas Data', type: 'text', width: '240px' },
      { key: 'active_period_years', label: 'Masa Aktif (Tahun)', type: 'number', width: '160px' },
      { key: 'archive_period_years', label: 'Masa Arsip (Tahun)', type: 'number', width: '160px' }
    ]
  },

  // ─── 9. INTEGRATION ───
  satusehat_config: [{ id: 'INT-SS-01', org_id: '100028741', environment: 'PRODUCTION_READY (v1.0-R5)', auth_endpoint: 'https://api-satusehat.kemkes.go.id/oauth2/v1', fhir_base_url: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1', status: 'CONNECTED', is_deleted: false }],
  bpjs_vclaim_config: [{ id: 'INT-BPJS-01', cons_id: '29184', service_name: 'BPJS V-Claim & Antrean Faskes', base_url: 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest', user_key: 'KEY_BPJS_2026_PROD', status: 'CONNECTED', is_deleted: false }],
  hl7_endpoints: [{ id: 'INT-HL7-01', endpoint_code: 'HL7-ADT-LIS', protocol: 'MLLP over TCP/IP', port: 2575, message_type: 'ADT_A01, ADT_A08', status: 'LISTENING', is_deleted: false }],
  dicom_servers: [{ id: 'INT-DCM-01', ae_title: 'NURSEFLOW_PACS', server_name: 'DCM4CHEE PACS Radiologi Central', ip_address: '192.168.10.50', port: 11112, status: 'ONLINE', is_deleted: false }]
};
