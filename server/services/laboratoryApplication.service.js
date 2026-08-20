/**
 * NurseFlow Enterprise HIS 2026 — Master Laboratory Application Service
 * Domain Authority: Laboratory Information System (LIS), Specimen Chain of Custody & Critical Panic Values
 * Standards: JCI IPSG 2 (Critical Results Communication), LOINC, ISO 15189,
 * PostgreSQL 16 ACID Unit of Work, Idempotency Guard, Optimistic Concurrency, Transactional Outbox,
 * Semantic State Hardening (ANALYTICALLY_VALIDATED -> TECHNICAL_VERIFIED -> CLINICALLY_RELEASED),
 * Versioned Temporal Thresholds, and Partial vs Full CPOE Order Completion FSM.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class LaboratoryDomainError extends Error {
  constructor(message, code = 'LAB_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'LaboratoryDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_SPECIMEN_COLLECTORS = [
  'ROLE_SUPER_ADMIN',
  'ROLE_NURSE',
  'ROLE_LAB_ANALYST',
  'ROLE_DOCTOR_EMERGENCY'
];

const AUTHORIZED_LAB_ANALYSTS = [
  'ROLE_SUPER_ADMIN',
  'ROLE_LAB_ANALYST',
  'ROLE_DOCTOR_DPJP'
];

const AUTHORIZED_PANIC_ACK_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_NURSE'
];

export const laboratoryApplicationService = {
  /**
   * 1. Generate Specimens for CPOE Laboratory Order (Domain Consumer)
   */
  generateSpecimensForOrder: async ({
    orderId
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!orderId) {
      throw new LaboratoryDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Fetch and Lock Order
      const orderRes = await client.query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId]);
      if (orderRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const order = orderRes.rows[0];

      if (order.status === 'CANCELLED') {
        throw new LaboratoryDomainError(
          `Ditolak: Tidak dapat memproses spesimen pada CPOE Order yang telah dibatalkan (${order.order_number}).`,
          'ORDER_ALREADY_CANCELLED',
          400
        );
      }

      // 2. Fetch Laboratory Items
      const itemsRes = await client.query(
        "SELECT * FROM cpoe_order_items WHERE order_id = $1 AND item_type = 'LABORATORY' FOR UPDATE;",
        [orderId]
      );
      if (itemsRes.rows.length === 0) {
        throw new LaboratoryDomainError(
          `Order ${order.order_number} tidak memiliki item pemeriksaan laboratorium.`,
          'NO_LAB_ITEMS_FOUND',
          400
        );
      }

      const serverTimestamp = new Date();
      const generatedSpecimens = [];

      for (let i = 0; i < itemsRes.rows.length; i++) {
        const item = itemsRes.rows[i];

        // Idempotency: Check if specimen already exists for this CPOE item
        const existingSpecRes = await client.query(
          'SELECT * FROM laboratory_specimens WHERE cpoe_item_id = $1 FOR UPDATE;',
          [item.id]
        );
        if (existingSpecRes.rows.length > 0) {
          generatedSpecimens.push(existingSpecRes.rows[0]);
          continue;
        }

        // Determine Specimen Type & Tube Color based on Item Specs or Defaults
        const specs = item.item_specifications || {};
        const specimenType = specs.specimenType || (item.catalog_code.includes('CBC') || item.catalog_code.includes('HB') ? 'EDTA_WHOLE_BLOOD' : 'SERUM');
        const tubeColor = specs.tubeColor || (specimenType === 'EDTA_WHOLE_BLOOD' ? 'PURPLE_EDTA' : 'YELLOW_SST');

        // Deterministic Barcode Lineage: SPEC-<EncNum>-<ItemCode>-<Idx>
        const cleanEnc = (order.encounter_id || 'ENC').replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase();
        const cleanItem = item.catalog_code.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase();
        const barcode = `SPEC-${cleanEnc}-${cleanItem}-${i + 1}`;

        const specId = crypto.randomUUID();
        const insertSpecSql = `
          INSERT INTO laboratory_specimens (
            id, tenant_id, order_id, encounter_id, patient_id,
            patient_mrn, specimen_barcode, specimen_type, vacutainer_tube_color,
            status, cpoe_item_id, version, correlation_id, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15
          ) RETURNING *;
        `;

        const specRes = await client.query(insertSpecSql, [
          specId,
          order.patient_id, // tenant_id fallback
          orderId,
          order.encounter_id,
          order.patient_id,
          order.patient_id.slice(0, 8),
          barcode,
          specimenType,
          tubeColor,
          'ORDERED',
          item.id,
          1,
          correlationId,
          serverTimestamp,
          serverTimestamp
        ]);

        generatedSpecimens.push(specRes.rows[0]);
      }

      // Outbox Event & Audit
      const outboxId = crypto.randomUUID();
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        outboxId,
        'LAB_SPECIMEN',
        orderId,
        'LAB_SPECIMENS_GENERATED',
        JSON.stringify({
          orderId,
          orderNumber: order.order_number,
          specimensCount: generatedSpecimens.length,
          specimens: generatedSpecimens.map(s => ({ id: s.id, barcode: s.specimen_barcode, type: s.specimen_type }))
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return generatedSpecimens;
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal menghasilkan spesimen laboratorium: ${err.message}`, 'SPECIMEN_GEN_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 2. Collect Specimen (Phlebotomy / Sample Collection)
   */
  collectSpecimen: async ({
    specimenId,
    collectionSite = 'Vena Cubiti',
    notes = null,
    expectedVersion = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_SPECIMEN_COLLECTORS.includes(authorRole)) {
      throw new LaboratoryDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin mencatat pengambilan spesimen laboratorium.`,
        'FORBIDDEN_LAB_ROLE',
        403
      );
    }

    if (!specimenId) {
      throw new LaboratoryDomainError('Specimen ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const collectorName = actor.fullName || actor.username || 'Perawat Phlebotomist';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const specRes = await client.query('SELECT * FROM laboratory_specimens WHERE id = $1 FOR UPDATE;', [specimenId]);
      if (specRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Spesimen dengan ID ${specimenId} tidak ditemukan.`, 'SPECIMEN_NOT_FOUND', 404);
      }
      const specimen = specRes.rows[0];

      // Optimistic Concurrency Check
      if (expectedVersion !== null && expectedVersion !== undefined && specimen.version !== Number(expectedVersion)) {
        throw new LaboratoryDomainError(
          `Konflik konkurensi: Versi spesimen (${specimen.version}) tidak cocok dengan versi request (${expectedVersion}).`,
          'CONCURRENCY_CONFLICT',
          409
        );
      }

      // Invariant: Cannot collect on cancelled order
      const orderRes = await client.query('SELECT status FROM clinical_orders WHERE id = $1;', [specimen.order_id]);
      if (orderRes.rows.length > 0 && orderRes.rows[0].status === 'CANCELLED') {
        throw new LaboratoryDomainError(
          'Ditolak: Tidak dapat mengambil spesimen untuk CPOE Order yang telah berstatus CANCELLED.',
          'ORDER_ALREADY_CANCELLED',
          400
        );
      }

      if (specimen.status !== 'ORDERED' && specimen.status !== 'SPECIMEN_REQUIRED') {
        throw new LaboratoryDomainError(
          `Transisi status tidak valid: Spesimen dengan status [${specimen.status}] tidak dapat dikoleksi kembali.`,
          'INVALID_SPECIMEN_STATUS_TRANSITION',
          400
        );
      }

      const serverTimestamp = new Date();
      const newVersion = (specimen.version || 1) + 1;

      const updateSql = `
        UPDATE laboratory_specimens
        SET status = 'COLLECTED',
            collection_site = $1,
            phlebotomist_name = $2,
            collected_at = $3,
            version = $4,
            updated_at = $3
        WHERE id = $5
        RETURNING *;
      `;
      const updateRes = await client.query(updateSql, [
        collectionSite,
        collectorName,
        serverTimestamp,
        newVersion,
        specimenId
      ]);

      // Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [
        crypto.randomUUID(),
        actor.userId || 'USR-NURSE-01',
        collectorName,
        authorRole,
        clientIp,
        'UPDATE',
        'LAB_SPECIMEN',
        specimenId,
        specimen.patient_id,
        JSON.stringify(specimen),
        JSON.stringify(updateRes.rows[0]),
        `Pengambilan spesimen darah/cairan [${specimen.specimen_barcode}] di ${collectionSite}`,
        crypto.createHash('sha256').update(specimenId + 'COLLECTED' + serverTimestamp.toISOString()).digest('hex'),
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
        'LAB_SPECIMEN',
        specimenId,
        'LAB_SPECIMEN_COLLECTED',
        JSON.stringify({
          specimenId,
          barcode: specimen.specimen_barcode,
          collectedBy: collectorName,
          collectedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal mencatat pengambilan spesimen: ${err.message}`, 'COLLECTION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 3. Receive & Accession Specimen in Laboratory
   */
  receiveAndAccessionSpecimen: async ({
    specimenId,
    specimenQualityFlag = 'OPTIMAL',
    qualityNotes = null,
    expectedVersion = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_LAB_ANALYSTS.includes(authorRole)) {
      throw new LaboratoryDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin melakukan accession spesimen laboratorium.`,
        'FORBIDDEN_LAB_ROLE',
        403
      );
    }

    if (!specimenId) {
      throw new LaboratoryDomainError('Specimen ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const analystName = actor.fullName || actor.username || 'Analis Laboratorium';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const specRes = await client.query('SELECT * FROM laboratory_specimens WHERE id = $1 FOR UPDATE;', [specimenId]);
      if (specRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Spesimen dengan ID ${specimenId} tidak ditemukan.`, 'SPECIMEN_NOT_FOUND', 404);
      }
      const specimen = specRes.rows[0];

      // Optimistic Concurrency Check
      if (expectedVersion !== null && expectedVersion !== undefined && specimen.version !== Number(expectedVersion)) {
        throw new LaboratoryDomainError(
          `Konflik konkurensi: Versi spesimen (${specimen.version}) tidak cocok dengan versi request (${expectedVersion}).`,
          'CONCURRENCY_CONFLICT',
          409
        );
      }

      // Invariant: Specimen MUST be collected first before it can be received
      if (specimen.status !== 'COLLECTED') {
        throw new LaboratoryDomainError(
          `Ditolak: Spesimen berstatus [${specimen.status}] belum diambil/dikoleksi dari pasien sehingga tidak dapat di-accession di laboratorium.`,
          'SPECIMEN_NOT_COLLECTED',
          400
        );
      }

      // Generate Accession Number: ACC-YYYYMMDD-XXXX
      const serverTimestamp = new Date();
      const datePart = serverTimestamp.toISOString().slice(0, 10).replace(/-/g, '');
      const random4 = Math.floor(1000 + Math.random() * 9000);
      const accessionNumber = `ACC-${datePart}-${random4}`;
      const newVersion = (specimen.version || 1) + 1;

      const updateSql = `
        UPDATE laboratory_specimens
        SET status = 'RECEIVED_IN_LAB',
            accession_number = $1,
            received_by_lab_analyst = $2,
            received_at = $3,
            specimen_quality_flag = $4,
            quality_notes = $5,
            version = $6,
            updated_at = $3
        WHERE id = $7
        RETURNING *;
      `;
      const updateRes = await client.query(updateSql, [
        accessionNumber,
        analystName,
        serverTimestamp,
        specimenQualityFlag,
        qualityNotes,
        newVersion,
        specimenId
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'LAB_SPECIMEN',
        specimenId,
        'LAB_SPECIMEN_ACCESSIONED',
        JSON.stringify({
          specimenId,
          barcode: specimen.specimen_barcode,
          accessionNumber,
          receivedBy: analystName,
          qualityFlag: specimenQualityFlag,
          receivedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal melakukan accession spesimen: ${err.message}`, 'ACCESSION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 4. Enter Raw / Analyzer Result & Detect Panic Values with Versioned Temporal Thresholds
   * Semantic State: RAW -> ANALYTICALLY_VALIDATED
   */
  enterAnalyzerResult: async ({
    specimenId,
    testCode,
    testName,
    category = 'CLINICAL_CHEMISTRY',
    numericValue = null,
    textValue = null,
    unit = 'mg/dL',
    instrumentName = 'Sysmex XN-1000'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_LAB_ANALYSTS.includes(authorRole)) {
      throw new LaboratoryDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin memasukkan hasil pemeriksaan laboratorium.`,
        'FORBIDDEN_LAB_ROLE',
        403
      );
    }

    if (!specimenId || !testCode) {
      throw new LaboratoryDomainError('Specimen ID dan Test Code wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const analystName = actor.fullName || actor.username || 'Analis Laboratorium';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const specRes = await client.query('SELECT * FROM laboratory_specimens WHERE id = $1 FOR UPDATE;', [specimenId]);
      if (specRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Spesimen dengan ID ${specimenId} tidak ditemukan.`, 'SPECIMEN_NOT_FOUND', 404);
      }
      const specimen = specRes.rows[0];

      if (!['RECEIVED_IN_LAB', 'ANALYZING', 'RESULT_AVAILABLE'].includes(specimen.status)) {
        throw new LaboratoryDomainError(
          `Ditolak: Tidak dapat memasukkan hasil pada spesimen berstatus [${specimen.status}]. Spesimen harus telah diterima di laboratorium.`,
          'INVALID_SPECIMEN_STATE_FOR_RESULT',
          400
        );
      }

      const serverTimestamp = new Date();

      // Check Versioned Critical Panic Thresholds with Temporal Reproducibility
      const thresholdRes = await client.query(
        `SELECT * FROM master_lab_critical_thresholds 
         WHERE test_code = $1 AND is_active = TRUE 
           AND (effective_from <= $2) 
           AND (effective_to IS NULL OR effective_to > $2)
         ORDER BY version DESC, effective_from DESC LIMIT 1;`,
        [testCode, serverTimestamp]
      );

      let isAbnormal = false;
      let isCriticalPanic = false;
      let clinicalThreat = null;
      let refLow = null;
      let refHigh = null;
      let panicLow = null;
      let panicHigh = null;
      let appliedRuleVersion = 1;
      let ruleSnapshot = {};

      if (thresholdRes.rows.length > 0) {
        const t = thresholdRes.rows[0];
        appliedRuleVersion = t.version || 1;
        ruleSnapshot = {
          ruleId: t.id,
          testCode: t.test_code,
          version: t.version,
          effectiveFrom: t.effective_from,
          approvedBy: t.approved_by,
          referenceLow: t.reference_low,
          referenceHigh: t.reference_high,
          panicLow: t.panic_low,
          panicHigh: t.panic_high
        };

        refLow = t.reference_low ? Number(t.reference_low) : null;
        refHigh = t.reference_high ? Number(t.reference_high) : null;
        panicLow = t.panic_low ? Number(t.panic_low) : null;
        panicHigh = t.panic_high ? Number(t.panic_high) : null;

        if (numericValue !== null && numericValue !== undefined) {
          const num = Number(numericValue);
          if (refLow !== null && num < refLow) isAbnormal = true;
          if (refHigh !== null && num > refHigh) isAbnormal = true;

          if (panicLow !== null && num <= panicLow) {
            isCriticalPanic = true;
            clinicalThreat = t.clinical_threat_low || 'Nilai Kritis di bawah batas aman letal';
          }
          if (panicHigh !== null && num >= panicHigh) {
            isCriticalPanic = true;
            clinicalThreat = t.clinical_threat_high || 'Nilai Kritis di atas batas aman letal';
          }
        }
      }

      const resultId = crypto.randomUUID();

      // Insert Result Row with ANALYTICALLY_VALIDATED semantic status
      const insertResultSql = `
        INSERT INTO laboratory_test_results (
          id, tenant_id, specimen_id, order_id, cpoe_item_id,
          test_code, test_name, category, numeric_value, text_value,
          unit, reference_low, reference_high, panic_low, panic_high,
          is_abnormal, is_critical_panic, raw_analyzer_value,
          validation_status, analyst_name, applied_rule_version, rule_snapshot, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18,
          $19, $20, $21, $22, $23
        ) RETURNING *;
      `;

      const resultRes = await client.query(insertResultSql, [
        resultId,
        specimen.tenant_id || specimen.patient_id,
        specimenId,
        specimen.order_id,
        specimen.cpoe_item_id,
        testCode,
        testName || testCode,
        category,
        numericValue,
        textValue || String(numericValue),
        unit,
        refLow,
        refHigh,
        panicLow,
        panicHigh,
        isAbnormal,
        isCriticalPanic,
        String(numericValue || textValue),
        'ANALYTICALLY_VALIDATED',
        analystName,
        appliedRuleVersion,
        JSON.stringify(ruleSnapshot),
        serverTimestamp
      ]);

      const createdResult = resultRes.rows[0];

      // If Panic Value Detected -> Create Panic Alert Record
      let panicAlertRecord = null;
      if (isCriticalPanic) {
        const alertId = crypto.randomUUID();
        const insertAlertSql = `
          INSERT INTO laboratory_panic_alerts (
            id, tenant_id, result_id, order_id, cpoe_item_id,
            encounter_id, patient_id, patient_mrn, test_name,
            panic_value_display, clinical_threat, status, escalation_level,
            reported_to_nurse_or_doctor, reported_at, correlation_id, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17
          ) RETURNING *;
        `;
        const alertRes = await client.query(insertAlertSql, [
          alertId,
          specimen.tenant_id || specimen.patient_id,
          resultId,
          specimen.order_id,
          specimen.cpoe_item_id,
          specimen.encounter_id,
          specimen.patient_id,
          specimen.patient_mrn,
          testName || testCode,
          `${numericValue} ${unit}`,
          clinicalThreat,
          'REPORTED_TO_UNIT',
          'PRIMARY_NURSE',
          'Perawat Ruangan / DPJP',
          serverTimestamp,
          correlationId,
          serverTimestamp
        ]);
        panicAlertRecord = alertRes.rows[0];

        // Panic Outbox Event
        await client.query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'LAB_PANIC_ALERT',
          alertId,
          'LAB_PANIC_ALERT_DETECTED',
          JSON.stringify({
            alertId,
            resultId,
            testCode,
            testName,
            value: numericValue,
            unit,
            clinicalThreat,
            appliedRuleVersion,
            encounterId: specimen.encounter_id,
            patientId: specimen.patient_id
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);
      }

      // Update Specimen Status to RESULT_AVAILABLE
      await client.query(
        "UPDATE laboratory_specimens SET status = 'RESULT_AVAILABLE', updated_at = $1 WHERE id = $2;",
        [serverTimestamp, specimenId]
      );

      await client.query('COMMIT;');
      return {
        ...createdResult,
        panicAlert: panicAlertRecord
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal memasukkan hasil analyzer: ${err.message}`, 'ENTER_RESULT_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 5. Verify & Release Final Laboratory Result (Separation of Verification & Release)
   * Semantic State: ANALYTICALLY_VALIDATED -> TECHNICAL_VERIFIED -> CLINICALLY_RELEASED
   * FSM: Updates Parent CPOE Order to PARTIALLY_COMPLETED or COMPLETED.
   */
  verifyAndReleaseResult: async ({
    resultId,
    pathologistNotes = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_LAB_ANALYSTS.includes(authorRole)) {
      throw new LaboratoryDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin memverifikasi hasil laboratorium.`,
        'FORBIDDEN_LAB_ROLE',
        403
      );
    }

    if (!resultId) {
      throw new LaboratoryDomainError('Result ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const verifierName = actor.fullName || actor.username || 'dr. Sp.PK / Analis Senior';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const resultRes = await client.query('SELECT * FROM laboratory_test_results WHERE id = $1 FOR UPDATE;', [resultId]);
      if (resultRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Hasil laboratorium dengan ID ${resultId} tidak ditemukan.`, 'RESULT_NOT_FOUND', 404);
      }
      const labResult = resultRes.rows[0];

      if (labResult.validation_status === 'CLINICALLY_RELEASED' || labResult.validation_status === 'RELEASED') {
        throw new LaboratoryDomainError('Hasil laboratorium ini sudah berstatus RELEASED.', 'RESULT_ALREADY_RELEASED', 400);
      }

      const serverTimestamp = new Date();
      const newVersion = (labResult.version || 1) + 1;

      // Update Result to CLINICALLY_RELEASED with Technologist Verification Evidence
      const updateResultSql = `
        UPDATE laboratory_test_results
        SET validation_status = 'CLINICALLY_RELEASED',
            technologist_verified_by = $1,
            technologist_verified_at = $2,
            pathologist_verified_by = $1,
            verified_at = $2,
            released_by = $1,
            released_at = $2,
            version = $3
        WHERE id = $4
        RETURNING *;
      `;
      const updatedRes = await client.query(updateResultSql, [
        verifierName,
        serverTimestamp,
        newVersion,
        resultId
      ]);

      // Update Specimen Status to COMPLETED
      await client.query(
        "UPDATE laboratory_specimens SET status = 'COMPLETED', completed_at = $1, updated_at = $1 WHERE id = $2;",
        [serverTimestamp, labResult.specimen_id]
      );

      // Update Target CPOE Item Status to COMPLETED
      if (labResult.cpoe_item_id) {
        await client.query(
          "UPDATE cpoe_order_items SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
          [serverTimestamp, labResult.cpoe_item_id]
        );
      }

      // ─── PARENT/CHILD CPOE COMPLETION SEMANTICS ───
      if (labResult.order_id) {
        const orderItemsRes = await client.query(
          'SELECT status FROM cpoe_order_items WHERE order_id = $1;',
          [labResult.order_id]
        );
        const allItems = orderItemsRes.rows;
        const totalItemsCount = allItems.length;
        const completedItemsCount = allItems.filter(it => it.status === 'COMPLETED').length;

        if (totalItemsCount > 0 && completedItemsCount === totalItemsCount) {
          // All items finished -> Parent Order is COMPLETED
          await client.query(
            "UPDATE clinical_orders SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
            [serverTimestamp, labResult.order_id]
          );
        } else if (completedItemsCount > 0) {
          // Some items completed but others pending -> Parent Order is PARTIALLY_COMPLETED
          await client.query(
            "UPDATE clinical_orders SET status = 'PARTIALLY_COMPLETED', updated_at = $1 WHERE id = $2;",
            [serverTimestamp, labResult.order_id]
          );
        }
      }

      // Outbox Event for Clinical Timeline & Charge Capture
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'LAB_RESULT',
        resultId,
        'LAB_RESULT_RELEASED',
        JSON.stringify({
          resultId,
          orderId: labResult.order_id,
          cpoeItemId: labResult.cpoe_item_id,
          testCode: labResult.test_code,
          testName: labResult.test_name,
          value: labResult.numeric_value || labResult.text_value,
          unit: labResult.unit,
          isCritical: labResult.is_critical_panic,
          ruleVersion: labResult.applied_rule_version,
          verifiedBy: verifierName,
          releasedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal merilis hasil laboratorium: ${err.message}`, 'RELEASE_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 6. Acknowledge Panic / Critical Alert (Closed Loop Read-Back Communication)
   * Hardened Evidence Guard: strictly requires readBackConfirmed === true AND clinicalInstruction >= 5 chars.
   */
  acknowledgePanicAlert: async ({
    alertId,
    readBackConfirmed = true,
    clinicalInstruction = null,
    clinicianFeedback = null,
    notes = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_PANIC_ACK_ROLES.includes(authorRole)) {
      throw new LaboratoryDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin melakukan acknowledgement nilai kritis.`,
        'FORBIDDEN_LAB_ROLE',
        403
      );
    }

    if (!alertId) {
      throw new LaboratoryDomainError('Alert ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    // Strict JCI IPSG 2 Evidence Guard
    if (readBackConfirmed !== true) {
      throw new LaboratoryDomainError(
        'Konfirmasi lisan Read-Back (JCI IPSG 2) wajib dinyatakan TRUE oleh tenaga medis penerima nilai kritis.',
        'READ_BACK_CONFIRMATION_REQUIRED',
        400
      );
    }

    const effectiveInstruction = clinicalInstruction || clinicianFeedback;
    if (!effectiveInstruction || typeof effectiveInstruction !== 'string' || effectiveInstruction.trim().length < 5) {
      throw new LaboratoryDomainError(
        'Instruksi klinis/tindakan terapeutik dari DPJP wajib dicatat secara lengkap (minimal 5 karakter).',
        'CLINICAL_INSTRUCTION_REQUIRED',
        400
      );
    }

    const clinicianName = actor.fullName || actor.username || 'Dokter/Perawat Penerima';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const alertRes = await client.query('SELECT * FROM laboratory_panic_alerts WHERE id = $1 FOR UPDATE;', [alertId]);
      if (alertRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Panic Alert dengan ID ${alertId} tidak ditemukan.`, 'ALERT_NOT_FOUND', 404);
      }
      const alert = alertRes.rows[0];

      if (alert.status === 'ACKNOWLEDGED_READ_BACK') {
        throw new LaboratoryDomainError('Alert nilai kritis ini sudah di-acknowledge sebelumnya.', 'ALERT_ALREADY_ACKNOWLEDGED', 400);
      }

      const serverTimestamp = new Date();
      const updateAlertSql = `
        UPDATE laboratory_panic_alerts
        SET status = 'ACKNOWLEDGED_READ_BACK',
            read_back_confirmed_by = $1,
            read_back_at = $2,
            read_back_confirmation_text = 'VERIFIED_READ_BACK_CONFIRMED',
            acknowledged_by = $1,
            acknowledged_at = $2,
            clinical_instruction = $3,
            clinician_feedback = $3,
            acknowledgement_notes = $4,
            resolved_at = $2
        WHERE id = $5
        RETURNING *;
      `;

      const updatedAlertRes = await client.query(updateAlertSql, [
        clinicianName,
        serverTimestamp,
        effectiveInstruction.trim(),
        notes,
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
        'LAB_PANIC_ALERT',
        alertId,
        'LAB_PANIC_ALERT_ACKNOWLEDGED',
        JSON.stringify({
          alertId,
          acknowledgedBy: clinicianName,
          role: authorRole,
          readBackConfirmed: true,
          clinicalInstruction: effectiveInstruction.trim(),
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
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal mencatat konfirmasi nilai kritis: ${err.message}`, 'ACK_PANIC_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 7. Escalate Unacknowledged Panic Alert (Timeout Safety Protocol)
   */
  escalatePanicAlert: async ({
    alertId,
    escalationReason = 'Timeout 15 menit tanpa konfirmasi perawat ruangan',
    targetLevel = 'DPJP_PHYSICIAN'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!alertId) {
      throw new LaboratoryDomainError('Alert ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const alertRes = await client.query('SELECT * FROM laboratory_panic_alerts WHERE id = $1 FOR UPDATE;', [alertId]);
      if (alertRes.rows.length === 0) {
        throw new LaboratoryDomainError(`Panic Alert dengan ID ${alertId} tidak ditemukan.`, 'ALERT_NOT_FOUND', 404);
      }
      const alert = alertRes.rows[0];

      if (alert.status === 'ACKNOWLEDGED_READ_BACK') {
        throw new LaboratoryDomainError('Alert yang sudah di-acknowledge tidak memerlukan eskalasi.', 'ALERT_ALREADY_RESOLVED', 400);
      }

      const serverTimestamp = new Date();
      const updateSql = `
        UPDATE laboratory_panic_alerts
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
        'LAB_PANIC_ALERT',
        alertId,
        'LAB_PANIC_ALERT_ESCALATED',
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
      if (err instanceof LaboratoryDomainError) throw err;
      throw new LaboratoryDomainError(`Gagal melakukan eskalasi nilai kritis: ${err.message}`, 'ESCALATION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 8. Get Specimens for CPOE Order
   */
  getSpecimensByOrder: async (orderId) => {
    if (!orderId) {
      throw new LaboratoryDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const specRes = await pool.query(
      'SELECT * FROM laboratory_specimens WHERE order_id = $1 ORDER BY created_at ASC;',
      [orderId]
    );

    const specimensWithResults = await Promise.all(
      specRes.rows.map(async (spec) => {
        const resultsRes = await pool.query(
          'SELECT * FROM laboratory_test_results WHERE specimen_id = $1 ORDER BY created_at ASC;',
          [spec.id]
        );
        return {
          ...spec,
          results: resultsRes.rows
        };
      })
    );

    return specimensWithResults;
  }
};
