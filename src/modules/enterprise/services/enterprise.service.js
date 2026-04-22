import { db } from '../../../core/firebase.js';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * EnterpriseService — Scalable orchestration for hospital networks.
 */

export const getFacilities = async () => {
  const snap = await getDocs(collection(db, COLLECTIONS.FACILITIES));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getFacilityConfig = async (facilityId) => {
  const ref = doc(db, COLLECTIONS.FACILITIES, facilityId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

/**
 * Aggregated Performance: Fetches high-level metrics from all facilities.
 */
export const getGroupPerformance = async () => {
  // Simulated aggregation logic for Enterprise Dashboard
  return [
    { id: 'f1', name: 'NurseFlow Central', bor: 82, revenue: 'RP 2.4M', status: 'STABLE' },
    { id: 'f2', name: 'NurseFlow West', bor: 45, revenue: 'RP 1.1M', status: 'LOW_VOLUME' },
    { id: 'f3', name: 'NurseFlow South', bor: 94, revenue: 'RP 3.8M', status: 'CRITICAL_LOAD' },
  ];
};

export const switchFacilityContext = (facilityId) => {
  localStorage.setItem('active_facility_id', facilityId);
  window.location.reload(); // Hard reset for context safety
};
