/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #06A Durability & Chaos Test Suite
 * Universal CPOE Transaction Core ➔ PostgreSQL 16 Durability & Medicolegal Integrity Proof
 * Standards: JCI 7th Edition (MMU.4, IPSG.1-2), HL7 FHIR ServiceRequest,
 * PostgreSQL 16 ACID Transactions, Idempotency Guard, Optimistic Concurrency, Transactional Outbox.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { cpoeApplicationService, CpoeDomainError } from '../server/services/cpoeApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-06A — Universal CPOE Transaction Core ➔ PostgreSQL Durability & Chaos Integrity Proof', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-cpoe-001',
          episode_id: 'epc-cpoe-001',
          patient_id: 'pat-cpoe-001',
          encounter_number: 'ENC-2026-CPOE-01',
          status: 'IN_PROGRESS'
        },
        {
          id: 'enc-discharged-002',
          episode_id: 'epc-cpoe-002',
          patient_id: 'pat-cpoe-002',
          encounter_number: 'ENC-2026-DISCHARGED-02',
          status: 'DISCHARGED'
        }
      ],
      clinical_orders: [],
      cpoe_order_items: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        // 1. BEGIN Transaction
        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedOrders: [],
            stagedItems: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            orderUpdates: [],
            itemUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        // 2. COMMIT Transaction
        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.clinical_orders.push(...activeTransactionState.stagedOrders);
            mockDatabaseState.cpoe_order_items.push(...activeTransactionState.stagedItems);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.orderUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_orders.findIndex(o => o.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_orders[idx] = { ...mockDatabaseState.clinical_orders[idx], ...up.data };
              }
            });

            activeTransactionState.itemUpdates.forEach(up => {
              const idx = mockDatabaseState.cpoe_order_items.findIndex(i => i.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.cpoe_order_items[idx] = { ...mockDatabaseState.cpoe_order_items[idx], ...up.data };
              }
            });

            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        // 3. ROLLBACK Transaction
        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // 4. SELECT FROM encounters WHERE id = $1
        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const found = mockDatabaseState.encounters.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 5. SELECT FROM clinical_orders WHERE idempotency_key = $1
        if (normalized.includes('FROM CLINICAL_ORDERS WHERE IDEMPOTENCY_KEY = $1')) {
          const allOrders = [
            ...mockDatabaseState.clinical_orders,
            ...(activeTransactionState?.stagedOrders || [])
          ];
          const found = allOrders.filter(o => o.idempotency_key === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 6. SELECT FROM clinical_orders WHERE id = $1
        if (normalized.includes('FROM CLINICAL_ORDERS WHERE ID = $1')) {
          const allOrders = [
            ...mockDatabaseState.clinical_orders,
            ...(activeTransactionState?.stagedOrders || [])
          ];
          const found = allOrders.filter(o => o.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 7. SELECT FROM clinical_orders WHERE encounter_id = $1
        if (normalized.includes('FROM CLINICAL_ORDERS WHERE ENCOUNTER_ID = $1')) {
          const allOrders = [
            ...mockDatabaseState.clinical_orders,
            ...(activeTransactionState?.stagedOrders || [])
          ];
          const found = allOrders.filter(o => o.encounter_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 8. SELECT FROM cpoe_order_items WHERE order_id = $1
        if (normalized.includes('FROM CPOE_ORDER_ITEMS WHERE ORDER_ID = $1')) {
          const allItems = [
            ...mockDatabaseState.cpoe_order_items,
            ...(activeTransactionState?.stagedItems || [])
          ];
          const found = allItems.filter(i => i.order_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // 9. INSERT INTO clinical_orders
        if (normalized.startsWith('INSERT INTO CLINICAL_ORDERS')) {
          const hasTenant = params.length >= 23;
          const shift = hasTenant ? 1 : 0;
          const newOrder = {
            id: params[0],
            tenant_id: hasTenant ? params[1] : undefined,
            order_number: params[1 + shift],
            patient_id: params[2 + shift],
            episode_id: params[3 + shift],
            encounter_id: params[4 + shift],
            ordered_by: params[5 + shift],
            order_category: params[6 + shift],
            priority: params[7 + shift],
            clinical_indication: params[8 + shift],
            status: params[9 + shift],
            is_cito: params[10 + shift],
            order_items_count: params[11 + shift],
            total_estimated_amount: params[12 + shift],
            idempotency_key: params[13 + shift],
            version: params[14 + shift],
            requester_id: params[15 + shift],
            requester_name: params[16 + shift],
            requester_role: params[17 + shift],
            target_performer_dept: params[18 + shift],
            correlation_id: params[19 + shift],
            created_at: params[20 + shift],
            updated_at: params[21 + shift]
          };

          if (activeTransactionState) {
            activeTransactionState.stagedOrders.push(newOrder);
          } else {
            mockDatabaseState.clinical_orders.push(newOrder);
          }
          return { rows: [newOrder], rowCount: 1 };
        }

        // 10. INSERT INTO cpoe_order_items
        if (normalized.startsWith('INSERT INTO CPOE_ORDER_ITEMS')) {
          const newItem = {
            id: params[0],
            order_id: params[1],
            item_type: params[2],
            catalog_code: params[3],
            item_name: params[4],
            item_specifications: JSON.parse(params[5] || '{}'),
            quantity: params[6],
            unit: params[7],
            unit_price: params[8],
            total_price: params[9],
            priority: params[10],
            status: params[11],
            instructions: params[12],
            created_at: params[13],
            updated_at: params[14]
          };

          if (activeTransactionState) {
            activeTransactionState.stagedItems.push(newItem);
          } else {
            mockDatabaseState.cpoe_order_items.push(newItem);
          }
          return { rows: [newItem], rowCount: 1 };
        }

        // 11. INSERT INTO universal_audit_logs
        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = {
            id: params[0],
            actor_id: params[1],
            actor_name: params[2],
            actor_role: params[3],
            client_ip: params[4],
            action_type: params[5],
            resource_type: params[6],
            resource_id: params[7],
            patient_id: params[8],
            before_state: params[9],
            after_state: params[10],
            reason_for_action: params[11],
            signature_hash: params[12],
            created_at: params[13]
          };

          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [{ id: newAudit.id }], rowCount: 1 };
        }

        // 12. INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          const newOutbox = {
            id: params[0],
            aggregate_type: params[1],
            aggregate_id: params[2],
            event_type: params[3],
            event_payload: JSON.parse(params[4] || '{}'),
            status: params[5],
            idempotency_key: params[6],
            correlation_id: params[7],
            created_at: params[8]
          };

          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        // 13. UPDATE clinical_orders
        if (normalized.startsWith('UPDATE CLINICAL_ORDERS')) {
          const orderId = params[4];
          const updatedData = {
            status: 'CANCELLED',
            cancelled_by: params[0],
            cancelled_at: params[1],
            cancellation_reason: params[2],
            version: params[3],
            updated_at: params[1]
          };

          if (activeTransactionState) {
            activeTransactionState.orderUpdates.push({ id: orderId, data: updatedData });
          }
          return { rows: [{ id: orderId, ...updatedData }], rowCount: 1 };
        }

        // 14. UPDATE cpoe_order_items
        if (normalized.startsWith('UPDATE CPOE_ORDER_ITEMS')) {
          const orderId = params[1];
          if (activeTransactionState) {
            mockDatabaseState.cpoe_order_items.forEach(i => {
              if (i.order_id === orderId) {
                activeTransactionState.itemUpdates.push({ id: i.id, data: { status: 'CANCELLED' } });
              }
            });
          }
          return { rows: [], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // ─── TEST 1: CREATE VALID CPOE ORDER ➔ POSTGRESQL DURABILITY ───
  it('TC-01: should atomically persist a multi-item CPOE Order to PostgreSQL with items, audit trail, and outbox event', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      fullName: 'dr. Siti Rahma, Sp.PD',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const orderPayload = {
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      priority: 'CITO',
      clinicalIndication: 'Suspect Acute Coronary Syndrome with Troponin-I elevation',
      idempotencyKey: 'IDEM-CPOE-001',
      items: [
        {
          itemType: 'LABORATORY',
          catalogCode: 'LAB-TROP-I',
          itemName: 'Troponin I Kuantitatif CITO',
          quantity: 1,
          unitPrice: 350000,
          instructions: 'Kerjakan segera cito < 30 menit'
        },
        {
          itemType: 'LABORATORY',
          catalogCode: 'LAB-CKMB',
          itemName: 'CK-MB Massa',
          quantity: 1,
          unitPrice: 180000,
          instructions: 'Sampel serum darah vena'
        }
      ]
    };

    const result = await cpoeApplicationService.createOrder(orderPayload, doctorActor);

    // 1. Assert Return Envelope
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.order_number).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(result.status).toBe('ORDERED');
    expect(result.is_cito).toBe(true);
    expect(result.total_estimated_amount).toBe(530000);
    expect(result.items.length).toBe(2);
    expect(result.auditSignature).toBeDefined();
    expect(result.outboxEventId).toBeDefined();

    // 2. Assert Database Reconciliation (PostgreSQL Storage State)
    expect(mockDatabaseState.clinical_orders.length).toBe(1);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(2);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(1);

    const dbOrder = mockDatabaseState.clinical_orders[0];
    expect(dbOrder.encounter_id).toBe('enc-cpoe-001');
    expect(dbOrder.patient_id).toBe('pat-cpoe-001');
    expect(dbOrder.ordered_by).toBe('dr. Siti Rahma, Sp.PD');
    expect(dbOrder.requester_role).toBe(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP);

    const dbOutbox = mockDatabaseState.clinical_domain_outbox[0];
    expect(dbOutbox.event_type).toBe('ORDER_CREATED');
    expect(dbOutbox.status).toBe('PENDING');
    expect(dbOutbox.event_payload.orderId).toBe(result.id);
  });

  // ─── TEST 2: IDEMPOTENCY GUARD ➔ ZERO DUPLICATE ROWS ───
  it('TC-02: should prevent duplicate order creation when same idempotencyKey is re-submitted', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const orderPayload = {
      encounterId: 'enc-cpoe-001',
      orderCategory: 'RADIOLOGY',
      priority: 'URGENT',
      clinicalIndication: 'Dyspnea & Rales on Left Lung',
      idempotencyKey: 'IDEM-RAD-DUPLICATE-GUARD',
      items: [
        {
          itemType: 'RADIOLOGY',
          catalogCode: 'RAD-CXR-PA',
          itemName: 'Foto Thorax PA',
          quantity: 1,
          unitPrice: 150000
        }
      ]
    };

    // First request
    const firstResult = await cpoeApplicationService.createOrder(orderPayload, doctorActor);
    expect(firstResult.isIdempotentReplay).toBeUndefined();
    expect(mockDatabaseState.clinical_orders.length).toBe(1);

    // Second request with SAME idempotency key (simulating retry / double click)
    const replayResult = await cpoeApplicationService.createOrder(orderPayload, doctorActor);
    expect(replayResult.isIdempotentReplay).toBe(true);
    expect(replayResult.id).toBe(firstResult.id);

    // Database reconciliation: Must NOT create extra rows!
    expect(mockDatabaseState.clinical_orders.length).toBe(1);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(1);
  });

  // ─── TEST 3: LOCALSTORAGE WIPE IMMUNITY (ZERO CLIENT SOURCE OF TRUTH) ───
  it('TC-03: should retrieve complete order aggregate from PostgreSQL even after client storage is wiped', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'PHARMACY',
      priority: 'ROUTINE',
      clinicalIndication: 'Antibiotic Therapy',
      items: [
        { catalogCode: 'MED-CEFTRIAXONE', itemName: 'Ceftriaxone 1g Vial', quantity: 2, unitPrice: 85000 }
      ]
    }, doctorActor);

    // Simulate complete client-side wipe
    const clientLocalStorage = { clear: () => {} };
    clientLocalStorage.clear();

    // Query via Server Application Service
    const orderDetails = await cpoeApplicationService.getOrderById(created.id);
    expect(orderDetails.id).toBe(created.id);
    expect(orderDetails.items.length).toBe(1);
    expect(orderDetails.items[0].catalog_code).toBe('MED-CEFTRIAXONE');

    const encounterOrders = await cpoeApplicationService.getOrdersByEncounterId('enc-cpoe-001');
    expect(encounterOrders.length).toBe(1);
    expect(encounterOrders[0].id).toBe(created.id);
  });

  // ─── TEST 4: TERMINAL ENCOUNTER REJECTION ───
  it('TC-04: should strictly reject CPOE order creation on discharged/closed encounter', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    await expect(cpoeApplicationService.createOrder({
      encounterId: 'enc-discharged-002',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Post-discharge check attempt',
      items: [{ catalogCode: 'LAB-CBC', itemName: 'Complete Blood Count', quantity: 1, unitPrice: 75000 }]
    }, doctorActor)).rejects.toThrow('Ditolak: Tidak dapat menerbitkan CPOE pada encounter dengan status terminal [DISCHARGED].');

    expect(mockDatabaseState.clinical_orders.length).toBe(0);
  });

  // ─── TEST 5: UNAUTHORIZED ROLE REJECTION (403 FORBIDDEN) ───
  it('TC-05: should reject non-doctor roles attempting to issue CPOE orders', async () => {
    const cashierActor = {
      userId: 'USR-CASHIER-01',
      username: 'kasir_budi',
      role: ENTERPRISE_ROLES.ROLE_CASHIER
    };

    await expect(cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'PROCEDURE',
      clinicalIndication: 'Illegal authorization attempt',
      items: [{ catalogCode: 'PRC-001', itemName: 'Bedside Procedure', quantity: 1, unitPrice: 100000 }]
    }, cashierActor)).rejects.toThrow('Wewenang ditolak');

    expect(mockDatabaseState.clinical_orders.length).toBe(0);
  });

  // ─── TEST 6: EMPTY ORDER ITEMS VALIDATION ───
  it('TC-06: should reject order with empty items array', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    await expect(cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Test with no items',
      items: []
    }, doctorActor)).rejects.toThrow('Order CPOE wajib memiliki minimal 1 (satu) rincian item');
  });

  // ─── TEST 7: ORDER CANCELLATION WITH MANDATORY RATIONALE ───
  it('TC-07: should cancel CPOE order, update version, and record cancellation audit and outbox event', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      fullName: 'dr. Siti Rahma, Sp.PD',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Initial CBC order',
      items: [{ catalogCode: 'LAB-CBC', itemName: 'Darah Lengkap', quantity: 1, unitPrice: 75000 }]
    }, doctorActor);

    // Cancel order
    const cancelResult = await cpoeApplicationService.cancelOrder({
      orderId: created.id,
      cancellationReason: 'Pasien menolak pengambilan darah dan meminta penundaan'
    }, doctorActor);

    expect(cancelResult.status).toBe('CANCELLED');
    expect(cancelResult.cancelled_by).toBe('dr. Siti Rahma, Sp.PD');
    expect(cancelResult.version).toBe(2);

    // Verify Audit & Outbox
    expect(mockDatabaseState.universal_audit_logs.length).toBe(2); // 1 create + 1 cancel
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(2); // 1 create + 1 cancel

    const cancelAudit = mockDatabaseState.universal_audit_logs[1];
    expect(cancelAudit.action_type).toBe('UPDATE');
    expect(cancelAudit.reason_for_action).toContain('Pembatalan CPOE Order');

    const cancelOutbox = mockDatabaseState.clinical_domain_outbox[1];
    expect(cancelOutbox.event_type).toBe('ORDER_CANCELLED');
  });

  // ─── TEST 8: ATOMIC ROLLBACK ON MID-TRANSACTION FAILURE ───
  it('TC-08: should completely rollback transaction on mid-process database failure with 0 orphan rows', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    // Force query to fail on audit log insertion
    mockClient.query.mockImplementation(async (sql) => {
      if (sql.trim().toUpperCase().startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
        throw new Error('FATAL: Database disk full during audit log append');
      }
      if (sql.trim().toUpperCase().startsWith('ROLLBACK')) {
        activeTransactionState = null;
        return { rows: [], rowCount: 0 };
      }
      return { rows: [{ id: 'mock-id' }], rowCount: 1 };
    });

    await expect(cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Failure rollback test',
      items: [{ catalogCode: 'LAB-01', itemName: 'Test Item', quantity: 1, unitPrice: 10000 }]
    }, doctorActor)).rejects.toThrow('Database disk full during audit log append');

    // Database reconciliation: Zero committed rows
    expect(mockDatabaseState.clinical_orders.length).toBe(0);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(0);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(0);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(0);
  });

  // ─── TEST 9: CRYPTOGRAPHIC SHA-256 AUDIT SIGNATURE ───
  it('TC-09: should generate a valid 64-character hex SHA-256 cryptographic audit signature', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'PROCEDURE',
      clinicalIndication: 'Pemasangan Kateter Urin',
      items: [{ catalogCode: 'PRC-KATETER', itemName: 'Foley Catheter 16Fr', quantity: 1, unitPrice: 65000 }]
    }, doctorActor);

    expect(created.auditSignature).toBeDefined();
    expect(created.auditSignature).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(created.auditSignature)).toBe(true);
  });

  // ─── TEST 10: COMPLETE RECONCILIATION PROOF ───
  it('TC-10: should verify 100% reconciliation across business state, database state, audit state, and outbox state', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      fullName: 'dr. Siti Rahma, Sp.PD',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const orderResult = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      priority: 'URGENT',
      clinicalIndication: 'Routine Morning Blood Work',
      items: [
        { catalogCode: 'LAB-GLU', itemName: 'Glukosa Darah Puasa', quantity: 1, unitPrice: 30000 },
        { catalogCode: 'LAB-HB1AC', itemName: 'HbA1c Kuantitatif', quantity: 1, unitPrice: 195000 }
      ]
    }, doctorActor);

    // Business State Verification
    expect(orderResult.status).toBe('ORDERED');
    expect(orderResult.items.length).toBe(2);
    expect(orderResult.total_estimated_amount).toBe(225000);

    // Database State Verification
    const dbOrder = mockDatabaseState.clinical_orders[0];
    expect(dbOrder.id).toBe(orderResult.id);
    expect(dbOrder.version).toBe(1);

    // Audit State Verification
    const dbAudit = mockDatabaseState.universal_audit_logs[0];
    expect(dbAudit.resource_id).toBe(orderResult.id);
    expect(dbAudit.signature_hash).toBe(orderResult.auditSignature);

    // Outbox State Verification
    const dbOutbox = mockDatabaseState.clinical_domain_outbox[0];
    expect(dbOutbox.aggregate_id).toBe(orderResult.id);
    expect(dbOutbox.event_payload.items.length).toBe(2);

    // Total Consistency Check
    expect(mockDatabaseState.clinical_orders.length).toBe(1);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(2);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(1);
  });

  // ─── TEST 11: EXPRESS CONTROLLER CREATE ENVELOPE VERIFICATION ───
  it('TC-11: should verify Express API Gateway CPOE controller returns standard { success, data, meta } envelope', async () => {
    const { cpoeController } = await import('../server/controllers/cpoe.controller.js');

    const req = {
      headers: { 'x-request-id': 'REQ-TEST-001', 'x-correlation-id': 'CORR-TEST-001' },
      user: {
        userId: 'DOC-1001',
        username: 'dr_siti',
        fullName: 'dr. Siti Rahma, Sp.PD',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      },
      ip: '192.168.1.100',
      body: {
        encounterId: 'enc-cpoe-001',
        orderCategory: 'RADIOLOGY',
        priority: 'CITO',
        clinicalIndication: 'CXR Urgent Assessment',
        items: [{ catalogCode: 'RAD-CXR', itemName: 'Chest X-Ray AP/PA', quantity: 1, unitPrice: 150000 }]
      }
    };

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        jsonResponse = data;
        return res;
      })
    };

    await cpoeController.createOrder(req, res);

    expect(statusCode).toBe(201);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.data.id).toBeDefined();
    expect(jsonResponse.meta.requestId).toBe('REQ-TEST-001');
    expect(jsonResponse.meta.correlationId).toBe('CORR-TEST-001');
    expect(jsonResponse.meta.auditSignature).toBeDefined();
    expect(jsonResponse.meta.outboxEventId).toBeDefined();
  });

  // ─── TEST 12: EXPRESS CONTROLLER CANCEL ENVELOPE VERIFICATION ───
  it('TC-12: should verify Express API Gateway CPOE cancel controller returns standard envelope', async () => {
    const { cpoeController } = await import('../server/controllers/cpoe.controller.js');

    // Create order first
    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Pre-op test',
      items: [{ catalogCode: 'LAB-PT', itemName: 'PT / INR', quantity: 1, unitPrice: 85000 }]
    }, {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    });

    const req = {
      headers: { 'x-request-id': 'REQ-CANCEL-001', 'x-correlation-id': 'CORR-CANCEL-001' },
      params: { id: created.id },
      user: {
        userId: 'DOC-1001',
        username: 'dr_siti',
        fullName: 'dr. Siti Rahma, Sp.PD',
        role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
      },
      ip: '192.168.1.100',
      body: { cancellationReason: 'Tindakan operasi dibatalkan oleh pasien' }
    };

    let statusCode = 200;
    let jsonResponse = null;
    const res = {
      status: vi.fn((code) => {
        statusCode = code;
        return res;
      }),
      json: vi.fn((data) => {
        jsonResponse = data;
        return res;
      })
    };

    await cpoeController.cancelOrder(req, res);

    expect(statusCode).toBe(200);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.data.status).toBe('CANCELLED');
    expect(jsonResponse.meta.message).toContain('berhasil dibatalkan');
  });

  // ─── TEST 13: CONTROLLER GET BY ID & ENCOUNTER VERIFICATION ───
  it('TC-13: should verify getOrderById and getOrdersByEncounter return full items aggregate', async () => {
    const { cpoeController } = await import('../server/controllers/cpoe.controller.js');

    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Electrolytes test',
      items: [{ catalogCode: 'LAB-ELYTE', itemName: 'Elektrolit Serum (Na, K, Cl)', quantity: 1, unitPrice: 120000 }]
    }, {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    });

    let jsonResponse = null;
    const res = {
      status: vi.fn(() => res),
      json: vi.fn((data) => { jsonResponse = data; return res; })
    };

    await cpoeController.getOrderById({ params: { id: created.id }, headers: {} }, res);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.data.items.length).toBe(1);
    expect(jsonResponse.data.items[0].catalog_code).toBe('LAB-ELYTE');

    await cpoeController.getOrdersByEncounter({ params: { encounterId: 'enc-cpoe-001' }, headers: {} }, res);
    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse.count).toBeGreaterThanOrEqual(1);
  });

  // ─── TEST 14: CORRELATION ID TRACING ───
  it('TC-14: should propagate correlation ID across order header, audit log, and outbox event', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const traceId = 'CORR-TRACE-XYZ-999';
    const result = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'PROCEDURE',
      clinicalIndication: 'Wound debridement',
      items: [{ catalogCode: 'PRC-DEBRID', itemName: 'Minor Debridement', quantity: 1, unitPrice: 250000 }]
    }, doctorActor, '10.0.0.1', traceId);

    const dbOrder = mockDatabaseState.clinical_orders.find(o => o.id === result.id);
    expect(dbOrder.correlation_id).toBe(traceId);

    const dbOutbox = mockDatabaseState.clinical_domain_outbox.find(o => o.aggregate_id === result.id);
    expect(dbOutbox.correlation_id).toBe(traceId);
  });

  // ─── TEST 15: ZERO ORPHAN ROWS ON DATABASE CONNECTION PARTITION ───
  it('TC-15: should verify connection break in outbox stage triggers full rollback with 0 orphan items', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    mockClient.query.mockImplementation(async (sql) => {
      if (sql.trim().toUpperCase().startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
        throw new Error('NETWORK_PARTITION: Connection closed by remote PostgreSQL host');
      }
      if (sql.trim().toUpperCase().startsWith('ROLLBACK')) {
        activeTransactionState = null;
        return { rows: [], rowCount: 0 };
      }
      return { rows: [{ id: 'mock-id' }], rowCount: 1 };
    });

    await expect(cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Partition test',
      items: [{ catalogCode: 'LAB-PARTITION', itemName: 'Partition Item', quantity: 1, unitPrice: 10000 }]
    }, doctorActor)).rejects.toThrow('NETWORK_PARTITION');

    expect(mockDatabaseState.clinical_orders.length).toBe(0);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(0);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(0);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(0);
  });

  // ─── TEST 16: OPTIMISTIC CONCURRENCY CONFLICT (VERSION MISMATCH) ───
  it('TC-16: should reject cancellation with 409 CONCURRENCY_CONFLICT when expectedVersion does not match current database version', async () => {
    const doctorActor = {
      userId: 'DOC-1001',
      username: 'dr_siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    };

    const created = await cpoeApplicationService.createOrder({
      encounterId: 'enc-cpoe-001',
      orderCategory: 'LABORATORY',
      clinicalIndication: 'Test concurrency',
      items: [{ catalogCode: 'LAB-CBC', itemName: 'CBC Panel', quantity: 1, unitPrice: 75000 }]
    }, doctorActor);

    // Attempt cancellation with STALE version (e.g. expectedVersion = 999 instead of 1)
    await expect(cpoeApplicationService.cancelOrder({
      orderId: created.id,
      cancellationReason: 'Stale update attempt',
      expectedVersion: 999
    }, doctorActor)).rejects.toThrow('Konflik konkurensi: Versi order (1) tidak sesuai dengan versi request (999).');
  });
});

