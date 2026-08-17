import { describe, it, expect } from 'vitest';
import { patientRepository } from '../src/core/repositories/patientRepository.js';
import { triageEngineService } from '../src/modules/emergency/services/triageEngine.service.js';
import { cdssEngineService } from '../src/modules/emr/services/cdssEngine.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';
import { billingEngineService } from '../src/modules/billing/services/billingEngine.service.js';
import { clinicalWebSocketBroker } from '../server/realtime/clinicalWebSocket.js';

describe('🏥 E2E Hospital Patient Journey (Pendaftaran ➔ Triase ➔ EMR ➔ Order ➔ Dispense ➔ Billing)', () => {
  let patientId = 'P-E2E-001';
  let encounterId = 'ENC-E2E-001';
  let episodeId = 'EOC-E2E-001';
  let receivedWsEvents = [];

  it('Step 1: Patient Admission & WebSocket Broadcast', async () => {
    // Subscribe to IGD channel
    clinicalWebSocketBroker.subscribe('IGD_TRIAGE', 'TEST_LISTENER', (msg) => {
      receivedWsEvents.push(msg);
    });

    const patient = await patientRepository.create({
      id: patientId,
      mrn: 'MRN-2026-999001',
      nik: '3171099908890001',
      full_name: 'Bpk. Hendra Gunawan, S.T.',
      birth_date: '1982-04-12',
      gender: 'MALE',
      phone_number: '081122334455',
      address_line: 'Jl. Sudirman Kav. 21, Jakarta'
    });

    expect(patient.mrn).toBe('MRN-2026-999001');

    // Broadcast admission via WebSocket
    clinicalWebSocketBroker.publish('IGD_TRIAGE', 'PATIENT_ARRIVED', { patientId: patient.id, name: patient.full_name });
    expect(receivedWsEvents).toHaveLength(1);
    expect(receivedWsEvents[0].eventName).toBe('PATIENT_ARRIVED');
  });

  it('Step 2: Emergency Triage ATS Assessment', () => {
    const triageResult = triageEngineService.classifySeverity({
      airwayStatus: 'PATENT',
      breathingStatus: 'NORMAL',
      circulationStatus: 'NORMAL',
      spo2: 98,
      heartRate: 78,
      gcsTotal: 15,
      painScale: 3
    });

    expect(triageResult.code).toBe('P4_SEMI_URGENT');
    expect(triageResult.targetMinutes).toBe(60);
  });

  it('Step 3: CPOE Universal Order Entry & CDSS Prescribing Screening', async () => {
    // Run CDSS Renal & Drug-Allergy check
    const cdssResult = await cdssEngineService.evaluatePrescriptionSafeguards({
      encounterId,
      patientId,
      prescribedDrugName: 'Paracetamol 500mg',
      patientEgfr: 90,
      activeMedications: []
    });

    expect(cdssResult.hasCriticalBlock).toBe(false);

    // Create Universal Clinical Order
    const order = await universalOrderEngineService.createOrder({
      patientId,
      patientName: 'Bpk. Hendra Gunawan, S.T.',
      mrn: 'MRN-2026-999001',
      episodeId,
      encounterId,
      orderedBy: 'dr. Siti Wijaya, Sp.PD-KGEH',
      orderCategory: 'PHARMACY',
      priority: 'ROUTINE',
      clinicalIndication: 'Antipiretik & analgetik ringan',
      itemsCount: 1,
      estimatedAmount: 35000
    });

    expect(order.status).toBe('ORDERED');
    expect(order.order_number).toBeDefined();
  });

  it('Step 4: Billing Invoice Generation & Settlement', async () => {
    const invoice = await billingEngineService.generateInvoice({
      episodeId,
      patientId,
      patientName: 'Bpk. Hendra Gunawan, S.T.',
      guarantorType: 'UMUM',
      cashierName: 'Kasir Utama'
    });

    expect(invoice.invoice_number).toBeDefined();
    expect(invoice.payment_status).toBe('ISSUED');

    const settled = await billingEngineService.settlePayment({
      invoiceId: invoice.id,
      paymentMethod: 'QRIS',
      paidAmount: invoice.patient_payable
    });

    expect(settled.payment_status).toBe('SETTLED');
  });
});
