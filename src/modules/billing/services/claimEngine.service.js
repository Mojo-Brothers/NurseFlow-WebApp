/**
 * ClaimEngine — Intelligence layer for insurance claims.
 * Validates clinical documentation against payer rules to ensure successful reimbursement.
 */

const PAYER_RULES = {
  BPJS: {
    PROCEDURES: {
      'p1': { required_icd10: ['Z01.1'], medication_restricted: ['m3'] },
      'SURGERY_A': { required_icd10: ['K35.8'], needs_doctor_signature: true }
    }
  }
};

export const validateClaimReadiness = (encounterData, soapData) => {
  const issues = [];
  
  // 1. Check for Missing ICD-10
  if (!soapData.assessment || !soapData.assessment.includes('.')) {
    issues.push({ level: 'CRITICAL', msg: 'Missing or Invalid ICD-10 Diagnosis code' });
  }

  // 2. Cross-reference Procedures vs Diagnosis (Simulated)
  const medications = soapData.plan_medications || [];
  const highAlertMeds = medications.filter(m => m.route === 'IV');
  
  if (highAlertMeds.length > 0 && (!soapData.assessment || soapData.assessment.length < 5)) {
    issues.push({ level: 'WARNING', msg: 'High-cost IV meds ordered without detailed ICD-10 justification' });
  }

  // 3. Signature Verification
  if (soapData.status !== 'SIGNED') {
    issues.push({ level: 'CRITICAL', msg: 'Clinical documentation not yet Signed by Physician' });
  }

  const score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 30));

  return {
    ready: issues.filter(i => i.level === 'CRITICAL').length === 0,
    score,
    issues,
    payer: 'BPJS / Social Health Insurance'
  };
};

export const autoGenerateClaimForm = (encounter, soap) => {
  return {
    claimId: `CL-${Date.now()}`,
    patientName: encounter.patient_name,
    admissionDate: encounter.admitted_at,
    diagnosis: soap.assessment,
    medications: soap.plan_medications.map(m => m.medication_name).join(', '),
    physician: soap.doctorEmail,
    status: 'DRAFT'
  };
};
