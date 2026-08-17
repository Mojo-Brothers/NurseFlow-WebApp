/**
 * NurseFlow Enterprise HIS — Master Data Schemas Definition
 * Covers all 18 Hospital Sub-Modules with validation rules, FHIR resource mappings, and UI metadata.
 */

export const MASTER_DATA_ENTITIES = {
  // 👥 SDM & PASIEN
  PATIENT: {
    key: 'PATIENT',
    table: 'patients',
    endpoint: '/api/v1/master/patients',
    title: 'Master Pasien',
    singular: 'Pasien',
    icon: 'personal_injury',
    cluster: 'PEOPLE',
    fhirResource: 'Patient',
    codePrefix: 'MRN-',
    primaryKeyField: 'id',
    codeField: 'mrn',
    nameField: 'nama_lengkap',
    columns: [
      { key: 'mrn', label: 'No. MRN', sortable: true, primary: true },
      { key: 'nama_lengkap', label: 'Nama Lengkap Pasien', sortable: true },
      { key: 'nik', label: 'NIK (16 Digit)', sortable: true },
      { key: 'no_bpjs', label: 'No. BPJS' },
      { key: 'jenis_kelamin', label: 'Gender', format: 'gender' },
      { key: 'tanggal_lahir', label: 'Tgl Lahir / Usia', format: 'date_age' },
      { key: 'nomor_telepon', label: 'No. Telepon' },
      { key: 'kota', label: 'Kota / Domisili' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  DOCTOR: {
    key: 'DOCTOR',
    table: 'doctors',
    endpoint: '/api/v1/master/doctors',
    title: 'Master Dokter',
    singular: 'Dokter / DPJP',
    icon: 'stethoscope',
    cluster: 'PEOPLE',
    fhirResource: 'Practitioner',
    codePrefix: 'DOC-',
    primaryKeyField: 'id',
    codeField: 'kode_dokter',
    nameField: 'nama_dokter',
    columns: [
      { key: 'kode_dokter', label: 'Kode Dokter', sortable: true, primary: true },
      { key: 'nama_dokter', label: 'Nama Dokter & Gelar', sortable: true },
      { key: 'sip', label: 'No. SIP' },
      { key: 'str', label: 'No. STR' },
      { key: 'spesialisasi', label: 'Spesialisasi', sortable: true, format: 'chip' },
      { key: 'sub_spesialisasi', label: 'Sub-Spesialisasi' },
      { key: 'nomor_telepon', label: 'Kontak' },
      { key: 'status', label: 'Status Praktik', format: 'status_badge' }
    ]
  },

  NURSE: {
    key: 'NURSE',
    table: 'nurses',
    endpoint: '/api/v1/master/nurses',
    title: 'Master Perawat',
    singular: 'Perawat / Ners',
    icon: 'vital_signs',
    cluster: 'PEOPLE',
    fhirResource: 'Practitioner',
    codePrefix: 'NRS-',
    primaryKeyField: 'id',
    codeField: 'kode_perawat',
    nameField: 'nama_perawat',
    columns: [
      { key: 'kode_perawat', label: 'Kode Perawat', sortable: true, primary: true },
      { key: 'nama_perawat', label: 'Nama Perawat', sortable: true },
      { key: 'STR', label: 'No. STR' },
      { key: 'unit_kerja', label: 'Unit Kerja / Bangsal', sortable: true, format: 'chip' },
      { key: 'jenjang_klinis', label: 'Jenjang Klinis (PK)', sortable: true, format: 'badge_pk' },
      { key: 'pendidikan', label: 'Pendidikan Terakhir' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  EMPLOYEE: {
    key: 'EMPLOYEE',
    table: 'employees',
    endpoint: '/api/v1/master/employees',
    title: 'Master Pegawai',
    singular: 'Pegawai',
    icon: 'badge',
    cluster: 'PEOPLE',
    fhirResource: 'Person',
    codePrefix: 'EMP-',
    primaryKeyField: 'id',
    codeField: 'nip',
    nameField: 'nama',
    columns: [
      { key: 'nip', label: 'NIP / ID Karyawan', sortable: true, primary: true },
      { key: 'nama', label: 'Nama Lengkap', sortable: true },
      { key: 'jabatan', label: 'Jabatan', sortable: true },
      { key: 'departemen', label: 'Departemen', sortable: true, format: 'chip' },
      { key: 'unit', label: 'Unit Kerja' },
      { key: 'nomor_telepon', label: 'No. Telepon' },
      { key: 'status', label: 'Status Kepegawaian', format: 'status_badge' }
    ]
  },

  SCHEDULE: {
    key: 'SCHEDULE',
    table: 'doctor_schedules',
    endpoint: '/api/v1/master/schedules',
    title: 'Master Jadwal Dokter',
    singular: 'Jadwal Dokter',
    icon: 'calendar_month',
    cluster: 'PEOPLE',
    fhirResource: 'Schedule',
    codePrefix: 'SCH-',
    primaryKeyField: 'id',
    codeField: 'kode_jadwal',
    nameField: 'doctor_name',
    columns: [
      { key: 'kode_jadwal', label: 'Kode Jadwal', primary: true },
      { key: 'doctor_name', label: 'Nama Dokter', sortable: true },
      { key: 'clinic_name', label: 'Poli / Klinik', sortable: true, format: 'chip' },
      { key: 'hari', label: 'Hari Praktik', sortable: true, format: 'badge_day' },
      { key: 'jam_mulai', label: 'Jam Mulai' },
      { key: 'jam_selesai', label: 'Jam Selesai' },
      { key: 'kuota', label: 'Kuota Pasien', format: 'number' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  // 🏥 FASILITAS & RUANGAN
  CLINIC: {
    key: 'CLINIC',
    table: 'clinics',
    endpoint: '/api/v1/master/clinics',
    title: 'Master Poli / Klinik',
    singular: 'Poli / Klinik',
    icon: 'domain',
    cluster: 'FACILITY',
    fhirResource: 'HealthcareService',
    codePrefix: 'POLI-',
    primaryKeyField: 'id',
    codeField: 'kode_poli',
    nameField: 'nama_poli',
    columns: [
      { key: 'kode_poli', label: 'Kode Poli', sortable: true, primary: true },
      { key: 'nama_poli', label: 'Nama Poliklinik', sortable: true },
      { key: 'lantai', label: 'Lantai / Gedung', sortable: true },
      { key: 'lokasi', label: 'Area Lokasi' },
      { key: 'status', label: 'Status Layanan', format: 'status_badge' }
    ]
  },

  ROOM: {
    key: 'ROOM',
    table: 'rooms',
    endpoint: '/api/v1/master/rooms',
    title: 'Master Ruangan & Bangsal',
    singular: 'Ruangan',
    icon: 'meeting_room',
    cluster: 'FACILITY',
    fhirResource: 'Location',
    codePrefix: 'RM-',
    primaryKeyField: 'id',
    codeField: 'kode_ruangan',
    nameField: 'nama_ruangan',
    columns: [
      { key: 'kode_ruangan', label: 'Kode Ruangan', sortable: true, primary: true },
      { key: 'nama_ruangan', label: 'Nama Ruangan / Bangsal', sortable: true },
      { key: 'jenis_ruangan', label: 'Jenis Unit', sortable: true, format: 'chip' },
      { key: 'lantai', label: 'Lantai / Sayap' },
      { key: 'kapasitas', label: 'Kapasitas Bed', format: 'number' },
      { key: 'status', label: 'Status Ruangan', format: 'status_badge' }
    ]
  },

  BED: {
    key: 'BED',
    table: 'beds',
    endpoint: '/api/v1/master/beds',
    title: 'Master Tempat Tidur',
    singular: 'Tempat Tidur',
    icon: 'bed',
    cluster: 'FACILITY',
    fhirResource: 'Location',
    codePrefix: 'BED-',
    primaryKeyField: 'id',
    codeField: 'kode_bed',
    nameField: 'nomor_bed',
    columns: [
      { key: 'kode_bed', label: 'Kode Bed', sortable: true, primary: true },
      { key: 'nomor_bed', label: 'No. Bed / Label', sortable: true },
      { key: 'ruangan_nama', label: 'Ruangan / Bangsal', sortable: true },
      { key: 'kelas', label: 'Kelas Perawatan', sortable: true, format: 'chip' },
      { key: 'status_bed', label: 'Ketersediaan Bed', format: 'bed_status_badge' },
      { key: 'status', label: 'Status Operasional', format: 'status_badge' }
    ]
  },

  // 📋 KLINIS & DIAGNOSTIK
  DIAGNOSIS: {
    key: 'DIAGNOSIS',
    table: 'diagnoses',
    endpoint: '/api/v1/master/diagnoses',
    title: 'Master Diagnosa (ICD-10)',
    singular: 'Diagnosa ICD-10',
    icon: 'clinical_notes',
    cluster: 'CLINICAL',
    fhirResource: 'Condition',
    codePrefix: '',
    primaryKeyField: 'id',
    codeField: 'kode_icd10',
    nameField: 'nama_diagnosa',
    columns: [
      { key: 'kode_icd10', label: 'Kode ICD-10', sortable: true, primary: true },
      { key: 'nama_diagnosa', label: 'Deskripsi Diagnosa (Bahasa)', sortable: true },
      { key: 'nama_diagnosa_en', label: 'Deskripsi WHO (English)' },
      { key: 'kategori', label: 'Kategori / Bab WHO', sortable: true, format: 'chip' },
      { key: 'is_chronic', label: 'Kronis', format: 'boolean_tag' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  PROCEDURE: {
    key: 'PROCEDURE',
    table: 'procedures',
    endpoint: '/api/v1/master/procedures',
    title: 'Master Tindakan (ICD-9-CM)',
    singular: 'Tindakan Medis',
    icon: 'medical_services',
    cluster: 'CLINICAL',
    fhirResource: 'Procedure',
    codePrefix: '',
    primaryKeyField: 'id',
    codeField: 'kode_icd9',
    nameField: 'nama_tindakan',
    columns: [
      { key: 'kode_icd9', label: 'Kode ICD-9-CM', sortable: true, primary: true },
      { key: 'nama_tindakan', label: 'Nama Tindakan / Prosedur', sortable: true },
      { key: 'kategori', label: 'Kategori Tindakan', sortable: true, format: 'chip' },
      { key: 'estimasi_waktu_menit', label: 'Est. Waktu (Menit)', format: 'number' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  LABORATORY: {
    key: 'LABORATORY',
    table: 'laboratory_tests',
    endpoint: '/api/v1/master/laboratory-tests',
    title: 'Master Laboratorium',
    singular: 'Pemeriksaan Lab',
    icon: 'biotech',
    cluster: 'CLINICAL',
    fhirResource: 'ObservationDefinition',
    codePrefix: 'LAB-',
    primaryKeyField: 'id',
    codeField: 'kode_pemeriksaan',
    nameField: 'nama_pemeriksaan',
    columns: [
      { key: 'kode_pemeriksaan', label: 'Kode Lab', sortable: true, primary: true },
      { key: 'nama_pemeriksaan', label: 'Nama Parameter Pemeriksaan', sortable: true },
      { key: 'kategori', label: 'Kategori Lab', sortable: true, format: 'chip' },
      { key: 'satuan', label: 'Satuan Hasil' },
      { key: 'nilai_rujukan', label: 'Nilai Rujukan Standar' },
      { key: 'tarif', label: 'Tarif Pemeriksaan', format: 'currency', sortable: true },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  RADIOLOGY: {
    key: 'RADIOLOGY',
    table: 'radiology_examinations',
    endpoint: '/api/v1/master/radiology-examinations',
    title: 'Master Radiologi & Imaging',
    singular: 'Eksaminasi Radiologi',
    icon: 'radiology',
    cluster: 'CLINICAL',
    fhirResource: 'ActivityDefinition',
    codePrefix: 'RAD-',
    primaryKeyField: 'id',
    codeField: 'kode_pemeriksaan',
    nameField: 'nama_pemeriksaan',
    columns: [
      { key: 'kode_pemeriksaan', label: 'Kode Rad', sortable: true, primary: true },
      { key: 'nama_pemeriksaan', label: 'Nama Tindakan Radiologi', sortable: true },
      { key: 'modalitas', label: 'Modalitas Alat', sortable: true, format: 'chip' },
      { key: 'persiapan_pasien', label: 'Persiapan Pasien' },
      { key: 'tarif', label: 'Tarif Radiologi', format: 'currency', sortable: true },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  // 💊 FARMASI & LOGISTIK
  MEDICINE: {
    key: 'MEDICINE',
    table: 'medicines',
    endpoint: '/api/v1/master/medicines',
    title: 'Master Obat & Formularium',
    singular: 'Obat & Farmasi',
    icon: 'pill',
    cluster: 'PHARMACY',
    fhirResource: 'Medication',
    codePrefix: 'MED-',
    primaryKeyField: 'id',
    codeField: 'kode_obat',
    nameField: 'nama_obat',
    columns: [
      { key: 'kode_obat', label: 'Kode Obat', sortable: true, primary: true },
      { key: 'nama_obat', label: 'Nama Obat Dagang', sortable: true },
      { key: 'nama_generik', label: 'Nama Generik (Zat Aktif)', sortable: true },
      { key: 'bentuk_sediaan', label: 'Bentuk Sediaan', format: 'chip' },
      { key: 'satuan', label: 'Satuan' },
      { key: 'stok_minimum', label: 'Min. Stok', format: 'number' },
      { key: 'harga', label: 'Harga Satuan', format: 'currency', sortable: true },
      { key: 'is_high_alert', label: 'High-Alert', format: 'danger_tag' },
      { key: 'status', label: 'Status', format: 'status_badge' }
    ]
  },

  MEDICAL_DEVICE: {
    key: 'MEDICAL_DEVICE',
    table: 'medical_devices',
    endpoint: '/api/v1/master/medical-devices',
    title: 'Master Alat Kesehatan (Alkes)',
    singular: 'Alat Kesehatan',
    icon: 'medical_information',
    cluster: 'PHARMACY',
    fhirResource: 'DeviceDefinition',
    codePrefix: 'ALK-',
    primaryKeyField: 'id',
    codeField: 'kode_alkes',
    nameField: 'nama_alkes',
    columns: [
      { key: 'kode_alkes', label: 'Kode Alkes', sortable: true, primary: true },
      { key: 'nama_alkes', label: 'Nama Alkes / Instrumen', sortable: true },
      { key: 'kategori', label: 'Kategori Alkes', sortable: true, format: 'chip' },
      { key: 'stok', label: 'Stok Terdata', format: 'number' },
      { key: 'lokasi', label: 'Lokasi Unit / Ruangan' },
      { key: 'kalibrasi_terakhir', label: 'Tgl Kalibrasi', format: 'date' },
      { key: 'status', label: 'Status Alkes', format: 'status_badge' }
    ]
  },

  // 💳 TARIF, PENJAMIN & RBAC
  TARIFF: {
    key: 'TARIFF',
    table: 'tariffs',
    endpoint: '/api/v1/master/tariffs',
    title: 'Master Tarif Layanan RS',
    singular: 'Tarif Layanan',
    icon: 'payments',
    cluster: 'GOVERNANCE',
    fhirResource: 'ChargeItemDefinition',
    codePrefix: 'TRF-',
    primaryKeyField: 'id',
    codeField: 'kode_tarif',
    nameField: 'nama_tarif',
    columns: [
      { key: 'kode_tarif', label: 'Kode Tarif', sortable: true, primary: true },
      { key: 'nama_tarif', label: 'Nama Layanan / Tarif', sortable: true },
      { key: 'kategori', label: 'Kategori Tarif', sortable: true, format: 'chip' },
      { key: 'kelas', label: 'Kelas Perawatan' },
      { key: 'harga', label: 'Total Tarif (IDR)', format: 'currency', sortable: true },
      { key: 'jasa_dokter', label: 'Jasa Medis', format: 'currency' },
      { key: 'status', label: 'Status Tarif', format: 'status_badge' }
    ]
  },

  GUARANTOR: {
    key: 'GUARANTOR',
    table: 'guarantors',
    endpoint: '/api/v1/master/guarantors',
    title: 'Master Penjamin Biaya',
    singular: 'Penjamin Biaya',
    icon: 'assured_workload',
    cluster: 'GOVERNANCE',
    fhirResource: 'Organization',
    codePrefix: 'GRN-',
    primaryKeyField: 'id',
    codeField: 'kode_penjamin',
    nameField: 'nama_penjamin',
    columns: [
      { key: 'kode_penjamin', label: 'Kode Penjamin', sortable: true, primary: true },
      { key: 'nama_penjamin', label: 'Nama Instansi Penjamin', sortable: true },
      { key: 'jenis', label: 'Jenis Penjamin', sortable: true, format: 'chip' },
      { key: 'pic_kontak', label: 'Kontak PIC' },
      { key: 'status', label: 'Status Kerjasama', format: 'status_badge' }
    ]
  },

  INSURANCE: {
    key: 'INSURANCE',
    table: 'insurances',
    endpoint: '/api/v1/master/insurances',
    title: 'Master Asuransi Kesehatan',
    singular: 'Asuransi',
    icon: 'verified_user',
    cluster: 'GOVERNANCE',
    fhirResource: 'InsurancePlan',
    codePrefix: 'ASR-',
    primaryKeyField: 'id',
    codeField: 'kode_asuransi',
    nameField: 'nama_asuransi',
    columns: [
      { key: 'kode_asuransi', label: 'Kode Asuransi', sortable: true, primary: true },
      { key: 'nama_asuransi', label: 'Nama Perusahaan Asuransi', sortable: true },
      { key: 'nomor_kontrak', label: 'Nomor PKS / Kontrak' },
      { key: 'masa_berlaku', label: 'Masa Berlaku PKS', format: 'date' },
      { key: 'status', label: 'Status PKS', format: 'status_badge' }
    ]
  },

  RBAC: {
    key: 'RBAC',
    table: 'roles',
    endpoint: '/api/v1/master/roles',
    title: 'Master Hak Akses & RBAC',
    singular: 'Role & Izin',
    icon: 'shield_person',
    cluster: 'GOVERNANCE',
    fhirResource: 'AccessControl',
    codePrefix: 'ROLE-',
    primaryKeyField: 'id',
    codeField: 'code',
    nameField: 'name',
    columns: [
      { key: 'code', label: 'Kode Role', sortable: true, primary: true },
      { key: 'name', label: 'Nama Role Jabatan', sortable: true },
      { key: 'department', label: 'Departemen / Unit', format: 'chip' },
      { key: 'description', label: 'Deskripsi Otoritas' },
      { key: 'level', label: 'Tingkat Akses (Tier)' },
      { key: 'status', label: 'Status Role', format: 'status_badge' }
    ]
  }
};

export const MASTER_DATA_CLUSTERS = [
  {
    id: 'PEOPLE',
    label: 'SDM & Pasien',
    icon: 'group',
    color: 'from-blue-600 to-indigo-600',
    entities: ['PATIENT', 'DOCTOR', 'NURSE', 'EMPLOYEE', 'SCHEDULE']
  },
  {
    id: 'FACILITY',
    label: 'Fasilitas & Ruangan',
    icon: 'apartment',
    color: 'from-teal-600 to-emerald-600',
    entities: ['CLINIC', 'ROOM', 'BED']
  },
  {
    id: 'CLINICAL',
    label: 'Klinis & Diagnostik',
    icon: 'health_metrics',
    color: 'from-rose-600 to-pink-600',
    entities: ['DIAGNOSIS', 'PROCEDURE', 'LABORATORY', 'RADIOLOGY']
  },
  {
    id: 'PHARMACY',
    label: 'Farmasi & Logistik',
    icon: 'vaccines',
    color: 'from-amber-600 to-orange-600',
    entities: ['MEDICINE', 'MEDICAL_DEVICE']
  },
  {
    id: 'GOVERNANCE',
    label: 'Tarif & Tata Kelola (RBAC)',
    icon: 'policy',
    color: 'from-purple-600 to-violet-600',
    entities: ['TARIFF', 'GUARANTOR', 'INSURANCE', 'RBAC']
  }
];
