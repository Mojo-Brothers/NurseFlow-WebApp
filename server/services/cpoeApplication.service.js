/**
 * NurseFlow Enterprise HIS 2026 — Master Universal CPOE Application Service
 * Domain Authority: Canonical Clinical Ordering Backbone (Lab, Rad, Meds, Procedure)
 * Standards: JCI 7th Edition (MMU.4, IPSG.1-2), HL7 FHIR ServiceRequest / MedicationRequest,
 * PostgreSQL 16 ACID Transactions, Idempotency Guard, Optimistic Concurrency, Transactional Outbox.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';

export class CpoeDomainError extends Error {
  constructor(message, code = 'CPOE_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'CpoeDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_ORDER_CREATORS = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY'
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
    // 1. Author Identity & Role Enforcement from Authenticated Principal (JWT)
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_ORDER_CREATORS.includes(authorRole)) {
      throw new CpoeDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin menerbitkan CPOE Order Medis.`,
        'FORBIDDEN_CPOE_ROLE',
        403,
        [{ role: authorRole, required: AUTHORIZED_ORDER_CREATORS }]
      );
    }

    const requesterId = actor.userId || 'DOC-SYSTEM-001';
    const requesterName = actor.fullName || actor.username || 'Dokter Pemeriksa';

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

    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      // 3. Idempotency Check
      if (idempotencyKey) {
        const existingOrderRes = await client.query(
          'SELECT * FROM clinical_orders WHERE idempotency_key = $1 FOR UPDATE;',
          [idempotencyKey]
        );
        if (existingOrderRes.rows.length > 0) {
          const existingOrder = existingOrderRes.rows[0];
          const itemsRes = await client.query(
            'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
            [existingOrder.id]
          );
          await client.query('COMMIT;');
          return {
            ...existingOrder,
            items: itemsRes.rows,
            isIdempotentReplay: true
          };
        }
      }

      // 4. Lock & Validate Encounter Status
      const encRes = await client.query(
        'SELECT id, patient_id, episode_id, status FROM encounters WHERE id = $1 FOR UPDATE;',
        [encounterId]
      );
      if (encRes.rows.length === 0) {
        throw new CpoeDomainError(`Encounter dengan ID ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
      }
      const encounter = encRes.rows[0];
      if (['DISCHARGED', 'CANCELLED', 'CLOSED'].includes(encounter.status?.toUpperCase())) {
        throw new CpoeDomainError(
          `Ditolak: Tidak dapat menerbitkan CPOE pada encounter dengan status terminal [${encounter.status}].`,
          'ENCOUNTER_TERMINAL_STATE',
          400
        );
      }

      const targetPatientId = patientId || encounter.patient_id;
      const targetEpisodeId = episodeId || encounter.episode_id;

      // 5. Generate Server-Authoritative Identifiers
      const serverTimestamp = new Date();
      const orderId = crypto.randomUUID();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const datePart = serverTimestamp.toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `ORD-${datePart}-${randomSuffix}`;
      const isCito = ['CITO', 'STAT'].includes(priority.toUpperCase());

      // 6. Calculate Totals and Prepare Items
      let totalEstimatedAmount = 0;
      const normalizedItems = items.map((itm, idx) => {
        const itemId = itm.id || crypto.randomUUID();
        const quantity = parseFloat(itm.quantity || 1);
        const unitPrice = parseFloat(itm.unitPrice || 0);
        const totalPrice = quantity * unitPrice;
        totalEstimatedAmount += totalPrice;

        return {
          id: itemId,
          orderId,
          itemType: (itm.itemType || orderCategory).toUpperCase(),
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
          id, order_number, patient_id, episode_id, encounter_id,
          ordered_by, order_category, priority, clinical_indication,
          status, is_cito, order_items_count, total_estimated_amount,
          idempotency_key, version, requester_id, requester_name, requester_role,
          target_performer_dept, correlation_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22
        ) RETURNING *;
      `;

      const orderResult = await client.query(insertOrderSql, [
        orderId,
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
        const itemRes = await client.query(insertItemSql, [
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

      // 9. Generate Cryptographic Audit Signature (SHA-256)
      const auditPayload = {
        orderId,
        orderNumber,
        encounterId,
        patientId: targetPatientId,
        requesterId,
        authorRole,
        orderCategory,
        itemsCount: normalizedItems.length,
        totalEstimatedAmount,
        timestamp: serverTimestamp.toISOString()
      };
      const signatureHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(auditPayload))
        .digest('hex');

      // 10. Insert Immutable Audit Log (SAME ATOMIC TRANSACTION)
      const insertAuditSql = `
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14
        ) RETURNING id;
      `;

      await client.query(insertAuditSql, [
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
        serverTimestamp
      ]);

      // 11. Insert Domain Event into Outbox (SAME ATOMIC TRANSACTION)
      const outboxId = crypto.randomUUID();
      const insertOutboxSql = `
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type,
          event_payload, status, idempotency_key, correlation_id, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9
        ) RETURNING id;
      `;

      await client.query(insertOutboxSql, [
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
          signatureHash,
          createdAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        idempotencyKey,
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');

      return {
        ...createdOrder,
        items: insertedItems,
        auditSignature: signatureHash,
        outboxEventId: outboxId
      };
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof CpoeDomainError) {
        throw err;
      }
      throw new CpoeDomainError(
        `Gagal memproses transaksi CPOE Order: ${err.message}`,
        'DATABASE_TRANSACTION_FAILED',
        500,
        [{ originalError: err.message }]
      );
    } finally {
      client.release();
    }
  },

  /**
   * Cancel an existing CPOE Order with Mandatory Medicolegal Rationale
   */
  cancelOrder: async ({
    orderId,
    cancellationReason,
    expectedVersion = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_ORDER_CREATORS.includes(authorRole)) {
      throw new CpoeDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki izin membatalkan CPOE Order.`,
        'FORBIDDEN_CPOE_ROLE',
        403
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

    const cancelledBy = actor.fullName || actor.username || 'Dokter Pembatal';
    const pool = postgresPoolService.getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

      const orderRes = await client.query('SELECT * FROM clinical_orders WHERE id = $1 FOR UPDATE;', [orderId]);
      if (orderRes.rows.length === 0) {
        throw new CpoeDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
      }

      const existingOrder = orderRes.rows[0];
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

      // Update Header
      const updateSql = `
        UPDATE clinical_orders
        SET status = 'CANCELLED',
            cancelled_by = $1,
            cancelled_at = $2,
            cancellation_reason = $3,
            version = $4,
            updated_at = $2
        WHERE id = $5
        RETURNING *;
      `;
      const updateRes = await client.query(updateSql, [
        cancelledBy,
        serverTimestamp,
        cancellationReason.trim(),
        newVersion,
        orderId
      ]);

      // Update Items status
      await client.query(
        "UPDATE cpoe_order_items SET status = 'CANCELLED', updated_at = $1 WHERE order_id = $2;",
        [serverTimestamp, orderId]
      );

      // Audit Log
      const signatureHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ orderId, status: 'CANCELLED', cancellationReason, timestamp: serverTimestamp }))
        .digest('hex');

      await client.query(`
        INSERT INTO universal_audit_logs (
          id, actor_id, actor_name, actor_role, client_ip,
          action_type, resource_type, resource_id, patient_id,
          before_state, after_state, reason_for_action, signature_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14
        );
      `, [
        crypto.randomUUID(),
        actor.userId || 'USR-DOC-001',
        cancelledBy,
        authorRole,
        clientIp,
        'UPDATE',
        'CPOE_ORDER',
        orderId,
        existingOrder.patient_id,
        JSON.stringify(existingOrder),
        JSON.stringify(updateRes.rows[0]),
        `Pembatalan CPOE Order [${existingOrder.order_number}]: ${cancellationReason}`,
        signatureHash,
        serverTimestamp
      ]);

      // Outbox Event
      await client.query(`
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
          cancelledBy,
          cancellationReason,
          cancelledAt: serverTimestamp.toISOString()
        }),
        'PENDING',
        correlationId,
        serverTimestamp
      ]);

      await client.query('COMMIT;');
      return updateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK;');
      if (err instanceof CpoeDomainError) throw err;
      throw new CpoeDomainError(`Gagal membatalkan order: ${err.message}`, 'CANCEL_FAILED', 500);
    } finally {
      client.release();
    }
  },

  /**
   * Get CPOE Order Details by ID with items and full aggregate
   */
  getOrderById: async (orderId) => {
    if (!orderId) {
      throw new CpoeDomainError('Order ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const orderRes = await pool.query('SELECT * FROM clinical_orders WHERE id = $1;', [orderId]);
    if (orderRes.rows.length === 0) {
      throw new CpoeDomainError(`CPOE Order dengan ID ${orderId} tidak ditemukan.`, 'ORDER_NOT_FOUND', 404);
    }

    const order = orderRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;', [orderId]);

    return {
      ...order,
      items: itemsRes.rows
    };
  },

  /**
   * Get all CPOE Orders for a specific Encounter
   */
  getOrdersByEncounterId: async (encounterId) => {
    if (!encounterId) {
      throw new CpoeDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const pool = postgresPoolService.getPool();
    const ordersRes = await pool.query(
      'SELECT * FROM clinical_orders WHERE encounter_id = $1 ORDER BY created_at DESC;',
      [encounterId]
    );

    const orders = ordersRes.rows;
    const ordersWithItems = await Promise.all(
      orders.map(async (ord) => {
        const itemsRes = await pool.query(
          'SELECT * FROM cpoe_order_items WHERE order_id = $1 ORDER BY created_at ASC;',
          [ord.id]
        );
        return {
          ...ord,
          items: itemsRes.rows
        };
      })
    );

    return ordersWithItems;
  }
};
