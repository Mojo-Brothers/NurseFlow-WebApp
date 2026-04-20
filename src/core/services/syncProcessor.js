import { submitTriage } from '../../modules/triage/services/triage.service.js';
import { SCHEMA_VERSION } from '../constants.js';

/**
 * Version Sentry: Ensures the system doesn't process "future" data after a rollback.
 */
const validateSchema = (action) => {
  if (action.schema_version && action.schema_version > SCHEMA_VERSION) {
    throw new Error(`[SyncProcessor] Schema Mismatch! Item v${action.schema_version} blocked by System v${SCHEMA_VERSION}. Rollback guard active.`);
  }
};

export const executeQueuedAction = async (action) => {
  validateSchema(action);
  console.log(`[SyncProcessor] Executing: ${action.type} (v${action.schema_version || 'unknown'})`);
  
  switch (action.type) {
    case 'SUBMIT_TRIAGE':
      return await submitTriage(action);
      
    default:
      throw new Error(`Unknown action type in queue: ${action.type}`);
  }
};
