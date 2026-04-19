/**
 * Dashboard Service — Masterpiece Edition 2026
 * Real-time listeners for ward metrics and clinical alerts.
 */
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * Menarik metrik bangsal secara real-time dari koleksi Encounters.
 * Kalkulasi langsung di frontend untuk reaktivitas maksimal.
 */
export const listenToWardMetrics = (wardId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS), 
    where('ward', '==', wardId), 
    where('status', '!=', 'DISCHARGED')
  );
  
  return onSnapshot(q, (snapshot) => {
    const total = snapshot.size;
    const newsScores = snapshot.docs.map(doc => doc.data().last_vitals?.news2_score || 0);
    const avgNews = newsScores.length > 0 ? (newsScores.reduce((a, b) => a + b, 0) / newsScores.length).toFixed(1) : 0;
    
    callback({
      occupancy: Math.min(Math.round((total / 20) * 100), 100), // Max 20 beds for now
      avg_news_score: parseFloat(avgNews),
      staff_on_duty: 4 // Hardcoded for simplified demo
    });
  }, (error) => {
    console.error('[DashboardService] Ward Metrics Sync Error:', error);
  });
};

export const listenToAlerts = (callback) => {
  const q = query(
    collection(db, COLLECTIONS.ENCOUNTERS), 
    where('escalation_level', 'in', ['WATCH', 'URGENT', 'CRITICAL']), 
    orderBy('last_vitals.news2_score', 'desc'),
    limit(10)
  );
  
  return onSnapshot(q, (snapshot) => {
    const counts = { total: snapshot.size, highRiskCount: 0 };
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.escalation_level === 'CRITICAL') counts.highRiskCount++;
    });
    callback(counts);
  }, (error) => {
    console.error('[DashboardService] Alerts Sync Error:', error);
  });
};
