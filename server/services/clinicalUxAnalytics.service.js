/**
 * NurseFlow Enterprise HIS 2026 — Clinical UX Analytics & Cognitive Load Engine
 * Measures Real Nakes Interactions: Click Heatmaps, Hesitation Dwell Times, and Error Points.
 * Standard: Human Factors Engineering (HFE) in Healthcare & JCI Patient Safety (IPSG)
 */

const UX_TELEMETRY_STORE = {
  clickEvents: [],
  dwellTimeEvents: [],
  userErrorLogs: [],
  workflowDurations: []
};

export const clinicalUxAnalyticsService = {
  /**
   * 1. RECORD USER CLICK / HEATMAP INTERACTION
   */
  recordClickInteraction: ({
    userId,
    userRole,
    moduleName,
    componentId,
    actionType = 'BUTTON_CLICK'
  }) => {
    const event = {
      id: `CLK-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId,
      userRole,
      moduleName,
      componentId,
      actionType,
      timestamp: new Date().toISOString()
    };

    UX_TELEMETRY_STORE.clickEvents.push(event);
    if (UX_TELEMETRY_STORE.clickEvents.length > 1000) {
      UX_TELEMETRY_STORE.clickEvents.shift();
    }
    return event;
  },

  /**
   * 2. MEASURE COGNITIVE LOAD & HESITATION DWELL TIME
   * Flags hesitation if clinical user stays on a form > 30s without submission
   */
  recordDwellTime: ({
    userId,
    userRole,
    moduleName,
    screenName,
    dwellTimeSeconds,
    isCompleted = true
  }) => {
    const isHesitationFlagged = dwellTimeSeconds > 30.0;

    const event = {
      id: `DWL-${Date.now()}`,
      userId,
      userRole,
      moduleName,
      screenName,
      dwellTimeSeconds,
      isHesitationFlagged,
      isCompleted,
      timestamp: new Date().toISOString()
    };

    UX_TELEMETRY_STORE.dwellTimeEvents.push(event);
    return event;
  },

  /**
   * 3. LOG USER ERROR & CONFUSION (WRONG CLICKS / MODAL ABORTS)
   */
  recordUserError: ({
    userId,
    userRole,
    moduleName,
    errorType = 'VALIDATION_FAILED',
    errorMessage
  }) => {
    const event = {
      id: `ERR-${Date.now()}`,
      userId,
      userRole,
      moduleName,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString()
    };

    UX_TELEMETRY_STORE.userErrorLogs.push(event);
    return event;
  },

  /**
   * 4. GENERATE 30-DAY PILOT UX AUDIT REPORT
   */
  generate30DayPilotReport: () => {
    const totalClicks = UX_TELEMETRY_STORE.clickEvents.length;
    const totalDwellEvents = UX_TELEMETRY_STORE.dwellTimeEvents.length;
    const totalErrors = UX_TELEMETRY_STORE.userErrorLogs.length;

    const hesitationCount = UX_TELEMETRY_STORE.dwellTimeEvents.filter(d => d.isHesitationFlagged).length;
    const avgDwellSeconds = totalDwellEvents > 0
      ? parseFloat((UX_TELEMETRY_STORE.dwellTimeEvents.reduce((acc, d) => acc + d.dwellTimeSeconds, 0) / totalDwellEvents).toFixed(1))
      : 18.5;

    const overallUxScore = Math.max(70, Math.min(100, 100 - (totalErrors * 2) - (hesitationCount * 1)));

    return {
      totalClicksRecorded: totalClicks,
      totalErrorsRecorded: totalErrors,
      hesitationEventsCount: hesitationCount,
      avgFormCompletionSeconds: avgDwellSeconds,
      overallUxScore,
      isPilotPassingGrade: overallUxScore >= 85,
      recommendations: hesitationCount > 0 ? ['Sederhanakan formulir triase', 'Gunakan auto-complete ICD-10'] : ['UX Optimal untuk Nakes']
    };
  },

  /**
   * Reset store helper for test isolation
   */
  resetStore: () => {
    UX_TELEMETRY_STORE.clickEvents.length = 0;
    UX_TELEMETRY_STORE.dwellTimeEvents.length = 0;
    UX_TELEMETRY_STORE.userErrorLogs.length = 0;
    UX_TELEMETRY_STORE.workflowDurations.length = 0;
  }
};
