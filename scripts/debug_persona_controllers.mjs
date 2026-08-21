import crypto from 'crypto';

async function testAllControllers() {
  const encId = '00000000-0000-0000-0000-000000000001';
  const patId = '00000000-0000-0000-0000-000000000001';

  // 1. SOAP
  const c1 = await import('../server/controllers/clinicalNotes.controller.js');
  const res1 = { status(c){this.c=c;return this;}, json(b){console.log('SOAP:', this.c, b?.success);return this;} };
  await c1.clinicalNotesController.recordSoap({
    user: { userId: 'DOC-01', role: 'ROLE_DOCTOR_DPJP' },
    headers: {},
    body: {
      encounterId: encId,
      patientId: patId,
      subjective: 'Test Subj',
      objective: 'Test Obj',
      assessment: 'Test Ass',
      plan: 'Test Plan'
    }
  }, res1);

  // 2. Triage
  const c2 = await import('../server/controllers/triage.controller.js');
  const res2 = { status(c){this.c=c;return this;}, json(b){console.log('TRIAGE:', this.c, b?.success);return this;} };
  await c2.triageController.recordAssessment({
    user: { userId: 'NURSE-01', role: 'ROLE_NURSE' },
    headers: {},
    body: {
      encounterId: encId,
      patientId: patId,
      triageCategory: 'ATS_2',
      chiefComplaint: 'Nyeri dada',
      systolic: 140,
      diastolic: 90,
      heartRate: 105,
      respiratoryRate: 22,
      temperature: 36.8,
      oxygenSaturation: 96
    }
  }, res2);

  // 3. Billing Deposit
  const c3 = await import('../server/controllers/patientFinancialAndRevenueCycle.controller.js');
  const res3 = { status(c){this.c=c;return this;}, json(b){console.log('DEPOSIT:', this.c, b?.success, b?.error);return this;} };
  await c3.patientFinancialAndRevenueCycleController.recordDeposit({
    user: { userId: 'CASHIER-01', role: 'ROLE_CASHIER' },
    headers: {},
    body: {
      encounterId: encId,
      patientId: patId,
      amount: 2500000,
      paymentMethod: 'QRIS',
      notes: 'Deposit test'
    }
  }, res3);

  // 4. Lab
  const c4 = await import('../server/controllers/laboratory.controller.js');
  const res4 = { status(c){this.c=c;return this;}, json(b){console.log('LAB:', this.c, b?.success, b?.error);return this;} };
  await c4.laboratoryController.generateSpecimens({
    user: { userId: 'LAB-01', role: 'ROLE_LAB_ANALYST' },
    headers: {},
    body: {
      orderId: crypto.randomUUID(),
      encounterId: encId,
      patientId: patId,
      items: [{ itemCode: 'LAB-TROP-I', testName: 'Troponin I' }]
    }
  }, res4);

  // 5. Casemix Coding
  const c5 = await import('../server/controllers/clinicalCodingAndCasemix.controller.js');
  const res5 = { status(c){this.c=c;return this;}, json(b){console.log('CASEMIX:', this.c, b?.success, b?.error);return this;} };
  await c5.clinicalCodingAndCasemixController.recordCoding({
    user: { userId: 'CODER-01', role: 'ROLE_MEDICAL_RECORD_OFFICER' },
    headers: {},
    body: {
      encounterId: encId,
      patientId: patId,
      primaryDiagnosis: { code: 'I21.0', description: 'STEMI' },
      secondaryDiagnoses: [],
      procedures: []
    }
  }, res5);

  process.exit(0);
}
testAllControllers();
