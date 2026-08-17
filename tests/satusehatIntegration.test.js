import { describe, it, expect } from 'vitest';
import { satusehatClient } from '../server/integrations/satusehatClient.js';

describe('SATUSEHAT FHIR R4 Integration Engine', () => {
  it('should generate valid FHIR Encounter resource according to Kemkes specification', () => {
    const encounter = satusehatClient.buildFhirEncounter({
      ihsNumber: '10000000001',
      encounterId: 'ENC-2026-001',
      patientName: 'Ny. Siti Nurhaliza',
      doctorIhsNumber: 'N1000001',
      doctorName: 'dr. Siti Wijaya, Sp.PD',
      departmentId: 'POLI-PD',
      departmentName: 'Poliklinik Penyakit Dalam'
    });

    expect(encounter.resourceType).toBe('Encounter');
    expect(encounter.id).toBe('ENC-2026-001');
    expect(encounter.status).toBe('in-progress');
    expect(encounter.subject.reference).toBe('Patient/10000000001');
    expect(encounter.class.code).toBe('AMB');
    expect(encounter.participant[0].individual.reference).toBe('Practitioner/N1000001');
  });
});
