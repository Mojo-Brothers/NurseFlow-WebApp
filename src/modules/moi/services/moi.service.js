import { db } from '../../../core/firebase.js';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * MOI Service — Management of Information (Fase 34).
 * Ensures data standardization and lifecycle governance.
 */

// JCI Official List of Forbidden Abbreviations (MOI.2)
const FORBIDDEN_ABBREVIATIONS = [
  { term: 'U', replacement: 'Unit', reason: 'Mistaken for 0 or 4' },
  { term: 'IU', replacement: 'International Unit', reason: 'Mistaken for IV' },
  { term: 'QD', replacement: 'Every Day', reason: 'Mistaken for QID' },
  { term: 'QOD', replacement: 'Every Other Day', reason: 'Mistaken for QD or QID' },
  { term: 'MS', replacement: 'Morphine Sulfate', reason: 'Confusing' },
  { term: 'MSO4', replacement: 'Morphine Sulfate', reason: 'Confusing' },
  { term: 'MgSO4', replacement: 'Magnesium Sulfate', reason: 'Confusing' },
  { term: '.5mg', replacement: '0.5mg', reason: 'Missing leading zero' },
  { term: '5.0mg', replacement: '5mg', reason: 'Trailing zero risk' }
];

/**
 * Validate clinical text for forbidden abbreviations.
 * @param {string} text - The clinical note to scan.
 */
export const validateClinicalTerms = (text) => {
  if (!text) return [];
  
  const findings = [];
  FORBIDDEN_ABBREVIATIONS.forEach(({ term, replacement, reason }) => {
    // Regex to match term as whole word or specific patterns
    const regex = new RegExp(`\\b${term.replace('.', '\\.')}\\b`, 'gi');
    if (regex.test(text)) {
      findings.push({ term, replacement, reason });
    }
  });

  return findings;
};

/**
 * Calculate data retention period (JCI MOI.10).
 * Standard: 10 years for general, 25 years for specific cases (pediatrics/oncology).
 */
export const getRetentionStatus = (encounterDate, patientType = 'GENERAL') => {
  const years = patientType === 'GENERAL' ? 10 : 25;
  const expiryDate = new Date(encounterDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + years);
  
  const now = new Date();
  const isExpired = now > expiryDate;
  
  return {
    retentionYears: years,
    expiryDate: expiryDate.toISOString(),
    isExpired,
    daysUntilDestruction: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
  };
};

/**
 * Log a terminology compliance failure.
 */
export const logTerminologyViolation = async (userEmail, encounterId, findings) => {
  try {
    await createAuditLog({
      userEmail,
      action: AUDIT_ACTIONS.TERMINOLOGY_AUDIT,
      resourceType: 'clinical_note',
      resourceId: encounterId,
      delta: { violations: findings }
    });
  } catch (error) {
    console.error('[MOIService] Error logging violation:', error);
  }
};

/**
 * Fetch information governance settings.
 */
export const getGovernanceSettings = async () => {
  try {
    const docRef = doc(db, COLLECTIONS.INFO_GOVERNANCE, 'settings');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : { 
       retentionPolicy: '10_YEARS_STANDARD',
       standardTerminology: 'ICD-10-CM',
       dataEncryption: 'AES-256-GCM'
    };
  } catch (error) {
    console.error('[MOIService] Error fetching settings:', error);
    return null;
  }
};
