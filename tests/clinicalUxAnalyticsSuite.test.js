/**
 * NurseFlow Enterprise HIS 2026 — Clinical UX Analytics & Human Factors Test Suite
 * Standards: Human Factors Engineering (HFE), JCI Patient Safety & Primaya Hospital Trial
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clinicalUxAnalyticsService } from '../server/services/clinicalUxAnalytics.service.js';

describe('Sprint 16: Clinical UX Analytics, Cognitive Load & 30-Day Pilot Suite', () => {

  beforeEach(() => {
    clinicalUxAnalyticsService.resetStore();
  });

  // 1. Click Interaction & Heatmap Tracking
  it('1. should record user click interactions with component ID, module, and user role', () => {
    const click = clinicalUxAnalyticsService.recordClickInteraction({
      userId: 'NURSE-01',
      userRole: 'NURSE',
      moduleName: 'EMERGENCY_TRIAGE',
      componentId: 'BTN_SUBMIT_TRIAGE_ESI2',
      actionType: 'BUTTON_CLICK'
    });

    expect(click.id).toBeDefined();
    expect(click.userId).toBe('NURSE-01');
    expect(click.componentId).toBe('BTN_SUBMIT_TRIAGE_ESI2');
    expect(click.timestamp).toBeDefined();
  });

  // 2. Cognitive Load & Hesitation Dwell Time Detection
  it('2. should flag hesitation if clinical user spends more than 30 seconds on a form', () => {
    // Fast form completion (15s) -> No hesitation
    const fastEvent = clinicalUxAnalyticsService.recordDwellTime({
      userId: 'DOC-01',
      userRole: 'DOCTOR',
      moduleName: 'EMR_CPPT',
      screenName: 'SOAP_EDITOR',
      dwellTimeSeconds: 15.0
    });
    expect(fastEvent.isHesitationFlagged).toBe(false);

    // Slow form completion (45s) -> Hesitation flagged
    const slowEvent = clinicalUxAnalyticsService.recordDwellTime({
      userId: 'NURSE-02',
      userRole: 'NURSE',
      moduleName: 'MEDICATION_ADMINISTRATION',
      screenName: 'EMAR_FORM',
      dwellTimeSeconds: 45.0
    });
    expect(slowEvent.isHesitationFlagged).toBe(true);
  });

  // 3. User Error Logging & Misclicks
  it('3. should log user errors and confusion events during clinical data entry', () => {
    const errorLog = clinicalUxAnalyticsService.recordUserError({
      userId: 'CASHIER-01',
      userRole: 'CASHIER',
      moduleName: 'BILLING_PAYMENT',
      errorType: 'INVALID_PAYMENT_AMOUNT',
      errorMessage: 'Nominal pembayaran kurang dari total tagihan'
    });

    expect(errorLog.id).toBeDefined();
    expect(errorLog.errorType).toBe('INVALID_PAYMENT_AMOUNT');
  });

  // 4. 30-Day Pilot UX Audit Report
  it('4. should generate comprehensive 30-Day Pilot UX audit report with passing score >= 85', () => {
    // Record sample interactions
    for (let i = 1; i <= 20; i++) {
      clinicalUxAnalyticsService.recordClickInteraction({
        userId: `USER-${i}`,
        userRole: 'NURSE',
        moduleName: 'EMR',
        componentId: 'BTN_SAVE_VITALS'
      });
      clinicalUxAnalyticsService.recordDwellTime({
        userId: `USER-${i}`,
        userRole: 'NURSE',
        moduleName: 'EMR',
        screenName: 'VITALS_FORM',
        dwellTimeSeconds: 12.0
      });
    }

    const report = clinicalUxAnalyticsService.generate30DayPilotReport();

    expect(report.totalClicksRecorded).toBe(20);
    expect(report.hesitationEventsCount).toBe(0);
    expect(report.overallUxScore).toBeGreaterThanOrEqual(85);
    expect(report.isPilotPassingGrade).toBe(true);
  });

});
