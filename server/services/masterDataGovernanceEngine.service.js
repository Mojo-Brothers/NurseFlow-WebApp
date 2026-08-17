/**
 * NurseFlow Enterprise HIS 2026 — Master Data Governance Engine
 * Standards: Permenkes No. 24/2022 (RME), SATUSEHAT HL7 FHIR R4, JCI MOI & ISO 27001
 * Managing 36 Master Data Entities across 6 Granular Waves with Versioning & 2-Tier Audit
 */

import crypto from 'crypto';

// In-Memory Deterministic Master Store (Synchronized with Migrations 025-035)
const MASTER_DATA_STORE = {
  // Wave 0: References & Demography
  provinces: [
    { code: '31', name: 'DKI Jakarta', country_code: 'IDN', is_active: true },
    { code: '32', name: 'Jawa Barat', country_code: 'IDN', is_active: true }
  ],
  cities: [
    { code: '3171', province_code: '31', name: 'Kota Jakarta Selatan', type: 'KOTA', is_active: true },
    { code: '3275', province_code: '32', name: 'Kota Bekasi', type: 'KOTA', is_active: true }
  ],
  hospitalTypes: [
    { id: 'HT-01', code: 'TIPE_A_PENDIDIKAN', name: 'Rumah Sakit Tipe A Pendidikan', multiplier: 1.15, is_active: true },
    { id: 'HT-02', code: 'TIPE_B_NON_PENDIDIKAN', name: 'Rumah Sakit Tipe B', multiplier: 1.00, is_active: true }
  ],

  // Wave 1: Spatial Hierarchy
  tenants: [
    { id: 'TENANT-GRP-01', code: 'TENANT-GRP-01', name: 'PT NurseFlow Medika Nusantara', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  organizations: [
    {
      id: 'ORG-01',
      tenant_id: 'TENANT-GRP-01',
      code: 'RSNF-PUSAT',
      name: 'RS NurseFlow Internasional Jakarta',
      hospital_type_id: 'HT-01',
      satusehat_org_id: '100028741',
      kemenkes_hospital_code: '3171999',
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  facilities: [
    { id: 'FAC-01', organization_id: 'ORG-01', code: 'FAC-MAIN', name: 'Paviliun Kartika RS NurseFlow', fhir_location_id: 'LOC-FAC-01', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  buildings: [
    { id: 'BLD-01', facility_id: 'FAC-01', code: 'BLD-A', name: 'Gedung A Paviliun Kartika', total_floors: 5, status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  floors: [
    { id: 'FLR-01', building_id: 'BLD-01', floor_number: 1, name: 'Lantai 1 — IGD & Poliklinik', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'FLR-02', building_id: 'BLD-01', floor_number: 2, name: 'Lantai 2 — Bangsal Chrysant', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'FLR-04', building_id: 'BLD-01', floor_number: 4, name: 'Lantai 4 — Intensive Care Unit (ICU)', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  wards: [
    { id: 'WRD-01', floor_id: 'FLR-02', code: 'WRD-CHRY', name: 'Bangsal Chrysant', ward_class: 'KELAS_1', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'WRD-02', floor_id: 'FLR-04', code: 'WRD-ICU', name: 'Unit Perawatan Intensif (ICU)', ward_class: 'ICU', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  rooms: [
    { id: 'RM-101', ward_id: 'WRD-01', room_number: '101', room_type: 'KELAS_1', has_negative_pressure: false, status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'RM-ICU-01', ward_id: 'WRD-02', room_number: 'ICU-01', room_type: 'ICU', has_negative_pressure: true, status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  beds: [
    { id: 'BED-101-A', room_id: 'RM-101', bed_code: 'BED-101-A', bed_type: 'STANDARD_BED', has_ventilator: false, fhir_bed_id: 'BED-LOC-01', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'BED-101-B', room_id: 'RM-101', bed_code: 'BED-101-B', bed_type: 'STANDARD_BED', has_ventilator: false, fhir_bed_id: 'BED-LOC-02', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'BED-ICU-01', room_id: 'RM-ICU-01', bed_code: 'BED-ICU-01', bed_type: 'ELECTRIC_ICU_BED', has_ventilator: true, fhir_bed_id: 'BED-LOC-ICU-01', status: 'ACTIVE', version: 1, is_deleted: false }
  ],

  // Wave 2: Clinical Organization
  departments: [
    { id: 'DEPT-IGD', facility_id: 'FAC-01', code: 'IGD', name: 'Instalasi Gawat Darurat', department_type: 'EMERGENCY', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'DEPT-IRJ', facility_id: 'FAC-01', code: 'IRJ', name: 'Instalasi Rawat Jalan', department_type: 'OUTPATIENT', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'DEPT-COT', facility_id: 'FAC-01', code: 'COT', name: 'Central Operating Theatre', department_type: 'SURGICAL', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  clinics: [
    { id: 'POLI-INT', code: 'POLI-INT', name: 'Poliklinik Penyakit Dalam', bpjs_poli_code: 'INT', fhir_service_id: 'SRV-INT-01', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'POLI-BED', code: 'POLI-BED', name: 'Poliklinik Bedah Umum', bpjs_poli_code: 'BED', fhir_service_id: 'SRV-BED-01', status: 'ACTIVE', version: 1, is_deleted: false }
  ],

  // Wave 3: Universal Coding
  icd10: [
    { code: 'I10', description_id: 'Hipertensi esensial (primer)', description_en: 'Essential (primary) hypertension', category: 'Circulatory', is_bpjs_claimable: true, is_infectious_disease: false, is_active: true },
    { code: 'E11.9', description_id: 'Diabetes melitus tipe 2 tanpa komplikasi', description_en: 'Type 2 diabetes mellitus without complications', category: 'Endocrine', is_bpjs_claimable: true, is_infectious_disease: false, is_active: true },
    { code: 'I21.9', description_id: 'Infark miokard akut, tidak spesifik (STEMI/NSTEMI)', description_en: 'Acute myocardial infarction, unspecified', category: 'Circulatory', is_bpjs_claimable: true, is_infectious_disease: false, is_active: true }
  ],
  icd9cm: [
    { code: '89.52', description: 'Elektrokardiogram 12-Lead (ECG/EKG)', category: 'Diagnostic', is_active: true },
    { code: '47.09', description: 'Apendektomi (Laparoskopi / Terbuka)', category: 'Surgery', is_active: true }
  ],
  loinc: [
    { code: '718-7', component: 'Hemoglobin [Mass/volume] in Blood', property: 'MCnc', class: 'HEM/BC', is_active: true },
    { code: '6598-7', component: 'Troponin T.cardiac in Serum or Plasma', property: 'MCnc', class: 'CHEM', is_active: true }
  ],

  // Wave 4: Human Resources & Practitioners
  specialties: [
    { id: 'SP-01', code: 'SP_PD', name: 'Spesialis Penyakit Dalam', kemenkes_code: 'SP-01-INT', bpjs_code: 'INT', is_active: true },
    { id: 'SP-02', code: 'SP_EM', name: 'Spesialis Kedokteran Emergensi', kemenkes_code: 'SP-02-EMG', bpjs_code: 'EMG', is_active: true }
  ],
  staff: [
    {
      id: 'STAFF-01',
      tenant_id: 'TENANT-GRP-01',
      organization_id: 'ORG-01',
      employee_number: 'EMP-DOC-101',
      nik: '3171012345670001',
      full_name: 'dr. Siti Wijaya, Sp.PD-KGEH',
      email: 'dr.siti.wijaya@nurseflow.id',
      phone: '081234567890',
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  practitioners: [
    {
      id: 'PRAC-01',
      staff_id: 'STAFF-01',
      specialty_id: 'SP-01',
      practitioner_type: 'DOCTOR_SPECIALIST',
      ihs_number: 'P10002874101',
      license_number: 'SIP/503/001/IDI/2024',
      bpjs_doctor_code: '12345',
      is_dpjp_eligible: true,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  credentials: [
    {
      id: 'CRED-01',
      practitioner_id: 'PRAC-01',
      credential_type: 'SIP',
      credential_number: 'SIP/503/001/IDI/2024',
      issuing_authority: 'Dinas Kesehatan DKI Jakarta',
      issued_at: '2024-01-01',
      valid_until: '2029-01-01',
      verification_status: 'VERIFIED',
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],

  // Wave 5: Global Clinical Catalogs
  allergens: [
    { id: 'ALLERG-01', code: 'ALLERG-PEN', allergen_name: 'Penicillin & Beta-Lactams', snomed_ct_concept_id: '764146007', atc_class_group: 'J01C', is_active: true }
  ],
  medications: [
    {
      id: 'MED-01',
      tenant_id: 'TENANT-GRP-01',
      kfa_code: '93000123',
      generic_name: 'Ceftriaxone 1g Injeksi',
      brand_name: 'Ceftriaxone Hexpharm 1g Vial',
      dosage_form: 'Vial Serbuk Injeksi',
      strength: '1 g',
      is_fornas: true,
      is_high_alert: true,
      is_lasa: false,
      unit_price: 38500,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  labTests: [
    {
      id: 'LAB-01',
      tenant_id: 'TENANT-GRP-01',
      test_code: 'LAB-CBC',
      test_name: 'Darah Lengkap Otomatis (CBC 5-Diff)',
      loinc_code: '718-7',
      specimen_type: 'Whole Blood EDTA',
      standard_reference_range: 'Hb: 12.0 - 16.0 g/dL',
      panic_critical_range: 'Hb < 7.0 g/dL or > 20.0 g/dL',
      unit_of_measure: 'g/dL',
      tariff: 95000,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  radiologyProcedures: [
    {
      id: 'RAD-01',
      tenant_id: 'TENANT-GRP-01',
      procedure_code: 'RAD-XR-THORAX',
      procedure_name: 'Rontgen Thorax PA / AP Dewasa',
      modality_code: 'XR',
      loinc_code: '87.44',
      tariff: 145000,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  surgicalProcedures: [
    {
      id: 'SURG-01',
      tenant_id: 'TENANT-GRP-01',
      procedure_code: 'SURG-APPEN-01',
      procedure_name: 'Apendektomi Laparoskopik',
      icd9cm_code: '47.09',
      surgery_category: 'MAYOR',
      estimated_duration_minutes: 90,
      base_tariff: 12500000,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  bloodProducts: [
    {
      id: 'BLD-01',
      tenant_id: 'TENANT-GRP-01',
      product_code: 'BLD-PRC',
      product_name: 'Packed Red Cells (PRC Leucodepleted)',
      blood_component_type: 'PACKED_RED_CELLS',
      target_storage_temp_celsius: 4.0,
      shelf_life_days: 35,
      tariff: 360000,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  inacbgTariffs: [
    {
      id: 'INACBG-01',
      tenant_id: 'TENANT-GRP-01',
      inacbg_code: 'I-4-10-I',
      description: 'Infark Miokard Akut Ringan (Severity Level I)',
      hospital_class: 'A',
      region_number: 1,
      severity_level: 1,
      tariff_amount: 14750000,
      effective_date: '2023-01-01',
      expired_date: '2026-12-31',
      tariff_version: 'Permenkes No. 3 Tahun 2023',
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  insurances: [
    {
      id: 'INS-01',
      tenant_id: 'TENANT-GRP-01',
      organization_id: 'ORG-01',
      payer_code: 'BPJS-KES',
      payer_name: 'BPJS Kesehatan Kantor Cabang Jakarta Selatan',
      satusehat_coverage_id: 'COV-BPJS-01',
      contract_start: '2026-01-01',
      contract_end: '2026-12-31',
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],

  // Wave 6: Auth, Roles & 2-Tier Audit
  roles: [
    { id: 'ROLE-01', tenant_id: 'TENANT-GRP-01', role_code: 'ROLE_SUPER_ADMIN', role_name: 'Super Administrator RS', status: 'ACTIVE', version: 1, is_deleted: false },
    { id: 'ROLE-02', tenant_id: 'TENANT-GRP-01', role_code: 'ROLE_DOCTOR_DPJP', role_name: 'Dokter Penanggung Jawab Pasien', status: 'ACTIVE', version: 1, is_deleted: false }
  ],
  users: [
    {
      id: 'USER-01',
      tenant_id: 'TENANT-GRP-01',
      staff_id: 'STAFF-01',
      username: 'dr.siti.wijaya',
      password_hash: '$2a$12$HASHED_PASS_EXAMPLE',
      is_active: true,
      status: 'ACTIVE',
      version: 1,
      is_deleted: false
    }
  ],
  auditLogs: [],
  auditSnapshots: []
};

// Cryptographic Hash Chaining Utility
let lastAuditHash = '0000000000000000000000000000000000000000000000000000000000000000';

function generateSha256Signature(payload, prevHash) {
  const content = JSON.stringify(payload) + prevHash;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export const masterDataGovernanceEngine = {
  /**
   * Universal Query & Filter across any Master Entity
   */
  queryEntity: (entityKey, { search = '', filterStatus = 'ACTIVE', tenantId = 'TENANT-GRP-01', page = 1, limit = 50 } = {}) => {
    const list = MASTER_DATA_STORE[entityKey] || [];
    let filtered = list.filter(item => {
      // 1. Soft-delete check
      if (filterStatus !== 'ALL' && item.is_deleted) return false;
      // 2. Tenant isolation check (if entity is tenant-scoped)
      if (item.tenant_id && item.tenant_id !== tenantId) return false;
      // 3. Status filter
      if (filterStatus !== 'ALL' && item.status && item.status !== filterStatus) return false;
      // 4. Keyword search
      if (search) {
        const term = search.toLowerCase();
        return Object.values(item).some(val => typeof val === 'string' && val.toLowerCase().includes(term));
      }
      return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      entity: entityKey,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated
    };
  },

  /**
   * Universal Create Entity with Audit Emitter & Versioning
   */
  createEntity: (entityKey, payload, { performedByUserId = 'USER-SYSTEM', clientIp = '127.0.0.1' } = {}) => {
    if (!MASTER_DATA_STORE[entityKey]) {
      MASTER_DATA_STORE[entityKey] = [];
    }

    const newId = payload.id || `${entityKey.toUpperCase()}-${Date.now()}`;
    const newRecord = {
      ...payload,
      id: newId,
      version: 1,
      status: payload.status || 'ACTIVE',
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    MASTER_DATA_STORE[entityKey].push(newRecord);

    // Emit 2-Tier Audit Log
    masterDataGovernanceEngine.recordAudit({
      tenantId: payload.tenant_id || 'TENANT-GRP-01',
      entityName: entityKey,
      entityPrimaryKey: String(newId),
      action: 'CREATE',
      performedByUserId,
      clientIp,
      beforeSnapshot: null,
      afterSnapshot: newRecord,
      reasonForAction: `Pencatatan data master baru ${entityKey}: ${newRecord.name || newRecord.code || newId}`
    });

    return newRecord;
  },

  /**
   * Universal Update Entity with Atomic Version Increment & Audit Snapshot
   */
  updateEntity: (entityKey, primaryKey, updates, { performedByUserId = 'USER-SYSTEM', clientIp = '127.0.0.1', reason = 'Pembaruan data master' } = {}) => {
    const list = MASTER_DATA_STORE[entityKey] || [];
    const index = list.findIndex(item => item.id === primaryKey || item.code === primaryKey);

    if (index === -1) {
      throw new Error(`Master entity ${entityKey} with key ${primaryKey} not found.`);
    }

    const beforeState = { ...list[index] };
    const updatedRecord = {
      ...beforeState,
      ...updates,
      version: (beforeState.version || 1) + 1,
      updated_at: new Date().toISOString()
    };

    list[index] = updatedRecord;

    // Emit 2-Tier Audit Log with Snapshot
    masterDataGovernanceEngine.recordAudit({
      tenantId: updatedRecord.tenant_id || 'TENANT-GRP-01',
      entityName: entityKey,
      entityPrimaryKey: String(primaryKey),
      action: 'UPDATE',
      performedByUserId,
      clientIp,
      beforeSnapshot: beforeState,
      afterSnapshot: updatedRecord,
      reasonForAction: reason
    });

    return updatedRecord;
  },

  /**
   * Universal Soft Delete with Auditor Tracking
   */
  softDeleteEntity: (entityKey, primaryKey, { performedByUserId = 'USER-SYSTEM', clientIp = '127.0.0.1', reason = 'Penonaktifan data master' } = {}) => {
    const list = MASTER_DATA_STORE[entityKey] || [];
    const index = list.findIndex(item => item.id === primaryKey || item.code === primaryKey);

    if (index === -1) {
      throw new Error(`Master entity ${entityKey} with key ${primaryKey} not found.`);
    }

    const beforeState = { ...list[index] };
    const softDeletedRecord = {
      ...beforeState,
      status: 'ARCHIVED',
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    list[index] = softDeletedRecord;

    // Emit 2-Tier Audit Log
    masterDataGovernanceEngine.recordAudit({
      tenantId: softDeletedRecord.tenant_id || 'TENANT-GRP-01',
      entityName: entityKey,
      entityPrimaryKey: String(primaryKey),
      action: 'DELETE',
      performedByUserId,
      clientIp,
      beforeSnapshot: beforeState,
      afterSnapshot: softDeletedRecord,
      reasonForAction: reason
    });

    return { success: true, message: `Entity ${entityKey} (${primaryKey}) has been soft-deleted.` };
  },

  /**
   * 2-Tier Lightweight Forensic Audit Recorder with SHA-256 Chained Hash
   */
  recordAudit: ({ tenantId = 'TENANT-GRP-01', entityName, entityPrimaryKey, action, performedByUserId, clientIp, beforeSnapshot, afterSnapshot, reasonForAction }) => {
    const auditLogId = `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date().toISOString();

    const auditPayload = {
      id: auditLogId,
      tenant_id: tenantId,
      entity_name: entityName,
      entity_primary_key: String(entityPrimaryKey),
      action,
      performed_by_user_id: performedByUserId,
      performed_at: timestamp,
      ip_address: clientIp,
      reason_for_action: reasonForAction
    };

    const signatureHash = generateSha256Signature(auditPayload, lastAuditHash);
    const logEntry = {
      ...auditPayload,
      has_snapshot: Boolean(beforeSnapshot || afterSnapshot),
      signature_hash: signatureHash,
      previous_log_hash: lastAuditHash
    };

    lastAuditHash = signatureHash;
    MASTER_DATA_STORE.auditLogs.unshift(logEntry);

    // If snapshots exist, record into Tier-2 audit_snapshots
    if (beforeSnapshot || afterSnapshot) {
      const snapshotEntry = {
        id: `SNAP-${auditLogId}`,
        audit_log_id: auditLogId,
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
        created_at: timestamp
      };
      MASTER_DATA_STORE.auditSnapshots.unshift(snapshotEntry);
    }

    return logEntry;
  },

  /**
   * Batch CSV/JSON Ingestion with Validation & Error Reporting
   */
  batchImport: (entityKey, items = [], { tenantId = 'TENANT-GRP-01', performedByUserId = 'USER-IMPORT' } = {}) => {
    const results = {
      total: items.length,
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    items.forEach((item, idx) => {
      try {
        if (!item.code && !item.name && !item.kfa_code && !item.test_code && !item.procedure_code) {
          throw new Error(`Baris ${idx + 1}: Identifier wajib (code/name) tidak ditemukan.`);
        }
        masterDataGovernanceEngine.createEntity(entityKey, { ...item, tenant_id: tenantId }, { performedByUserId });
        results.successCount++;
      } catch (err) {
        results.failedCount++;
        results.errors.push({ row: idx + 1, error: err.message });
      }
    });

    return results;
  },

  /**
   * SATUSEHAT FHIR R4 Bundle Serializer for Master Entities
   */
  serializeToSatusehatFhir: (entityKey, entity) => {
    switch (entityKey) {
      case 'organizations':
        return {
          resourceType: 'Organization',
          id: entity.satusehat_org_id || '100028741',
          identifier: [{ use: 'official', system: 'https://fhir.kemkes.go.id/id/organisasi', value: entity.satusehat_org_id || '100028741' }],
          name: entity.name,
          telecom: [{ system: 'phone', value: '021-5000123' }],
          address: [{ line: [entity.address_line || 'Jl. Jend Sudirman'], city: 'Jakarta Selatan', postalCode: '12110', country: 'ID' }]
        };
      case 'beds':
      case 'rooms':
        return {
          resourceType: 'Location',
          id: entity.fhir_bed_id || entity.id,
          identifier: [{ system: 'https://fhir.kemkes.go.id/id/lokasi/100028741', value: entity.bed_code || entity.room_number }],
          status: entity.status === 'ACTIVE' ? 'active' : 'inactive',
          name: entity.bed_code || `Kamar ${entity.room_number}`,
          mode: 'instance',
          physicalType: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/location-physical-type', code: entityKey === 'beds' ? 'bd' : 'ro', display: entityKey === 'beds' ? 'Bed' : 'Room' }] }
        };
      case 'practitioners':
        return {
          resourceType: 'Practitioner',
          id: entity.ihs_number,
          identifier: [
            { system: 'https://fhir.kemkes.go.id/id/ihs-number', value: entity.ihs_number },
            { system: 'https://fhir.kemkes.go.id/id/nik', value: '3171012345670001' }
          ],
          name: [{ use: 'official', text: 'dr. Siti Wijaya, Sp.PD-KGEH' }]
        };
      default:
        return {
          resourceType: 'Basic',
          id: entity.id || entity.code,
          code: { coding: [{ system: 'https://nurseflow.id/fhir/master-data', code: entityKey }] }
        };
    }
  },

  /**
   * Retrieve Full Master Data Store (for testing / seed synchronization)
   */
  getFullStore: () => MASTER_DATA_STORE
};
