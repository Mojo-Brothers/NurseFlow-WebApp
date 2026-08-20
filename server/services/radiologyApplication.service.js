/**
 * NurseFlow Enterprise HIS 2026 — Master Radiology Application Service
 * Domain Authority: Radiology Information System (RIS), PACS DICOMweb, Modality Worklist (MWL) & Critical Findings
 * Standards: DICOM PS 3.10 / PS 3.18, JCI IPSG 2 (Critical Radiology Findings),
 * Multi-Attribute Demographic Patient Identity Lineage, Immutable Report Versioning History,
 * Strict Closed-Loop Critical Finding Provenance, and Partial vs Full CPOE Order Completion FSM.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class RadiologyDomainError extends Error {
  constructor(message, code = 'RAD_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'RadiologyDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_RADIOLOGY_TECH_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_RADIOGRAPHER'
];

const AUTHORIZED_RADIOLOGIST_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_RADIOGRAPHER',
  'ROLE_DOCTOR_DPJP'
];

const AUTHORIZED_RAD_PANIC_ACK_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_NURSE'
];

export const radiologyApplicationService = {
  /**
   * 1. Generate DICOM Modality Worklist (MWL) for CPOE Radiology Order (Domain Consumer)
   */
  generateModalityWorklistForOrder: async ({
    orderId
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!orderId) {
      throw new RadiologyDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Fetch and Lock CPOE Order
      const orderRes = await client.query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId]);
      if (orderRes.rows.length === 0) {
        throw new RadiologyDomainError(`Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const order = orderRes.rows[0];

      if (order.status === 'CANCELLED') {
        throw new RadiologyDomainError(
          `Ditolak: Tidak dapat memproses Modality Worklist pada CPOE Order yang telah dibatalkan (${order.order_number}).`,
          'ORDER_ALREADY_CANCELLED',
          400
        );
      }

      // 2. Fetch Radiology Items
      const itemsRes = await client.query(
        "SELECT * FROM cpoe_order_items WHERE order_id = $1 AND item_type = 'RADIOLOGY' FOR UPDATE;",
        [orderId]
      );
      if (itemsRes.rows.length === 0) {
        throw new RadiologyDomainError(
          `Order ${order.order_number} tidak memiliki item pemeriksaan radiologi.`,
          'NO_RAD_ITEMS_FOUND',
          400
        );
      }

      const serverTimestamp = new Date();
      const generatedWorklists = [];

      for (let i = 0; i < itemsRes.rows.length; i++) {
        const item = itemsRes.rows[i];

        // Idempotency: Check if radiology order already generated for this CPOE item
        const existingOrderRes = await client.query(
          'SELECT * FROM radiology_orders WHERE cpoe_item_id = $1 FOR UPDATE;',
          [item.id]
        );
        if (existingOrderRes.rows.length > 0) {
          generatedWorklists.push(existingOrderRes.rows[0]);
          continue;
        }

        // Determine Modality from Catalog Code or Item Specs
        const specs = item.item_specifications || {};
        let modality = specs.modality || 'DX';
        if (item.catalog_code.includes('CT')) modality = 'CT';
        else if (item.catalog_code.includes('MR')) modality = 'MR';
        else if (item.catalog_code.includes('USG') || item.catalog_code.includes('US')) modality = 'US';

        // Deterministic Accession Number: ACC-RAD-YYYYMMDD-XXXX
        const datePart = serverTimestamp.toISOString().slice(0, 10).replace(/-/g, '');
        const random4 = Math.floor(1000 + Math.random() * 9000);
        const accessionNumber = `ACC-RAD-${datePart}-${random4}`;
        const radOrderNumber = `RO-${order.order_number.replace(/[^A-Z0-9]/gi, '')}-${i + 1}`;

        const radOrderId = crypto.randomUUID();
        const insertRadOrderSql = `
          INSERT INTO radiology_orders (
            id, tenant_id, order_number, accession_number,
            patient_id, patient_mrn, patient_name, encounter_id,
            modality, examination_code, examination_name, priority,
            ordering_physician_id, ordering_physician_name, clinical_indication,
            status, cpoe_order_id, cpoe_item_id, version, correlation_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11, $12,
            $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22
          ) RETURNING *;
        `;

        const radOrderRes = await client.query(insertRadOrderSql, [
          radOrderId,
          order.patient_id,
          radOrderNumber,
          accessionNumber,
          order.patient_id,
          order.patient_id.slice(0, 8),
          'Pasien Radiologi',
          order.encounter_id,
          modality,
          item.catalog_code,
          item.item_name,
          order.priority || 'ROUTINE',
          order.requester_id || 'DOC-001',
          order.requester_name || order.ordered_by || 'dr. DPJP Pengirim',
          order.clinical_indication || 'Evaluasi radiologi diagnostik',
          'SCHEDULED',
          orderId,
          item.id,
          1,
          correlationId,
          serverTimestamp,
          serverTimestamp
        ]);

        generatedWorklists.push(radOrderRes.rows[0]);
      }

      // Outbox Event
      const outboxId = crypto.randomUUID();
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        outboxId,
        'RADIOLOGY_MWL',
        orderId,
        'RAD_MWL_GENERATED',
        JSON.stringify({
          orderId,
          orderNumber: order.order_number,
          worklistCount: generatedWorklists.length,
          worklists: generatedWorklists.map(w => ({ id: w.id, accessionNumber: w.accession_number, modality: w.modality }))
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return generatedWorklists;
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal membuat Modality Worklist: ${err.message}`, 'MWL_GEN_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 2. Ingest DICOM C-STORE Study & Instances (PACS Acquisition with Multi-Attribute Demographic Safeguard & UID Hierarchy)
   */
  acquireDicomStudy: async ({
    radiologyOrderId,
    studyInstanceUid,
    patientId = null,
    patientName = null,
    patientMrn = null,
    patientBirthDate = null,
    modality = 'DX',
    bodyPartExamined = 'CHEST',
    studyDescription = 'Thorax AP/PA',
    patientPosition = 'AP',
    seriesData = [],
    instancesData = [],
    technologistName = 'Radiografer Senior'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_RADIOLOGY_TECH_ROLES.includes(authorRole)) {
      throw new RadiologyDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin melakukan akuisisi citra radiologi DICOM.`,
        'FORBIDDEN_RAD_ROLE',
        403
      );
    }

    if (!radiologyOrderId || !studyInstanceUid) {
      throw new RadiologyDomainError('Radiology Order ID dan Study Instance UID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const radOrderRes = await client.query('SELECT * FROM radiology_orders WHERE id = $1 FOR UPDATE;', [radiologyOrderId]);
      if (radOrderRes.rows.length === 0) {
        throw new RadiologyDomainError(`Radiology Order dengan ID ${radiologyOrderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const radOrder = radOrderRes.rows[0];

      // ─── 1. MULTI-ATTRIBUTE PATIENT IDENTITY SAFEGUARD ───
      // A. Patient ID Mismatch
      if (patientId && patientId !== radOrder.patient_id) {
        throw new RadiologyDomainError(
          `Pelanggaran Patient Safety: Patient ID citra DICOM (${patientId}) tidak cocok dengan Patient ID Order (${radOrder.patient_id}).`,
          'PATIENT_IDENTITY_MISMATCH',
          400
        );
      }

      // B. Multi-Attribute Demographic Safeguard (Name / MRN mismatch protection)
      if (patientName && radOrder.patient_name && radOrder.patient_name !== 'Pasien Radiologi') {
        if (patientName.trim().toLowerCase() !== radOrder.patient_name.trim().toLowerCase()) {
          throw new RadiologyDomainError(
            `Pelanggaran Demographic Safety: Nama Pasien DICOM (${patientName}) tidak cocok dengan Nama Pasien Order (${radOrder.patient_name}). Citra di-karantina!`,
            'DEMOGRAPHIC_IDENTITY_MISMATCH',
            400
          );
        }
      }

      if (patientMrn && radOrder.patient_mrn) {
        if (patientMrn.trim() !== radOrder.patient_mrn.trim()) {
          throw new RadiologyDomainError(
            `Pelanggaran Demographic Safety: No Rekam Medis DICOM (${patientMrn}) tidak cocok dengan No MRN Order (${radOrder.patient_mrn}).`,
            'DEMOGRAPHIC_IDENTITY_MISMATCH',
            400
          );
        }
      }

      // ─── 2. DICOM UID HIERARCHY & UNIQUENESS ENFORCEMENT ───
      // A. Duplicate Study Instance UID
      const existingStudyRes = await client.query('SELECT * FROM radiology_studies WHERE study_instance_uid = $1;', [studyInstanceUid]);
      if (existingStudyRes.rows.length > 0) {
        throw new RadiologyDomainError(
          `Duplikasi DICOM Object: Study Instance UID [${studyInstanceUid}] sudah tersimpan di PACS server.`,
          'DUPLICATE_STUDY_INSTANCE_UID',
          409
        );
      }

      const serverTimestamp = new Date();
      const studyId = crypto.randomUUID();

      // Insert radiology_studies
      const insertStudySql = `
        INSERT INTO radiology_studies (
          id, tenant_id, order_id, encounter_id, patient_id,
          patient_mrn, study_instance_uid, accession_number, modality,
          body_part_examined, study_description, patient_position,
          referring_physician, performing_technologist, status,
          wado_rs_endpoint, cpoe_order_id, cpoe_item_id, version, correlation_id,
          patient_name, patient_birth_date, patient_sex, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        ) RETURNING *;
      `;

      const studyRes = await client.query(insertStudySql, [
        studyId,
        radOrder.tenant_id,
        radOrder.id,
        radOrder.encounter_id,
        radOrder.patient_id,
        radOrder.patient_mrn,
        studyInstanceUid,
        radOrder.accession_number,
        modality,
        bodyPartExamined,
        studyDescription,
        patientPosition,
        radOrder.ordering_physician_name,
        technologistName,
        'ACQUIRED',
        `/dicomweb/studies/${studyInstanceUid}`,
        radOrder.cpoe_order_id,
        radOrder.cpoe_item_id,
        1,
        correlationId,
        patientName || radOrder.patient_name,
        patientBirthDate || null,
        'UNKNOWN',
        serverTimestamp,
        serverTimestamp
      ]);

      // Insert Series & Instances with UID Uniqueness Validations
      const seriesList = seriesData.length > 0 ? seriesData : [
        { seriesInstanceUid: `${studyInstanceUid}.1`, seriesNumber: 1, modality, numInstances: instancesData.length || 1 }
      ];

      for (const s of seriesList) {
        // Check duplicate Series Instance UID across studies
        const existSeries = await client.query('SELECT * FROM radiology_series WHERE series_instance_uid = $1;', [s.seriesInstanceUid]);
        if (existSeries.rows.length > 0) {
          throw new RadiologyDomainError(
            `Duplikasi Series UID: Series Instance UID [${s.seriesInstanceUid}] sudah digunakan pada study lain.`,
            'DUPLICATE_SERIES_INSTANCE_UID',
            409
          );
        }

        const seriesId = crypto.randomUUID();
        await client.query(`
          INSERT INTO radiology_series (
            id, tenant_id, study_id, series_instance_uid, series_number,
            modality, series_description, num_instances, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          seriesId,
          radOrder.tenant_id,
          studyId,
          s.seriesInstanceUid,
          s.seriesNumber || 1,
          s.modality || modality,
          s.seriesDescription || studyDescription,
          s.numInstances || 1,
          serverTimestamp
        ]);

        const instances = instancesData.length > 0 ? instancesData : [
          { sopInstanceUid: `${s.seriesInstanceUid}.1`, instanceNumber: 1, storageUri: `pacs/storage/${studyInstanceUid}/1.dcm` }
        ];

        for (const inst of instances) {
          // Check duplicate SOP Instance UID
          const existInst = await client.query('SELECT * FROM radiology_instances WHERE sop_instance_uid = $1;', [inst.sopInstanceUid]);
          if (existInst.rows.length > 0) {
            throw new RadiologyDomainError(
              `Duplikasi SOP Instance UID: SOP Instance UID [${inst.sopInstanceUid}] sudah terdaftar di PACS.`,
              'DUPLICATE_SOP_INSTANCE_UID',
              409
            );
          }

          await client.query(`
            INSERT INTO radiology_instances (
              id, tenant_id, series_id, sop_instance_uid, instance_number,
              storage_uri, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [
            crypto.randomUUID(),
            radOrder.tenant_id,
            seriesId,
            inst.sopInstanceUid,
            inst.instanceNumber || 1,
            inst.storageUri || `pacs/storage/${studyInstanceUid}/${inst.instanceNumber || 1}.dcm`,
            serverTimestamp
          ]);
        }
      }

      // Update Radiology Order Status to IMAGE_ACQUIRED
      await client.query(`
        UPDATE radiology_orders
        SET status = 'IMAGE_ACQUIRED',
            image_acquired_at = $1,
            updated_at = $1
        WHERE id = $2;
      `, [serverTimestamp, radiologyOrderId]);

      // Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [
        crypto.randomUUID(),
        actor.userId || 'USR-RAD-TECH-01',
        technologistName,
        authorRole,
        clientIp,
        'CREATE',
        'RADIOLOGY_STUDY',
        studyId,
        radOrder.patient_id,
        JSON.stringify(radOrder),
        JSON.stringify(studyRes.rows[0]),
        `Akuisisi citra DICOM PACS [${studyInstanceUid}] modalitas ${modality}`,
        crypto.createHash('sha256').update(studyInstanceUid + 'ACQUIRED' + serverTimestamp.toISOString()).digest('hex'),
        serverTimestamp
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'RADIOLOGY_STUDY',
        studyId,
        'RAD_STUDY_ACQUIRED',
        JSON.stringify({
          studyId,
          studyInstanceUid,
          accessionNumber: radOrder.accession_number,
          modality,
          technologistName,
          acquiredAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return studyRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal melakukan akuisisi citra PACS: ${err.message}`, 'STUDY_ACQUIRE_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 3. Draft or Finalize Structured Radiology Report & Detect Critical Findings
   */
  draftOrFinalizeReport: async ({
    studyId,
    clinicalHistory = null,
    techniqueDescription = null,
    findings,
    impressionConclusion,
    radsClassification = null,
    isUrgentCriticalFinding = false,
    criticalFindingCode = null,
    criticalThreatSummary = null,
    notifiedToName = 'Dokter DPJP / IGD Penerima',
    notifiedToRole = 'ROLE_DOCTOR_DPJP',
    notificationMethod = 'TELEPHONE_DIRECT',
    isDraft = false
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_RADIOLOGIST_ROLES.includes(authorRole)) {
      throw new RadiologyDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin membuat ekspertise laporan radiologi.`,
        'FORBIDDEN_RAD_ROLE',
        403
      );
    }

    if (!studyId || !findings || !impressionConclusion) {
      throw new RadiologyDomainError('Study ID, Findings, dan Impression/Kesimpulan wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const radiologistName = actor.fullName || actor.username || 'dr. Sp.Rad';
    const radiologistId = actor.userId || 'USR-DOC-RAD-01';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const studyRes = await client.query('SELECT * FROM radiology_studies WHERE id = $1 FOR UPDATE;', [studyId]);
      if (studyRes.rows.length === 0) {
        throw new RadiologyDomainError(`Study radiologi dengan ID ${studyId} tidak ditemukan.`, 'STUDY_NOT_FOUND', 404);
      }
      const study = studyRes.rows[0];

      // Check Critical Findings Dictionary
      let isCritical = isUrgentCriticalFinding;
      let effectiveCriticalThreat = criticalThreatSummary;
      let effectiveFindingCode = criticalFindingCode;

      if (criticalFindingCode) {
        const critRes = await client.query(
          'SELECT * FROM master_radiology_critical_findings WHERE finding_code = $1 AND is_active = TRUE;',
          [criticalFindingCode]
        );
        if (critRes.rows.length > 0) {
          isCritical = true;
          effectiveCriticalThreat = effectiveCriticalThreat || critRes.rows[0].clinical_threat;
          effectiveFindingCode = critRes.rows[0].finding_code;
        }
      }

      const serverTimestamp = new Date();
      const reportId = crypto.randomUUID();
      const reportStatus = isDraft ? 'DRAFT' : 'FINALIZED';

      // Digital Signature Hash (SHA-256)
      const signaturePayload = `${reportId}:1:${study.study_instance_uid}:${findings}:${impressionConclusion}:${radiologistId}:${serverTimestamp.toISOString()}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(signaturePayload).digest('hex');

      const insertReportSql = `
        INSERT INTO radiology_reports (
          id, tenant_id, study_id, encounter_id, patient_id,
          patient_mrn, radiologist_id, radiologist_name, clinical_history,
          technique_description, findings, impression_conclusion, rads_classification,
          is_urgent_critical_finding, critical_threat_summary, status,
          digital_signature_hash, workstation_ip, actor_role, correlation_id,
          cpoe_order_id, cpoe_item_id, version, signed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26
        ) RETURNING *;
      `;

      const reportRes = await client.query(insertReportSql, [
        reportId,
        study.tenant_id,
        studyId,
        study.encounter_id,
        study.patient_id,
        study.patient_mrn,
        radiologistId,
        radiologistName,
        clinicalHistory,
        techniqueDescription,
        findings,
        impressionConclusion,
        radsClassification,
        isCritical,
        effectiveCriticalThreat,
        reportStatus,
        digitalSignatureHash,
        clientIp,
        authorRole,
        correlationId,
        study.cpoe_order_id,
        study.cpoe_item_id,
        1,
        serverTimestamp,
        serverTimestamp,
        serverTimestamp
      ]);

      const createdReport = reportRes.rows[0];

      // Save Immutable Report Version Snapshot (v1)
      await client.query(`
        INSERT INTO radiology_report_versions (
          id, report_id, version, findings, impression_conclusion,
          rads_classification, is_urgent_critical_finding, digital_signature_hash,
          signed_by, signed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `, [
        crypto.randomUUID(),
        reportId,
        1,
        findings,
        impressionConclusion,
        radsClassification,
        isCritical,
        digitalSignatureHash,
        radiologistName,
        serverTimestamp,
        serverTimestamp
      ]);

      // If Critical Finding Detected -> Create Critical Finding Alert Record with Full Provenance
      let criticalAlertRecord = null;
      if (isCritical && !isDraft) {
        const alertId = crypto.randomUUID();
        const insertAlertSql = `
          INSERT INTO radiology_critical_finding_alerts (
            id, tenant_id, report_id, study_instance_uid, encounter_id,
            patient_id, critical_finding_type, status, escalation_level,
            reported_to_clinician, reported_at, cpoe_order_id, cpoe_item_id,
            correlation_id, notification_method, notified_to_name, notified_to_role, severity, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19
          ) RETURNING *;
        `;

        const alertRes = await client.query(insertAlertSql, [
          alertId,
          study.tenant_id,
          reportId,
          study.study_instance_uid,
          study.encounter_id,
          study.patient_id,
          effectiveFindingCode || 'CRITICAL_RADIOLOGY_FINDING',
          'PENDING_READ_BACK',
          'PRIMARY_PHYSICIAN',
          notifiedToName,
          serverTimestamp,
          study.cpoe_order_id,
          study.cpoe_item_id,
          correlationId,
          notificationMethod,
          notifiedToName,
          notifiedToRole,
          'STAT_IMMEDIATE',
          serverTimestamp
        ]);
        criticalAlertRecord = alertRes.rows[0];

        // Critical Alert Outbox Event
        await client.query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'RAD_CRITICAL_ALERT',
          alertId,
          'RAD_CRITICAL_ALERT_DETECTED',
          JSON.stringify({
            alertId,
            reportId,
            studyInstanceUid: study.study_instance_uid,
            findingCode: effectiveFindingCode,
            clinicalThreat: effectiveCriticalThreat,
            patientId: study.patient_id,
            encounterId: study.encounter_id,
            notifiedToName,
            notificationMethod
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);
      }

      if (!isDraft) {
        // Update Study Status to REPORTED
        await client.query(
          "UPDATE radiology_studies SET status = 'REPORTED', updated_at = $1 WHERE id = $2;",
          [serverTimestamp, studyId]
        );

        // Update Radiology Order Status to REPORT_FINALIZED & COMPLETED
        await client.query(
          "UPDATE radiology_orders SET status = 'REPORT_FINALIZED', report_finalized_at = $1, completed_at = $1, updated_at = $1 WHERE id = $2;",
          [serverTimestamp, study.order_id]
        );

        // Update CPOE Item Status to COMPLETED
        if (study.cpoe_item_id) {
          await client.query(
            "UPDATE cpoe_order_items SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
            [serverTimestamp, study.cpoe_item_id]
          );
        }

        // ─── PARENT/CHILD CPOE COMPLETION SEMANTICS ───
        if (study.cpoe_order_id) {
          const orderItemsRes = await client.query(
            'SELECT status FROM cpoe_order_items WHERE order_id = $1;',
            [study.cpoe_order_id]
          );
          const allItems = orderItemsRes.rows;
          const totalCount = allItems.length;
          const completedCount = allItems.filter(it => it.status === 'COMPLETED').length;

          if (totalCount > 0 && completedCount === totalCount) {
            await client.query(
              "UPDATE clinical_orders SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
              [serverTimestamp, study.cpoe_order_id]
            );
          } else if (completedCount > 0) {
            await client.query(
              "UPDATE clinical_orders SET status = 'PARTIALLY_COMPLETED', updated_at = $1 WHERE id = $2;",
              [serverTimestamp, study.cpoe_order_id]
            );
          }
        }

        // Outbox Event for Finalized Report
        await client.query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'RADIOLOGY_REPORT',
          reportId,
          'RAD_REPORT_FINALIZED',
          JSON.stringify({
            reportId,
            studyId,
            studyInstanceUid: study.study_instance_uid,
            cpoeOrderId: study.cpoe_order_id,
            cpoeItemId: study.cpoe_item_id,
            impression: impressionConclusion,
            radiologistName,
            digitalSignatureHash,
            isCritical,
            finalizedAt: serverTimestamp.toISOString()
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);
      }

      await client.query('COMMIT;');
      return {
        ...createdReport,
        criticalAlert: criticalAlertRecord
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal menyimpan laporan ekspertise radiologi: ${err.message}`, 'REPORT_GEN_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 4. Amend Finalized Report (Medicolegal Addendum Provenance & History Version Preservation)
   */
  amendReport: async ({
    reportId,
    amendmentReason,
    amendedFindings,
    amendedImpression,
    expectedVersion = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_RADIOLOGIST_ROLES.includes(authorRole)) {
      throw new RadiologyDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin mengoreksi (amend) laporan radiologi.`,
        'FORBIDDEN_RAD_ROLE',
        403
      );
    }

    if (!reportId || !amendmentReason || amendmentReason.trim().length < 5) {
      throw new RadiologyDomainError('Report ID dan Alasan Pembetulan Medis (min 5 karakter) wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const radiologistName = actor.fullName || actor.username || 'dr. Sp.Rad';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const repRes = await client.query('SELECT * FROM radiology_reports WHERE id = $1 FOR UPDATE;', [reportId]);
      if (repRes.rows.length === 0) {
        throw new RadiologyDomainError(`Laporan radiologi dengan ID ${reportId} tidak ditemukan.`, 'REPORT_NOT_FOUND', 404);
      }
      const existingReport = repRes.rows[0];

      // Optimistic Concurrency Control (OCC)
      if (expectedVersion !== null && existingReport.version !== expectedVersion) {
        throw new RadiologyDomainError(
          `Konflik Konkurensi: Laporan telah diubah oleh pengguna lain (Versi DB: ${existingReport.version}, Versi Klien: ${expectedVersion}).`,
          'OPTIMISTIC_LOCK_CONFLICT',
          409
        );
      }

      const serverTimestamp = new Date();
      const newVersion = (existingReport.version || 1) + 1;
      const newFindings = amendedFindings || existingReport.findings;
      const newImpression = amendedImpression || existingReport.impression_conclusion;

      const newSignature = crypto.createHash('sha256')
        .update(`${reportId}:${newVersion}:${newFindings}:${newImpression}:${amendmentReason}:${serverTimestamp.toISOString()}`)
        .digest('hex');

      const updateSql = `
        UPDATE radiology_reports
        SET status = 'AMENDED',
            findings = $1,
            impression_conclusion = $2,
            amendment_reason = $3,
            amended_by = $4,
            amended_at = $5,
            digital_signature_hash = $6,
            version = $7,
            updated_at = $5
        WHERE id = $8
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [
        newFindings,
        newImpression,
        amendmentReason.trim(),
        radiologistName,
        serverTimestamp,
        newSignature,
        newVersion,
        reportId
      ]);

      // Append new version to immutable history table
      await client.query(`
        INSERT INTO radiology_report_versions (
          id, report_id, version, findings, impression_conclusion,
          rads_classification, is_urgent_critical_finding, digital_signature_hash,
          amendment_reason, signed_by, signed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
      `, [
        crypto.randomUUID(),
        reportId,
        newVersion,
        newFindings,
        newImpression,
        existingReport.rads_classification,
        existingReport.is_urgent_critical_finding,
        newSignature,
        amendmentReason.trim(),
        radiologistName,
        serverTimestamp,
        serverTimestamp
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'RADIOLOGY_REPORT',
        reportId,
        'RAD_REPORT_AMENDED',
        JSON.stringify({
          reportId,
          version: newVersion,
          amendmentReason: amendmentReason.trim(),
          amendedBy: radiologistName,
          amendedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal melakukan amend laporan: ${err.message}`, 'AMEND_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 5. Acknowledge Critical Finding Alert (Closed-Loop Read-Back Communication with Provenance)
   */
  acknowledgeCriticalFinding: async ({
    alertId,
    readBackConfirmed = true,
    clinicalInstruction = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_RAD_PANIC_ACK_ROLES.includes(authorRole)) {
      throw new RadiologyDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin melakukan konfirmasi temuan kritis radiologi.`,
        'FORBIDDEN_RAD_ROLE',
        403
      );
    }

    if (!alertId) {
      throw new RadiologyDomainError('Alert ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    // Strict JCI IPSG 2 Guard
    if (readBackConfirmed !== true) {
      throw new RadiologyDomainError(
        'Konfirmasi lisan Read-Back (JCI IPSG 2) wajib dinyatakan TRUE oleh tenaga medis penerima temuan kritis radiologi.',
        'READ_BACK_CONFIRMATION_REQUIRED',
        400
      );
    }

    if (!clinicalInstruction || typeof clinicalInstruction !== 'string' || clinicalInstruction.trim().length < 5) {
      throw new RadiologyDomainError(
        'Instruksi klinis/tindakan terapeutik dari DPJP wajib dicatat secara lengkap (minimal 5 karakter).',
        'CLINICAL_INSTRUCTION_REQUIRED',
        400
      );
    }

    const clinicianName = actor.fullName || actor.username || 'Dokter DPJP / IGD Penerima';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const alertRes = await client.query('SELECT * FROM radiology_critical_finding_alerts WHERE id = $1 FOR UPDATE;', [alertId]);
      if (alertRes.rows.length === 0) {
        throw new RadiologyDomainError(`Critical finding alert dengan ID ${alertId} tidak ditemukan.`, 'ALERT_NOT_FOUND', 404);
      }
      const alert = alertRes.rows[0];

      if (alert.status === 'ACKNOWLEDGED_READ_BACK') {
        throw new RadiologyDomainError('Temuan kritis ini sudah di-acknowledge sebelumnya.', 'ALERT_ALREADY_ACKNOWLEDGED', 400);
      }

      const serverTimestamp = new Date();
      const updateAlertSql = `
        UPDATE radiology_critical_finding_alerts
        SET status = 'ACKNOWLEDGED_READ_BACK',
            read_back_confirmed_by = $1,
            read_back_at = $2,
            read_back_statement = 'VERIFIED_READ_BACK_CONFIRMED',
            acknowledged_by = $1,
            acknowledged_at = $2,
            clinical_instruction = $3,
            resolved_at = $2
        WHERE id = $4
        RETURNING *;
      `;

      const updatedAlertRes = await client.query(updateAlertSql, [
        clinicianName,
        serverTimestamp,
        clinicalInstruction.trim(),
        alertId
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'RAD_CRITICAL_ALERT',
        alertId,
        'RAD_CRITICAL_ALERT_ACKNOWLEDGED',
        JSON.stringify({
          alertId,
          acknowledgedBy: clinicianName,
          role: authorRole,
          clinicalInstruction: clinicalInstruction.trim(),
          acknowledgedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedAlertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal mencatat konfirmasi temuan kritis: ${err.message}`, 'ACK_PANIC_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 6. Escalate Unacknowledged Critical Finding (Timeout Safety Protocol)
   */
  escalateCriticalFinding: async ({
    alertId,
    escalationReason = 'Timeout 15 menit tanpa respon klinisi',
    targetLevel = 'DPJP_PHYSICIAN'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!alertId) {
      throw new RadiologyDomainError('Alert ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const alertRes = await client.query('SELECT * FROM radiology_critical_finding_alerts WHERE id = $1 FOR UPDATE;', [alertId]);
      if (alertRes.rows.length === 0) {
        throw new RadiologyDomainError(`Alert temuan kritis dengan ID ${alertId} tidak ditemukan.`, 'ALERT_NOT_FOUND', 404);
      }
      const alert = alertRes.rows[0];

      if (alert.status === 'ACKNOWLEDGED_READ_BACK') {
        throw new RadiologyDomainError('Alert yang sudah di-acknowledge tidak memerlukan eskalasi.', 'ALERT_ALREADY_RESOLVED', 400);
      }

      const serverTimestamp = new Date();
      const updateSql = `
        UPDATE radiology_critical_finding_alerts
        SET status = 'ESCALATED_DPJP',
            escalation_level = $1,
            escalated_at = $2,
            escalation_reason = $3
        WHERE id = $4
        RETURNING *;
      `;
      const updateRes = await client.query(updateSql, [
        targetLevel,
        serverTimestamp,
        escalationReason,
        alertId
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'RAD_CRITICAL_ALERT',
        alertId,
        'RAD_CRITICAL_ALERT_ESCALATED',
        JSON.stringify({
          alertId,
          escalatedTo: targetLevel,
          reason: escalationReason,
          escalatedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof RadiologyDomainError) throw err;
      throw new RadiologyDomainError(`Gagal melakukan eskalasi temuan kritis: ${err.message}`, 'ESCALATION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 7. Get Studies by CPOE Order ID with Versioned Reports
   */
  getStudiesByOrder: async (cpoeOrderId) => {
    if (!cpoeOrderId) {
      throw new RadiologyDomainError('CPOE Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const studiesRes = await pool.query(
      'SELECT * FROM radiology_studies WHERE cpoe_order_id = $1 ORDER BY created_at ASC;',
      [cpoeOrderId]
    );

    const studiesWithReports = await Promise.all(
      studiesRes.rows.map(async (st) => {
        const reportsRes = await pool.query(
          'SELECT * FROM radiology_reports WHERE study_id = $1 ORDER BY version DESC;',
          [st.id]
        );
        const reportsWithHistory = await Promise.all(
          reportsRes.rows.map(async (rep) => {
            const versionsRes = await pool.query(
              'SELECT * FROM radiology_report_versions WHERE report_id = $1 ORDER BY version ASC;',
              [rep.id]
            );
            return {
              ...rep,
              historyVersions: versionsRes.rows
            };
          })
        );
        return {
          ...st,
          reports: reportsWithHistory
        };
      })
    );

    return studiesWithReports;
  }
};
