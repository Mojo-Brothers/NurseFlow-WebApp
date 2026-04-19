/**
 * NurseFlow Audit Verifier (V5)
 * Run this to check the health of clinical audit logs.
 */
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './src/core/firebase.js';

async function checkAuditLogs() {
  console.log("🔍 Fetching V5 Audit Logs...");
  try {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.log("⚠️ No audit logs found. Ensure you have performed some actions (Register/Admit/Triage).");
      return;
    }

    snap.docs.forEach(doc => {
      const data = doc.data();
      console.log(`[${data.timestamp?.toDate().toISOString() || 'PENDING'}]`);
      console.log(`- User:    ${data.user}`);
      console.log(`- Action:  ${data.action} on ${data.resource_type}`);
      console.log(`- Reason:  ${data.reason}`);
      console.log(`- Source:  ${data.source}`);
      console.log(`- SyncPri: ${data.sync_priority}`);
      console.log(`- Delta:   ${JSON.stringify(data.delta)}`);
      console.log("------------------------------------------");
    });
  } catch (err) {
    console.error("❌ Failed to fetch logs:", err);
  }
}

checkAuditLogs();
