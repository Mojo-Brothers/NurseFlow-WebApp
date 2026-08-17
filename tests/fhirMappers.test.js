import { describe, it, expect } from 'vitest';
import { mapToFhirPatient, mapToFhirPractitioner, mapToFhirObservation, mapToFhirAllergy } from '../server/integrations/fhir/index.js';

describe('FHIR R4 Resource Mappers (Patient, Practitioner, Observation, Allergy)', () => {
  it('should map internal Patient to standard FHIR Patient resource', () => {
    const fhirPatient = mapToFhirPatient({
      id: 'P-1001',
      nik: '3171099908890001',
      mrn: 'MRN-2026-001001',
      fullName: 'Ny. Siti Nurhaliza',
      gender: 'FEMALE',
      birthDate: '1989-08-17',
      phoneNumber: '081299887766'
    });

    expect(fhirPatient.resourceType).toBe('Patient');
    expect(fhirPatient.gender).toBe('female');
    expect(fhirPatient.identifier.find(i => i.system.includes('nik'))?.value).toBe('3171099908890001');
  });

  it('should map internal Practitioner to FHIR Practitioner with SIP and STR identifiers', () => {
    const fhirDoctor = mapToFhirPractitioner({
      id: 'DOC-001',
      fullName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      sipNumber: 'SIP/503/001/IDI/2024',
      strNumber: 'STR-31.1.1.100.1.20.123456',
      gender: 'FEMALE'
    });

    expect(fhirDoctor.resourceType).toBe('Practitioner');
    expect(fhirDoctor.identifier.find(i => i.system.includes('sip'))?.value).toBe('SIP/503/001/IDI/2024');
  });

  it('should map Clinical Observation to FHIR Observation with LOINC coding', () => {
    const fhirObs = mapToFhirObservation({
      observationId: 'OBS-001',
      encounterId: 'ENC-001',
      ihsNumber: '10000001',
      loincCode: '718-7',
      loincDisplay: 'Hemoglobin in Blood',
      value: 14.2,
      unit: 'g/dL'
    });

    expect(fhirObs.resourceType).toBe('Observation');
    expect(fhirObs.code.coding[0].code).toBe('718-7');
    expect(fhirObs.valueQuantity.value).toBe(14.2);
  });
});
