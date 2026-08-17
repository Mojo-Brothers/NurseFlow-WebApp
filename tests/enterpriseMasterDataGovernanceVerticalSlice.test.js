/**
 * NurseFlow Enterprise HIS 2026 — Master Data Governance Vertical Slice Test
 * Standards: Permenkes No. 24/2022 (RME), SATUSEHAT HL7 FHIR R4 & JCI MOI/SQE
 */

import { describe, it, expect } from 'vitest';
import { masterDataGovernanceEngine } from '../server/services/masterDataGovernanceEngine.service.js';

describe('Gate 1F.8: Enterprise Master Data Governance & Canonical Architecture', () => {

  // 1. Wave 1: Spatial Hierarchy & Tenant Isolation
  it('1. should query spatial master hierarchy (Tenant -> Org -> Facility -> Ward -> Bed) with tenant scoping', () => {
    const orgs = masterDataGovernanceEngine.queryEntity('organizations', { tenantId: 'TENANT-GRP-01' });
    expect(orgs.total).toBeGreaterThanOrEqual(1);
    expect(orgs.data[0].code).toBe('RSNF-PUSAT');
    expect(orgs.data[0].satusehat_org_id).toBe('100028741');

    const wards = masterDataGovernanceEngine.queryEntity('wards');
    expect(wards.data.some(w => w.code === 'WRD-CHRY')).toBe(true);

    const beds = masterDataGovernanceEngine.queryEntity('beds');
    const icuBed = beds.data.find(b => b.bed_code === 'BED-ICU-01');
    expect(icuBed).toBeDefined();
    expect(icuBed.has_ventilator).toBe(true);
    expect(icuBed.status).toBe('ACTIVE');
  });

  // 2. Wave 3: Dedicated High-Performance Terminology Search
  it('2. should query dedicated ICD-10, ICD-9-CM, and LOINC coding catalogs with instant search', () => {
    const icd10Result = masterDataGovernanceEngine.queryEntity('icd10', { search: 'Hipertensi' });
    expect(icd10Result.data.length).toBeGreaterThanOrEqual(1);
    expect(icd10Result.data[0].code).toBe('I10');

    const loincResult = masterDataGovernanceEngine.queryEntity('loinc', { search: 'Troponin' });
    expect(loincResult.data.length).toBeGreaterThanOrEqual(1);
    expect(loincResult.data[0].code).toBe('6598-7');
  });

  // 3. Wave 4: Single Source of Truth HR & Multi-Profesi Practitioners
  it('3. should maintain staff identity as single source of truth and link practitioner profiles', () => {
    const staffList = masterDataGovernanceEngine.queryEntity('staff', { tenantId: 'TENANT-GRP-01' });
    const doctorStaff = staffList.data.find(s => s.employee_number === 'EMP-DOC-101');
    expect(doctorStaff).toBeDefined();
    expect(doctorStaff.full_name).toBe('dr. Siti Wijaya, Sp.PD-KGEH');
    expect(doctorStaff.nik).toBe('3171012345670001');

    const practitioners = masterDataGovernanceEngine.queryEntity('practitioners');
    const doctorPrac = practitioners.data.find(p => p.staff_id === doctorStaff.id);
    expect(doctorPrac).toBeDefined();
    expect(doctorPrac.ihs_number).toBe('P10002874101');
    expect(doctorPrac.is_dpjp_eligible).toBe(true);
  });

  // 4. Wave 5: Global Clinical Catalogs & Medication-Allergen Cross-Reactivity
  it('4. should retrieve standalone medication and clinical catalogs without department coupling', () => {
    const meds = masterDataGovernanceEngine.queryEntity('medications');
    expect(meds.data.some(m => m.kfa_code === '93000123')).toBe(true);

    const labTests = masterDataGovernanceEngine.queryEntity('labTests');
    const cbcTest = labTests.data.find(l => l.test_code === 'LAB-CBC');
    expect(cbcTest).toBeDefined();
    expect(cbcTest.panic_critical_range).toContain('Hb < 7.0 g/dL');

    const inacbg = masterDataGovernanceEngine.queryEntity('inacbgTariffs');
    expect(inacbg.data[0].tariff_version).toBe('Permenkes No. 3 Tahun 2023');
    expect(inacbg.data[0].tariff_amount).toBe(14750000);
  });

  // 5. Versioning & Soft-Delete with JCI Auditor Attribution
  it('5. should execute atomic version increment on update and track soft-delete with timestamps', () => {
    const newRoom = masterDataGovernanceEngine.createEntity('rooms', {
      ward_id: 'WRD-01',
      room_number: '102-VIP',
      room_type: 'VIP',
      has_negative_pressure: false
    }, { performedByUserId: 'USER-ADMIN-01' });

    expect(newRoom.version).toBe(1);
    expect(newRoom.status).toBe('ACTIVE');

    // Update Room
    const updatedRoom = masterDataGovernanceEngine.updateEntity('rooms', newRoom.id, {
      has_negative_pressure: true
    }, { performedByUserId: 'USER-ADMIN-01', reason: 'Pemasangan HEPA Filter Tekanan Negatif' });

    expect(updatedRoom.version).toBe(2);
    expect(updatedRoom.has_negative_pressure).toBe(true);

    // Soft Delete Room
    const deleteResult = masterDataGovernanceEngine.softDeleteEntity('rooms', newRoom.id, {
      performedByUserId: 'USER-ADMIN-01',
      reason: 'Renovasi Bangsal'
    });
    expect(deleteResult.success).toBe(true);

    const checkQuery = masterDataGovernanceEngine.queryEntity('rooms', { filterStatus: 'ACTIVE' });
    expect(checkQuery.data.some(r => r.id === newRoom.id)).toBe(false);
  });

  // 6. 2-Tier Lightweight Audit Engine with SHA-256 Chained Signature
  it('6. should emit 2-tier forensic audit logs with cryptographic SHA-256 signature chain', () => {
    const store = masterDataGovernanceEngine.getFullStore();
    expect(store.auditLogs.length).toBeGreaterThanOrEqual(1);

    const latestLog = store.auditLogs[0];
    expect(latestLog.signature_hash).toHaveLength(64);
    expect(latestLog.has_snapshot).toBe(true);

    // Check Tier-2 snapshot exists
    const matchingSnapshot = store.auditSnapshots.find(s => s.audit_log_id === latestLog.id);
    expect(matchingSnapshot).toBeDefined();
    expect(matchingSnapshot.after_snapshot).toBeDefined();
  });

  // 7. SATUSEHAT FHIR R4 Master Entity Serialization
  it('7. should serialize Organization and Practitioner to valid Kemenkes SATUSEHAT FHIR R4 schema', () => {
    const org = masterDataGovernanceEngine.getFullStore().organizations[0];
    const fhirOrg = masterDataGovernanceEngine.serializeToSatusehatFhir('organizations', org);

    expect(fhirOrg.resourceType).toBe('Organization');
    expect(fhirOrg.id).toBe('100028741');
    expect(fhirOrg.identifier[0].system).toBe('https://fhir.kemkes.go.id/id/organisasi');

    const prac = masterDataGovernanceEngine.getFullStore().practitioners[0];
    const fhirPrac = masterDataGovernanceEngine.serializeToSatusehatFhir('practitioners', prac);

    expect(fhirPrac.resourceType).toBe('Practitioner');
    expect(fhirPrac.id).toBe('P10002874101');
    expect(fhirPrac.identifier[0].system).toBe('https://fhir.kemkes.go.id/id/ihs-number');
  });

  // 8. Batch CSV Ingestion Engine with Validation
  it('8. should batch import master records and report line-by-line validation errors', () => {
    const batchItems = [
      { code: 'SP-03-BED', name: 'Spesialis Bedah Onkologi' },
      { code: 'SP-04-JTG', name: 'Spesialis Jantung & Pembuluh Darah' },
      { description: 'Data Tanpa Code atau Name (Harus Gagal)' } // Invalid row
    ];

    const importResult = masterDataGovernanceEngine.batchImport('specialties', batchItems);
    expect(importResult.total).toBe(3);
    expect(importResult.successCount).toBe(2);
    expect(importResult.failedCount).toBe(1);
    expect(importResult.errors[0].row).toBe(3);
  });

});
