/**
 * NurseFlow Clinical Engine (V5)
 * ✅ Core logic for Clinical Decision Support (CDSS).
 * ✅ Deterministic, pure functions (Server-Ready).
 */

import { TRIAGE_LEVELS, ESCALATION_LEVELS } from '../constants.js';

/**
 * Calculates NEWS2 (National Early Warning Score)
 * @param {Object} vitals - { heartRate, respRate, systolicBP, spo2, temperature, consciousness }
 * @returns {number} 0-20
 */
export const calculateNEWS2 = (vitals) => {
  let score = 0;
  
  // Simple Mock NEWS2 Logic (In production, replace with full clinical table)
  if (vitals.heartRate > 110 || vitals.heartRate < 50) score += 2;
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
 * @returns {string} ESCALATION_LEVELS
 */
export const determineEscalation = (score, trends = {}) => {
  if (score >= 7 || trends.hrVelocity > 4) return ESCALATION_LEVELS.CRITICAL;
  if (score >= 5 || trends.hrVelocity > 2) return ESCALATION_LEVELS.URGENT;
  if (score >= 3) return ESCALATION_LEVELS.WATCH;
  return ESCALATION_LEVELS.NONE;
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
