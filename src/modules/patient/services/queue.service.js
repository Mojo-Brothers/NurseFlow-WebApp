import { db } from '../../../core/firebase.js';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants.js';

/**
 * QueueService — Orchestrating patient flow and wait-time intelligence.
 */

export const generateQueueTicket = async (patientId, department = 'OPD') => {
  const q = query(
    collection(db, COLLECTIONS.QUEUE),
    where('department', '==', department),
    orderBy('ticket_number', 'desc'),
    limit(1)
  );
  
  const snap = await getDocs(q);
  let nextNumber = 1;
  if (!snap.empty) {
    nextNumber = (snap.docs[0].data().ticket_number || 0) + 1;
  }

  const ticketRef = await addDoc(collection(db, COLLECTIONS.QUEUE), {
    patient_id: patientId,
    department: department,
    ticket_number: nextNumber,
    ticket_code: `${department}-${nextNumber.toString().padStart(3, '0')}`,
    status: 'WAITING',
    check_in_status: 'PENDING', // PENDING | ARRIVED
    created_at: serverTimestamp(),
    estimated_wait_time: 15 // Default estimation in minutes
  });

  return { id: ticketRef.id, code: `${department}-${nextNumber.toString().padStart(3, '0')}` };
};

export const selfCheckIn = async (queueId) => {
  const ref = doc(db, COLLECTIONS.QUEUE, queueId);
  await updateDoc(ref, {
    check_in_status: 'ARRIVED',
    arrived_at: serverTimestamp()
  });
  return true;
};

export const getEstimatedWaitTime = (queuePosition) => {
  const avgServiceTime = 10; // 10 minutes average per patient
  return queuePosition * avgServiceTime;
};

export const getActiveQueue = async (department) => {
  const q = query(
    collection(db, COLLECTIONS.QUEUE),
    where('department', '==', department),
    where('status', '==', 'WAITING'),
    orderBy('ticket_number', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
