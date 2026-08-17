/**
 * NurseFlow Enterprise HIS 2026 — Shared Clinical Governance & Consent Facade
 * Eliminates duplicate PFE/PFR service instances across emr & enterprise.
 */

import { pfrService } from '../modules/enterprise/services/pfr.service.js';
import { pfeService } from '../modules/enterprise/services/pfe.service.js';

export const sharedGovernanceFacadeService = {
  getPatientRights: () => pfrService.getPatientRights(),
  verifyInformedConsent: (payload) => pfrService.recordConsent(payload),
  getEducationCatalog: () => pfeService.getEducationMaterials(),
  recordPatientEducation: (payload) => pfeService.recordEducationDelivery(payload)
};
