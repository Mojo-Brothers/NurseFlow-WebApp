/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Master Data Seed Dataset (Revision 5)
 * Comprehensive Normalized Relational Seed across 9 Core Domains.
 */

export const ENTERPRISE_MASTER_SEED = {
  // ─── 1. REFERENCE DATA ───
  triage_scales: [
    { id: 'REF-TRG-P1', code: 'P1_RESUSCITATION', name: 'Resusitasi Kritis Segera', color_badge: '#EF4444 (Merah Kritis)', target_response_time: '0 Menit (Segera/Immediat)', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-TRG-P2', code: 'P2_EMERGENT', name: 'Emergensi Gawat Darurat', color_badge: '#F97316 (Oranye Akut)', target_response_time: '≤ 10 Menit', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-TRG-P3', code: 'P3_URGENT', name: 'Urgent / Mendesak', color_badge: '#EAB308 (Kuning)', target_response_time: '≤ 30 Menit', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-TRG-P4', code: 'P4_LESS_URGENT', name: 'Semi-Urgent / Kurang Mendesak', color_badge: '#22C55E (Hijau)', target_response_time: '≤ 60 Menit', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-TRG-P5', code: 'P5_NON_URGENT', name: 'Non-Urgent / Tidak Gawat', color_badge: '#3B82F6 (Biru)', target_response_time: '≤ 120 Menit', status: 'ACTIVE', is_deleted: false }
  ],

  encounter_types: [
    { id: 'REF-ENC-EMER', code: 'EMERGENCY', name: 'Pelayanan Gawat Darurat (IGD)', hl7_class: 'EMER', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-ENC-AMB', code: 'AMBULATORY', name: 'Pelayanan Rawat Jalan (Poliklinik)', hl7_class: 'AMB', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-ENC-IMP', code: 'INPATIENT', name: 'Pelayanan Rawat Inap (Bangsal/ICU)', hl7_class: 'IMP', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-ENC-SURG', code: 'SURGERY', name: 'Pelayanan Bedah Sentral (Kamar Operasi)', hl7_class: 'IMP', status: 'ACTIVE', is_deleted: false }
  ],

  episode_types: [
    { id: 'REF-EOC-EMER', code: 'EMERGENCY', name: 'Episode Rawat Darurat (IGD)', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-EOC-AMB', code: 'AMBULATORY', name: 'Episode Rawat Jalan Berkelanjutan', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-EOC-IMP', code: 'INPATIENT', name: 'Episode Rawat Inap & Bangsal', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-EOC-ICU', code: 'ICU', name: 'Episode Perawatan Intensif (ICU/HCU)', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-EOC-SURG', code: 'SURGERY', name: 'Episode Bedah & Operasi Elektif', status: 'ACTIVE', is_deleted: false }
  ],

  encounter_statuses: [
    { id: 'REF-STS-PLN', code: 'PLANNED', name: 'Terjadwal / Dipesan', color_code: '#64748B', is_terminal: false },
    { id: 'REF-STS-ARR', code: 'ARRIVED', name: 'Pasien Tiba di Faskes', color_code: '#0284C7', is_terminal: false },
    { id: 'REF-STS-TRG', code: 'TRIAGED', name: 'Selesai Penilaian Triase', color_code: '#D97706', is_terminal: false },
    { id: 'REF-STS-WAI', code: 'WAITING', name: 'Menunggu Giliran Dokter', color_code: '#CA8A04', is_terminal: false },
    { id: 'REF-STS-INP', code: 'IN_PROGRESS', name: 'Pemeriksaan Klinis Berjalan', color_code: '#16A34A', is_terminal: false },
    { id: 'REF-STS-HLD', code: 'ON_HOLD', name: 'Menunggu Hasil Lab/Rad', color_code: '#9333EA', is_terminal: false },
    { id: 'REF-STS-CMP', code: 'COMPLETED', name: 'Pelayanan Selesai (Final)', color_code: '#059669', is_terminal: true },
    { id: 'REF-STS-CNC', code: 'CANCELLED', name: 'Kunjungan Dibatalkan', color_code: '#DC2626', is_terminal: true },
    { id: 'REF-STS-NSW', code: 'NO_SHOW', name: 'Pasien Tidak Hadir', color_code: '#475569', is_terminal: true }
  ],

  medication_routes: [
    { id: 'REF-RUT-ORAL', code: 'ORAL', name: 'Oral (Diminum lewat mulut)', kfa_code: 'KFA-RUT-01', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-RUT-IVB', code: 'IV_BOLUS', name: 'Intravena Bolus (IV)', kfa_code: 'KFA-RUT-02', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-RUT-IVD', code: 'IV_DRIP', name: 'Intravena Infus Drip', kfa_code: 'KFA-RUT-03', status: 'ACTIVE', is_deleted: false }
  ],

  dose_units: [
    { id: 'REF-UNT-MG', code: 'mg', name: 'Miligram', ucum_code: 'mg', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-UNT-G', code: 'g', name: 'Gram', ucum_code: 'g', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-UNT-TAB', code: 'tab', name: 'Tablet / Kapsul', ucum_code: '1', status: 'ACTIVE', is_deleted: false }
  ],

  discharge_dispositions: [
    { id: 'REF-DSC-01', code: 'PULANG_PERSETUJUAN_DOKTER', name: 'Pulang atas Persetujuan Dokter (Sembuh/Membaik)', satusehat_code: '1', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-DSC-02', code: 'DIRUJUK_KE_RS_LAIN', name: 'Dirujuk ke Faskes / RS Lain', satusehat_code: '2', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-DSC-03', code: 'PULANG_APS', name: 'Pulang atas Permintaan Sendiri (APS / Menolak Rawat)', satusehat_code: '3', status: 'ACTIVE', is_deleted: false }
  ],

  religions: [{ id: 'REF-REL-01', code: 'ISLAM', name: 'Islam', status: 'ACTIVE', is_deleted: false }],
  educations: [{ id: 'REF-EDU-05', code: 'S1', name: 'Sarjana (S1 / Profesi)', level: 5, status: 'ACTIVE', is_deleted: false }],
  occupations: [{ id: 'REF-OCC-01', code: 'PNS', name: 'Pegawai Negeri Sipil (PNS)', category: 'Pemerintahan', status: 'ACTIVE', is_deleted: false }],
  marital_statuses: [{ id: 'REF-MAR-02', code: 'MENIKAH', name: 'Menikah (Kawin)', status: 'ACTIVE', is_deleted: false }],
  genders: [
    { id: 'REF-GEN-01', code: 'L', name: 'Laki-Laki', hl7_code: 'male', status: 'ACTIVE', is_deleted: false },
    { id: 'REF-GEN-02', code: 'P', name: 'Perempuan', hl7_code: 'female', status: 'ACTIVE', is_deleted: false }
  ],
  blood_types: [{ id: 'REF-BLD-01', code: 'A+', name: 'Golongan Darah A Rhesus (+)', rhesus: 'Positif', status: 'ACTIVE', is_deleted: false }],
  provinces: [{ id: 'REF-PRV-31', code: '31', name: 'DKI Jakarta', status: 'ACTIVE', is_deleted: false }],
  cities: [{ id: 'REF-CTY-3171', code: '3171', name: 'Kota Jakarta Selatan', province_id: 'REF-PRV-31', province_name: 'DKI Jakarta', status: 'ACTIVE', is_deleted: false }],
  districts: [{ id: 'REF-DIS-317101', code: '317101', name: 'Kecamatan Setiabudi', city_id: 'REF-CTY-3171', city_name: 'Kota Jakarta Selatan', status: 'ACTIVE', is_deleted: false }],
  villages: [{ id: 'REF-VIL-31710101', code: '31710101', name: 'Kelurahan Karet Semanggi', district_id: 'REF-DIS-317101', district_name: 'Kecamatan Setiabudi', postal_code: '12930', status: 'ACTIVE', is_deleted: false }],
  room_classes: [{ id: 'REF-CLS-1', code: 'KELAS_1', name: 'Kelas 1 (2 Bed)', level: 3, status: 'ACTIVE', is_deleted: false }],
  shifts: [{ id: 'REF-SHF-PAGI', code: 'PAGI', name: 'Shift Pagi', start_time: '07:00', end_time: '14:00', status: 'ACTIVE', is_deleted: false }],
  examination_categories: [{ id: 'REF-EXM-01', code: 'HEMATOLOGI', name: 'Hematologi & Darah', type: 'LABORATORIUM', status: 'ACTIVE', is_deleted: false }],
  guarantor_types: [{ id: 'REF-GRN-BPJS', code: 'BPJS', name: 'BPJS Kesehatan (JKN)', status: 'ACTIVE', is_deleted: false }],
  service_lines: [{ id: 'REF-SVL-01', code: 'CARDIO', name: 'Pusat Layanan Jantung Terpadu', lead_specialty: 'Jantung & Pembuluh Darah', status: 'ACTIVE', is_deleted: false }],
  specialties: [{ id: 'REF-SPC-PD', code: 'SP_PD', name: 'Spesialis Penyakit Dalam (Sp.PD)', status: 'ACTIVE', is_deleted: false }],

  // ─── 2. ORGANIZATION ───
  hospitals: [{ id: 'ORG-HOSP-01', code: 'RSNF-CENTRAL', name: 'Rumah Sakit NurseFlow International', type: 'Tipe A Pendidikan', satusehat_org_id: '100028741', city: 'Jakarta Selatan', status: 'ACTIVE', is_deleted: false }],
  branches: [{ id: 'ORG-BRN-01', code: 'BRN-JKT-PST', name: 'NurseFlow Medical Center Sudirman', hospital_id: 'ORG-HOSP-01', hospital_name: 'RS NurseFlow International', phone: '021-55667788', status: 'ACTIVE', is_deleted: false }],
  departments: [{ id: 'ORG-DEP-MED', code: 'DEP-MED', name: 'Pelayanan Medik & Keperawatan', category: 'PELAYANAN_MEDIK', head_name: 'Dr. Robby Viory, Sp.B', status: 'ACTIVE', is_deleted: false }],
  units: [{ id: 'ORG-UNT-IGD', code: 'UNT-IGD', name: 'Unit Gawat Darurat (UGD)', department_id: 'ORG-DEP-MED', department_name: 'Pelayanan Medik & Keperawatan', status: 'ACTIVE', is_deleted: false }],
  positions: [{ id: 'ORG-POS-DPJP', code: 'DPJP_SPESIALIS', name: 'Dokter Penanggung Jawab Pelayanan', level: 'Klinis DPJP', status: 'ACTIVE', is_deleted: false }],
  cost_centers: [{ id: 'ORG-CC-IGD', code: 'CC-101', name: 'Cost Center IGD Resusitasi', department_name: 'Pelayanan Medik', status: 'ACTIVE', is_deleted: false }],

  // ─── 3. HUMAN RESOURCE ───
  employees: [{ id: 'EMP-2026-0001', nip: 'NIP-2026-000101', full_name: 'Ir. Agus Pratama, M.Kom', position_name: 'Kepala Departemen IT', department_name: 'Teknologi Informasi', email: 'agus.cio@nurseflow.hospital', status: 'ACTIVE', is_deleted: false }],
  doctors: [
    { id: 'DOC-1001', employee_id: 'EMP-2026-DOC1', doctor_code: 'DOC-PD-001', doctor_name: 'dr. Siti Wijaya, Sp.PD-KGEH', sip_number: 'SIP-503/4421/DPMPTSP/2026', str_number: 'STR-DOC-2026-981245', specialization: 'Penyakit Dalam (Gastroenterohepatologi)', credentials_expiry: '2028-12-31', status: 'ACTIVE', is_deleted: false }
  ],
  nurses: [{ id: 'NRS-1001', nurse_code: 'NRS-ICU-001', nurse_name: 'Ns. Ratna Sari Dewi, S.Kep, M.Kep', clinical_level: 'PK IV (Perawat Spesialis Kritis)', unit_name: 'ICU / Rawat Intensif', str_number: 'STR-NRS-2026-778899', status: 'ACTIVE', is_deleted: false }],
  clinical_privileges: [{ id: 'CPV-01', code: 'CPV-PD-01', staff_name: 'dr. Siti Wijaya, Sp.PD-KGEH', privilege_name: 'Endoskopi Saluran Cerna Atas & Bawah', version: 'v3.2-2026', approved_by: 'Komite Medik RS NurseFlow', valid_until: '2028-12-31', status: 'ACTIVE', is_deleted: false }],
  schedules: [{ id: 'SCH-1001', schedule_code: 'SCH-PD-MON', staff_name: 'dr. Siti Wijaya, Sp.PD-KGEH', clinic_name: 'Poliklinik Penyakit Dalam', day_of_week: 'Senin', start_time: '08:00', end_time: '13:00', patient_quota: 30, status: 'ACTIVE', is_deleted: false }],

  // ─── 4. FACILITY & KPI SNAPSHOTS ───
  buildings: [{ id: 'FAC-BLD-A', building_code: 'GD-A', building_name: 'Gedung Graha Medika (Utama)', total_floors: 8, status: 'ACTIVE', is_deleted: false }],
  floors: [{ id: 'FAC-FLR-A3', floor_code: 'GD-A-L3', floor_name: 'Lantai 3 (Rawat Inap Bangsal Mawar)', building_id: 'FAC-BLD-A', building_name: 'Gedung Graha Medika', status: 'ACTIVE', is_deleted: false }],
  wards: [{ id: 'FAC-WRD-MAWAR', ward_code: 'WRD-MAWAR', ward_name: 'Bangsal Mawar (Kelas 1 & 2)', building_name: 'Gedung Graha Medika', floor_name: 'Lantai 3', total_capacity: 24, status: 'ACTIVE', is_deleted: false }],
  rooms: [{ id: 'FAC-RM-301', room_code: 'RM-MAWAR-301', room_name: 'Kamar Mawar 301', building_name: 'Gedung Graha Medika', floor_name: 'Lantai 3', room_type: 'INPATIENT', status: 'ACTIVE', is_deleted: false }],
  facility_classes: [{ id: 'FAC-CLS-1', code: 'KELAS_1', name: 'Kelas 1 (2 Bed)', daily_base_rate: 650000, status: 'ACTIVE', is_deleted: false }],
  beds: [
    { id: 'FAC-BED-301A', bed_code: 'BED-MAWAR-301A', bed_number: 'Bed 301-A', ward_name: 'Bangsal Mawar', room_name: 'Kamar Mawar 301', class_name: 'Kelas 1 (2 Bed)', bed_status: 'AVAILABLE', has_oxygen: true, has_ventilator: false, status: 'ACTIVE', is_deleted: false },
    { id: 'FAC-BED-301B', bed_code: 'BED-MAWAR-301B', bed_number: 'Bed 301-B', ward_name: 'Bangsal Mawar', room_name: 'Kamar Mawar 301', class_name: 'Kelas 1 (2 Bed)', bed_status: 'OCCUPIED', has_oxygen: true, has_ventilator: false, status: 'ACTIVE', is_deleted: false }
  ],
  bed_cleaning_logs: [
    { id: 'CLN-101', bed_id: 'FAC-BED-301A', cleaning_started_at: '2026-08-17T09:00:00Z', cleaning_completed_at: '2026-08-17T09:25:00Z', cleaning_duration_minutes: 25, sanitized_by: 'Petugas Kebersihan / Sanitasi', status: 'SANITIZED_AVAILABLE', is_deleted: false }
  ],
  clinical_kpi_snapshots: [
    { id: 'KPI-2026-08-15', snapshot_date: '2026-08-15', bor: 76.5, alos: 4.2, toi: 1.8, bto: 4.5, emergency_waiting_time: 14.5, is_deleted: false },
    { id: 'KPI-2026-08-16', snapshot_date: '2026-08-16', bor: 78.0, alos: 4.1, toi: 1.6, bto: 4.7, emergency_waiting_time: 12.0, is_deleted: false },
    { id: 'KPI-2026-08-17', snapshot_date: '2026-08-17', bor: 74.2, alos: 4.4, toi: 1.9, bto: 4.4, emergency_waiting_time: 15.2, is_deleted: false }
  ],

  // ─── 5. PATIENT 360, ADT & QUEUE ───
  patients: [
    {
      id: 'P-1001',
      mrn: 'MRN-2026-001001',
      nik: '3171015005850001',
      bpjs_number: '0001234567890',
      satusehat_ihs_number: 'P10002874101',
      full_name: 'Ny. Siti Nurhaliza, S.Pd',
      birth_date: '1985-05-20',
      gender_label: 'Perempuan',
      city_label: 'Jakarta Selatan',
      allergies_summary: 'Amoxicillin, Seafood',
      allergies: [
        { type: 'DRUG', agent: 'Amoxicillin', reaction: 'Angioedema & Rash', severity: 'SEVERE' }
      ],
      merge_history: [],
      status: 'ACTIVE',
      is_deleted: false
    }
  ],

  episodes_of_care: [
    {
      id: 'EOC-2026-001',
      episode_number: 'EOC-2026-001001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      episode_type: 'INPATIENT',
      admission_date: '2026-08-15T08:30:00Z',
      discharge_date: null,
      attending_physician_id: 'DOC-1001',
      status: 'ACTIVE',
      is_deleted: false
    }
  ],

  encounters: [
    {
      id: 'ENC-2026-001',
      encounter_number: 'ENC-2026-001001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      encounter_type_label: 'Pelayanan Rawat Inap',
      encounter_status: 'IN_PROGRESS',
      location_id: 'FAC-BED-301B',
      practitioner_id: 'DOC-1001',
      started_at: '2026-08-15T09:00:00Z',
      ended_at: null,
      is_deleted: false
    }
  ],

  admissions: [
    {
      id: 'ADM-2026-001',
      admission_number: 'ADM-2026-001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      admission_type: 'EMERGENCY_ADMISSION',
      assigned_bed_id: 'FAC-BED-301B',
      admitting_doctor_id: 'DOC-1001',
      admitted_at: '2026-08-15T08:45:00Z',
      status: 'ADMITTED',
      is_deleted: false
    }
  ],

  transfers: [
    {
      id: 'TRF-2026-001',
      episode_id: 'EOC-2026-001',
      patient_id: 'P-1001',
      from_bed_id: 'FAC-BED-IGD-01',
      to_bed_id: 'FAC-BED-301B',
      transfer_reason: 'Pasien stabil dari IGD dipindahkan ke Bangsal Mawar',
      transferred_at: '2026-08-15T09:30:00Z',
      transferred_by: 'Ns. Fajar Purnama, S.Kep',
      status: 'COMPLETED',
      is_deleted: false
    }
  ],

  discharges: [],

  queue_tickets: [
    { id: 'QTK-01', queue_number: 'A-001', patient_name: 'Ny. Siti Nurhaliza, S.Pd', department_name: 'Poliklinik Penyakit Dalam', queue_status: 'CALLED', created_at: '2026-08-17T08:15:00Z', is_deleted: false },
    { id: 'QTK-02', queue_number: 'A-002', patient_name: 'Tn. Hendra Gunawan', department_name: 'Poliklinik Penyakit Dalam', queue_status: 'WAITING', created_at: '2026-08-17T08:20:00Z', is_deleted: false }
  ],

  guarantors: [{ id: 'GRN-1001', code: 'GRN-BPJS', name: 'BPJS Kesehatan Kantor Cabang Utama', status: 'ACTIVE', is_deleted: false }],
  insurances: [{ id: 'ASR-1001', code: 'ASR-INHEALTH-PLAT', name: 'Mandiri Inhealth Platinum Group', status: 'ACTIVE', is_deleted: false }],

  // ─── 6. CLINICAL, BUSINESS RULES & NOTIFICATIONS ───
  clinics: [{ id: 'CLI-1001', clinic_code: 'POLI-PD', clinic_name: 'Poliklinik Penyakit Dalam', status: 'ACTIVE', is_deleted: false }],
  diagnoses: [{ id: 'ICD-I10', icd10_code: 'I10', name_id: 'Hipertensi Esensial (Primer)', name_en: 'Essential (primary) hypertension', status: 'ACTIVE', is_deleted: false }],
  procedures: [{ id: 'ICD9-47.01', icd9_code: '47.01', procedure_name: 'Laparoscopic Appendectomy', status: 'ACTIVE', is_deleted: false }],
  laboratory_tests: [{ id: 'LAB-1001', test_code: 'LAB-DL', test_name: 'Hematologi Lengkap 5-Diff Otomatis', tariff: 110000, status: 'ACTIVE', is_deleted: false }],
  radiology_examinations: [{ id: 'RAD-1001', exam_code: 'RAD-THX-PA', exam_name: 'Foto Thorax Proyeksi PA DR', tariff: 190000, status: 'ACTIVE', is_deleted: false }],
  tariffs: [{ id: 'TRF-1001', tariff_code: 'TRF-KONSUL-SP', tariff_name: 'Konsultasi Spesialis', total_amount: 250000, doctor_fee: 180000, hospital_fee: 50000, nurse_fee: 20000, status: 'ACTIVE', is_deleted: false }],
  tariff_price_rules: [{ id: 'RUL-CITO-01', rule_code: 'RUL-CITO', rule_name: 'Tarif Tindakan Emergensi (Cito)', adjustment_type: 'PERCENTAGE', adjustment_value: '+25%', status: 'ACTIVE', is_deleted: false }],
  medicines: [
    { id: 'MED-AML-10', medicine_code: 'MED-AML-10', trade_name: 'Amlodipine 10 mg', generic_name: 'Amlodipine Besylate', kfa_code: '93000100', default_route_name: 'Oral', dosage_form: 'Tablet', dose_unit: 'mg', price: 1200, is_high_alert: false, is_antibiotic: false, is_narcotic: false, status: 'ACTIVE', is_deleted: false },
    { id: 'MED-MOR-10', medicine_code: 'MED-MOR-10', trade_name: 'Morphine HCl 10 mg/mL', generic_name: 'Morphine Hydrochloride', kfa_code: '93005820', default_route_name: 'Intravena Bolus (IV)', dosage_form: 'Ampul Injeksi', dose_unit: 'mg', price: 45000, is_high_alert: true, is_antibiotic: false, is_narcotic: true, status: 'ACTIVE', is_deleted: false }
  ],
  medication_lasa: [{ id: 'LSA-01', tall_man_lettering: 'DOPAmine vs DOBUTamine', lasa_type: 'SOUND_ALIKE', risk_level: 'HIGH', is_deleted: false }],
  inventory_unit_conversions: [{ id: 'CNV-01', medicine_id: 'MED-AML-10', from_unit: 'BOX', to_unit: 'STRIP', factor: 10, is_deleted: false }],
  medical_devices: [{ id: 'ALK-1001', device_code: 'ALK-VENT-01', device_name: 'Mechanical Ventilator Hamilton C6', status: 'ACTIVE', is_deleted: false }],

  business_rules: [
    { id: 'BRUL-01', rule_code: 'PEDIATRIC_RULE', rule_name: 'Verifikasi Dosis Pasien Pediatrik (< 12 Thn)', is_active: true, is_deleted: false },
    { id: 'BRUL-02', rule_code: 'GERIATRIC_RULE', rule_name: 'Skrining Polifarmasi Pasien Geriatrik (> 60 Thn)', is_active: true, is_deleted: false },
    { id: 'BRUL-03', rule_code: 'HOLIDAY_SURCHARGE', rule_name: 'Penyesuaian Tarif Hari Libur Nasional (+20%)', is_active: true, is_deleted: false }
  ],

  notification_templates: [
    { id: 'NTPL-01', template_code: 'TRIAGE_SLA_BREACH', title: '🚨 Peringatan SLA Waktu Tunggu Triase', message: 'Pasien {patient_name} telah melebihi batas waktu tunggu triase level {triage_level}.', channel: 'IN_APP', is_deleted: false },
    { id: 'NTPL-02', template_code: 'CRITICAL_LAB_ALERT', title: '⚠️ Hasil Lab Kritis (Panic Value)', message: 'Hasil tes {test_name} pasien {patient_name} berada pada nilai kritis.', channel: 'WHATSAPP_GATEWAY', is_deleted: false }
  ],

  // ─── 7. SECURITY & CLINICAL EVENT SOURCING ───
  users: [{ id: 'USR-01', username: 'admin@nurseflow.id', display_name: 'Super Administrator RS', role_name: 'Super Admin', department_name: 'Teknologi Informasi', last_login: '2026-08-17T11:45:00Z', status: 'ACTIVE', is_deleted: false }],
  roles: [{ id: 'ROLE-01', code: 'SUPER_ADMIN', name: 'Super Admin Sistem', tier_level: 'Tier 1 (Root)', status: 'ACTIVE', is_deleted: false }],
  permissions: [
    { id: 'PRM-EVT-READ', code: 'EVENT:READ', name: 'Akses Clinical Event Store', module_name: 'Event Sourcing', action: 'READ' },
    { id: 'PRM-Q-CALL', code: 'QUEUE:CALL', name: 'Panggil Nomor Antrean Pasien', module_name: 'Antrean Faskes', action: 'CALL' },
    { id: 'PRM-RUL-MGT', code: 'RULE:MANAGE', name: 'Kelola Aturan Bisnis Dinamis', module_name: 'Rule Engine', action: 'MANAGE' }
  ],
  sessions: [{ id: 'SES-01', session_id: 'SES-2026-X991A', user_email: 'admin@nurseflow.id', ip_address: '192.168.1.100', device_type: 'Desktop Web (Chrome 128 / Windows)', login_time: '2026-08-17 11:30:15', status: 'ACTIVE', is_deleted: false }],
  user_branch_assignments: [{ id: 'UBA-01', user_email: 'admin@nurseflow.id', branch_name: 'NurseFlow Medical Center Sudirman', is_default: true, is_deleted: false }],

  clinical_events: [
    { id: 'EVT-2026-0001', event_type: 'TRIAGE_ASSIGNED', aggregate_type: 'ENCOUNTER', aggregate_id: 'ENC-2026-001', created_at: '2026-08-17T08:30:00Z', is_deleted: false },
    { id: 'EVT-2026-0002', event_type: 'BED_TRANSFERRED', aggregate_type: 'BED', aggregate_id: 'FAC-BED-301B', created_at: '2026-08-17T09:30:00Z', is_deleted: false }
  ],

  // ─── 8. AUDIT & DATA RETENTION ───
  audit_logs: [
    { id: 'AUD-2026-0001', action: 'INITIAL_SEED', entity_name: 'Enterprise Master Data Foundation (Revision 5)', user_email: 'system@nurseflow.id', timestamp: '2026-08-17T08:00:00Z', ip_address: '127.0.0.1', action_summary: 'Inisialisasi 9 Domain Master Data Revisi 5 (Event Sourcing, Queue, SLA Alert, Rule Engine & KPI)', is_deleted: false }
  ],

  data_retention_policies: [
    { id: 'POL-01', entity_name: 'medical_records', title: 'Berkas Rekam Medis Pasien', active_period_years: 10, archive_period_years: 25, is_deleted: false },
    { id: 'POL-02', entity_name: 'audit_logs', title: 'Jejak Audit Trail & Log Keamanan', active_period_years: 5, archive_period_years: 10, is_deleted: false }
  ],

  // ─── 9. INTEGRATION ───
  satusehat_config: [{ id: 'INT-SS-01', org_id: '100028741', environment: 'PRODUCTION_READY (v1.0-R5)', auth_endpoint: 'https://api-satusehat.kemkes.go.id/oauth2/v1', fhir_base_url: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1', status: 'CONNECTED', is_deleted: false }],
  bpjs_vclaim_config: [{ id: 'INT-BPJS-01', cons_id: '29184', service_name: 'BPJS V-Claim & Antrean Faskes', base_url: 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest', user_key: 'KEY_BPJS_2026_PROD', status: 'CONNECTED', is_deleted: false }],
  hl7_endpoints: [{ id: 'INT-HL7-01', endpoint_code: 'HL7-ADT-LIS', protocol: 'MLLP over TCP/IP', port: 2575, message_type: 'ADT_A01, ADT_A08', status: 'LISTENING', is_deleted: false }],
  dicom_servers: [{ id: 'INT-DCM-01', ae_title: 'NURSEFLOW_PACS', server_name: 'DCM4CHEE PACS Radiologi Central', ip_address: '192.168.10.50', port: 11112, status: 'ONLINE', is_deleted: false }]
};
