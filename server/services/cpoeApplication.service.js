/**
 * NurseFlow Enterprise HIS 2026 — Master Universal CPOE Application Service
 * Domain Authority: Canonical Clinical Ordering Backbone (Lab, Rad, Meds, Procedure)
 * Standards: JCI 7th Edition (MMU.4, IPSG.1-2), HL7 FHIR ServiceRequest / MedicationRequest,
 * PostgreSQL 16 ACID Transactions, Idempotency Guard, Optimistic Concurrency, Transactional Outbox.
 * P0-2B Wave 1B.3 C1-A: Strict Multi-Tenant UoW, Authenticated Actor Provenance, Idempotency Isolation
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { withUnitOfWork, isValidUuid } from '../db/unitOfWork.js';
import { safetyAuthorizationService } from './safetyAuthorization.service.js';
import { canonicalStringify } from '../../src/core/safetyDecision.js';

export class CpoeDomainError extends Error {
  constructor(message, code = 'CPOE_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(`[${code}] ${message}`);
    this.name = 'CpoeDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_ORDER_CREATORS = [
  'ROLE_SUPER_ADMIN',
  'ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'DOCTOR'
];

const VALID_ORDER_CATEGORIES = [
  'PHARMACY',
  'LABORATORY',
  'RADIOLOGY',
  'PROCEDURE',
  'DIET',
  'NURSING_CARE'
];

const VALID_PRIORITIES = ['ROUTINE', 'URGENT', 'CITO', 'STAT'];

export const cpoeApplicationService = {
  /**
   * Create Authoritative Universal Clinical Order (ACID Unit of Work + Idempotency Guard)
   */
  createOrder: async ({
    encounterId,
    patientId = null,
    episodeId = null,
    orderCategory = 'LABORATORY',
    priority = 'ROUTINE',
    clinicalIndication,
    targetPerformerDept = null,
    items = [],
    idempotencyKey = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    // 1. Author Identity & Authentication Enforcement
    if (!actor || (!actor.userId && !actor.id)) {
      throw new CpoeDomainError(
        'FAIL-CLOSED: Identitas staf medis yang terotentikasi wajib disertakan.',
        'AUTHENTICATION_REQUIRED',
        401
      );
    }

    const resolvedTenantId = actor.tenantId || actor.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new CpoeDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan penerbitan CPOE.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    const authorRole = actor.role || (Array.isArray(actor.roles) ? actor.roles[0] : 'UNAUTHENTICATED');
    const authorRoles = Array.isArray(actor.authorizedRoles) ? actor.authorizedRoles : [authorRole];
    const isAuthorized = AUTHORIZED_ORDER_CREATORS.some(r => authorRoles.includes(r) || authorRole === r);

    if (!isAuthorized) {
      throw new CpoeDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin menerbitkan CPOE Order Medis.`,
        'FORBIDDEN_CPOE_ROLE',
        403,
        [{ role: authorRole, required: AUTHORIZED_ORDER_CREATORS }]
      );
    }

    const requesterId = actor.userId || actor.id;
    const requesterName = actor.fullName || actor.username || actor.name;
    if (!requesterName) {
      throw new CpoeDomainError(
        'Nama staf medis (requesterName) wajib tersedia.',
        'AUTHENTICATION_REQUIRED',
        401
      );
    }

    // 2. Validate Core Invariants
    if (!encounterId) {
      throw new CpoeDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400, [{ field: 'encounterId' }]);
    }
    if (!clinicalIndication || clinicalIndication.trim().length === 0) {
      throw new CpoeDomainError('Indikasi klinis CPOE wajib diisi.', 'INCOMPLETE_CLINICAL_INDICATION', 400);
    }
    if (!VALID_ORDER_CATEGORIES.includes(orderCategory.toUpperCase())) {
      throw new CpoeDomainError(
        `Kategori order [${orderCategory}] tidak valid.`,
        'INVALID_ORDER_CATEGORY',
        400,
        [{ allowed: VALID_ORDER_CATEGORIES }]
      );
    }
    if (!VALID_PRIORITIES.includes(priority.toUpperCase())) {
      throw new CpoeDomainError(
        `Prioritas order [${priority}] tidak valid.`,
        'INVALID_ORDER_PRIORITY',
        400,
        [{ allowed: VALID_PRIORITIES }]
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new CpoeDomainError(
        'Order CPOE wajib memiliki minimal 1 (satu) rincian item tindakan/pemeriksaan.',
        'EMPTY_ORDER_ITEMS',
        400
      );
    }

    // Validate item structure
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      if (!itm.catalogCode || !itm.itemName) {
        throw new CpoeDomainError(
          `Item ke-${i + 1} tidak valid: catalogCode dan itemName wajib diisi.`,
          'INVALID_ORDER_ITEM',
          400,
          [{ index: i, item: itm }]
        );
      }
      const qty = parseFloat(itm.quantity || 1);
      if (isNaN(qty) || qty <= 0) {
        throw new CpoeDomainError(
          `Item ke-${i + 1} [${itm.itemName}]: Kuantitas (${itm.quantity}) harus lebih besar dari 0.`,
          'INVALID_ITEM_QUANTITY',
          400
        );
      }
    }

    try {
      return await withUnitOfWork(
        postgresPoolService.getPool(),
        {
          tenantId: resolvedTenantId,
          actorId: requesterId,
          userRole: authorRole,
          isolationLevel: 'READ COMMITTED'
        },
        async ({ client, query, tenantId }) => {
          // 3. Idempotency Check (Scoped to current tenant)
          if (idempotencyKey) {
            const existingOrderRes = await query(
              'SELECT * FROM clinical_orders WHERE idempotency_key = $1 AND tenant_id = $2 FOR UPDATE;',
              [idempotencyKey, tenantId]
            );
            if (existingOrderRes.rows.length > 0) {
              const existingOrder = existingOrderRes.rows[0];
              const itemsRes = await query(
                'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
                [existingOrder.id]
              );
              return {
                ...existingOrder,
                items: itemsRes.rows,
                isIdempotentReplay: true
              };
            }
          }

          // 4. Lock & Validate Encounter Status
          const encRes = await query(
            'SELECT id, patient_id, episode_id, status, tenant_id FROM encounters WHERE id = $1 FOR UPDATE;',
            [encounterId]
          );
          if (encRes.rows.length === 0) {
            throw new CpoeDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
          }
          const encounter = encRes.rows[0];
          if (encounter.tenant_id && encounter.tenant_id !== tenantId) {
            throw new CpoeDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
          }
          if (['DISCHARGED', 'CANCELLED', 'CLOSED'].includes(encounter.status?.toUpperCase())) {
            throw new CpoeDomainError(
              `Ditolak: Tidak dapat menerbitkan CPOE pada encounter dengan status terminal [${encounter.status}].`,
              'ENCOUNTER_TERMINAL_STATE',
              400
            );
          }

          const targetPatientId = patientId || encounter.patient_id;
          const targetEpisodeId = episodeId || encounter.episode_id;
          const targetTenantId = tenantId;

          // 5. Generate Server-Authoritative Identifiers
          const serverTimestamp = new Date();
          const orderId = crypto.randomUUID();
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const datePart = serverTimestamp.toISOString().slice(0, 10).replace(/-/g, '');
          const orderNumber = `ORD-${datePart}-${randomSuffix}`;
          const isCito = ['CITO', 'STAT'].includes(priority.toUpperCase());

          // 6. Calculate Totals and Prepare Items
          let totalEstimatedAmount = 0;
          const normalizedItems = items.map((itm) => {
            const itemId = itm.id || crypto.randomUUID();
            const quantity = parseFloat(itm.quantity || 1);
            const unitPrice = parseFloat(itm.unitPrice || 0);
            const totalPrice = quantity * unitPrice;
            totalEstimatedAmount += totalPrice;

            const rawType = (itm.itemType || orderCategory).toUpperCase();
            const itemType = rawType === 'PHARMACY' ? 'MEDICATION' : rawType;

            return {
              id: itemId,
              orderId,
              itemType,
              catalogCode: itm.catalogCode,
              itemName: itm.itemName,
              itemSpecifications: itm.itemSpecifications || itm.specifications || {},
              quantity,
              unit: itm.unit || 'X',
              unitPrice,
              totalPrice,
              priority: (itm.priority || priority).toUpperCase(),
              status: 'ORDERED',
              instructions: itm.instructions || ''
            };
          });

          // 7. Insert Order Header into clinical_orders
          const insertOrderSql = `
            INSERT INTO clinical_orders (
              id, tenant_id, order_number, patient_id, episode_id, encounter_id,
              ordered_by, order_category, priority, clinical_indication,
              status, is_cito, order_items_count, total_estimated_amount,
              idempotency_key, version, requester_id, requester_name, requester_role,
              target_performer_dept, correlation_id, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10,
              $11, $12, $13, $14,
              $15, $16, $17, $18, $19,
              $20, $21, $22, $23
            ) RETURNING *;
          `;

          const orderResult = await query(insertOrderSql, [
            orderId,
            targetTenantId,
            orderNumber,
            targetPatientId,
            targetEpisodeId,
            encounterId,
            requesterName,
            orderCategory.toUpperCase(),
            priority.toUpperCase(),
            clinicalIndication.trim(),
            'ORDERED',
            isCito,
            normalizedItems.length,
            totalEstimatedAmount,
            idempotencyKey,
            1, // version
            requesterId,
            requesterName,
            authorRole,
            targetPerformerDept || orderCategory.toUpperCase(),
            correlationId,
            serverTimestamp,
            serverTimestamp
          ]);

          const createdOrder = orderResult.rows[0];

          // 8. Insert Order Items into cpoe_order_items
          const insertedItems = [];
          for (const itm of normalizedItems) {
            const insertItemSql = `
              INSERT INTO cpoe_order_items (
                id, order_id, item_type, catalog_code, item_name,
                item_specifications, quantity, unit, unit_price, total_price,
                priority, status, instructions, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15
              ) RETURNING *;
            `;
            const itemRes = await query(insertItemSql, [
              itm.id,
              itm.orderId,
              itm.itemType,
              itm.catalogCode,
              itm.itemName,
              JSON.stringify(itm.itemSpecifications),
              itm.quantity,
              itm.unit,
              itm.unitPrice,
              itm.totalPrice,
              itm.priority,
              itm.status,
              itm.instructions,
              serverTimestamp,
              serverTimestamp
            ]);
            insertedItems.push(itemRes.rows[0]);
          }

          // 9. Insert Immutable Audit Log into universal_audit_logs with explicit tenant_id
          const signatureHash = crypto.createHash('sha256')
            .update(`${requesterId}:CREATE:CPOE_ORDER:${orderId}:${JSON.stringify({ ...createdOrder, items: insertedItems })}`)
            .digest('hex');

          await query(`
            INSERT INTO universal_audit_logs (
              id, actor_id, actor_name, actor_role, client_ip,
              action_type, resource_type, resource_id, patient_id,
              before_state, after_state, reason_for_action, signature_hash,
              correlation_id, created_at, tenant_id
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              $14, $15, $16
            );
          `, [
            crypto.randomUUID(),
            requesterId,
            requesterName,
            authorRole,
            clientIp,
            'CREATE',
            'CPOE_ORDER',
            orderId,
            targetPatientId,
            null,
            JSON.stringify({ ...createdOrder, items: insertedItems }),
            `Penerbitan CPOE Order [${orderNumber}] Kategori [${orderCategory}]`,
            signatureHash,
            correlationId,
            serverTimestamp,
            targetTenantId
          ]);

          // 10. Insert Domain Event into clinical_domain_outbox
          const outboxId = crypto.randomUUID();
          await query(`
            INSERT INTO clinical_domain_outbox (
              id, aggregate_type, aggregate_id, event_type,
              event_payload, status, correlation_id, idempotency_key, created_at
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8, $9
            );
          `, [
            outboxId,
            'CPOE_ORDER',
            orderId,
            'ORDER_CREATED',
            JSON.stringify({
              orderId,
              orderNumber,
              encounterId,
              patientId: targetPatientId,
              orderCategory,
              priority,
              requesterId,
              requesterName,
              items: insertedItems,
              createdAt: serverTimestamp.toISOString()
            }),
            'PENDING',
            correlationId,
            idempotencyKey,
            serverTimestamp
          ]);

          return {
            ...createdOrder,
            items: insertedItems,
            auditSignature: signatureHash,
            outboxEventId: outboxId
          };
        }
      );
    } catch (err) {
      // Hardened Idempotency Recovery (Scoped strictly to target tenant via Unit of Work)
      if (idempotencyKey && (err.code === '23505' || err.message?.includes('uq_clinical_orders_idempotency'))) {
        try {
          const recovered = await withUnitOfWork(
            postgresPoolService.getPool(),
            {
              tenantId: resolvedTenantId,
              actorId: requesterId,
              userRole: authorRole
            },
            async ({ query, tenantId }) => {
              const recoveredOrderRes = await query(
                'SELECT * FROM clinical_orders WHERE idempotency_key = $1 AND tenant_id = $2;',
                [idempotencyKey, tenantId]
              );
              if (recoveredOrderRes.rows.length > 0) {
                const recoveredOrder = recoveredOrderRes.rows[0];
                const recoveredItemsRes = await query(
                  'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
                  [recoveredOrder.id]
                );
                return {
                  ...recoveredOrder,
                  items: recoveredItemsRes.rows,
                  isIdempotentReplay: true
                };
              }
              return null;
            }
          );
          if (recovered) {
            return recovered;
          }
        } catch (_) {
          // If recovery fails or yields no match, rethrow original error
        }
      }
      throw err;
    }
  },

  /**
   * Cancel an existing CPOE Order with Mandatory Medicolegal Rationale & Safety Decision Guard
   */
  cancelOrder: async ({
    orderId,
    cancellationReason,
    expectedVersion = null,
    safetyDecision = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    // 1. Authenticated Actor & Role Enforcement
    if (!actor || (!actor.userId && !actor.id)) {
      throw new CpoeDomainError(
        'FAIL-CLOSED: Identitas staf medis yang terotentikasi wajib disertakan.',
        'AUTHENTICATION_REQUIRED',
        401
      );
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_ORDER_CREATORS.includes(authorRole)) {
      throw new CpoeDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin membatalkan CPOE Order.`,
        'FORBIDDEN_CPOE_ROLE',
        403
      );
    }

    const resolvedTenantId = actor.tenantId || actor.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new CpoeDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan pembatalan CPOE.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    if (!orderId) {
      throw new CpoeDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }
    if (!cancellationReason || cancellationReason.trim().length < 5) {
      throw new CpoeDomainError(
        'Alasan pembatalan CPOE Order wajib diisi minimal 5 karakter.',
        'INVALID_CANCELLATION_REASON',
        400
      );
    }

    const actorId = actor.userId || actor.id;
    const cancelledBy = actor.fullName || actor.username || actor.name;
    if (!cancelledBy) {
      throw new CpoeDomainError('Nama pembatal wajib tersedia.', 'AUTHENTICATION_REQUIRED', 401);
    }

    try {
      return await withUnitOfWork(
        postgresPoolService.getPool(),
        {
          tenantId: resolvedTenantId,
          actorId,
          userRole: authorRole,
          isolationLevel: 'READ COMMITTED'
        },
        async ({ client, query, tenantId }) => {
          // 2. Lock Order FOR UPDATE (Scoped to current tenant)
          const orderRes = await query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId]);
          if (orderRes.rows.length === 0) {
            throw new CpoeDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
          }

          const existingOrder = orderRes.rows[0];
          if (existingOrder.tenant_id && existingOrder.tenant_id !== tenantId) {
            throw new CpoeDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
          }

          // 3. Strict Safety Decision Authorization Verification using SAME client
          const verifiedDecision = await safetyAuthorizationService.verifyAndConsumeTransactional(client, {
            safetyDecision,
            actualCommandPayload: {
              orderId,
              cancellationReason: cancellationReason.trim(),
              expectedVersion: expectedVersion !== undefined && expectedVersion !== null ? Number(expectedVersion) : undefined
            },
            expectedAction: 'CPOE_ORDER_CANCEL',
            expectedPatientId: existingOrder.patient_id,
            expectedEncounterId: existingOrder.encounter_id,
            actor,
            tenantId,
            justification: cancellationReason.trim()
          });

          // 4. Invariant and Concurrency Checks
          if (expectedVersion !== undefined && expectedVersion !== null && existingOrder.version !== Number(expectedVersion)) {
            throw new CpoeDomainError(
              `Konflik konkurensi: Versi order (${existingOrder.version}) tidak sesuai dengan versi request (${expectedVersion}).`,
              'CONCURRENCY_CONFLICT',
              409,
              [{ expectedVersion, currentVersion: existingOrder.version }]
            );
          }
          if (existingOrder.status === 'CANCELLED') {
            throw new CpoeDomainError('Order ini sudah berstatus CANCELLED.', 'ORDER_ALREADY_CANCELLED', 400);
          }
          if (existingOrder.status === 'COMPLETED') {
            throw new CpoeDomainError('Order yang sudah COMPLETED tidak dapat dibatalkan.', 'ORDER_ALREADY_COMPLETED', 400);
          }

          const serverTimestamp = new Date();
          const newVersion = (existingOrder.version || 1) + 1;

          // 5. Update Header
          const updateSql = `
            UPDATE clinical_orders
            SET status = 'CANCELLED',
                cancelled_by = $1,
                cancelled_at = $2,
                cancellation_reason = $3,
                version = $4,
                updated_at = $2
            WHERE id = $5 AND tenant_id = $6
            RETURNING *;
          `;
          const updateRes = await query(updateSql, [
            cancelledBy,
            serverTimestamp,
            cancellationReason.trim(),
            newVersion,
            orderId,
            tenantId
          ]);

          // 6. Update Items status
          await query(
            "UPDATE cpoe_order_items SET status = 'CANCELLED', updated_at = $1 WHERE order_id = $2;",
            [serverTimestamp, orderId]
          );

          // 7. Audit Log with Native First-Class Safety Decision & Correlation Linkage (Explicit tenant_id)
          const signatureHash = crypto
            .createHash('sha256')
            .update(canonicalStringify({ 
              cancellationReason: cancellationReason.trim(),
              correlationId,
              decisionId: verifiedDecision.decisionId,
              orderId, 
              status: 'CANCELLED', 
              timestamp: serverTimestamp.toISOString() 
            }))
            .digest('hex');

          await query(`
            INSERT INTO universal_audit_logs (
              id, actor_id, actor_name, actor_role, client_ip,
              action_type, resource_type, resource_id, patient_id,
              before_state, after_state, reason_for_action, signature_hash,
              decision_id, correlation_id, created_at, tenant_id
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              $14, $15, $16, $17
            );
          `, [
            crypto.randomUUID(),
            actorId,
            cancelledBy,
            authorRole,
            clientIp,
            'UPDATE',
            'CPOE_ORDER',
            orderId,
            existingOrder.patient_id,
            JSON.stringify(existingOrder),
            JSON.stringify({ ...updateRes.rows[0], safetyDecisionId: verifiedDecision.decisionId }),
            `[Decision: ${verifiedDecision.decisionId}] Pembatalan CPOE Order [${existingOrder.order_number}]: ${cancellationReason}`,
            signatureHash,
            verifiedDecision.decisionId,
            correlationId,
            serverTimestamp,
            tenantId
          ]);

          // 8. Outbox Event
          await query(`
            INSERT INTO clinical_domain_outbox (
              id, aggregate_type, aggregate_id, event_type,
              event_payload, status, correlation_id, created_at
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8
            );
          `, [
            crypto.randomUUID(),
            'CPOE_ORDER',
            orderId,
            'ORDER_CANCELLED',
            JSON.stringify({
              orderId,
              orderNumber: existingOrder.order_number,
              cancellationReason,
              cancelledBy,
              safetyDecisionId: verifiedDecision.decisionId,
              correlationId,
              timestamp: serverTimestamp.toISOString()
            }),
            'PENDING',
            correlationId,
            serverTimestamp
          ]);

          return {
            ...updateRes.rows[0],
            safetyDecisionId: verifiedDecision.decisionId,
            auditSignature: signatureHash
          };
        }
      );
    } catch (err) {
      if (err instanceof CpoeDomainError) throw err;
      if (err.name === 'SafetyAuthorizationError') {
        throw new CpoeDomainError(err.message, err.code, err.statusCode, err.details);
      }
      throw new CpoeDomainError(`Gagal membatalkan order: ${err.message}`, 'CANCEL_FAILED', 500);
    }
  },

  /**
   * Get CPOE Order Details by ID with items and full aggregate
   */
  getOrderById: async (orderId, tenantContext = {}) => {
    if (!orderId) {
      throw new CpoeDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const tenantId = typeof tenantContext === 'string' ? tenantContext : (tenantContext?.tenantId || tenantContext?.tenant_id);
    if (!tenantId || !isValidUuid(tenantId)) {
      throw new CpoeDomainError(
        'Tenant context (UUID) wajib disertakan untuk membaca detail order.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'tenantContext.tenantId' }]
      );
    }

    return await withUnitOfWork(
      postgresPoolService.getPool(),
      { tenantId, isolationLevel: 'READ COMMITTED' },
      async ({ query }) => {
        const orderRes = await query('SELECT * FROM clinical_orders WHERE id = $1;', [orderId]);
        if (orderRes.rows.length === 0) {
          throw new CpoeDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
        }

        const order = orderRes.rows[0];
        const itemsRes = await query('SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;', [orderId]);

        return {
          ...order,
          items: itemsRes.rows
        };
      }
    );
  },

  /**
   * Get all CPOE Orders for a specific Encounter
   */
  getOrdersByEncounterId: async (encounterId, tenantContext = {}) => {
    if (!encounterId) {
      throw new CpoeDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const tenantId = typeof tenantContext === 'string' ? tenantContext : (tenantContext?.tenantId || tenantContext?.tenant_id);
    if (!tenantId || !isValidUuid(tenantId)) {
      throw new CpoeDomainError(
        'Tenant context (UUID) wajib disertakan untuk membaca order per encounter.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'tenantContext.tenantId' }]
      );
    }

    return await withUnitOfWork(
      postgresPoolService.getPool(),
      { tenantId, isolationLevel: 'READ COMMITTED' },
      async ({ query }) => {
        const ordersRes = await query(
          'SELECT * FROM clinical_orders WHERE encounter_id = $1 ORDER BY created_at DESC;',
          [encounterId]
        );

        const orders = ordersRes.rows;
        const ordersWithItems = [];
        for (const ord of orders) {
          const itemsRes = await query(
            'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
            [ord.id]
          );
          ordersWithItems.push({
            ...ord,
            items: itemsRes.rows
          });
        }

        return ordersWithItems;
      }
    );
  },

  /**
   * List CPOE Orders with filters and pagination
   * Shared Call Site CS 71 (GET /orders/cpoe & GET /orders)
   */
  listOrders: async (filters = {}, tenantContext = {}) => {
    const tenantId = typeof tenantContext === 'string' ? tenantContext : (tenantContext?.tenantId || tenantContext?.tenant_id);
    if (!tenantId || !isValidUuid(tenantId)) {
      throw new CpoeDomainError(
        'Tenant context (UUID) wajib disertakan untuk membaca daftar order.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'tenantContext.tenantId' }]
      );
    }

    return await withUnitOfWork(
      postgresPoolService.getPool(),
      { tenantId, isolationLevel: 'READ COMMITTED' },
      async ({ query }) => {
        let sql = 'SELECT * FROM clinical_orders';
        const params = [];
        const conditions = [];

        if (filters.encounterId) {
          params.push(filters.encounterId);
          conditions.push(`encounter_id = $${params.length}`);
        }
        if (filters.patientId) {
          params.push(filters.patientId);
          conditions.push(`patient_id = $${params.length}`);
        }
        if (filters.status) {
          params.push(filters.status);
          conditions.push(`status = $${params.length}`);
        }
        if (filters.orderCategory) {
          params.push(filters.orderCategory);
          conditions.push(`order_category = $${params.length}`);
        }

        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC LIMIT 100;';

        const ordersRes = await query(sql, params);
        const orders = ordersRes.rows;
        const ordersWithItems = [];
        for (const ord of orders) {
          const itemsRes = await query(
            'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
            [ord.id]
          );
          ordersWithItems.push({
            ...ord,
            items: itemsRes.rows
          });
        }

        return ordersWithItems;
      }
    );
  }
};
