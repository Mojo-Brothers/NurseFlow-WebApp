-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 035: Canonical Seed Reference Data
-- Standards: Kemenkes SATUSEHAT Org 100028741, RS Tipe A Pendidikan, Permenkes No. 3/2023
-- ==============================================================================

-- 1. Seed Reference Lookups (025)
INSERT INTO master_genders (code, name_id, name_en, satusehat_code, display_order, is_active) VALUES
('MALE', 'Laki-laki', 'Male', 'male', 1, TRUE),
('FEMALE', 'Perempuan', 'Female', 'female', 2, TRUE),
('UNKNOWN', 'Tidak Diketahui', 'Other / Unknown', 'other', 3, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_religions (id, code, name, satusehat_code, display_order, is_active) VALUES
(1, 'ISLAM', 'Islam', '1', 1, TRUE),
(2, 'KRISTEN_PROTESTAN', 'Kristen Protestan', '2', 2, TRUE),
(3, 'KATOLIK', 'Katolik', '3', 3, TRUE),
(4, 'HINDU', 'Hindu', '4', 4, TRUE),
(5, 'BUDDHA', 'Buddha', '5', 5, TRUE),
(6, 'KHONGHUCU', 'Khonghucu', '6', 6, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO master_marital_statuses (code, name_id, name_en, satusehat_code, is_active) VALUES
('S', 'Belum Kawin', 'Single', 'U', TRUE),
('M', 'Kawin', 'Married', 'M', TRUE),
('D', 'Cerai Hidup', 'Divorced', 'D', TRUE),
('W', 'Cerai Mati', 'Widowed', 'W', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_countries (alpha3_code, numeric_code, name, is_active) VALUES
('IDN', '360', 'Indonesia', TRUE),
('MYS', '458', 'Malaysia', TRUE),
('SGP', '702', 'Singapura', TRUE)
ON CONFLICT (alpha3_code) DO NOTHING;

INSERT INTO master_provinces (code, country_code, name, is_active) VALUES
('31', 'IDN', 'DKI Jakarta', TRUE),
('32', 'IDN', 'Jawa Barat', TRUE),
('33', 'IDN', 'Jawa Tengah', TRUE),
('35', 'IDN', 'Jawa Timur', TRUE),
('51', 'IDN', 'Bali', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_cities (code, province_code, name, type, is_active) VALUES
('3171', '31', 'Kota Jakarta Selatan', 'KOTA', TRUE),
('3173', '31', 'Kota Jakarta Pusat', 'KOTA', TRUE),
('3275', '32', 'Kota Bekasi', 'KOTA', TRUE),
('3671', '32', 'Kota Tangerang', 'KOTA', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_districts (code, city_code, name, is_active) VALUES
('317101', '3171', 'Kebayoran Baru', TRUE),
('317102', '3171', 'Kebayoran Lama', TRUE),
('317103', '3171', 'Setiabudi', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_villages (code, district_code, name, postal_code, is_active) VALUES
('3171011001', '317101', 'Selong', '12110', TRUE),
('3171011002', '317101', 'Gunung', '12120', TRUE),
('3171011003', '317101', 'Kramat Pela', '12130', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_hospital_types (id, code, name, description, multiplier, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'TIPE_A_PENDIDIKAN', 'Rumah Sakit Tipe A Pendidikan', 'RS Rujukan Tertinggi Nasional & Pendidikan Kedokteran', 1.15, TRUE),
('00000000-0000-0000-0000-000000000002', 'TIPE_B_NON_PENDIDIKAN', 'Rumah Sakit Tipe B', 'RS Rujukan Regional', 1.00, TRUE),
('00000000-0000-0000-0000-000000000003', 'TIPE_C', 'Rumah Sakit Tipe C', 'RS Kabupaten / Kota', 0.88, TRUE),
('00000000-0000-0000-0000-000000000004', 'TIPE_D', 'Rumah Sakit Tipe D', 'RS Pratama', 0.76, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_staff_categories (id, code, name, description, is_clinical, is_active) VALUES
('00000000-0000-0000-0000-000000000011', 'DOKTER_SPESIALIS', 'Dokter Spesialis / Sub-Spesialis', 'Tenaga Medis Penanggung Jawab Pasien (DPJP)', TRUE, TRUE),
('00000000-0000-0000-0000-000000000012', 'DOKTER_UMUM', 'Dokter Umum / Residen', 'Dokter Jaga IGD & Rawat Inap', TRUE, TRUE),
('00000000-0000-0000-0000-000000000013', 'PERAWAT_PRIMER', 'Perawat Primer / Ners', 'Perawat Penanggung Jawab Asuhan (PPJA)', TRUE, TRUE),
('00000000-0000-0000-0000-000000000014', 'APOTEKER', 'Apoteker Klinis', 'Penanggung Jawab Telaah Obat & Dispensing', TRUE, TRUE),
('00000000-0000-0000-0000-000000000015', 'ANALIS_LAB', 'Pranata Laboratorium Kesehatan', 'Analis Pemeriksaan LIS & Panic Value Escalation', TRUE, TRUE),
('00000000-0000-0000-0000-000000000016', 'RADIOGRAFER', 'Radiografer / Teknisi Imaging', 'Operator Modalitas Radiologi DICOM', TRUE, TRUE),
('00000000-0000-0000-0000-000000000017', 'ADMINISTRASI', 'Staf Administrasi & Rekam Medis', 'Petugas Admisi, Casemix & IT Governance', FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_credential_types (id, code, name, issuing_body, requires_expiry_tracking, is_active) VALUES
('00000000-0000-0000-0000-000000000021', 'STR', 'Surat Tanda Registrasi', 'Konsil Kedokteran Indonesia (KKI) / KTKI', TRUE, TRUE),
('00000000-0000-0000-0000-000000000022', 'SIP', 'Surat Izin Praktik Dokter', 'Dinas Kesehatan Kota / IDI', TRUE, TRUE),
('00000000-0000-0000-0000-000000000023', 'SIPA', 'Surat Izin Praktik Apoteker', 'Dinas Kesehatan / IAI', TRUE, TRUE),
('00000000-0000-0000-0000-000000000024', 'SIKR', 'Surat Izin Kerja Radiografer', 'Dinas Kesehatan / PARI', TRUE, TRUE),
('00000000-0000-0000-0000-000000000025', 'SPK_RKK', 'Surat Penugasan Klinis & Rincian Kewenangan Klinis', 'Komite Medik Rumah Sakit', TRUE, TRUE),
('00000000-0000-0000-0000-000000000026', 'ACLS', 'Advanced Cardiovascular Life Support', 'PERKI / AHA', TRUE, TRUE),
('00000000-0000-0000-0000-000000000027', 'ATLS', 'Advanced Trauma Life Support', 'IKABI / ACS', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_surgery_categories (id, code, name, risk_level, is_active) VALUES
('00000000-0000-0000-0000-000000000031', 'MAYOR', 'Bedah Mayor', 'HIGH', TRUE),
('00000000-0000-0000-0000-000000000032', 'MINOR', 'Bedah Minor', 'LOW', TRUE),
('00000000-0000-0000-0000-000000000033', 'KHUSUS', 'Bedah Khusus / Kompleks', 'CRITICAL', TRUE),
('00000000-0000-0000-0000-000000000034', 'CITO', 'Bedah Cito / Emergensi', 'HIGH', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_payer_types (id, code, name, category, is_active) VALUES
('00000000-0000-0000-0000-000000000041', 'BPJS_PBI', 'BPJS Kesehatan Penerima Bantuan Iuran', 'GOVERNMENT_BPJS', TRUE),
('00000000-0000-0000-0000-000000000042', 'BPJS_NON_PBI', 'BPJS Kesehatan Pekerja Penerima Upah / Mandiri', 'GOVERNMENT_BPJS', TRUE),
('00000000-0000-0000-0000-000000000043', 'ASURANSI_SWASTA', 'Asuransi Kesehatan Komersial', 'COMMERCIAL_INSURANCE', TRUE),
('00000000-0000-0000-0000-000000000044', 'OUT_OF_POCKET', 'Pembayaran Mandiri / Umum', 'SELF_PAY', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Spatial Roots (026)
INSERT INTO master_tenants (id, code, name, subscription_tier, status) VALUES
('10000000-0000-0000-0000-000000000001', 'TENANT-GRP-01', 'PT NurseFlow Medika Nusantara', 'ENTERPRISE', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_organizations (id, tenant_id, code, name, hospital_type_id, satusehat_org_id, kemenkes_hospital_code, address_line, city_code, postal_code, status) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'RSNF-PUSAT', 'RS NurseFlow Internasional Jakarta', '00000000-0000-0000-0000-000000000001', '100028741', '3171999', 'Jl. Jenderal Sudirman Kav. 52-53', '3171', '12110', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_facilities (id, organization_id, code, name, fhir_location_id, status) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'FAC-MAIN', 'Paviliun Kartika RS NurseFlow', 'LOC-FAC-01', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_buildings (id, facility_id, code, name, total_floors, status) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'BLD-A', 'Gedung A Paviliun Kartika', 5, 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_floors (id, building_id, floor_number, name, status) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 1, 'Lantai 1 — IGD & Poliklinik', 'ACTIVE'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 2, 'Lantai 2 — Bangsal Rawat Inap Chrysant', 'ACTIVE'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 3, 'Lantai 3 — Bangsal Rawat Inap Orchid & VIP', 'ACTIVE'),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 4, 'Lantai 4 — Intensive Care Unit (ICU/ICCU)', 'ACTIVE'),
('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000001', 5, 'Lantai 5 — Central Operating Theatre (IBS)', 'ACTIVE')
ON CONFLICT (building_id, floor_number) DO NOTHING;

INSERT INTO master_wards (id, floor_id, code, name, ward_class, gender_restriction, status) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'WRD-CHRY', 'Bangsal Chrysant (Kelas 1 & 2)', 'KELAS_1', 'NONE', 'ACTIVE'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 'WRD-ORCH', 'Bangsal Orchid (VIP & VVIP)', 'VIP', 'NONE', 'ACTIVE'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', 'WRD-ICU', 'Unit Perawatan Intensif (ICU)', 'ICU', 'NONE', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_room_types (id, code, name, bpjs_class_equivalent, is_active) VALUES
('70000000-0000-0000-0000-000000000001', 'VVIP', 'Ruang Rawat VVIP', 'NON_BPJS', TRUE),
('70000000-0000-0000-0000-000000000002', 'VIP', 'Ruang Rawat VIP', 'NON_BPJS', TRUE),
('70000000-0000-0000-0000-000000000003', 'KELAS_1', 'Ruang Rawat Kelas 1 (2 Bed)', 'KELAS_1', TRUE),
('70000000-0000-0000-0000-000000000004', 'KELAS_2', 'Ruang Rawat Kelas 2 (4 Bed)', 'KELAS_2', TRUE),
('70000000-0000-0000-0000-000000000005', 'KELAS_3', 'Ruang Rawat Kelas 3 (6 Bed)', 'KELAS_3', TRUE),
('70000000-0000-0000-0000-000000000006', 'ICU', 'Ruang Rawat Intensif', 'ICU', TRUE),
('70000000-0000-0000-0000-000000000007', 'ISOLASI_TEKANAN_NEGATIF', 'Ruang Isolasi Infeksius Tekanan Negatif', 'ISOLASI', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_bed_types (id, code, name, is_intensive, is_isolation, is_active) VALUES
('80000000-0000-0000-0000-000000000001', 'STANDARD_BED', 'Tempat Tidur Pasien Standar 3-Crank', FALSE, FALSE, TRUE),
('80000000-0000-0000-0000-000000000002', 'ELECTRIC_ICU_BED', 'Tempat Tidur ICU Elektrik Multi-Fungsi', TRUE, FALSE, TRUE),
('80000000-0000-0000-0000-000000000003', 'ISOLATION_BED', 'Tempat Tidur Ruang Isolasi Hepa Filter', FALSE, TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Dedicated Codings (028)
INSERT INTO master_icd10 (code, description_id, description_en, category, is_bpjs_claimable, is_infectious_disease) VALUES
('I10', 'Hipertensi esensial (primer)', 'Essential (primary) hypertension', 'Circulatory', TRUE, FALSE),
('E11.9', 'Diabetes melitus tipe 2 tanpa komplikasi', 'Type 2 diabetes mellitus without complications', 'Endocrine', TRUE, FALSE),
('I21.9', 'Infark miokard akut, tidak spesifik (STEMI/NSTEMI)', 'Acute myocardial infarction, unspecified', 'Circulatory', TRUE, FALSE),
('I63.9', 'Infark serebral / Stroke Iskemik akut', 'Cerebral infarction, unspecified', 'Nervous', TRUE, FALSE),
('A41.9', 'Sepsis, organisme tidak spesifik', 'Sepsis, unspecified organism', 'Infectious', TRUE, TRUE),
('K35.8', 'Apendisitis akut lainnya dan tidak spesifik', 'Other and unspecified acute appendicitis', 'Digestive', TRUE, FALSE),
('J45.909', 'Asma tidak spesifik tanpa komplikasi', 'Unspecified asthma, uncomplicated', 'Respiratory', TRUE, FALSE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_icd9cm (code, description, category) VALUES
('89.52', 'Elektrokardiogram 12-Lead (ECG/EKG)', 'Diagnostic'),
('87.44', 'Rontgen Dada Rutin (Thorax PA)', 'Radiology'),
('47.09', 'Apendektomi (Laparoskopi / Terbuka)', 'Surgery'),
('90.59', 'Pemeriksaan Darah Mikroskopik (Darah Lengkap CBC)', 'Laboratory'),
('96.04', 'Intubasi Saluran Napas Endotrakeal', 'Critical Care')
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_loinc (code, component, property, time_aspect, system_type, scale_type, class) VALUES
('718-7', 'Hemoglobin [Mass/volume] in Blood', 'MCnc', 'Pt', 'Bld', 'Qn', 'HEM/BC'),
('6690-2', 'Leukocyte count in Blood by Automated count', 'NCnc', 'Pt', 'Bld', 'Qn', 'HEM/BC'),
('777-3', 'Platelet count in Blood by Automated count', 'NCnc', 'Pt', 'Bld', 'Qn', 'HEM/BC'),
('2345-7', 'Glucose [Mass/volume] in Serum or Plasma', 'MCnc', 'Pt', 'Ser/Plas', 'Qn', 'CHEM'),
('6598-7', 'Troponin T.cardiac in Serum or Plasma', 'MCnc', 'Pt', 'Ser/Plas', 'Qn', 'CHEM')
ON CONFLICT (code) DO NOTHING;

-- 4. Seed Specialties & Staff (029)
INSERT INTO master_specialties (id, code, name, kemenkes_code, bpjs_code, is_active) VALUES
('90000000-0000-0000-0000-000000000001', 'SP_PD', 'Spesialis Penyakit Dalam', 'SP-01-INT', 'INT', TRUE),
('90000000-0000-0000-0000-000000000002', 'SP_EM', 'Spesialis Kedokteran Emergensi', 'SP-02-EMG', 'EMG', TRUE),
('90000000-0000-0000-0000-000000000003', 'SP_B', 'Spesialis Bedah Umum', 'SP-03-BED', 'BED', TRUE),
('90000000-0000-0000-0000-000000000004', 'SP_JP', 'Spesialis Jantung & Pembuluh Darah', 'SP-04-JTG', 'JAN', TRUE),
('90000000-0000-0000-0000-000000000005', 'SP_AN', 'Spesialis Anestesiologi & Terapi Intensif', 'SP-05-ANS', 'ANS', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO master_staff (id, tenant_id, organization_id, staff_category_id, employee_number, nik, full_name, gender_code, religion_id, marital_status_code, birth_date, email, phone, status) VALUES
('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'EMP-DOC-101', '3171012345670001', 'dr. Siti Wijaya, Sp.PD-KGEH', 'FEMALE', 1, 'M', '1982-05-14', 'dr.siti.wijaya@nurseflow.id', '081234567890', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'EMP-DOC-102', '3171012345670002', 'dr. Budi Santoso, Sp.EM', 'MALE', 1, 'M', '1985-08-20', 'dr.budi.santoso@nurseflow.id', '081234567891', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', 'EMP-NUR-201', '3171012345670003', 'Ns. Indah Permata, S.Kep', 'FEMALE', 1, 'S', '1992-11-10', 'ners.indah@nurseflow.id', '081234567892', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000014', 'EMP-PHA-301', '3171012345670004', 'apt. Dimas Anggara, S.Farm', 'MALE', 1, 'M', '1989-02-18', 'apt.dimas@nurseflow.id', '081234567893', 'ACTIVE')
ON CONFLICT (employee_number) DO NOTHING;

INSERT INTO master_practitioners (id, staff_id, specialty_id, practitioner_type, ihs_number, license_number, bpjs_doctor_code, is_dpjp_eligible, is_clinical_staff, status) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-000000000001', 'DOCTOR_SPECIALIST', 'P10002874101', 'SIP/503/001/IDI/2024', '12345', TRUE, TRUE, 'ACTIVE'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-000000000002', 'DOCTOR_SPECIALIST', 'P10002874102', 'SIP/503/002/IDI/2024', '12346', TRUE, TRUE, 'ACTIVE'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', NULL, 'NURSE_PRIMARY', 'P10002874103', 'SIP/503/003/PPNI/2024', NULL, FALSE, TRUE, 'ACTIVE'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', NULL, 'PHARMACIST', 'P10002874104', 'SIPA/503/004/IAI/2024', NULL, FALSE, TRUE, 'ACTIVE')
ON CONFLICT (ihs_number) DO NOTHING;

-- 5. Seed Roles & RBAC (032)
INSERT INTO auth_roles (id, tenant_id, role_code, role_name, description, status) VALUES
('c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ROLE_SUPER_ADMIN', 'Super Administrator RS', 'Akses Penuh Manajemen Sistem & Audit Governance', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'ROLE_DOCTOR_DPJP', 'Dokter Penanggung Jawab Pasien (DPJP)', 'Akses SOAP CPPT, CPOE Order & Ekspertise Klinis', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'ROLE_NURSE', 'Perawat Rawat Inap & IGD', 'Akses Asesmen Keperawatan, eMAR 5-Benar & IWL Balance', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'ROLE_PHARMACIST', 'Apoteker Klinis', 'Akses 7-Prinsip Telaah Resep & FEFO Dispensing Multi-Depot', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'ROLE_LAB_ANALYST', 'Pranata Laboratorium', 'Akses Analisis LIS Specimen Barcode & Panic Values', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'ROLE_RADIOGRAPHER', 'Radiografer & Imaging Specialist', 'Akses Modality Worklist MWL & PACS DICOM Ingestion', 'ACTIVE')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

INSERT INTO auth_users (id, tenant_id, staff_id, username, password_hash, is_active, status) VALUES
('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'dr.siti.wijaya', '$2a$12$K8dZzQ3Y3R5E4T6Y7U8I9O.pQ1wE2rT3yU4iO5pA6sD7fG8hJ9kL0', TRUE, 'ACTIVE'),
('d0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'dr.budi.santoso', '$2a$12$K8dZzQ3Y3R5E4T6Y7U8I9O.pQ1wE2rT3yU4iO5pA6sD7fG8hJ9kL0', TRUE, 'ACTIVE'),
('d0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'ners.indah', '$2a$12$K8dZzQ3Y3R5E4T6Y7U8I9O.pQ1wE2rT3yU4iO5pA6sD7fG8hJ9kL0', TRUE, 'ACTIVE'),
('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'apt.dimas', '$2a$12$K8dZzQ3Y3R5E4T6Y7U8I9O.pQ1wE2rT3yU4iO5pA6sD7fG8hJ9kL0', TRUE, 'ACTIVE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO auth_user_roles (user_id, role_id) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002'),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003'),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004')
ON CONFLICT (user_id, role_id) DO NOTHING;
