import { describe, it, expect } from 'vitest';
import { hl7EngineService } from '../server/integrations/hl7/hl7Engine.service.js';
import { eventBusService, DOMAIN_EVENTS } from '../server/realtime/eventBus.service.js';
import { SatusehatFhirService } from '../src/core/services/satusehatFhir.service.js';

describe('Gate 1F.1: Enterprise Infrastructure Vertical Slice (HL7 v2, Event Bus & SATUSEHAT FHIR)', () => {

  // 1. HL7 v2.5.1 ADT^A01 Generation
  it('1. should generate valid HL7 v2.5.1 ADT^A01 Admission message', () => {
    const hl7 = hl7EngineService.createAdtAdmissionMessage({
      patientMrn: 'MRN-2026-001001',
      patientNik: '3171010101010001',
      patientFullName: 'Siti Nurhaliza',
      birthDate: '1985-05-20',
      gender: 'F',
      address: 'Jakarta',
      wardName: 'Bangsal Melati',
      bedNumber: 'Melati 01',
      attendingDoctorName: 'dr. Surya Johnson, Sp.PD'
    });

    expect(hl7).toContain('MSH|^~\\&|NURSEFLOW_HIS');
    expect(hl7).toContain('ADT^A01');
    expect(hl7).toContain('MRN-2026-001001^^^HOSPITAL^MR');
    expect(hl7).toContain('PV1|1|I|Bangsal Melati^Melati 01');
  });

  // 2. HL7 v2.5.1 ORM^O01 Order Message
  it('2. should generate valid HL7 v2.5.1 ORM^O01 Lab/Rad order message', () => {
    const orm = hl7EngineService.createOrmOrderMessage({
      orderNumber: 'ORD-2026-991',
      patientMrn: 'MRN-2026-001001',
      patientFullName: 'Siti Nurhaliza',
      testCode: '57021-8',
      testName: 'Darah Lengkap 5-Diff',
      orderingDoctorName: 'dr. Surya Johnson',
      priority: 'STAT'
    });

    expect(orm).toContain('ORM^O01');
    expect(orm).toContain('ORC|NW|ORD-2026-991|||||^^^STAT');
    expect(orm).toContain('OBR|1|ORD-2026-991||57021-8^Darah Lengkap 5-Diff^LN');
  });

  // 3. HL7 v2.5.1 ORU^R01 Parser
  it('3. should parse incoming HL7 v2.5.1 ORU^R01 Lab Analyzer observation message', () => {
    const rawOru = [
      'MSH|^~\\&|AUTO_ANALYZER|LAB|NURSEFLOW_HIS|HOSPITAL|20260817140000||ORU^R01|MSG-9921|P|2.5.1',
      'PID|1||MRN-2026-001001^^^HOSPITAL^MR||Siti^Nurhaliza||19850520|F',
      'OBR|1|ORD-2026-991||57021-8^CBC^LN',
      'OBX|1|NM|718-7^Hemoglobin||12.4|g/dL|12.0-15.5|N|||F|||20260817140000',
      'OBX|2|NM|2823-3^Potassium||6.8|mmol/L|3.5-5.0|HH|||F|||20260817140000'
    ].join('\r');

    const parsed = hl7EngineService.parseOruResultMessage(rawOru);

    expect(parsed.patientMrn).toBe('MRN-2026-001001');
    expect(parsed.patientName).toBe('Siti Nurhaliza');
    expect(parsed.observations.length).toBe(2);
    expect(parsed.observations[0].testName).toBe('Hemoglobin');
    expect(parsed.observations[0].isPanic).toBe(false);
    expect(parsed.observations[1].testName).toBe('Potassium');
    expect(parsed.observations[1].isPanic).toBe(true);
    expect(parsed.observations[1].abnormalFlags).toBe('HH');
  });

  // 4. Enterprise Event Bus Pub/Sub
  it('4. should publish domain events and execute registered subscribers with correlation metadata', async () => {
    let receivedEvent = null;

    const unsubscribe = eventBusService.subscribe(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, (evt) => {
      receivedEvent = evt;
    });

    const published = await eventBusService.publish(
      DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED,
      { testCode: 'LOINC-2524-7', value: 5.2, threat: 'Severe Shock' },
      { actor: 'Analis Budi', correlationId: 'TX-9901' }
    );

    expect(published.eventId).toBeDefined();
    expect(published.eventType).toBe(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED);
    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.payload.value).toBe(5.2);
    expect(receivedEvent.metadata.correlationId).toBe('TX-9901');

    unsubscribe();
  });

  // 5. SATUSEHAT FHIR R4 Serialization
  it('5. should map Patient, Encounter, and Condition to valid Kemenkes SATUSEHAT FHIR R4 schema', () => {
    const fhirPatient = SatusehatFhirService.toFhirPatient({
      id: 'P-1001',
      nik: '3171010101010001',
      mrn: 'MRN-2026-001001',
      name: 'Ny. Siti Nurhaliza',
      gender: 'F',
      dob: '1985-05-20'
    });

    expect(fhirPatient.resourceType).toBe('Patient');
    expect(fhirPatient.identifier[0].system).toContain('nik');
    expect(fhirPatient.gender).toBe('female');

    const fhirEncounter = SatusehatFhirService.toFhirEncounter({
      id: 'ENC-001',
      encounterNumber: 'ENC-2026-001',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      dpjpId: 'DOC-01',
      dpjpName: 'dr. Surya Johnson',
      type: 'INPATIENT',
      admissionDate: '2026-08-16T08:00:00Z',
      status: 'ACTIVE'
    });

    expect(fhirEncounter.resourceType).toBe('Encounter');
    expect(fhirEncounter.class.code).toBe('IMP');

    const fhirCondition = SatusehatFhirService.toFhirCondition(
      { id: 'ENC-001', patientId: 'P-1001', patientName: 'Ny. Siti Nurhaliza' },
      { code: 'A91', name: 'Dengue hemorrhagic fever' }
    );

    expect(fhirCondition.resourceType).toBe('Condition');
    expect(fhirCondition.code.coding[0].system).toContain('icd-10');
    expect(fhirCondition.code.coding[0].code).toBe('A91');
  });
});
