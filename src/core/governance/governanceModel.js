/**
 * NurseFlow Enterprise HIS 2026 — Master Governance & Evidence Data Model
 * Canonical statuses, entity schemas, and conservative status resolution rules.
 */

export const GOVERNANCE_STATUSES = Object.freeze({
  NOT_STARTED: 'NOT_STARTED',
  DISCOVERY: 'DISCOVERY',
  DESIGNED: 'DESIGNED',
  DESIGNED_ONLY: 'DESIGNED_ONLY',
  IMPLEMENTED: 'IMPLEMENTED',
  IMPLEMENTED_UNVERIFIED: 'IMPLEMENTED_UNVERIFIED',
  TESTED: 'TESTED',
  VERIFIED: 'VERIFIED',
  RATIFIED: 'RATIFIED',
  BLOCKED: 'BLOCKED',
  HOLD: 'HOLD',
  REFUTED: 'REFUTED',
  PARTIAL: 'PARTIAL',
  UNKNOWN: 'UNKNOWN',
  DEPRECATED: 'DEPRECATED'
});

export const STATUS_COLORS = Object.freeze({
  [GOVERNANCE_STATUSES.VERIFIED]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  [GOVERNANCE_STATUSES.RATIFIED]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  [GOVERNANCE_STATUSES.COMPLETE]: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500'
  },
  [GOVERNANCE_STATUSES.IMPLEMENTED]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500'
  },
  [GOVERNANCE_STATUSES.TESTED]: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500'
  },
  [GOVERNANCE_STATUSES.DESIGNED]: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500'
  },
  [GOVERNANCE_STATUSES.DESIGNED_ONLY]: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500'
  },
  [GOVERNANCE_STATUSES.PARTIAL]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500'
  },
  [GOVERNANCE_STATUSES.IMPLEMENTED_UNVERIFIED]: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500'
  },
  [GOVERNANCE_STATUSES.HOLD]: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500'
  },
  [GOVERNANCE_STATUSES.BLOCKED]: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500'
  },
  [GOVERNANCE_STATUSES.REFUTED]: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-600'
  },
  [GOVERNANCE_STATUSES.NOT_STARTED]: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500'
  },
  [GOVERNANCE_STATUSES.UNKNOWN]: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500'
  }
});

export const SEVERITY_LEVELS = Object.freeze({
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
});

export const SEVERITY_COLORS = Object.freeze({
  [SEVERITY_LEVELS.CRITICAL]: {
    bg: 'bg-rose-600 text-white',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    border: 'border-rose-600'
  },
  [SEVERITY_LEVELS.HIGH]: {
    bg: 'bg-orange-500 text-white',
    badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    border: 'border-orange-500'
  },
  [SEVERITY_LEVELS.MEDIUM]: {
    bg: 'bg-amber-500 text-white',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    border: 'border-amber-500'
  },
  [SEVERITY_LEVELS.LOW]: {
    bg: 'bg-blue-500 text-white',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    border: 'border-blue-500'
  },
  [SEVERITY_LEVELS.INFO]: {
    bg: 'bg-slate-500 text-white',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    border: 'border-slate-500'
  }
});

/**
 * Conservative status resolver: If evidence is contradictory,
 * demote to CONTRADICTED / UNVERIFIED / BLOCKED, never COMPLETE.
 */
export function resolveConservativeStatus({ claimStatus, actualExecution, testVerified }) {
  if (claimStatus === 'IMPLEMENTED' && !actualExecution) {
    return {
      status: GOVERNANCE_STATUSES.REFUTED,
      flag: 'CONTRADICTION_DETECTED',
      reason: 'Claimed implemented in documentation, but physical execution or route mounting is absent.'
    };
  }
  if (claimStatus === 'DESIGNED' && !actualExecution) {
    return {
      status: GOVERNANCE_STATUSES.DESIGNED_ONLY,
      flag: 'DESIGNED_ONLY',
      reason: 'Architecture specification exists, but physical implementation code is absent.'
    };
  }
  if (actualExecution && !testVerified) {
    return {
      status: GOVERNANCE_STATUSES.IMPLEMENTED_UNVERIFIED,
      flag: 'UNVERIFIED',
      reason: 'Component code exists, but automated tests or empirical proofs are missing.'
    };
  }
  if (actualExecution && testVerified) {
    return {
      status: GOVERNANCE_STATUSES.VERIFIED,
      flag: 'VERIFIED',
      reason: 'Component code exists and verified with empirical test evidence.'
    };
  }
  return {
    status: GOVERNANCE_STATUSES.UNKNOWN,
    flag: 'UNKNOWN',
    reason: 'Insufficient evidence to establish state.'
  };
}
