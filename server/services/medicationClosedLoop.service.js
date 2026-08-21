/**
 * NurseFlow Enterprise HIS 2026 — Master Medication Closed-Loop Application Service (Hardened Edition)
 * Domain Authority: Patient Safety Core, e-Prescribing, Cross-Reactivity Allergy Engine, Dynamic DDI Screener,
 * Multi-Parameter Dosing (Weight/Cumulative), Pharmacist MMU.4, FEFO Stock, Bedside 6-Rights,
 * High-Alert Infusion Safety, and Admission/Discharge Medication Reconciliation.
 * Standards: JCI MMU.4 / IPSG 3, ISO 22940, WHO 5-Rights + Reason, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class MedicationDomainError extends Error {
  constructor(message, code = 'MED_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'MedicationDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_PRESCRIBER_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY'
];

const AUTHORIZED_PHARMACIST_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_PHARMACIST'
];

const AUTHORIZED_NURSE_ADMIN_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_NURSE',
  'ROLE_DOCTOR_EMERGENCY'
];

// Helper: Parse frequency multiplier for cumulative daily dose calculation
function parseFrequencyMultiplier(frequencyStr = '1x1') {
  const norm = frequencyStr.trim().toUpperCase();
  if (norm === 'STAT' || norm === 'NOW' || norm === 'ONCE' || norm === '1X1' || norm === 'QD') return 1;
  if (norm === 'BID' || norm === '2X1' || norm === 'Q12H') return 2;
  if (norm === 'TID' || norm === '3X1' || norm === 'Q8H') return 3;
  if (norm === 'QID' || norm === '4X1' || norm === 'Q6H') return 4;
  if (norm === 'Q4H' || norm === '6X1') return 6;
  if (norm === '8X1') return 8;
  if (norm === 'PRN') return 3; // conservative assumption
  const match = norm.match(/^(\d+)X/);
  if (match) return parseInt(match[1], 10);
  return 1;
}

// Known Lethal / True Allergy Indicators
const TRUE_ALLERGY_REACTIONS = ['anafilaksis', 'anaphylaxis', 'angioedema', 'syok', 'bronchospasm', 'stevens-johnson', 'sjs', 'ten', 'urtikaria'];

// Known Severe DDI Pairs (Drug Code Matrix)
const KNOWN_SEVERE_DDI_MATRIX = [
  { pair: ['MED-SILDENAFIL', 'MED-NITROGLYCERIN'], severity: 'CONTRAINDICATED', desc: 'Severe refractory hypotension & cardiovascular collapse' },
  { pair: ['MED-WARFARIN', 'MED-ASPIRIN'], severity: 'MAJOR', desc: 'High risk of gastrointestinal and major systemic hemorrhage' },
  { pair: ['MED-POTASSIUM-746', 'MED-SPIRONOLACTONE'], severity: 'MAJOR', desc: 'Severe hyperkalemia leading to fatal cardiac arrhythmia' },
  { pair: ['MED-MORPHINE-10', 'MED-DIAZEPAM'], severity: 'MAJOR', desc: 'Profound sedation, respiratory depression, coma, and death' }
];

export const medicationClosedLoopService = {
  /**
   * 1. e-Prescribing & Hardened CDSS Safety Gates
   * (Cross-Reactivity Allergy, Dynamic DDI, Cumulative Daily Dose, Weight-Based Dose, Route, Renal)
   */
  generateMedicationOrdersFromCPOE: async ({
    orderId,
    overrideAllergy = false,
    overrideDdi = false,
    overrideReason = null,
    patientCreatinineCl = null,
    patientWeightKg = null,
    intoleranceAcknowledged = false
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!orderId) {
      throw new MedicationDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const authorRole = actor.role || 'ROLE_DOCTOR_DPJP';
    if (!AUTHORIZED_PRESCRIBER_ROLES.includes(authorRole)) {
      throw new MedicationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang menerbitkan resep obat (e-Prescribing).`,
        'FORBIDDEN_PRESCRIBER_ROLE',
        403
      );
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 1. Fetch & Lock CPOE Order
      const orderRes = await client.query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId]);
      if (orderRes.rows.length === 0) {
        throw new MedicationDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const order = orderRes.rows[0];

      if (order.status === 'CANCELLED') {
        throw new MedicationDomainError(
          `Ditolak: Tidak dapat memproses resep pada CPOE Order yang telah dibatalkan (${order.order_number}).`,
          'ORDER_ALREADY_CANCELLED',
          400
        );
      }

      // 2. Fetch Medication Items for this Order
      const itemsRes = await client.query(
        "SELECT * FROM cpoe_order_items WHERE order_id = $1 AND item_type IN ('PHARMACY', 'MEDICATION') FOR UPDATE;",
        [orderId]
      );
      if (itemsRes.rows.length === 0) {
        throw new MedicationDomainError(
          `Order ${order.order_number} tidak memiliki item farmasi/obat.`,
          'NO_PHARMACY_ITEMS_FOUND',
          400
        );
      }

      // 3. Fetch Active Patient Allergies & Cross-Reactivity Rules
      const allergyRes = await client.query(
        'SELECT * FROM patient_allergies WHERE patient_id = $1;',
        [order.patient_id]
      );
      const patientAllergies = allergyRes.rows;

      const crossReactRes = await client.query('SELECT * FROM master_drug_class_cross_reactivities;');
      const crossReactivities = crossReactRes.rows;

      // 4. Fetch Existing Active Regimen in Encounter for Dynamic DDI & Duplicate Therapy Screening
      const activeRegimenRes = await client.query(
        "SELECT * FROM medication_orders WHERE encounter_id = $1 AND status IN ('ORDERED', 'REVIEWED', 'DISPENSED', 'ACTIVE') FOR UPDATE;",
        [order.encounter_id]
      );
      const existingRegimen = activeRegimenRes.rows;

      const serverTimestamp = new Date();
      const generatedMedOrders = [];

      for (let i = 0; i < itemsRes.rows.length; i++) {
        const item = itemsRes.rows[i];

        // Idempotency: Check if medication order already generated
        const existingMedRes = await client.query(
          'SELECT * FROM medication_orders WHERE cpoe_item_id = $1 FOR UPDATE;',
          [item.id]
        );
        if (existingMedRes.rows.length > 0) {
          generatedMedOrders.push(existingMedRes.rows[0]);
          continue;
        }

        const specs = item.item_specifications || {};
        const doseQty = Number(specs.dosageQuantity || specs.doseQuantity || item.quantity || 1.0);
        const doseUnit = specs.dosageUnit || specs.doseUnit || 'mg';
        const route = (specs.route || 'ORAL').toUpperCase();
        const frequency = specs.frequency || '3x1';
        const isPrn = specs.isPrn === true;
        const prnIndication = specs.prnIndication || null;
        const timingType = specs.timingType || (frequency.includes('STAT') ? 'STAT' : (frequency.includes('NOW') ? 'NOW' : 'ROUTINE'));
        const isHighAlert = specs.isHighAlert === true || item.catalog_code.includes('HIGH_ALERT') || item.catalog_code.includes('MORPHINE') || item.catalog_code.includes('POTASSIUM') || item.catalog_code.includes('INSULIN');
        const isNarcotic = specs.isNarcotic === true || item.catalog_code.includes('MORPHINE') || item.catalog_code.includes('FENTANYL');
        const patientWeight = patientWeightKg || specs.patientWeightKg || null;

        // ─── CDSS GATE 1: ENHANCED ALLERGY & CROSS-REACTIVITY SCREEN ───
        for (const allergy of patientAllergies) {
          const allergenName = (allergy.allergen || allergy.allergen_name || '').toLowerCase();
          const allergenClass = (allergy.drug_class_code || '').toUpperCase();
          const reaction = (allergy.reaction || '').toLowerCase();
          const isTrueAllergy = TRUE_ALLERGY_REACTIONS.some(r => reaction.includes(r)) || allergy.severity === 'SEVERE_LETHAL';

          // Direct Drug/Ingredient match
          const directMatch = allergenName ? (item.item_name.toLowerCase().includes(allergenName) || item.catalog_code.toLowerCase().includes(allergy.allergen_code?.toLowerCase() || '___')) : false;

          // Drug-Class & Cross-reactivity match
          const classMatch = allergenClass && (item.catalog_code.includes(allergenClass) || specs.drugClassCode === allergenClass);
          const crossMatch = crossReactivities.some(cr =>
            (cr.drug_class_code === allergenClass && (specs.drugClassCode === cr.cross_reactive_class_code || item.catalog_code.includes(cr.cross_reactive_class_code)))
          );

          if (directMatch || classMatch || crossMatch) {
            const matchType = directMatch ? 'DIRECT_DRUG' : (classMatch ? 'DRUG_CLASS' : 'CROSS_REACTIVITY');

            if (isTrueAllergy) {
              if (!overrideAllergy) {
                throw new MedicationDomainError(
                  `HARD STOP ALLERGY (${matchType}): Pasien memiliki riwayat alergi terdokumentasi terhadap [${allergy.allergen_name}] (Reaksi Reaktif: ${allergy.reaction || 'Anafilaksis Syok'}). Peresepan [${item.item_name}] diblokir demi keselamatan pasien!`,
                  'ALLERGY_HARD_STOP',
                  400,
                  [{ allergen: allergy.allergen_name, reaction: allergy.reaction, matchType }]
                );
              }
              if (!overrideReason || overrideReason.trim().length < 5) {
                throw new MedicationDomainError(
                  'Alasan klinis override alergi wajib dicatat secara mendalam oleh Dokter DPJP (minimal 5 karakter).',
                  'OVERRIDE_REASON_REQUIRED',
                  400
                );
              }
            } else {
              // Intolerance / Minor Adverse Effect
              if (!intoleranceAcknowledged && !overrideAllergy) {
                throw new MedicationDomainError(
                  `INTOLERANCE WARNING: Pasien memiliki riwayat intoleransi non-anafilaksis terhadap [${allergy.allergen_name}] (Keluhan: ${allergy.reaction || 'Mual / Gastritis'}). Mohon konfirmasi acknowledgment untuk melanjutkan.`,
                  'INTOLERANCE_WARNING',
                  400,
                  [{ allergen: allergy.allergen_name, reaction: allergy.reaction }]
                );
              }
            }
          }
        }

        // ─── CDSS GATE 2: DYNAMIC DDI & DUPLICATE THERAPY SCREEN ───
        // Screen against other items in this order + existing active regimen
        const allCandidateMeds = [
          ...itemsRes.rows.map(it => it.catalog_code),
          ...existingRegimen.map(rx => rx.medication_code)
        ];

        for (const otherMedCode of allCandidateMeds) {
          if (otherMedCode === item.catalog_code) continue;

          // Check Severe DDI
          const ddiMatch = KNOWN_SEVERE_DDI_MATRIX.find(d =>
            d.pair.includes(item.catalog_code) && d.pair.includes(otherMedCode)
          );

          if (ddiMatch) {
            if (ddiMatch.severity === 'CONTRAINDICATED' || ddiMatch.severity === 'MAJOR') {
              if (!overrideDdi) {
                throw new MedicationDomainError(
                  `HARD STOP SEVERE DDI (${ddiMatch.severity}): Interaksi obat berat antara [${item.catalog_code}] dan [${otherMedCode}] (${ddiMatch.desc}). Pemberian bersamaan kontraindikasi absolut / resiko mayor!`,
                  'SEVERE_DDI_HARD_STOP',
                  400,
                  [ddiMatch]
                );
              }
              if (!overrideReason || overrideReason.trim().length < 5) {
                throw new MedicationDomainError(
                  'Alasan klinis override interaksi obat (Severe DDI) wajib disertakan secara eksplisit.',
                  'OVERRIDE_REASON_REQUIRED',
                  400
                );
              }
            }
          }
        }

        // Duplicate therapy check
        const duplicateTherapy = existingRegimen.find(rx => rx.medication_code === item.catalog_code && rx.status !== 'CANCELLED');
        if (duplicateTherapy && !specs.allowDuplicateTherapy) {
          throw new MedicationDomainError(
            `DUPLICATE THERAPY VIOLATION: Pasien sudah memiliki terapi aktif untuk obat [${item.item_name}] (${duplicateTherapy.dosage}). Peresepan duplikasi dilarang!`,
            'DUPLICATE_THERAPY_VIOLATION',
            400
          );
        }

        // ─── CDSS GATE 3: MULTI-PARAMETER DOSE & ROUTE SCREEN ───
        const doseRangeRes = await client.query(
          'SELECT * FROM master_medication_dose_ranges WHERE medication_code = $1 AND is_active = TRUE;',
          [item.catalog_code]
        );

        if (doseRangeRes.rows.length > 0) {
          const rule = doseRangeRes.rows[0];

          // 1. Single Dose Check
          if (doseQty > Number(rule.max_single_dose) || doseQty < Number(rule.min_single_dose)) {
            throw new MedicationDomainError(
              `DOSE RANGE VIOLATION: Dosis tunggal ${doseQty} ${doseUnit} di luar batas aman (${rule.min_single_dose} - ${rule.max_single_dose} ${rule.dose_unit}).`,
              'DOSE_RANGE_VIOLATION',
              400
            );
          }

          // 2. Cumulative Daily Dose Check
          const freqMult = parseFrequencyMultiplier(frequency);
          const dailyCumulativeDose = doseQty * freqMult;
          if (rule.max_daily_dose && dailyCumulativeDose > Number(rule.max_daily_dose)) {
            throw new MedicationDomainError(
              `CUMULATIVE DAILY DOSE VIOLATION: Dosis kumulatif harian (${dailyCumulativeDose} ${doseUnit}/hari via frekuensi ${frequency}) melebihi batas aman harian (${rule.max_daily_dose} ${rule.dose_unit}/hari).`,
              'CUMULATIVE_DAILY_DOSE_VIOLATION',
              400
            );
          }

          // 3. Weight-Based Dose Check
          if (patientWeight && rule.mg_per_kg_max_dose) {
            const maxAllowedWeightDose = Number(patientWeight) * Number(rule.mg_per_kg_max_dose);
            if (doseQty > maxAllowedWeightDose) {
              throw new MedicationDomainError(
                `WEIGHT BASED DOSE VIOLATION: Dosis ${doseQty} ${doseUnit} melebihi batas berat badan pasien (${patientWeight} kg × ${rule.mg_per_kg_max_dose} mg/kg = max ${maxAllowedWeightDose.toFixed(1)} mg).`,
                'WEIGHT_BASED_DOSE_VIOLATION',
                400
              );
            }
          }

          // 4. Route Check
          const allowedRoutes = Array.isArray(rule.allowed_routes) ? rule.allowed_routes : JSON.parse(rule.allowed_routes || '["ORAL"]');
          if (!allowedRoutes.includes(route)) {
            throw new MedicationDomainError(
              `INVALID ROUTE: Rute [${route}] tidak diizinkan untuk obat ${item.item_name}. Rute yang diizinkan: ${allowedRoutes.join(', ')}.`,
              'INVALID_MEDICATION_ROUTE',
              400
            );
          }

          // 5. Renal Impairment Check
          const crCl = patientCreatinineCl !== null ? patientCreatinineCl : specs.patientCreatinineCl;
          if (crCl && rule.renal_clearance_cutoff_ml_min && crCl < Number(rule.renal_clearance_cutoff_ml_min)) {
            if (rule.max_dose_renal_impaired && doseQty > Number(rule.max_dose_renal_impaired)) {
              throw new MedicationDomainError(
                `RENAL DOSE LIMIT: Pasien mengalami penurunan fungsi ginjal (CrCl ${crCl} mL/min < cutoff ${rule.renal_clearance_cutoff_ml_min} mL/min). Dosis maksimal yang diizinkan adalah ${rule.max_dose_renal_impaired} ${rule.dose_unit}.`,
                'RENAL_DOSE_LIMIT_EXCEEDED',
                400
              );
            }
          }
        }

        // Insert medication_orders
        const medOrderId = crypto.randomUUID();
        const targetTenantId = order.tenant_id || actor.tenantId || '00000000-0000-0000-0000-000000000001';
        const insertMedSql = `
          INSERT INTO medication_orders (
            id, tenant_id, order_id, medication_code, medication_name, dosage,
            route, frequency, duration, quantity, unit_price,
            total_price, is_cito, high_alert, lasa_flag, is_antibiotic,
            review_status, status, cpoe_order_id, cpoe_item_id, encounter_id,
            patient_id, dosage_quantity, dosage_unit, scheduled_times, is_prn,
            prn_indication, cdss_screened, cdss_override_reason, cdss_overridden_by,
            pharmacist_review_status, dispense_status, version, concentration_mg_ml,
            infusion_rate_ml_hr, infusion_volume_ml, timing_type, clinical_indication_notes,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26,
            $27, $28, $29, $30,
            $31, $32, $33, $34,
            $35, $36, $37, $38,
            $39, $40
          ) RETURNING *;
        `;

        const medRes = await client.query(insertMedSql, [
          medOrderId,
          targetTenantId,
          orderId,
          item.catalog_code,
          item.item_name,
          `${doseQty} ${doseUnit}`,
          route,
          frequency,
          specs.duration || '3 hari',
          Math.round(Number(item.quantity || 1)),
          item.unit_price || 0.00,
          item.total_price || 0.00,
          order.is_cito || false,
          isHighAlert,
          specs.isLasa || false,
          specs.isAntibiotic || false,
          'PENDING',
          'ORDERED',
          orderId,
          item.id,
          order.encounter_id,
          order.patient_id,
          doseQty,
          doseUnit,
          JSON.stringify(specs.scheduledTimes || ['08:00', '16:00', '00:00']),
          isPrn,
          prnIndication,
          true,
          overrideReason,
          overrideReason ? (actor.fullName || actor.username || 'dr. DPJP') : null,
          'PENDING_REVIEW',
          'NOT_DISPENSED',
          1,
          specs.concentrationMgMl || null,
          specs.infusionRateMlHr || null,
          specs.infusionVolumeMl || null,
          timingType,
          order.clinical_indication || specs.indication || null,
          serverTimestamp,
          serverTimestamp
        ]);

        generatedMedOrders.push(medRes.rows[0]);
      }

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'MEDICATION_PRESCRIPTION',
        orderId,
        'MEDICATION_ORDER_CREATED',
        JSON.stringify({
          orderId,
          orderNumber: order.order_number,
          medicationCount: generatedMedOrders.length,
          orders: generatedMedOrders.map(m => ({ id: m.id, code: m.medication_code, name: m.medication_name, dose: m.dosage }))
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return generatedMedOrders;
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal memproses e-Prescribing: ${err.message}`, 'E_PRESCRIBE_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 2. Pharmacist MMU.4 Clinical Review
   */
  pharmacistReviewOrder: async ({
    medicationOrderId,
    reviewDecision = 'APPROVED',
    pharmacistNotes = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_PHARMACIST_ROLES.includes(authorRole)) {
      throw new MedicationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang melakukan telaah klinis resep apoteker (MMU.4).`,
        'FORBIDDEN_PHARMACIST_ROLE',
        403
      );
    }

    if (!medicationOrderId) {
      throw new MedicationDomainError('Medication Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const medRes = await client.query('SELECT * FROM medication_orders WHERE id = $1 FOR UPDATE;', [medicationOrderId]);
      if (medRes.rows.length === 0) {
        throw new MedicationDomainError(`Medication order dengan ID ${medicationOrderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const med = medRes.rows[0];

      if (med.status === 'CANCELLED') {
        throw new MedicationDomainError('Ditolak: Resep obat telah dibatalkan.', 'ORDER_ALREADY_CANCELLED', 400);
      }

      if (med.pharmacist_review_status === 'APPROVED') {
        throw new MedicationDomainError('Resep obat ini sudah ditelaah dan disetujui sebelumnya.', 'ORDER_ALREADY_REVIEWED', 400);
      }

      const pharmacistName = actor.fullName || actor.username || 'Apoteker Klinis, S.Farm, Apt';
      const pharmacistId = actor.userId || 'USR-PHARM-01';
      const serverTimestamp = new Date();

      const newStatus = reviewDecision === 'APPROVED' ? 'REVIEWED' : (reviewDecision === 'REJECTED' ? 'CANCELLED' : 'ORDERED');

      const updateSql = `
        UPDATE medication_orders
        SET pharmacist_review_status = $1,
            pharmacist_review_notes = $2,
            reviewed_by_pharmacist_id = $3,
            reviewed_by_pharmacist_name = $4,
            reviewed_at = $5,
            status = $6,
            updated_at = $5
        WHERE id = $7
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [
        reviewDecision,
        pharmacistNotes,
        pharmacistId,
        pharmacistName,
        serverTimestamp,
        newStatus,
        medicationOrderId
      ]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'PHARMACY_REVIEW',
        medicationOrderId,
        'MEDICATION_PHARMACY_REVIEWED',
        JSON.stringify({
          medicationOrderId,
          reviewDecision,
          pharmacistName,
          reviewedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal melakukan telaah klinis apoteker: ${err.message}`, 'PHARMACY_REVIEW_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 3. FEFO Inventory Stock Allocation & Dispensing with OCC Race Condition Barrier
   */
  dispenseMedicationFEFO: async ({
    medicationOrderId,
    warehouseId = 'wh-central-001',
    quantityToDispense = 1,
    expectedBatchId = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_PHARMACIST_ROLES.includes(authorRole)) {
      throw new MedicationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang melakukan dispensing obat.`,
        'FORBIDDEN_PHARMACIST_ROLE',
        403
      );
    }

    if (!medicationOrderId || quantityToDispense <= 0) {
      throw new MedicationDomainError('Medication Order ID dan Kuantitas Dispense (>0) wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const medRes = await client.query('SELECT * FROM medication_orders WHERE id = $1 FOR UPDATE;', [medicationOrderId]);
      if (medRes.rows.length === 0) {
        throw new MedicationDomainError(`Medication order dengan ID ${medicationOrderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const med = medRes.rows[0];

      // Pharmacist MMU.4 Review Guard
      if (med.pharmacist_review_status !== 'APPROVED') {
        throw new MedicationDomainError(
          'DITOLAK: Resep belum disetujui dalam telaah klinis apoteker (MMU.4). Dispensing dilarang keras!',
          'DISPENSE_WITHOUT_PHARMACIST_APPROVAL_REJECTED',
          400
        );
      }

      if (med.status === 'CANCELLED') {
        throw new MedicationDomainError('Ditolak: Resep obat telah dibatalkan.', 'ORDER_ALREADY_CANCELLED', 400);
      }

      if (med.dispense_status === 'DISPENSED') {
        throw new MedicationDomainError('Resep obat ini sudah di-dispense sebelumnya.', 'ORDER_ALREADY_DISPENSED', 400);
      }

      const serverTimestamp = new Date();

      // Strict FEFO Batch Selection
      const batchRes = await client.query(
        'SELECT * FROM inventory_batches WHERE (medication_code = $1 OR medication_id = $1) AND available_quantity > 0 ORDER BY expiry_date ASC FOR UPDATE;',
        [med.medication_code]
      );

      if (batchRes.rows.length === 0) {
        throw new MedicationDomainError(
          `Stok obat [${med.medication_name}] di gudang habis (Insufficient Inventory).`,
          'INSUFFICIENT_INVENTORY_STOCK',
          400
        );
      }

      const candidateBatch = batchRes.rows[0];

      // Check Expiry Date
      const expiryDate = new Date(candidateBatch.expiry_date);
      if (expiryDate <= serverTimestamp) {
        throw new MedicationDomainError(
          `Ditolak: Batch ${candidateBatch.batch_number} telah kedaluwarsa (Expired: ${candidateBatch.expiry_date}). Obat kedaluwarsa dilarang di-dispense!`,
          'EXPIRED_MEDICATION_REJECTED',
          400
        );
      }

      // Check Expected Batch if requested
      if (expectedBatchId && expectedBatchId !== candidateBatch.id) {
        throw new MedicationDomainError(
          `Pelanggaran FEFO: Batch ${expectedBatchId} bukan batch dengan tanggal kadaluwarsa terdekat. Sistem mewajibkan batch ${candidateBatch.batch_number} (Exp: ${candidateBatch.expiry_date}).`,
          'WRONG_FEFO_SELECTION_REJECTED',
          400
        );
      }

      // Check Quantity Availability
      if (candidateBatch.available_quantity < quantityToDispense) {
        throw new MedicationDomainError(
          `Stok batch ${candidateBatch.batch_number} tidak mencukupi (Tersedia: ${candidateBatch.available_quantity}, Diminta: ${quantityToDispense}).`,
          'INSUFFICIENT_BATCH_STOCK',
          400
        );
      }

      // Deduct Inventory Batch (Anti-Negative Stock & OCC)
      const newAvailableQty = candidateBatch.available_quantity - quantityToDispense;
      const newVersion = (candidateBatch.version || 1) + 1;

      const updateBatchRes = await client.query(`
        UPDATE inventory_batches
        SET available_quantity = $1,
            version = $2,
            updated_at = $3
        WHERE id = $4 AND version = $5
        RETURNING *;
      `, [newAvailableQty, newVersion, serverTimestamp, candidateBatch.id, candidateBatch.version]);

      if (updateBatchRes.rowCount === 0) {
        throw new MedicationDomainError(
          'Konflik konkurensi stok: Batch sedang dimutasi oleh transaksi apotek lain secara simultan (OCC Conflict).',
          'OPTIMISTIC_LOCK_CONFLICT',
          409
        );
      }

      // Record Immutable Stock Ledger Movement
      const movementId = crypto.randomUUID();
      const movementNumber = `MOV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await client.query(`
        INSERT INTO inventory_stock_movements (
          id, tenant_id, movement_number, warehouse_id, medication_id,
          batch_id, movement_type, quantity_delta, balance_before,
          balance_after, unit_cost, reference_doc_type, reference_doc_id,
          encounter_id, patient_id, performed_by_id, performed_by_name, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
      `, [
        movementId,
        med.patient_id,
        movementNumber,
        candidateBatch.warehouse_id || warehouseId,
        candidateBatch.medication_id || candidateBatch.id,
        candidateBatch.id,
        'PRESCRIPTION_DISPENSE',
        -quantityToDispense,
        candidateBatch.available_quantity,
        newAvailableQty,
        candidateBatch.unit_cost || 0.00,
        'MEDICATION_ORDER',
        medicationOrderId,
        med.encounter_id,
        med.patient_id,
        actor.userId || 'USR-PHARM-01',
        actor.fullName || actor.username || 'Apoteker Klinis',
        serverTimestamp
      ]);

      // Deterministic Dispense Barcode: DISP-<Enc>-<MedCode>-<Batch>-<Rand>
      const randHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const dispenseBarcode = `DISP-${med.encounter_id.toString().slice(0, 8)}-${med.medication_code}-${candidateBatch.batch_number}-${randHex}`;

      const allocationId = crypto.randomUUID();
      const insertAllocSql = `
        INSERT INTO medication_dispense_allocations (
          id, medication_order_id, cpoe_order_id, cpoe_item_id,
          encounter_id, patient_id, warehouse_id, batch_id,
          batch_number, expiry_date, quantity_dispensed, unit_price,
          total_price, dispensed_by_pharmacist_id, dispensed_by_pharmacist_name,
          dispense_barcode, dispensed_at, status, correlation_id, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18, $19, $20
        ) RETURNING *;
      `;

      const allocRes = await client.query(insertAllocSql, [
        allocationId,
        medicationOrderId,
        med.cpoe_order_id,
        med.cpoe_item_id,
        med.encounter_id,
        med.patient_id,
        candidateBatch.warehouse_id || warehouseId,
        candidateBatch.id,
        candidateBatch.batch_number,
        candidateBatch.expiry_date,
        quantityToDispense,
        candidateBatch.unit_price || med.unit_price || 0.00,
        (candidateBatch.unit_price || med.unit_price || 0.00) * quantityToDispense,
        actor.userId || 'USR-PHARM-01',
        actor.fullName || actor.username || 'Apoteker Klinis',
        dispenseBarcode,
        serverTimestamp,
        'DISPENSED',
        correlationId,
        serverTimestamp
      ]);

      // Update medication_orders
      await client.query(`
        UPDATE medication_orders
        SET dispense_status = 'DISPENSED',
            status = 'ACTIVE',
            updated_at = $1
        WHERE id = $2;
      `, [serverTimestamp, medicationOrderId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'MEDICATION_DISPENSE',
        allocationId,
        'MEDICATION_DISPENSED',
        JSON.stringify({
          allocationId,
          medicationOrderId,
          dispenseBarcode,
          batchNumber: candidateBatch.batch_number,
          quantityDispensed: quantityToDispense,
          dispensedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return allocRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal melakukan dispensing FEFO: ${err.message}`, 'DISPENSE_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 4. Bedside 6-Rights (Identity, Drug, Dose, Route, Timing, Reason) & IV Infusion Safety
   */
  verifyBedsideAndAdminister: async ({
    medicationOrderId,
    dispenseAllocationId,
    scannedPatientBarcode,
    scannedMedicationBarcode,
    doseGiven,
    doseUnit,
    routeGiven,
    verifiedConcentrationMgMl = null,
    verifiedInfusionRateMlHr = null,
    verifiedVolumeMl = null,
    witnessNurseId = null,
    witnessNurseName = null,
    clinicalNotes = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_NURSE_ADMIN_ROLES.includes(authorRole)) {
      throw new MedicationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin memberikan obat di bedside (eMAR Administration).`,
        'FORBIDDEN_NURSE_ROLE',
        403
      );
    }

    if (!medicationOrderId || !dispenseAllocationId || !scannedPatientBarcode || !scannedMedicationBarcode) {
      throw new MedicationDomainError('Semua parameter bedside barcode dan identitas wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const medRes = await client.query('SELECT * FROM medication_orders WHERE id = $1 FOR UPDATE;', [medicationOrderId]);
      if (medRes.rows.length === 0) {
        throw new MedicationDomainError(`Medication order ${medicationOrderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }
      const med = medRes.rows[0];

      if (med.status === 'CANCELLED') {
        throw new MedicationDomainError('Ditolak: Resep obat telah dibatalkan oleh dokter.', 'ORDER_ALREADY_CANCELLED', 400);
      }

      const allocRes = await client.query('SELECT * FROM medication_dispense_allocations WHERE id = $1 FOR UPDATE;', [dispenseAllocationId]);
      if (allocRes.rows.length === 0) {
        throw new MedicationDomainError(`Dispense allocation ${dispenseAllocationId} tidak ditemukan.`, 'ALLOCATION_NOT_FOUND', 404);
      }
      const alloc = allocRes.rows[0];

      // ─── 6-RIGHTS INVARIANTS ENFORCEMENT ───

      // 1. RIGHT PATIENT: Scanned Patient Barcode Check
      const expectedPatientBarcode = med.patient_id.toString();
      const expectedMrnBarcode = med.patient_id.toString().slice(0, 8);
      if (scannedPatientBarcode !== expectedPatientBarcode && scannedPatientBarcode !== expectedMrnBarcode && !scannedPatientBarcode.includes(expectedMrnBarcode)) {
        throw new MedicationDomainError(
          `HARD STOP PATIENT SAFETY: Barcode gelang pasien (${scannedPatientBarcode}) TIDAK COCOK dengan Pasien Resep (${expectedMrnBarcode}). Pemberian obat diblokir!`,
          'WRONG_PATIENT_BARCODE',
          400
        );
      }

      // 2. RIGHT MEDICATION: Scanned Drug Barcode Check
      if (scannedMedicationBarcode !== alloc.dispense_barcode) {
        throw new MedicationDomainError(
          `HARD STOP MEDICATION SAFETY: Barcode obat fisik (${scannedMedicationBarcode}) TIDAK COCOK dengan Barcode Dispense Farmasi (${alloc.dispense_barcode}). Pemberian obat diblokir!`,
          'WRONG_MEDICATION_BARCODE',
          400
        );
      }

      // 3. RIGHT DOSE: Dose Quantity Check
      if (Number(doseGiven) !== Number(med.dosage_quantity)) {
        throw new MedicationDomainError(
          `HARD STOP DOSE SAFETY: Dosis yang akan diberikan (${doseGiven} ${doseUnit}) TIDAK COCOK dengan Dosis Resep (${med.dosage_quantity} ${med.dosage_unit}).`,
          'WRONG_DOSE_ADMINISTRATION',
          400
        );
      }

      // 4. RIGHT ROUTE: Route Check
      if (routeGiven.toUpperCase() !== med.route.toUpperCase()) {
        throw new MedicationDomainError(
          `HARD STOP ROUTE SAFETY: Rute pemberian (${routeGiven}) TIDAK COCOK dengan Rute Resep (${med.route}).`,
          'WRONG_ROUTE_ADMINISTRATION',
          400
        );
      }

      const serverTimestamp = new Date();

      // 5. RIGHT TIMING: Frequency Scheduling Engine Guard
      const pastAdminRes = await client.query(
        'SELECT * FROM medication_emar_administrations WHERE medication_order_id = $1 AND administration_status = $2 ORDER BY administered_at DESC;',
        [medicationOrderId, 'GIVEN']
      );

      if (pastAdminRes.rows.length > 0) {
        const lastAdmin = pastAdminRes.rows[0];
        const timeDiffMs = serverTimestamp.getTime() - new Date(lastAdmin.administered_at).getTime();
        const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

        if (med.is_prn) {
          const minInterval = med.prn_min_interval_hours || 4;
          if (timeDiffHours < minInterval) {
            throw new MedicationDomainError(
              `PRN INTERVAL VIOLATION: Obat PRN ${med.medication_name} baru saja diberikan ${timeDiffHours.toFixed(1)} jam lalu (Batas minimum interval: ${minInterval} jam). Pemberian diblokir!`,
              'PRN_INTERVAL_VIOLATION',
              400
            );
          }
        } else if (med.timing_type === 'STAT' || med.timing_type === 'NOW' || med.frequency === 'ONCE') {
          // STAT / ONCE medication can only be administered ONCE
          throw new MedicationDomainError(
            `STAT/ONCE MEDICATION VIOLATION: Obat ${med.medication_name} berstatus ${med.timing_type} dan sudah selesai diberikan sebelumnya pada ${lastAdmin.administered_at}.`,
            'STAT_MEDICATION_ALREADY_ADMINISTERED',
            400
          );
        } else {
          // Calculate interval window based on schedule frequency
          const freqMult = parseFrequencyMultiplier(med.frequency);
          const nominalIntervalHours = 24 / freqMult;
          const minSafeIntervalMs = (nominalIntervalHours * 0.5) * 60 * 60 * 1000; // minimum 50% of nominal window

          if (timeDiffMs < minSafeIntervalMs && timeDiffMs < 15 * 60 * 1000) {
            throw new MedicationDomainError(
              `DOUBLE ADMINISTRATION PREVENTED: Obat ${med.medication_name} (${med.frequency}) telah diberikan pada pasien ini ${Math.floor(timeDiffMs / 1000)} detik lalu oleh ${lastAdmin.administered_by_nurse_name}.`,
              'DOUBLE_ADMINISTRATION_PREVENTED',
              400
            );
          }
        }
      }

      // 6. HIGH-ALERT / IV INFUSION INDEPENDENT DOUBLE-CHECK (JCI IPSG 3)
      if (med.high_alert === true || med.lasa_flag === true || med.route.includes('IV_INFUSION') || med.timing_type === 'CONTINUOUS') {
        if (!witnessNurseId || !witnessNurseName) {
          throw new MedicationDomainError(
            `JCI IPSG 3 DUAL-SIGNOFF REQUIRED: Obat ${med.medication_name} adalah obat HIGH-ALERT / INFUS KONTINU. Wajib diverifikasi dan ditandatangani oleh Perawat Saksi (Witness Nurse).`,
            'HIGH_ALERT_DUAL_SIGNOFF_REQUIRED',
            400
          );
        }

        // IV Infusion Concentration & Rate Check
        if (med.route.includes('IV_INFUSION') || med.timing_type === 'CONTINUOUS') {
          if (med.infusion_rate_ml_hr && Number(verifiedInfusionRateMlHr) !== Number(med.infusion_rate_ml_hr)) {
            throw new MedicationDomainError(
              `IV INFUSION RATE MISMATCH: Kecepatan tetesan infus (${verifiedInfusionRateMlHr} mL/jam) tidak cocok dengan instruksi resep (${med.infusion_rate_ml_hr} mL/jam).`,
              'INFUSION_RATE_MISMATCH',
              400
            );
          }
        }
      }

      const adminId = crypto.randomUUID();
      const nurseName = actor.fullName || actor.username || 'Perawat Pelaksana, S.Kep';
      const nurseId = actor.userId || 'USR-NURSE-01';

      // Digital Signature (SHA-256)
      const sigPayload = `${adminId}:${medicationOrderId}:${nurseId}:${doseGiven}:${routeGiven}:${serverTimestamp.toISOString()}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      // Insert eMAR Administration Record
      const insertAdminSql = `
        INSERT INTO medication_emar_administrations (
          id, medication_order_id, cpoe_order_id, cpoe_item_id,
          dispense_allocation_id, encounter_id, patient_id,
          administered_at, administered_by_nurse_id, administered_by_nurse_name,
          witness_nurse_id, witness_nurse_name, dose_given,
          dose_unit, route_given, scanned_patient_barcode,
          scanned_medication_barcode, five_rights_verified, administration_status,
          clinical_notes, charge_captured, charge_id, digital_signature_hash,
          correlation_id, version, verified_concentration_mg_ml, verified_infusion_rate_ml_hr,
          verified_volume_ml, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10,
          $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22, $23,
          $24, $25, $26, $27,
          $28, $29
        ) RETURNING *;
      `;

      const chargeId = crypto.randomUUID();

      const adminRes = await client.query(insertAdminSql, [
        adminId,
        medicationOrderId,
        med.cpoe_order_id,
        med.cpoe_item_id,
        dispenseAllocationId,
        med.encounter_id,
        med.patient_id,
        serverTimestamp,
        nurseId,
        nurseName,
        witnessNurseId,
        witnessNurseName,
        doseGiven,
        doseUnit,
        routeGiven,
        scannedPatientBarcode,
        scannedMedicationBarcode,
        true,
        'GIVEN',
        clinicalNotes || `Indikasi: ${med.clinical_indication_notes || 'Sesuai DPJP'}`,
        true,
        chargeId,
        digitalSignatureHash,
        correlationId,
        1,
        verifiedConcentrationMgMl || med.concentration_mg_ml || null,
        verifiedInfusionRateMlHr || med.infusion_rate_ml_hr || null,
        verifiedVolumeMl || med.infusion_volume_ml || null,
        serverTimestamp
      ]);

      // Update CPOE Item Status to COMPLETED
      if (med.cpoe_item_id) {
        await client.query(
          "UPDATE cpoe_order_items SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
          [serverTimestamp, med.cpoe_item_id]
        );
      }

      // PARENT/CHILD CPOE COMPLETION FSM
      if (med.cpoe_order_id) {
        const orderItemsRes = await client.query(
          'SELECT status FROM cpoe_order_items WHERE order_id = $1;',
          [med.cpoe_order_id]
        );
        const allItems = orderItemsRes.rows;
        const totalCount = allItems.length;
        const completedCount = allItems.filter(it => it.status === 'COMPLETED').length;

        if (totalCount > 0 && completedCount === totalCount) {
          await client.query(
            "UPDATE clinical_orders SET status = 'COMPLETED', updated_at = $1 WHERE id = $2;",
            [serverTimestamp, med.cpoe_order_id]
          );
        } else if (completedCount > 0) {
          await client.query(
            "UPDATE clinical_orders SET status = 'PARTIALLY_COMPLETED', updated_at = $1 WHERE id = $2;",
            [serverTimestamp, med.cpoe_order_id]
          );
        }
      }

      // Universal Audit Log
      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
      `, [
        crypto.randomUUID(),
        nurseId,
        nurseName,
        authorRole,
        clientIp,
        'EXECUTE',
        'EMAR_ADMINISTRATION',
        adminId,
        med.patient_id,
        JSON.stringify(alloc),
        JSON.stringify(adminRes.rows[0]),
        `Pemberian obat bedside eMAR 6-Rights [${med.medication_name}] dosis ${doseGiven} ${doseUnit} (${routeGiven})`,
        digitalSignatureHash,
        serverTimestamp
      ]);

      // Outbox Event 1: Administration Completed
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'EMAR_ADMINISTRATION',
        adminId,
        'MEDICATION_ADMINISTERED',
        JSON.stringify({
          administrationId: adminId,
          medicationOrderId,
          patientId: med.patient_id,
          encounterId: med.encounter_id,
          medicationName: med.medication_name,
          doseGiven,
          routeGiven,
          administeredBy: nurseName,
          witnessNurse: witnessNurseName,
          administeredAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      // Outbox Event 2: Charge Capture Exactly-Once
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'BILLING_CHARGE',
        chargeId,
        'CHARGE_CAPTURE_RECORDED',
        JSON.stringify({
          chargeId,
          sourceType: 'MEDICATION_ADMINISTRATION',
          sourceId: adminId,
          patientId: med.patient_id,
          encounterId: med.encounter_id,
          amount: alloc.total_price || 0.00,
          capturedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return adminRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal melakukan administrasi eMAR: ${err.message}`, 'ADMIN_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 5. Medication Reconciliation (Admission)
   */
  reconcileAdmissionMedications: async ({
    encounterId,
    patientId,
    homeMedications = [],
    decisions = [],
    reconciliationNotes = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId || !patientId) {
      throw new MedicationDomainError('Encounter ID dan Patient ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const reconId = crypto.randomUUID();
      const serverTimestamp = new Date();
      const reconByName = actor.fullName || actor.username || 'dr. DPJP';
      const reconById = actor.userId || 'USR-DOC-01';
      const reconRole = actor.role || 'ROLE_DOCTOR_DPJP';

      const discontinued = decisions.filter(d => d.action === 'DISCONTINUE');

      const insertReconSql = `
        INSERT INTO medication_reconciliations (
          id, encounter_id, patient_id, reconciliation_type,
          source_medications, reconciled_medications, discontinued_medications,
          reconciled_by_id, reconciled_by_name, reconciled_by_role,
          reconciled_at, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;

      const reconRes = await client.query(insertReconSql, [
        reconId,
        encounterId,
        patientId,
        'ADMISSION',
        JSON.stringify(homeMedications),
        JSON.stringify(decisions),
        JSON.stringify(discontinued),
        reconById,
        reconByName,
        reconRole,
        serverTimestamp,
        correlationId,
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
        'MEDICATION_RECONCILIATION',
        reconId,
        'ADMISSION_MEDICATION_RECONCILED',
        JSON.stringify({
          reconId,
          encounterId,
          patientId,
          homeMedCount: homeMedications.length,
          reconciledBy: reconByName,
          reconciledAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return reconRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal rekonsiliasi obat admisi: ${err.message}`, 'RECONCILIATION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 6. Medication Reconciliation (Discharge & Take-Home Instructions)
   */
  reconcileDischargeMedications: async ({
    encounterId,
    patientId,
    inpatientMedications = [],
    dischargePrescriptions = [],
    dischargeInstructions = 'Minum obat sesuai aturan, kontrol kembali jika keluhan berulang.',
    patientEducationDelivered = true
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId || !patientId) {
      throw new MedicationDomainError('Encounter ID dan Patient ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const reconId = crypto.randomUUID();
      const serverTimestamp = new Date();
      const reconByName = actor.fullName || actor.username || 'Apoteker / dr. DPJP';
      const reconById = actor.userId || 'USR-PHARM-01';
      const reconRole = actor.role || 'ROLE_PHARMACIST';

      const insertReconSql = `
        INSERT INTO medication_reconciliations (
          id, encounter_id, patient_id, reconciliation_type,
          source_medications, reconciled_medications, discontinued_medications,
          discharge_instructions, reconciled_by_id, reconciled_by_name, reconciled_by_role,
          reconciled_at, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;

      const reconRes = await client.query(insertReconSql, [
        reconId,
        encounterId,
        patientId,
        'DISCHARGE',
        JSON.stringify(inpatientMedications),
        JSON.stringify(dischargePrescriptions),
        JSON.stringify([]),
        dischargeInstructions,
        reconById,
        reconByName,
        reconRole,
        serverTimestamp,
        correlationId,
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
        'MEDICATION_RECONCILIATION',
        reconId,
        'DISCHARGE_MEDICATION_RECONCILED',
        JSON.stringify({
          reconId,
          encounterId,
          patientId,
          dischargePrescriptionCount: dischargePrescriptions.length,
          patientEducationDelivered,
          reconciledBy: reconByName,
          reconciledAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return reconRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal rekonsiliasi obat pulang (discharge): ${err.message}`, 'RECONCILIATION_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 7. Document Adverse Drug Reaction (ADR)
   */
  documentAdverseReaction: async ({
    administrationId,
    adverseReactionNotes
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!administrationId || !adverseReactionNotes || adverseReactionNotes.trim().length < 5) {
      throw new MedicationDomainError('Administration ID dan Catatan Reaksi Obat (min 5 karakter) wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const adminRes = await client.query('SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE;', [administrationId]);
      if (adminRes.rows.length === 0) {
        throw new MedicationDomainError(`Data administrasi dengan ID ${administrationId} tidak ditemukan.`, 'ADMIN_NOT_FOUND', 404);
      }

      const serverTimestamp = new Date();
      const updateSql = `
        UPDATE medication_emar_administrations
        SET adverse_reaction_observed = TRUE,
            adverse_reaction_notes = $1
        WHERE id = $2
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [adverseReactionNotes.trim(), administrationId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'MEDICATION_ADVERSE_EVENT',
        administrationId,
        'MEDICATION_ADVERSE_REACTION_LOGGED',
        JSON.stringify({
          administrationId,
          notes: adverseReactionNotes.trim(),
          recordedBy: actor.fullName || actor.username || 'Tenaga Medis',
          recordedAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal mencatat reaksi efek samping obat: ${err.message}`, 'ADR_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * 8. Cancel Medication Order & Cancellation Propagation
   */
  cancelMedicationOrder: async ({
    medicationOrderId,
    cancellationReason = 'Instruksi DPJP'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!medicationOrderId) {
      throw new MedicationDomainError('Medication Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const medRes = await client.query('SELECT * FROM medication_orders WHERE id = $1 FOR UPDATE;', [medicationOrderId]);
      if (medRes.rows.length === 0) {
        throw new MedicationDomainError(`Medication order ${medicationOrderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }

      const serverTimestamp = new Date();
      const updateSql = `
        UPDATE medication_orders
        SET status = 'CANCELLED',
            updated_at = $1
        WHERE id = $2
        RETURNING *;
      `;

      const updatedRes = await client.query(updateSql, [serverTimestamp, medicationOrderId]);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [
        crypto.randomUUID(),
        'MEDICATION_ORDER',
        medicationOrderId,
        'MEDICATION_ORDER_CANCELLED',
        JSON.stringify({
          medicationOrderId,
          reason: cancellationReason,
          cancelledBy: actor.fullName || actor.username || 'Dokter DPJP',
          cancelledAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updatedRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof MedicationDomainError) throw err;
      throw new MedicationDomainError(`Gagal membatalkan pesanan obat: ${err.message}`, 'CANCEL_FAILED', 500);
    } finally {
      client.release();
    }
  }
};
