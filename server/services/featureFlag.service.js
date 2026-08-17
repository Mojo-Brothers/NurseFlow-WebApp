/**
 * NurseFlow Enterprise HIS 2026 — Dynamic Feature Flag & Circuit Breaker Engine
 * Ensures isolated subsystem failures (e.g. PACS, SATUSEHAT) do NOT crash Core EMR.
 */

// Default System Flags
const SYSTEM_FLAGS = {
  ENABLE_SATUSEHAT: true,
  ENABLE_BSRE: true,
  ENABLE_PACS: true,
  ENABLE_BLOOD_BANK: true,
  ENABLE_CATHLAB: true,
  ENABLE_INA_CBG: true
};

export const featureFlagService = {
  /**
   * Check if a specific feature is enabled
   */
  isEnabled: (flagName) => {
    return Boolean(SYSTEM_FLAGS[flagName] ?? false);
  },

  /**
   * Dynamically toggle feature flag (e.g., during external provider outage)
   */
  setFlag: (flagName, isEnabled) => {
    SYSTEM_FLAGS[flagName] = Boolean(isEnabled);
    return { flagName, isEnabled: SYSTEM_FLAGS[flagName], timestamp: new Date().toISOString() };
  },

  /**
   * Get all active feature flags state
   */
  getAllFlags: () => {
    return { ...SYSTEM_FLAGS };
  },

  /**
   * Circuit Breaker Wrapper: Executes target action if enabled, or runs fallback safely.
   */
  executeWithGuard: async (flagName, primaryActionFn, fallbackFn) => {
    if (!featureFlagService.isEnabled(flagName)) {
      if (typeof fallbackFn === 'function') {
        return await fallbackFn({ reason: `FEATURE_DISABLED_${flagName}` });
      }
      return { skipped: true, flag: flagName, message: `Fitur ${flagName} dinonaktifkan sementara untuk menjaga stabilitas EMR inti.` };
    }

    try {
      return await primaryActionFn();
    } catch (error) {
      console.warn(`[FeatureFlagCircuitBreaker] Exception on ${flagName}. Engaging safe fallback. Error:`, error.message);
      if (typeof fallbackFn === 'function') {
        return await fallbackFn({ error: error.message });
      }
      throw error;
    }
  },

  /**
   * Reset helper for test isolation
   */
  resetFlags: () => {
    SYSTEM_FLAGS.ENABLE_SATUSEHAT = true;
    SYSTEM_FLAGS.ENABLE_BSRE = true;
    SYSTEM_FLAGS.ENABLE_PACS = true;
    SYSTEM_FLAGS.ENABLE_BLOOD_BANK = true;
    SYSTEM_FLAGS.ENABLE_CATHLAB = true;
    SYSTEM_FLAGS.ENABLE_INA_CBG = true;
  }
};
