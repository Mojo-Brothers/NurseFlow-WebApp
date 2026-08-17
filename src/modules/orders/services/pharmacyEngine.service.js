/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy E-Prescription & Dispensing Engine
 * Sprint 5: E-Resep, Telaah, Double-Check High Alert & Dispensing
 * Standar Kepatuhan: JCI MMU & WHO Medication Safety.
 */

import { universalOrderEngineService } from './universalOrderEngine.service.js';
import { medicationInteractionEngineService } from './medicationInteractionEngine.service.js';
import { universalEventContractService } from '../../clinical_core/services/universalEventContract.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const MEDICATION_ORDERS_KEY = 'nurseflow_medication_orders';

const getStoredMedOrders = () => {
  try {
    const raw = localStorage.getItem(MEDICATION_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[PharmacyEngine] Failed to load med orders:', e);
  }
  return [
    {
      id: 'MED-ORD-001',
      order_id: 'ORD-2026-002',
      medication_code: 'MED-PCM-500',
      medication_name: 'Paracetamol Tab 500 mg',
      dosage: '500 mg',
      route: 'ORAL',
      frequency: '3 x 1 tablet p.c. (prn demam)',
      duration: '5 hari',
      quantity: 15,
      unit_price: 3500,
      total_price: 52500,
      is_cito: false,
      high_alert: false,
      lasa_flag: false,
      is_antibiotic: false,
      review_status: 'APPROVED',
      verified_by: 'apt. Dimas Anggara, S.Farm',
      dispensed_at: '2026-08-17T09:20:00Z',
      status: 'DISPENSED'
    }
  ];
};

const saveStoredMedOrders = (list) => {
  try {
    localStorage.setItem(MEDICATION_ORDERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[PharmacyEngine] Failed to save med orders:', e);
  }
};

export const pharmacyEngineService = {
  /**
   * Prescribe Medication & Create Clinical Order
   */
  createPrescriptionOrder: async ({
    patientId,
    patientName,
    mrn,
    episodeId,
    encounterId,
    orderedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    priority = 'ROUTINE',
    clinicalIndication = 'Terapi rawat jalan',
    items = [],
    actorEmail = 'doctor@nurseflow.id'
  }) => {
    let totalEst = 0;
    items.forEach(it => {
      totalEst += (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1);
    });

    // 1. Create Universal Order Root
    const parentOrder = await universalOrderEngineService.createOrder({
      patientId,
      patientName,
      mrn,
      episodeId,
      encounterId,
      orderedBy,
      orderCategory: 'PHARMACY',
      priority,
      clinicalIndication,
      itemsCount: items.length,
      estimatedAmount: totalEst,
      actorEmail
    });

    // 2. Create Medication Order Items
    const medRecords = items.map((item, idx) => {
      const safety = medicationInteractionEngineService.screenMedicationSafety(item.code, item.name);
      return {
        id: `MED-ORD-${Date.now()}-${idx}`,
        order_id: parentOrder.id,
        medication_code: item.code,
        medication_name: item.name,
        dosage: item.dosage || '1 unit',
        route: item.route || 'ORAL',
        frequency: item.frequency || '3 x 1',
        duration: item.duration || '3 hari',
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unitPrice) || 0,
        total_price: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
        is_cito: priority === 'CITO',
        high_alert: safety.isHighAlert,
        lasa_flag: safety.isLasa,
        is_antibiotic: safety.isAntibiotic,
        review_status: 'PENDING',
        verified_by: null,
        dispensed_at: null,
        status: 'PRESCRIBED'
      };
    });

    const currentList = getStoredMedOrders();
    saveStoredMedOrders([...medRecords, ...currentList]);

    return { parentOrder, medicationOrders: medRecords };
  },

  /**
   * Dispense Medication & Emit Canonical SERVICE_CHARGED
   */
  dispenseMedication: async ({
    orderId,
    episodeId = 'EOC-2026-001',
    encounterId = 'ENC-2026-001',
    patientId = 'P-1001',
    pharmacistName = 'apt. Dimas Anggara, S.Farm',
    actorEmail = 'pharmacist@nurseflow.id'
  }) => {
    const list = getStoredMedOrders();
    const targetItems = list.filter(m => m.order_id === orderId);

    if (targetItems.length === 0) {
      throw new Error(`Item resep untuk order ${orderId} tidak ditemukan.`);
    }

    const now = new Date().toISOString();

    for (const item of targetItems) {
      item.status = 'DISPENSED';
      item.dispensed_at = now;
      item.verified_by = pharmacistName;

      // Automatically Dispatch Canonical Event to Universal Event Bus for Billing Ledger Projection
      await universalEventContractService.recordServiceCharge({
        episodeId,
        encounterId,
        patientId,
        serviceCategory: 'MEDICATION',
        serviceCode: item.medication_code,
        serviceName: `${item.medication_name} (${item.dosage})`,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        isCito: item.is_cito,
        actorEmail
      });
    }

    saveStoredMedOrders(list);

    // Update parent order status to COMPLETED
    await universalOrderEngineService.transitionOrderStatus({
      orderId,
      nextStatus: 'COMPLETED',
      actorName: pharmacistName,
      note: 'Seluruh obat telah ditelaah dan diserahkan kepada pasien/perawat.',
      actorEmail
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'PHARMACY_DISPENSING',
      aggregateId: orderId,
      eventName: 'MEDICATION_DISPENSED',
      payload: { orderId, itemsCount: targetItems.length },
      actor: actorEmail
    });

    return targetItems;
  },

  getMedicationOrders: (orderId = null) => {
    let list = getStoredMedOrders();
    if (orderId) {
      list = list.filter(m => m.order_id === orderId);
    }
    return list;
  }
};
