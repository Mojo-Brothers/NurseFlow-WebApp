/**
 * NurseFlow — Sync Processor (Enterprise Resilience Hub)
 * Maps queued action types to their actual service handlers.
 */
import { submitTriage } from '../modules/triage/services/triage.service.js';
// In the future, other services like submitSoap atau createMedication will be added here

export const executeQueuedAction = async (action) => {
  console.log(`[SyncProcessor] Executing: ${action.type}`);
  
  switch (action.type) {
    case 'SUBMIT_TRIAGE':
      return await submitTriage(action);
      
    default:
      throw new Error(`Unknown action type in queue: ${action.type}`);
  }
};
