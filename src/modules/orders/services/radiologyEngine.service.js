/**
 * NurseFlow Enterprise HIS 2026 — Radiology Information System (RIS/PACS) Engine
 * Sprint 5: Image Acquisition, DICOM Study UID, Radiologist Expert Reporting & Billing
 * Standar Kepatuhan: DICOM 3.0, Permenkes 24/2022, SATUSEHAT DiagnosticReport.
 */

import { universalOrderEngineService } from './universalOrderEngine.service.js';
import { pacsBridgeService } from './pacsBridge.service.js';
import { universalEventContractService } from '../../clinical_core/services/universalEventContract.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const RAD_ORDERS_KEY = 'nurseflow_radiology_orders';

const getStoredRadOrders = () => {
  try {
    const raw = localStorage.getItem(RAD_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[RadiologyEngine] Failed to load rad orders:', e);
  }
  return [
    {
      id: 'RAD-ORD-001',
      order_id: 'ORD-2026-001',
      modality: 'XR',
      examination_name: 'Rontgen Thorax PA Portable Cito',
      dicom_study_uid: '1.2.840.113619.2.55.3.1771319200.481920',
      image_count: 2,
      radiologist_report: 'Cor dan Pulmo dalam batas normal. Tidak tampak infiltrat aktif/pneumonia.',
      radiologist_name: 'dr. Sp.Rad (Spesialis Radiologi)',
      validated_at: '2026-08-17T09:30:00Z',
      unit_price: 180000,
      result_status: 'RELEASED'
    }
  ];
};

const saveStoredRadOrders = (list) => {
  try {
    localStorage.setItem(RAD_ORDERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[RadiologyEngine] Failed to save rad orders:', e);
  }
};

export const radiologyEngineService = {
  /**
   * Create Radiology Order from Clinical EMR
   */
  createRadiologyOrder: async ({
    patientId,
    patientName,
    mrn,
    episodeId,
    encounterId,
    orderedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    priority = 'CITO',
    clinicalIndication = 'Evaluasi radiologis organ target',
    items = [],
    actorEmail = 'doctor@nurseflow.id'
  }) => {
    let totalEst = 0;
    items.forEach(it => {
      totalEst += Number(it.unitPrice) || 0;
    });

    // 1. Create Universal Order Root
    const parentOrder = await universalOrderEngineService.createOrder({
      patientId,
      patientName,
      mrn,
      episodeId,
      encounterId,
      orderedBy,
      orderCategory: 'RADIOLOGY',
      priority,
      clinicalIndication,
      itemsCount: items.length,
      estimatedAmount: totalEst,
      actorEmail
    });

    // 2. Create Radiology Order Item Records with DICOM Study UID
    const radRecords = items.map((item, idx) => ({
      id: `RAD-ORD-${Date.now()}-${idx}`,
      order_id: parentOrder.id,
      modality: item.modality || 'XR',
      examination_name: item.name,
      dicom_study_uid: pacsBridgeService.generateDicomStudyUid(item.modality),
      image_count: 0,
      radiologist_report: null,
      radiologist_name: null,
      validated_at: null,
      unit_price: Number(item.unitPrice) || 0,
      result_status: 'ORDERED'
    }));

    const currentList = getStoredRadOrders();
    saveStoredRadOrders([...radRecords, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'RADIOLOGY_ORDER',
      aggregateId: parentOrder.id,
      eventName: 'RAD_ORDER_CREATED',
      payload: { parentOrder, radRecords },
      actor: actorEmail
    });

    return { parentOrder, radiologyOrders: radRecords };
  },

  /**
   * Acquire Images on Modality / PACS
   */
  acquireImages: async ({ radOrderId, imageCount = 4 }) => {
    const list = getStoredRadOrders();
    const index = list.findIndex(r => r.id === radOrderId);
    if (index === -1) throw new Error(`Radiology item ${radOrderId} tidak ditemukan.`);

    const rad = list[index];
    rad.result_status = 'IMAGE_ACQUIRED';
    rad.image_count = imageCount;

    list[index] = rad;
    saveStoredRadOrders(list);
    return rad;
  },

  /**
   * Release Radiologist Expert Report & Emit Canonical SERVICE_CHARGED
   */
  releaseRadiologyReport: async ({
    radOrderId,
    episodeId = 'EOC-2026-001',
    encounterId = 'ENC-2026-001',
    patientId = 'P-1001',
    isCito = true,
    reportText = null,
    radiologistName = 'dr. Sp.Rad (Spesialis Radiologi)',
    actorEmail = 'radiology@nurseflow.id'
  }) => {
    const list = getStoredRadOrders();
    const index = list.findIndex(r => r.id === radOrderId);
    if (index === -1) throw new Error(`Radiology item ${radOrderId} tidak ditemukan.`);

    const rad = list[index];
    const finalReport = reportText || pacsBridgeService.generateStructuredReport(rad.modality, rad.examination_name);
    const now = new Date().toISOString();

    rad.radiologist_report = finalReport;
    rad.radiologist_name = radiologistName;
    rad.validated_at = now;
    rad.result_status = 'RELEASED';

    list[index] = rad;
    saveStoredRadOrders(list);

    // Automatically Dispatch Canonical Event to Universal Event Bus for Billing Ledger Projection
    await universalEventContractService.recordServiceCharge({
      episodeId,
      encounterId,
      patientId,
      serviceCategory: 'RADIOLOGY',
      serviceCode: rad.modality,
      serviceName: rad.examination_name,
      unitPrice: rad.unit_price,
      quantity: 1,
      isCito,
      actorEmail
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'RADIOLOGY_REPORT',
      aggregateId: rad.id,
      eventName: 'RAD_REPORT_RELEASED',
      payload: { ...rad, reportText: finalReport },
      actor: actorEmail
    });

    return rad;
  },

  getRadOrders: (orderId = null) => {
    let list = getStoredRadOrders();
    if (orderId) {
      list = list.filter(r => r.order_id === orderId);
    }
    return list;
  }
};
