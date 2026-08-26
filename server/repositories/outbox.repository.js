/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Domain Outbox Repository
 * Standards: Transactional Outbox Pattern & Atomic Creation of Intent
 * Enforces: Connection discipline (requires tx / client context)
 */

export const outboxRepository = {
  /**
   * Enqueue a domain event to clinical_domain_outbox inside an active transaction.
   * @param {Object} tx Context with tx.query or direct pg.Client
   * @param {Object} event Event payload
   */
  async enqueue(tx, {
    aggregateType = 'CLINICAL_AGGREGATE',
    aggregateId,
    eventType,
    eventPayload = {},
    idempotencyKey = null,
    correlationId = null
  }) {
    if (!tx || typeof tx.query !== 'function') {
      throw new Error('[outboxRepository] A valid transaction context (tx) with a query method is required.');
    }
    if (!aggregateId || !eventType) {
      throw new Error('[outboxRepository] aggregateId and eventType are required for outbox events.');
    }

    const resolvedCorrelationId = correlationId || tx.correlationId || `CORR-OUTBOX-${Date.now()}`;

    const insertQuery = `
      INSERT INTO clinical_domain_outbox (
        id, aggregate_type, aggregate_id, event_type, event_payload,
        status, retry_count, max_retries, idempotency_key, correlation_id, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4,
        'PENDING', 0, 5, $5, $6, NOW()
      ) RETURNING id, status, created_at;
    `;

    const res = await tx.query(insertQuery, [
      aggregateType,
      String(aggregateId),
      eventType,
      JSON.stringify(eventPayload),
      idempotencyKey,
      resolvedCorrelationId
    ]);

    return res.rows[0];
  }
};
