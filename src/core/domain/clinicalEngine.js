/**
 * NurseFlow Clinical Engine (V5)
 * ✅ Core logic for Clinical Decision Support (CDSS).
 * ✅ Deterministic, pure functions (Server-Ready).
 */

import { TRIAGE_LEVELS, ESCALATION_LEVELS, ESCALATION_SOURCES } from '../constants.js';

/**
 * Calculates NEWS2 (National Early Warning Score)
 * @param {Object} vitals - { heartRate, respRate, systolicBP, spo2, temperature, consciousness }
 * @param {Object} [baseline] - Patient baseline { value, chronic_flag }
 * @returns {number} 0-20
 */
export const calculateNEWS2 = (vitals, baseline = null) => {
  let score = 0;
  
  // Adaptive HR logic: If patient is chronic/athlete, adjust threshold
  const hr = Number(vitals.heartRate);
  const restingHR = baseline?.value || 70;
  
  if (baseline?.chronic_flag) {
    // For chronic patients, we look for deviation from THEIR resting HR rather than absolute 110
    if (hr > restingHR * 1.3 || hr < restingHR * 0.7) score += 2;
  } else {
    if (hr > 110 || hr < 50) score += 2;
  }

  if (vitals.systolicBP < 90) score += 3;
  if (vitals.spo2 < 92) score += 3;
  if (vitals.temperature > 38.5 || vitals.temperature < 35.5) score += 2;
  
  return score;
};

/**
 * Calculates Clinical Velocity (Rate of Change)
 * @param {number} currentVal 
 * @param {number} lastVal 
 * @param {string} lastTimeISO 
 * @returns {number} Change per minute
 */
export const calculateVelocity = (currentVal, lastVal, lastTimeISO) => {
  if (!lastVal || !lastTimeISO) return 0;
  
  const now = new Date();
  const then = new Date(lastTimeISO);
  const diffMinutes = Math.max(1, (now - then) / (1000 * 60)); // Prevent division by zero
  
  return (currentVal - lastVal) / diffMinutes;
};

/**
 * Maps NEWS2 Score and Trend to Escalation Level
 * @param {number} score - Current NEWS2
 * @param {Object} trends - { hrVelocity, newsVelocity }
 * @param {string} [manualOverride] - Optional manual escalation source (NURSE/DOCTOR)
 * @returns {Object} { level, source }
 */
export const determineEscalation = (score, trends = {}, manualOverride = null) => {
  let level = ESCALATION_LEVELS.NONE;
  let source = ESCALATION_SOURCES.SYSTEM;

  if (manualOverride) {
    source = manualOverride; // NURSE or DOCTOR manual push
  }

  if (score >= 7 || trends.hrVelocity > 4) {
    level = ESCALATION_LEVELS.CRITICAL;
  } else if (score >= 5 || trends.hrVelocity > 2) {
    level = ESCALATION_LEVELS.URGENT;
  } else if (score >= 3) {
    level = ESCALATION_LEVELS.WATCH;
  }

  return { level, source };
};

/**
 * Normalizes a value against patient baseline
 * @param {number} value - Measured value
 * @param {number} baseline - Patient's resting/normal value
 * @returns {number} Deviation percentage
 */
export const calculateBaselineDeviation = (value, baseline) => {
  if (!baseline) return 0;
  return ((value - baseline) / baseline) * 100;
};
