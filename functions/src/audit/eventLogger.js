const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Universal Event Logger for EHIS 2026 (JCI Immutable Audit Trail)
exports.auditTrailLogger = functions.firestore
  .document('{collectionId}/{docId}')
  .onWrite(async (change, context) => {
    const { collectionId, docId } = context.params;

    // Only audit FHIR collections, ignore audit_events to prevent infinite loops
    if (!collectionId.startsWith('fhir_')) return null;

    const db = admin.firestore();
    const eventTime = admin.firestore.FieldValue.serverTimestamp();

    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    let action = 'UPDATE';
    if (!change.before.exists && change.after.exists) action = 'CREATE';
    if (change.before.exists && !change.after.exists) action = 'DELETE';

    // Identify actor (UID/Email) from data if available (e.g. created_by, updated_by)
    // Note: Cloud Functions triggers do not inherently contain the auth context of the user making the write.
    // In production EHIS, frontend must send `_actor_uid` or it's handled via API Gateway (BFF).
    let actorId = 'SYSTEM';
    if (afterData && afterData.updated_by) actorId = afterData.updated_by;
    else if (afterData && afterData.created_by) actorId = afterData.created_by;
    else if (beforeData && beforeData.updated_by) actorId = beforeData.updated_by;

    const auditPayload = {
      timestamp: eventTime,
      resource_type: collectionId,
      resource_id: docId,
      action: action,
      actor_id: actorId,
      delta: {
        before: beforeData,
        after: afterData
      },
      source: 'EHIS_EVENT_LOGGER_V1'
    };

    return db.collection('audit_events').add(auditPayload);
  });
