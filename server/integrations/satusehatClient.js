/**
 * NurseFlow Enterprise HIS 2026 — SATUSEHAT HL7 FHIR R4 Integration Engine
 * Standar: Kemkes RI SATUSEHAT Platform Specification v4.0.1
 */

export const satusehatClient = {
  /**
   * Build FHIR Encounter Resource for SATUSEHAT
   */
  buildFhirEncounter: ({
    ihsNumber,
    encounterId,
    patientName,
    doctorIhsNumber = '10000001',
    doctorName = 'dr. Siti Wijaya, Sp.PD',
    departmentId = 'POLI-PD',
    departmentName = 'Poliklinik Penyakit Dalam',
    startTime,
    status = 'in-progress'
  }) => {
    return {
      resourceType: 'Encounter',
      id: encounterId,
      identifier: [
        {
          system: `http://sys-ids.kemkes.go.id/encounter/${process.env.SATUSEHAT_ORG_ID || '1000001'}`,
          value: encounterId
        }
      ],
      status,
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'ambulatory'
      },
      subject: {
        reference: `Patient/${ihsNumber}`,
        display: patientName
      },
      participant: [
        {
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'ATND',
                  display: 'attender'
                }
              ]
            }
          ],
          individual: {
            reference: `Practitioner/${doctorIhsNumber}`,
            display: doctorName
          }
        }
      ],
      period: {
        start: startTime || new Date().toISOString()
      },
      location: [
        {
          location: {
            reference: `Location/${departmentId}`,
            display: departmentName
          }
        }
      ],
      serviceProvider: {
        reference: `Organization/${process.env.SATUSEHAT_ORG_ID || '1000001'}`
      }
    };
  }
};
