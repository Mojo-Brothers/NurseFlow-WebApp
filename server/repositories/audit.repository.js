/**
 * NurseFlow Enterprise HIS 2026 — Master Audit Repository
 * Standards: Immutable WORM Audit Trail (JCI GLD / ISO 27001)
 * Enforces: Connection discipline (requires tx / client context)
 */

import crypto from 'crypto';

export const auditRepository = {
  /**
   * Append an immutable audit entry inside an active transaction client.
   * @param {Object} tx Context with tx.query or direct pg.Client
   * @param {Object} entry Audit record payload
   */
  async append(tx, {
    actorId = 'SYSTEM',
    actorName = 'System Automated Process',
    actorRole = 'ROLE_SYSTEM',
    clientIp = '127.0.0.1',
    actionType = 'CREATE',
    resourceType,
    resourceId,
    patientId = null,
    beforeState = null,
    afterState = null,
    reason = 'Clinical transaction execution',
    signatureHash = null
  }) {
    if (!tx || typeof tx.query !== 'function') {
      throw new Error('[auditRepository] A valid transaction context (tx) with a query method is required.');
    }
    if (!resourceType || !resourceId) {
      throw new Error('[auditRepository] resourceType and resourceId are required for audit trail.');
    }

    const sig = signatureHash || crypto.createHash('sha256')
      .update(`${actorId}:${actionType}:${resourceType}:${resourceId}:${JSON.stringify(afterState || {})}`)
      .digest('hex');

    const insertQuery = `
      INSERT INTO universal_audit_logs (
        id, actor_id, actor_name, actor_role, client_ip,
        action_type, resource_type, resource_id, patient_id,
        before_state, after_state, reason_for_action, signature_hash, created_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, NOW()
      ) RETURNING id;
    `;

    const res = await tx.query(insertQuery, [
      actorId,
      actorName,
      actorRole,
      clientIp,
      actionType,
      resourceType,
      String(resourceId),
      patientId,
      beforeState ? JSON.stringify(beforeState) : null,
      afterState ? JSON.stringify(afterState) : null,
      reason,
      sig
    ]);

    return res.rows[0]?.id;
  }
};
