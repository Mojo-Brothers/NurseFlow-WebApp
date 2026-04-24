import { db } from '../../../core/firebase.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { COLLECTIONS, AUDIT_ACTIONS } from '../../../core/constants.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';

/**
 * GLD Service — The Corporate Governance Engine.
 * Handles Executive KPIs and Institutional Risk Management.
 */

/**
 * Fetch Executive level KPIs for the dashboard.
 * Aggregates data from multiple sources to provide a strategic view.
 */
export const getExecutiveKPIs = async () => {
  try {
    // 1. Get BOR (Bed Occupancy Rate)
    const bedsSnap = await getDocs(collection(db, COLLECTIONS.BEDS));
    const totalBeds = bedsSnap.size || 100; // Fallback to 100 if empty
    const occupiedBeds = bedsSnap.docs.filter(d => d.data().status === 'OCCUPIED').length;
    const bor = (occupiedBeds / totalBeds) * 100;

    // 2. Get Recent Incidents count (Safety Metric)
    const incidentsSnap = await getDocs(
      query(collection(db, COLLECTIONS.INCIDENTS), limit(100))
    );
    const incidentCount = incidentsSnap.size;

    // 3. Get Revenue (Simulated from Billing)
    const billingSnap = await getDocs(collection(db, COLLECTIONS.BILLING));
    const totalRevenue = billingSnap.docs.reduce((acc, curr) => acc + (curr.data().totalAmount || 0), 0);

    // 4. Patient Satisfaction (Simulated)
    const satisfaction = 4.8; // Target 5.0

    return {
      bor: bor.toFixed(1),
      incidentCount,
      totalRevenue: totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      satisfaction,
      alos: '3.2', // Average Length of Stay
      safetyCompliance: '96%'
    };
  } catch (error) {
    console.error('[GLDService] Error fetching Executive KPIs:', error);
    throw error;
  }
};

/**
 * Report a new institutional incident (Risk Management).
 * @param {Object} incidentData - { type, description, location, severity, reporterRole }
 */
export const reportIncident = async (incidentData, userEmail) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.INCIDENTS), {
      ...incidentData,
      reporterEmail: userEmail,
      timestamp: serverTimestamp(),
      status: 'OPEN',
      investigationLog: []
    });

    // JCI Requirement: Every incident MUST be audited
    await createAuditLog({
      userEmail,
      action: AUDIT_ACTIONS.CREATE,
      resourceType: 'incident',
      resourceId: docRef.id,
      delta: incidentData
    });

    return docRef.id;
  } catch (error) {
    console.error('[GLDService] Error reporting incident:', error);
    throw error;
  }
};

/**
 * Get recent incidents for the executive dashboard list.
 */
export const getRecentIncidents = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INCIDENTS),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[GLDService] Error fetching recent incidents:', error);
    return [];
  }
};
