/**
 * ENTERPRISE HOSPITAL INFORMATION SYSTEM (EHIS) 2026
 * Comprehensive Hospital Professions Taxonomy (40+ Categories, 150+ Professions)
 * Reference: JCI SQE Standards, SATUSEHAT Practitioner FHIR R4, Kemenkes RI
 */

export const HOSPITAL_PROFESSION_CATEGORIES = [
  { id: 'DOKTER', label: '=== DOKTER ===', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { id: 'SPESIALIS_KEDOKTERAN', label: '=== SPESIALIS KEDOKTERAN ===', color: 'bg-rose-600/10 text-rose-700 border-rose-600/20' },
  { id: 'DOKTER_GIGI_SPESIALIS', label: '=== DOKTER GIGI SPESIALIS ===', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  { id: 'KEPERAWATAN', label: '=== KEPERAWATAN ===', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { id: 'KEBIDANAN', label: '=== KEBIDANAN ===', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { id: 'FARMASI', label: '=== FARMASI ===', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  { id: 'LABORATORIUM', label: '=== LABORATORIUM ===', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { id: 'RADIOLOGI', label: '=== RADIOLOGI ===', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { id: 'REHABILITASI', label: '=== REHABILITASI ===', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { id: 'GIZI', label: '=== GIZI ===', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'PSIKOLOGI', label: '=== PSIKOLOGI ===', color: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  { id: 'KESEHATAN_MASYARAKAT', label: '=== KESEHATAN MASYARAKAT ===', color: 'bg-lime-500/10 text-lime-600 border-lime-500/20' },
  { id: 'REKAM_MEDIS', label: '=== REKAM MEDIS ===', color: 'bg-[#007399]/10 text-[#007399] border-[#007399]/20' },
  { id: 'ELEKTROMEDIS', label: '=== ELEKTROMEDIS ===', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  { id: 'KESEHATAN_LINGKUNGAN', label: '=== KESEHATAN LINGKUNGAN ===', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { id: 'TRANSFUSI_DARAH', label: '=== TRANSFUSI DARAH ===', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  { id: 'CASE_MANAGEMENT', label: '=== CASE MANAGEMENT ===', color: 'bg-sky-500/10 text-sky-600 border-sky-500/20' },
  { id: 'MANAJEMEN_RS', label: '=== MANAJEMEN RUMAH SAKIT ===', color: 'bg-slate-800/10 text-slate-800 border-slate-800/20' },
  { id: 'ADMINISTRASI', label: '=== ADMINISTRASI ===', color: 'bg-amber-600/10 text-amber-700 border-amber-600/20' },
  { id: 'KEUANGAN', label: '=== KEUANGAN ===', color: 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20' },
  { id: 'SDM', label: '=== SDM ===', color: 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20' },
  { id: 'IT', label: '=== IT ===', color: 'bg-cyan-600/10 text-cyan-700 border-cyan-600/20' },
  { id: 'LEGAL_COMPLIANCE', label: '=== LEGAL & COMPLIANCE ===', color: 'bg-rose-700/10 text-rose-800 border-rose-700/20' },
  { id: 'OPERASIONAL', label: '=== OPERASIONAL ===', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { id: 'LOGISTIK', label: '=== LOGISTIK ===', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { id: 'CSSD', label: '=== CSSD ===', color: 'bg-teal-600/10 text-teal-700 border-teal-600/20' },
  { id: 'GIZI_DAPUR', label: '=== GIZI DAPUR ===', color: 'bg-amber-700/10 text-amber-800 border-amber-700/20' },
  { id: 'HOUSEKEEPING', label: '=== HOUSEKEEPING ===', color: 'bg-[#007399]/10 text-[#007399] border-[#007399]/20' },
  { id: 'KEAMANAN', label: '=== KEAMANAN ===', color: 'bg-slate-700/10 text-slate-800 border-slate-700/20' },
  { id: 'TRANSPORTASI', label: '=== TRANSPORTASI ===', color: 'bg-blue-600/10 text-blue-700 border-blue-600/20' },
  { id: 'PEMASARAN', label: '=== PEMASARAN ===', color: 'bg-purple-600/10 text-purple-700 border-purple-600/20' },
  { id: 'PENELITIAN', label: '=== PENELITIAN ===', color: 'bg-violet-600/10 text-violet-700 border-violet-600/20' },
  { id: 'PENDIDIKAN', label: '=== PENDIDIKAN ===', color: 'bg-sky-600/10 text-sky-700 border-sky-600/20' },
  { id: 'ROHANIAWAN', label: '=== ROHANIAWAN ===', color: 'bg-emerald-700/10 text-emerald-800 border-emerald-700/20' },
  { id: 'RELAWAN', label: '=== RELAWAN ===', color: 'bg-pink-600/10 text-pink-700 border-pink-600/20' }
];

export const HOSPITAL_PROFESSIONS = [
  // === DOKTER ===
  { id: 'prof_dr_umum', title: 'Dokter Umum', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', S.Ked', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Departemen Pelayanan Medis Umum & IGD' },
  { id: 'prof_dr_gigi', title: 'Dokter Gigi', categoryId: 'DOKTER', prefix: 'drg. ', degree: '', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Departemen Kesehatan Gigi & Mulut' },
  { id: 'prof_dr_gigi_spesialis', title: 'Dokter Gigi Spesialis', categoryId: 'DOKTER', prefix: 'drg. ', degree: ', Sp.BM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Bedah Mulut & Maksilofasial' },
  { id: 'prof_dr_spesialis', title: 'Dokter Spesialis', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.PD', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Pelayanan Medis Spesialis' },
  { id: 'prof_dr_subspesialis', title: 'Dokter Subspesialis', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.PD-KGH', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Nefrologi & Dialisis' },
  { id: 'prof_dr_konsultan', title: 'Dokter Konsultan', categoryId: 'DOKTER', prefix: 'Prof. dr. ', degree: ', Sp.A(K)', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Pediatric Critical Care' },
  { id: 'prof_dr_internship', title: 'Dokter Internship', categoryId: 'DOKTER', prefix: 'dr. ', degree: ' (Internship)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Instalasi Gawat Darurat & Rawat Jalan' },
  { id: 'prof_dr_residen', title: 'Dokter Residen', categoryId: 'DOKTER', prefix: 'dr. ', degree: ' (Residen Bedah)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Departemen Bedah Central & Rawat Inap' },
  { id: 'prof_dr_fellowship', title: 'Dokter Fellowship', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.JP (Fellow Intervensi)', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pusat Jantung & Pembuluh Darah' },
  { id: 'prof_dr_tamu', title: 'Dokter Tamu', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.BTKV (Guest Specialist)', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Bedah Toraks & Kardiovaskular' },
  { id: 'prof_dr_visiting', title: 'Dokter Visiting', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.OT (Visiting Senior)', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pusat Ortopedi & Traumatologi' },
  { id: 'prof_dr_on_call', title: 'Dokter On Call', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', Sp.An (On-Call Specialist)', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Anestesiologi & Reanimasi' },
  { id: 'prof_dr_jaga', title: 'Dokter Jaga', categoryId: 'DOKTER', prefix: 'dr. ', degree: ' (Duty Medical Officer)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Duty Medical Shift Room' },
  { id: 'prof_medical_officer', title: 'Medical Officer', categoryId: 'DOKTER', prefix: 'dr. ', degree: ', M.Kes (Medical Officer)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Medical Services & Quality Control' },

  // === SPESIALIS KEDOKTERAN ===
  { id: 'prof_sp_penyakit_dalam', title: 'Spesialis Penyakit Dalam', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.PD', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Penyakit Dalam' },
  { id: 'prof_sp_anak', title: 'Spesialis Anak', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.A', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Kesehatan Anak' },
  { id: 'prof_sp_bedah_umum', title: 'Spesialis Bedah Umum', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.B', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Bedah Umum' },
  { id: 'prof_sp_bedah_digestif', title: 'Spesialis Bedah Digestif', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.B-KBD', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Sub-Spesialis Bedah Digestif' },
  { id: 'prof_sp_bedah_onkologi', title: 'Spesialis Bedah Onkologi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.B(K)Onk', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pusat Kanker & Onkologi Terpadu' },
  { id: 'prof_sp_bedah_plastik', title: 'Spesialis Bedah Plastik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.BP-RE', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Bedah Plastik Rekonstruksi & Estetik' },
  { id: 'prof_sp_bedah_saraf', title: 'Spesialis Bedah Saraf', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.BS', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Neurosurgery / Bedah Saraf' },
  { id: 'prof_sp_bedah_toraks', title: 'Spesialis Bedah Toraks Kardiovaskular', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.BTKV', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Bedah Toraks & Vaskular' },
  { id: 'prof_sp_bedah_urologi', title: 'Spesialis Bedah Urologi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.U', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Urologi & Lithotripsy' },
  { id: 'prof_sp_ortopedi', title: 'Spesialis Ortopedi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.OT', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Departemen Ortopedi & Traumatologi' },
  { id: 'prof_sp_obgyn', title: 'Spesialis Obstetri dan Ginekologi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.OG', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Kebidanan & Kandungan (VK)' },
  { id: 'prof_sp_mata', title: 'Spesialis Mata', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.M', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pusat Kesehatan Mata & LASIK' },
  { id: 'prof_sp_tht', title: 'Spesialis THT-KL', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.T.H.T.B.K.L', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Telinga Hidung Tenggorokan' },
  { id: 'prof_sp_kulit', title: 'Spesialis Kulit dan Kelamin', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.D.V.E', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Dermatologi & Venereologi' },
  { id: 'prof_sp_saraf', title: 'Spesialis Saraf', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.N', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Neurologi / Saraf' },
  { id: 'prof_sp_jantung', title: 'Spesialis Jantung dan Pembuluh Darah', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.JP', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pusat Jantung & Cathlab' },
  { id: 'prof_sp_paru', title: 'Spesialis Paru', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.P', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pulmonologi & Respirasi' },
  { id: 'prof_sp_anestesi', title: 'Spesialis Anestesiologi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.An-TI', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Anestesi & Kamar Operasi' },
  { id: 'prof_sp_radiologi', title: 'Spesialis Radiologi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.Rad', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Radiologi & Diagnostic Imaging' },
  { id: 'prof_sp_patologi_anatomi', title: 'Spesialis Patologi Anatomi', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.PA', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Laboratorium Patologi Anatomi' },
  { id: 'prof_sp_patologi_klinik', title: 'Spesialis Patologi Klinik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.PK', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Laboratorium Sentral & Bank Darah' },
  { id: 'prof_sp_forensik', title: 'Spesialis Kedokteran Forensik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.FM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Kedokteran Forensik & Pemulasaraan Jenazah' },
  { id: 'prof_sp_jiwa', title: 'Spesialis Kedokteran Jiwa', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.KJ', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Psikiatri & Kesehatan Jiwa' },
  { id: 'prof_sp_rehab_medik', title: 'Spesialis Rehabilitasi Medik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.KFR', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Rehabilitasi Medik' },
  { id: 'prof_sp_nuklir', title: 'Spesialis Kedokteran Nuklir', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.KN-TM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Kedokteran Nuklir & Teranostik Molekuler' },
  { id: 'prof_sp_mikrobiologi', title: 'Spesialis Mikrobiologi Klinik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.MK', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Laboratorium Mikrobiologi Klinik' },
  { id: 'prof_sp_gizi_klinik', title: 'Spesialis Gizi Klinik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.GK', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Gizi Klinik & Parenteral' },
  { id: 'prof_sp_farmakologi', title: 'Spesialis Farmakologi Klinik', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.FK', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Komite Farmasi & Terapi RS' },
  { id: 'prof_sp_emergency', title: 'Spesialis Emergency Medicine', categoryId: 'SPESIALIS_KEDOKTERAN', prefix: 'dr. ', degree: ', Sp.EM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Gawat Darurat (IGD)' },

  // === DOKTER GIGI SPESIALIS ===
  { id: 'prof_drg_ortodonti', title: 'Ortodonti', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.Ort', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Spesialis Ortodonti Gigi' },
  { id: 'prof_drg_periodonsia', title: 'Periodonsia', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.Perio', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Spesialis Gusi & Periodonsia' },
  { id: 'prof_drg_prostodonsia', title: 'Prostodonsia', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.Pros', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Spesialis Gigi Tiruan & Prostodonsia' },
  { id: 'prof_drg_konservasi', title: 'Konservasi Gigi', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.KG', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Konservasi & Penambalan Gigi' },
  { id: 'prof_drg_bedah_mulut', title: 'Bedah Mulut', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.BM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Instalasi Bedah Mulut & Maksilofasial' },
  { id: 'prof_drg_penyakit_mulut', title: 'Penyakit Mulut', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.PM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Penyakit Mulut' },
  { id: 'prof_drg_radiologi_gigi', title: 'Radiologi Kedokteran Gigi', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', Sp.RKG', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Radiologi Denta & Panoramic' },
  { id: 'prof_drg_gigi_anak', title: 'Kedokteran Gigi Anak', categoryId: 'DOKTER_GIGI_SPESIALIS', prefix: 'drg. ', degree: ', KGA', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Poliklinik Pedodonti / Gigi Anak' },

  // === KEPERAWATAN ===
  { id: 'prof_perawat', title: 'Perawat', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Departemen Keperawatan Umum' },
  { id: 'prof_perawat_klinik', title: 'Perawat Klinik', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (PK 3)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Poliklinik Rawat Jalan' },
  { id: 'prof_perawat_pelaksana', title: 'Perawat Pelaksana', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', A.Md.Kep', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Rawat Inap Ruang VVIP & VIP' },
  { id: 'prof_perawat_primer', title: 'Perawat Primer', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Asuhan Keperawatan Primary' },
  { id: 'prof_perawat_associate', title: 'Perawat Associate', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', A.Md.Kep', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Tim Keperawatan Shift' },
  { id: 'prof_perawat_pj', title: 'Perawat Penanggung Jawab', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (PJ Shift)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Penanggung Jawab Shift Keperawatan' },
  { id: 'prof_perawat_koordinator', title: 'Perawat Koordinator', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Koor)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Koordinator Pelayanan Keperawatan' },
  { id: 'prof_kepala_ruangan', title: 'Kepala Ruangan', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', M.Kep (Karu)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Kepala Ruangan Keperawatan' },
  { id: 'prof_supervisor_keperawatan', title: 'Supervisor Keperawatan', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', M.Kep (Supervisor)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Supervisor Keperawatan On-Duty' },
  { id: 'prof_manajer_keperawatan', title: 'Manajer Keperawatan', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', M.Kep (Manager)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Bidang Keperawatan RS' },
  { id: 'prof_direktur_keperawatan', title: 'Direktur Keperawatan', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', M.Kep, Sp.Kep.MB', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Direktorat Keperawatan RS' },
  { id: 'prof_perawat_icu', title: 'Perawat ICU', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Certified ICU)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Intensive Care Unit (ICU)' },
  { id: 'prof_perawat_nicu', title: 'Perawat NICU', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Certified NICU)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Neonatal Intensive Care Unit (NICU)' },
  { id: 'prof_perawat_picu', title: 'Perawat PICU', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Certified PICU)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Pediatric Intensive Care Unit (PICU)' },
  { id: 'prof_perawat_hcu', title: 'Perawat HCU', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (HCU Specialist)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'High Dependency Unit (HCU)' },
  { id: 'prof_perawat_igd', title: 'Perawat IGD', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Certified Triage)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Instalasi Gawat Darurat & Triage' },
  { id: 'prof_perawat_bedah', title: 'Perawat Bedah', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Scrub Nurse)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Instalasi Bedah Sentral (IBS)' },
  { id: 'prof_perawat_hemodialisa', title: 'Perawat Hemodialisa', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Certified HD)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Instalasi Hemodialisa' },
  { id: 'prof_perawat_anestesi', title: 'Perawat Anestesi', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Penata Anestesi)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Penata Anestesi Kamar Bedah' },
  { id: 'prof_perawat_kamar_operasi', title: 'Perawat Kamar Operasi', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Circulating Nurse)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Kamar Operasi / OK' },
  { id: 'prof_perawat_luka', title: 'Perawat Luka', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', CWCCA (Wound Care)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Wound Care & Diabetic Clinic' },
  { id: 'prof_perawat_onkologi', title: 'Perawat Onkologi', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Chemo Nurse)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Pusat Kemoterapi & Onkologi' },
  { id: 'prof_perawat_jiwa', title: 'Perawat Jiwa', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', Sp.Kep.Jiwa', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Bangsal Keperawatan Psikiatri' },
  { id: 'prof_perawat_komunitas', title: 'Perawat Komunitas', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', Sp.Kep.Kom', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Keperawatan Kesehatan Masyarakat' },
  { id: 'prof_perawat_home_care', title: 'Perawat Home Care', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Homecare Specialist)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Layanan Home Care RS' },
  { id: 'prof_perawat_paliatif', title: 'Perawat Paliatif', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Palliative Specialist)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Unit Perawatan Paliatif' },
  { id: 'prof_perawat_gigi', title: 'Perawat Gigi', categoryId: 'KEPERAWATAN', prefix: '', degree: ', A.Md.Kes.Gi', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Terapis Gigi & Mulut' },
  { id: 'prof_perawat_dialisis', title: 'Perawat Dialisis', categoryId: 'KEPERAWATAN', prefix: 'Ns. ', degree: ', S.Kep (Dialysis Nurse)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Unit Dialisis & CAPD' },

  // === KEBIDANAN ===
  { id: 'prof_bidan', title: 'Bidan', categoryId: 'KEBIDANAN', prefix: 'Bdn. ', degree: ', S.Tr.Keb', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Instalasi Kebidanan & VK' },
  { id: 'prof_bidan_klinik', title: 'Bidan Klinik', categoryId: 'KEBIDANAN', prefix: 'Bdn. ', degree: ', Bd (Bidan Klinik)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Poliklinik ANC / KIA' },
  { id: 'prof_bidan_koordinator', title: 'Bidan Koordinator', categoryId: 'KEBIDANAN', prefix: 'Bdn. ', degree: ', M.Keb (Koor)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Koordinator Pelayanan Kebidanan' },
  { id: 'prof_bidan_persalinan', title: 'Bidan Persalinan', categoryId: 'KEBIDANAN', prefix: 'Bdn. ', degree: ', S.ST (Kamar Bersalin)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Ruang Bersalin / Delivery Room' },
  { id: 'prof_bidan_komunitas', title: 'Bidan Komunitas', categoryId: 'KEBIDANAN', prefix: 'Bdn. ', degree: ', S.Keb', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Layanan Kebidanan Komunitas' },

  // === FARMASI ===
  { id: 'prof_apoteker', title: 'Apoteker', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm', roleKey: 'PHARMACIST_SUPERVISOR', isMedical: true, dept: 'Instalasi Farmasi RS' },
  { id: 'prof_apoteker_klinis', title: 'Apoteker Klinis', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', M.Farm.Klin', roleKey: 'PHARMACIST_SUPERVISOR', isMedical: true, dept: 'Farmasi Klinis & Visite Ward' },
  { id: 'prof_apoteker_pj', title: 'Apoteker Penanggung Jawab', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm (APJ)', roleKey: 'PHARMACIST_SUPERVISOR', isMedical: true, dept: 'Penanggung Jawab Depo Utama' },
  { id: 'prof_apoteker_gudang', title: 'Apoteker Gudang', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm (Gudang)', roleKey: 'PHARMACIST_SUPERVISOR', isMedical: true, dept: 'Gudang Farmasi Sentral' },
  { id: 'prof_apoteker_produksi', title: 'Apoteker Produksi', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm (Produksi)', roleKey: 'PHARMACIST_SUPERVISOR', isMedical: true, dept: 'Laboratorium Produksi & Aseptik Compounding' },
  { id: 'prof_apoteker_rawat_jalan', title: 'Apoteker Rawat Jalan', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm', roleKey: 'PHARMACIST_STAFF', isMedical: true, dept: 'Depo Farmasi Rawat Jalan' },
  { id: 'prof_apoteker_rawat_inap', title: 'Apoteker Rawat Inap', categoryId: 'FARMASI', prefix: 'Apt. ', degree: ', S.Farm', roleKey: 'PHARMACIST_STAFF', isMedical: true, dept: 'Depo Farmasi Rawat Inap' },
  { id: 'prof_ttk', title: 'Tenaga Teknis Kefarmasian', categoryId: 'FARMASI', prefix: '', degree: ', A.Md.Farm', roleKey: 'PHARMACIST_STAFF', isMedical: true, dept: 'Pelayanan Resep & Dispensing Obat' },
  { id: 'prof_asisten_apoteker', title: 'Asisten Apoteker', categoryId: 'FARMASI', prefix: '', degree: ', A.Md.Farm', roleKey: 'PHARMACIST_STAFF', isMedical: true, dept: 'Depo Farmasi IGD & ODS' },

  // === LABORATORIUM ===
  { id: 'prof_atlm', title: 'Ahli Teknologi Laboratorium Medik', categoryId: 'LABORATORIUM', prefix: '', degree: ', S.Tr.Kes (ATLM)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Laboratorium Patologi Klinik' },
  { id: 'prof_analis_lab', title: 'Analis Laboratorium', categoryId: 'LABORATORIUM', prefix: '', degree: ', A.Md.AK', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Pemeriksaan Darah & Hematologi' },
  { id: 'prof_mikrobiolog', title: 'Mikrobiolog', categoryId: 'LABORATORIUM', prefix: '', degree: ', M.Si (Mikrobiologi)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Laboratorium Mikrobiologi & PCR' },
  { id: 'prof_patolog', title: 'Patolog', categoryId: 'LABORATORIUM', prefix: 'dr. ', degree: ', Sp.PK', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Penanggung Jawab Laboratorium' },
  { id: 'prof_teknisi_lab', title: 'Teknisi Laboratorium', categoryId: 'LABORATORIUM', prefix: '', degree: ', A.Md.Lab', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Maintenance Reagen & Alkes Lab' },
  { id: 'prof_phlebotomist', title: 'Phlebotomist', categoryId: 'LABORATORIUM', prefix: '', degree: ', A.Md.AK (Phlebotomist)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Sampling Darah & Flebotomi Pasien' },

  // === RADIOLOGI ===
  { id: 'prof_radiografer', title: 'Radiografer', categoryId: 'RADIOLOGI', prefix: '', degree: ', A.Md.Rad', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Instalasi Radiologi' },
  { id: 'prof_sonografer', title: 'Sonografer', categoryId: 'RADIOLOGI', prefix: '', degree: ', S.ST (Sonografer USG)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Pemeriksaan Ultrasonografi (USG)' },
  { id: 'prof_teknisi_ct_scan', title: 'Teknisi CT Scan', categoryId: 'RADIOLOGI', prefix: '', degree: ', S.ST.Rad (CT Specialist)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Unit Multi-Slice CT Scan' },
  { id: 'prof_teknisi_mri', title: 'Teknisi MRI', categoryId: 'RADIOLOGI', prefix: '', degree: ', S.ST.Rad (MRI Specialist)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Unit Magnetic Resonance Imaging (MRI)' },
  { id: 'prof_teknisi_radioterapi', title: 'Teknisi Radioterapi', categoryId: 'RADIOLOGI', prefix: '', degree: ', S.ST.Rad (Radioterapi)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Pusat Akselerator Linear (Linac)' },
  { id: 'prof_radiation_therapist', title: 'Radiation Therapist', categoryId: 'RADIOLOGI', prefix: '', degree: ', B.Sc (Radiation Therapy)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Layanan Brakiterapi & Onkologi Radiasi' },

  // === REHABILITASI ===
  { id: 'prof_fisioterapis', title: 'Fisioterapis', categoryId: 'REHABILITASI', prefix: '', degree: ', S.Ft, Ftr', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Instalasi Fisioterapi & Gym Rehab' },
  { id: 'prof_okupasi_terapis', title: 'Okupasi Terapis', categoryId: 'REHABILITASI', prefix: '', degree: ', A.Md.OT', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Klinik Terapi Okupasi Pediatrik' },
  { id: 'prof_terapis_wicara', title: 'Terapis Wicara', categoryId: 'REHABILITASI', prefix: '', degree: ', A.Md.TW', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Terapi Wicara & Disfagia' },
  { id: 'prof_ortotis_prostetis', title: 'Ortotis Prostetis', categoryId: 'REHABILITASI', prefix: '', degree: ', A.Md.OP', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Bengkel Alat Orthotik Prosthetik' },

  // === GIZI ===
  { id: 'prof_ahli_gizi', title: 'Ahli Gizi', categoryId: 'GIZI', prefix: '', degree: ', S.Gz', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Instalasi Gizi RS' },
  { id: 'prof_nutrisionis', title: 'Nutrisionis', categoryId: 'GIZI', prefix: '', degree: ', A.Md.Gz', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Konsultasi Gizi Outpatient' },
  { id: 'prof_dietisien', title: 'Dietisien', categoryId: 'GIZI', prefix: '', degree: ', S.Gz, RD (Registered Dietitian)', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Asuhan Dietetik Pasien Inpatient' },

  // === PSIKOLOGI ===
  { id: 'prof_psikolog_klinis', title: 'Psikolog Klinis', categoryId: 'PSIKOLOGI', prefix: '', degree: ', M.Psi, Psikolog', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Poliklinik Psikologi Klinis' },
  { id: 'prof_psikolog', title: 'Psikolog', categoryId: 'PSIKOLOGI', prefix: '', degree: ', M.Psi', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Layanan Konseling & Psikotes' },
  { id: 'prof_konselor', title: 'Konselor', categoryId: 'PSIKOLOGI', prefix: '', degree: ', S.Psi', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Konseling Adiksi & VCT HIV' },

  // === KESEHATAN MASYARAKAT ===
  { id: 'prof_epidemiolog', title: 'Epidemiolog', categoryId: 'KESEHATAN_MASYARAKAT', prefix: '', degree: ', S.KM (Epidemiologi)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Tim Pencegahan Infeksi (PPI RS)' },
  { id: 'prof_promotor_kesehatan', title: 'Promotor Kesehatan', categoryId: 'KESEHATAN_MASYARAKAT', prefix: '', degree: ', S.KM (PKRS)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Instalasi Promosi Kesehatan RS (PKRS)' },
  { id: 'prof_sanitarian_kesmas', title: 'Sanitarian', categoryId: 'KESEHATAN_MASYARAKAT', prefix: '', degree: ', S.ST (Sanitarian)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Kesehatan Lingkungan & IPAL RS' },
  { id: 'prof_entomolog', title: 'Entomolog Kesehatan', categoryId: 'KESEHATAN_MASYARAKAT', prefix: '', degree: ', S.KM', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Vektor & Pest Control RS' },

  // === REKAM MEDIS ===
  { id: 'prof_perekam_medis', title: 'Perekam Medis', categoryId: 'REKAM_MEDIS', prefix: '', degree: ', A.Md.PK', roleKey: 'ADMIN_OFFICER', isMedical: true, dept: 'Unit Filing & Storage Rekam Medis' },
  { id: 'prof_him', title: 'Health Information Manager', categoryId: 'REKAM_MEDIS', prefix: '', degree: ', S.ST.RMIK', roleKey: 'ADMIN_OFFICER', isMedical: true, dept: 'Departemen Health Information Management' },
  { id: 'prof_medical_coder', title: 'Medical Coder', categoryId: 'REKAM_MEDIS', prefix: '', degree: ', A.Md.PK (Coder ICD-10)', roleKey: 'ADMIN_OFFICER', isMedical: true, dept: 'Unit Koding & Klaim BPJS INA-CBGs' },
  { id: 'prof_cds', title: 'Clinical Documentation Specialist', categoryId: 'REKAM_MEDIS', prefix: '', degree: ', S.ST.RMIK (CDI)', roleKey: 'ADMIN_OFFICER', isMedical: true, dept: 'Auditing Rekam Medis & CPPT' },

  // === ELEKTROMEDIS ===
  { id: 'prof_teknisi_elektromedis', title: 'Teknisi Elektromedis', categoryId: 'ELEKTROMEDIS', prefix: '', degree: ', A.Md.TEM', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Instalasi Pemeliharaan Sarana RS (IPSRS)' },
  { id: 'prof_biomedical_engineer', title: 'Biomedical Engineer', categoryId: 'ELEKTROMEDIS', prefix: '', degree: ', S.T. (Biomedical)', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Kalibrasi & Quality Control Alkes' },
  { id: 'prof_clinical_engineer', title: 'Clinical Engineer', categoryId: 'ELEKTROMEDIS', prefix: '', degree: ', S.T. (Clinical Eng)', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Manajemen Alkes High-Tech' },

  // === KESEHATAN LINGKUNGAN ===
  { id: 'prof_sanitarian_env', title: 'Sanitarian', categoryId: 'KESEHATAN_LINGKUNGAN', prefix: '', degree: ', A.Md.KL', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Sanitasi & Pengolahan Air Bersih' },
  { id: 'prof_petugas_cssd', title: 'Petugas Sterilisasi CSSD', categoryId: 'KESEHATAN_LINGKUNGAN', prefix: '', degree: ', A.Md.Kes', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Central Sterile Supply Department (CSSD)' },
  { id: 'prof_petugas_limbah', title: 'Petugas Limbah Medis', categoryId: 'KESEHATAN_LINGKUNGAN', prefix: '', degree: '', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pengelolaan B3 & Limbah Infeksius' },

  // === TRANSFUSI DARAH ===
  { id: 'prof_petugas_bank_darah', title: 'Petugas Bank Darah', categoryId: 'TRANSFUSI_DARAH', prefix: '', degree: ', A.Md.AK', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Bank Darah Rumah Sakit (BDRS)' },
  { id: 'prof_teknolog_transfusi', title: 'Teknolog Transfusi Darah', categoryId: 'TRANSFUSI_DARAH', prefix: '', degree: ', A.Md.PTD', roleKey: 'LAB_RADIOLOGY_TECH', isMedical: true, dept: 'Skrining & Uji Silang Serasi Darah' },

  // === CASE MANAGEMENT ===
  { id: 'prof_case_manager', title: 'Case Manager', categoryId: 'CASE_MANAGEMENT', prefix: 'Ns. ', degree: ', S.Kep, MPP', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Manajer Pelayanan Pasien (MPP)' },
  { id: 'prof_patient_navigator', title: 'Patient Navigator', categoryId: 'CASE_MANAGEMENT', prefix: '', degree: ', S.KM', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pusat Navigasi Pasien Kanker & Chronic' },
  { id: 'prof_discharge_planner', title: 'Discharge Planner', categoryId: 'CASE_MANAGEMENT', prefix: 'Ns. ', degree: ', S.Kep', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Perencanaan Pemulangan Pasien (Discharge)' },

  // === MANAJEMEN RUMAH SAKIT ===
  { id: 'prof_dirut', title: 'Direktur Utama', categoryId: 'MANAJEMEN_RS', prefix: 'dr. ', degree: ', MARS, MH', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Direksi & Board of Directors' },
  { id: 'prof_dir_yanmed', title: 'Direktur Pelayanan Medis', categoryId: 'MANAJEMEN_RS', prefix: 'dr. ', degree: ', Sp.An, KIC, MARS', roleKey: 'SUPER_ADMIN', isMedical: true, dept: 'Direktorat Pelayanan Medis' },
  { id: 'prof_dir_keperawatan', title: 'Direktur Keperawatan', categoryId: 'MANAJEMEN_RS', prefix: 'Ns. ', degree: ', M.Kep, Sp.Kep.MB', roleKey: 'SUPER_ADMIN', isMedical: true, dept: 'Direktorat Keperawatan' },
  { id: 'prof_dir_sdm', title: 'Direktur SDM', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.H., M.M.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Direktorat Sumber Daya Manusia' },
  { id: 'prof_dir_operasional', title: 'Direktur Operasional', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.T., M.M.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Direktorat Operasional & Umum' },
  { id: 'prof_dir_keuangan', title: 'Direktur Keuangan', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.E., Ak., M.B.A.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Direktorat Keuangan & Akuntansi' },
  { id: 'prof_dir_penunjang', title: 'Direktur Penunjang', categoryId: 'MANAJEMEN_RS', prefix: 'dr. ', degree: ', Sp.PK, MARS', roleKey: 'SUPER_ADMIN', isMedical: true, dept: 'Direktorat Penunjang Medis' },
  { id: 'prof_manager', title: 'Manager', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', M.M.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Manajemen Departemen RS' },
  { id: 'prof_assistant_manager', title: 'Assistant Manager', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.E.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Asisten Manajer Departemen' },
  { id: 'prof_supervisor_mgt', title: 'Supervisor', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.T.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Supervisor Operasional' },
  { id: 'prof_koordinator_mgt', title: 'Koordinator', categoryId: 'MANAJEMEN_RS', prefix: '', degree: ', S.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Koordinator Unit Kerja' },

  // === ADMINISTRASI ===
  { id: 'prof_petugas_registrasi', title: 'Petugas Registrasi', categoryId: 'ADMINISTRASI', prefix: '', degree: ', A.Md.PK', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pendaftaran Pasien Outpatient & Inpatient' },
  { id: 'prof_admission_officer', title: 'Admission Officer', categoryId: 'ADMINISTRASI', prefix: '', degree: ', S.I.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Customer Admission & Bed Allocation' },
  { id: 'prof_customer_service', title: 'Customer Service', categoryId: 'ADMINISTRASI', prefix: '', degree: ', S.I.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Layanan Pengaduan & Informasi Pasien' },
  { id: 'prof_call_center', title: 'Call Center', categoryId: 'ADMINISTRASI', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pusat Panggilan Emergency 24/7' },
  { id: 'prof_kasir', title: 'Kasir', categoryId: 'ADMINISTRASI', prefix: '', degree: ', A.Md.Ak', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Kasir Rawat Jalan & Rawat Inap' },
  { id: 'prof_billing_officer', title: 'Billing Officer', categoryId: 'ADMINISTRASI', prefix: '', degree: ', S.E.', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Departemen Billing & Perhitungan Tarif' },
  { id: 'prof_verifikator', title: 'Verifikator', categoryId: 'ADMINISTRASI', prefix: '', degree: ', S.E.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Verifikasi Berkas Klaim Asuransi' },
  { id: 'prof_medical_secretary', title: 'Medical Secretary', categoryId: 'ADMINISTRASI', prefix: '', degree: ', A.Md.Sek', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Sekretariat Komite Medis' },
  { id: 'prof_sekretaris_direksi', title: 'Sekretaris Direksi', categoryId: 'ADMINISTRASI', prefix: '', degree: ', S.I.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Sekretariat Direksi Utama' },
  { id: 'prof_resepsionis', title: 'Resepsionis', categoryId: 'ADMINISTRASI', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Lobi Utama & Information Desk' },

  // === KEUANGAN ===
  { id: 'prof_akuntan', title: 'Akuntan', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E., Ak., CA', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Akuntansi & Laporan Keuangan RS' },
  { id: 'prof_finance_officer', title: 'Finance Officer', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E.', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Departemen Finance & Cash Flow' },
  { id: 'prof_internal_auditor_fin', title: 'Internal Auditor', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E., CFE', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Satuan Pemeriksaan Internal (SPI)' },
  { id: 'prof_pajak', title: 'Pajak', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E., BKP', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Perpajakan RS (PPh / PPN)' },
  { id: 'prof_treasury', title: 'Treasury', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E.', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Pengelolaan Kas & Rekening Bank RS' },
  { id: 'prof_procurement', title: 'Procurement', categoryId: 'KEUANGAN', prefix: '', degree: ', S.E.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pengadaan Barang & Jasa (Procurement)' },

  // === SDM ===
  { id: 'prof_hr_manager', title: 'HR Manager', categoryId: 'SDM', prefix: '', degree: ', S.Psi, M.M.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Manajemen Sumber Daya Manusia (HRD)' },
  { id: 'prof_hr_officer', title: 'HR Officer', categoryId: 'SDM', prefix: '', degree: ', S.Psi', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Administrasi Personalia & Kontrak' },
  { id: 'prof_recruiter', title: 'Recruiter', categoryId: 'SDM', prefix: '', degree: ', S.Psi', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Rekrutmen Staf Medis & Non-Medis' },
  { id: 'prof_training_officer', title: 'Training Officer', categoryId: 'SDM', prefix: '', degree: ', S.Pd', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pendidikan & Pelatihan Staf (Diklat)' },
  { id: 'prof_payroll_officer', title: 'Payroll Officer', categoryId: 'SDM', prefix: '', degree: ', S.E.', roleKey: 'BILLING_OFFICER', isMedical: false, dept: 'Penggajian Karyawan & Remunerasi' },

  // === IT ===
  { id: 'prof_cio', title: 'Chief Information Officer', categoryId: 'IT', prefix: '', degree: ', S.Kom, M.T.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Direktorat Teknologi Informasi & SIMRS' },
  { id: 'prof_it_manager', title: 'IT Manager', categoryId: 'IT', prefix: '', degree: ', S.Kom, M.M.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Divisi System Development & Infrastructure' },
  { id: 'prof_system_analyst', title: 'System Analyst', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Analisa Sistem Rekam Medis EHIS' },
  { id: 'prof_software_engineer', title: 'Software Engineer', categoryId: 'IT', prefix: '', degree: ', S.T.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Software Development & Architecture' },
  { id: 'prof_backend_dev', title: 'Backend Developer', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Firebase & Cloud Functions API' },
  { id: 'prof_frontend_dev', title: 'Frontend Developer', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'React EHIS User Interface' },
  { id: 'prof_fullstack_dev', title: 'Full Stack Developer', categoryId: 'IT', prefix: '', degree: ', S.T.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Full Stack Web Applications' },
  { id: 'prof_mobile_dev', title: 'Mobile Developer', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Aplikasi Mobile Pasien & Dokter' },
  { id: 'prof_devops', title: 'DevOps Engineer', categoryId: 'IT', prefix: '', degree: ', S.T.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'CI/CD Pipeline & Server Operations' },
  { id: 'prof_cloud_engineer', title: 'Cloud Engineer', categoryId: 'IT', prefix: '', degree: ', S.T.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Cloud Infrastructure & Database' },
  { id: 'prof_dba', title: 'Database Administrator', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Firestore & SQL Database Security' },
  { id: 'prof_network_engineer', title: 'Network Engineer', categoryId: 'IT', prefix: '', degree: ', S.T. (CCNA)', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Jaringan Fiber Optic & WiFi RS' },
  { id: 'prof_cyber_security', title: 'Cyber Security', categoryId: 'IT', prefix: '', degree: ', S.Kom, CEH', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Keamanan Data Pasien & Enkripsi' },
  { id: 'prof_it_support', title: 'IT Support', categoryId: 'IT', prefix: '', degree: ', A.Md.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Dukungan Teknis Komputer & Printer RS' },
  { id: 'prof_helpdesk', title: 'Helpdesk', categoryId: 'IT', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Layanan Pengaduan IT SIMRS' },
  { id: 'prof_ui_ux', title: 'UI UX Designer', categoryId: 'IT', prefix: '', degree: ', S.Ds.', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Desain Antarmuka EHIS & Mobile' },
  { id: 'prof_qa_engineer', title: 'QA Engineer', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Pengujian Mutu Perangkat Lunak' },
  { id: 'prof_ai_engineer', title: 'AI Engineer', categoryId: 'IT', prefix: '', degree: ', M.T. (AI)', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Kecerdasan Buatan & Diagnostik AI' },
  { id: 'prof_data_engineer', title: 'Data Engineer', categoryId: 'IT', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Pipeline Data Big Data Kesehatan' },
  { id: 'prof_data_analyst', title: 'Data Analyst', categoryId: 'IT', prefix: '', degree: ', S.Stat', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Analisis Data Epidemiologi & Billing' },
  { id: 'prof_bi_analyst', title: 'Business Intelligence Analyst', categoryId: 'IT', prefix: '', degree: ', S.E., S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Executive Dashboard & Analytics' },

  // === LEGAL & COMPLIANCE ===
  { id: 'prof_legal_officer', title: 'Legal Officer', categoryId: 'LEGAL_COMPLIANCE', prefix: '', degree: ', S.H., M.H.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Divisi Hukum RS & Medikolegal' },
  { id: 'prof_compliance_officer', title: 'Compliance Officer', categoryId: 'LEGAL_COMPLIANCE', prefix: '', degree: ', S.H.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Audit Regulasi Kemenkes & JCI' },
  { id: 'prof_risk_manager', title: 'Risk Manager', categoryId: 'LEGAL_COMPLIANCE', prefix: '', degree: ', S.KM, MARS', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Manajemen Risiko Fasilitas & Klinis' },
  { id: 'prof_quality_manager', title: 'Quality Manager', categoryId: 'LEGAL_COMPLIANCE', prefix: 'dr. ', degree: ', MARS (KMKP)', roleKey: 'SUPER_ADMIN', isMedical: true, dept: 'Komite Mutu & Keselamatan Pasien' },
  { id: 'prof_patient_safety', title: 'Patient Safety Officer', categoryId: 'LEGAL_COMPLIANCE', prefix: 'Ns. ', degree: ', S.Kep (Patient Safety)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Sub-Komite Keselamatan Pasien' },
  { id: 'prof_ipcn', title: 'Infection Prevention Control Nurse', categoryId: 'LEGAL_COMPLIANCE', prefix: 'Ns. ', degree: ', S.Kep (IPCN)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Pencegahan & Pengendalian Infeksi (PPI)' },
  { id: 'prof_internal_auditor_legal', title: 'Internal Auditor', categoryId: 'LEGAL_COMPLIANCE', prefix: '', degree: ', S.E., Ak.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Satuan Pengawas Internal (SPI)' },

  // === OPERASIONAL ===
  { id: 'prof_facility_manager', title: 'Facility Manager', categoryId: 'OPERASIONAL', prefix: '', degree: ', S.T.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Manajemen Fasilitas & Keselamatan (MFK)' },
  { id: 'prof_engineering_manager', title: 'Engineering Manager', categoryId: 'OPERASIONAL', prefix: '', degree: ', S.T.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Departemen Teknik Sarana & Prasarana' },
  { id: 'prof_teknisi_listrik', title: 'Teknisi Listrik', categoryId: 'OPERASIONAL', prefix: '', degree: ', A.Md.T', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pemeliharaan Kelistrikan & Transformer' },
  { id: 'prof_teknisi_hvac', title: 'Teknisi HVAC', categoryId: 'OPERASIONAL', prefix: '', degree: ', A.Md.T', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Air Conditioning & Negative Pressure OK' },
  { id: 'prof_teknisi_plumbing', title: 'Teknisi Plumbing', categoryId: 'OPERASIONAL', prefix: '', degree: '', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Perpipaan Air & Gas Medis' },
  { id: 'prof_teknisi_gedung', title: 'Teknisi Gedung', categoryId: 'OPERASIONAL', prefix: '', degree: '', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pemeliharaan Bangunan & Sipil' },
  { id: 'prof_teknisi_genset', title: 'Teknisi Genset', categoryId: 'OPERASIONAL', prefix: '', degree: '', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Power Supply Back-up & Generator' },

  // === LOGISTIK ===
  { id: 'prof_warehouse_officer', title: 'Warehouse Officer', categoryId: 'LOGISTIK', prefix: '', degree: ', S.T.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Gudang Logistik Umum & BMHP' },
  { id: 'prof_inventory_officer', title: 'Inventory Officer', categoryId: 'LOGISTIK', prefix: '', degree: ', S.E.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pengendalian Stok & Stok Opname' },
  { id: 'prof_purchasing_officer', title: 'Purchasing Officer', categoryId: 'LOGISTIK', prefix: '', degree: ', S.E.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Pembelian Alkes & Barang Konsumsi' },
  { id: 'prof_supply_chain', title: 'Supply Chain Officer', categoryId: 'LOGISTIK', prefix: '', degree: ', S.T.', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Rantai Pasok & Logistik RS' },

  // === CSSD ===
  { id: 'prof_cssd_technician', title: 'CSSD Technician', categoryId: 'CSSD', prefix: '', degree: ', A.Md.Kes', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Sterilisasi Alat Operasi Autoclave' },
  { id: 'prof_sterilization_tech', title: 'Sterilization Technician', categoryId: 'CSSD', prefix: '', degree: '', roleKey: 'LOGISTICS_ADMIN', isMedical: false, dept: 'Dekontaminasi & Packing Instrument' },

  // === GIZI DAPUR ===
  { id: 'prof_kepala_instalasi_gizi', title: 'Kepala Instalasi Gizi', categoryId: 'GIZI_DAPUR', prefix: '', degree: ', S.Gz, RD', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Instalasi Pelayanan Gizi RS' },
  { id: 'prof_juru_masak', title: 'Juru Masak', categoryId: 'GIZI_DAPUR', prefix: '', degree: ' (Chef RS)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Dapur Pengolahan Makanan Pasien' },
  { id: 'prof_food_service', title: 'Food Service Officer', categoryId: 'GIZI_DAPUR', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Distribusi Makanan Bangsal' },

  // === HOUSEKEEPING ===
  { id: 'prof_housekeeping', title: 'Housekeeping', categoryId: 'HOUSEKEEPING', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Sanitasi Kebersihan Ruangan RS' },
  { id: 'prof_cleaning_service', title: 'Cleaning Service', categoryId: 'HOUSEKEEPING', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Kebersihan Poliklinik & Lobi' },
  { id: 'prof_laundry', title: 'Laundry', categoryId: 'HOUSEKEEPING', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pencucian & Desinfeksi Linen RS' },
  { id: 'prof_linen_officer', title: 'Linen Officer', categoryId: 'HOUSEKEEPING', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pengelolaan & Distribusi Linen Inpatient' },

  // === KEAMANAN ===
  { id: 'prof_security', title: 'Security', categoryId: 'KEAMANAN', prefix: '', degree: ' (Gada Pratama)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Satuan Pengamanan RS' },
  { id: 'prof_chief_security', title: 'Chief Security', categoryId: 'KEAMANAN', prefix: '', degree: ' (Gada Utama)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Komandan Pos Pengamanan RS' },
  { id: 'prof_parking_officer', title: 'Parking Officer', categoryId: 'KEAMANAN', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pengelolaan Parkir & Valet RS' },

  // === TRANSPORTASI ===
  { id: 'prof_supir_ambulans', title: 'Supir Ambulans', categoryId: 'TRANSPORTASI', prefix: '', degree: ' (Certified Driver)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Armada Ambulans Emergency & Transport' },
  { id: 'prof_paramedis_ambulans', title: 'Paramedis Ambulans', categoryId: 'TRANSPORTASI', prefix: 'Ns. ', degree: ', S.Kep (BTCLS)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Tim Medis Ambulans Gawat Darurat' },
  { id: 'prof_kurir_medis', title: 'Kurir Medis', categoryId: 'TRANSPORTASI', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pengiriman Spesimen Lab & Darah' },
  { id: 'prof_logistic_driver', title: 'Logistic Driver', categoryId: 'TRANSPORTASI', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pengangkutan Alkes & Farmasi' },

  // === PEMASARAN ===
  { id: 'prof_marketing_officer', title: 'Marketing Officer', categoryId: 'PEMASARAN', prefix: '', degree: ', S.I.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pemasaran & Kerjasama Asuransi' },
  { id: 'prof_corporate_relation', title: 'Corporate Relation', categoryId: 'PEMASARAN', prefix: '', degree: ', S.H.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Hubungan Kerjasama Perusahaan' },
  { id: 'prof_public_relation', title: 'Public Relation', categoryId: 'PEMASARAN', prefix: '', degree: ', S.I.Kom (Humas)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Humas & Komunikasi Publik RS' },
  { id: 'prof_digital_marketing', title: 'Digital Marketing', categoryId: 'PEMASARAN', prefix: '', degree: ', S.Kom', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Pemasaran Digital & Social Media' },
  { id: 'prof_content_creator', title: 'Content Creator', categoryId: 'PEMASARAN', prefix: '', degree: ', S.Ds.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Produksi Konten Edukasi Kesehatan' },
  { id: 'prof_graphic_designer', title: 'Graphic Designer', categoryId: 'PEMASARAN', prefix: '', degree: ', S.Ds.', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Desain Grafis & Banner Promosi' },
  { id: 'prof_videographer', title: 'Videographer', categoryId: 'PEMASARAN', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Dokumentasi Video Prosedur Medis' },
  { id: 'prof_photographer', title: 'Photographer', categoryId: 'PEMASARAN', prefix: '', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Dokumentasi Acara & Fasilitas RS' },

  // === PENELITIAN ===
  { id: 'prof_clinical_research_coordinator', title: 'Clinical Research Coordinator', categoryId: 'PENELITIAN', prefix: 'dr. ', degree: ', M.Sc (CRC)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Pusat Uji Klinis & Riset RS' },
  { id: 'prof_research_nurse', title: 'Research Nurse', categoryId: 'PENELITIAN', prefix: 'Ns. ', degree: ', S.Kep (GCP)', roleKey: 'STAFF_NURSE', isMedical: true, dept: 'Perawat Peneliti Uji Klinis Obat' },
  { id: 'prof_research_assistant', title: 'Research Assistant', categoryId: 'PENELITIAN', prefix: '', degree: ', S.Si', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Asisten Penelitian Biomedis' },
  { id: 'prof_statistician', title: 'Statistician', categoryId: 'PENELITIAN', prefix: '', degree: ', S.Stat, M.Si', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Biostatistika & Analisis Data Riset' },
  { id: 'prof_data_manager', title: 'Data Manager', categoryId: 'PENELITIAN', prefix: '', degree: ', S.Kom', roleKey: 'SUPER_ADMIN', isMedical: false, dept: 'Pengelolaan Registry Pasien Riset' },

  // === PENDIDIKAN ===
  { id: 'prof_clinical_instructor', title: 'Clinical Instructor', categoryId: 'PENDIDIKAN', prefix: 'Ns. ', degree: ', M.Kep (CI)', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Instruktur Klinik Keperawatan' },
  { id: 'prof_dosen_klinis', title: 'Dosen Klinis', categoryId: 'PENDIDIKAN', prefix: 'Dr. dr. ', degree: ', Sp.PD, K-HOM, FINASIM', roleKey: 'DOCTOR_SPECIALIST', isMedical: true, dept: 'Pendidikan Dokter Specialist FK' },
  { id: 'prof_preceptor', title: 'Preceptor', categoryId: 'PENDIDIKAN', prefix: 'Ns. ', degree: ', M.Kep', roleKey: 'HEAD_NURSE', isMedical: true, dept: 'Preseptorship Mahasiswa Ners' },
  { id: 'prof_tutor_klinik', title: 'Tutor Klinik', categoryId: 'PENDIDIKAN', prefix: 'dr. ', degree: ', M.Kes', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Bimbingan Modul Pembelajaran Klinik' },

  // === ROHANIAWAN ===
  { id: 'prof_pendeta', title: 'Pendeta', categoryId: 'ROHANIAWAN', prefix: 'Pdt. ', degree: ', S.Th', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Kristen' },
  { id: 'prof_ustaz', title: 'Ustaz', categoryId: 'ROHANIAWAN', prefix: 'Ust. ', degree: ', S.Ag', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Islam' },
  { id: 'prof_pastor', title: 'Pastor', categoryId: 'ROHANIAWAN', prefix: 'R.D. ', degree: ', S.Fil', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Katolik' },
  { id: 'prof_biksu', title: 'Biksu', categoryId: 'ROHANIAWAN', prefix: 'Bhikkhu ', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Buddha' },
  { id: 'prof_rohaniawan_hindu', title: 'Rohaniawan Hindu', categoryId: 'ROHANIAWAN', prefix: 'Ida Pedanda ', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Hindu' },
  { id: 'prof_rohaniawan_konghucu', title: 'Rohaniawan Konghucu', categoryId: 'ROHANIAWAN', prefix: 'Js. ', degree: '', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Bimbingan Kerohanian Konghucu' },

  // === RELAWAN ===
  { id: 'prof_volunteer', title: 'Volunteer', categoryId: 'RELAWAN', prefix: '', degree: ' (Relawan RS)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Tim Relawan Kemanusiaan & Bencana' },
  { id: 'prof_mahasiswa_praktik', title: 'Mahasiswa Praktik', categoryId: 'RELAWAN', prefix: '', degree: ' (Mahasiswa PKL)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Praktik Kerja Lapangan' },
  { id: 'prof_koas', title: 'Koas', categoryId: 'RELAWAN', prefix: 'dr. ', degree: ' (Doctor Co-Assistant)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Kepaniteraan Klinik FK' },
  { id: 'prof_residen_relawan', title: 'Residen', categoryId: 'RELAWAN', prefix: 'dr. ', degree: ' (PPDS)', roleKey: 'DOCTOR_GENERAL', isMedical: true, dept: 'Program Pendidikan Dokter Spesialis' },
  { id: 'prof_intern', title: 'Intern', categoryId: 'RELAWAN', prefix: '', degree: ' (Management Intern)', roleKey: 'ADMIN_OFFICER', isMedical: false, dept: 'Magang Manajemen Rumah Sakit' }
];

export const getProfessionsByCategory = (categoryId) => {
  if (!categoryId || categoryId === 'ALL') return HOSPITAL_PROFESSIONS;
  return HOSPITAL_PROFESSIONS.filter(p => p.categoryId === categoryId);
};
